const API_BASE = import.meta.env.VITE_API_URL || '/api';

const TOKEN_STORAGE_KEY = 'evalengine_token';

export const getStoredToken = () => localStorage.getItem(TOKEN_STORAGE_KEY);
export const setStoredToken = (token) => localStorage.setItem(TOKEN_STORAGE_KEY, token);
export const clearStoredToken = () => localStorage.removeItem(TOKEN_STORAGE_KEY);

async function request(endpoint, options = {}) {
  const token = getStoredToken();
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers || {}),
  };

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const message = data?.message || data?.error?.message || `Request failed (${response.status})`;
    const error = new Error(message);
    error.status = response.status;
    error.code = data?.error?.code;
    error.details = data?.error?.details;
    throw error;
  }

  return data;
}

export const authApi = {
  register: (payload) =>
    request('/auth/register', { method: 'POST', body: JSON.stringify(payload) }),
  login: (payload) =>
    request('/auth/login', { method: 'POST', body: JSON.stringify(payload) }),
  getProfile: () => request('/auth/profile'),
};

export const problemsApi = {
  list: ({ search = '', difficulty = '', page = 1, limit = 10 } = {}) => {
    const params = new URLSearchParams();
    if (search.trim()) params.set('search', search.trim());
    if (difficulty) params.set('difficulty', difficulty);
    params.set('page', String(page));
    params.set('limit', String(limit));
    return request(`/problems?${params.toString()}`);
  },
  getById: (id) => request(`/problems/${id}`),
  create: (payload) =>
    request('/problems', { method: 'POST', body: JSON.stringify(payload) }),
};

export const submissionsApi = {
  run: (payload) =>
    request('/submissions/run', { method: 'POST', body: JSON.stringify(payload) }),
  submit: (payload) =>
    request('/submissions/submit', { method: 'POST', body: JSON.stringify(payload) }),
  myHistory: ({ page = 1, limit = 10, problemId = '', status = '' } = {}) => {
    const params = new URLSearchParams({ page: String(page), limit: String(limit) });
    if (problemId) params.set('problemId', problemId);
    if (status) params.set('status', status);
    return request(`/submissions/my-history?${params.toString()}`);
  },
  byProblem: (problemId, { page = 1, limit = 15 } = {}) => {
    const params = new URLSearchParams({ page: String(page), limit: String(limit) });
    return request(`/submissions/problem/${problemId}?${params.toString()}`);
  },
};

export const healthApi = {
  check: () => request('/health'),
};
