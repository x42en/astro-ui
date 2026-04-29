import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { Header } from './Header';
import { PublicHeader } from './PublicHeader';
import { ToastContainer } from '../ui/Toast';
import { ActiveLiveBanner } from '../livestack/ActiveLiveBanner';
import { useUiStore } from '../../store/uiStore';
import { useSettingsStore } from '../../store/settingsStore';
import { useIsAuthenticated } from '../../store/authStore';

interface AppShellProps {
  children: React.ReactNode;
}

/** Routes rendered without any chrome (full-bleed). */
const CHROMELESS_ROUTES = new Set<string>(['/login']);

/** Routes that always use the public header, even when signed in. */
const PUBLIC_CHROME_ROUTES = new Set<string>(['/welcome']);

export function AppShell({ children }: AppShellProps) {
  const setJobStatus = useUiStore((s) => s.setJobStatus);
  const queryClient = useQueryClient();
  const location = useLocation();
  const isAuthenticated = useIsAuthenticated();

  useEffect(() => {
    const wsBase = useSettingsStore.getState().wsBaseUrl;
    const ws = new WebSocket(`${wsBase}/broadcast`);

    ws.onmessage = (evt) => {
      try {
        const data = JSON.parse(evt.data as string) as {
          type: string;
          session_id?: string;
          job_status?: string;
          new_status?: string;
        };
        if (data.type === 'session_status' && data.session_id) {
          setJobStatus(data.session_id, data.job_status ?? data.new_status ?? '');
          queryClient.invalidateQueries({ queryKey: ['sessions'] });
        }
      } catch {
        // ignore malformed messages
      }
    };

    ws.onopen = () => {
      const ping = setInterval(() => {
        if (ws.readyState === WebSocket.OPEN) ws.send('ping');
      }, 30000);
      ws.addEventListener('close', () => clearInterval(ping));
    };

    return () => {
      ws.onmessage = null;
      ws.close();
    };
  }, [queryClient, setJobStatus]);

  const path = location.pathname;
  const chromeless = CHROMELESS_ROUTES.has(path);
  const forcePublic = PUBLIC_CHROME_ROUTES.has(path);
  // Anonymous visitors browsing the public gallery get the public header too.
  const usePublicHeader = forcePublic || (!isAuthenticated && path === '/gallery');

  return (
    <div className="min-h-screen bg-space-bg flex flex-col">
      {!chromeless && (usePublicHeader ? <PublicHeader /> : <Header />)}
      {!chromeless && isAuthenticated && <ActiveLiveBanner />}
      <main className="flex-1 min-w-0 overflow-y-auto">
        {children}
      </main>
      <ToastContainer />
    </div>
  );
}
