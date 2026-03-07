/** Dashboard page — My Events, Tickets, Services, Applications tabs. Scrapbook themed. */

import { Calendar, Ticket, Briefcase, FileText, Plus, MapPin } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Box } from '@mui/material';

import { useMyEvents, useMyTickets } from '@/features/events/hooks';
import { useMyServices } from '@/features/vendors/hooks';
import { useMyApplications } from '@/features/needs/hooks';
import { VendorBusinessCard } from '@/components/ui/VendorBusinessCard';
import { Media } from '@/components/ui/media';

type Tab = 'events' | 'tickets' | 'services' | 'applications';

const LIFECYCLE_BADGE_STYLES: Record<string, { bg: string; text: string; border: string }> = {
    draft: { bg: '#fef9c3', text: '#a16207', border: '#facc15' },
    published: { bg: '#dcfce7', text: '#166534', border: '#4ade80' },
    at_risk: { bg: '#fff7ed', text: '#9a3412', border: '#fb923c' },
    postponed: { bg: '#ffedd5', text: '#9a3412', border: '#f97316' },
    event_ready: { bg: '#d1fae5', text: '#065f46', border: '#34d399' },
    live: { bg: '#fef3c7', text: '#92400e', border: '#fbbf24' },
    cancelled: { bg: '#fee2e2', text: '#991b1b', border: '#f87171' },
    completed: { bg: '#f3e8ff', text: '#6b21a8', border: '#c084fc' },
};
const LIFECYCLE_LABELS: Record<string, string> = {
    draft: 'Draft',
    published: 'Published',
    at_risk: 'At Risk',
    postponed: 'Postponed',
    event_ready: 'Event Ready',
    live: 'Live',
    cancelled: 'Cancelled',
    completed: 'Completed',
};

const APPLICATION_STAMPS: Record<string, { color: string; label: string }> = {
    pending: { color: '#f59e0b', label: 'PENDING' },
    accepted: { color: '#22c55e', label: 'ACCEPTED' },
    rejected: { color: '#ef4444', label: 'REJECTED' },
};

const tabs: { key: Tab; label: string; icon: typeof Calendar }[] = [
    { key: 'events', label: 'My Events', icon: Calendar },
    { key: 'tickets', label: 'My Tickets', icon: Ticket },
    { key: 'services', label: 'My Services', icon: Briefcase },
    { key: 'applications', label: 'Applications', icon: FileText },
];

export default function DashboardPage() {
    const [tab, setTab] = useState<Tab>('events');
    const { data: eventsResponse, isLoading: eventsLoading } = useMyEvents();
    const { data: ticketsResponse, isLoading: ticketsLoading } = useMyTickets();
    const { data: servicesResponse, isLoading: servicesLoading } = useMyServices();
    const { data: applicationsResponse, isLoading: applicationsLoading } = useMyApplications();

    const events = eventsResponse?.data || [];
    const tickets = ticketsResponse?.data || [];
    const services = servicesResponse?.data || [];
    const applications = applicationsResponse?.data || [];

    return (
        <div
            className="min-h-screen px-4 sm:px-6 py-8"
            style={{
                background: '#f4f1ea',
                backgroundImage: 'radial-gradient(#d1d5db 0.5px, transparent 0.5px)',
                backgroundSize: '15px 15px',
            }}
        >
            <div className="mx-auto max-w-4xl">
                {/* Title */}
                <div className="relative mb-8">
                    <div
                        className="absolute -top-1 left-0 w-24 h-5 pointer-events-none"
                        style={{ background: 'rgba(251, 191, 36, 0.5)', transform: 'rotate(-3deg)', border: '1px solid rgba(0,0,0,0.05)' }}
                    />
                    <h1
                        className="text-3xl text-gray-900"
                        style={{ fontFamily: '"Permanent Marker", cursive', transform: 'rotate(-1deg)' }}
                    >
                        Dashboard
                    </h1>
                </div>

                {/* Folder Tabs */}
                <div className="flex gap-1 mb-8 overflow-x-auto pb-1">
                    {tabs.map((t) => (
                        <button
                            key={t.key}
                            onClick={() => setTab(t.key)}
                            className={`flex items-center gap-2 px-5 py-2.5 border-2 border-b-0 transition-all whitespace-nowrap ${tab === t.key
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

                {/* ═══════════ MY EVENTS ═══════════ */}
                {tab === 'events' && (
                    <div>
                        {eventsLoading ? (
                            <LoadingSkeleton count={3} />
                        ) : events.length === 0 ? (
                            <EmptyState
                                icon={<Calendar className="h-12 w-12 text-gray-400" />}
                                title="No events yet"
                                subtitle="Create your first event and start hosting!"
                                actionLabel="Create Event"
                                actionTo="/events/create"
                            />
                        ) : (
                            <div className="space-y-3">
                                {events.map((event: any, idx: number) => {
                                    const badge = LIFECYCLE_BADGE_STYLES[event.lifecycle_state] || { bg: '#f3f4f6', text: '#6b7280', border: '#d1d5db' };
                                    return (
                                        <Link
                                            key={event.id}
                                            to={`/events/${event.id}`}
                                            className="flex items-center gap-4 border-2 border-gray-800 bg-white p-4 shadow-[2px_3px_0px_#333] transition-all hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[1px_1px_0px_#333]"
                                            style={{ transform: `rotate(${idx % 2 === 0 ? -0.3 : 0.3}deg)` }}
                                        >
                                            {event.cover_image ? (
                                                <div className="h-16 w-24 flex-shrink-0 border-2 border-white shadow-md overflow-hidden" style={{ transform: 'rotate(-2deg)' }}>
                                                    <Media src={event.cover_image} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                                </div>
                                            ) : (
                                                <div className="h-16 w-24 flex-shrink-0 border-2 border-dashed border-gray-300 flex items-center justify-center bg-gray-50">
                                                    <Calendar className="h-6 w-6 text-gray-300" />
                                                </div>
                                            )}
                                            <div className="flex-1 min-w-0">
                                                <h3
                                                    className="font-bold text-gray-900 truncate"
                                                    style={{ fontFamily: '"Caveat", cursive', fontSize: '1.2rem' }}
                                                >
                                                    {event.title}
                                                </h3>
                                                <p className="text-gray-500 text-sm" style={{ fontFamily: '"Caveat", cursive' }}>
                                                    {new Date(event.start_time).toLocaleDateString()} · {event.location_name}
                                                </p>
                                            </div>
                                            <span
                                                className="text-xs font-bold px-3 py-1 border-2 whitespace-nowrap"
                                                style={{
                                                    fontFamily: '"Permanent Marker", cursive',
                                                    fontSize: '0.65rem',
                                                    background: badge.bg,
                                                    color: badge.text,
                                                    borderColor: badge.border,
                                                    transform: 'rotate(2deg)',
                                                    boxShadow: '1px 1px 0px rgba(0,0,0,0.2)',
                                                }}
                                            >
                                                {LIFECYCLE_LABELS[event.lifecycle_state] || event.lifecycle_state}
                                            </span>
                                        </Link>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                )}

                {/* ═══════════ MY TICKETS ═══════════ */}
                {tab === 'tickets' && (
                    <div>
                        {ticketsLoading ? (
                            <LoadingSkeleton count={3} />
                        ) : tickets.length === 0 ? (
                            <EmptyState
                                icon={<Ticket className="h-12 w-12 text-gray-400" />}
                                title="No tickets yet"
                                subtitle="Browse events and grab your first ticket!"
                                actionLabel="Browse Events"
                                actionTo="/"
                            />
                        ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                {tickets.map((ticket: any, idx: number) => (
                                    <Link
                                        key={ticket.id}
                                        to={`/events/${ticket.event_summary.id}`}
                                        className="relative group"
                                    >
                                        {/* Event card (background) */}
                                        <div
                                            className="border-2 border-gray-800 bg-white p-3 shadow-[3px_4px_0px_#333] transition-all group-hover:translate-x-[1px] group-hover:translate-y-[1px] group-hover:shadow-[1px_1px_0px_#333]"
                                            style={{ transform: `rotate(${idx % 2 === 0 ? -1 : 1}deg)` }}
                                        >
                                            <div className="aspect-[16/10] bg-gray-100 overflow-hidden border border-gray-200 mb-3">
                                                {ticket.event_summary.cover_image ? (
                                                    <Media src={ticket.event_summary.cover_image} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center">
                                                        <Calendar className="h-8 w-8 text-gray-300" />
                                                    </div>
                                                )}
                                            </div>
                                            <h3
                                                className="font-bold text-gray-900 truncate"
                                                style={{ fontFamily: '"Caveat", cursive', fontSize: '1.15rem' }}
                                            >
                                                {ticket.event_summary.title}
                                            </h3>
                                            <p className="text-gray-500 text-sm flex items-center gap-1" style={{ fontFamily: '"Caveat", cursive' }}>
                                                <MapPin className="h-3 w-3" /> {ticket.event_summary.location_name}
                                            </p>
                                        </div>

                                        {/* Ticket stub overlay */}
                                        <div
                                            className="absolute -top-2 -right-2 z-10 flex border-2 border-gray-800 bg-[#fff9e6] shadow-[2px_2px_0px_#333]"
                                            style={{ transform: 'rotate(5deg)' }}
                                        >
                                            <div className="px-3 py-2 border-r-2 border-dashed border-gray-400 flex flex-col items-center justify-center">
                                                <span className="text-[0.55rem] font-bold text-gray-500 tracking-widest">ADMIT</span>
                                                <span className="text-[0.55rem] font-bold text-gray-500 tracking-widest">ONE</span>
                                            </div>
                                            <div className="px-3 py-2 flex flex-col justify-center">
                                                <span
                                                    className="font-bold text-gray-900"
                                                    style={{ fontFamily: '"Permanent Marker"', fontSize: '0.8rem' }}
                                                >
                                                    ${ticket.price_paid}
                                                </span>
                                                <span className="text-[0.6rem] text-gray-500 capitalize">{ticket.ticket_type}</span>
                                            </div>
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* ═══════════ MY SERVICES ═══════════ */}
                {tab === 'services' && (
                    <div>
                        <div className="flex justify-between items-center mb-6">
                            <h2
                                className="text-xl text-gray-900"
                                style={{ fontFamily: '"Permanent Marker", cursive', transform: 'rotate(-1deg)' }}
                            >
                                My Vendor Services
                            </h2>
                            <Link
                                to="/vendors/create"
                                className="flex items-center gap-1.5 border-2 border-gray-800 bg-green-400 px-4 py-2 text-white shadow-[2px_3px_0px_#333] transition-all hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[1px_1px_0px_#333] hover:bg-green-500"
                                style={{ fontFamily: '"Permanent Marker"', fontSize: '0.8rem' }}
                            >
                                <Plus className="h-4 w-4" /> New Service
                            </Link>
                        </div>
                        {servicesLoading ? (
                            <LoadingSkeleton count={2} />
                        ) : services.length === 0 ? (
                            <EmptyState
                                icon={<Briefcase className="h-12 w-12 text-gray-400" />}
                                title="No services found"
                                subtitle="You haven't listed any vendor services yet."
                            />
                        ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                {services.map((service: any, idx: number) => {
                                    const serviceApps = applications.filter((app: any) => app.service === service.id);
                                    const acceptedApps = serviceApps.filter((app: any) => app.status === 'accepted');
                                    return (
                                        <div key={service.id} className="relative">
                                            <Box sx={{ transform: `rotate(${idx % 2 === 0 ? -1 : 1}deg)` }}>
                                                <VendorBusinessCard
                                                    vendor={{
                                                        title: service.title,
                                                        vendor_name: service.vendor_name,
                                                        category: service.category,
                                                        portfolio_image: service.portfolio_image,
                                                        avg_rating: service.avg_rating,
                                                        event_count: acceptedApps.length,
                                                        created_at: service.created_at,
                                                    }}
                                                    rotation={idx % 2 === 0 ? -1 : 1}
                                                />
                                            </Box>
                                            {/* Stats badge */}
                                            <div
                                                className="absolute -bottom-2 -right-2 border-2 border-gray-800 bg-blue-100 px-3 py-1 shadow-[1px_1px_0px_#333]"
                                                style={{ transform: 'rotate(3deg)', fontFamily: '"Caveat", cursive', fontSize: '0.9rem' }}
                                            >
                                                {serviceApps.length} apps · {acceptedApps.length} hired
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                )}

                {/* ═══════════ MY APPLICATIONS ═══════════ */}
                {tab === 'applications' && (
                    <div>
                        <h2
                            className="text-xl text-gray-900 mb-6"
                            style={{ fontFamily: '"Permanent Marker", cursive', transform: 'rotate(-1deg)' }}
                        >
                            Need Applications
                        </h2>
                        {applicationsLoading ? (
                            <LoadingSkeleton count={3} />
                        ) : applications.length === 0 ? (
                            <EmptyState
                                icon={<FileText className="h-12 w-12 text-gray-400" />}
                                title="No applications"
                                subtitle="You haven't responded to any event needs yet."
                            />
                        ) : (
                            <div className="space-y-4">
                                {applications.map((app: any, idx: number) => {
                                    const stamp = APPLICATION_STAMPS[app.status] || APPLICATION_STAMPS.pending;
                                    return (
                                        <Link
                                            to={`/events/${app.event_id}`}
                                            key={app.id}
                                            className="block relative border-2 border-gray-800 bg-[#fdfdfd] p-5 shadow-[2px_3px_0px_#333] transition-all hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[1px_1px_0px_#333]"
                                            style={{
                                                backgroundImage: 'linear-gradient(to right, rgba(0,0,0,0.02) 1px, transparent 1px)',
                                                backgroundSize: '20px 20px',
                                                transform: `rotate(${idx % 2 === 0 ? -0.3 : 0.3}deg)`,
                                            }}
                                        >
                                            {/* HELP WANTED header */}
                                            <div className="border-b-2 border-gray-800 pb-1 mb-3">
                                                <h3
                                                    className="font-black uppercase text-gray-900"
                                                    style={{ fontFamily: '"Playfair Display", serif', fontSize: '1rem', letterSpacing: '0.5px' }}
                                                >
                                                    HELP WANTED: {app.need_title}
                                                </h3>
                                            </div>
                                            <p className="text-gray-500 mb-1" style={{ fontFamily: '"Caveat", cursive', fontSize: '1.1rem' }}>
                                                For: <span className="font-bold text-gray-800">{app.event_title}</span>
                                            </p>
                                            {app.proposed_price && (
                                                <p className="font-bold text-green-600 mb-1" style={{ fontFamily: '"Permanent Marker"', fontSize: '0.95rem' }}>
                                                    Proposed: ${app.proposed_price}
                                                </p>
                                            )}
                                            <p
                                                className="text-gray-500 line-clamp-2"
                                                style={{ fontFamily: 'serif', fontStyle: 'italic', fontSize: '0.9rem', lineHeight: 1.5 }}
                                            >
                                                {app.message}
                                            </p>

                                            {/* Rubber stamp */}
                                            <div
                                                className="absolute top-3 right-3 px-3 py-1 border-3 font-bold uppercase tracking-widest"
                                                style={{
                                                    fontFamily: '"Permanent Marker"',
                                                    fontSize: '0.7rem',
                                                    color: stamp.color,
                                                    border: `3px solid ${stamp.color}`,
                                                    transform: 'rotate(-8deg)',
                                                    opacity: 0.8,
                                                }}
                                            >
                                                {stamp.label}
                                            </div>
                                        </Link>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}

/* ── Shared components ── */

function LoadingSkeleton({ count }: { count: number }) {
    return (
        <div className="space-y-3">
            {Array.from({ length: count }).map((_, i) => (
                <div key={i} className="h-20 border-2 border-dashed border-gray-300 bg-white/50 animate-pulse" />
            ))}
        </div>
    );
}

function EmptyState({
    icon,
    title,
    subtitle,
    actionLabel,
    actionTo,
}: {
    icon: React.ReactNode;
    title: string;
    subtitle: string;
    actionLabel?: string;
    actionTo?: string;
}) {
    return (
        <div className="text-center py-16 border-2 border-dashed border-gray-400 bg-white/30">
            <div className="mx-auto mb-4">{icon}</div>
            <h3
                className="text-xl text-gray-900 mb-1"
                style={{ fontFamily: '"Permanent Marker", cursive' }}
            >
                {title}
            </h3>
            <p
                className="text-gray-500 mb-4"
                style={{ fontFamily: '"Caveat", cursive', fontSize: '1.15rem' }}
            >
                {subtitle}
            </p>
            {actionLabel && actionTo && (
                <Link
                    to={actionTo}
                    className="inline-flex items-center gap-1.5 border-2 border-gray-800 bg-blue-400 px-5 py-2.5 text-white shadow-[2px_3px_0px_#333] transition-all hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[1px_1px_0px_#333] hover:bg-blue-500"
                    style={{ fontFamily: '"Permanent Marker"', fontSize: '0.9rem' }}
                >
                    {actionLabel}
                </Link>
            )}
        </div>
    );
}
