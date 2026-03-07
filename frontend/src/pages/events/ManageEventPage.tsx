/** Manage Event page — host-only dashboard for an event. */

import { ArrowLeft, Users, FileEdit, ImageIcon, Briefcase, LocateFixed, FileText, Calendar, Ticket, Activity, Repeat, MapPin, Clock } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { useAuth } from '@/features/auth/hooks';
import {
    useEvent,
    useEventAttendees,
    useCategories,
    useEventLifecycleHistory,
    useTransitionEventLifecycle,
    useGenerateEventSeriesOccurrences,
    useEventSeriesOccurrences,
    useDeleteEvent,
} from '@/features/events/hooks';
import { updateEvent } from '@/features/events/api';
import { compressImage } from '@/utils/image';
import { ManageNeedsTab } from '@/components/events/ManageNeedsTab';
import {
    canUseBrowserGeolocation,
    getCurrentCoordinates,
    reverseGeocodeCoordinates,
} from '@/utils/geolocation';
import type { EventLifecycleState } from '@/types/events';

const LIFECYCLE_TRANSITION_OPTIONS: { value: EventLifecycleState; label: string }[] = [
    { value: 'draft', label: 'Draft' },
    { value: 'published', label: 'Published' },
    { value: 'at_risk', label: 'At Risk' },
    { value: 'postponed', label: 'Postponed' },
    { value: 'event_ready', label: 'Event Ready' },
    { value: 'live', label: 'Live' },
    { value: 'completed', label: 'Completed' },
    { value: 'cancelled', label: 'Cancelled' },
];

export default function ManageEventPage() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { user } = useAuth();

    const { data: eventResponse, isLoading: isLoadingEvent } = useEvent(Number(id));
    const { data: attendeesResponse, isLoading: isLoadingAttendees } = useEventAttendees(Number(id));
    const { data: lifecycleHistoryResponse, isLoading: isLoadingLifecycleHistory } =
        useEventLifecycleHistory(Number(id));
    const { data: catResponse } = useCategories();
    const transitionLifecycle = useTransitionEventLifecycle();
    const generateOccurrences = useGenerateEventSeriesOccurrences();

    const event = eventResponse?.data;
    const attendees = attendeesResponse?.data || [];
    const lifecycleHistory = lifecycleHistoryResponse?.data || [];
    const categories = catResponse?.data || [];

    const [activeTab, setActiveTab] = useState<'details' | 'attendees' | 'needs'>('details');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isDetectingLocation, setIsDetectingLocation] = useState(false);
    const [coverPreview, setCoverPreview] = useState<string | null>(null);
    const [latitude, setLatitude] = useState<string>(event?.latitude?.toString() || '');
    const [longitude, setLongitude] = useState<string>(event?.longitude?.toString() || '');
    const [nextLifecycleState, setNextLifecycleState] = useState<EventLifecycleState>('published');
    const [transitionReason, setTransitionReason] = useState('');
    const [eventReadyMessage, setEventReadyMessage] = useState('');
    const [generateUntil, setGenerateUntil] = useState<string>('');
    const [previewDates, setPreviewDates] = useState<any[]>([]);

    const { data: occurrencesResponse, isLoading: isLoadingOccurrences } = useEventSeriesOccurrences(event?.series?.id ?? 0);
    const deleteEventMutation = useDeleteEvent();
    const occurrences = occurrencesResponse?.data || [];

    const locationNameRef = useRef<HTMLInputElement>(null);
    const locationAddressRef = useRef<HTMLInputElement>(null);

    // Redirect if not the host
    useEffect(() => {
        if (!isLoadingEvent && event && user) {
            if (event.host.username !== user.username) {
                toast.error("You are not authorized to manage this event");
                navigate(`/events/${event.id}`);
            }
        }
    }, [event, user, isLoadingEvent, navigate]);

    useEffect(() => {
        if (event?.cover_image) {
            setCoverPreview(event.cover_image);
        }
    }, [event]);

    useEffect(() => {
        if (event) {
            setLatitude(event.latitude !== null ? String(event.latitude) : '');
            setLongitude(event.longitude !== null ? String(event.longitude) : '');
            setNextLifecycleState(event.lifecycle_state || 'published');
            setEventReadyMessage(event.event_ready_message || '');
        }
    }, [event]);

    useEffect(() => {
        if (generateUntil && event?.series?.id) {
            const timeout = setTimeout(async () => {
                try {
                    const res = await generateOccurrences.mutateAsync({
                        seriesId: event!.series!.id,
                        payload: { generate_until: generateUntil + 'T23:59:59Z', preview: true },
                    });
                    setPreviewDates(res.data);
                } catch (e) {
                    console.error("Preview failed", e);
                }
            }, 500);
            return () => clearTimeout(timeout);
        } else {
            setPreviewDates([]);
        }
    }, [generateUntil, event?.series?.id]);

    if (isLoadingEvent) {
        return (
            <div className="mx-auto max-w-4xl px-4 py-8 animate-pulse space-y-6">
                <div className="h-8 w-48 rounded bg-muted" />
                <div className="h-64 rounded bg-muted" />
            </div>
        );
    }

    if (!event) {
        return <div className="p-8 text-center text-muted-foreground">Event not found</div>;
    }

    const handleUpdate = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setIsSubmitting(true);

        const form = e.currentTarget;
        const formData = new FormData(form);

        // Avoid sending empty strings for optional numeric fields.
        ['latitude', 'longitude', 'ticket_price_standard', 'ticket_price_flexible', 'capacity'].forEach(
            (field) => {
                if (!String(formData.get(field) || '').trim()) {
                    formData.delete(field);
                }
            }
        );

        const coverInput = form.querySelector<HTMLInputElement>('#cover_image');
        if (coverInput?.files?.[0]) {
            try {
                const compressedFile = await compressImage(coverInput.files[0], { newFileName: 'event_cover' });
                console.log(`Original size: ${Math.round(coverInput.files[0].size / 1024)}KB, Compressed size: ${Math.round(compressedFile.size / 1024)}KB`);
                toast.info(`Image compressed: ${Math.round(coverInput.files[0].size / 1024)}KB -> ${Math.round(compressedFile.size / 1024)}KB`);
                formData.delete('cover_image');
                formData.set('cover_image', compressedFile);
            } catch (err) {
                console.error("Image compression failed", err);
                formData.set('cover_image', coverInput.files[0]); // Fallback to original
            }
        } else {
            formData.delete('cover_image');
        }

        try {
            await updateEvent(event.id, formData);

            if (previewDates.length > 0 && generateUntil && event?.series?.id) {
                await generateOccurrences.mutateAsync({
                    seriesId: event.series.id as number,
                    payload: { generate_until: generateUntil + 'T23:59:59Z', preview: false },
                });
                setGenerateUntil('');
                setPreviewDates([]);
            }

            toast.success('Event updated successfully!');
        } catch (err: any) {
            toast.error(err?.response?.data?.message || 'Failed to update event');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleCoverChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = () => setCoverPreview(reader.result as string);
            reader.readAsDataURL(file);
        }
    };

    const dateToLocalValue = (dateStr: string) => {
        if (!dateStr) return '';
        const d = new Date(dateStr);
        return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
    };

    const handleUseCurrentLocation = async () => {
        if (!canUseBrowserGeolocation()) {
            toast.error('Location needs HTTPS in production. It should work on localhost.');
            return;
        }

        setIsDetectingLocation(true);
        try {
            const coords = await getCurrentCoordinates();
            setLatitude(coords.latitude.toFixed(6));
            setLongitude(coords.longitude.toFixed(6));

            const reverse = await reverseGeocodeCoordinates(coords.latitude, coords.longitude);
            if (reverse) {
                if (locationNameRef.current) {
                    locationNameRef.current.value = reverse.venueName;
                }
                if (locationAddressRef.current) {
                    locationAddressRef.current.value = reverse.displayAddress;
                }
                toast.success('Location updated from your current position');
            } else {
                if (locationNameRef.current && !locationNameRef.current.value.trim()) {
                    locationNameRef.current.value = 'Current Location';
                }
                toast.success('Coordinates updated. You can edit venue/address manually.');
            }
        } catch (err: any) {
            const message =
                err?.code === 1
                    ? 'Location permission was denied.'
                    : 'Could not access your location right now.';
            toast.error(message);
        } finally {
            setIsDetectingLocation(false);
        }
    };

    const handleTransitionLifecycle = async () => {
        if (nextLifecycleState === event.lifecycle_state) {
            toast.info('Event is already in that lifecycle state');
            return;
        }
        try {
            if (nextLifecycleState === 'event_ready') {
                const trimmedMessage = eventReadyMessage.trim();
                if (!trimmedMessage) {
                    toast.error('Please add an event ready message');
                    return;
                }

                const messageForm = new FormData();
                messageForm.set('event_ready_message', trimmedMessage);
                await updateEvent(event.id, messageForm);
            }

            await transitionLifecycle.mutateAsync({
                eventId: event.id,
                toState: nextLifecycleState,
                reason: transitionReason.trim() || undefined,
            });
            setTransitionReason('');
            toast.success('Lifecycle state updated');
        } catch (err: any) {
            toast.error(err?.response?.data?.message || 'Failed to update lifecycle state');
        }
    };

    const handleDeleteOccurrence = async (occurrenceId: number) => {
        if (!window.confirm('Are you sure you want to delete this event occurence?')) return;
        try {
            await deleteEventMutation.mutateAsync(occurrenceId);
            toast.success('Event deleted');
        } catch (err: any) {
            toast.error('Failed to delete event');
        }
    };

    return (
        <div className="min-h-screen px-4 sm:px-6 py-8" style={{ background: '#f4f1ea', backgroundImage: 'radial-gradient(#d1d5db 0.5px, transparent 0.5px)', backgroundSize: '15px 15px' }}>
            <div className="mx-auto max-w-4xl">
                <div className="relative mb-8 flex items-center gap-4">
                    <button
                        onClick={() => navigate(`/events/${event.id}`)}
                        className="flex items-center justify-center h-10 w-10 border-2 border-gray-800 rounded-full bg-white shadow-[2px_2px_0px_#333] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[1px_1px_0px_#333] transition-all relative z-10"
                    >
                        <ArrowLeft className="h-5 w-5" />
                    </button>
                    <div className="relative">
                        <div className="absolute -top-1 left-0 w-24 h-5 pointer-events-none" style={{ background: 'rgba(251, 191, 36, 0.5)', transform: 'rotate(-3deg)', border: '1px solid rgba(0,0,0,0.05)' }} />
                        <h1 className="text-3xl text-gray-900" style={{ fontFamily: '"Permanent Marker", cursive', transform: 'rotate(-1deg)' }}>Manage Event</h1>
                        <p className="text-gray-500 text-lg" style={{ fontFamily: '"Caveat", cursive', transform: 'rotate(1deg)' }}>{event.title}</p>
                    </div>
                </div>

                <div className="flex gap-1 mb-8 overflow-x-auto pb-1 mt-4">
                    {[
                        { id: 'details', icon: FileEdit, label: 'Edit Details' },
                        { id: 'attendees', icon: Users, label: `Attendees (${event.ticket_count})` },
                        { id: 'needs', icon: Briefcase, label: 'Needs & Vendors' }
                    ].map((t) => (
                        <button
                            key={t.id}
                            onClick={() => setActiveTab(t.id as any)}
                            className={`flex items-center gap-2 px-5 py-2.5 border-2 border-b-0 transition-all whitespace-nowrap ${activeTab === t.id
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

                {activeTab === 'details' && (
                    <form onSubmit={handleUpdate} className="space-y-8 pb-12">
                        {/* Basic Info Card */}
                        <div className="bg-white border-2 border-gray-800 p-6 shadow-[3px_4px_0px_#333] relative mb-8" style={{ transform: 'rotate(-0.5deg)' }}>
                            <div className="flex items-center gap-2 mb-6 border-b-2 border-gray-800 pb-2 border-dashed">
                                <FileText className="h-6 w-6 text-gray-800" />
                                <h2 className="text-xl font-bold" style={{ fontFamily: '"Caveat", cursive', fontSize: '1.8rem' }}>Basic Information</h2>
                            </div>
                            <div className="space-y-6">
                                {/* Cover Image */}
                                <div>
                                    <label className="block text-sm font-medium mb-2">Cover Image</label>
                                    <label
                                        htmlFor="cover_image"
                                        className="flex flex-col items-center justify-center h-48 rounded-xl border-2 border-dashed border-border cursor-pointer hover:border-primary/50 transition-colors overflow-hidden bg-muted/30 group"
                                    >
                                        {coverPreview ? (
                                            <div className="relative w-full h-full">
                                                <img src={coverPreview} alt="Cover preview" className="h-full w-full object-cover group-hover:opacity-75 transition-opacity" />
                                                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <span className="bg-background/80 px-3 py-1.5 rounded-md text-sm font-medium shadow-sm">Change Image</span>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="flex flex-col items-center gap-2 text-muted-foreground">
                                                <ImageIcon className="h-8 w-8 mb-1 opacity-80" />
                                                <span className="text-sm font-medium">Click to upload cover image</span>
                                                <span className="text-xs opacity-75">JPEG, PNG, WEBP (max 5MB)</span>
                                            </div>
                                        )}
                                    </label>
                                    <input id="cover_image" name="cover_image" type="file" accept="image/jpeg,image/png,image/webp" onChange={handleCoverChange} className="hidden" />
                                </div>

                                <div className="grid md:grid-cols-2 gap-6">
                                    <div className="space-y-4">
                                        <div>
                                            <label htmlFor="title" className="block text-sm font-medium mb-1">Title *</label>
                                            <input id="title" name="title" defaultValue={event.title} required className="w-full rounded-lg border bg-background px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary/20 transition-all" />
                                        </div>
                                        <div>
                                            <label htmlFor="category_id" className="block text-sm font-medium mb-1">Category *</label>
                                            <select id="category_id" name="category_id" defaultValue={event.category?.id} required className="w-full rounded-lg border bg-background px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary/20 transition-all">
                                                <option value="">Select a category</option>
                                                {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                            </select>
                                        </div>
                                    </div>
                                    <div className="space-y-4">
                                        <div>
                                            <label htmlFor="description" className="block text-sm font-medium mb-1">Description *</label>
                                            <textarea id="description" name="description" defaultValue={event.description} required rows={5} className="w-full rounded-lg border bg-background px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary/20 transition-all resize-none" />
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    <label htmlFor="check_in_instructions" className="block text-sm font-medium mb-1">Check-in Instructions</label>
                                    <textarea
                                        id="check_in_instructions"
                                        name="check_in_instructions"
                                        defaultValue={event.check_in_instructions || ''}
                                        rows={2}
                                        placeholder="Entry gate, QR scan process, what to bring, contact point..."
                                        className="w-full rounded-lg border bg-background px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary/20 transition-all resize-none"
                                    />
                                    <p className="text-xs text-muted-foreground mt-1.5">These instructions will be visible to attendees after they purchase a ticket or RSVP.</p>
                                </div>
                            </div>
                        </div>

                        {/* Schedule & Location Card */}
                        <div className="bg-[#fffdf5] border-2 border-gray-800 p-6 shadow-[3px_4px_0px_#333] relative mb-8" style={{ transform: 'rotate(0.5deg)' }}>
                            <div className="flex items-center gap-2 mb-6 border-b-2 border-gray-800 pb-2 border-dashed">
                                <Calendar className="h-6 w-6 text-gray-800" />
                                <h2 className="text-xl font-bold" style={{ fontFamily: '"Caveat", cursive', fontSize: '1.8rem' }}>Schedule & Location</h2>
                            </div>
                            <div className="grid md:grid-cols-2 gap-8">
                                {/* Dates */}
                                <div className="space-y-4">
                                    <h3 className="text-sm font-semibold flex items-center gap-2 text-foreground mb-4">
                                        <Clock className="h-4 w-4 text-muted-foreground" /> Date & Time
                                    </h3>
                                    <div>
                                        <label htmlFor="start_time" className="block text-sm font-medium mb-1">Start Time *</label>
                                        <input id="start_time" name="start_time" type="datetime-local" defaultValue={dateToLocalValue(event.start_time)} required className="w-full rounded-lg border bg-background px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary/20 transition-all" />
                                    </div>
                                    <div>
                                        <label htmlFor="end_time" className="block text-sm font-medium mb-1">End Time *</label>
                                        <input id="end_time" name="end_time" type="datetime-local" defaultValue={dateToLocalValue(event.end_time)} required className="w-full rounded-lg border bg-background px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary/20 transition-all" />
                                    </div>
                                </div>

                                {/* Location */}
                                <div className="space-y-4">
                                    <h3 className="text-sm font-semibold flex items-center gap-2 text-foreground mb-4">
                                        <MapPin className="h-4 w-4 text-muted-foreground" /> Venue
                                    </h3>
                                    <div>
                                        <label htmlFor="location_name" className="block text-sm font-medium mb-1">Location Name *</label>
                                        <input id="location_name" name="location_name" ref={locationNameRef} defaultValue={event.location_name} required placeholder="e.g. Central Park" className="w-full rounded-lg border bg-background px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary/20 transition-all" />
                                    </div>
                                    <div className="space-y-2">
                                        <div className="flex items-center justify-between gap-2">
                                            <label htmlFor="location_address" className="block text-sm font-medium mb-1">Address</label>
                                            <Button
                                                type="button"
                                                variant="secondary"
                                                size="sm"
                                                onClick={handleUseCurrentLocation}
                                                disabled={isDetectingLocation}
                                                className="h-7 px-2.5 text-xs bg-primary/10 text-primary hover:bg-primary/20"
                                            >
                                                <LocateFixed className="h-3.5 w-3.5 mr-1.5" />
                                                {isDetectingLocation ? 'Detecting...' : 'Use My Location'}
                                            </Button>
                                        </div>
                                        <input id="location_address" name="location_address" ref={locationAddressRef} defaultValue={event.location_address || ''} placeholder="Full street address" className="w-full rounded-lg border bg-background px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary/20 transition-all" />
                                    </div>
                                    <input type="hidden" name="latitude" value={latitude} />
                                    <input type="hidden" name="longitude" value={longitude} />
                                    {latitude && longitude && (
                                        <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                                            <span className="inline-block w-2 h-2 rounded-full bg-green-500"></span>
                                            Coordinates set ({latitude}, {longitude})
                                        </p>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Tickets Card */}
                        <div className="bg-[#f0f9ff] border-2 border-gray-800 p-6 shadow-[3px_4px_0px_#333] relative mb-8" style={{ transform: 'rotate(-0.25deg)' }}>
                            <div className="flex items-center gap-2 mb-6 border-b-2 border-gray-800 pb-2 border-dashed">
                                <Ticket className="h-6 w-6 text-gray-800" />
                                <h2 className="text-xl font-bold" style={{ fontFamily: '"Caveat", cursive', fontSize: '1.8rem' }}>Tickets & Capacity</h2>
                            </div>
                            <div className="grid md:grid-cols-3 gap-6">
                                <div>
                                    <label htmlFor="capacity" className="block text-sm font-medium mb-1">Capacity</label>
                                    <div className="relative">
                                        <Users className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                        <input id="capacity" name="capacity" type="number" defaultValue={event.capacity || ''} placeholder="Unlimited" className="w-full rounded-lg border bg-background pl-10 pr-4 py-2.5 text-sm focus:ring-2 focus:ring-primary/20 transition-all" />
                                    </div>
                                </div>
                                <div>
                                    <label htmlFor="ticket_price_standard" className="block text-sm font-medium mb-1">Standard Price ($)</label>
                                    <div className="relative">
                                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-medium">$</span>
                                        <input id="ticket_price_standard" name="ticket_price_standard" type="number" step="0.01" defaultValue={event.ticket_price_standard || ''} placeholder="Free" className="w-full rounded-lg border bg-background pl-8 pr-4 py-2.5 text-sm focus:ring-2 focus:ring-primary/20 transition-all" />
                                    </div>
                                </div>
                                <div>
                                    <label htmlFor="ticket_price_flexible" className="block text-sm font-medium mb-1">Flexible Price ($)</label>
                                    <div className="relative">
                                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-medium">$</span>
                                        <input id="ticket_price_flexible" name="ticket_price_flexible" type="number" step="0.01" defaultValue={event.ticket_price_flexible || ''} placeholder="Disabled" className="w-full rounded-lg border bg-background pl-8 pr-4 py-2.5 text-sm focus:ring-2 focus:ring-primary/20 transition-all" />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Status & Controls Card */}
                        <div className="bg-[#fff5f5] border-2 border-gray-800 p-6 shadow-[3px_4px_0px_#333] relative mb-8" style={{ transform: 'rotate(0.25deg)' }}>
                            <div className="flex items-center gap-2 mb-6 border-b-2 border-gray-800 pb-2 border-dashed">
                                <Activity className="h-6 w-6 text-gray-800" />
                                <h2 className="text-xl font-bold" style={{ fontFamily: '"Caveat", cursive', fontSize: '1.8rem' }}>Status & Controls</h2>
                            </div>
                            <div className="grid md:grid-cols-2 gap-8 divide-y md:divide-y-0 md:divide-x border-gray-800">
                                {/* Lifecycle */}
                                <div className="space-y-5">
                                    <div>
                                        <h3 className="text-sm font-semibold mb-1">Event Lifecycle</h3>
                                        <p className="text-xs text-muted-foreground">Manage the current status of your event.</p>
                                    </div>

                                    <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30 border">
                                        <span className="text-sm font-medium">Current Status</span>
                                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-primary/10 text-primary uppercase tracking-wide">
                                            {event.lifecycle_state.replace('_', ' ')}
                                        </span>
                                    </div>

                                    <div className="space-y-3">
                                        <div>
                                            <label className="block text-xs font-medium mb-1">Transition To</label>
                                            <select
                                                value={nextLifecycleState}
                                                onChange={(e) => setNextLifecycleState(e.target.value as EventLifecycleState)}
                                                className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:ring-2 focus:ring-primary/20 transition-all"
                                            >
                                                {LIFECYCLE_TRANSITION_OPTIONS.map((option) => (
                                                    <option key={option.value} value={option.value}>
                                                        {option.label}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-xs font-medium mb-1">Reason (optional)</label>
                                            <input
                                                value={transitionReason}
                                                onChange={(e) => setTransitionReason(e.target.value)}
                                                placeholder="Why is the status changing?"
                                                className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:ring-2 focus:ring-primary/20 transition-all"
                                            />
                                        </div>

                                        {nextLifecycleState === 'event_ready' && (
                                            <div className="rounded-md border bg-primary/5 border-primary/20 p-3 mt-3">
                                                <label className="block text-xs font-semibold uppercase tracking-wide text-primary mb-1">
                                                    Event Ready Message
                                                </label>
                                                <p className="text-xs text-muted-foreground mb-2">This message will be sent to all attendees.</p>
                                                <textarea
                                                    value={eventReadyMessage}
                                                    onChange={(e) => setEventReadyMessage(e.target.value)}
                                                    rows={3}
                                                    placeholder="Share day-of notes, parking updates, or welcome messages..."
                                                    className="w-full rounded-lg border bg-background px-3 py-2 text-sm resize-none focus:ring-2 focus:ring-primary/20 transition-all"
                                                />
                                            </div>
                                        )}

                                        <Button
                                            type="button"
                                            variant="secondary"
                                            className="w-full"
                                            onClick={handleTransitionLifecycle}
                                            disabled={transitionLifecycle.isPending || nextLifecycleState === event.lifecycle_state}
                                        >
                                            {transitionLifecycle.isPending ? 'Updating Status...' : 'Apply Transition'}
                                        </Button>
                                    </div>

                                    <div className="pt-4 mt-4 border-t">
                                        <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-3">
                                            Transition History
                                        </h4>
                                        {isLoadingLifecycleHistory ? (
                                            <p className="text-sm text-muted-foreground animate-pulse">Loading history...</p>
                                        ) : lifecycleHistory.length === 0 ? (
                                            <p className="text-sm text-muted-foreground italic">No transitions recorded.</p>
                                        ) : (
                                            <div className="space-y-3">
                                                {lifecycleHistory.slice(0, 4).map((entry) => (
                                                    <div key={entry.id} className="relative pl-4 border-l-2 border-muted pb-1 last:pb-0 last:border-transparent">
                                                        <div className="absolute w-2 h-2 bg-muted-foreground/30 rounded-full -left-[5px] top-1.5 ring-4 ring-background"></div>
                                                        <div className="text-xs">
                                                            <div className="font-medium flex items-center gap-1.5 text-foreground">
                                                                <span className="capitalize">{entry.from_state.replace('_', ' ')}</span>
                                                                <ArrowLeft className="h-3 w-3 rotate-180 text-muted-foreground" />
                                                                <span className="capitalize">{entry.to_state.replace('_', ' ')}</span>
                                                            </div>
                                                            <div className="text-muted-foreground mt-0.5">
                                                                {new Date(entry.created_at).toLocaleDateString()} at {new Date(entry.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} · {entry.actor_username || 'system'}
                                                            </div>
                                                            {entry.reason && (
                                                                <div className="text-muted-foreground/80 mt-1 italic border-l-2 border-muted pl-2 py-0.5 bg-muted/10 rounded-r">
                                                                    "{entry.reason}"
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Recurrence (if applicable) */}
                                <div className="md:pl-8 space-y-5 pt-8 md:pt-0">
                                    {event?.series ? (
                                        <>
                                            <div>
                                                <h3 className="text-sm font-semibold mb-1 flex items-center gap-2">
                                                    <Repeat className="h-4 w-4 text-primary" /> Recurring Schedule
                                                </h3>
                                                <p className="text-xs text-muted-foreground">This event is part of a series. Manage future occurrences.</p>
                                            </div>

                                            <div className="rounded-xl border bg-primary/5 p-4 border-primary/20">
                                                <div className="mb-4">
                                                    <label className="block text-sm font-medium mb-1">Generate Until Date</label>
                                                    <p className="text-xs text-muted-foreground">Select an end date to auto-populate future occurrences based on your event's recurrence rule.</p>
                                                </div>
                                                <div className="relative">
                                                    <input
                                                        type="date"
                                                        value={generateUntil}
                                                        onChange={(e) => setGenerateUntil(e.target.value)}
                                                        className="w-full rounded-lg border bg-background px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary/20 transition-all font-medium"
                                                    />
                                                </div>
                                                {previewDates.length > 0 && (
                                                    <div className="mt-4 pt-4 border-t border-primary/10">
                                                        <h4 className="text-xs font-semibold uppercase tracking-wide text-primary mb-2">
                                                            Will Generate {previewDates.length} Instances
                                                        </h4>
                                                        <ul className="text-sm space-y-1 max-h-32 overflow-y-auto">
                                                            {previewDates.map((d: any, idx) => (
                                                                <li key={idx} className="text-muted-foreground flex items-center gap-2">
                                                                    <span className="w-1.5 h-1.5 rounded-full bg-primary/40 inline-block"></span>
                                                                    {new Date(d.start_time).toLocaleDateString()} - {new Date(d.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                                </li>
                                                            ))}
                                                        </ul>
                                                    </div>
                                                )}
                                            </div>

                                            {/* List of existing instances */}
                                            <div className="pt-4 mt-4 border-t">
                                                <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-3 flex items-center justify-between">
                                                    <span>Upcoming Occurrences</span>
                                                    <span className="px-2 py-0.5 rounded-full bg-muted text-xs">{occurrences.filter((o: any) => o.lifecycle_state !== 'cancelled').length} scheduled</span>
                                                </h4>
                                                {isLoadingOccurrences ? (
                                                    <p className="text-sm text-muted-foreground animate-pulse">Loading occurrences...</p>
                                                ) : occurrences.length === 0 ? (
                                                    <p className="text-sm text-muted-foreground italic">No occurrences found.</p>
                                                ) : (
                                                    <div className="space-y-2 max-h-60 overflow-y-auto pr-2">
                                                        {occurrences.map((occ: any) => {
                                                            const isCancelled = occ.lifecycle_state === 'cancelled';
                                                            return (
                                                                <div key={occ.id} className={`flex items-center justify-between p-2.5 rounded-lg border bg-card text-sm ${isCancelled ? 'opacity-60' : ''}`}>
                                                                    <div>
                                                                        <div className="font-medium flex items-center gap-2">
                                                                            {new Date(occ.start_time).toLocaleDateString()}
                                                                            {isCancelled && <span className="text-[10px] uppercase font-bold text-destructive bg-destructive/10 px-1.5 py-0.5 rounded">Cancelled</span>}
                                                                        </div>
                                                                        <div className="text-xs text-muted-foreground mt-0.5">
                                                                            {new Date(occ.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                                        </div>
                                                                    </div>
                                                                    {!isCancelled && occ.id !== event.id && (
                                                                        <div className="flex items-center gap-2">
                                                                            <Button
                                                                                type="button"
                                                                                variant="ghost"
                                                                                size="sm"
                                                                                className="h-7 text-xs"
                                                                                onClick={() => navigate(`/events/${occ.id}`)}
                                                                            >
                                                                                View
                                                                            </Button>
                                                                            <Button
                                                                                type="button"
                                                                                variant="ghost"
                                                                                size="sm"
                                                                                className="h-7 text-xs text-destructive hover:bg-destructive/10"
                                                                                onClick={() => handleDeleteOccurrence(occ.id)}
                                                                            >
                                                                                Delete
                                                                            </Button>
                                                                        </div>
                                                                    )}
                                                                    {occ.id === event.id && (
                                                                        <span className="text-xs font-medium text-primary px-2">Currently Editing</span>
                                                                    )}
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                )}
                                            </div>
                                        </>
                                    ) : (
                                        <div className="h-full flex flex-col items-center justify-center text-center p-6 border-2 border-dashed rounded-xl border-muted bg-muted/10">
                                            <Repeat className="h-8 w-8 text-muted-foreground/30 mb-2" />
                                            <h3 className="text-sm font-medium text-foreground">Not a recurring event</h3>
                                            <p className="text-xs text-muted-foreground mt-1 max-w-[200px]">
                                                This is a single occurrence event. Scheduled future dates cannot be generated automatically.
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="flex justify-end gap-3 pt-2 sticky bottom-6 z-10">
                            <Button type="submit" size="lg" disabled={isSubmitting} className="border-2 border-gray-800 bg-yellow-300 text-gray-900 shadow-[2px_3px_0px_#333] hover:bg-yellow-400 hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[1px_1px_0px_#333] transition-all font-bold px-8" style={{ fontFamily: '"Permanent Marker", cursive', fontSize: '1.1rem' }}>
                                {isSubmitting ? 'Saving...' : 'Save All Changes'}
                            </Button>
                        </div>
                    </form>
                )}

                {activeTab === 'attendees' && (
                    <div className="space-y-6">
                        <div className="flex gap-4 mb-4">
                            <div className="bg-white border-2 border-gray-800 p-5 shadow-[2px_3px_0px_#333] flex-1 relative" style={{ transform: 'rotate(-1deg)' }}>
                                <div className="absolute -top-3 -right-3 w-8 h-8 rounded-full bg-red-400 border-2 border-gray-800 shadow-[1px_1px_0px_#333] flex items-center justify-center rotate-12 text-sm">📌</div>
                                <p className="text-sm font-bold text-gray-500 mb-1" style={{ fontFamily: '"Permanent Marker", cursive' }}>Total Tickets Sold</p>
                                <p className="text-4xl font-bold text-gray-900" style={{ fontFamily: '"Caveat", cursive' }}>{event.ticket_count}</p>
                            </div>
                            <div className="bg-white border-2 border-gray-800 p-5 shadow-[2px_3px_0px_#333] flex-1 relative" style={{ transform: 'rotate(1deg)' }}>
                                <div className="absolute -top-2 left-4 w-10 h-3 bg-yellow-200 border border-gray-400/50 shadow-sm rotate-[-5deg]" />
                                <p className="text-sm font-bold text-gray-500 mb-1" style={{ fontFamily: '"Permanent Marker", cursive' }}>Interested Users</p>
                                <p className="text-4xl font-bold text-gray-900" style={{ fontFamily: '"Caveat", cursive' }}>{event.interest_count}</p>
                            </div>
                        </div>

                        <div className="bg-white border-2 border-gray-800 shadow-[3px_4px_0px_#333] overflow-hidden">
                            {isLoadingAttendees ? (
                                <div className="p-8 text-center text-muted-foreground">Loading attendees...</div>
                            ) : attendees.length === 0 ? (
                                <div className="p-8 text-center flex flex-col items-center">
                                    <Users className="h-12 w-12 text-muted-foreground/30 mb-3" />
                                    <p className="text-muted-foreground">No tickets sold yet</p>
                                </div>
                            ) : (
                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm text-left">
                                        <thead className="bg-muted/50 text-muted-foreground border-b">
                                            <tr>
                                                <th className="px-6 py-3 font-medium">Attendee</th>
                                                <th className="px-6 py-3 font-medium">Ticket Type</th>
                                                <th className="px-6 py-3 font-medium">Status</th>
                                                <th className="px-6 py-3 font-medium text-right">Purchase Date</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y">
                                            {attendees.map((attendee) => (
                                                <tr key={attendee.id} className="hover:bg-muted/50 transition-colors">
                                                    <td className="px-6 py-4">
                                                        <div className="flex items-center gap-3">
                                                            {attendee.user.avatar ? (
                                                                <img src={attendee.user.avatar} className="w-8 h-8 rounded-full object-cover" />
                                                            ) : (
                                                                <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center font-semibold text-primary text-xs">
                                                                    {(attendee.user.first_name?.[0] || attendee.user.username[0]).toUpperCase()}
                                                                </div>
                                                            )}
                                                            <div>
                                                                <p className="font-medium text-foreground">{attendee.user.first_name || attendee.user.username}</p>
                                                                <p className="text-xs text-muted-foreground">@{attendee.user.username}</p>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${attendee.ticket_type === 'flexible' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300' : 'bg-secondary text-secondary-foreground'
                                                            }`}>
                                                            {attendee.ticket_type.charAt(0).toUpperCase() + attendee.ticket_type.slice(1)}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <span className="capitalize text-muted-foreground">{attendee.status}</span>
                                                    </td>
                                                    <td className="px-6 py-4 text-right text-muted-foreground">
                                                        {new Date(attendee.purchased_at).toLocaleDateString()}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {activeTab === 'needs' && <ManageNeedsTab eventId={event.id} />}
            </div>
        </div>
    );
}
