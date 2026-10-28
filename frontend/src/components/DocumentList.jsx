import DownloadButton from './DownloadButton.jsx';

function formatFileSize(size) {
  if (size < 1024) {
    return `${size} B`;
  }

  if (size < 1024 * 1024) {
    return `${(size / 1024).toFixed(1)} KB`;
  }

  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDate(value) {
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(value));
}

function getFileType(name) {
  const extension = name.split('.').pop();
  return extension && extension !== name ? extension.slice(0, 5).toUpperCase() : 'FILE';
}

export default function DocumentList({ documents, isLoading, onError }) {
  if (isLoading) {
    return <p className="list-state" role="status">Carregando documentos…</p>;
  }

  if (documents.length === 0) {
    return (
      <div className="list-state empty-state">
        <span className="empty-rule" aria-hidden="true" />
        <p>Nenhum documento por aqui.</p>
      </div>
    );
  }

  return (
    <div className="document-list" role="list" aria-label="Documentos enviados">
      {documents.map((document) => (
        <article className="document-row" key={document.id} role="listitem">
          <span className="file-type" aria-hidden="true">{getFileType(document.originalName)}</span>
          <div className="document-info">
            <h3 title={document.originalName}>{document.originalName}</h3>
            <span>{formatDate(document.uploadedAt)}</span>
          </div>
          <span className="document-size">{formatFileSize(document.size)}</span>
          <DownloadButton document={document} onError={onError} />
        </article>
      ))}
    </div>
  );
}