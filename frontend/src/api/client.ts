import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || '';

export const api = axios.create({
  baseURL: `${API_URL}/api`,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('pablo_token') || sessionStorage.getItem('pablo_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('pablo_token');
      localStorage.removeItem('pablo_token_expiry');
      sessionStorage.removeItem('pablo_token');
      if (window.location.pathname.startsWith('/pb-admin') && window.location.pathname !== '/pb-admin/login') {
        window.location.href = '/pb-admin/login';
      }
    }
    return Promise.reject(err);
  },
);
