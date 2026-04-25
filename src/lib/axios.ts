import axios from 'axios';
import { useSettingsStore } from '../store/settingsStore';

export const api = axios.create({
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000,
});

api.interceptors.request.use((config) => {
  const { apiBaseUrl, apiKey, authEnabled } = useSettingsStore.getState();
  config.baseURL = apiBaseUrl;

  // For multipart uploads (FormData), delete the instance-level Content-Type
  // so XHR can set it automatically with the correct boundary string.
  // Axios 1.x does NOT automatically remove the instance default for FormData
  // in browser environments — this must be done explicitly.
  if (config.data instanceof FormData) {
    config.headers.delete('Content-Type');
  }

  if (authEnabled && apiKey) {
    config.headers.Authorization = `Bearer ${apiKey}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (axios.isAxiosError(error)) {
      const message =
        error.response?.data?.message ??
        error.response?.data?.detail ??
        error.message ??
        'An unexpected error occurred';
      const code =
        error.response?.data?.code ??
        `HTTP_${error.response?.status ?? 'UNKNOWN'}`;
      return Promise.reject({ code, message });
    }
    return Promise.reject({ code: 'UNKNOWN', message: 'Network error' });
  }
);

export default api;
