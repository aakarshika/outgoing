import { Plus, User } from 'lucide-react';
import type React from 'react';
import { Link } from 'react-router-dom';

import { ComicButton } from '@/components/ui/ComicButton';

type DashboardLink = {
  label: string;
  to?: string;
  icon?: React.ComponentType<any>;
  type?: string;
  indent?: number;
};

type SidebarUser = {
  username: string;
  first_name: string;
  last_name: string;
  avatar?: string | null;
} | null;

interface NavbarSidebarProps {
  isOpen: boolean;
  isAuthenticated: boolean;
  user: SidebarUser;
  dashboardLinks: DashboardLink[];
  currentPath: string;
  onClose: () => void;
  onOpenQuickCreate: () => void;
  onCreateService: () => void;
  onLogout: () => void;
}

export function NavbarSidebar({
  isOpen,
  isAuthenticated,
  user,
  dashboardLinks,
  currentPath,
  onClose,
  onOpenQuickCreate,
  onCreateService,
  onLogout,
}: NavbarSidebarProps) {
  return (
    <>
      {isOpen && (
        <button
          type="button"
          aria-label="Close sidebar"
          className="fixed inset-0 top-16 z-40 bg-black/40"
          onClick={onClose}
        />
      )}
      <aside
        className={`fixed right-0 top-16 z-50 h-[calc(100vh-4rem)] w-[22rem] max-w-[85vw] border-l-2 border-dashed border-gray-300 p-5 transition-transform duration-200 overflow-y-auto ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
        style={{
          background: '#f4f1ea',
          backgroundImage: 'radial-gradient(#d1d5db 0.5px, transparent 0.5px)',
          backgroundSize: '12px 12px',
        }}
      >
        {isAuthenticated && (
          <div className="mb-6 border-b-2 border-dashed border-gray-300 pb-6">
            <ComicButton
              type="button"
              variant="solid"
              size="default"
              shape="square"
              Icon={Plus}
              iconProps={{ strokeWidth: 3 }}
              color="#1e3a5f"
              accentColor="#AF90F9"
              onClick={onOpenQuickCreate}
              className="h-12 w-full"
            >
              Create Event
            </ComicButton>
            <ComicButton
              type="button"
              variant="solid"
              size="default"
              shape="square"
              Icon={Plus}
              iconProps={{ strokeWidth: 3 }}
              accentColor="#00CCCC"
              color="#1e3a5f"
              onClick={onCreateService}
              className="h-12 w-full mt-4"
            >
              Create Service
            </ComicButton>
          </div>
        )}
        {isAuthenticated ? (
          <div>
            {/* User Details Header */}
            <div className="mb-6 relative group">
              <div
                className="absolute -inset-2 bg-yellow-200/40 border-2 border-dashed border-gray-400 -rotate-2 group-hover:rotate-0 transition-transform"
                style={{ borderRadius: '4px' }}
              />
              <Link
                to={user?.username ? `/user/${user.username}` : '#'}
                className="relative flex cursor-pointer items-center gap-4 p-2 bg-white/40 border border-gray-200"
              >
                <div className="w-16 h-16 rounded-none border-2 border-gray-800 bg-white overflow-hidden shadow-[2px_2px_0] p-1 rotate-3">
                  {user?.avatar ? (
                    <img
                      src={user.avatar}
                      alt={user.username}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                      <User className="h-8 w-8 text-gray-400" />
                    </div>
                  )}
                </div>
                <div>
                  <h3
                    className="text-xl text-gray-900 leading-tight"
                    style={{ fontFamily: '"Permanent Marker", cursive' }}
                  >
                    {user
                      ? `${user.first_name} ${user.last_name}`
                      : 'Logged In'}
                  </h3>
                  <p
                    className="text-gray-500 text-sm"
                    style={{
                      fontFamily: '"Caveat", cursive',
                      fontSize: '1.2rem',
                    }}
                  >
                    @{user?.username}
                  </p>
                </div>
              </Link>
              {/* Washi tape accent */}
              <div
                className="absolute -top-3 -left-2 w-12 h-6 pointer-events-none z-10"
                style={{
                  background: 'rgba(59, 130, 246, 0.4)',
                  transform: 'rotate(-15deg)',
                  border: '1px solid rgba(0,0,0,0.05)',
                }}
              />
            </div>

            <div className="grid gap-1 ml-2">
              {dashboardLinks.map((item) => {
                if (item.type === 'heading') {
                  if (!item.to) {
                    return (
                      <p
                        key={item.label}
                        className="mb-3 mt-5 text-sm uppercase tracking-wider text-gray-600"
                        style={{
                          fontFamily: '"Permanent Marker"',
                          transform: 'rotate(-1deg)',
                        }}
                      >
                        {item.label}
                      </p>
                    );
                  }

                  const Icon = item.icon;

                  return (
                    <Link
                      key={item.label}
                      to={item.to}
                      className="flex items-center gap-2.5 rounded-sm px-3 py-2 text-base transition-all hover:bg-yellow-200/60 hover:translate-x-1 text-gray-700"
                      style={{
                        fontFamily: '"Caveat", cursive',
                        fontSize: '1.15rem',
                      }}
                    >
                      {Icon ? <Icon className="h-4 w-4 shrink-0" /> : null}
                      {item.label}
                    </Link>
                  );
                }

                const Icon = item.icon;

                return (
                  <Link
                    key={item.label}
                    to={item.to ?? ''}
                    className={`flex items-center gap-2.5 rounded-sm px-3 py-2 text-base transition-all hover:bg-yellow-200/60 hover:translate-x-1 ${
                      currentPath === item.to
                        ? 'bg-yellow-300/50 -rotate-1 border-l-4 border-yellow-500 font-bold'
                        : 'text-gray-700'
                    }`}
                    style={{
                      fontFamily: '"Caveat", cursive',
                      fontSize: '1.15rem',
                    }}
                  >
                    {Icon ? <Icon className="h-4 w-4 shrink-0" /> : null}
                    {item.label}
                  </Link>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="mb-5 border-b-2 border-dashed border-gray-300 pb-5">
            <p
              className="mb-3 text-sm uppercase tracking-wider text-gray-600"
              style={{
                fontFamily: '"Permanent Marker"',
                transform: 'rotate(-1deg)',
              }}
            >
              Account
            </p>
            <div className="grid gap-2">
              <Link
                to="/signin"
                className="flex items-center gap-2.5 rounded-sm px-3 py-2 text-base transition-all hover:bg-yellow-200/60 hover:translate-x-1 text-gray-700"
                style={{
                  fontFamily: '"Caveat", cursive',
                  fontSize: '1.25rem',
                }}
              >
                Sign In
              </Link>
              <Link
                to="/signup"
                className="flex items-center gap-2.5 rounded-sm px-3 py-2 text-base transition-all hover:bg-yellow-200/60 hover:translate-x-1 text-gray-700"
                style={{
                  fontFamily: '"Caveat", cursive',
                  fontSize: '1.25rem',
                }}
              >
                Sign Up
              </Link>
            </div>
          </div>
        )}
        {isAuthenticated && (
          <button
            onClick={onLogout}
            className="w-full rounded-none border-2 border-gray-800 bg-white px-4 py-2 text-gray-800 shadow-[2px_3px_0px_#333] transition-all hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[1px_1px_0px_#333] hover:bg-red-100"
            style={{ fontFamily: '"Permanent Marker"', fontSize: '0.9rem' }}
          >
            Logout
          </button>
        )}
      </aside>
    </>
  );
}

