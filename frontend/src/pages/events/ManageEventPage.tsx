/** Manage Event page — host-only dashboard for an event. */

import {
  ArrowLeft,
  ArrowRight,
  Briefcase,
  Calendar,
  ChevronDown,
  ChevronUp,
  Clock,
  ExternalLink,
  FileEdit,
  FileText,
  Globe,
  ImageIcon,
  Link2,
  LocateFixed,
  MapPin,
  Repeat,
  Ticket,
  Timer,
  Users,
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'sonner';

import { ManageNeedsTab } from '@/components/events/ManageNeedsTab';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/features/auth/hooks';
import { updateEvent } from '@/features/events/api';
import {
  useCategories,
  useDeleteEvent,
  useEvent,
  useEventAttendees,
  useEventLifecycleHistory,
  useEventSeriesOccurrences,
  useGenerateEventSeriesOccurrences,
  useTransitionEventLifecycle,
} from '@/features/events/hooks';
import type { EventLifecycleState } from '@/types/events';
import {
  canUseBrowserGeolocation,
  getCurrentCoordinates,
  reverseGeocodeCoordinates,
} from '@/utils/geolocation';
import { compressImage } from '@/utils/image';

const LIFECYCLE_FLOW_CONFIG: Record<
  EventLifecycleState,
  { color: string; bg: string; border: string; label: string; emoji: string }
> = {
  draft: {
    color: '#6b7280',
    bg: '#f3f4f6',
    border: '#d1d5db',
    label: 'Draft',
    emoji: '📝',
  },
  published: {
    color: '#2563eb',
    bg: '#dbeafe',
    border: '#93c5fd',
    label: 'Published',
    emoji: '🚀',
  },
  at_risk: {
    color: '#d97706',
    bg: '#fef3c7',
    border: '#fcd34d',
    label: 'At Risk',
    emoji: '⚠️',
  },
  postponed: {
    color: '#7c3aed',
    bg: '#ede9fe',
    border: '#c4b5fd',
    label: 'Postponed',
    emoji: '⏸️',
  },
  event_ready: {
    color: '#059669',
    bg: '#d1fae5',
    border: '#6ee7b7',
    label: 'Event Ready',
    emoji: '✅',
  },
  live: {
    color: '#dc2626',
    bg: '#fee2e2',
    border: '#fca5a5',
    label: 'Live',
    emoji: '🔴',
  },
  completed: {
    color: '#065f46',
    bg: '#d1fae5',
    border: '#34d399',
    label: 'Completed',
    emoji: '🎉',
  },
  cancelled: {
    color: '#991b1b',
    bg: '#fee2e2',
    border: '#f87171',
    label: 'Cancelled',
    emoji: '❌',
  },
};

const ALLOWED_TRANSITIONS: Record<EventLifecycleState, EventLifecycleState[]> = {
  draft: ['published', 'cancelled'],
  published: ['at_risk', 'postponed', 'event_ready', 'cancelled', 'completed'],
  at_risk: ['published', 'postponed', 'event_ready', 'cancelled'],
  postponed: ['published', 'event_ready', 'cancelled'],
  event_ready: ['at_risk', 'live', 'cancelled', 'completed'],
  live: ['completed', 'cancelled'],
  cancelled: [],
  completed: [],
};

const FLOW_PIPELINE: EventLifecycleState[] = [
  'draft',
  'published',
  'event_ready',
  'live',
  'completed',
];

const detectPlatform = (url: string): { name: string; icon: string } => {
  const lower = url.toLowerCase();
  if (lower.includes('zoom.us') || lower.includes('zoom.com'))
    return { name: 'Zoom', icon: '🎥' };
  if (lower.includes('teams.microsoft.com') || lower.includes('teams.live.com'))
    return { name: 'Teams', icon: '🟦' };
  if (lower.includes('meet.google.com')) return { name: 'Google Meet', icon: '🟢' };
  if (lower.includes('slack.com')) return { name: 'Slack', icon: '💬' };
  if (lower.includes('discord.gg') || lower.includes('discord.com'))
    return { name: 'Discord', icon: '🎮' };
  return { name: 'Link', icon: '🔗' };
};

const formatDuration = (ms: number) => {
  const mins = Math.round(ms / 60000);
  if (mins < 60) return `${mins}m`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
};

export default function ManageEventPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const { data: eventResponse, isLoading: isLoadingEvent } = useEvent(Number(id));
  const { data: attendeesResponse, isLoading: isLoadingAttendees } = useEventAttendees(
    Number(id),
  );
  const { data: lifecycleHistoryResponse, isLoading: isLoadingLifecycleHistory } =
    useEventLifecycleHistory(Number(id));
  const { data: catResponse } = useCategories();
  const transitionLifecycle = useTransitionEventLifecycle();
  const generateOccurrences = useGenerateEventSeriesOccurrences();

  const event = eventResponse?.data;
  const attendees = attendeesResponse?.data || [];
  const lifecycleHistory = lifecycleHistoryResponse?.data || [];
  const categories = catResponse?.data || [];

  const [activeTab, setActiveTab] = useState<'details' | 'attendees' | 'needs'>(
    'details',
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDetectingLocation, setIsDetectingLocation] = useState(false);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const [latitude, setLatitude] = useState<string>(event?.latitude?.toString() || '');
  const [longitude, setLongitude] = useState<string>(
    event?.longitude?.toString() || '',
  );
  const [nextLifecycleState, setNextLifecycleState] =
    useState<EventLifecycleState>('published');
  const [transitionReason, setTransitionReason] = useState('');
  const [eventReadyMessage, setEventReadyMessage] = useState('');
  const [generateUntil, setGenerateUntil] = useState<string>('');
  const [previewDates, setPreviewDates] = useState<any[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [selectedTransitionTarget, setSelectedTransitionTarget] =
    useState<EventLifecycleState | null>(null);
  const [locationMode, setLocationMode] = useState<'offline' | 'online'>('offline');
  const [onlineUrl, setOnlineUrl] = useState('');
  const [eventDuration, setEventDuration] = useState<number>(0);

  const { data: occurrencesResponse, isLoading: isLoadingOccurrences } =
    useEventSeriesOccurrences(event?.series?.id ?? 0);
  const deleteEventMutation = useDeleteEvent();
  const occurrences = occurrencesResponse?.data || [];

  const locationNameRef = useRef<HTMLInputElement>(null);
  const locationAddressRef = useRef<HTMLInputElement>(null);

  // Redirect if not the host
  useEffect(() => {
    if (!isLoadingEvent && event && user) {
      if (event.host.username !== user.username) {
        toast.error('You are not authorized to manage this event');
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
      // Detect online mode from existing data
      if (event.location_address === 'Online Event') {
        setLocationMode('online');
        setOnlineUrl(event.location_name || '');
      }
      // Calculate initial duration
      const dur =
        new Date(event.end_time).getTime() - new Date(event.start_time).getTime();
      if (dur > 0) setEventDuration(dur);
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
          console.error('Preview failed', e);
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
    [
      'latitude',
      'longitude',
      'ticket_price_standard',
      'ticket_price_flexible',
      'capacity',
    ].forEach((field) => {
      if (!String(formData.get(field) || '').trim()) {
        formData.delete(field);
      }
    });

    const coverInput = form.querySelector<HTMLInputElement>('#cover_image');
    if (coverInput?.files?.[0]) {
      try {
        const compressedFile = await compressImage(coverInput.files[0], {
          newFileName: 'event_cover',
        });
        console.log(
          `Original size: ${Math.round(coverInput.files[0].size / 1024)}KB, Compressed size: ${Math.round(compressedFile.size / 1024)}KB`,
        );
        toast.info(
          `Image compressed: ${Math.round(coverInput.files[0].size / 1024)}KB -> ${Math.round(compressedFile.size / 1024)}KB`,
        );
        formData.delete('cover_image');
        formData.set('cover_image', compressedFile);
      } catch (err) {
        console.error('Image compression failed', err);
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
    return new Date(d.getTime() - d.getTimezoneOffset() * 60000)
      .toISOString()
      .slice(0, 16);
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

      const reverse = await reverseGeocodeCoordinates(
        coords.latitude,
        coords.longitude,
      );
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
    if (!window.confirm('Are you sure you want to delete this event occurence?'))
      return;
    try {
      await deleteEventMutation.mutateAsync(occurrenceId);
      toast.success('Event deleted');
    } catch (err: any) {
      toast.error('Failed to delete event');
    }
  };

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
        <div className="relative mb-8 flex items-center gap-4">
          <button
            onClick={() => navigate(`/events/${event.id}`)}
            className="flex items-center justify-center h-10 w-10 border-2 border-gray-800 rounded-full bg-white shadow-[2px_2px_0px_#333] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[1px_1px_0px_#333] transition-all relative z-10"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div className="relative">
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
              Manage Event
            </h1>
            <p
              className="text-gray-500 text-lg"
              style={{ fontFamily: '"Caveat", cursive', transform: 'rotate(1deg)' }}
            >
              {event.title}
            </p>
          </div>
        </div>

        {/* ═══ Status Flowchart Pipeline ═══ */}
        <div
          className="bg-white border-2 border-gray-800 p-5 shadow-[3px_4px_0px_#333] relative mb-6"
          style={{ transform: 'rotate(0.15deg)' }}
        >
          <div
            className="absolute -top-3 left-6 px-3 py-0.5 bg-yellow-200 border border-gray-400/50 shadow-sm"
            style={{
              transform: 'rotate(-2deg)',
              fontFamily: '"Permanent Marker", cursive',
              fontSize: '0.75rem',
            }}
          >
            Event Status
          </div>

          {/* Pipeline visualization */}
          <div className="flex items-center justify-between gap-1 mt-3 mb-4 overflow-x-auto pb-2">
            {FLOW_PIPELINE.map((state, idx) => {
              const cfg = LIFECYCLE_FLOW_CONFIG[state];
              const isCurrent = event.lifecycle_state === state;
              const isPast = FLOW_PIPELINE.indexOf(event.lifecycle_state) > idx;
              const canTransition =
                ALLOWED_TRANSITIONS[event.lifecycle_state]?.includes(state) &&
                !isCurrent;

              return (
                <div key={state} className="flex items-center flex-shrink-0">
                  <button
                    type="button"
                    disabled={!canTransition}
                    onClick={() => {
                      if (canTransition) {
                        setSelectedTransitionTarget(state);
                        setNextLifecycleState(state);
                      }
                    }}
                    className={`relative flex flex-col items-center gap-1 px-3 py-2 rounded-lg border-2 transition-all min-w-[80px] ${
                      isCurrent
                        ? 'ring-2 ring-offset-2 scale-110 shadow-lg'
                        : canTransition
                          ? 'hover:scale-105 hover:shadow-md cursor-pointer opacity-90'
                          : isPast
                            ? 'opacity-40'
                            : 'opacity-30'
                    }`}
                    style={{
                      backgroundColor: isCurrent ? cfg.bg : isPast ? cfg.bg : '#fafafa',
                      borderColor: isCurrent
                        ? cfg.color
                        : isPast
                          ? cfg.border
                          : '#e5e7eb',
                      color: cfg.color,
                    }}
                  >
                    <span className="text-base">{cfg.emoji}</span>
                    <span
                      className="text-[10px] font-bold uppercase tracking-wider whitespace-nowrap"
                      style={{
                        fontFamily: '"Caveat", cursive',
                        fontSize: '0.85rem',
                        fontWeight: 700,
                      }}
                    >
                      {cfg.label}
                    </span>
                    {isCurrent && (
                      <span className="absolute -top-2 -right-2 w-4 h-4 rounded-full bg-green-500 border-2 border-white animate-pulse" />
                    )}
                    {canTransition && !isCurrent && (
                      <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 text-[8px] font-medium px-1.5 py-0.5 rounded-full bg-gray-800 text-white whitespace-nowrap">
                        click
                      </span>
                    )}
                  </button>
                  {idx < FLOW_PIPELINE.length - 1 && (
                    <div className="flex items-center mx-1">
                      <div
                        className={`h-0.5 w-4 ${isPast ? 'bg-green-400' : 'bg-gray-300'}`}
                      />
                      <ArrowRight
                        className={`h-3 w-3 ${isPast ? 'text-green-400' : 'text-gray-300'}`}
                      />
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Side transitions: at_risk, postponed, cancelled */}
          <div className="flex flex-wrap gap-2 mb-4 border-t border-dashed border-gray-300 pt-3">
            {(['at_risk', 'postponed', 'cancelled'] as EventLifecycleState[]).map(
              (state) => {
                const cfg = LIFECYCLE_FLOW_CONFIG[state];
                const isCurrent = event.lifecycle_state === state;
                const canTransition =
                  ALLOWED_TRANSITIONS[event.lifecycle_state]?.includes(state) &&
                  !isCurrent;

                return (
                  <button
                    key={state}
                    type="button"
                    disabled={!canTransition}
                    onClick={() => {
                      if (canTransition) {
                        setSelectedTransitionTarget(state);
                        setNextLifecycleState(state);
                      }
                    }}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border-2 text-xs font-bold transition-all ${
                      isCurrent
                        ? 'ring-2 ring-offset-1 scale-105 shadow-md'
                        : canTransition
                          ? 'hover:scale-105 hover:shadow cursor-pointer'
                          : 'opacity-30 cursor-default'
                    }`}
                    style={{
                      backgroundColor: isCurrent ? cfg.bg : '#fafafa',
                      borderColor: isCurrent
                        ? cfg.color
                        : canTransition
                          ? cfg.border
                          : '#e5e7eb',
                      color: cfg.color,
                    }}
                  >
                    <span>{cfg.emoji}</span>
                    <span
                      style={{ fontFamily: '"Caveat", cursive', fontSize: '0.9rem' }}
                    >
                      {cfg.label}
                    </span>
                    {isCurrent && (
                      <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                    )}
                  </button>
                );
              },
            )}
          </div>

          {/* Transition action area */}
          {selectedTransitionTarget &&
            selectedTransitionTarget !== event.lifecycle_state && (
              <div
                className="border-2 border-dashed border-gray-400 rounded-lg p-4 bg-yellow-50/50 space-y-3 mb-3"
                style={{ transform: 'rotate(-0.2deg)' }}
              >
                <div className="flex items-center gap-2 text-sm">
                  <span
                    className="font-bold"
                    style={{ fontFamily: '"Permanent Marker", cursive' }}
                  >
                    Transition:
                  </span>
                  <span
                    className="px-2 py-0.5 rounded-full text-xs font-bold"
                    style={{
                      backgroundColor: LIFECYCLE_FLOW_CONFIG[event.lifecycle_state].bg,
                      color: LIFECYCLE_FLOW_CONFIG[event.lifecycle_state].color,
                      border: `1px solid ${LIFECYCLE_FLOW_CONFIG[event.lifecycle_state].border}`,
                    }}
                  >
                    {LIFECYCLE_FLOW_CONFIG[event.lifecycle_state].emoji}{' '}
                    {LIFECYCLE_FLOW_CONFIG[event.lifecycle_state].label}
                  </span>
                  <ArrowRight className="h-4 w-4 text-gray-500" />
                  <span
                    className="px-2 py-0.5 rounded-full text-xs font-bold"
                    style={{
                      backgroundColor:
                        LIFECYCLE_FLOW_CONFIG[selectedTransitionTarget].bg,
                      color: LIFECYCLE_FLOW_CONFIG[selectedTransitionTarget].color,
                      border: `1px solid ${LIFECYCLE_FLOW_CONFIG[selectedTransitionTarget].border}`,
                    }}
                  >
                    {LIFECYCLE_FLOW_CONFIG[selectedTransitionTarget].emoji}{' '}
                    {LIFECYCLE_FLOW_CONFIG[selectedTransitionTarget].label}
                  </span>
                </div>
                <input
                  value={transitionReason}
                  onChange={(e) => setTransitionReason(e.target.value)}
                  placeholder="Reason for transition (optional)"
                  className="w-full rounded-lg border bg-white px-3 py-2 text-sm focus:ring-2 focus:ring-primary/20"
                />
                {selectedTransitionTarget === 'event_ready' && (
                  <div className="rounded-md border bg-green-50 border-green-200 p-3">
                    <label className="block text-xs font-semibold text-green-800 mb-1">
                      Event Ready Message (required)
                    </label>
                    <textarea
                      value={eventReadyMessage}
                      onChange={(e) => setEventReadyMessage(e.target.value)}
                      rows={2}
                      placeholder="Share day-of notes, parking updates..."
                      className="w-full rounded-lg border bg-white px-3 py-2 text-sm resize-none"
                    />
                  </div>
                )}
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={handleTransitionLifecycle}
                    disabled={transitionLifecycle.isPending}
                    className="border-2 border-gray-800 bg-yellow-300 text-gray-900 shadow-[1px_2px_0px_#333] hover:bg-yellow-400 font-bold"
                    style={{ fontFamily: '"Permanent Marker", cursive' }}
                  >
                    {transitionLifecycle.isPending ? 'Updating...' : 'Apply'}
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setSelectedTransitionTarget(null);
                      setTransitionReason('');
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            )}

          {/* History toggle */}
          <button
            type="button"
            onClick={() => setShowHistory(!showHistory)}
            className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-700 transition-colors"
          >
            {showHistory ? (
              <ChevronUp className="h-3 w-3" />
            ) : (
              <ChevronDown className="h-3 w-3" />
            )}
            <span style={{ fontFamily: '"Caveat", cursive', fontSize: '0.9rem' }}>
              {showHistory ? 'Hide' : 'Show'} transition history
            </span>
          </button>

          {showHistory && (
            <div className="mt-3 pt-3 border-t border-gray-200 space-y-2">
              {isLoadingLifecycleHistory ? (
                <p className="text-sm text-muted-foreground animate-pulse">
                  Loading...
                </p>
              ) : lifecycleHistory.length === 0 ? (
                <p className="text-sm text-muted-foreground italic">
                  No transitions recorded.
                </p>
              ) : (
                lifecycleHistory.slice(0, 6).map((entry) => (
                  <div key={entry.id} className="flex items-center gap-2 text-xs">
                    <span
                      className="px-1.5 py-0.5 rounded text-[10px] font-bold"
                      style={{
                        backgroundColor: LIFECYCLE_FLOW_CONFIG[entry.from_state]?.bg,
                        color: LIFECYCLE_FLOW_CONFIG[entry.from_state]?.color,
                      }}
                    >
                      {entry.from_state.replace('_', ' ')}
                    </span>
                    <ArrowRight className="h-3 w-3 text-gray-400" />
                    <span
                      className="px-1.5 py-0.5 rounded text-[10px] font-bold"
                      style={{
                        backgroundColor: LIFECYCLE_FLOW_CONFIG[entry.to_state]?.bg,
                        color: LIFECYCLE_FLOW_CONFIG[entry.to_state]?.color,
                      }}
                    >
                      {entry.to_state.replace('_', ' ')}
                    </span>
                    <span className="text-muted-foreground ml-auto">
                      {new Date(entry.created_at).toLocaleDateString()} ·{' '}
                      {entry.actor_username || 'system'}
                    </span>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        <div className="flex gap-1 mb-8 overflow-x-auto pb-1 mt-4">
          {[
            { id: 'details', icon: FileEdit, label: 'Edit Details' },
            {
              id: 'attendees',
              icon: Users,
              label: `Attendees (${event.ticket_count})`,
            },
            { id: 'needs', icon: Briefcase, label: 'Needs & Vendors' },
          ].map((t) => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id as any)}
              className={`flex items-center gap-2 px-5 py-2.5 border-2 border-b-0 transition-all whitespace-nowrap ${
                activeTab === t.id
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
            <div
              className="bg-white border-2 border-gray-800 p-6 shadow-[3px_4px_0px_#333] relative mb-8"
              style={{ transform: 'rotate(-0.5deg)' }}
            >
              <div className="flex items-center gap-2 mb-6 border-b-2 border-gray-800 pb-2 border-dashed">
                <FileText className="h-6 w-6 text-gray-800" />
                <h2
                  className="text-xl font-bold"
                  style={{ fontFamily: '"Caveat", cursive', fontSize: '1.8rem' }}
                >
                  Basic Information
                </h2>
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
                        <img
                          src={coverPreview}
                          alt="Cover preview"
                          className="h-full w-full object-cover group-hover:opacity-75 transition-opacity"
                        />
                        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                          <span className="bg-background/80 px-3 py-1.5 rounded-md text-sm font-medium shadow-sm">
                            Change Image
                          </span>
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center gap-2 text-muted-foreground">
                        <ImageIcon className="h-8 w-8 mb-1 opacity-80" />
                        <span className="text-sm font-medium">
                          Click to upload cover image
                        </span>
                        <span className="text-xs opacity-75">
                          JPEG, PNG, WEBP (max 5MB)
                        </span>
                      </div>
                    )}
                  </label>
                  <input
                    id="cover_image"
                    name="cover_image"
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={handleCoverChange}
                    className="hidden"
                  />
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <label htmlFor="title" className="block text-sm font-medium mb-1">
                        Title *
                      </label>
                      <input
                        id="title"
                        name="title"
                        defaultValue={event.title}
                        required
                        className="w-full rounded-lg border bg-background px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary/20 transition-all"
                      />
                    </div>
                    <div>
                      <label
                        htmlFor="category_id"
                        className="block text-sm font-medium mb-1"
                      >
                        Category *
                      </label>
                      <select
                        id="category_id"
                        name="category_id"
                        defaultValue={event.category?.id}
                        required
                        className="w-full rounded-lg border bg-background px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary/20 transition-all"
                      >
                        <option value="">Select a category</option>
                        {categories.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <label
                        htmlFor="description"
                        className="block text-sm font-medium mb-1"
                      >
                        Description *
                      </label>
                      <textarea
                        id="description"
                        name="description"
                        defaultValue={event.description}
                        required
                        rows={5}
                        className="w-full rounded-lg border bg-background px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary/20 transition-all resize-none"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="check_in_instructions"
                    className="block text-sm font-medium mb-1"
                  >
                    Check-in Instructions
                  </label>
                  <textarea
                    id="check_in_instructions"
                    name="check_in_instructions"
                    defaultValue={event.check_in_instructions || ''}
                    rows={2}
                    placeholder="Entry gate, QR scan process, what to bring, contact point..."
                    className="w-full rounded-lg border bg-background px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary/20 transition-all resize-none"
                  />
                  <p className="text-xs text-muted-foreground mt-1.5">
                    These instructions will be visible to attendees after they purchase
                    a ticket or RSVP.
                  </p>
                </div>
              </div>
            </div>

            {/* ═══ Scheduling Card ═══ */}
            <div
              className="bg-[#fffdf5] border-2 border-gray-800 p-6 shadow-[3px_4px_0px_#333] relative mb-8"
              style={{ transform: 'rotate(0.5deg)' }}
            >
              <div className="flex items-center gap-2 mb-6 border-b-2 border-gray-800 pb-2 border-dashed">
                <Calendar className="h-6 w-6 text-gray-800" />
                <h2
                  className="text-xl font-bold"
                  style={{ fontFamily: '"Caveat", cursive', fontSize: '1.8rem' }}
                >
                  Scheduling
                </h2>
              </div>

              {/* Smart Date & Time */}
              <div className="space-y-4 mb-6">
                <h3 className="text-sm font-semibold flex items-center gap-2 text-foreground">
                  <Clock className="h-4 w-4 text-muted-foreground" /> Date & Time
                </h3>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label
                      htmlFor="start_time"
                      className="block text-sm font-medium mb-1"
                    >
                      Start Time *
                    </label>
                    <input
                      id="start_time"
                      name="start_time"
                      type="datetime-local"
                      defaultValue={dateToLocalValue(event.start_time)}
                      required
                      onChange={(e) => {
                        const startEl = e.target;
                        const endEl = document.getElementById(
                          'end_time',
                        ) as HTMLInputElement;
                        if (startEl.value && endEl && eventDuration > 0) {
                          const newEnd = new Date(
                            new Date(startEl.value).getTime() + eventDuration,
                          );
                          endEl.value = new Date(
                            newEnd.getTime() - newEnd.getTimezoneOffset() * 60000,
                          )
                            .toISOString()
                            .slice(0, 16);
                        }
                      }}
                      className="w-full rounded-lg border bg-background px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary/20 transition-all"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="end_time"
                      className="block text-sm font-medium mb-1"
                    >
                      End Time *
                    </label>
                    <input
                      id="end_time"
                      name="end_time"
                      type="datetime-local"
                      defaultValue={dateToLocalValue(event.end_time)}
                      required
                      onChange={(e) => {
                        const endEl = e.target;
                        const startEl = document.getElementById(
                          'start_time',
                        ) as HTMLInputElement;
                        if (startEl?.value && endEl.value) {
                          const dur =
                            new Date(endEl.value).getTime() -
                            new Date(startEl.value).getTime();
                          if (dur > 0) setEventDuration(dur);
                        }
                      }}
                      className="w-full rounded-lg border bg-background px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary/20 transition-all"
                    />
                  </div>
                </div>

                {/* Duration display & quick-set */}
                <div className="flex items-center gap-3 flex-wrap">
                  {eventDuration > 0 && (
                    <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-100 text-blue-800 text-xs font-bold border border-blue-200">
                      <Timer className="h-3 w-3" /> Duration:{' '}
                      {formatDuration(eventDuration)}
                    </span>
                  )}
                  <span className="text-[10px] text-gray-400 uppercase tracking-wider font-bold">
                    Quick set:
                  </span>
                  {[
                    { label: '1h', ms: 3600000 },
                    { label: '2h', ms: 7200000 },
                    { label: '3h', ms: 10800000 },
                    { label: 'Half Day', ms: 21600000 },
                    { label: 'Full Day', ms: 43200000 },
                  ].map((preset) => (
                    <button
                      key={preset.label}
                      type="button"
                      onClick={() => {
                        setEventDuration(preset.ms);
                        const startEl = document.getElementById(
                          'start_time',
                        ) as HTMLInputElement;
                        const endEl = document.getElementById(
                          'end_time',
                        ) as HTMLInputElement;
                        if (startEl?.value && endEl) {
                          const newEnd = new Date(
                            new Date(startEl.value).getTime() + preset.ms,
                          );
                          endEl.value = new Date(
                            newEnd.getTime() - newEnd.getTimezoneOffset() * 60000,
                          )
                            .toISOString()
                            .slice(0, 16);
                        }
                      }}
                      className={`px-2.5 py-1 rounded-full text-[11px] font-bold border-2 transition-all hover:scale-105 ${
                        eventDuration === preset.ms
                          ? 'bg-gray-800 text-white border-gray-800'
                          : 'bg-white text-gray-600 border-gray-300 hover:border-gray-500'
                      }`}
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Recurring Event Timeline */}
              {event?.series && (
                <div className="border-t-2 border-dashed border-gray-300 pt-5 mt-4">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-semibold flex items-center gap-2">
                      <Repeat className="h-4 w-4 text-primary" /> Series Timeline
                    </h3>
                    <span className="px-2 py-0.5 rounded-full bg-purple-100 text-purple-700 text-[10px] font-bold border border-purple-200">
                      {
                        occurrences.filter(
                          (o: any) => o.lifecycle_state !== 'cancelled',
                        ).length
                      }{' '}
                      scheduled
                    </span>
                  </div>

                  {/* Horizontal scrolling timeline */}
                  <div className="flex gap-3 overflow-x-auto pb-3 snap-x no-scrollbar">
                    {isLoadingOccurrences ? (
                      <p className="text-sm text-muted-foreground animate-pulse py-4">
                        Loading timeline...
                      </p>
                    ) : (
                      [...occurrences]
                        .sort(
                          (a: any, b: any) =>
                            new Date(a.start_time).getTime() -
                            new Date(b.start_time).getTime(),
                        )
                        .map((occ: any) => {
                          const isCurrent = occ.id === event.id;
                          const isPast = new Date(occ.start_time) < new Date();
                          const isCancelled = occ.lifecycle_state === 'cancelled';
                          const occCfg =
                            LIFECYCLE_FLOW_CONFIG[
                              occ.lifecycle_state as EventLifecycleState
                            ] || LIFECYCLE_FLOW_CONFIG.draft;

                          return (
                            <div
                              key={occ.id}
                              className="flex items-center gap-0 flex-shrink-0 snap-start"
                            >
                              <button
                                type="button"
                                onClick={() => {
                                  if (!isCurrent) navigate(`/events/${occ.id}`);
                                }}
                                className={`relative flex flex-col items-center p-3 rounded-xl border-2 min-w-[100px] transition-all ${
                                  isCurrent
                                    ? 'bg-yellow-100 border-gray-800 shadow-[2px_3px_0px_#333] scale-105'
                                    : isCancelled
                                      ? 'opacity-40 bg-gray-50 border-gray-300'
                                      : isPast
                                        ? 'bg-gray-50 border-gray-300 hover:border-gray-500 cursor-pointer'
                                        : 'bg-white border-gray-300 hover:border-primary hover:shadow-md cursor-pointer'
                                }`}
                              >
                                <span
                                  className="text-[10px] font-bold px-1.5 py-0.5 rounded-full mb-1"
                                  style={{
                                    backgroundColor: occCfg.bg,
                                    color: occCfg.color,
                                    border: `1px solid ${occCfg.border}`,
                                  }}
                                >
                                  {occCfg.label}
                                </span>
                                <span
                                  className="text-xs font-bold text-gray-800"
                                  style={{
                                    fontFamily: '"Caveat", cursive',
                                    fontSize: '0.95rem',
                                  }}
                                >
                                  {new Date(occ.start_time).toLocaleDateString(
                                    'en-US',
                                    { month: 'short', day: 'numeric' },
                                  )}
                                </span>
                                <span className="text-[10px] text-gray-500">
                                  {new Date(occ.start_time).toLocaleTimeString([], {
                                    hour: '2-digit',
                                    minute: '2-digit',
                                  })}
                                </span>
                                {isCurrent && (
                                  <span
                                    className="absolute -top-2 -right-2 text-[10px] px-1.5 py-0.5 bg-yellow-400 border border-gray-800 rounded-full font-bold"
                                    style={{
                                      fontFamily: '"Permanent Marker", cursive',
                                    }}
                                  >
                                    YOU
                                  </span>
                                )}
                                {!isCurrent && !isCancelled && occ.id !== event.id && (
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleDeleteOccurrence(occ.id);
                                    }}
                                    className="absolute -top-1.5 -left-1.5 w-5 h-5 rounded-full bg-red-100 border border-red-300 text-red-500 text-[10px] flex items-center justify-center hover:bg-red-200 opacity-0 group-hover:opacity-100 transition-opacity"
                                    title="Delete"
                                  >
                                    ×
                                  </button>
                                )}
                              </button>
                              <div className="w-4 h-0.5 bg-gray-200 flex-shrink-0" />
                            </div>
                          );
                        })
                    )}
                  </div>

                  {/* Generate more dates */}
                  <div className="mt-4 p-4 rounded-lg border-2 border-dashed border-purple-200 bg-purple-50/30">
                    <label className="block text-sm font-medium mb-1">
                      Generate Until Date
                    </label>
                    <p className="text-xs text-muted-foreground mb-2">
                      Auto-generate future occurrences based on recurrence rule.
                    </p>
                    <input
                      type="date"
                      value={generateUntil}
                      onChange={(e) => setGenerateUntil(e.target.value)}
                      className="w-full rounded-lg border bg-background px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary/20 transition-all font-medium"
                    />
                    {previewDates.length > 0 && (
                      <div className="mt-3 pt-3 border-t border-purple-200">
                        <h4 className="text-xs font-bold uppercase tracking-wide text-purple-700 mb-2">
                          Will Generate {previewDates.length} Instances
                        </h4>
                        <ul className="text-sm space-y-1 max-h-28 overflow-y-auto">
                          {previewDates.map((d: any, idx) => (
                            <li
                              key={idx}
                              className="text-muted-foreground flex items-center gap-2"
                            >
                              <span className="w-1.5 h-1.5 rounded-full bg-purple-400 inline-block" />
                              {new Date(d.start_time).toLocaleDateString()} -{' '}
                              {new Date(d.start_time).toLocaleTimeString([], {
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* ═══ Location Card ═══ */}
            <div
              className="bg-[#f0fdf4] border-2 border-gray-800 p-6 shadow-[3px_4px_0px_#333] relative mb-8"
              style={{ transform: 'rotate(-0.3deg)' }}
            >
              <div className="flex items-center gap-2 mb-6 border-b-2 border-gray-800 pb-2 border-dashed">
                <MapPin className="h-6 w-6 text-gray-800" />
                <h2
                  className="text-xl font-bold"
                  style={{ fontFamily: '"Caveat", cursive', fontSize: '1.8rem' }}
                >
                  Location
                </h2>
              </div>

              {/* Online / Offline toggle */}
              <div className="flex gap-1 p-1 bg-gray-100 rounded-full w-fit mb-6 border border-gray-200">
                {[
                  { mode: 'offline' as const, icon: MapPin, label: 'In Person' },
                  { mode: 'online' as const, icon: Globe, label: 'Online' },
                ].map(({ mode, icon: Icon, label }) => (
                  <button
                    key={mode}
                    type="button"
                    onClick={() => setLocationMode(mode)}
                    className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-bold transition-all ${
                      locationMode === mode
                        ? 'bg-white shadow-md text-gray-800 border border-gray-200'
                        : 'text-gray-500 hover:text-gray-700'
                    }`}
                    style={{ fontFamily: '"Caveat", cursive', fontSize: '1rem' }}
                  >
                    <Icon className="h-4 w-4" /> {label}
                  </button>
                ))}
              </div>

              {locationMode === 'offline' ? (
                <div className="space-y-4">
                  <div>
                    <label
                      htmlFor="location_name"
                      className="block text-sm font-medium mb-1"
                    >
                      Location Name *
                    </label>
                    <input
                      id="location_name"
                      name="location_name"
                      ref={locationNameRef}
                      defaultValue={
                        event.location_address !== 'Online Event'
                          ? event.location_name
                          : ''
                      }
                      required
                      placeholder="e.g. Central Park"
                      className="w-full rounded-lg border bg-background px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary/20 transition-all"
                    />
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <label
                        htmlFor="location_address"
                        className="block text-sm font-medium mb-1"
                      >
                        Address
                      </label>
                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        onClick={handleUseCurrentLocation}
                        disabled={isDetectingLocation}
                        className="h-7 px-2.5 text-xs border-2 border-gray-800 bg-green-200 text-gray-800 shadow-[1px_1px_0px_#333] hover:bg-green-300 font-bold"
                      >
                        <LocateFixed className="h-3.5 w-3.5 mr-1.5" />
                        {isDetectingLocation ? 'Detecting...' : '📍 Find My Location'}
                      </Button>
                    </div>
                    <input
                      id="location_address"
                      name="location_address"
                      ref={locationAddressRef}
                      defaultValue={
                        event.location_address !== 'Online Event'
                          ? event.location_address || ''
                          : ''
                      }
                      placeholder="Full street address"
                      className="w-full rounded-lg border bg-background px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary/20 transition-all"
                    />
                  </div>
                  <input type="hidden" name="latitude" value={latitude} />
                  <input type="hidden" name="longitude" value={longitude} />
                  {latitude && longitude && (
                    <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                      <span className="inline-block w-2 h-2 rounded-full bg-green-500" />
                      Coordinates set ({latitude}, {longitude})
                    </p>
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Meeting URL *
                    </label>
                    <div className="relative">
                      <Link2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <input
                        value={onlineUrl}
                        onChange={(e) => setOnlineUrl(e.target.value)}
                        placeholder="https://zoom.us/j/... or meet.google.com/..."
                        className="w-full rounded-lg border bg-background pl-10 pr-4 py-2.5 text-sm focus:ring-2 focus:ring-primary/20 transition-all"
                      />
                    </div>
                    {/* hidden fields so form submission includes location */}
                    <input
                      type="hidden"
                      name="location_name"
                      value={onlineUrl || 'Online Event'}
                    />
                    <input type="hidden" name="location_address" value="Online Event" />
                  </div>

                  {/* Detected platform */}
                  {onlineUrl && (
                    <div className="flex items-center gap-3 p-3 rounded-lg bg-white border-2 border-dashed border-gray-300">
                      <span className="text-2xl">{detectPlatform(onlineUrl).icon}</span>
                      <div>
                        <p
                          className="text-sm font-bold"
                          style={{
                            fontFamily: '"Caveat", cursive',
                            fontSize: '1.1rem',
                          }}
                        >
                          {detectPlatform(onlineUrl).name}
                        </p>
                        <a
                          href={onlineUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-blue-600 hover:underline flex items-center gap-1"
                        >
                          <ExternalLink className="h-3 w-3" /> Open link
                        </a>
                      </div>
                    </div>
                  )}

                  {/* Platform suggestions */}
                  <div className="flex flex-wrap gap-2">
                    {[
                      { name: 'Zoom', icon: '🎥', prefix: 'https://zoom.us/j/' },
                      {
                        name: 'Google Meet',
                        icon: '🟢',
                        prefix: 'https://meet.google.com/',
                      },
                      {
                        name: 'Teams',
                        icon: '🟦',
                        prefix: 'https://teams.microsoft.com/l/meetup-join/',
                      },
                      { name: 'Discord', icon: '🎮', prefix: 'https://discord.gg/' },
                    ].map((p) => (
                      <button
                        key={p.name}
                        type="button"
                        onClick={() => {
                          if (!onlineUrl) setOnlineUrl(p.prefix);
                        }}
                        className="flex items-center gap-1 px-2.5 py-1 rounded-full border text-xs font-medium bg-white hover:bg-gray-50 transition-colors"
                      >
                        <span>{p.icon}</span> {p.name}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Tickets Card */}
            <div
              className="bg-[#f0f9ff] border-2 border-gray-800 p-6 shadow-[3px_4px_0px_#333] relative mb-8"
              style={{ transform: 'rotate(-0.25deg)' }}
            >
              <div className="flex items-center gap-2 mb-6 border-b-2 border-gray-800 pb-2 border-dashed">
                <Ticket className="h-6 w-6 text-gray-800" />
                <h2
                  className="text-xl font-bold"
                  style={{ fontFamily: '"Caveat", cursive', fontSize: '1.8rem' }}
                >
                  Tickets & Capacity
                </h2>
              </div>
              <div className="grid md:grid-cols-3 gap-6">
                <div>
                  <label htmlFor="capacity" className="block text-sm font-medium mb-1">
                    Capacity
                  </label>
                  <div className="relative">
                    <Users className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <input
                      id="capacity"
                      name="capacity"
                      type="number"
                      defaultValue={event.capacity || ''}
                      placeholder="Unlimited"
                      className="w-full rounded-lg border bg-background pl-10 pr-4 py-2.5 text-sm focus:ring-2 focus:ring-primary/20 transition-all"
                    />
                  </div>
                </div>
                <div>
                  <label
                    htmlFor="ticket_price_standard"
                    className="block text-sm font-medium mb-1"
                  >
                    Standard Price ($)
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-medium">
                      $
                    </span>
                    <input
                      id="ticket_price_standard"
                      name="ticket_price_standard"
                      type="number"
                      step="0.01"
                      defaultValue={event.ticket_price_standard || ''}
                      placeholder="Free"
                      className="w-full rounded-lg border bg-background pl-8 pr-4 py-2.5 text-sm focus:ring-2 focus:ring-primary/20 transition-all"
                    />
                  </div>
                </div>
                <div>
                  <label
                    htmlFor="ticket_price_flexible"
                    className="block text-sm font-medium mb-1"
                  >
                    Flexible Price ($)
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-medium">
                      $
                    </span>
                    <input
                      id="ticket_price_flexible"
                      name="ticket_price_flexible"
                      type="number"
                      step="0.01"
                      defaultValue={event.ticket_price_flexible || ''}
                      placeholder="Disabled"
                      className="w-full rounded-lg border bg-background pl-8 pr-4 py-2.5 text-sm focus:ring-2 focus:ring-primary/20 transition-all"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-2 sticky bottom-6 z-10">
              <Button
                type="submit"
                size="lg"
                disabled={isSubmitting}
                className="border-2 border-gray-800 bg-yellow-300 text-gray-900 shadow-[2px_3px_0px_#333] hover:bg-yellow-400 hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[1px_1px_0px_#333] transition-all font-bold px-8"
                style={{
                  fontFamily: '"Permanent Marker", cursive',
                  fontSize: '1.1rem',
                }}
              >
                {isSubmitting ? 'Saving...' : 'Save All Changes'}
              </Button>
            </div>
          </form>
        )}

        {activeTab === 'attendees' && (
          <div className="space-y-6">
            <div className="flex gap-4 mb-4">
              <div
                className="bg-white border-2 border-gray-800 p-5 shadow-[2px_3px_0px_#333] flex-1 relative"
                style={{ transform: 'rotate(-1deg)' }}
              >
                <div className="absolute -top-3 -right-3 w-8 h-8 rounded-full bg-red-400 border-2 border-gray-800 shadow-[1px_1px_0px_#333] flex items-center justify-center rotate-12 text-sm">
                  📌
                </div>
                <p
                  className="text-sm font-bold text-gray-500 mb-1"
                  style={{ fontFamily: '"Permanent Marker", cursive' }}
                >
                  Total Tickets Sold
                </p>
                <p
                  className="text-4xl font-bold text-gray-900"
                  style={{ fontFamily: '"Caveat", cursive' }}
                >
                  {event.ticket_count}
                </p>
              </div>
              <div
                className="bg-white border-2 border-gray-800 p-5 shadow-[2px_3px_0px_#333] flex-1 relative"
                style={{ transform: 'rotate(1deg)' }}
              >
                <div className="absolute -top-2 left-4 w-10 h-3 bg-yellow-200 border border-gray-400/50 shadow-sm rotate-[-5deg]" />
                <p
                  className="text-sm font-bold text-gray-500 mb-1"
                  style={{ fontFamily: '"Permanent Marker", cursive' }}
                >
                  Interested Users
                </p>
                <p
                  className="text-4xl font-bold text-gray-900"
                  style={{ fontFamily: '"Caveat", cursive' }}
                >
                  {event.interest_count}
                </p>
              </div>
            </div>

            <div className="bg-white border-2 border-gray-800 shadow-[3px_4px_0px_#333] overflow-hidden">
              {isLoadingAttendees ? (
                <div className="p-8 text-center text-muted-foreground">
                  Loading attendees...
                </div>
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
                        <th className="px-6 py-3 font-medium text-right">
                          Purchase Date
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {attendees.map((attendee) => (
                        <tr
                          key={attendee.id}
                          className="hover:bg-muted/50 transition-colors"
                        >
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              {attendee.user.avatar ? (
                                <img
                                  src={attendee.user.avatar}
                                  className="w-8 h-8 rounded-full object-cover"
                                />
                              ) : (
                                <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center font-semibold text-primary text-xs">
                                  {(
                                    attendee.user.first_name?.[0] ||
                                    attendee.user.username[0]
                                  ).toUpperCase()}
                                </div>
                              )}
                              <div>
                                <p className="font-medium text-foreground">
                                  {attendee.user.first_name || attendee.user.username}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  @{attendee.user.username}
                                </p>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <span
                              className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                                attendee.ticket_type === 'flexible'
                                  ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300'
                                  : 'bg-secondary text-secondary-foreground'
                              }`}
                            >
                              {attendee.ticket_type.charAt(0).toUpperCase() +
                                attendee.ticket_type.slice(1)}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <span className="capitalize text-muted-foreground">
                              {attendee.status}
                            </span>
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
