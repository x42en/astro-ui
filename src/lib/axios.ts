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
  } else if (AUTH_MODE === 'mock' || AUTH_MODE === 'disabled') {
    // Mock-auth / disabled-auth bridge: identify the caller via a deterministic
    // header so backend endpoints can resolve the user without a real JWT.
    // In 'disabled' mode the synthetic user id is 'local-admin'.
    const user = useAuthStore.getState().user;
    if (user?.id) {
      config.headers['X-Mock-User'] = user.id;
    }
  }

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
