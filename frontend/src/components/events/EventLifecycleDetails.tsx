import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Calendar, Clock, MapPin, Briefcase, ChevronRight, AlertTriangle, PlayCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { EventSeriesNav } from './EventSeriesNav';
import { EventDetail, EventListItem } from '@/types/events';

interface EventLifecycleDetailsProps {
    event: EventDetail;
    isHost: boolean;
    canViewReadyDetails: boolean;
    occurrences: EventListItem[];
    displayNeeds: any[];
    myServices: any[];
    selectedNeed: any;
    setSelectedNeed: (need: any) => void;
    setIsApplyModalOpen: (isOpen: boolean) => void;
    handleBuyTicket: (tier: 'standard' | 'flexible') => void;
    isBuyingTicket: boolean;
    standardPrice: number;
    flexiblePrice: number | null;
}

function formatDate(dateStr: string) {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
}

function formatTime(dateStr: string) {
    const d = new Date(dateStr);
    return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
}

function CountdownTimer({ targetDate }: { targetDate: string }) {
    const [timeLeft, setTimeLeft] = useState<{ d: number, h: number, m: number, s: number } | null>(null);

    useEffect(() => {
        const timer = setInterval(() => {
            const difference = new Date(targetDate).getTime() - new Date().getTime();
            if (difference > 0) {
                setTimeLeft({
                    d: Math.floor(difference / (1000 * 60 * 60 * 24)),
                    h: Math.floor((difference / (1000 * 60 * 60)) % 24),
                    m: Math.floor((difference / 1000 / 60) % 60),
                    s: Math.floor((difference / 1000) % 60)
                });
            } else {
                setTimeLeft(null);
                clearInterval(timer);
            }
        }, 1000);
        return () => clearInterval(timer);
    }, [targetDate]);

    if (!timeLeft) return null;

    return (
        <div className="flex gap-4 text-center">
            <div className="flex flex-col"><span className="text-2xl font-bold">{timeLeft.d}</span><span className="text-xs text-muted-foreground uppercase">Days</span></div>
            <div className="flex flex-col"><span className="text-2xl font-bold">{timeLeft.h}</span><span className="text-xs text-muted-foreground uppercase">Hours</span></div>
            <div className="flex flex-col"><span className="text-2xl font-bold">{timeLeft.m}</span><span className="text-xs text-muted-foreground uppercase">Mins</span></div>
            <div className="flex flex-col"><span className="text-2xl font-bold">{timeLeft.s}</span><span className="text-xs text-muted-foreground uppercase">Secs</span></div>
        </div>
    );
}

export function EventLifecycleDetails(props: EventLifecycleDetailsProps) {
    const {
        event, isHost, canViewReadyDetails,
        occurrences, displayNeeds, myServices,
        setSelectedNeed, setIsApplyModalOpen, handleBuyTicket, isBuyingTicket,
        standardPrice, flexiblePrice
    } = props;

    const state = event.lifecycle_state;
    const isAttendee = event.user_has_ticket;

    // Sub-components for sharing layout pieces
    const BasicDetails = () => (
        <div className="space-y-3 text-sm text-muted-foreground mb-6">
            <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-primary" />
                <span>{formatDate(event.start_time)}</span>
            </div>
            <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-primary" />
                <span>{formatTime(event.start_time)} – {formatTime(event.end_time)}</span>
            </div>
            <div className="flex flex-col gap-1">
                <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-primary" />
                    <span>{event.location_name}</span>
                </div>
                {canViewReadyDetails && event.location_address && (
                    <div className="ml-6 text-xs text-muted-foreground">
                        {event.location_address}
                    </div>
                )}
            </div>
        </div>
    );

    const HostInfo = () => (
        <div className="flex items-center gap-3 mb-6">
            {event.host.avatar ? (
                <img src={event.host.avatar} alt="" className="h-10 w-10 rounded-full object-cover" />
            ) : (
                <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center font-bold text-primary">
                    {(event.host.first_name?.[0] || event.host.username[0]).toUpperCase()}
                </div>
            )}
            <div>
                <p className="text-sm font-medium">{event.host.first_name || event.host.username}</p>
                <p className="text-xs text-muted-foreground">Host</p>
            </div>
        </div>
    );

    const Description = () => (
        <div className="border-t pt-6 mb-6">
            <h2 className="text-lg font-semibold mb-3">About This Event</h2>
            <p className="text-muted-foreground whitespace-pre-wrap leading-relaxed">
                {event.description}
            </p>
        </div>
    );

    const NeedsList = () => {
        if (!displayNeeds || displayNeeds.length === 0) return null;
        return (
            <div className="border-t pt-6 mb-6">
                <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <Briefcase className="h-5 w-5 text-primary" /> Event Needs & Vendors
                </h2>
                <div className="space-y-4">
                    {displayNeeds.map((need: any) => {
                        const matchingServices = myServices.filter((s: any) => s.category === need.category);
                        const hasMatchedService = matchingServices.length > 0;
                        const hasAssignedVendor = need.assigned_vendor !== null;
                        const userApplication = need.applications?.find((app: any) => myServices.some((s: any) => s.id === app.service));
                        const hasUserApplied = !!userApplication;
                        const isUserAssigned = userApplication?.status === 'accepted' || (need.applications?.some((app: any) => app.status === 'accepted' && myServices.some((s: any) => s.id === app.service)));
                        const isFilledByOther = hasAssignedVendor && !isUserAssigned;
                        const acceptedApp = need.applications?.find((app: any) => app.status === 'accepted');
                        const vendorName = acceptedApp ? acceptedApp.vendor_name : 'Vendor';

                        return (
                            <div key={need.id} className="bg-card border rounded-xl p-4 flex flex-col sm:flex-row justify-between gap-4">
                                <div>
                                    <h3 className="font-semibold">{need.title}</h3>
                                    <div className="flex gap-2 mt-1 mb-2 text-xs">
                                        <span className={`px-2 py-0.5 rounded capitalize ${need.status === 'filled' ? 'bg-primary/10 text-primary font-medium' : 'bg-muted text-muted-foreground'}`}>
                                            {need.status === 'filled' ? 'Filled' : need.criticality.replace('_', '-')}
                                        </span>
                                        {(need.budget_min || need.budget_max) && (
                                            <span className="bg-muted text-muted-foreground px-2 py-0.5 rounded">
                                                Budget: ${need.budget_min || '0'} - ${need.budget_max || 'Any'}
                                            </span>
                                        )}
                                    </div>
                                    {need.description && <p className="text-sm text-muted-foreground line-clamp-2">{need.description}</p>}
                                </div>
                                <div className="flex items-center shrink-0">
                                    {isUserAssigned ? (
                                        <p className="text-sm font-medium text-green-600 dark:text-green-400">✓ You are providing this</p>
                                    ) : isFilledByOther ? (
                                        <div className="text-right">
                                            <p className="text-sm font-medium text-foreground">
                                                Vendor: <span className="text-primary">{vendorName}</span>
                                            </p>
                                        </div>
                                    ) : hasUserApplied ? (
                                        <div className="text-right">
                                            <p className="text-sm font-medium text-primary capitalize">
                                                ✓ Application {userApplication?.status === 'pending' ? 'Sent' : userApplication?.status}
                                            </p>
                                            <p className="text-xs text-muted-foreground mt-0.5">Waiting for review</p>
                                        </div>
                                    ) : hasMatchedService ? (
                                        <Button size="sm" onClick={() => { setSelectedNeed({ id: need.id, title: need.title }); setIsApplyModalOpen(true); }}>
                                            Apply Now <ChevronRight className="h-4 w-4 ml-1" />
                                        </Button>
                                    ) : (
                                        <div className="text-right">
                                            <p className="text-xs text-muted-foreground mb-1">Matched service required</p>
                                            <Button variant="outline" size="sm" asChild>
                                                <Link to="/vendors/create">Create Service</Link>
                                            </Button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        );
    }

    const TicketSidebar = () => {
        // If event is cancelled or completed, don't show tickets to buy
        if (state === 'cancelled' || state === 'completed') return null;

        // If ready or live, and not attendee/host -> closed!
        if ((state === 'event_ready' || state === 'live') && !isAttendee && !isHost) {
            return (
                <div className="rounded-xl border bg-card p-6 space-y-4 sticky top-24 text-center">
                    <AlertTriangle className="h-8 w-8 text-amber-500 mx-auto mb-2" />
                    <h3 className="font-semibold text-lg">Tickets Closed</h3>
                    <p className="text-sm text-muted-foreground">Ticket sales are no longer active for this event.</p>
                </div>
            );
        }

        return (
            <div className="rounded-xl border bg-card p-6 space-y-4 sticky top-24">
                <h3 className="font-semibold text-lg">{isHost ? 'Tickets' : 'Get Tickets'}</h3>

                {state === 'published' || state === 'at_risk' || state === 'postponed' || (isAttendee || isHost) ? (
                    <>
                        {/* Standard */}
                        <div className="rounded-lg border p-4 space-y-2">
                            <div className="flex justify-between items-center">
                                <span className="font-medium">Standard</span>
                                <span className="font-semibold text-primary">
                                    {standardPrice === 0 ? 'Free' : `$${standardPrice}`}
                                </span>
                            </div>
                            <p className="text-xs text-muted-foreground">Non-refundable</p>
                            {!isHost && (
                                <Button
                                    className="w-full"
                                    onClick={() => handleBuyTicket('standard')}
                                    disabled={event.user_has_ticket || isBuyingTicket || (state !== 'published' && state !== 'at_risk' && state !== 'postponed' && state !== 'draft')}
                                >
                                    {event.user_has_ticket ? 'Already Purchased' : 'Buy Standard'}
                                </Button>
                            )}
                        </div>

                        {/* Flexible */}
                        {flexiblePrice !== null && (
                            <div className="rounded-lg border p-4 space-y-2">
                                <div className="flex justify-between items-center">
                                    <span className="font-medium">Flexible</span>
                                    <span className="font-semibold text-primary">${flexiblePrice}</span>
                                </div>
                                <p className="text-xs text-muted-foreground">
                                    Refundable up to {event.refund_window_hours}h before event
                                </p>
                                {!isHost && (
                                    <Button
                                        variant="outline"
                                        className="w-full"
                                        onClick={() => handleBuyTicket('flexible')}
                                        disabled={event.user_has_ticket || isBuyingTicket || (state !== 'published' && state !== 'at_risk' && state !== 'postponed' && state !== 'draft')}
                                    >
                                        {event.user_has_ticket ? 'Already Purchased' : 'Buy Flexible'}
                                    </Button>
                                )}
                            </div>
                        )}

                        {/* Capacity */}
                        {event.tickets_remaining !== null && (
                            <p className="text-xs text-muted-foreground text-center">
                                {event.tickets_remaining} tickets remaining
                            </p>
                        )}
                    </>
                ) : null}
            </div>
        );
    };

    const CheckInInstructions = () => {
        if (!canViewReadyDetails) return null;
        return (
            <div className="border rounded-xl p-4 bg-primary/5 border-primary/20 mb-6">
                <h2 className="text-base font-semibold mb-2">Check-in Instructions</h2>
                <p className="text-sm text-foreground whitespace-pre-wrap">
                    {event.check_in_instructions || 'Check-in instructions will be shared by the host soon.'}
                </p>
                {event.event_ready_message && (
                    <div className="mt-4 pt-4 border-t border-primary/10">
                        <p className="text-sm italic text-muted-foreground">Host message: {event.event_ready_message}</p>
                    </div>
                )}
            </div>
        );
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">

                {/* UPCOMING & DEFAULT */}
                {(state === 'draft' || state === 'published' || state === 'at_risk' || state === 'postponed') && (
                    <>
                        <HostInfo />
                        <BasicDetails />
                        <Description />
                        {event.series && <EventSeriesNav occurrences={occurrences} currentEventId={event.id} />}
                        <NeedsList />
                    </>
                )}

                {/* EVENT READY */}
                {state === 'event_ready' && (
                    <>
                        <HostInfo />
                        <BasicDetails />

                        {!canViewReadyDetails && (
                            <div className="p-4 bg-muted text-muted-foreground rounded-xl mb-6 text-sm">
                                Event day location details and check-in instructions are visible to paid attendees.
                            </div>
                        )}

                        <div className="flex flex-col items-center justify-center p-8 bg-card border rounded-2xl mb-6">
                            <h3 className="text-lg font-semibold mb-6">Event is starting soon!</h3>
                            <CountdownTimer targetDate={event.start_time} />
                        </div>

                        <CheckInInstructions />

                        <Description />
                        {event.series && <EventSeriesNav occurrences={occurrences} currentEventId={event.id} />}
                    </>
                )}

                {/* LIVE */}
                {state === 'live' && (
                    <>
                        <div className="bg-red-500/10 border-red-500/20 text-red-600 dark:text-red-400 border p-4 rounded-xl flex items-center justify-between mb-6">
                            <div className="flex items-center gap-2">
                                <PlayCircle className="h-6 w-6 animate-pulse" />
                                <span className="font-bold text-lg">EVENT IS LIVE</span>
                            </div>
                            {(isHost || isAttendee) && (
                                <Button size="sm" variant="outline" className="text-red-600 border-red-200 hover:bg-red-50 dark:hover:bg-red-950">
                                    + Add Highlight
                                </Button>
                            )}
                        </div>

                        <HostInfo />
                        <BasicDetails />
                        <CheckInInstructions />
                        {event.series && <EventSeriesNav occurrences={occurrences} currentEventId={event.id} />}
                    </>
                )}

                {/* COMPLETED */}
                {state === 'completed' && (
                    <>
                        <div className="p-6 bg-card border rounded-2xl mb-8">
                            <h2 className="text-2xl font-bold mb-2">Event Completed!</h2>
                            <p className="text-muted-foreground mb-6">Thank you for attending. Relive the moments and share your feedback.</p>

                            {(isHost || isAttendee) && (
                                <div className="flex gap-4">
                                    <Button asChild>
                                        <Link to={`/events/${event.id}/story`}>View Highlights</Link>
                                    </Button>
                                    <Button variant="outline" asChild>
                                        <Link to={`/events/${event.id}/reviews/write`}>Leave a Review</Link>
                                    </Button>
                                </div>
                            )}
                        </div>

                        <HostInfo />
                        <Description />
                        {event.series && <EventSeriesNav occurrences={occurrences} currentEventId={event.id} />}
                    </>
                )}

                {/* CANCELLED */}
                {state === 'cancelled' && (
                    <>
                        <div className="bg-red-500/10 border-red-500/20 text-red-600 dark:text-red-400 border p-6 rounded-2xl mb-6">
                            <div className="flex items-center gap-3 mb-2">
                                <AlertTriangle className="h-6 w-6" />
                                <h2 className="text-xl font-bold">Event Cancelled</h2>
                            </div>
                            <p className="text-red-600/80">We apologize, but this event has been cancelled by the host.</p>

                            {/* In a real app we'd fetch the cancellation reason from Lifecycle transitions. For now just placeholder or generic */}
                            <p className="mt-4 text-sm font-medium">Reason for cancellation:</p>
                            <p className="text-sm mt-1 bg-white/50 dark:bg-black/20 p-3 rounded-lg">Unforeseen circumstances. Refunds have been initiated automatically if applicable.</p>
                        </div>

                        <HostInfo />
                        <BasicDetails />
                        <Description />
                        {event.series && <EventSeriesNav occurrences={occurrences} currentEventId={event.id} />}
                    </>
                )}

            </div>

            {/* Sidebar */}
            <div className="space-y-4">
                <TicketSidebar />
            </div>
        </div>
    );
}
