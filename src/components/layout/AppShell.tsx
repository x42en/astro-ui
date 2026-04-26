import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Header } from './Header';
import { Sidebar } from './Sidebar';
import { ToastContainer } from '../ui/Toast';
import { useUiStore } from '../../store/uiStore';
import { useSettingsStore } from '../../store/settingsStore';

interface AppShellProps {
  children: React.ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  const sidebarOpen = useUiStore((s) => s.sidebarOpen);
  const setJobStatus = useUiStore((s) => s.setJobStatus);
  const queryClient = useQueryClient();

  useEffect(() => {
    const wsBase = useSettingsStore.getState().wsBaseUrl;
    const ws = new WebSocket(`${wsBase}/broadcast`);

    ws.onmessage = (evt) => {
      try {
        const data = JSON.parse(evt.data as string) as { type: string; session_id?: string; job_status?: string; new_status?: string };
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

  return (
    <div className="min-h-screen bg-space-bg flex flex-col">
      <Header />

      <div className="flex flex-1 overflow-hidden">
        <Sidebar />

        <main
          className={`
            flex-1 overflow-y-auto min-w-0
            transition-all duration-300 ease-smooth
            ${sidebarOpen ? 'lg:ml-0' : ''}
          `}
        >
          <div className="p-6 max-w-7xl mx-auto animate-fade-in">
            {children}
          </div>
        </main>
      </div>

      <ToastContainer />
    </div>
  );
}
