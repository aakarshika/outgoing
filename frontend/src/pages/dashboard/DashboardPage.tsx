/** Dashboard page — My Events and My Tickets tabs. */

import { Calendar, Ticket, Briefcase, FileText, Plus } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router-dom';

import { Button } from '@/components/ui/button';
import { useMyEvents, useMyTickets } from '@/features/events/hooks';
import { useMyServices } from '@/features/vendors/hooks';
import { useMyApplications } from '@/features/needs/hooks';

type Tab = 'events' | 'tickets' | 'services' | 'applications';
const LIFECYCLE_BADGE_STYLES: Record<string, string> = {
    draft: 'bg-yellow-500/10 text-yellow-600',
    published: 'bg-green-500/10 text-green-600',
    at_risk: 'bg-amber-500/10 text-amber-600',
    postponed: 'bg-orange-500/10 text-orange-600',
    event_ready: 'bg-emerald-500/10 text-emerald-600',
    live: 'bg-lime-500/10 text-lime-600',
    cancelled: 'bg-red-500/10 text-red-600',
    completed: 'bg-purple-500/10 text-purple-600',
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
        <div className="mx-auto max-w-4xl px-4 sm:px-6 py-8">
            <h1 className="text-2xl font-bold text-foreground mb-6">Dashboard</h1>

            {/* Tabs */}
            <div className="flex gap-1 border-b mb-6">
                <button
                    onClick={() => setTab('events')}
                    className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors
            ${tab === 'events' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'}
          `}
                >
                    <Calendar className="h-4 w-4" /> My Events
                </button>
                <button
                    onClick={() => setTab('tickets')}
                    className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors
            ${tab === 'tickets' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'}
          `}
                >
                    <Ticket className="h-4 w-4" /> My Tickets
                </button>
                <button
                    onClick={() => setTab('services')}
                    className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors
                    ${tab === 'services' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'}
                  `}
                >
                    <Briefcase className="h-4 w-4" /> My Services
                </button>
                <button
                    onClick={() => setTab('applications')}
                    className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors
                    ${tab === 'applications' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'}
                  `}
                >
                    <FileText className="h-4 w-4" /> My Applications
                </button>
            </div>

            {/* My Events */}
            {tab === 'events' && (
                <div>
                    {eventsLoading ? (
                        <div className="space-y-3">
                            {[1, 2, 3].map((i) => (
                                <div key={i} className="h-20 rounded-lg bg-muted animate-pulse" />
                            ))}
                        </div>
                    ) : events.length === 0 ? (
                        <div className="text-center py-16">
                            <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                            <h3 className="text-lg font-semibold">No events yet</h3>
                            <p className="text-sm text-muted-foreground mt-1 mb-4">
                                Create your first event and start hosting.
                            </p>
                            <Button asChild>
                                <Link to="/events/create">Create Event</Link>
                            </Button>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {events.map((event: any) => (
                                <Link
                                    key={event.id}
                                    to={`/events/${event.id}`}
                                    className="flex items-center gap-4 rounded-lg border p-4 hover:bg-muted/50 transition-colors"
                                >
                                    {event.cover_image ? (
                                        <img
                                            src={event.cover_image}
                                            alt=""
                                            className="h-14 w-20 rounded-lg object-cover flex-shrink-0"
                                        />
                                    ) : (
                                        <div className="h-14 w-20 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                                            <Calendar className="h-5 w-5 text-primary/40" />
                                        </div>
                                    )}
                                    <div className="flex-1 min-w-0">
                                        <h3 className="font-medium text-sm truncate">{event.title}</h3>
                                        <p className="text-xs text-muted-foreground">
                                            {new Date(event.start_time).toLocaleDateString()} · {event.location_name}
                                        </p>
                                    </div>
                                    <span
                                        className={`text-xs font-medium px-2 py-1 rounded-full ${
                                            LIFECYCLE_BADGE_STYLES[event.lifecycle_state] ||
                                            'bg-muted text-muted-foreground'
                                        }`}
                                    >
                                        {LIFECYCLE_LABELS[event.lifecycle_state] || event.lifecycle_state}
                                    </span>
                                </Link>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* My Tickets */}
            {tab === 'tickets' && (
                <div>
                    {ticketsLoading ? (
                        <div className="space-y-3">
                            {[1, 2, 3].map((i) => (
                                <div key={i} className="h-20 rounded-lg bg-muted animate-pulse" />
                            ))}
                        </div>
                    ) : tickets.length === 0 ? (
                        <div className="text-center py-16">
                            <Ticket className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                            <h3 className="text-lg font-semibold">No tickets yet</h3>
                            <p className="text-sm text-muted-foreground mt-1 mb-4">
                                Browse events and grab your first ticket.
                            </p>
                            <Button asChild variant="outline">
                                <Link to="/events">Browse Events</Link>
                            </Button>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {tickets.map((ticket: any) => (
                                <Link
                                    key={ticket.id}
                                    to={`/events/${ticket.event_summary.id}`}
                                    className="flex items-center gap-4 rounded-lg border p-4 hover:bg-muted/50 transition-colors"
                                >
                                    <Ticket className="h-6 w-6 text-primary flex-shrink-0" />
                                    <div className="flex-1 min-w-0">
                                        <h3 className="font-medium text-sm truncate">{ticket.event_summary.title}</h3>
                                        <p className="text-xs text-muted-foreground">
                                            {new Date(ticket.event_summary.start_time).toLocaleDateString()} · {ticket.event_summary.location_name}
                                        </p>
                                    </div>
                                    <div className="text-right flex-shrink-0">
                                        <span className="text-xs font-medium">{ticket.ticket_type}</span>
                                        <p className="text-xs text-muted-foreground">${ticket.price_paid}</p>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* My Services */}
            {tab === 'services' && (
                <div>
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-xl font-semibold">My Vendor Services</h2>
                        <Button asChild size="sm">
                            <Link to="/vendors/create"><Plus className="h-4 w-4 mr-1" /> New Service</Link>
                        </Button>
                    </div>
                    {servicesLoading ? (
                        <div className="space-y-3">
                            {[1, 2].map((i) => <div key={i} className="h-20 rounded-lg bg-muted animate-pulse" />)}
                        </div>
                    ) : services.length === 0 ? (
                        <div className="text-center py-16 border rounded-xl bg-card">
                            <Briefcase className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                            <h3 className="text-lg font-semibold">No services found</h3>
                            <p className="text-sm text-muted-foreground mt-1 mb-4">You haven't listed any vendor services yet.</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {services.map((service: any) => {
                                const serviceApps = applications.filter((app: any) => app.service === service.id);
                                const acceptedApps = serviceApps.filter((app: any) => app.status === 'accepted');

                                return (
                                    <div key={service.id} className="flex flex-col sm:flex-row gap-4 rounded-lg border bg-card p-4">
                                        {service.portfolio_image ? (
                                            <img src={service.portfolio_image} alt="" className="h-24 w-32 rounded-lg object-cover flex-shrink-0" />
                                        ) : (
                                            <div className="h-24 w-32 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                                                <Briefcase className="h-8 w-8 text-primary/40" />
                                            </div>
                                        )}
                                        <div className="flex-1 min-w-0">
                                            <div className="flex justify-between items-start">
                                                <div>
                                                    <h3 className="font-semibold text-lg">{service.title}</h3>
                                                    <p className="text-sm text-muted-foreground capitalize">{service.category}</p>
                                                </div>
                                                {service.base_price && <span className="font-medium">From ${service.base_price}</span>}
                                            </div>
                                            <p className="text-sm mt-3 text-muted-foreground line-clamp-2">{service.description}</p>

                                            <div className="flex items-center gap-6 mt-4 pt-3 border-t text-sm">
                                                <div className="flex flex-col">
                                                    <span className="text-xs text-muted-foreground">Applications</span>
                                                    <span className="font-semibold">{serviceApps.length}</span>
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="text-xs text-muted-foreground">Events Catered</span>
                                                    <span className="font-semibold text-primary">{acceptedApps.length}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            )}

            {/* My Applications */}
            {tab === 'applications' && (
                <div>
                    <h2 className="text-xl font-semibold mb-6">Need Applications</h2>
                    {applicationsLoading ? (
                        <div className="space-y-3">
                            {[1, 2, 3].map((i) => <div key={i} className="h-24 rounded-lg bg-muted animate-pulse" />)}
                        </div>
                    ) : applications.length === 0 ? (
                        <div className="text-center py-16 border rounded-xl bg-card">
                            <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                            <h3 className="text-lg font-semibold">No applications</h3>
                            <p className="text-sm text-muted-foreground mt-1">You haven't responded to any event needs yet.</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {applications.map((app: any) => (
                                <Link
                                    to={`/events/${app.event_id}`}
                                    key={app.id}
                                    className="block rounded-lg border bg-card p-5 hover:bg-muted/50 transition-colors"
                                >
                                    <div className="flex justify-between items-start mb-2">
                                        <div>
                                            <h3 className="font-semibold">{app.need_title}</h3>
                                            <p className="text-sm text-muted-foreground">For: <span className="font-medium text-foreground">{app.event_title}</span></p>
                                        </div>
                                        <span className={`text-xs font-medium px-2 py-1 rounded-full capitalize
                                            ${app.status === 'accepted' ? 'bg-green-100 text-green-800' :
                                                app.status === 'rejected' ? 'bg-red-100 text-red-800' :
                                                    'bg-yellow-100 text-yellow-800'}`}
                                        >
                                            {app.status}
                                        </span>
                                    </div>
                                    <div className="mt-3 text-sm">
                                        {app.proposed_price && <p className="font-medium text-primary mb-1">Proposed: ${app.proposed_price}</p>}
                                        <p className="text-muted-foreground line-clamp-2">{app.message}</p>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
