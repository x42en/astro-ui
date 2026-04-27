import { useState, type FormEvent } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowRight, Lock, User } from 'lucide-react';
import { Logo } from '../components/branding/Logo';
import { useAuthStore } from '../store/authStore';

/**
 * Preview-only sign-in page.
 *
 * No backend authentication is wired yet (tracked on the roadmap as
 * auth-service integration).  Any non-empty username / password pair
 * succeeds; the special username ``admin`` unlocks the Settings area.
 */
export function Login() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const login = useAuthStore((s) => s.login);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      login(username, password);
      const redirect = params.get('redirect');
      const safe =
        redirect && redirect.startsWith('/') && !redirect.startsWith('//')
          ? decodeURIComponent(redirect)
          : '/history';
      navigate(safe, { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sign-in failed.');
      setSubmitting(false);
    }
  };

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

      {/* Form panel */}
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
                hover:bg-primary-hover transition-colors
                disabled:opacity-60 disabled:cursor-not-allowed
                focus:outline-none focus:ring-2 focus:ring-primary/40
              "
            >
              <span>Continue</span>
              <ArrowRight
                size={15}
                className="transition-transform group-hover:translate-x-0.5"
              />
            </button>
          </form>

          <div className="rounded-lg border border-space-border bg-space-elevated/50 px-3 py-2.5 text-[11px] leading-relaxed text-text-muted">
            <span className="text-text-secondary font-medium">
              Preview build —
            </span>{' '}
            authentication is a stub: any credentials are accepted. Sign in as{' '}
            <code className="text-accent font-mono">admin</code> to access the
            Settings area.
          </div>

          <div className="text-center text-xs text-text-muted">
            <Link to="/" className="hover:text-text-secondary transition-colors">
              ← Back to home
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}

interface FieldProps {
  icon: React.ComponentType<{ size?: number; className?: string }>;
  label: string;
  id: string;
  type: 'text' | 'password';
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  autoComplete?: string;
}

function Field({
  icon: Icon,
  label,
  id,
  type,
  value,
  onChange,
  placeholder,
  autoComplete,
}: FieldProps) {
  return (
    <div className="space-y-1.5">
      <label
        htmlFor={id}
        className="block text-[11px] uppercase tracking-[0.12em] text-text-muted font-medium"
      >
        {label}
      </label>
      <div className="relative">
        <Icon
          size={14}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none"
        />
        <input
          id={id}
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          autoComplete={autoComplete}
          required
          className="
            w-full rounded-md bg-space-elevated/70 border border-space-border
            pl-9 pr-3 py-2.5 text-sm text-text-primary placeholder:text-text-muted/60
            focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/30
            transition-colors
          "
        />
      </div>
    </div>
  );
}
