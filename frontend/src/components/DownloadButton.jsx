import { useState } from 'react';
import { downloadDocument } from '../services/documentApi.js';

export default function DownloadButton({ document, onError }) {
  const [isDownloading, setIsDownloading] = useState(false);

  async function handleDownload() {
    setIsDownloading(true);

    try {
      const fileBlob = await downloadDocument(document.id);
      const objectUrl = URL.createObjectURL(fileBlob);
      const link = window.document.createElement('a');
      link.href = objectUrl;
      link.download = document.originalName;
      window.document.body.append(link);
      link.click();
      link.remove();
      window.setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
    } catch (error) {
      onError(error.message);
    } finally {
      setIsDownloading(false);
    }
  }

  return (
    <button
      type="button"
      className="download-button"
      onClick={handleDownload}
      disabled={isDownloading}
      aria-label={`Baixar ${document.originalName}`}
    >
      {isDownloading ? 'Baixando…' : 'Baixar'}
    </button>
  );
}