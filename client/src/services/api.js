/**
 * Axios API Service Instance
 * VidTube Platform
 */
import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Request interceptor (prepared for JWT auth tokens in Phase 2)
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('vidtube_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for consistent error unwrapping
api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    const customError = {
      message: error.response?.data?.message || error.message || 'Network request failed',
      statusCode: error.response?.status || 500,
      data: error.response?.data || null
    };
    return Promise.reject(customError);
  }
);

export default api;
