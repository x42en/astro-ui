import { useNavigate } from 'react-router-dom';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import { User, Settings as SettingsIcon, LogOut } from 'lucide-react';

/**
 * Placeholder user menu shown in the top-right of the header.
 * Items are stubs until authentication is wired up.
 */
export function UserMenu() {
  const navigate = useNavigate();

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
          AS
        </button>
      </DropdownMenu.Trigger>

      <DropdownMenu.Portal>
        <DropdownMenu.Content
          align="end"
          sideOffset={6}
          className="
            min-w-[180px] bg-space-surface border border-space-border rounded-md
            shadow-lg overflow-hidden z-50
            animate-in fade-in-0 zoom-in-95
          "
        >
          <div className="px-3 py-2 border-b border-space-border/60">
            <div className="text-sm font-medium text-text-primary">Astronomer</div>
            <div className="text-[11px] text-text-muted">Local session</div>
          </div>

          <DropdownMenu.Item
            disabled
            className="
              flex items-center gap-2 px-3 py-2 text-sm text-text-muted
              cursor-not-allowed select-none outline-none
            "
            title="Coming soon"
          >
            <User size={13} />
            <span>Profile</span>
            <span className="ml-auto text-[10px] text-text-muted/70">soon</span>
          </DropdownMenu.Item>

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

          <DropdownMenu.Separator className="h-px bg-space-border/60" />

          <DropdownMenu.Item
            disabled
            className="
              flex items-center gap-2 px-3 py-2 text-sm text-text-muted
              cursor-not-allowed select-none outline-none
            "
            title="Coming soon"
          >
            <LogOut size={13} />
            <span>Sign out</span>
            <span className="ml-auto text-[10px] text-text-muted/70">soon</span>
          </DropdownMenu.Item>
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}
