/** Event Detail page — full event information with ticket purchase. */

import { ArrowLeft, Calendar, Clock, Heart, MapPin, Share2, Users, FileEdit, Briefcase, ChevronRight } from 'lucide-react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { useState } from 'react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { useAuth } from '@/features/auth/hooks';
import { useEvent, usePurchaseTicket, useToggleInterest } from '@/features/events/hooks';
import { useEventNeeds } from '@/features/needs/hooks';
import { useMyServices } from '@/features/vendors/hooks';
import type { EventNeed } from '@/types/needs';
import { ApplyToNeedModal } from '@/components/events/ApplyToNeedModal';
import type { EventLifecycleState } from '@/types/events';

const LIFECYCLE_LABELS: Record<EventLifecycleState, string> = {
    draft: 'Draft',
    published: 'Published',
    at_risk: 'At Risk',
    postponed: 'Postponed',
    event_ready: 'Event Ready',
    live: 'Live',
    cancelled: 'Cancelled',
    completed: 'Completed',
};

const LIFECYCLE_STYLES: Record<EventLifecycleState, string> = {
    draft: 'bg-muted text-muted-foreground',
    published: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
    at_risk: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300',
    postponed: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300',
    event_ready: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300',
    live: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
    cancelled: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
    completed: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300',
};

function formatDate(dateStr: string) {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
        year: 'numeric',
    });
}

function formatTime(dateStr: string) {
    const d = new Date(dateStr);
    return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
}

export default function EventDetailPage() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { isAuthenticated, user } = useAuth();
    const { data: eventResponse, isLoading } = useEvent(Number(id));
    const { data: needsResponse } = useEventNeeds(Number(id));
    const { data: myServicesResponse } = useMyServices({ enabled: !!isAuthenticated });
    const toggleInterest = useToggleInterest();
    const purchaseTicket = usePurchaseTicket();

    const [isApplyModalOpen, setIsApplyModalOpen] = useState(false);
    const [selectedNeed, setSelectedNeed] = useState<{ id: number; title: string } | null>(null);

    const event = eventResponse?.data;
    const needs = needsResponse?.data || [];
    const myServices = myServicesResponse?.data || [];

    if (isLoading) {
        return (
            <div className="mx-auto max-w-4xl px-4 py-8 animate-pulse space-y-6">
                <div className="h-8 w-32 rounded bg-muted" />
                <div className="aspect-[2/1] rounded-2xl bg-muted" />
                <div className="h-10 w-3/4 rounded bg-muted" />
                <div className="h-4 w-full rounded bg-muted" />
                <div className="h-4 w-2/3 rounded bg-muted" />
            </div>
        );
    }

    if (!event) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[50vh]">
                <p className="text-lg text-muted-foreground">Event not found</p>
                <Button variant="ghost" onClick={() => navigate('/')} className="mt-4">
                    Go Home
                </Button>
            </div>
        );
    }

    const handleBuyTicket = (tier: 'standard' | 'flexible') => {
        if (!isAuthenticated) {
            navigate('/signin');
            return;
        }
        purchaseTicket.mutate(
            { eventId: event.id, ticketType: tier },
            {
                onSuccess: () => toast.success('Ticket purchased!'),
                onError: (err: any) =>
                    toast.error(err?.response?.data?.message || 'Failed to purchase ticket'),
            }
        );
    };

    const standardPrice = event.ticket_price_standard
        ? parseFloat(event.ticket_price_standard)
        : 0;
    const flexiblePrice = event.ticket_price_flexible
        ? parseFloat(event.ticket_price_flexible)
        : null;

    const displayNeeds = needs.filter((n: any) => n.status !== 'cancelled');
    const isHost = user?.username === event.host.username;
    const isEventReady = event.lifecycle_state === 'event_ready';
    const canViewReadyDetails = isHost || event.user_has_ticket;

    return (
        <div className="mx-auto max-w-4xl px-4 sm:px-6 py-8">
            {/* Top Bar */}
            <div className="flex justify-between items-center mb-6">
                <button
                    onClick={() => navigate(-1)}
                    className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                    <ArrowLeft className="h-4 w-4" /> Back
                </button>
                {isHost && (
                    <Button variant="outline" size="sm" onClick={() => navigate(`/events/${event.id}/manage`)}>
                        <FileEdit className="h-4 w-4 mr-2" /> Manage Event
                    </Button>
                )}
            </div>

            {/* Cover */}
            <div className="relative overflow-hidden rounded-2xl aspect-[2/1] bg-muted mb-8">
                {event.cover_image ? (
                    <img
                        src={event.cover_image}
                        alt={event.title}
                        className="h-full w-full object-cover"
                    />
                ) : (
                    <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-primary/20 to-primary/5">
                        <Calendar className="h-16 w-16 text-primary/30" />
                    </div>
                )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Main content */}
                <div className="lg:col-span-2 space-y-6">
                    {event.category && (
                        <span className="inline-block rounded-full bg-primary/10 text-primary px-3 py-1 text-sm font-medium">
                            {event.category.name}
                        </span>
                    )}
                    <span className={`inline-block rounded-full px-3 py-1 text-xs font-semibold ${LIFECYCLE_STYLES[event.lifecycle_state]}`}>
                        {LIFECYCLE_LABELS[event.lifecycle_state]}
                    </span>
                    <h1 className="text-3xl font-bold text-foreground">{event.title}</h1>

                    {/* Host */}
                    <div className="flex items-center gap-3">
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

                    {/* Details */}
                    <div className="space-y-3 text-sm text-muted-foreground">
                        <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-primary" />
                            <span>{formatDate(event.start_time)}</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4 text-primary" />
                            <span>{formatTime(event.start_time)} – {formatTime(event.end_time)}</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <MapPin className="h-4 w-4 text-primary" />
                            <span>{event.location_name}{event.location_address ? `, ${event.location_address}` : ''}</span>
                        </div>
                    </div>

                    {isEventReady && (
                        <div className="border rounded-xl p-4 bg-card">
                            <h2 className="text-base font-semibold mb-2">Event Day Details</h2>
                            {event.event_ready_message && (
                                <p className="text-sm text-foreground mb-3 whitespace-pre-wrap">
                                    {event.event_ready_message}
                                </p>
                            )}
                            {canViewReadyDetails ? (
                                <div className="space-y-2 text-sm text-muted-foreground">
                                    <p>
                                        <span className="font-medium text-foreground">Location:</span>{' '}
                                        {event.location_name}
                                        {event.location_address ? `, ${event.location_address}` : ''}
                                    </p>
                                    {event.check_in_instructions ? (
                                        <p className="whitespace-pre-wrap">
                                            <span className="font-medium text-foreground">Check-in:</span>{' '}
                                            {event.check_in_instructions}
                                        </p>
                                    ) : (
                                        <p>Check-in instructions will be shared by the host soon.</p>
                                    )}
                                </div>
                            ) : (
                                <p className="text-sm text-muted-foreground">
                                    Event day location details and check-in instructions are visible to paid attendees.
                                </p>
                            )}
                        </div>
                    )}

                    {/* Description */}
                    <div className="border-t pt-6">
                        <h2 className="text-lg font-semibold mb-3">About This Event</h2>
                        <p className="text-muted-foreground whitespace-pre-wrap leading-relaxed">
                            {event.description}
                        </p>
                    </div>

                    {/* Needs */}
                    {displayNeeds.length > 0 && (
                        <div className="border-t pt-6">
                            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                                <Briefcase className="h-5 w-5 text-primary" /> Event Needs & Vendors
                            </h2>
                            <div className="space-y-4">
                                {displayNeeds.map((need: EventNeed) => {
                                    // Logic for matching services
                                    const matchingServices = myServices.filter((s: any) => s.category === need.category);
                                    const hasMatchedService = matchingServices.length > 0;
                                    const hasAssignedVendor = need.assigned_vendor !== null;

                                    // Identify if the user has an application for this need
                                    const userApplication = need.applications?.find((app: any) => myServices.some((s: any) => s.id === app.service));
                                    const hasUserApplied = !!userApplication;

                                    // Check if the current user already has an accepted application for this need
                                    const isUserAssigned = userApplication?.status === 'accepted' || (need.applications?.some((app: any) => app.status === 'accepted' && myServices.some((s: any) => s.id === app.service)));

                                    // Check if another vendor is assigned
                                    const isFilledByOther = hasAssignedVendor && !isUserAssigned;

                                    // Get the accepted application for display
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
                                                    <p className="text-sm font-medium text-green-600 dark:text-green-400">
                                                        ✓ You are providing this
                                                    </p>
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
                                                    <Button
                                                        size="sm"
                                                        onClick={() => {
                                                            setSelectedNeed({ id: need.id, title: need.title });
                                                            setIsApplyModalOpen(true);
                                                        }}
                                                    >
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
                    )}

                    {/* Tags */}
                    {event.tags && event.tags.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                            {event.tags.map((tag) => (
                                <span key={tag} className="rounded-full bg-muted px-3 py-1 text-xs text-muted-foreground">
                                    #{tag}
                                </span>
                            ))}
                        </div>
                    )}
                </div>

                {/* Sidebar — tickets + social */}
                <div className="space-y-4">
                    <div className="rounded-xl border bg-card p-6 space-y-4 sticky top-24">
                        <h3 className="font-semibold text-lg">{isHost ? 'Tickets' : 'Get Tickets'}</h3>

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
                                    disabled={event.user_has_ticket || purchaseTicket.isPending}
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
                                        disabled={event.user_has_ticket || purchaseTicket.isPending}
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

                        {/* Social */}
                        <div className="flex gap-2 pt-2 border-t">
                            <Button
                                variant="ghost"
                                size="sm"
                                className="flex-1 gap-1.5"
                                onClick={() =>
                                    toggleInterest.mutate({
                                        eventId: event.id,
                                        isInterested: event.user_is_interested,
                                    })
                                }
                            >
                                <Heart
                                    className={`h-4 w-4 ${event.user_is_interested ? 'fill-red-500 text-red-500' : ''}`}
                                />
                                {event.interest_count}
                            </Button>
                            <Button variant="ghost" size="sm" className="flex-1 gap-1.5">
                                <Users className="h-4 w-4" /> {event.ticket_count}
                            </Button>
                            <Button
                                variant="ghost"
                                size="sm"
                                className="flex-1 gap-1.5"
                                onClick={() => {
                                    navigator.clipboard.writeText(window.location.href);
                                    toast.success('Link copied!');
                                }}
                            >
                                <Share2 className="h-4 w-4" /> Share
                            </Button>
                        </div>
                    </div>
                </div>
            </div>

            {selectedNeed && (
                <ApplyToNeedModal
                    isOpen={isApplyModalOpen}
                    onClose={() => {
                        setIsApplyModalOpen(false);
                        setTimeout(() => setSelectedNeed(null), 200);
                    }}
                    needId={selectedNeed.id}
                    needTitle={selectedNeed.title}
                />
            )}
        </div>
    );
}
