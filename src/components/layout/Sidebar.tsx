import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  LayoutDashboard,
  BookOpen,
  Settings,
  ChevronRight,
  Activity,
  Wifi,
  WifiOff,
} from 'lucide-react';
import { useUiStore } from '../../store/uiStore';
import { useSettingsStore } from '../../store/settingsStore';
import { listSessions } from '../../services/sessions';
import { StatusBadge } from '../ui/StatusBadge';
import type { SessionRead } from '../../types';
import api from '../../lib/axios';
import { useEffect, useState } from 'react';

function RecentSessionItem({ session }: { session: SessionRead }) {
  const location = useLocation();
  const isActive = location.pathname === `/sessions/${session.id}`;

  return (
    <Link
      to={`/sessions/${session.id}`}
      className={`
        flex items-center gap-2 px-3 py-2 rounded-md text-sm transition-all duration-150 group
        ${isActive
          ? 'bg-primary-muted text-text-primary border border-primary/20'
          : 'text-text-muted hover:text-text-secondary hover:bg-space-elevated'
        }
      `}
    >
      <span className="flex-1 truncate font-medium">{session.name}</span>
      <StatusBadge status={session.status} size="sm" />
      <ChevronRight size={12} className="opacity-0 group-hover:opacity-60 flex-shrink-0 transition-opacity" />
    </Link>
  );
}

function useConnectionStatus() {
  const [online, setOnline] = useState<boolean | null>(null);
  const { apiBaseUrl } = useSettingsStore();

  useEffect(() => {
    let cancelled = false;
    const check = async () => {
      try {
        await api.get('/health', { timeout: 4000 });
        if (!cancelled) setOnline(true);
      } catch {
        if (!cancelled) setOnline(false);
      }
    };
    check();
    const id = setInterval(check, 30_000);
    return () => { cancelled = true; clearInterval(id); };
  }, [apiBaseUrl]);

  return online;
}

export function Sidebar() {
  const { sidebarOpen } = useUiStore();
  const location = useLocation();
  const navigate = useNavigate();
  const connectionOk = useConnectionStatus();

  const { data: sessionsData } = useQuery({
    queryKey: ['sessions', { page: 1, page_size: 8 }],
    queryFn: () => listSessions({ page: 1, page_size: 8 }),
    staleTime: 15_000,
  });

  const recent = sessionsData?.items ?? [];
  const active = recent.filter(
    (s) => s.status === 'processing' || s.status === 'ready'
  );
  const rest = recent.filter(
    (s) => s.status !== 'processing' && s.status !== 'ready'
  );

  const navLinks = [
    { to: '/', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/profiles', label: 'Profiles', icon: BookOpen },
  ];

  return (
    <>
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-20 bg-black/40 lg:hidden"
          onClick={() => useUiStore.getState().setSidebarOpen(false)}
        />
      )}

      <aside
        className={`
          fixed left-0 top-14 bottom-0 z-20 w-60 bg-space-surface border-r border-space-border
          flex flex-col overflow-hidden
          transition-transform duration-300 ease-smooth
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
          lg:relative lg:top-0 lg:translate-x-0
        `}
      >
        <nav className="p-3 border-b border-space-border space-y-0.5">
          {navLinks.map(({ to, label, icon: Icon }) => {
            const isActive = location.pathname === to;
            return (
              <Link
                key={to}
                to={to}
                className={`
                  flex items-center gap-2.5 px-3 py-2 rounded-md text-sm font-medium transition-all duration-150
                  ${isActive
                    ? 'bg-primary-muted text-primary border border-primary/20'
                    : 'text-text-muted hover:text-text-secondary hover:bg-space-elevated'
                  }
                `}
              >
                <Icon size={15} />
                {label}
              </Link>
            );
          })}
        </nav>

        <div className="flex-1 overflow-y-auto p-3 space-y-4">
          {active.length > 0 && (
            <div>
              <div className="flex items-center gap-1.5 px-1 mb-2">
                <Activity size={11} className="text-accent" />
                <span className="text-xs font-semibold text-text-muted uppercase tracking-wider">
                  Active
                </span>
              </div>
              <div className="space-y-0.5">
                {active.map((s) => (
                  <RecentSessionItem key={s.id} session={s} />
                ))}
              </div>
            </div>
          )}

          {rest.length > 0 && (
            <div>
              <div className="flex items-center justify-between px-1 mb-2">
                <span className="text-xs font-semibold text-text-muted uppercase tracking-wider">
                  Recent
                </span>
                <button
                  type="button"
                  onClick={() => navigate('/')}
                  className="text-xs text-text-muted hover:text-text-secondary transition-colors"
                >
                  View all
                </button>
              </div>
              <div className="space-y-0.5">
                {rest.map((s) => (
                  <RecentSessionItem key={s.id} session={s} />
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="p-3 border-t border-space-border space-y-1">
          <div className="flex items-center gap-2 px-3 py-1.5">
            {connectionOk === null ? (
              <span className="w-1.5 h-1.5 rounded-full bg-space-border animate-pulse" />
            ) : connectionOk ? (
              <Wifi size={11} className="text-success" />
            ) : (
              <WifiOff size={11} className="text-error" />
            )}
            <span className={`text-xs ${connectionOk === null ? 'text-text-muted' : connectionOk ? 'text-success' : 'text-error'}`}>
              {connectionOk === null ? 'Checking…' : connectionOk ? 'Connected' : 'Disconnected'}
            </span>
          </div>
          <Link
            to="/settings"
            className={`
              flex items-center gap-2 w-full px-3 py-2 rounded-md text-sm font-medium transition-all duration-150
              ${location.pathname === '/settings'
                ? 'bg-primary-muted text-primary border border-primary/20'
                : 'text-text-muted hover:text-text-secondary hover:bg-space-elevated'
              }
            `}
          >
            <Settings size={15} />
            Settings
          </Link>
        </div>
      </aside>
    </>
  );
}
