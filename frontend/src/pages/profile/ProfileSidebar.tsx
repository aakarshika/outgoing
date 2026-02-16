import { NavLink } from 'react-router-dom';
import { User, Settings, ChevronRight } from 'lucide-react';

const navItems = [
  { path: 'user-info', label: 'User Info', icon: User },
  { path: 'settings', label: 'Account Settings', icon: Settings },
];

const navLinkBase =
  'flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors';
const navLinkInactive = 'text-muted-foreground hover:bg-muted hover:text-foreground';
const navLinkActive = 'bg-primary text-primary-foreground';

export const ProfileSidebar = () => {
  return (
    <aside className="flex w-56 shrink-0 flex-col border-r border-border bg-muted/30 dark:bg-muted/60">
      <div className="border-b border-border px-4 py-5">
        <h2 className="text-lg font-semibold">Settings</h2>
        <p className="mt-0.5 text-sm text-muted-foreground">Manage your preferences</p>
      </div>
      <nav className="flex flex-col gap-0.5 p-2">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `${navLinkBase} ${isActive ? navLinkActive : navLinkInactive}`
            }
          >
            <item.icon size={18} className="shrink-0" />
            <span className="flex-1">{item.label}</span>
            <ChevronRight size={14} className="shrink-0 opacity-50" />
          </NavLink>
        ))}
      </nav>
    </aside>
  );
};
