import { Link } from 'react-router-dom';
import { Calendar, GraduationCap, Images, LogIn, Moon, Sun } from 'lucide-react';
import { Logo } from '../branding/Logo';
import { useUiStore } from '../../store/uiStore';

/**
 * Slim header for anonymous routes (Landing, Gallery, Login).
 *
 * Mirrors the visual language of the authed {@link Header} but exposes only
 * the brand and the two anonymous calls to action: browse the public gallery
 * and sign in.
 */
export function PublicHeader() {
  const nightMode = useUiStore((s) => s.nightMode);
  const toggleNightMode = useUiStore((s) => s.toggleNightMode);
  return (
    <header className="h-14 border-b border-space-border bg-space-bg/95 backdrop-blur-md sticky top-0 z-40 flex items-center px-6 gap-6 flex-shrink-0">
      <Link
        to="/"
        className="flex items-center flex-shrink-0"
        aria-label="AstroStack — home"
      >
        <Logo variant="wordmark" size={28} className="hidden sm:inline-flex" />
        <Logo variant="mark" size={28} className="sm:hidden" />
      </Link>

      <div className="flex-1" />

      <nav className="flex items-center gap-1.5">
        <Link
          to="/prepare"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded text-sm text-text-secondary hover:text-text-primary hover:bg-white/5 transition-colors"
        >
          <Calendar size={14} />
          <span className="hidden sm:inline">Plan</span>
        </Link>
        <Link
          to="/learn"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded text-sm text-text-secondary hover:text-text-primary hover:bg-white/5 transition-colors"
        >
          <GraduationCap size={14} />
          <span className="hidden sm:inline">Learn</span>
        </Link>
        <Link
          to="/gallery"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded text-sm text-text-secondary hover:text-text-primary hover:bg-white/5 transition-colors"
        >
          <Images size={14} />
          <span className="hidden sm:inline">Gallery</span>
        </Link>
        <button
          type="button"
          onClick={toggleNightMode}
          aria-label={nightMode ? 'Disable night mode' : 'Enable night mode'}
          title={nightMode ? 'Disable night mode' : 'Enable night mode'}
          className={`
            flex items-center justify-center w-7 h-7 rounded-md
            transition-colors duration-150
            ${nightMode
              ? 'text-error hover:text-error/80 hover:bg-error/10'
              : 'text-text-muted hover:text-text-secondary hover:bg-white/5'
            }
          `}
        >
          {nightMode ? <Sun size={14} /> : <Moon size={14} />}
        </button>
        <Link
          to="/login"
          className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-md text-sm font-medium bg-primary/15 border border-primary/30 text-primary hover:bg-primary/20 transition-colors"
        >
          <LogIn size={14} />
          <span>Sign in</span>
        </Link>
      </nav>
    </header>
  );
}
