import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Telescope, LayoutDashboard, BookOpen, Settings, SlidersHorizontal } from 'lucide-react';
import { useUiStore } from '../../store/uiStore';
import { useSettingsStore } from '../../store/settingsStore';

const NAV_LINKS = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/profiles', label: 'Profiles', icon: BookOpen },
  { to: '/settings', label: 'Settings', icon: Settings },
];

function ConnectionDot() {
  const apiBaseUrl = useSettingsStore((s) => s.apiBaseUrl);
  const [connected, setConnected] = useState(true);

  useEffect(() => {
    let mounted = true;
    const check = async () => {
      try {
        const res = await fetch(`${apiBaseUrl}/health`, {
          signal: AbortSignal.timeout(4000),
        });
        if (mounted) setConnected(res.ok);
      } catch {
        if (mounted) setConnected(false);
      }
    };
    check();
    const id = setInterval(check, 30000);
    return () => {
      mounted = false;
      clearInterval(id);
    };
  }, [apiBaseUrl]);

  return (
    <div
      className="flex items-center gap-1.5"
      title={connected ? 'API connected' : 'API unreachable'}
    >
      <div
        className={`w-1.5 h-1.5 rounded-full transition-colors ${
          connected ? 'bg-success' : 'bg-error'
        }`}
      />
      <span className="text-xs text-text-muted hidden lg:block">
        {connected ? 'Live' : 'Offline'}
      </span>
    </div>
  );
}

export function Header() {
  const { viewMode, setViewMode } = useUiStore();
  const location = useLocation();

  return (
    <header className="h-14 border-b border-space-border bg-space-bg/95 backdrop-blur-md sticky top-0 z-40 flex items-center px-6 gap-6 flex-shrink-0">
      {/* Logo */}
      <Link to="/" className="flex items-center gap-2.5 flex-shrink-0">
        <div className="w-7 h-7 rounded bg-primary/10 border border-primary/20 flex items-center justify-center">
          <Telescope size={14} className="text-primary" />
        </div>
        <span className="font-semibold text-text-primary tracking-tight hidden sm:block">
          Astro<span className="text-gradient-accent">Stack</span>
        </span>
      </Link>

      {/* Nav links */}
      <nav className="flex items-center gap-0.5">
        {NAV_LINKS.map(({ to, label, icon: Icon }) => {
          const isActive =
            to === '/'
              ? location.pathname === '/'
              : location.pathname.startsWith(to);
          return (
            <Link
              key={to}
              to={to}
              className={`
                flex items-center gap-1.5 px-3 py-1.5 rounded text-sm transition-all duration-150
                ${
                  isActive
                    ? 'text-text-primary bg-white/6'
                    : 'text-text-muted hover:text-text-secondary hover:bg-white/4'
                }
              `}
            >
              <Icon size={14} />
              <span className="hidden md:block">{label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Right section */}
      <div className="ml-auto flex items-center gap-4">
        <ConnectionDot />

        {/* View mode toggle */}
        <div className="flex items-center gap-0.5 bg-space-surface border border-space-border rounded p-0.5">
          <button
            type="button"
            onClick={() => setViewMode('simple')}
            className={`px-2.5 py-1 text-xs font-medium rounded transition-all duration-150 ${
              viewMode === 'simple'
                ? 'bg-white/10 text-text-primary'
                : 'text-text-muted hover:text-text-secondary'
            }`}
          >
            Simple
          </button>
          <button
            type="button"
            onClick={() => setViewMode('advanced')}
            className={`px-2.5 py-1 text-xs font-medium rounded flex items-center gap-1 transition-all duration-150 ${
              viewMode === 'advanced'
                ? 'bg-white/10 text-text-primary'
                : 'text-text-muted hover:text-text-secondary'
            }`}
          >
            <SlidersHorizontal size={11} />
            <span className="hidden sm:block">Advanced</span>
          </button>
        </div>
      </div>
    </header>
  );
}
