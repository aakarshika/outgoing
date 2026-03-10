/** Dashboard page — My Events, Tickets, Services, Activities tabs. Scrapbook themed. Layout component. */

import { Briefcase, Calendar, MessageSquare, Ticket } from 'lucide-react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';

type Tab = 'events' | 'tickets' | 'services' | 'activities';

const tabs: { key: Tab; label: string; icon: any }[] = [
  { key: 'events', label: 'My Events', icon: Calendar },
  { key: 'tickets', label: 'My Tickets', icon: Ticket },
  { key: 'services', label: 'Services', icon: Briefcase },
  { key: 'activities', label: 'My Activities', icon: MessageSquare },
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
    <div
      className="min-h-screen px-4 sm:px-6 py-8"
      style={{
        // background: '#f4f1ea',
        // backgroundImage: 'radial-gradient(#d1d5db 0.5px, transparent 0.5px)',
        // backgroundSize: '15px 15px',
      }}
    >
      <div className="mx-auto max-w-4xl">
        {/* Title */}

        {/* Folder Tabs */}
        <div className="flex gap-1 mb-8 overflow-x-auto pb-1">
          {tabs.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`flex items-center gap-2 px-5 py-2.5 border-2 border-b-0 transition-all whitespace-nowrap ${activeTab === t.key
                  ? 'bg-yellow-300/60 border-gray-800 text-gray-900 -rotate-1 shadow-[2px_-2px_0px_#333] font-bold relative z-10 -mb-[2px]'
                  : 'bg-white/60 border-gray-400 text-gray-500 hover:bg-yellow-100/40 hover:text-gray-700'
                }`}
              style={{ fontFamily: '"Permanent Marker", cursive', fontSize: '0.85rem' }}
            >
              <t.icon className="h-4 w-4" /> {t.label}
            </button>
          ))}
        </div>
        <div className="border-t-2 border-gray-800 -mt-8 mb-6" />

        <Outlet />
      </div>
    </div>
  );
}
