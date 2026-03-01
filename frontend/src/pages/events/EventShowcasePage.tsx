import { useParams, Link } from 'react-router-dom';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Calendar, MapPin, Clock, ChevronRight } from 'lucide-react';
import { useEventStory, useEventSeriesOccurrences } from '@/features/events/hooks';
import { HighlightComposer } from '@/components/events/HighlightComposer';
import { ReviewComposer } from '@/components/events/ReviewComposer';

// We'll build this out with real API data and the components from the spec
export default function EventShowcasePage() {
    const { eventId } = useParams<{ eventId: string }>();
    const { data: storyResponse, isLoading } = useEventStory(Number(eventId));

    const [isHighlightOpen, setIsHighlightOpen] = useState(false);
    const [isReviewOpen, setIsReviewOpen] = useState(false);

    const event = storyResponse?.data;
    const { data: occurrencesResponse } = useEventSeriesOccurrences(event?.series?.id || 0, {
        enabled: !!event?.series?.id
    });
    const occurrences = occurrencesResponse?.data || [];

    if (isLoading) {
        return (
            <div className="min-h-screen bg-background animate-pulse">
                <div className="h-[60vh] w-full bg-slate-800" />
                <div className="max-w-6xl mx-auto p-8 grid grid-cols-1 lg:grid-cols-3 gap-12">
                    <div className="lg:col-span-2 space-y-4">
                        <div className="h-10 bg-muted rounded w-1/3" />
                        <div className="h-32 bg-muted rounded" />
                    </div>
                    <div className="h-64 bg-muted rounded-2xl" />
                </div>
            </div>
        );
    }

    if (!event) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[50vh]">
                <p className="text-lg text-muted-foreground">Event story not found</p>
                <Link to="/"><Button variant="ghost" className="mt-4">Go Home</Button></Link>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background">
            {/* Hero Section */}
            <div className="relative h-[60vh] w-full bg-slate-900 overflow-hidden">
                {/* Placeholder for Cover Image/Video */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-black/10 z-10" />
                <div className="absolute bottom-0 left-0 w-full p-8 z-20 text-white">
                    <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-end gap-6">
                        <div className="space-y-4">
                            {event.category && (
                                <div className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 bg-white/20 hover:bg-white/30 text-white backdrop-blur-md border border-white/10 w-fit">
                                    {event.category.name}
                                </div>
                            )}
                            <h1 className="text-4xl md:text-6xl font-bold tracking-tight">
                                {event.title}
                            </h1>
                            <div className="flex items-center gap-4 text-white/80 text-sm md:text-base">
                                <div className="flex items-center gap-1.5">
                                    <Calendar className="w-4 h-4" />
                                    <span>{new Date(event.start_time).toLocaleDateString()}</span>
                                </div>
                                <div className="flex items-center gap-1.5">
                                    <Clock className="w-4 h-4" />
                                    <span>{new Date(event.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                </div>
                                <div className="flex items-center gap-1.5">
                                    <MapPin className="w-4 h-4" />
                                    <span>{event.location_name}</span>
                                </div>
                            </div>
                        </div>
                        <div className="flex-shrink-0 w-full md:w-auto">
                            <Link to={`/events/${eventId}`}>
                                <Button size="lg" className="w-full md:w-auto text-lg px-8 py-6 rounded-xl font-semibold shadow-2xl bg-primary text-primary-foreground hover:bg-primary/90 transition-all hover:scale-105 active:scale-95">
                                    Get Tickets
                                </Button>
                            </Link>
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-6xl mx-auto px-4 py-12 md:px-8 grid grid-cols-1 lg:grid-cols-3 gap-12">
                {/* Main Content Area */}
                <div className="lg:col-span-2 space-y-12">

                    <section className="space-y-6">
                        <h2 className="text-3xl font-bold">About the Experience</h2>
                        <p className="text-lg text-muted-foreground leading-relaxed whitespace-pre-wrap">
                            {event.description}
                        </p>
                    </section>

                    {/* Series Timeline */}
                    {event.series && occurrences.length > 0 && (
                        <section className="space-y-6 pt-6 border-t border-border/50">
                            <h2 className="text-3xl font-bold">Recurring Schedule</h2>
                            <p className="text-lg text-muted-foreground">
                                This event is part of a recurring schedule. View past and upcoming dates below.
                            </p>
                            <div className="space-y-3">
                                {occurrences.map((occ: any) => {
                                    const isCurrent = occ.id === event.id;
                                    const isPast = new Date(occ.start_time) < new Date();
                                    return (
                                        <div key={occ.id} className={`flex items-center justify-between p-4 rounded-xl border ${isCurrent ? 'bg-primary/5 border-primary/20' : 'bg-card hover:bg-muted/50 transition-colors'}`}>
                                            <div className="flex items-center gap-4">
                                                <div className={`p-3 rounded-xl ${isCurrent ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'}`}>
                                                    <Calendar className="w-5 h-5" />
                                                </div>
                                                <div>
                                                    <p className={`text-base font-medium ${isCurrent ? 'text-primary' : (isPast ? 'text-muted-foreground' : 'text-foreground')}`}>
                                                        {new Date(occ.start_time).toLocaleDateString()} · {new Date(occ.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                    </p>
                                                    {isCurrent && <p className="text-sm text-primary font-medium mt-0.5">Currently viewing</p>}
                                                </div>
                                            </div>
                                            {!isCurrent && (
                                                <Button variant="ghost" asChild>
                                                    <Link to={`/events/${occ.id}/story`}>
                                                        View <ChevronRight className="w-4 h-4 ml-1" />
                                                    </Link>
                                                </Button>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </section>
                    )}

                    {/* Highlights Feed */}
                    <section className="space-y-6">
                        <div className="flex items-center justify-between">
                            <h2 className="text-3xl font-bold">Highlights</h2>
                            <Button variant="outline" className="rounded-full" onClick={() => setIsHighlightOpen(true)}>
                                Add Highlight
                            </Button>
                        </div>
                        {event.highlights?.length > 0 ? (
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                {event.highlights.map((highlight: any) => (
                                    <div key={highlight.id} className="aspect-square bg-muted rounded-xl relative overflow-hidden group">
                                        {highlight.media_file && (
                                            <img src={highlight.media_file} alt="Highlight" className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
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
                    </section>
                </div>

                <div className="space-y-8">

                    {/* Action Block - Only show if event is over to leave a review */}
                    {event.lifecycle_state === 'completed' && (
                        <div className="bg-primary/5 rounded-2xl p-6 border border-primary/10 flex flex-col items-center justify-center text-center space-y-3">
                            <h3 className="font-semibold text-primary">Attended this event?</h3>
                            <p className="text-sm text-muted-foreground">Share your experience to help others and support the host.</p>
                            <Button className="w-full mt-2" onClick={() => setIsReviewOpen(true)}>Leave a Review</Button>
                        </div>
                    )}

                    {/* Host Credibility Module */}
                    <section className="bg-card rounded-2xl p-6 border shadow-sm">
                        <h3 className="font-semibold text-lg mb-4">Meet the Host</h3>
                        <div className="flex items-center gap-4 mb-4">
                            {event.host.avatar ? (
                                <img src={event.host.avatar} alt="host" className="w-16 h-16 rounded-full object-cover" />
                            ) : (
                                <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center font-bold text-xl text-primary">
                                    {event.host.username[0].toUpperCase()}
                                </div>
                            )}
                            <div>
                                <p className="font-medium text-lg">{event.host.first_name || event.host.username}</p>
                                <div className="flex flex-col gap-0.5 mt-0.5">
                                    {event.average_rating ? (
                                        <p className="text-sm text-foreground">★ {event.average_rating.toFixed(1)} <span className="text-muted-foreground">({event.reviews?.length} reviews)</span></p>
                                    ) : null}
                                    <p className="text-xs text-muted-foreground">{event.host_events_count} past events</p>
                                </div>
                            </div>
                        </div>
                        <p className="text-sm text-muted-foreground line-clamp-3">Host bio preview...</p>
                    </section>

                    {/* Vendor Spotlight */}
                    {event.participating_vendors?.length > 0 && (
                        <section className="bg-card rounded-2xl p-6 border shadow-sm">
                            <h3 className="font-semibold text-lg mb-4">The Lineup</h3>
                            <div className="space-y-4">
                                {event.participating_vendors.map((vendor: any) => (
                                    <div key={vendor.id} className="flex items-center gap-3">
                                        {vendor.vendor_avatar ? (
                                            <img src={vendor.vendor_avatar} alt="vendor" className="w-12 h-12 rounded-lg object-cover" />
                                        ) : (
                                            <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center text-xs font-bold text-muted-foreground">
                                                {vendor.vendor_name[0].toUpperCase()}
                                            </div>
                                        )}
                                        <div>
                                            <p className="font-medium">{vendor.title}</p>
                                            <p className="text-xs text-muted-foreground">by {vendor.vendor_name}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </section>
                    )}
                </div>
            </div>

            <HighlightComposer
                eventId={Number(eventId)}
                isOpen={isHighlightOpen}
                onOpenChange={setIsHighlightOpen}
            />
            {event && (
                <ReviewComposer
                    eventId={Number(eventId)}
                    eventName={event.title}
                    isOpen={isReviewOpen}
                    onOpenChange={setIsReviewOpen}
                />
            )}
        </div>
    );
}
