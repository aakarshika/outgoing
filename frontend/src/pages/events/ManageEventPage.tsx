/** Manage Event page — host-only dashboard for an event. */

import { ArrowLeft, Users, FileEdit, ImageIcon, Briefcase, LocateFixed } from 'lucide-react';
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
} from '@/features/events/hooks';
import { updateEvent } from '@/features/events/api';
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
    const [nextLifecycleState, setNextLifecycleState] =
        useState<EventLifecycleState>('published');
    const [transitionReason, setTransitionReason] = useState('');
    const [eventReadyMessage, setEventReadyMessage] = useState('');
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
            formData.set('cover_image', coverInput.files[0]);
        } else {
            formData.delete('cover_image');
        }

        try {
            await updateEvent(event.id, formData);
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

    return (
        <div className="mx-auto max-w-4xl px-4 sm:px-6 py-8">
            <div className="flex items-center gap-4 mb-8">
                <button
                    onClick={() => navigate(`/events/${event.id}`)}
                    className="flex items-center justify-center h-10 w-10 rounded-full hover:bg-muted transition-colors"
                >
                    <ArrowLeft className="h-5 w-5" />
                </button>
                <div>
                    <h1 className="text-2xl font-bold">Manage Event</h1>
                    <p className="text-muted-foreground text-sm">{event.title}</p>
                </div>
            </div>

            <div className="flex space-x-1 border-b mb-6 overflow-x-auto">
                <button
                    onClick={() => setActiveTab('details')}
                    className={`flex items-center gap-2 px-4 py-3 border-b-2 text-sm font-medium whitespace-nowrap transition-colors ${activeTab === 'details'
                        ? 'border-primary text-primary'
                        : 'border-transparent text-muted-foreground hover:text-foreground hover:border-muted'
                        }`}
                >
                    <FileEdit className="h-4 w-4" /> Edit Details
                </button>
                <button
                    onClick={() => setActiveTab('attendees')}
                    className={`flex items-center gap-2 px-4 py-3 border-b-2 text-sm font-medium whitespace-nowrap transition-colors ${activeTab === 'attendees'
                        ? 'border-primary text-primary'
                        : 'border-transparent text-muted-foreground hover:text-foreground hover:border-muted'
                        }`}
                >
                    <Users className="h-4 w-4" /> Attendees ({event.ticket_count})
                </button>
                <button
                    onClick={() => setActiveTab('needs')}
                    className={`flex items-center gap-2 px-4 py-3 border-b-2 text-sm font-medium whitespace-nowrap transition-colors ${activeTab === 'needs'
                        ? 'border-primary text-primary'
                        : 'border-transparent text-muted-foreground hover:text-foreground hover:border-muted'
                        }`}
                >
                    <Briefcase className="h-4 w-4" /> Needs & Vendors
                </button>
            </div>

            {activeTab === 'details' && (
                <div className="bg-card rounded-xl border p-6">
                    <form onSubmit={handleUpdate} className="space-y-6">
                        {/* Cover Image */}
                        <div>
                            <label className="block text-sm font-medium mb-2">Cover Image</label>
                            <label
                                htmlFor="cover_image"
                                className="flex flex-col items-center justify-center h-48 rounded-xl border-2 border-dashed border-border cursor-pointer hover:border-primary/50 transition-colors overflow-hidden bg-muted/30"
                            >
                                {coverPreview ? (
                                    <img src={coverPreview} alt="Cover preview" className="h-full w-full object-cover" />
                                ) : (
                                    <div className="flex flex-col items-center gap-2 text-muted-foreground">
                                        <ImageIcon className="h-8 w-8" />
                                        <span className="text-sm">Click to change (max 5 MB)</span>
                                    </div>
                                )}
                            </label>
                            <input id="cover_image" name="cover_image" type="file" accept="image/jpeg,image/png,image/webp" onChange={handleCoverChange} className="hidden" />
                        </div>

                        {/* Basic Info */}
                        <div className="grid md:grid-cols-2 gap-6">
                            <div className="space-y-4 md:col-span-2">
                                <div>
                                    <label htmlFor="title" className="block text-sm font-medium mb-1">Title *</label>
                                    <input id="title" name="title" defaultValue={event.title} required className="w-full rounded-lg border bg-background px-4 py-2 text-sm" />
                                </div>
                                <div>
                                    <label htmlFor="description" className="block text-sm font-medium mb-1">Description *</label>
                                    <textarea id="description" name="description" defaultValue={event.description} required rows={5} className="w-full rounded-lg border bg-background px-4 py-2 text-sm" />
                                </div>
                                <div>
                                    <label htmlFor="check_in_instructions" className="block text-sm font-medium mb-1">Check-in Instructions</label>
                                    <textarea
                                        id="check_in_instructions"
                                        name="check_in_instructions"
                                        defaultValue={event.check_in_instructions || ''}
                                        rows={3}
                                        placeholder="Entry gate, QR scan process, what to bring, contact point..."
                                        className="w-full rounded-lg border bg-background px-4 py-2 text-sm"
                                    />
                                </div>
                            </div>

                            <div>
                                <label htmlFor="category_id" className="block text-sm font-medium mb-1">Category *</label>
                                <select id="category_id" name="category_id" defaultValue={event.category?.id} required className="w-full rounded-lg border bg-background px-4 py-2 text-sm">
                                    <option value="">Select a category</option>
                                    {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                </select>
                            </div>

                            <div className="md:col-span-2 rounded-lg border bg-muted/30 p-4">
                                <h3 className="text-sm font-semibold">Lifecycle Control</h3>
                                <p className="text-xs text-muted-foreground mt-0.5 mb-3">
                                    Current state: <span className="font-medium text-foreground">{event.lifecycle_state}</span>
                                </p>
                                <div className="grid gap-3 md:grid-cols-[1fr_1fr_auto]">
                                    <div>
                                        <label className="block text-xs font-medium mb-1">Next State</label>
                                        <select
                                            value={nextLifecycleState}
                                            onChange={(e) =>
                                                setNextLifecycleState(e.target.value as EventLifecycleState)
                                            }
                                            className="w-full rounded-lg border bg-background px-3 py-2 text-sm"
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
                                            placeholder="Why this transition?"
                                            className="w-full rounded-lg border bg-background px-3 py-2 text-sm"
                                        />
                                    </div>
                                    <div className="flex items-end">
                                        <Button
                                            type="button"
                                            onClick={handleTransitionLifecycle}
                                            disabled={transitionLifecycle.isPending}
                                        >
                                            {transitionLifecycle.isPending
                                                ? 'Updating...'
                                                : 'Apply Transition'}
                                        </Button>
                                    </div>
                                </div>
                                <div className="mt-4 border-t pt-3">
                                    {nextLifecycleState === 'event_ready' && (
                                        <div className="mb-3 rounded-md border bg-background p-3">
                                            <label className="block text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1">
                                                Event Ready Message
                                            </label>
                                            <textarea
                                                value={eventReadyMessage}
                                                onChange={(e) => setEventReadyMessage(e.target.value)}
                                                rows={3}
                                                placeholder="Share day-of notes for attendees..."
                                                className="w-full rounded-lg border bg-background px-3 py-2 text-sm"
                                            />
                                        </div>
                                    )}
                                    <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                                        Transition History
                                    </h4>
                                    {isLoadingLifecycleHistory ? (
                                        <p className="text-sm text-muted-foreground mt-2">Loading history...</p>
                                    ) : lifecycleHistory.length === 0 ? (
                                        <p className="text-sm text-muted-foreground mt-2">No transitions yet.</p>
                                    ) : (
                                        <div className="mt-2 space-y-2">
                                            {lifecycleHistory.slice(0, 6).map((entry) => (
                                                <div key={entry.id} className="text-xs rounded-md border bg-background px-3 py-2">
                                                    <div className="font-medium">
                                                        {entry.from_state} → {entry.to_state}
                                                    </div>
                                                    <div className="text-muted-foreground">
                                                        {new Date(entry.created_at).toLocaleString()} ·{' '}
                                                        {entry.actor_username || 'system'}
                                                    </div>
                                                    {entry.reason && (
                                                        <div className="text-muted-foreground mt-1">
                                                            {entry.reason}
                                                        </div>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div>
                                <label htmlFor="start_time" className="block text-sm font-medium mb-1">Start Time *</label>
                                <input id="start_time" name="start_time" type="datetime-local" defaultValue={dateToLocalValue(event.start_time)} required className="w-full rounded-lg border bg-background px-4 py-2 text-sm" />
                            </div>
                            <div>
                                <label htmlFor="end_time" className="block text-sm font-medium mb-1">End Time *</label>
                                <input id="end_time" name="end_time" type="datetime-local" defaultValue={dateToLocalValue(event.end_time)} required className="w-full rounded-lg border bg-background px-4 py-2 text-sm" />
                            </div>

                            <div>
                                <label htmlFor="location_name" className="block text-sm font-medium mb-1">Location Name *</label>
                                <input id="location_name" name="location_name" ref={locationNameRef} defaultValue={event.location_name} required className="w-full rounded-lg border bg-background px-4 py-2 text-sm" />
                            </div>
                            <div>
                                <div className="mb-1 flex items-center justify-between gap-2">
                                    <label htmlFor="location_address" className="block text-sm font-medium">Address</label>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={handleUseCurrentLocation}
                                        disabled={isDetectingLocation}
                                        className="h-8 px-2.5 text-xs"
                                    >
                                        <LocateFixed className="h-3.5 w-3.5 mr-1" />
                                        {isDetectingLocation ? 'Detecting...' : 'Use My Location'}
                                    </Button>
                                </div>
                                <input id="location_address" name="location_address" ref={locationAddressRef} defaultValue={event.location_address || ''} className="w-full rounded-lg border bg-background px-4 py-2 text-sm" />
                            </div>
                            <input type="hidden" name="latitude" value={latitude} />
                            <input type="hidden" name="longitude" value={longitude} />

                            <div>
                                <label htmlFor="capacity" className="block text-sm font-medium mb-1">Capacity</label>
                                <input id="capacity" name="capacity" type="number" defaultValue={event.capacity || ''} className="w-full rounded-lg border bg-background px-4 py-2 text-sm" />
                            </div>
                            <div className="hidden md:block"></div>

                            <div>
                                <label htmlFor="ticket_price_standard" className="block text-sm font-medium mb-1">Standard Ticket Price</label>
                                <input id="ticket_price_standard" name="ticket_price_standard" type="number" step="0.01" defaultValue={event.ticket_price_standard || ''} className="w-full rounded-lg border bg-background px-4 py-2 text-sm" />
                            </div>
                            <div>
                                <label htmlFor="ticket_price_flexible" className="block text-sm font-medium mb-1">Flexible Ticket Price</label>
                                <input id="ticket_price_flexible" name="ticket_price_flexible" type="number" step="0.01" defaultValue={event.ticket_price_flexible || ''} className="w-full rounded-lg border bg-background px-4 py-2 text-sm" />
                            </div>
                        </div>

                        <div className="flex justify-end gap-3 pt-6 border-t mt-6">
                            <Button type="submit" disabled={isSubmitting}>
                                {isSubmitting ? 'Saving...' : 'Save Changes'}
                            </Button>
                        </div>
                    </form>
                </div>
            )}

            {activeTab === 'attendees' && (
                <div className="space-y-6">
                    <div className="flex gap-4 mb-4">
                        <div className="bg-card rounded-xl border p-4 flex-1">
                            <p className="text-sm text-muted-foreground font-medium mb-1">Total Tickets Sold</p>
                            <p className="text-2xl font-bold">{event.ticket_count}</p>
                        </div>
                        <div className="bg-card rounded-xl border p-4 flex-1">
                            <p className="text-sm text-muted-foreground font-medium mb-1">Interested Users</p>
                            <p className="text-2xl font-bold">{event.interest_count}</p>
                        </div>
                    </div>

                    <div className="bg-card rounded-xl border overflow-hidden">
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
    );
}
