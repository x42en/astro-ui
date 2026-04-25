import { Telescope, LayoutDashboard, BookOpen, SlidersHorizontal, Menu, X } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { useUiStore } from '../../store/uiStore';

const NAV_LINKS = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/profiles', label: 'Profiles', icon: BookOpen },
];

export function Header() {
  const { sidebarOpen, toggleSidebar, viewMode, setViewMode } = useUiStore();
  const location = useLocation();

  return (
    <header className="h-14 border-b border-space-border bg-space-surface/80 backdrop-blur-md sticky top-0 z-30 flex items-center px-4 gap-4">
      <button
        type="button"
        onClick={toggleSidebar}
        className="text-text-muted hover:text-text-secondary transition-colors p-1.5 rounded hover:bg-space-elevated lg:hidden"
        aria-label={sidebarOpen ? 'Close sidebar' : 'Open sidebar'}
      >
        {sidebarOpen ? <X size={18} /> : <Menu size={18} />}
      </button>

      <Link to="/" className="flex items-center gap-2.5 flex-shrink-0">
        <div className="w-7 h-7 rounded bg-primary/20 border border-primary/30 flex items-center justify-center">
          <Telescope size={14} className="text-primary" />
        </div>
        <span className="font-semibold text-text-primary tracking-tight hidden sm:block">
          Astro<span className="text-gradient-accent">Stack</span>
        </span>
      </Link>

      <nav className="hidden md:flex items-center gap-1 flex-1 justify-center">
        {NAV_LINKS.map(({ to, label, icon: Icon }) => {
          const isActive = location.pathname === to;
          return (
            <Link
              key={to}
              to={to}
              className={`
                flex items-center gap-1.5 px-3 py-1.5 rounded text-sm font-medium transition-all duration-150
                ${isActive
                  ? 'bg-primary-muted text-primary'
                  : 'text-text-muted hover:text-text-secondary hover:bg-space-elevated'
                }
              `}
            >
              <Icon size={14} />
              {label}
            </Link>
          );
        })}
      </nav>

      <div className="ml-auto flex items-center gap-2">
        <div className="flex items-center gap-1 bg-space-elevated border border-space-border rounded p-1">
          <button
            type="button"
            onClick={() => setViewMode('simple')}
            className={`px-2.5 py-1 text-xs font-medium rounded transition-all duration-150 ${
              viewMode === 'simple'
                ? 'bg-primary text-white shadow-sm'
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
                ? 'bg-primary text-white shadow-sm'
                : 'text-text-muted hover:text-text-secondary'
            }`}
          >
            <SlidersHorizontal size={11} />
            Advanced
          </button>
        </div>
      </div>
    </header>
  );
}
