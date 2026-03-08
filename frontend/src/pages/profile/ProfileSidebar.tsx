import { ChevronRight, Settings, Shield, User } from 'lucide-react';
import { NavLink } from 'react-router-dom';

const navItems = [
  { path: 'user-info', label: 'User Info', icon: User },
  { path: 'settings', label: 'Account Settings', icon: Settings },
  { path: 'privacy', label: 'Privacy', icon: Shield },
];

export const ProfileSidebar = () => {
  return (
    <aside
      className="flex w-56 shrink-0 flex-col border-r-2 border-dashed border-gray-300"
      style={{
        background: '#f4f1ea',
        backgroundImage: 'radial-gradient(#d1d5db 0.5px, transparent 0.5px)',
        backgroundSize: '12px 12px',
      }}
    >
      <div className="border-b-2 border-dashed border-gray-300 px-4 py-5 relative overflow-hidden">
        {/* Washi tape accent */}
        <div
          className="absolute -top-1 left-[10%] w-20 h-6 pointer-events-none"
          style={{
            background: 'rgba(251, 191, 36, 0.5)',
            transform: 'rotate(-5deg)',
            border: '1px solid rgba(0,0,0,0.05)',
          }}
        />
        <h2
          className="text-xl text-gray-900 mt-3"
          style={{
            fontFamily: '"Permanent Marker", cursive',
            transform: 'rotate(-2deg)',
          }}
        >
          Settings
        </h2>
        <p
          className="mt-1 text-gray-500"
          style={{ fontFamily: '"Caveat", cursive', fontSize: '1.1rem' }}
        >
          manage your stuff ✏️
        </p>
      </div>
      <nav className="flex flex-col gap-1 p-3">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `flex items-center gap-2.5 rounded-sm px-3 py-2.5 transition-all ${isActive
                ? 'bg-yellow-300/50 border-l-4 border-yellow-500 font-bold -rotate-1'
                : 'text-gray-600 hover:bg-yellow-200/40 hover:translate-x-1'
              }`
            }
            style={{ fontFamily: '"Caveat", cursive', fontSize: '1.15rem' }}
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
