import { useState, type FormEvent } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowRight, Lock, User, type LucideIcon } from 'lucide-react';
import { Logo } from '../components/branding/Logo';
import { AUTH_MODE, userManager } from '../lib/oidc';
import { useAuthStore } from '../store/authStore';

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
      if (!u) throw new Error('Username is required.');
      if (!password) throw new Error('Password is required.');
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
      setError(err instanceof Error ? err.message : 'Sign-in failed.');
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4" noValidate>
      <Field
        icon={User}
        label="Username"
        id="login-username"
        type="text"
        autoComplete="username"
        value={username}
        onChange={setUsername}
        placeholder="astronomer"
      />
      <Field
        icon={Lock}
        label="Password"
        id="login-password"
        type="password"
        autoComplete="current-password"
        value={password}
        onChange={setPassword}
        placeholder="••••••••"
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
        Sign in (mock)
        <ArrowRight size={15} className="transition-transform group-hover:translate-x-0.5" />
      </button>

      <p className="text-xs text-text-muted text-center pt-1">
        Development mock — any credentials accepted. Username{' '}
        <code className="font-mono">admin</code> unlocks Settings.
      </p>
    </form>
  );
}

// ---------------------------------------------------------------------------
// OIDC-mode redirect button (rendered when VITE_AUTH_MODE=oidc, the default)
// ---------------------------------------------------------------------------

function OidcLoginButton() {
  const [params] = useSearchParams();
  const [loading, setLoading] = useState(false);
  const returnUrl = params.get('redirect') ?? '/dashboard';

  const handleSignIn = async () => {
    if (!userManager) return;
    setLoading(true);
    try {
      await userManager.signinRedirect({ state: returnUrl });
    } catch {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <button
        type="button"
        onClick={handleSignIn}
        disabled={loading}
        className="
          group inline-flex items-center justify-center gap-2 w-full
          rounded-md bg-primary text-white font-medium px-4 py-2.5
          hover:bg-primary-hover focus:outline-none focus:ring-2 focus:ring-primary/50
          disabled:opacity-50 disabled:cursor-not-allowed
          transition-colors duration-150
        "
      >
        {loading ? 'Redirecting…' : 'Sign in with Astromote'}
        {!loading && (
          <ArrowRight size={15} className="transition-transform group-hover:translate-x-0.5" />
        )}
      </button>

      <p className="text-xs text-text-muted text-center">
        You will be redirected to{' '}
        <span className="text-text-secondary">auth.astromote.com</span> to authenticate.
      </p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main Login page
// ---------------------------------------------------------------------------

export function Login() {
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
              Process the night sky.
            </h1>
            <p className="text-sm text-text-secondary leading-relaxed">
              AstroStack turns raw frames into finished images with a
              GPU-accelerated pipeline, profile presets, and a community of
              shared recipes.
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
              Welcome to AstroStack
            </h1>
          </div>

          <div className="space-y-1.5">
            <h2 className="text-2xl font-semibold tracking-tight">Sign in</h2>
            <p className="text-sm text-text-muted">
              Sign in or create an account to publish your sessions.
            </p>
          </div>

          {AUTH_MODE === 'mock' ? <MockLoginForm /> : <OidcLoginButton />}

          {AUTH_MODE === 'oidc' && (
            <div className="text-center">
              <Link
                to={`${import.meta.env.VITE_OIDC_AUTHORITY ?? ''}/register`}
                className="text-xs text-text-muted hover:text-text-secondary transition-colors"
                target="_blank"
                rel="noopener noreferrer"
              >
                No account yet? Create one
              </Link>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
