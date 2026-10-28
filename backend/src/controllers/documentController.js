const AppError = require('../errors');
const documentService = require('../services/documentService');

function requireUserId(req, res, next) {
  const userId = req.get('X-User-ID');

  if (!userId || !userId.trim()) {
    return next(new AppError(400, 'USER_ID_REQUIRED', 'Informe o identificador do usuário no header X-User-ID.'));
  }

  req.userId = userId.trim();
  return next();
}

function requireMultipart(req, res, next) {
  if (!req.is('multipart/form-data')) {
    return next(new AppError(415, 'MULTIPART_REQUIRED', 'Envie o arquivo como multipart/form-data.'));
  }

  return next();
}

async function upload(req, res, next) {
  if (!req.file) {
    return next(new AppError(400, 'FILE_REQUIRED', 'Envie um arquivo no campo "file".'));
  }

  try {
    const document = await documentService.createDocument(req.file, req.userId, req.documentId);
    return res.status(201).json(document);
  } catch (error) {
    return next(error);
  }
}

async function list(req, res, next) {
  try {
    const documents = await documentService.listDocuments(req.userId);
    return res.status(200).json({ documents });
  } catch (error) {
    return next(error);
  }
}

async function download(req, res, next) {
  try {
    const document = await documentService.getDownload(req.params.id, req.userId);
    res.set('X-Content-Type-Options', 'nosniff');
    res.type(document.mimeType || 'application/octet-stream');

    return res.download(document.storagePath, document.originalName, (error) => {
      if (error) {
        next(new AppError(500, 'DOWNLOAD_FAILED', 'Não foi possível baixar o documento.'));
      }
    });
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  requireUserId,
  requireMultipart,
  upload,
  list,
  download,
};