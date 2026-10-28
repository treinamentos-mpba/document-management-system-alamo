import { useEffect, useState } from 'react';
import './App.css';
import DocumentList from './components/DocumentList.jsx';
import UploadComponent from './components/UploadComponent.jsx';
import { getCurrentUserId, listDocuments, uploadDocument } from './services/documentApi.js';

export default function App() {
  const [documents, setDocuments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [notice, setNotice] = useState('');
  const userLabel = getCurrentUserId().slice(0, 8);

  useEffect(() => {
    let isCurrent = true;

    listDocuments()
      .then((result) => {
        if (isCurrent) {
          setDocuments(result);
        }
      })
      .catch((error) => {
        if (isCurrent) {
          setErrorMessage(error.message);
        }
      })
      .finally(() => {
        if (isCurrent) {
          setIsLoading(false);
        }
      });

    return () => {
      isCurrent = false;
    };
  }, []);

  async function handleUpload(file) {
    setErrorMessage('');
    setNotice('');
    setIsUploading(true);

    try {
      const createdDocument = await uploadDocument(file);
      setDocuments((currentDocuments) => [
        createdDocument,
        ...currentDocuments.filter((document) => document.id !== createdDocument.id),
      ]);
      setNotice('Documento enviado.');
      return true;
    } catch (error) {
      setErrorMessage(error.message);
      return false;
    } finally {
      setIsUploading(false);
    }
  }

  return (
    <div className="app-shell">
      <header className="topbar">
        <a className="brand" href="/" aria-label="Arquivo, início">
          <span className="brand-mark" aria-hidden="true">A</span>
          <span className="brand-name">arquivo<span>/</span></span>
        </a>
        <div className="session-indicator">
          <span className="session-dot" aria-hidden="true" />
          <span>Sessão local</span>
          <code>{userLabel}</code>
        </div>
      </header>

      <main className="workspace">
        <section className="page-heading" aria-labelledby="page-title">
          <div>
            <p className="eyebrow">Acervo pessoal <span>·</span> 01</p>
            <h1 id="page-title">Documentos</h1>
          </div>
          <p className="document-total">
            <strong>{documents.length.toString().padStart(2, '0')}</strong>
            <span>{documents.length === 1 ? 'arquivo' : 'arquivos'}</span>
          </p>
        </section>

        {errorMessage && (
          <div className="alert alert-error" role="alert">
            <span>{errorMessage}</span>
            <button type="button" className="alert-dismiss" onClick={() => setErrorMessage('')} aria-label="Fechar aviso">
              Fechar
            </button>
          </div>
        )}
        {notice && (
          <div className="alert alert-success" role="status">
            <span>{notice}</span>
            <button type="button" className="alert-dismiss" onClick={() => setNotice('')} aria-label="Fechar aviso">
              Fechar
            </button>
          </div>
        )}

        <div className="content-grid">
          <aside className="upload-panel" aria-labelledby="upload-heading">
            <div className="panel-heading">
              <span className="section-index">01</span>
              <h2 id="upload-heading">Adicionar arquivo</h2>
            </div>
            <UploadComponent isUploading={isUploading} onUpload={handleUpload} />
            <p className="upload-limit">Máximo de 50 MB por arquivo</p>
          </aside>

          <section className="documents-panel" aria-labelledby="documents-heading">
            <div className="panel-heading documents-heading">
              <span className="section-index">02</span>
              <h2 id="documents-heading">Todos os documentos</h2>
              <span className="list-count">{documents.length}</span>
            </div>
            <DocumentList
              documents={documents}
              isLoading={isLoading}
              onError={setErrorMessage}
            />
          </section>
        </div>
      </main>
      <footer className="app-footer">
        <span>ARQUIVO / DMS</span>
        <span>Armazenamento local</span>
      </footer>
    </div>
  );
}
