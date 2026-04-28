import { useNavigate } from 'react-router-dom';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import { Settings as SettingsIcon, LogOut, User } from 'lucide-react';
import { useAuthStore, useCurrentUser, useIsAdmin } from '../../store/authStore';

/**
 * Top-right account menu.
 *
 * Displays the signed-in user's initials and exposes Sign out plus, for
 * admins only, a shortcut to the Settings page.
 */
export function UserMenu() {
  const navigate = useNavigate();
  const user = useCurrentUser();
  const isAdmin = useIsAdmin();
  const logout = useAuthStore((s) => s.logout);

  if (!user) return null;

  const initials = user.username.slice(0, 2).toUpperCase();
  const handleLogout = () => {
    logout();
    navigate('/', { replace: true });
  };

  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>
        <button
          type="button"
          aria-label="User menu"
          className="
            flex items-center justify-center w-8 h-8 rounded-full
            bg-primary/10 border border-primary/20 text-primary text-xs font-semibold
            hover:bg-primary/15 hover:border-primary/30
            focus:outline-none focus:ring-1 focus:ring-primary/40
            transition-colors duration-150
          "
        >
          {initials}
        </button>
      </DropdownMenu.Trigger>

      <DropdownMenu.Portal>
        <DropdownMenu.Content
          align="end"
          sideOffset={6}
          className="
            min-w-[200px] bg-space-surface border border-space-border rounded-md
            shadow-lg overflow-hidden z-50
            animate-in fade-in-0 zoom-in-95
          "
        >
          <div className="px-3 py-2 border-b border-space-border/60">
            <div className="text-sm font-medium text-text-primary truncate">
              {user.username}
            </div>
            <div className="text-[11px] text-text-muted">
              {isAdmin ? 'Administrator' : 'Astronomer'}
            </div>
          </div>

          <DropdownMenu.Item
            onSelect={() => navigate('/profile')}
            className="
              flex items-center gap-2 px-3 py-2 text-sm text-text-secondary
              cursor-pointer select-none outline-none
              hover:bg-white/4 focus:bg-white/4
            "
          >
            <User size={13} />
            <span>Profile</span>
          </DropdownMenu.Item>

          {isAdmin && (
            <DropdownMenu.Item
              onSelect={() => navigate('/settings')}
              className="
                flex items-center gap-2 px-3 py-2 text-sm text-text-secondary
                cursor-pointer select-none outline-none
                hover:bg-white/4 focus:bg-white/4
              "
            >
              <SettingsIcon size={13} />
              <span>Settings</span>
            </DropdownMenu.Item>
          )}

          <DropdownMenu.Separator className="h-px bg-space-border/60" />

          <DropdownMenu.Item
            onSelect={handleLogout}
            className="
              flex items-center gap-2 px-3 py-2 text-sm text-text-secondary
              cursor-pointer select-none outline-none
              hover:bg-white/4 focus:bg-white/4
            "
          >
            <LogOut size={13} />
            <span>Sign out</span>
          </DropdownMenu.Item>
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}
