/** Alerts page — actionable reminders derived from DB state. */

import { LayoutList, Paperclip, Pin, Sparkles, Star } from 'lucide-react';
import React from 'react';
import { Link } from 'react-router-dom';

import { Button } from '@/components/ui/button';
import { TinyBusinessCard } from '@/components/ui/TinyBusinessCard';
import { VendorBusinessCard } from '@/components/ui/VendorBusinessCard';
import { ScrapbookEventCardLandscape } from '@/features/events/ScrapbookEventCardLandscape';
import { useAlerts } from '@/features/alerts/hooks';
import type { AppAlert, AlertPriority } from '@/types/alerts';

const PRIORITY_STYLES: Record<AlertPriority, string> = {
  high: 'bg-red-200 border-2 border-red-800 text-red-900 shadow-[2px_2px_0px_#991b1b]',
  medium:
    'bg-amber-200 border-2 border-amber-800 text-amber-900 shadow-[2px_2px_0px_#92400e]',
  low: 'bg-blue-200 border-2 border-blue-800 text-blue-900 shadow-[2px_2px_0px_#1e40af]',
};

type AlertCategory = 'events' | 'vendors' | 'applications' | 'other';

const CATEGORY_LABELS: Record<AlertCategory, string> = {
  events: 'Events',
  vendors: 'Vendors',
  applications: 'Applications',
  other: 'Misc',
};

function getAlertCategory(alert: AppAlert): AlertCategory {
  const t = alert.type.toLowerCase();
  if (t.includes('event')) return 'events';
  if (t.includes('vendor')) return 'vendors';
  if (t.includes('application') || t.includes('application')) return 'applications';
  return 'other';
}

function AlertTabs({
  alerts,
  active,
  onChange,
}: {
  alerts: AppAlert[];
  active: AlertCategory | 'all';
  onChange: (value: AlertCategory | 'all') => void;
}) {
  const categoriesPresent = new Set<AlertCategory>();
  alerts.forEach((a) => categoriesPresent.add(getAlertCategory(a)));

  const tabs: Array<{ id: AlertCategory | 'all'; label: string; icon?: React.ReactNode }> = [
    { id: 'all', label: 'All alerts', icon: <LayoutList className="w-3 h-3" /> },
  ];

  (['events', 'vendors', 'applications', 'other'] as AlertCategory[]).forEach((cat) => {
    if (categoriesPresent.has(cat)) {
      tabs.push({
        id: cat,
        label: CATEGORY_LABELS[cat],
      });
    }
  });

  if (tabs.length === 1) return null;

  return (
    <div className="mb-6 flex gap-2 overflow-x-auto pb-1">
      {tabs.map((tab) => {
        const isActive = tab.id === active;
        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => onChange(tab.id)}
            className={`relative flex items-center gap-1.5 rounded-full border-2 border-gray-900 px-3 py-1.5 text-xs font-semibold shadow-[2px_2px_0px_rgba(15,23,42,0.9)] transition-all ${isActive
              ? 'bg-yellow-200 text-gray-900'
              : 'bg-white/90 text-gray-700 hover:bg-yellow-100'
              }`}
            style={{
              transform: `rotate(${isActive ? -1 : 1}deg)`,
            }}
          >
            <span className="absolute -top-1 -left-1 h-1.5 w-5 rounded-full bg-pink-300/80" />
            {tab.icon}
            <span>{tab.label}</span>
          </button>
        );
      })}
    </div>
  );
}

function PrioritySticker({ priority }: { priority: AlertPriority }) {
  return (
    <span
      className={`rounded-sm px-3 py-1 text-xs font-bold uppercase tracking-widest inline-block ${PRIORITY_STYLES[priority]
        }`}
      style={{ fontFamily: '"Permanent Marker", cursive', transform: 'rotate(4deg)' }}
    >
      {priority}
    </span>
  );
}

function DraftEventAlert({ alert }: { alert: AppAlert }) {
  const event = alert.meta?.event;

  if (!event) {
    return (
      <GenericAlertCard
        alert={alert}
        accent="bg-yellow-100 border-yellow-800 shadow-[2px_2px_0px_#854d0e] text-yellow-900"
        badgeContent="Draft not published"
      />
    );
  }

  return (
    <div className="relative mt-4 mb-2 pb-2">
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20 flex items-center justify-center pointer-events-none"
        style={{ transform: 'translate(-50%, -50%) rotate(-3deg)' }}
      >
        <div className="bg-red-500 text-white font-bold px-6 py-2 shadow-[4px_4px_0px_#991b1b] border-4 border-red-800 tracking-widest text-lg md:text-xl uppercase whitespace-nowrap" style={{ fontFamily: '"Permanent Marker", cursive' }}>
          DRAFT NOT PUBLISHED
        </div>
      </div>

      <div className="relative opacity-70 hover:opacity-100 transition-opacity grayscale hover:grayscale-0">
        <ScrapbookEventCardLandscape event={event} isBasicEventCard />
      </div>
    </div>
  );
}

function VendorRequestsAlert({ alert }: { alert: AppAlert }) {
  const event = alert.meta?.event;
  const vendor = alert.meta?.vendor;

  if (!event || !vendor) {
    return (
      <GenericAlertCard
        alert={alert}
        accent="bg-teal-100 border-teal-800 shadow-[2px_2px_0px_#115e59] text-teal-900"
        badgeContent="Vendor requests"
      />
    );
  }

  return (
    <div className="relative mt-8">
      <div className="absolute -top-6 right-4 md:right-10 z-20" style={{ transform: 'rotate(4deg)' }}>
        <TinyBusinessCard
          name={vendor.username || vendor.vendor_name || vendor.name}
          avatar={vendor.avatar || ''}
          subtitle="Pending Request"
        />
        <div className="absolute -top-3 right-10">
          <Pin className="h-8 w-8 fill-blue-400 text-blue-900 rotate-12" />
        </div>
      </div>
      <div className="pt-2">
        <ScrapbookEventCardLandscape event={event} isBasicEventCard />
      </div>
    </div>
  );
}

function ApplicationsAlert({ alert }: { alert: AppAlert }) {
  const event = alert.meta?.event;
  const vendor = alert.meta?.vendor;

  if (!event || !vendor) {
    return (
      <GenericAlertCard
        alert={alert}
        accent="bg-indigo-100 border-indigo-800 shadow-[2px_2px_0px_#3730a3] text-indigo-900"
        badgeContent="Applications"
      />
    );
  }

  return (
    <div className="relative mt-6 lg:mt-8">
      <div className="flex flex-col lg:flex-row items-center lg:items-start gap-4 lg:gap-8 relative">
        <div className="lg:w-2/5 relative z-20 shrink-0 w-full max-w-sm mx-auto shadow-2xl">
          <div className="absolute -top-6 -left-4 z-30 bg-yellow-300 px-4 py-1 font-bold border-2 border-gray-800 shadow-[2px_2px_0px_#333] text-gray-900 text-sm tracking-wide" style={{ transform: 'rotate(-4deg)', fontFamily: '"Permanent Marker", cursive' }}>
            NEW APP!
          </div>
          <VendorBusinessCard vendor={vendor} rotation={-2} />
        </div>
        <div className="lg:flex-1 w-full relative -mt-4 lg:mt-0 lg:-ml-8 z-10 transition-transform hover:scale-[1.02]">
          <ScrapbookEventCardLandscape event={event} isBasicEventCard />
          <div className="absolute -top-4 right-8 z-20 rotate-45 hidden md:block">
            <Paperclip className="h-10 w-10 text-slate-800" />
          </div>
        </div>
      </div>
    </div>
  );
}

function GenericAlertCard({
  alert,
  accent,
  badgeContent,
}: {
  alert: AppAlert;
  accent?: string;
  badgeContent?: string;
}) {
  return (
    <div className="relative space-y-2 mt-4">
      <div
        className={`inline-flex items-center gap-1.5 rounded-sm border-2 px-3 py-1 text-xs font-bold uppercase tracking-wide ${accent || 'bg-slate-200 border-slate-800 text-slate-800 shadow-[2px_2px_0px_#333]'
          }`}
        style={{ fontFamily: '"Permanent Marker", cursive', transform: 'rotate(-2deg)' }}
      >
        <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
        <span>{badgeContent || alert.type.replace(/_/g, ' ')}</span>
      </div>
    </div>
  );
}

function AlertContent({ alert }: { alert: AppAlert }) {
  const t = alert.type.toLowerCase();

  if (t.includes('draft') && t.includes('event')) {
    return <DraftEventAlert alert={alert} />;
  }

  if (t.includes('vendor') && t.includes('request')) {
    return <VendorRequestsAlert alert={alert} />;
  }

  if (t.includes('application')) {
    return <ApplicationsAlert alert={alert} />;
  }

  return <GenericAlertCard alert={alert} />;
}

export default function AlertsPage() {
  const { data: response, isLoading } = useAlerts();
  const alerts = (response?.data || []) as AppAlert[];
  const [activeTab, setActiveTab] = React.useState<AlertCategory | 'all'>('all');

  const visibleAlerts =
    activeTab === 'all'
      ? alerts
      : alerts.filter((a) => getAlertCategory(a) === activeTab);

  return (
    <div
      className="min-h-screen px-4 sm:px-6 py-8"
      style={{
        backgroundColor: '#f4f1ea',
        backgroundImage:
          'radial-gradient(#e5e7eb 0.5px, transparent 0.5px), radial-gradient(#e5e7eb 0.5px, transparent 0.5px)',
        backgroundSize: '14px 14px',
        backgroundPosition: '0 0, 7px 7px',
      }}
    >
      <div className="mx-auto max-w-4xl">
        <div className="relative mb-6">
          <div
            className="absolute -top-2 left-0 h-6 w-28 -rotate-3 bg-yellow-200/80"
            style={{
              border: '1px solid rgba(0,0,0,0.05)',
            }}
          />
          <h1
            className="text-3xl text-gray-900"
            style={{
              fontFamily: '"Permanent Marker", cursive',
              transform: 'rotate(-1deg)',
            }}
          >
            Alerts
          </h1>
          <p
            className="text-gray-500 text-lg mt-1"
            style={{ fontFamily: '"Caveat", cursive', transform: 'rotate(1deg)' }}
          >
            Actionable reminders derived from live DB state.
          </p>
        </div>

        <AlertTabs alerts={alerts} active={activeTab} onChange={setActiveTab} />

        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="h-28 rounded-xl border-2 border-gray-900 bg-white/80 shadow-[3px_3px_0px_rgba(15,23,42,0.8)] animate-pulse"
              />
            ))}
          </div>
        ) : alerts.length === 0 ? (
          <div
            className="bg-white border-2 border-gray-800 p-10 text-center shadow-[4px_4px_0px_#333] relative"
            style={{ transform: 'rotate(0.5deg)' }}
          >
            <Sparkles className="h-10 w-10 mx-auto text-gray-400 mb-3" />
            <h2
              className="text-xl text-gray-900"
              style={{ fontFamily: '"Permanent Marker", cursive' }}
            >
              All caught up
            </h2>
            <p
              className="text-gray-500 text-lg mt-1"
              style={{ fontFamily: '"Caveat", cursive' }}
            >
              No actions pending right now.
            </p>
          </div>
        ) : (
          <div className="space-y-8">
            {visibleAlerts.map((alert, i) => (
              <div
                key={alert.id + i}
                className="relative bg-[#fffdf0] border-4 border-gray-900 p-5 md:p-6 transition-transform hover:-translate-y-1 hover:shadow-[8px_8px_0px_rgba(15,23,42,0.95)]"
                style={{
                  transform: `rotate(${i % 2 === 0 ? 1 : -1}deg)`,
                  boxShadow: '6px 6px 0px rgba(15,23,42,0.9)'
                }}
              >
                <div className="pointer-events-none absolute -top-3 right-6 h-6 w-16 rotate-3 bg-pink-300/80 shadow-sm border border-pink-400" />
                <div className="pointer-events-none absolute -bottom-3 left-6 h-6 w-20 -rotate-3 bg-blue-300/80 shadow-sm border border-blue-400" />

                <div className="flex flex-col gap-4">
                  <div className="flex items-start justify-between gap-3 relative z-30">
                    <div className="pr-20">
                      <h3 className="text-2xl text-gray-900 font-bold leading-tight" style={{ fontFamily: '"Permanent Marker", cursive' }}>{alert.title}</h3>
                      <p className="mt-2 text-gray-800 text-lg leading-snug" style={{ fontFamily: '"Caveat", cursive', fontSize: '1.4rem' }}>{alert.message}</p>
                    </div>
                    <div className="absolute top-0 right-0">
                      <PrioritySticker priority={alert.priority} />
                    </div>
                  </div>

                  <AlertContent alert={alert} />

                  <div className="mt-4 flex justify-end">
                    <Button
                      asChild
                      size="sm"
                      variant="outline"
                      className="border-2 border-gray-900 bg-yellow-300 text-sm font-bold text-gray-900 shadow-[3px_3px_0px_rgba(15,23,42,0.9)] transition-all hover:translate-x-[1px] hover:translate-y-[1px] hover:bg-yellow-400 hover:shadow-[1px_1px_0px_rgba(15,23,42,0.9)] uppercase tracking-wide px-6 py-4"
                      style={{ fontFamily: '"Permanent Marker", cursive', transform: 'rotate(-1deg)' }}
                    >
                      <Link to={alert.cta_route}>{alert.cta_label}</Link>
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
