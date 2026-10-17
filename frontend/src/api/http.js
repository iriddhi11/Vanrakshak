const BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';
const TOKEN_KEY = 'tadoba_token';

export const tokenStore = {
  get: () => localStorage.getItem(TOKEN_KEY),
  set: (token) => localStorage.setItem(TOKEN_KEY, token),
  clear: () => localStorage.removeItem(TOKEN_KEY),
};

function buildUrl(path, params) {
  const url = new URL(`${BASE_URL}${path}`, window.location.origin);
  Object.entries(params || {}).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '' && value !== 'All') url.searchParams.set(key, value);
  });
  return url.toString();
}

export async function request(path, { method = 'GET', body, params } = {}) {
  const token = tokenStore.get();
  let response;
  try {
    response = await fetch(buildUrl(path, params), {
      method,
      headers: {
        ...(body ? { 'Content-Type': 'application/json' } : {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new Error('Cannot reach the server. Check your connection and try again.');
  }

  const data = await response.json().catch(() => ({}));
  if (response.status === 401 && token && !path.startsWith('/auth/login')) {
    tokenStore.clear();
    window.dispatchEvent(new Event('auth:expired'));
  }
  if (!response.ok) throw new Error(data.message || `Request failed (${response.status})`);
  return data;
}
