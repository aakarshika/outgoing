/** Dashboard page — My Events, Tickets, Services, Activities tabs. Scrapbook themed. Layout component. */

import { Briefcase, Calendar, Heart, MessageSquare, Ticket } from 'lucide-react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';

type Tab = 'events' | 'saved' | 'tickets' | 'services' | 'activities';

const tabs: { key: Tab; label: string; icon: any }[] = [
  { key: 'saved', label: 'Saved Dates', icon: Heart },
  { key: 'tickets', label: 'My Tickets', icon: Ticket },
  { key: 'events', label: 'My Events', icon: Calendar },
  { key: 'services', label: 'My Services', icon: Briefcase },
  { key: 'activities', label: 'My Activities', icon: MessageSquare },
];

type DashboardNavItem = {
  label: string;
  to?: string;
  icon?: any;
  type?: 'heading';
  indent?: number;
};

const dashboardNavItems: DashboardNavItem[] = [
  { label: 'Going', type: 'heading', indent: 1 },
  { to: '/dashboard/saved', label: 'Saved Dates', icon: Heart, indent: 2 },
  { to: '/dashboard/tickets', label: 'My Tickets', icon: Ticket, indent: 2 },

  { label: 'Activities', type: 'heading', indent: 1 },
  { to: '/dashboard/activities', label: 'My Activities', icon: MessageSquare, indent: 2 },

  { label: 'Organizing', type: 'heading', indent: 1 },
  { to: '/dashboard/events', label: 'My Events', icon: Calendar, indent: 2 },

  { label: 'Services', type: 'heading', indent: 1 },
  { to: '/dashboard/services', label: 'My Services', icon: Briefcase, indent: 2 },
  { to: '/dashboard/services/opportunities', label: 'Service Opportunities', icon: Briefcase, indent: 2 },
];

export default function DashboardPage() {
  const navigate = useNavigate();
  const { pathname } = useLocation();

  // Determine active tab from pathname
  const tabMatch = pathname.match(/^\/dashboard\/([^/]+)/);
  const activeTab = (tabMatch ? tabMatch[1] : 'events') as Tab;

  const setTab = (newTab: Tab) => {
    navigate(`/dashboard/${newTab}`);
  };

  return (
    <div className="min-h-screen px-4 sm:px-6 py-8">
      <div className="mx-auto max-w-6xl md:grid md:grid-cols-[260px,1fr] md:gap-8">
        {/* Left sidebar – only on medium+ screens */}
        <aside className="hidden md:block">
          <div className="sticky top-24">
            <p
              className="mb-4 text-sm uppercase tracking-wider text-gray-600"
              style={{
                fontFamily: '"Permanent Marker"',
                transform: 'rotate(-1deg)',
              }}
            >
              Dashboard
            </p>
            <div className="flex flex-col gap-1">
              {dashboardNavItems.map((item) => {
                const isHeading = item.type === 'heading';
                const isActive = item.to && pathname.startsWith(item.to);
                const indentClass =
                  item.indent === 2 ? 'ml-4' : item.indent === 3 ? 'ml-8' : '';

                if (isHeading) {
                  return (
                    <p
                      key={item.label}
                      className={`mt-4 mb-1 text-xs uppercase tracking-wider text-gray-600 ${indentClass}`}
                      style={{
                        fontFamily: '"Permanent Marker"',
                        transform: 'rotate(-1deg)',
                      }}
                    >
                      {item.label}
                    </p>
                  );
                }

                if (!item.to) return null;

                return (
                  <button
                    key={item.to}
                    type="button"
                    onClick={() => navigate(item.to!)}
                    className={`flex w-full items-center gap-2 px-4 py-2 border-2 border-b-0 transition-all text-left whitespace-nowrap ${indentClass} ${
                      isActive
                        ? 'bg-yellow-300/60 border-gray-800 text-gray-900 -rotate-1 shadow-[2px_-2px_0px_#333] font-bold relative z-10'
                        : 'bg-white/60 border-gray-300 text-gray-600 hover:bg-yellow-100/40 hover:text-gray-800'
                    }`}
                    style={{ fontFamily: '"Permanent Marker", cursive', fontSize: '0.85rem' }}
                  >
                    {item.icon ? <item.icon className="h-4 w-4" /> : null}
                    {item.label}
                  </button>
                );
              })}
            </div>
          </div>
        </aside>

        {/* Main content column */}
        <div>
          {/* Folder Tabs – only on small screens */}
          <div className="flex gap-1 mb-8 overflow-x-auto pb-1 md:hidden">
            {tabs.map((t) => (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={`flex items-center gap-2 px-5 py-2.5 border-2 border-b-0 transition-all whitespace-nowrap ${
                  activeTab === t.key
                    ? 'bg-yellow-300/60 border-gray-800 text-gray-900 -rotate-1 shadow-[2px_-2px_0px_#333] font-bold relative z-10 -mb-[2px]'
                    : 'bg-white/60 border-gray-400 text-gray-500 hover:bg-yellow-100/40 hover:text-gray-700'
                }`}
                style={{ fontFamily: '"Permanent Marker", cursive', fontSize: '0.85rem' }}
              >
                <t.icon className="h-4 w-4" /> {t.label}
              </button>
            ))}
          </div>

          <div className="border-t-2 border-gray-800 -mt-8 mb-6 md:mt-0" />
          <Outlet />
        </div>
      </div>
    </div>
  );
}
