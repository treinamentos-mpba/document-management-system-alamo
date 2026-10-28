// Seed do servidor backend do Document Management System.
//
// Este arquivo é apenas um ponto de partida mínimo. Ao longo do workshop você
// vai usar o Agent Mode do GitHub Copilot para construir as camadas:
//   - routes/       (definição das rotas)
//   - controllers/  (entrada HTTP e validação)
//   - services/     (regras de negócio)
//   - repositories/ (persistência: arquivos locais + metadados em memória)
//
// Restrição do projeto: uploads são gravados no filesystem local da aplicação
// usando multer com diskStorage. Não utilize provedores externos.

const express = require('express');
const multer = require('multer');
const documentRoutes = require('./routes/document.routes');
const AppError = require('./errors');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use('/', documentRoutes);

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.use((error, req, res, next) => {
  if (res.headersSent) {
    return next(error);
  }

  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(413).json({
        error: {
          code: 'FILE_TOO_LARGE',
          message: 'O arquivo excede o limite permitido.',
        },
      });
    }

    const code = error.code === 'LIMIT_UNEXPECTED_FILE'
      ? 'FILE_REQUIRED'
      : 'INVALID_MULTIPART';
    const message = code === 'FILE_REQUIRED'
      ? 'Envie um arquivo no campo "file".'
      : 'Não foi possível processar o formulário enviado.';

    return res.status(400).json({ error: { code, message } });
  }

  if (error.message === 'Multipart: Boundary not found') {
    return res.status(400).json({
      error: {
        code: 'INVALID_MULTIPART',
        message: 'O formulário multipart é inválido.',
      },
    });
  }

  const statusCode = error instanceof AppError ? error.statusCode : 500;
  const code = error instanceof AppError ? error.code : 'INTERNAL_SERVER_ERROR';
  const message = statusCode >= 500
    ? 'Não foi possível concluir a operação.'
    : error.message;

  return res.status(statusCode).json({ error: { code, message } });
});

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`DMS backend ouvindo na porta ${PORT}`);
  });
}

module.exports = app;
