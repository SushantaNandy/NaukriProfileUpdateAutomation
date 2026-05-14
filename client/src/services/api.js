/**
 * api.js — Centralized API service for NaukriBoost.
 *
 * All fetch calls go through this module so that:
 * 1. JWT token is automatically attached to every request
 * 2. 401 responses automatically redirect to /login
 * 3. Error handling is consistent
 */

const API_BASE = '/api';

/**
 * Core fetch wrapper.
 * Automatically attaches JWT from localStorage and handles common errors.
 *
 * @param {string} endpoint - API path (e.g., '/auth/login')
 * @param {Object} options - fetch options (method, body, headers, etc.)
 * @returns {Promise<Object>} Parsed JSON response
 */
async function request(endpoint, options = {}) {
  const token = localStorage.getItem('naukriboost_token');

  const headers = {
    ...options.headers,
  };

  /* Attach JWT if available */
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  /* Only set Content-Type for JSON bodies (not FormData/multipart) */
  if (options.body && !(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  /* Handle 401 — token expired or invalid */
  if (response.status === 401) {
    localStorage.removeItem('naukriboost_token');
    localStorage.removeItem('naukriboost_user');
    window.location.href = '/login';
    throw new Error('Session expired. Please log in again.');
  }

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || 'Something went wrong.');
  }

  return data;
}

/* ========== Auth ========== */

export const auth = {
  /** POST /api/auth/signup */
  signup: (name, email, password) =>
    request('/auth/signup', {
      method: 'POST',
      body: JSON.stringify({ name, email, password }),
    }),

  /** POST /api/auth/login */
  login: (email, password) =>
    request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),

  /** GET /api/auth/me */
  me: () => request('/auth/me'),
};

/* ========== Boost ========== */

export const boost = {
  /** POST /api/boost/trigger */
  trigger: () =>
    request('/boost/trigger', { method: 'POST' }),

  /** GET /api/boost/history?page=&limit=&status= */
  history: (page = 1, limit = 10, status = null) => {
    const params = new URLSearchParams({ page, limit });
    if (status && status !== 'all') params.set('status', status);
    return request(`/boost/history?${params}`);
  },

  /** GET /api/boost/stats */
  stats: () => request('/boost/stats'),
};

/* ========== Resume ========== */

export const resume = {
  /** GET /api/resume */
  get: () => request('/resume'),

  /** POST /api/resume/upload (multipart) */
  upload: (file, jobRole, proofPoints) => {
    const formData = new FormData();
    formData.append('file', file);
    if (jobRole) formData.append('jobRole', jobRole);
    if (proofPoints) formData.append('proofPoints', proofPoints);
    return request('/resume/upload', { method: 'POST', body: formData });
  },

  /** DELETE /api/resume */
  remove: () => request('/resume', { method: 'DELETE' }),
};

/* ========== Schedule ========== */

export const schedule = {
  /** GET /api/schedule */
  get: () => request('/schedule'),

  /** PUT /api/schedule */
  update: (data) =>
    request('/schedule', {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
};

/* ========== Naukri ========== */

export const naukri = {
  /** GET /api/naukri/status */
  status: () => request('/naukri/status'),

  /** POST /api/naukri/connect */
  connect: (email, password) =>
    request('/naukri/connect', { 
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),
};
