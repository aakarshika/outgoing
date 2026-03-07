/** Event Detail page — full event information with ticket purchase. */

import { ArrowLeft, FileEdit } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { useAuth } from '@/features/auth/hooks';
import { useEvent, usePurchaseTicket, useEventSeriesOccurrences, useRecordEventView } from '@/features/events/hooks';
import { useEventNeeds } from '@/features/needs/hooks';
import { useMyServices } from '@/features/vendors/hooks';
import { ApplyToNeedModal } from '@/components/events/ApplyToNeedModal';
import { EventLifecycleDetails } from '@/components/events/EventLifecycleDetails';
import { EventCarousel } from '@/components/events/EventCarousel';
import { HighlightComposer } from '@/components/events/HighlightComposer';
import { ReviewComposer } from '@/components/events/ReviewComposer';
import { Media } from '@/components/ui/media';
import { UserAvatar } from '@/components/ui/UserAvatar';
import { cn } from '@/lib/utils';
import { Calendar, Clock, Star } from 'lucide-react';
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

export default function EventDetailPage() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { isAuthenticated, user } = useAuth();
    const { data: eventResponse, isLoading } = useEvent(Number(id));
    const { data: needsResponse } = useEventNeeds(Number(id));
    const { data: myServicesResponse } = useMyServices({ enabled: !!isAuthenticated });
    const purchaseTicket = usePurchaseTicket();

    const [isApplyModalOpen, setIsApplyModalOpen] = useState(false);
    const [selectedNeed, setSelectedNeed] = useState<{ id: number; title: string } | null>(null);

    const [isHighlightOpen, setIsHighlightOpen] = useState(false);
    const [isReviewOpen, setIsReviewOpen] = useState(false);
    const recordView = useRecordEventView(Number(id));

    // Record this page visit for "Recently Viewed" feed
    useEffect(() => {
        if (isAuthenticated && Number(id)) {
            recordView.mutate();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [Number(id), isAuthenticated]);

    const event = eventResponse?.data;
    const { data: occurrencesResponse } = useEventSeriesOccurrences(event?.series?.id || 0, {
        enabled: !!event?.series?.id
    });

    const needs = needsResponse?.data || [];
    const myServices = myServicesResponse?.data || [];
    const occurrences = occurrencesResponse?.data || [];

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

            {/* Cover / Carousel */}
            <div className="mb-8">
                <EventCarousel items={
                    [
                        ...(event.cover_image ? [{ id: 'cover', url: event.cover_image, type: 'image' as const }] : []),
                        ...((event.media || []).map((m: any) => ({ id: m.id, url: m.file, type: m.media_type })) as any[]),
                        ...((event.highlights || []).map((h: any) => h.media_file ? { id: `h-${h.id}`, url: h.media_file, type: 'image' as const } : null).filter(Boolean) as any[])
                    ]
                } />
            </div>

            {/* Header section common to all layout states */}
            <div className="mb-8">
                {event.category && (
                    <span className="inline-block rounded-full bg-primary/10 text-primary px-3 py-1 text-sm font-medium mr-2 mb-2">
                        {event.category.name}
                    </span>
                )}
                <span className={`inline-block rounded-full px-3 py-1 text-xs font-semibold mb-2 ${LIFECYCLE_STYLES[event.lifecycle_state]}`}>
                    {LIFECYCLE_LABELS[event.lifecycle_state]}
                </span>
                <h1 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">{event.title}</h1>
                <div className="flex items-center gap-4 text-muted-foreground text-sm flex-wrap">
                    <div className="flex items-center gap-1.5">
                        <Calendar className="w-4 h-4" />
                        <span>{new Date(event.start_time).toLocaleDateString()}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <Clock className="w-4 h-4" />
                        <span>{new Date(event.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                </div>
            </div>

            <EventLifecycleDetails
                event={event}
                isHost={isHost}
                canViewReadyDetails={canViewReadyDetails}
                occurrences={occurrences}
                displayNeeds={displayNeeds}
                myServices={myServices}
                selectedNeed={selectedNeed}
                setSelectedNeed={setSelectedNeed}
                setIsApplyModalOpen={setIsApplyModalOpen}
                handleBuyTicket={handleBuyTicket}
                isBuyingTicket={purchaseTicket.isPending}
                standardPrice={standardPrice}
                flexiblePrice={flexiblePrice}
            />

            {['live', 'completed'].includes(event.lifecycle_state) && (
                <div className="mt-12 space-y-12">
                    {/* Highlights Feed */}
                    <section className="space-y-6 pt-12 border-t border-border/50">
                        <div className="flex items-center justify-between">
                            <h2 className="text-3xl font-bold">Highlights</h2>
                        </div>
                        {(event.highlights?.length ?? 0) > 0 ? (
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                {event.highlights!.map((highlight: any) => (
                                    <div key={highlight.id} className="aspect-square bg-muted rounded-xl relative overflow-hidden group">
                                        {highlight.media_file && (
                                            <Media src={highlight.media_file} alt="Highlight" className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                                        )}
                                        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-3 text-white">
                                            <p className="text-xs font-medium line-clamp-2">{highlight.text}</p>
                                            <span className="text-[10px] opacity-75 mt-1">By {highlight.author_username}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center p-8 bg-muted/50 rounded-2xl border border-dashed">
                                <p className="text-muted-foreground">No highlights yet. Be the first to share your experience!</p>
                            </div>
                        )}
                        <Button variant="outline" onClick={() => setIsHighlightOpen(true)}>Add a Highlight</Button>
                    </section>

                    {/* Reviews Feed */}
                    {event.lifecycle_state === 'completed' && (
                        <section className="space-y-6 pt-6 border-t border-border/50">
                            <div className="flex items-center justify-between">
                                <h2 className="text-3xl font-bold">Reviews</h2>
                                {event.average_rating ? (
                                    <div className="flex items-center gap-2 bg-primary/10 px-4 py-2 rounded-full">
                                        <Star className="w-5 h-5 text-yellow-500 fill-yellow-500" />
                                        <span className="font-bold text-lg">{event.average_rating.toFixed(1)}</span>
                                        <span className="text-sm text-muted-foreground">({event.reviews?.length} reviews)</span>
                                    </div>
                                ) : null}
                            </div>

                            {(event.reviews?.length ?? 0) > 0 ? (
                                <div className="space-y-6">
                                    {event.reviews!.map((review: any) => (
                                        <div key={review.id} className="p-6 rounded-2xl border bg-card space-y-4">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-3">
                                                    <UserAvatar
                                                        src={review.reviewer_avatar}
                                                        username={review.reviewer_username}
                                                        size="md"
                                                    />
                                                    <div>
                                                        <p className="font-medium">{review.reviewer_username || 'Anonymous User'}</p>
                                                        <p className="text-xs text-muted-foreground">{new Date(review.created_at).toLocaleDateString()}</p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-0.5">
                                                    {[...Array(5)].map((_, i) => (
                                                        <Star key={i} className={cn("w-4 h-4", i < review.rating ? "text-yellow-500 fill-yellow-500" : "text-muted")} />
                                                    ))}
                                                </div>
                                            </div>

                                            <p className="text-foreground whitespace-pre-wrap">{review.text}</p>

                                            {/* Review Media Files */}
                                            {review.media?.length > 0 && (
                                                <div className="flex gap-2 overflow-x-auto pb-2 snap-x">
                                                    {review.media.map((media: any) => (
                                                        <div key={media.id} className="relative w-32 h-32 rounded-lg shrink-0 overflow-hidden bg-muted snap-start">
                                                            {media.media_type === 'video' ? (
                                                                <Media type="video" src={media.file} controls className="w-full h-full object-cover" />
                                                            ) : (
                                                                <Media src={media.file} alt="review media" className="w-full h-full object-cover" />
                                                            )}
                                                        </div>
                                                    ))}
                                                </div>
                                            )}

                                            {/* Vendor Sub-Reviews */}
                                            {review.vendor_reviews?.length > 0 && (
                                                <div className="mt-4 pt-4 border-t space-y-3">
                                                    <h5 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Vendor Ratings</h5>
                                                    <div className="grid sm:grid-cols-2 gap-3">
                                                        {review.vendor_reviews.map((vr: any) => (
                                                            <div key={vr.id} className="bg-muted/30 rounded-xl p-3 border border-border/50 flex flex-col gap-2">
                                                                <div className="flex items-center justify-between">
                                                                    <div className="flex items-center gap-2">
                                                                        <div className="w-6 h-6 rounded bg-primary/10 flex items-center justify-center font-bold text-[10px] text-primary shrink-0">
                                                                            {vr.vendor_name ? vr.vendor_name[0].toUpperCase() : 'V'}
                                                                        </div>
                                                                        <span className="text-sm font-medium line-clamp-1">{vr.vendor_name || 'Vendor'}</span>
                                                                    </div>
                                                                    <div className="flex items-center shrink-0">
                                                                        <Star className="w-3 h-3 text-yellow-500 fill-yellow-500 mr-1" />
                                                                        <span className="text-xs font-semibold">{vr.rating}</span>
                                                                    </div>
                                                                </div>
                                                                {vr.text && <p className="text-xs text-muted-foreground line-clamp-3">{vr.text}</p>}
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center p-8 bg-muted/50 rounded-2xl border border-dashed">
                                    <p className="text-muted-foreground">No reviews yet. Be the first to share your thoughts!</p>
                                </div>
                            )}

                            <div className="bg-primary/5 rounded-2xl p-6 border border-primary/10 flex flex-col items-center justify-center text-center space-y-3 mt-6">
                                <h3 className="font-semibold text-primary">Attended this event?</h3>
                                <p className="text-sm text-muted-foreground">Share your experience to help others and support the host.</p>
                                <Button className="w-full sm:w-auto mt-2" onClick={() => setIsReviewOpen(true)}>Leave a Review</Button>
                            </div>
                        </section>
                    )}
                </div>
            )}

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

            <HighlightComposer
                eventId={Number(id)}
                isOpen={isHighlightOpen}
                onOpenChange={setIsHighlightOpen}
            />

            {event && (
                <ReviewComposer
                    eventId={Number(id)}
                    eventName={event.title}
                    participatingVendors={event.participating_vendors}
                    isOpen={isReviewOpen}
                    onOpenChange={setIsReviewOpen}
                />
            )}
        </div>
    );
}
