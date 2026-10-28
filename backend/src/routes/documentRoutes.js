const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');
const express = require('express');
const multer = require('multer');
const documentController = require('../controllers/documentController');

const router = express.Router();
const storageDirectory = path.resolve(__dirname, '../../storage');
const configuredFileSize = Number(process.env.MAX_FILE_SIZE_BYTES);
const maxFileSize = Number.isSafeInteger(configuredFileSize) && configuredFileSize > 0
  ? configuredFileSize
  : 50_000_000;

const storage = multer.diskStorage({
  destination(req, file, callback) {
    fs.mkdir(storageDirectory, { recursive: true }, (error) => {
      callback(error, storageDirectory);
    });
  },
  filename(req, file, callback) {
    const documentId = crypto.randomUUID();
    req.documentId = documentId;
    callback(null, documentId);
  },
});

const upload = multer({
  storage,
  limits: {
    fileSize: maxFileSize,
    files: 1,
  },
});

router.post(
  '/upload',
  documentController.requireUserId,
  documentController.requireMultipart,
  upload.single('file'),
  documentController.upload,
);
router.get('/documents', documentController.requireUserId, documentController.list);
router.get(
  '/documents/:id/download',
  documentController.requireUserId,
  documentController.download,
);

module.exports = router;