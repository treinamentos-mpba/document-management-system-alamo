const fs = require('node:fs/promises');
const path = require('node:path');
const AppError = require('../errors');
const documentRepository = require('../repositories/documentRepository');

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function getSafeOriginalName(originalName) {
  const fileName = path.basename(String(originalName).replace(/\\/g, '/'))
    .replace(/[\u0000-\u001f\u007f]/g, '')
    .trim();

  return fileName && fileName !== '.' && fileName !== '..' ? fileName : 'document';
}

async function createDocument(file, owner, id) {
  const document = {
    id,
    originalName: getSafeOriginalName(file.originalname),
    size: file.size,
    uploadedAt: new Date().toISOString(),
    owner,
    storageName: file.filename,
    mimeType: file.mimetype || 'application/octet-stream',
  };

  try {
    return documentRepository.add(document);
  } catch (error) {
    await documentRepository.removeStoredFile(file.filename).catch(() => {});
    throw new AppError(500, 'UPLOAD_FAILED', 'Não foi possível registrar o documento.');
  }
}

async function listDocuments(owner) {
  return documentRepository.listByOwner(owner);
}

async function getDownload(id, owner) {
  if (!UUID_PATTERN.test(id)) {
    throw new AppError(400, 'INVALID_DOCUMENT_ID', 'O identificador do documento é inválido.');
  }

  const document = documentRepository.findById(id);
  if (!document || document.owner !== owner) {
    throw new AppError(404, 'DOCUMENT_NOT_FOUND', 'Documento não encontrado.');
  }

  const storagePath = documentRepository.getStoragePath(document.storageName);

  try {
    await fs.access(storagePath);
  } catch (error) {
    if (error.code === 'ENOENT') {
      throw new AppError(404, 'DOCUMENT_NOT_FOUND', 'Documento não encontrado.');
    }

    throw new AppError(500, 'DOWNLOAD_FAILED', 'Não foi possível ler o documento.');
  }

  return { ...document, storagePath };
}

module.exports = {
  createDocument,
  listDocuments,
  getDownload,
};