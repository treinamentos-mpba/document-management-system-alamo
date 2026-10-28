const API_PREFIX = '/api';
const USER_ID_STORAGE_KEY = 'dms.userId';

export class ApiError extends Error {
  constructor(message, code, status) {
    super(message);
    this.name = 'ApiError';
    this.code = code;
    this.status = status;
  }
}

export function getCurrentUserId() {
  let userId = window.localStorage.getItem(USER_ID_STORAGE_KEY);
  if (!userId) {
    userId = window.crypto.randomUUID();
    window.localStorage.setItem(USER_ID_STORAGE_KEY, userId);
  }

  return userId;
}

async function request(path, options = {}) {
  const headers = new Headers(options.headers);
  headers.set('X-User-ID', getCurrentUserId());

  const response = await fetch(`${API_PREFIX}${path}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    let payload;
    try {
      payload = await response.json();
    } catch {
      payload = null;
    }

    throw new ApiError(
      payload?.error?.message || 'Não foi possível concluir a solicitação.',
      payload?.error?.code || 'REQUEST_FAILED',
      response.status,
    );
  }

  return response;
}

export async function listDocuments() {
  const response = await request('/documents');
  const payload = await response.json();
  return payload.documents;
}

export async function uploadDocument(file) {
  const formData = new FormData();
  formData.append('file', file);

  const response = await request('/upload', {
    method: 'POST',
    body: formData,
  });

  return response.json();
}

export async function downloadDocument(id) {
  const response = await request(`/documents/${encodeURIComponent(id)}/download`);
  return response.blob();
}