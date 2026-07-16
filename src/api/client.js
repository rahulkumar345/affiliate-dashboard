export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';

const TOKEN_KEY = 'amplify_token';
const USER_KEY = 'amplify_user';

export const getToken = () => localStorage.getItem(TOKEN_KEY) || null;

export function storeSession(token, userMap) {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, JSON.stringify(userMap));
}

export function clearSession() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

export function storedUserMap() {
  try {
    return JSON.parse(localStorage.getItem(USER_KEY)) || null;
  } catch {
    return null;
  }
}

export async function apiFetch(path, { method = 'GET', bodyMap = null } = {}) {
  const headersMap = { 'Content-Type': 'application/json' };
  const token = getToken();
  if (token) headersMap.Authorization = `Bearer ${token}`;

  const response = await fetch(`${API_URL}${path}`, {
    method,
    headers: headersMap,
    body: bodyMap ? JSON.stringify(bodyMap) : null,
  });
  const dataMap = await response.json().catch(() => null);
  if (!response.ok) throw new Error((dataMap && dataMap.error) || `Request failed (${response.status})`);
  return dataMap;
}

// CSV downloads need the auth header, so a plain <a href> won't do —
// fetch with the token, then trigger a blob download.
export async function downloadCsv(path, filename) {
  const response = await fetch(`${API_URL}${path}`, {
    headers: { Authorization: `Bearer ${getToken()}` },
  });
  if (!response.ok) throw new Error(`Export failed (${response.status})`);
  const blob = await response.blob();
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}
