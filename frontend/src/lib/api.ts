const API_BASE = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '');

export async function apiFetch(path: string, init?: RequestInit) {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  const url = API_BASE ? `${API_BASE}${normalizedPath}` : normalizedPath;
  return fetch(url, init);
}
