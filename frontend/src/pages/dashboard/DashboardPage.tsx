/** Dashboard page — My Events, Tickets, Services, Applications tabs. Scrapbook themed. */

import { Box } from '@mui/material';
import { Briefcase, Calendar, MapPin, Plus, Ticket } from 'lucide-react';
import { Edit2 } from 'lucide-react';
import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';

import { EditApplicationModal } from '@/components/events/EditApplicationModal';
import { EventNeedsSummary } from '@/components/events/EventNeedsSummary';
import { TicketManagementModal } from '@/components/events/TicketManagementModal';
import { Media } from '@/components/ui/media';
import { VendorBusinessCard } from '@/components/ui/VendorBusinessCard';
import { useMyEvents, useMyTickets } from '@/features/events/hooks';
import { useMyApplications } from '@/features/needs/hooks';
import { useMyServices } from '@/features/vendors/hooks';

import { OpportunitiesTab } from './OpportunitiesTab';

type Tab = 'events' | 'tickets' | 'services';
type ServiceSubTab = 'my_services' | 'opportunities';

const LIFECYCLE_BADGE_STYLES: Record<
  string,
  { bg: string; text: string; border: string }
> = {
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

const tabs: { key: Tab; label: string; icon: typeof Calendar | typeof Briefcase }[] = [
  { key: 'events', label: 'My Events', icon: Calendar },
  { key: 'tickets', label: 'My Tickets', icon: Ticket },
  { key: 'services', label: 'Services', icon: Briefcase },
];

export default function DashboardPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const tab = (searchParams.get('tab') as Tab) || 'events';
  const serviceSubTab = (searchParams.get('subtab') as ServiceSubTab) || 'my_services';

  const setTab = (newTab: Tab) => {
    const newParams = new URLSearchParams(searchParams);
    newParams.set('tab', newTab);
    setSearchParams(newParams);
  };

  const setServiceSubTab = (newSubTab: ServiceSubTab) => {
    const newParams = new URLSearchParams(searchParams);
    newParams.set('subtab', newSubTab);
    setSearchParams(newParams);
  };

  const [editingApplication, setEditingApplication] = useState<any | null>(null);
  const [managingTicket, setManagingTicket] = useState<any | null>(null);
  const { data: eventsResponse, isLoading: eventsLoading } = useMyEvents();
  const { data: ticketsResponse, isLoading: ticketsLoading } = useMyTickets();
  const { data: servicesResponse, isLoading: servicesLoading } = useMyServices();
  const { data: applicationsResponse } = useMyApplications();

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
            style={{
              background: 'rgba(251, 191, 36, 0.5)',
              transform: 'rotate(-3deg)',
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
                  const badge = LIFECYCLE_BADGE_STYLES[event.lifecycle_state] || {
                    bg: '#f3f4f6',
                    text: '#6b7280',
                    border: '#d1d5db',
                  };
                  return (
                    <div
                      key={event.id}
                      className="flex items-center gap-4 border-2 border-gray-800 bg-white p-4 shadow-[2px_3px_0px_#333] transition-all hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[1px_1px_0px_#333]"
                      style={{ transform: `rotate(${idx % 2 === 0 ? -0.3 : 0.3}deg)` }}
                    >
                      <Link to={`/events/${event.id}`} className="flex-shrink-0 block">
                        {event.cover_image ? (
                          <div
                            className="h-16 w-24 border-2 border-white shadow-md overflow-hidden"
                            style={{ transform: 'rotate(-2deg)' }}
                          >
                            <Media
                              src={event.cover_image}
                              style={{
                                width: '100%',
                                height: '100%',
                                objectFit: 'cover',
                              }}
                            />
                          </div>
                        ) : (
                          <div className="h-16 w-24 border-2 border-dashed border-gray-300 flex items-center justify-center bg-gray-50 text-gray-300 relative group overflow-hidden">
                            <Calendar className="h-6 w-6" />
                          </div>
                        )}
                      </Link>
                      <div className="flex-1 min-w-0">
                        <Link to={`/events/${event.id}`} className="hover:underline">
                          <h3
                            className="font-bold text-gray-900 truncate"
                            style={{
                              fontFamily: '"Caveat", cursive',
                              fontSize: '1.2rem',
                            }}
                          >
                            {event.title}
                          </h3>
                        </Link>
                        <p
                          className="text-gray-500 text-sm"
                          style={{ fontFamily: '"Caveat", cursive' }}
                        >
                          {new Date(event.start_time).toLocaleDateString()} ·{' '}
                          {event.location_name}
                        </p>
                        <EventNeedsSummary eventId={event.id} />
                      </div>
                      <div className="flex flex-col items-end gap-2">
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
                          {LIFECYCLE_LABELS[event.lifecycle_state] ||
                            event.lifecycle_state}
                        </span>
                        <Link
                          to={`/events/${event.id}/manage`}
                          className="text-[0.65rem] font-bold px-3 py-1 border-2 border-gray-800 bg-yellow-300 text-gray-900 transition-colors hover:bg-yellow-400 whitespace-nowrap"
                          style={{
                            fontFamily: '"Permanent Marker", cursive',
                            transform: 'rotate(-1deg)',
                            boxShadow: '1px 1px 0px rgba(0,0,0,0.8)',
                          }}
                        >
                          MANAGE EVENT
                        </Link>
                      </div>
                    </div>
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
                  <div key={ticket.id} className="relative group text-left block">
                    {/* Event card (background) */}
                    <div
                      className="border-2 border-gray-800 bg-white p-3 shadow-[3px_4px_0px_#333] transition-all hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[1px_1px_0px_#333] flex flex-col h-full"
                      style={{ transform: `rotate(${idx % 2 === 0 ? -1 : 1}deg)` }}
                    >
                      <div
                        className="aspect-[16/10] bg-gray-100 overflow-hidden border border-gray-200 mb-3 relative cursor-pointer"
                        onClick={() => setManagingTicket(ticket)}
                      >
                        {ticket.event_summary.cover_image ? (
                          <Media
                            src={ticket.event_summary.cover_image}
                            style={{
                              width: '100%',
                              height: '100%',
                              objectFit: 'cover',
                            }}
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Calendar className="h-8 w-8 text-gray-300" />
                          </div>
                        )}
                        {ticket.status === 'cancelled' && (
                          <div className="absolute inset-0 bg-white/80 flex flex-col items-center justify-center p-2 z-10">
                            <span
                              className="text-red-600 font-bold border-4 border-red-600 px-3 py-1 transform -rotate-12 mb-2 text-xl tracking-widest"
                              style={{ fontFamily: '"Permanent Marker", cursive' }}
                            >
                              CANCELLED
                            </span>
                            <span
                              className="text-sm font-bold text-gray-800"
                              style={{ fontFamily: '"Permanent Marker", cursive' }}
                            >
                              On {new Date(ticket.updated_at).toLocaleDateString()}
                            </span>
                            <span
                              className="text-sm font-bold text-gray-800"
                              style={{ fontFamily: '"Permanent Marker", cursive' }}
                            >
                              Refunded: $
                              {(
                                parseFloat(ticket.price_paid) *
                                (ticket.is_refundable && ticket.refund_percentage
                                  ? ticket.refund_percentage / 100
                                  : 0)
                              ).toFixed(2)}
                            </span>
                          </div>
                        )}
                        {ticket.status === 'used' && (
                          <div className="absolute inset-0 bg-white/30 flex flex-col items-center justify-center p-2 z-10 pointer-events-none">
                            <span
                              className="text-emerald-600 font-bold border-4 border-emerald-600 px-3 py-1 transform -rotate-12 mb-2 text-xl tracking-widest bg-white/80"
                              style={{ fontFamily: '"Permanent Marker", cursive' }}
                            >
                              ADMITTED
                            </span>
                          </div>
                        )}
                      </div>

                      <div
                        className="flex-1 cursor-pointer"
                        onClick={() => setManagingTicket(ticket)}
                      >
                        <h3
                          className="font-bold text-gray-900 truncate"
                          style={{
                            fontFamily: '"Caveat", cursive',
                            fontSize: '1.15rem',
                          }}
                        >
                          {ticket.event_summary.title}
                        </h3>
                        <p
                          className="text-gray-500 text-sm flex items-center gap-1"
                          style={{ fontFamily: '"Caveat", cursive' }}
                        >
                          <MapPin className="h-3 w-3" />{' '}
                          {ticket.event_summary.location_name}
                        </p>
                      </div>

                      <div className="flex gap-2 mt-4 justify-between">
                        <Link
                          to={`/events/${ticket.event_summary.id}`}
                          className="text-[0.65rem] font-bold px-3 py-1.5 border-2 border-gray-800 bg-blue-300 text-gray-900 transition-colors hover:bg-blue-400 whitespace-nowrap text-center flex-1"
                          style={{
                            fontFamily: '"Permanent Marker", cursive',
                            boxShadow: '1px 1px 0px rgba(0,0,0,0.8)',
                          }}
                        >
                          EVENT PAGE
                        </Link>
                        <button
                          onClick={() => setManagingTicket(ticket)}
                          className="text-[0.65rem] font-bold px-3 py-1.5 border-2 border-gray-800 bg-yellow-300 text-gray-900 transition-colors hover:bg-yellow-400 whitespace-nowrap text-center flex-1"
                          style={{
                            fontFamily: '"Permanent Marker", cursive',
                            boxShadow: '1px 1px 0px rgba(0,0,0,0.8)',
                          }}
                        >
                          MANAGE TICKET
                        </button>
                      </div>
                    </div>

                    {/* Ticket stub overlay */}
                    <div
                      className="absolute -top-2 -right-2 z-10 flex border-2 border-gray-800 bg-[#fff9e6] shadow-[2px_2px_0px_#333] pointer-events-none"
                      style={{ transform: 'rotate(5deg)' }}
                    >
                      <div className="px-3 py-2 border-r-2 border-dashed border-gray-400 flex flex-col items-center justify-center">
                        <span className="text-[0.55rem] font-bold text-gray-500 tracking-widest">
                          ADMIT
                        </span>
                        <span className="text-[0.55rem] font-bold text-gray-500 tracking-widest">
                          ONE
                        </span>
                      </div>
                      <div className="px-3 py-2 flex flex-col justify-center">
                        <span
                          className="font-bold text-gray-900"
                          style={{
                            fontFamily: '"Permanent Marker"',
                            fontSize: '0.8rem',
                          }}
                        >
                          ${ticket.price_paid}
                        </span>
                        <span className="text-[0.6rem] text-gray-500 capitalize">
                          {ticket.ticket_type}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ═══════════ SERVICES ═══════════ */}
        {tab === 'services' && (
          <div className="mt-2">
            {/* Washi tape style sub-tabs */}
            <Box
              sx={{
                mb: 4,
                display: 'flex',
                gap: 1,
                borderBottom: '2px dashed #ccc',
                pb: 1,
                overflowX: 'auto',
              }}
            >
              <Box
                onClick={() => setServiceSubTab('my_services')}
                sx={{
                  px: 3,
                  py: 1,
                  cursor: 'pointer',
                  bgcolor: serviceSubTab === 'my_services' ? '#fde047' : 'transparent',
                  border: '2px solid #333',
                  borderBottom: 'none',
                  transition: 'all 0.2s ease',
                  transform: 'rotate(-1deg) translateY(2px)',
                  zIndex: serviceSubTab === 'my_services' ? 2 : 1,
                  '&:hover': { bgcolor: '#fef08a' },
                  fontFamily: '"Permanent Marker", cursive',
                  color: '#111',
                  fontSize: '0.9rem',
                  boxShadow:
                    serviceSubTab === 'my_services' ? '2px -2px 0px #333' : 'none',
                }}
              >
                My Services
              </Box>
              <Box
                onClick={() => setServiceSubTab('opportunities')}
                sx={{
                  px: 3,
                  py: 1,
                  cursor: 'pointer',
                  bgcolor:
                    serviceSubTab === 'opportunities' ? '#93c5fd' : 'transparent',
                  border: '2px solid #333',
                  borderBottom: 'none',
                  transition: 'all 0.2s ease',
                  transform: 'rotate(1deg) translateY(2px)',
                  zIndex: serviceSubTab === 'opportunities' ? 2 : 1,
                  '&:hover': { bgcolor: '#bfdbfe' },
                  fontFamily: '"Permanent Marker", cursive',
                  color: '#111',
                  fontSize: '0.9rem',
                  boxShadow:
                    serviceSubTab === 'opportunities' ? '2px -2px 0px #333' : 'none',
                }}
              >
                Opportunities Feed
              </Box>
            </Box>

            {serviceSubTab === 'my_services' && (
              <div className="space-y-12">
                <div className="flex justify-between items-start">
                  <h2
                    className="text-xl text-gray-900"
                    style={{
                      fontFamily: '"Permanent Marker", cursive',
                      transform: 'rotate(-1deg)',
                    }}
                  >
                    My Vendor Portfolio
                  </h2>
                  <Link
                    to="/vendors/create"
                    className="inline-flex items-center gap-1.5 border-2 border-gray-800 bg-green-400 px-4 py-2 text-white shadow-[2px_3px_0px_#333] transition-all hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[1px_1px_0px_#333] hover:bg-green-500"
                    style={{ fontFamily: '"Permanent Marker"', fontSize: '0.85rem' }}
                  >
                    <Plus className="h-4 w-4" /> Add New Service
                  </Link>
                </div>

                {servicesLoading ? (
                  <LoadingSkeleton count={2} />
                ) : services.length === 0 ? (
                  <EmptyState
                    icon={<Briefcase className="h-12 w-12 text-gray-400" />}
                    title="Welcome, Vendor!"
                    subtitle="List your first service to start seeing tailored opportunities."
                    actionLabel="Add Service"
                    actionTo="/vendors/create"
                  />
                ) : (
                  <div className="space-y-12">
                    {services.map((service: any, idx: number) => {
                      const serviceApps = applications.filter(
                        (app: any) => app.service === service.id,
                      );
                      return (
                        <div key={service.id} className="relative">
                          <Box
                            sx={{
                              mb: 2,
                              transform: `rotate(${idx % 2 === 0 ? -0.5 : 0.5}deg)`,
                            }}
                          >
                            <VendorBusinessCard
                              vendor={{
                                title: service.title,
                                vendor_name: service.vendor_name,
                                category: service.category,
                                portfolio_image: service.portfolio_image,
                                avg_rating: service.avg_rating,
                                event_count: serviceApps.filter(
                                  (a: any) => a.status === 'accepted',
                                ).length,
                                created_at: service.created_at,
                              }}
                              rotation={idx % 2 === 0 ? -0.5 : 0.5}
                              onClick={() => navigate(`/services/${service.id}`)}
                            />

                            {/* Edit Service Button */}
                            <Link
                              to={`/services/${service.id}/edit`}
                              className="absolute -top-3 -right-3 bg-yellow-300 border-2 border-gray-800 p-2 shadow-[3px_3px_0px_#333] transition-transform hover:scale-110"
                              style={{ transform: 'rotate(5deg)' }}
                              title="Edit Service"
                            >
                              <Edit2 className="h-5 w-5 text-gray-800" />
                            </Link>
                          </Box>

                          {/* Applications for this service - Shown as "Scrapbook items" */}
                          <div className="ml-4 sm:ml-12 relative">
                            {/* Connector line */}
                            <div className="absolute -left-6 top-0 bottom-0 w-1 border-l-2 border-dashed border-gray-400 hidden sm:block" />

                            <div className="relative inline-block mb-3">
                              <h3
                                className="text-md font-bold text-gray-700 uppercase tracking-widest relative z-0 bg-white px-3 border-2 border-gray-800 transform rotate-1"
                                style={{ fontFamily: '"Permanent Marker", cursive' }}
                              >
                                My Applications ({serviceApps.length})
                              </h3>
                            </div>

                            {serviceApps.length === 0 ? (
                              <p className="text-gray-400 font-serif italic text-sm ml-2">
                                No applications yet for this service.
                              </p>
                            ) : (
                              <div className="grid grid-cols-1 gap-6">
                                {serviceApps.map((app: any, appIdx: number) => {
                                  const statusStyle =
                                    app.status === 'accepted'
                                      ? { color: '#16a34a', bg: '#f0fdf4' }
                                      : app.status === 'rejected'
                                        ? { color: '#dc2626', bg: '#fef2f2' }
                                        : { color: '#ca8a04', bg: '#fefce8' };

                                  return (
                                    <div
                                      key={app.id}
                                      className="relative p-5 border-2 border-gray-800 bg-white shadow-[4px_4px_0px_#333] transition-all hover:bg-gray-50"
                                      style={{
                                        transform: `rotate(${appIdx % 2 === 0 ? 0.3 : -0.3}deg)`,
                                        backgroundImage:
                                          'linear-gradient(to right, rgba(0,0,0,0.01) 1px, transparent 1px)',
                                        backgroundSize: '15px 15px',
                                      }}
                                    >
                                      <div className="flex flex-col sm:flex-row justify-between gap-4">
                                        <div className="flex-1">
                                          <div className="flex items-center gap-2 mb-1">
                                            <Link
                                              to={`/events/${app.event_id}`}
                                              className="text-lg font-bold text-gray-900 hover:text-blue-600 underline decoration-2 decoration-blue-200"
                                              style={{
                                                fontFamily: '"Caveat", cursive',
                                                fontSize: '1.4rem',
                                              }}
                                            >
                                              {app.event_title}
                                            </Link>
                                            <span className="text-[0.6rem] font-bold text-gray-400 border border-gray-300 px-1 uppercase tracking-tighter">
                                              {app.need_title}
                                            </span>
                                          </div>
                                          {app.message ? (
                                            <p
                                              className="text-gray-600 text-sm line-clamp-2 italic font-serif"
                                              style={{ lineHeight: 1.4 }}
                                            >
                                              "{app.message}"
                                            </p>
                                          ) : (
                                            <p className="text-gray-400 text-xs italic font-serif">
                                              (No message attached)
                                            </p>
                                          )}
                                        </div>

                                        <div className="flex flex-row sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-3">
                                          <div
                                            className="px-3 py-1 border-2 font-black uppercase text-[0.7rem] tracking-widest"
                                            style={{
                                              fontFamily: '"Permanent Marker", cursive',
                                              color: statusStyle.color,
                                              borderColor: statusStyle.color,
                                              backgroundColor: statusStyle.bg,
                                              transform: 'rotate(-2deg)',
                                            }}
                                          >
                                            {app.status}
                                          </div>

                                          {app.status === 'pending' && (
                                            <button
                                              onClick={() => setEditingApplication(app)}
                                              className="flex items-center gap-1.5 px-3 py-1.5 border-2 border-gray-800 bg-blue-300 hover:bg-blue-400 text-gray-900 shadow-[2px_2px_0px_#333] transition-all active:translate-x-[1px] active:translate-y-[1px]"
                                              style={{
                                                fontFamily: '"Permanent Marker"',
                                                fontSize: '0.75rem',
                                              }}
                                            >
                                              <Edit2 className="h-3.5 w-3.5" /> Edit
                                            </button>
                                          )}
                                        </div>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {serviceSubTab === 'opportunities' && (
              <div className="mt-2">
                <OpportunitiesTab />
              </div>
            )}
          </div>
        )}
      </div>

      {/* Modals */}
      <EditApplicationModal
        open={!!editingApplication}
        onClose={() => setEditingApplication(null)}
        application={editingApplication}
      />
      <TicketManagementModal
        isOpen={!!managingTicket}
        onClose={() => setManagingTicket(null)}
        tickets={
          managingTicket
            ? tickets.filter(
              (t: any) => t.event_summary.id === managingTicket.event_summary.id,
            )
            : []
        }
        initialIndex={
          managingTicket
            ? tickets
              .filter(
                (t: any) => t.event_summary.id === managingTicket.event_summary.id,
              )
              .findIndex((t: any) => t.id === managingTicket.id)
            : 0
        }
      />
    </div>
  );
}

/* ── Shared components ── */

function LoadingSkeleton({ count }: { count: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="h-20 border-2 border-dashed border-gray-300 bg-white/50 animate-pulse"
        />
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
