import { Calendar, MapPin, Ticket } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

import { TicketManagementModal } from '@/components/events/TicketManagementModal';
import { Media } from '@/components/ui/media';
import { useMyTickets } from '@/features/events/hooks';
import { ScrapbookEventCard } from '@/features/events/ScrapbookEventCard';

// Internal shared components from DashboardPage
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

function EmptyState({ icon, title, subtitle, actionLabel, actionTo }: any) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-6 border-2 border-dashed border-gray-300  text-center">
      <div className="mb-4 opacity-50">{icon}</div>
      <h3
        className="text-xl font-bold text-gray-900 mb-1"
        style={{ fontFamily: '"Permanent Marker", cursive' }}
      >
        {title}
      </h3>
      <p className="text-gray-500 mb-6 font-serif italic">{subtitle}</p>
      {actionLabel && (
        <Link
          to={actionTo}
          className="px-6 py-2 bg-yellow-300 border-2 border-gray-800 text-gray-900 font-bold hover:bg-yellow-400 transition-colors shadow-[3px_3px_0px_#333]"
          style={{ fontFamily: '"Permanent Marker", cursive' }}
        >
          {actionLabel}
        </Link>
      )}
    </div>
  );
}

export function TicketsTab() {
  const navigate = useNavigate();
  const { data: ticketsResponse, isLoading } = useMyTickets();
  const tickets = ticketsResponse?.data || [];
  const [managingTicket, setManagingTicket] = useState<any | null>(null);

  const sortedTickets = useMemo(() => {
    return [...tickets].sort((a: any, b: any) => {
      const aTime = new Date(
        a.purchased_at || a.created_at || a.updated_at || 0,
      ).getTime();
      const bTime = new Date(
        b.purchased_at || b.created_at || b.updated_at || 0,
      ).getTime();
      return bTime - aTime; // newest ticket created/purchased first
    });
  }, [tickets]);

  if (isLoading) return <LoadingSkeleton count={3} />;

  if (sortedTickets.length === 0) {
    return (
      <EmptyState
        icon={<Ticket className="h-12 w-12 text-gray-400" />}
        title="No tickets yet"
        subtitle="Browse events and grab your first ticket!"
        actionLabel="Browse Events"
        actionTo="/"
      />
    );
  }

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        {sortedTickets.map((ticket: any, idx: number) => {
          const eventId =
            ticket.event_summary?.id ?? ticket.event_id ?? ticket.event?.id;

          return (
            <div key={ticket.id} className="relative group text-left block">
              {/* Event card (background) */}
              <div
                className=" p-3  transition-all hover:translate-x-[1px] hover:translate-y-[1px] flex flex-col h-full"
                style={{ transform: `rotate(${idx % 2 === 0 ? -1 : 1}deg)` }}
              >
                <div
                  className="aspect-[12/10] overflow-hidden  mb-3 relative cursor-pointer"
                  onClick={() => setManagingTicket(ticket)}
                >
                  {ticket.status && (
                    <div className="absolute inset-0  flex flex-col items-center justify-start p-2 pt-24 pr-16 z-10">
                      <span
                        className="text-green-600 font-bold border-4 border-green-600 px-3 py-1 transform -rotate-12 mb-2 text-xl tracking-widest"
                        style={{ fontFamily: '"Permanent Marker", cursive' }}
                      >
                        BOUGHT
                      </span>
                    </div>
                  )}

                  {ticket.status === 'cancelled' && (
                    <div className="absolute inset-0  flex flex-col items-center justify-center p-2 z-10">
                      <span
                        className="text-red-600 font-bold border-4 border-red-600 px-3 py-1 transform rotate-[30deg] mb-2 text-xl tracking-widest"
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
                    <div className="absolute inset-0  flex flex-col items-center justify-center p-2 z-10 pointer-events-none">
                      <span
                        className="text-emerald-600 font-bold border-4 border-emerald-600 px-3 py-1 transform  rotate-[10deg] mb-2 text-xl tracking-widest "
                        style={{ fontFamily: '"Permanent Marker", cursive' }}
                      >
                        ADMITTED
                      </span>
                    </div>
                  )}

                  <div
                    className="absolute inset-0  flex flex-col items-center justify-center cursor-pointer "
                    onClick={() => setManagingTicket(ticket)}
                  >
                    <div className="" onClick={() => setManagingTicket(ticket)}>
                      <ScrapbookEventCard
                        event={ticket.event_summary}
                        isBasicEventCard={true}
                      />
                    </div>
                  </div>

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

                  <div
                    className="absolute inset-0  flex flex-col items-center justify-end cursor-pointer "
                    onClick={() => setManagingTicket(ticket)}
                  >
                    <div className="flex gap-2 mt-4 justify-between">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          if (eventId) navigate(`/events/${eventId}`);
                        }}
                        className="text-[0.65rem] font-bold px-3 py-1.5 border-2 border-gray-800 bg-blue-300 text-gray-900 transition-colors hover:bg-blue-400 whitespace-nowrap text-center flex-1"
                        style={{
                          fontFamily: '"Permanent Marker", cursive',
                          boxShadow: '1px 1px 0px rgba(0,0,0,0.8)',
                        }}
                      >
                        EVENT PAGE
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setManagingTicket(ticket);
                        }}
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
            </div>
          );
        })}
      </div>

      <TicketManagementModal
        isOpen={!!managingTicket}
        onClose={() => setManagingTicket(null)}
        tickets={
          managingTicket
            ? sortedTickets.filter(
                (t: any) => t.event_summary.id === managingTicket.event_summary.id,
              )
            : []
        }
        initialIndex={
          managingTicket
            ? sortedTickets
                .filter(
                  (t: any) => t.event_summary.id === managingTicket.event_summary.id,
                )
                .findIndex((t: any) => t.id === managingTicket.id)
            : 0
        }
      />
    </>
  );
}
