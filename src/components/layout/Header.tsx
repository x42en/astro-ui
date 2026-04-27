import { useEffect, useMemo, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { History, BookOpen, Settings } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { Logo } from '../branding/Logo';
import { useSettingsStore } from '../../store/settingsStore';
import { useIsAdmin } from '../../store/authStore';
import { UserMenu } from './UserMenu';

interface NavLink {
  to: string;
  label: string;
  icon: LucideIcon;
}

const BASE_NAV_LINKS: NavLink[] = [
  { to: '/history', label: 'History', icon: History },
  { to: '/profiles', label: 'Profiles', icon: BookOpen },
];

const ADMIN_NAV_LINK: NavLink = { to: '/settings', label: 'Settings', icon: Settings };

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
  const location = useLocation();
  const isAdmin = useIsAdmin();
  const navLinks = useMemo<NavLink[]>(
    () => (isAdmin ? [...BASE_NAV_LINKS, ADMIN_NAV_LINK] : BASE_NAV_LINKS),
    [isAdmin],
  );

  return (
    <header className="h-14 border-b border-space-border bg-space-bg/95 backdrop-blur-md sticky top-0 z-40 grid grid-cols-[auto_1fr_auto] items-center px-6 gap-6 flex-shrink-0">
      {/* Left — Logo */}
      <Link to="/history" className="flex items-center flex-shrink-0" aria-label="AstroStack — home">
        <Logo variant="wordmark" size={28} className="hidden sm:inline-flex" />
        <Logo variant="mark" size={28} className="sm:hidden" />
      </Link>

      {/* Center — Nav links */}
      <nav className="flex items-center justify-center gap-0.5">
        {navLinks.map(({ to, label, icon: Icon }) => {
          const isActive = location.pathname.startsWith(to);
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

      {/* Right — Connection + User menu */}
      <div className="flex items-center gap-4 justify-end">
        <ConnectionDot />
        <UserMenu />
      </div>
    </header>
  );
}

