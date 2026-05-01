import { useEffect, useMemo, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { BookOpen, BarChart2, GraduationCap, Images, Settings, Calendar, LayoutDashboard, Moon, Sun } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { Logo } from '../branding/Logo';
import { useSettingsStore } from '../../store/settingsStore';
import { useIsAdmin } from '../../store/authStore';
import { useUiStore } from '../../store/uiStore';
import { UserMenu } from './UserMenu';
import { useTranslation } from 'react-i18next';
import LanguageSwitcher from './LanguageSwitcher';

interface NavLink {
  to: string;
  key: string;
  icon: LucideIcon;
}

const BASE_NAV_LINKS: NavLink[] = [
  { to: '/gallery', key: 'header.nav.gallery', icon: Images },
  { to: '/dashboard', key: 'header.nav.dashboard', icon: LayoutDashboard },
  { to: '/prepare', key: 'header.nav.plan', icon: Calendar },
  { to: '/profiles', key: 'header.nav.profiles', icon: BookOpen },
  { to: '/learn', key: 'header.nav.learn', icon: GraduationCap },
];

const ADMIN_NAV_LINKS: NavLink[] = [
  { to: '/settings', key: 'header.nav.settings', icon: Settings },
  { to: '/admin/gallery', key: 'header.nav.analytics', icon: BarChart2 },
];

export function Header() {
  const location = useLocation();
  const isAdmin = useIsAdmin();
  const nightMode = useUiStore((s) => s.nightMode);
  const toggleNightMode = useUiStore((s) => s.toggleNightMode);
  const { t } = useTranslation();
  const navLinks = useMemo<NavLink[]>(
    () => (isAdmin ? [...BASE_NAV_LINKS, ...ADMIN_NAV_LINKS] : BASE_NAV_LINKS),
    [isAdmin],
  );

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
        title={t(connected ? 'header.connection.connected' : 'header.connection.disconnected')}
      >
        <div
          className={`w-1.5 h-1.5 rounded-full transition-colors ${
            connected ? 'bg-success' : 'bg-error'
          }`}
        />
        <span className="text-xs text-text-muted hidden lg:block">
          {t(connected ? 'header.connection.live' : 'header.connection.offline')}
        </span>
      </div>
    );
  }

  return (
    <header className="h-14 border-b border-space-border bg-space-bg/95 backdrop-blur-md sticky top-0 z-40 grid grid-cols-[auto_1fr_auto] items-center px-6 gap-6 flex-shrink-0">
      {/* Left — Logo */}
      <Link to="/" className="flex items-center flex-shrink-0" aria-label="AstroStack — home">
        <Logo variant="wordmark" size={28} className="hidden sm:inline-flex" />
        <Logo variant="mark" size={28} className="sm:hidden" />
      </Link>

      {/* Center — Nav links */}
      <nav className="flex items-center justify-center gap-0.5">
        {navLinks.map(({ to, key, icon: Icon }) => {
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
              <span className="hidden md:block">{t(key)}</span>
            </Link>
          );
        })}
      </nav>

      {/* Right — Connection + Night mode + User menu + Language switcher */}
      <div className="flex items-center gap-4 justify-end">
        <ConnectionDot />
        <button
          type="button"
          onClick={toggleNightMode}
          aria-label={t(nightMode ? 'header.nightMode.disable' : 'header.nightMode.enable')}
          title={t(nightMode ? 'header.nightMode.disable' : 'header.nightMode.enable')}
          className={`
            flex items-center justify-center w-7 h-7 rounded-md
            transition-colors duration-150
            ${nightMode
              ? 'text-error hover:text-error/80 hover:bg-error/10'
              : 'text-text-muted hover:text-text-secondary hover:bg-white/4'
            }
          `}
        >
          {nightMode ? <Sun size={14} /> : <Moon size={14} />}
        </button>
        <LanguageSwitcher />
        <UserMenu />
      </div>
    </header>
  );
}