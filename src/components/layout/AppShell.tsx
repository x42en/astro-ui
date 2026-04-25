import { Header } from './Header';
import { Sidebar } from './Sidebar';
import { ToastContainer } from '../ui/Toast';
import { useUiStore } from '../../store/uiStore';

interface AppShellProps {
  children: React.ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  const sidebarOpen = useUiStore((s) => s.sidebarOpen);

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
