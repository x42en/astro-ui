import { useEffect, useState, type FormEvent } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowRight, Lock, User, type LucideIcon } from 'lucide-react';
import { Logo } from '../components/branding/Logo';
import { AUTH_MODE, userManager } from '../lib/oidc';
import { useAuthStore } from '../store/authStore';
import { useTranslation } from 'react-i18next';

// ---------------------------------------------------------------------------
// Field sub-component (shared by mock form)
// ---------------------------------------------------------------------------

interface FieldProps {
  icon: LucideIcon;
  label: string;
  id: string;
  type: 'text' | 'password';
  autoComplete: string;
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
}

function Field({
  icon: Icon,
  label,
  id,
  type,
  autoComplete,
  value,
  onChange,
  placeholder,
}: FieldProps) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="block text-xs font-medium text-text-secondary">
        {label}
      </label>
      <div className="relative">
        <Icon
          size={13}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none"
        />
        <input
          id={id}
          type={type}
          autoComplete={autoComplete}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="
            w-full pl-9 pr-3 py-2.5
            bg-space-bg border border-space-border rounded-md
            text-sm text-text-primary placeholder:text-text-muted
            focus:outline-none focus:border-primary/60 focus:ring-1 focus:ring-primary/30
            transition-all
          "
        />
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Mock-mode login form (only rendered when VITE_AUTH_MODE=mock)
// ---------------------------------------------------------------------------

function MockLoginForm() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const u = username.trim();
      if (!u) throw new Error(t('login.errors.usernameRequired'));
      if (!password) throw new Error(t('login.errors.passwordRequired'));
      // Persist mock user to the legacy localStorage key so the auth store
      // picks it up on next bootstrap() call.
      localStorage.setItem(
        'astrostack-auth',
        JSON.stringify({ state: { user: { username: u } } }),
      );
      // Update the in-memory store
      useAuthStore.getState().bootstrap().catch(() => undefined);
      const redirect = params.get('redirect');
      const safe =
        redirect && redirect.startsWith('/') && !redirect.startsWith('//')
          ? decodeURIComponent(redirect)
          : '/dashboard';
      navigate(safe, { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : t('login.errors.generic'));
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4" noValidate>
      <Field
        icon={User}
        label={t('login.username')}
        id="login-username"
        type="text"
        autoComplete="username"
        value={username}
        onChange={setUsername}
        placeholder={t('login.usernamePlaceholder')}
      />
      <Field
        icon={Lock}
        label={t('login.password')}
        id="login-password"
        type="password"
        autoComplete="current-password"
        value={password}
        onChange={setPassword}
        placeholder={t('login.passwordPlaceholder')}
      />

      {error && (
        <div
          role="alert"
          className="rounded-md border border-error/30 bg-error/10 px-3 py-2 text-xs text-error"
        >
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={submitting}
        className="
          group inline-flex items-center justify-center gap-2 w-full
          rounded-md bg-primary text-white font-medium px-4 py-2.5
          hover:bg-primary-hover focus:outline-none focus:ring-2 focus:ring-primary/50
          disabled:opacity-50 disabled:cursor-not-allowed
          transition-colors duration-150
        "
      >
        {t('login.submitMock')}
        <ArrowRight size={15} className="transition-transform group-hover:translate-x-0.5" />
      </button>
    </form>
  );
}

// ---------------------------------------------------------------------------
// Disabled-mode handler — triggers on mount, redirects without any UI flash
// ---------------------------------------------------------------------------

function DisabledModeLogin() {
  const navigate = useNavigate();
  const [params] = useSearchParams();

  useEffect(() => {
    // In disabled mode bootstrap() always resolves to the synthetic admin user.
    useAuthStore
      .getState()
      .bootstrap()
      .then(() => {
        const redirect = params.get('redirect');
        const safe =
          redirect && redirect.startsWith('/') && !redirect.startsWith('//')
            ? decodeURIComponent(redirect)
            : '/dashboard';
        navigate(safe, { replace: true });
      })
      .catch(() => navigate('/', { replace: true }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-space-bg">
      <div className="w-7 h-7 rounded-full border-2 border-primary border-t-transparent animate-spin" />
    </div>
  );
}

// ---------------------------------------------------------------------------
// OIDC-mode auto-redirect — initiates signinRedirect on mount
// ---------------------------------------------------------------------------

function OidcAutoRedirect() {
  const { t } = useTranslation();
  const [params] = useSearchParams();
  const [error, setError] = useState<string | null>(null);
  const returnUrl = params.get('redirect') ?? '/dashboard';

  useEffect(() => {
    if (!userManager) return;
    userManager.signinRedirect({ state: returnUrl }).catch((err: unknown) => {
      setError(err instanceof Error ? err.message : t('login.errors.oidcFailed'));
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (error) {
    return (
      <div className="space-y-4">
        <div
          role="alert"
          className="rounded-md border border-error/30 bg-error/10 px-3 py-2 text-xs text-error"
        >
          {error}
        </div>
        <button
          type="button"
          onClick={() => {
            setError(null);
            userManager?.signinRedirect({ state: returnUrl }).catch((err: unknown) => {
              setError(err instanceof Error ? err.message : t('login.errors.oidcFailed'));
            });
          }}
          className="
            group inline-flex items-center justify-center gap-2 w-full
            rounded-md bg-primary text-white font-medium px-4 py-2.5
            hover:bg-primary-hover focus:outline-none focus:ring-2 focus:ring-primary/50
            transition-colors duration-150
          "
        >
          {t('login.submitOidc')}
          <ArrowRight size={15} className="transition-transform group-hover:translate-x-0.5" />
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4 text-center">
      <div className="flex justify-center">
        <div className="w-7 h-7 rounded-full border-2 border-primary border-t-transparent animate-spin" />
      </div>
      <p className="text-sm text-text-muted">{t('login.redirecting')}</p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main Login page
// ---------------------------------------------------------------------------

export function Login() {
  const { t } = useTranslation();

  // Disabled mode: silently auto-login without rendering the full layout.
  if (AUTH_MODE === 'disabled') {
    return <DisabledModeLogin />;
  }

  return (
    <div className="min-h-screen w-full grid md:grid-cols-2 bg-space-bg text-text-primary">
      {/* Brand panel */}
      <aside
        className="hidden md:flex relative overflow-hidden items-center justify-center p-12"
        aria-hidden="true"
      >
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,rgba(99,102,241,0.18),transparent_55%),radial-gradient(ellipse_at_bottom_right,rgba(34,211,238,0.14),transparent_55%)]" />
        <div className="absolute inset-0 bg-[url('/background.jpg')] bg-cover bg-center opacity-25" />
        <div className="absolute inset-0 bg-gradient-to-br from-space-bg/80 via-space-bg/60 to-space-bg/95" />

        <div className="relative z-10 max-w-md text-center space-y-6">
          <Logo variant="mark" size={96} className="mx-auto" />
          <div className="space-y-3">
            <h1 className="text-3xl font-semibold tracking-tight">
              {t('login.brand.title')}
            </h1>
            <p className="text-sm text-text-secondary leading-relaxed">
              {t('login.brand.description')}
            </p>
          </div>
        </div>
      </aside>

      {/* Form / OIDC panel */}
      <main className="flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-sm space-y-8">
          <div className="md:hidden flex flex-col items-center gap-3 text-center">
            <Logo variant="mark" size={56} />
            <h1 className="text-xl font-semibold tracking-tight">
              {t('login.welcome')}
            </h1>
          </div>

          <div className="space-y-1.5">
            <h2 className="text-2xl font-semibold tracking-tight">{t('login.signIn')}</h2>
            <p className="text-sm text-text-muted">
              {AUTH_MODE === 'mock'
                ? t('login.mockSubtitle')
                : t('login.oidcSubtitle')}
            </p>
          </div>

          {AUTH_MODE === 'mock' ? <MockLoginForm /> : <OidcAutoRedirect />}

          {AUTH_MODE === 'oidc' && (
            <div className="text-center">
              <Link
                to={`${import.meta.env.VITE_OIDC_AUTHORITY ?? ''}/register`}
                className="text-xs text-text-muted hover:text-text-secondary transition-colors"
                target="_blank"
                rel="noopener noreferrer"
              >
                {t('login.noAccount')}
              </Link>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}