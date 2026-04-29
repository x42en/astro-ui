import { useNavigate, useLocation } from 'react-router-dom';
import { useActiveLiveSession } from '../../hooks/useActiveLiveSession';

/**
 * Sticky banner shown right under the header when the current user has
 * a live session that hasn't been terminated. Clicking "Reprendre"
 * navigates to the live view. The banner self-hides on the live view
 * itself to avoid the obvious self-reference.
 */
export function ActiveLiveBanner() {
  const { data: session } = useActiveLiveSession();
  const navigate = useNavigate();
  const location = useLocation();

  if (!session) return null;
  // Already on the live view of THIS session: nothing to suggest.
  if (location.pathname === `/sessions/${session.id}/live`) return null;

  const label = session.object_name || session.name;

  return (
    <div className="border-b border-amber-500/40 bg-amber-500/10 text-amber-100 px-6 py-2 flex items-center gap-4 sticky top-14 z-30 backdrop-blur-md">
      <span
        className="inline-block h-2 w-2 rounded-full bg-amber-400 animate-pulse"
        aria-hidden
      />
      <span className="text-sm flex-1 truncate">
        Session live en cours : <strong>{label}</strong>
      </span>
      <button
        type="button"
        onClick={() => navigate(`/sessions/${session.id}/live`)}
        className="px-3 py-1 text-xs font-medium rounded-md bg-amber-500 text-space-bg hover:bg-amber-400 transition-colors"
      >
        Reprendre
      </button>
    </div>
  );
}
