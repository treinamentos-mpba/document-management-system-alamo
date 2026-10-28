const fs = require('node:fs/promises');
const path = require('node:path');

const documents = new Map();
const storageDirectory = path.resolve(__dirname, '../../storage');

function toPublicDocument(document) {
  return {
    id: document.id,
    originalName: document.originalName,
    size: document.size,
    uploadedAt: document.uploadedAt,
    owner: document.owner,
  };
}

function add(document) {
  documents.set(document.id, document);
  return toPublicDocument(document);
}

function listByOwner(owner) {
  return Array.from(documents.values())
    .filter((document) => document.owner === owner)
    .sort((first, second) => second.uploadedAt.localeCompare(first.uploadedAt))
    .map(toPublicDocument);
}

function findById(id) {
  return documents.get(id) || null;
}

function getStoragePath(storageName) {
  return path.join(storageDirectory, storageName);
}

async function removeStoredFile(storageName) {
  try {
    await fs.unlink(getStoragePath(storageName));
  } catch (error) {
    if (error.code !== 'ENOENT') {
      throw error;
    }
  }
}

async function remove(id) {
  const document = documents.get(id);
  if (!document) {
    return;
  }

  documents.delete(id);
  await removeStoredFile(document.storageName);
}

module.exports = {
  add,
  listByOwner,
  findById,
  getStoragePath,
  removeStoredFile,
  remove,
};