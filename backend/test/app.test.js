const { test } = require('node:test');
const assert = require('node:assert');
const { once } = require('node:events');
const { randomUUID } = require('node:crypto');
const app = require('../src/app');
const documentRepository = require('../src/repositories/document.repository');

async function startServer(t) {
  const server = app.listen(0);
  await once(server, 'listening');
  server.closeAllConnections();

  t.after(() => new Promise((resolve) => {
    server.close(() => resolve());
  }));

  return `http://127.0.0.1:${server.address().port}`;
}

// Teste de fumaça do seed: garante que o app Express foi exportado.
// Novos testes serão adicionados durante os Steps 2, 6 e 7 com auxílio do Copilot.
test('o app backend é exportado', () => {
  assert.ok(app, 'o app deve estar definido');
  assert.strictEqual(typeof app, 'function', 'o app Express deve ser uma função');
});

test('upload, listagem e download respeitam o usuário dono', async (t) => {
  const baseUrl = await startServer(t);
  const owner = randomUUID();
  const fileContent = 'conteudo de teste';
  let documentId;

  t.after(async () => {
    if (documentId) {
      await documentRepository.remove(documentId);
    }
  });

  const formData = new FormData();
  formData.append('file', new Blob([fileContent], { type: 'text/plain' }), 'sample.txt');

  const uploadResponse = await fetch(`${baseUrl}/upload`, {
    method: 'POST',
    headers: { 'X-User-ID': owner },
    body: formData,
  });

  assert.strictEqual(uploadResponse.status, 201);
  const document = await uploadResponse.json();
  documentId = document.id;
  assert.deepStrictEqual(Object.keys(document).sort(), [
    'id',
    'originalName',
    'owner',
    'size',
    'uploadedAt',
  ]);
  assert.strictEqual(document.originalName, 'sample.txt');
  assert.strictEqual(document.size, Buffer.byteLength(fileContent));
  assert.strictEqual(document.owner, owner);

  const listResponse = await fetch(`${baseUrl}/documents`, {
    headers: { 'X-User-ID': owner },
  });
  assert.strictEqual(listResponse.status, 200);
  assert.deepStrictEqual((await listResponse.json()).documents, [document]);

  const otherUserResponse = await fetch(`${baseUrl}/documents`, {
    headers: { 'X-User-ID': randomUUID() },
  });
  assert.deepStrictEqual((await otherUserResponse.json()).documents, []);

  const downloadResponse = await fetch(`${baseUrl}/documents/${documentId}/download`, {
    headers: { 'X-User-ID': owner },
  });
  assert.strictEqual(downloadResponse.status, 200);
  assert.strictEqual(await downloadResponse.text(), fileContent);
  assert.match(downloadResponse.headers.get('content-disposition'), /attachment/);
  assert.strictEqual(downloadResponse.headers.get('x-content-type-options'), 'nosniff');

  const forbiddenDownloadResponse = await fetch(`${baseUrl}/documents/${documentId}/download`, {
    headers: { 'X-User-ID': randomUUID() },
  });
  assert.strictEqual(forbiddenDownloadResponse.status, 404);
  assert.strictEqual((await forbiddenDownloadResponse.json()).error.code, 'DOCUMENT_NOT_FOUND');
});

test('rotas de documentos exigem X-User-ID', async (t) => {
  const baseUrl = await startServer(t);
  const response = await fetch(`${baseUrl}/documents`);

  assert.strictEqual(response.status, 400);
  assert.strictEqual((await response.json()).error.code, 'USER_ID_REQUIRED');
});

test('upload rejeita requisições que não sejam multipart/form-data', async (t) => {
  const baseUrl = await startServer(t);
  const response = await fetch(`${baseUrl}/upload`, {
    method: 'POST',
    headers: {
      'X-User-ID': randomUUID(),
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ file: 'sample.txt' }),
  });

  assert.strictEqual(response.status, 415);
  assert.strictEqual((await response.json()).error.code, 'MULTIPART_REQUIRED');
});
