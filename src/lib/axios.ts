import axios from 'axios';
import { AUTH_MODE, userManager } from './oidc';
import { useAuthStore } from '../store/authStore';
import { useSettingsStore } from '../store/settingsStore';

export const api = axios.create({
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000,
});

// Singleton refresh promise to avoid token-refresh stampedes when multiple
// requests receive 401 simultaneously.
let _silentRenewPromise: Promise<string | null> | null = null;

async function refreshAccessToken(): Promise<string | null> {
  if (!userManager) return null;
  if (!_silentRenewPromise) {
    _silentRenewPromise = userManager
      .signinSilent()
      .then((u) => u?.access_token ?? null)
      .catch(() => null)
      .finally(() => {
        _silentRenewPromise = null;
      });
  }
  return _silentRenewPromise;
}

api.interceptors.request.use(async (config) => {
  const { apiBaseUrl } = useSettingsStore.getState();
  config.baseURL = apiBaseUrl;

  // For multipart uploads (FormData), delete the instance-level Content-Type
  // so XHR can set it automatically with the correct multipart boundary.
  if (config.data instanceof FormData) {
    if (typeof config.headers?.delete === 'function') {
      config.headers.delete('Content-Type');
    } else if (config.headers && typeof config.headers === 'object') {
      delete (config.headers as Record<string, unknown>)['Content-Type'];
    }
  }

  if (AUTH_MODE === 'oidc') {
    // Read access token from in-memory Zustand state (populated by UserManager
    // events — no async call needed in the happy path).
    const token = useAuthStore.getState().accessToken;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  } else if (AUTH_MODE === 'mock') {
    // Mock-auth bridge: identify the caller via a deterministic header so
    // backend /me/* endpoints can persist per-user data without a real JWT.
    const user = useAuthStore.getState().user;
    if (user?.name) {
      config.headers['X-Mock-User'] = user.name;
    }
  }
  // AUTH_MODE === 'disabled': no auth header

  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    // On 401, attempt a silent token refresh (OIDC mode only) and retry once.
    if (
      AUTH_MODE === 'oidc' &&
      axios.isAxiosError(error) &&
      error.response?.status === 401 &&
      // Avoid infinite retry loops
      !(error.config as { _retried?: boolean })?._retried
    ) {
      const newToken = await refreshAccessToken();
      if (newToken) {
        useAuthStore.setState({ accessToken: newToken });
        const cfg = error.config!;
        (cfg as { _retried?: boolean })._retried = true;
        cfg.headers = cfg.headers ?? {};
        cfg.headers.Authorization = `Bearer ${newToken}`;
        return api.request(cfg);
      }
      // Refresh failed — clear the session
      useAuthStore.getState().logout().catch(() => undefined);
    }

    // eslint-disable-next-line no-console
    console.error('[axios] response error', {
      status: error?.response?.status,
      message: error?.message,
    });

    if (axios.isAxiosError(error)) {
      const message =
        error.response?.data?.message ??
        error.response?.data?.detail ??
        error.message ??
        'An unexpected error occurred';
      const code =
        error.response?.data?.error_code ??
        error.response?.data?.code ??
        `HTTP_${error.response?.status ?? 'UNKNOWN'}`;
      return Promise.reject({ code, message });
    }
    return Promise.reject({ code: 'UNKNOWN', message: 'Network error' });
  },
);

export default api;


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
