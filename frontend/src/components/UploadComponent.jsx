import { useRef, useState } from 'react';

function formatFileSize(size) {
  if (size < 1024) {
    return `${size} B`;
  }

  if (size < 1024 * 1024) {
    return `${(size / 1024).toFixed(1)} KB`;
  }

  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

export default function UploadComponent({ isUploading, onUpload }) {
  const [selectedFile, setSelectedFile] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef(null);

  function chooseFile(file) {
    if (file) {
      setSelectedFile(file);
    }
  }

  function handleDrop(event) {
    event.preventDefault();
    setIsDragging(false);
    chooseFile(event.dataTransfer.files?.[0]);
  }

  async function handleSubmit(event) {
    event.preventDefault();
    if (!selectedFile || isUploading) {
      return;
    }

    const uploaded = await onUpload(selectedFile);
    if (uploaded) {
      setSelectedFile(null);
      if (inputRef.current) {
        inputRef.current.value = '';
      }
    }
  }

  return (
    <form className="upload-form" onSubmit={handleSubmit}>
      <label
        className={`drop-zone${isDragging ? ' is-dragging' : ''}`}
        onDragOver={(event) => {
          event.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
      >
        <input
          ref={inputRef}
          className="file-input"
          type="file"
          onChange={(event) => chooseFile(event.target.files?.[0])}
          disabled={isUploading}
        />
        <span className="drop-mark" aria-hidden="true">+</span>
        <span className="drop-title">Selecionar arquivo</span>
        <span className="drop-subtitle">ou arraste até aqui</span>
      </label>

      {selectedFile ? (
        <div className="selected-file" aria-live="polite">
          <span className="selected-file-name" title={selectedFile.name}>{selectedFile.name}</span>
          <span className="selected-file-size">{formatFileSize(selectedFile.size)}</span>
          <button
            type="button"
            className="remove-file"
            onClick={() => {
              setSelectedFile(null);
              if (inputRef.current) {
                inputRef.current.value = '';
              }
            }}
            disabled={isUploading}
            aria-label={`Remover ${selectedFile.name}`}
          >
            Remover
          </button>
        </div>
      ) : (
        <p className="selection-placeholder">Nenhum arquivo selecionado</p>
      )}

      <button className="primary-button upload-button" type="submit" disabled={!selectedFile || isUploading}>
        {isUploading ? 'Enviando…' : 'Enviar documento'}
      </button>
    </form>
  );
}