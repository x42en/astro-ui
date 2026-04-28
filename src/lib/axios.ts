import axios from 'axios';
import { useSettingsStore } from '../store/settingsStore';
import { useAuthStore } from '../store/authStore';

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
    // `config.headers` is normally an AxiosHeaders instance, but we guard
    // against the rare case where it has been replaced with a plain object
    // by an upstream caller — `.delete` would otherwise throw a TypeError
    // synchronously inside the interceptor, which axios surfaces as a
    // generic non-AxiosError, masking the real cause.
    if (typeof config.headers?.delete === 'function') {
      config.headers.delete('Content-Type');
    } else if (config.headers && typeof config.headers === 'object') {
      delete (config.headers as Record<string, unknown>)['Content-Type'];
    }
  }

  if (authEnabled && apiKey) {
    config.headers.Authorization = `Bearer ${apiKey}`;
  } else {
    // Mock-auth bridge: when real JWT auth isn't configured, identify the
    // caller via a deterministic header so backend /me/* endpoints can
    // persist per-user data. The backend maps this header to
    // uuid5(namespace, value).
    const authUser = useAuthStore.getState().user;
    if (authUser?.username) {
      config.headers['X-Mock-User'] = authUser.username;
    }
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    // eslint-disable-next-line no-console
    console.error('[axios] response interceptor caught', {
      isAxiosError: axios.isAxiosError(error),
      message: error?.message,
      name: error?.name,
      code: error?.code,
      stack: error?.stack,
      raw: error,
    });
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
