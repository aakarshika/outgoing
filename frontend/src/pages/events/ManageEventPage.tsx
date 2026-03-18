/** Manage Event page — host-only dashboard for an event. */

import {
  ArrowLeft,
  ArrowRight,
  Briefcase,
  ChevronDown,
  ChevronUp,
  FileEdit,
  ScanLine,
  Users,
} from 'lucide-react';
import { lazy, Suspense, useCallback, useEffect, useRef, useState } from 'react';
import {
  Navigate,
  NavLink,
  Route,
  Routes,
  useNavigate,
  useParams,
} from 'react-router-dom';
import { toast } from 'sonner';

import { QRScannerModal } from '@/components/events/QRScannerModal';
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
  useUpdateTicketTiers,
} from '@/features/events/hooks';
import { admitTicket, validateTicket } from '@/features/tickets/api';
import { useTicketAdmission, useTicketValidation } from '@/features/tickets/hooks';
import type { EventLifecycleState } from '@/types/events';
import {
  canUseBrowserGeolocation,
  getCurrentCoordinates,
  reverseGeocodeCoordinates,
} from '@/utils/geolocation';
import { compressImage } from '@/utils/image';

import { EventFeature } from './manage/ManageDetailsSection';

const ManageDetailsSection = lazy(() =>
  import('./manage/ManageDetailsSection').then((m) => ({
    default: m.ManageDetailsSection,
  })),
);
const ManageAttendeesSection = lazy(() =>
  import('./manage/ManageAttendeesSection').then((m) => ({
    default: m.ManageAttendeesSection,
  })),
);
const ManageEntrySection = lazy(() =>
  import('./manage/ManageEntrySection').then((m) => ({
    default: m.ManageEntrySection,
  })),
);
const ManageNeedsSection = lazy(() =>
  import('./manage/ManageNeedsSection').then((m) => ({
    default: m.ManageNeedsSection,
  })),
);

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

export default function ManageEventPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const {
    data: eventResponse,
    isLoading: isLoadingEvent,
    refetch: refetchEvent,
  } = useEvent(Number(id));
  const {
    data: attendeesResponse,
    isLoading: isLoadingAttendees,
    refetch: refetchAttendees,
  } = useEventAttendees(Number(id));
  const { data: lifecycleHistoryResponse } = useEventLifecycleHistory(Number(id));
  const { data: catResponse } = useCategories();
  const transitionLifecycle = useTransitionEventLifecycle();
  const updateTicketTiers = useUpdateTicketTiers();
  const {
    data: occurrencesResponse,
    isLoading: isLoadingOccurrences,
    refetch: refetchOccurrences,
  } = useEventSeriesOccurrences(eventResponse?.data?.series?.id ?? 0);
  const generateOccurrences = useGenerateEventSeriesOccurrences();
  const deleteOccurrence = useDeleteEvent();

  const event = eventResponse?.data;
  const attendees = attendeesResponse?.data || [];
  const lifecycleHistory = lifecycleHistoryResponse?.data || [];
  const categories = catResponse?.data || [];
  const occurrences = occurrencesResponse?.data || [];

  // ── Entry tab state ──
  const [entryBarcode, setEntryBarcode] = useState('');
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const entryInputRef = useRef<HTMLInputElement>(null);
  const {
    result: validationResult,
    isLoading: isValidating,
    error: validationError,
    errorCode: validationErrorCode,
    validate: validateBarcode,
    reset: resetValidation,
  } = useTicketValidation();
  const {
    isLoading: isAdmitting,
    error: admitError,
    admitted,
    admit: performAdmit,
    reset: resetAdmission,
  } = useTicketAdmission();

  const handleValidate = useCallback(() => {
    if (!entryBarcode.trim() || !event) return;
    resetAdmission();
    validateBarcode({ barcode: entryBarcode.trim(), eventId: event.id });
  }, [entryBarcode, event, validateBarcode, resetAdmission]);

  const handleAdmit = useCallback(async () => {
    if (!validationResult || !event) return;
    try {
      await performAdmit(validationResult.ticket_id, event.id);
      toast.success(`${validationResult.attendee_name} admitted!`);
      refetchAttendees();
    } catch (err) {
      // Error handled by hook
    }
  }, [validationResult, event, performAdmit, refetchAttendees]);

  const handleResetEntry = useCallback(() => {
    setEntryBarcode('');
    resetValidation();
    resetAdmission();
    setTimeout(() => entryInputRef.current?.focus(), 100);
  }, [resetValidation, resetAdmission]);

  // ── Details tab state ──
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [applyToSeries, setApplyToSeries] = useState(false);
  const [isDetectingLocation, setIsDetectingLocation] = useState(false);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const [latitude, setLatitude] = useState<string>('');
  const [longitude, setLongitude] = useState<string>('');
  const [locationMode, setLocationMode] = useState<'offline' | 'online'>('offline');
  const [onlineUrl, setOnlineUrl] = useState('');
  const [eventDuration, setEventDuration] = useState<number>(0);
  const [ticketTiers, setTicketTiers] = useState<any[]>([]);
  const [eventFeatures, setEventFeatures] = useState<EventFeature[]>([]);
  const [capacity, setCapacity] = useState<string>('');
  const [generateUntil, setGenerateUntil] = useState<string>('');
  const [previewDates, setPreviewDates] = useState<any[]>([]);

  const locationNameRef = useRef<HTMLInputElement>(null);
  const locationAddressRef = useRef<HTMLInputElement>(null);

  // ── Lifecycle state ──
  const [nextLifecycleState, setNextLifecycleState] =
    useState<EventLifecycleState>('published');
  const [transitionReason, setTransitionReason] = useState('');
  const [eventReadyMessage, setEventReadyMessage] = useState('');
  const [showHistory, setShowHistory] = useState(false);
  const [selectedTransitionTarget, setSelectedTransitionTarget] =
    useState<EventLifecycleState | null>(null);

  // Redirect if not the host
  useEffect(() => {
    if (!isLoadingEvent && event && user) {
      if (event.host.username !== user.username) {
        toast.error('You are not authorized to manage this event');
        navigate(`/events-new/${event.id}`);
      }
    }
  }, [event, user, isLoadingEvent, navigate]);

  useEffect(() => {
    if (event) {
      setCoverPreview(event.cover_image || null);
      setLatitude(event.latitude !== null ? String(event.latitude) : '');
      setLongitude(event.longitude !== null ? String(event.longitude) : '');
      setNextLifecycleState(event.lifecycle_state || 'published');
      setEventReadyMessage(event.event_ready_message || '');
      if (event.location_address === 'Online Event') {
        setLocationMode('online');
        setOnlineUrl(event.location_name || '');
      }
      const dur =
        new Date(event.end_time).getTime() - new Date(event.start_time).getTime();
      if (dur > 0) setEventDuration(dur);

      if (event.ticket_tiers && event.ticket_tiers.length > 0) {
        setTicketTiers(event.ticket_tiers);
      }
      if (event.features && event.features.length > 0) {
        setEventFeatures(event.features);
      }
      if (event.capacity) {
        setCapacity(String(event.capacity));
      }
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

  // Force total capacity if all tiers have a capacity
  useEffect(() => {
    if (ticketTiers.length > 0) {
      const allHaveCapacity = ticketTiers.every(
        (t) => t.capacity !== undefined && t.capacity !== null && t.capacity > 0,
      );
      if (allHaveCapacity) {
        const sum = ticketTiers.reduce((acc, t) => acc + (t.capacity || 0), 0);
        setCapacity(String(sum));
      }
    }
  }, [ticketTiers]);

  const handleUpdate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!event) return;
    setIsSubmitting(true);

    const form = e.currentTarget;
    const formData = new FormData(form);

    const totalCapacityStr = formData.get('capacity') as string;
    const totalCapacityVal = totalCapacityStr ? parseInt(totalCapacityStr, 10) : null;

    if (ticketTiers.length > 0 && totalCapacityVal !== null) {
      const hasAnyCapacity = ticketTiers.some(
        (t) => t.capacity !== undefined && t.capacity !== null && t.capacity > 0,
      );
      if (hasAnyCapacity) {
        const sumTiers = ticketTiers.reduce((acc, t) => acc + (t.capacity || 0), 0);
        if (sumTiers !== totalCapacityVal) {
          toast.error(
            `The sum of the capacity of your ticket tiers (${sumTiers}) must exactly match the Total Event Capacity (${totalCapacityVal}).`,
          );
          setIsSubmitting(false);
          return;
        }
      }
    }

    const coverInput = form.querySelector<HTMLInputElement>('#cover_image');
    if (coverInput?.files?.[0]) {
      try {
        const compressedFile = await compressImage(coverInput.files[0], {
          newFileName: 'event_cover',
        });
        formData.delete('cover_image');
        formData.set('cover_image', compressedFile);
      } catch (err) {
        formData.set('cover_image', coverInput.files[0]);
      }
    } else {
      formData.delete('cover_image');
    }

    formData.set('features', JSON.stringify(eventFeatures));
    if (applyToSeries) {
      formData.set('update_series', 'true');
    }

    try {
      await updateEvent(event.id, formData);

      if (previewDates.length > 0 && generateUntil && event?.series?.id) {
        await generateOccurrences.mutateAsync({
          seriesId: event.series.id,
          payload: { generate_until: generateUntil + 'T23:59:59Z', preview: false },
        });
        setGenerateUntil('');
        setPreviewDates([]);
      }

      await updateTicketTiers.mutateAsync({
        eventId: event.id,
        tiers: ticketTiers,
        updateSeries: applyToSeries,
      });
      toast.success('Event updated successfully!');
      refetchEvent();
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
        if (locationNameRef.current) locationNameRef.current.value = reverse.venueName;
        if (locationAddressRef.current)
          locationAddressRef.current.value = reverse.displayAddress;
        toast.success('Location updated from your current position');
      } else {
        if (locationNameRef.current && !locationNameRef.current.value.trim()) {
          locationNameRef.current.value = 'Current Location';
        }
        toast.success('Coordinates updated. You can edit venue/address manually.');
      }
    } catch (err: any) {
      toast.error('Could not access your location.');
    } finally {
      setIsDetectingLocation(false);
    }
  };

  const handleTransitionLifecycle = async () => {
    if (!event || nextLifecycleState === event.lifecycle_state) return;
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
      setSelectedTransitionTarget(null);
      toast.success('Lifecycle state updated');
      refetchEvent();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to update lifecycle state');
    }
  };

  const handleDeleteOccurrence = async (occId: number) => {
    if (!window.confirm('Are you sure you want to delete this specific occurrence?'))
      return;
    try {
      await deleteOccurrence.mutateAsync(occId);
      toast.success('Occurrence deleted');
      refetchOccurrences();
    } catch (err: any) {
      toast.error('Failed to delete occurrence');
    }
  };

  if (isLoadingEvent) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-8 animate-pulse space-y-6">
        <div className="h-8 w-48 rounded bg-muted" />
        <div className="h-64 rounded bg-muted" />
      </div>
    );
  }

  if (!event)
    return <div className="p-8 text-center text-muted-foreground">Event not found</div>;

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
            onClick={() => navigate(`/events-new/${event.id}`)}
            className="flex items-center justify-center h-10 w-10 border-2 border-gray-800 rounded-full bg-white shadow-[2px_2px_0px_#333] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[1px_1px_0px_#333] transition-all relative z-10"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div className="relative">
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

        {/* ═══ Status Pipeline ═══ */}
        <div className="bg-white border-2 border-gray-800 p-5 shadow-[3px_4px_0px_#333] relative mb-6">
          <div className="flex items-center justify-between gap-1 mt-3 mb-4 overflow-x-auto pb-2">
            {FLOW_PIPELINE.map((state, idx) => {
              const cfg = LIFECYCLE_FLOW_CONFIG[state as EventLifecycleState];
              const isCurrent = event.lifecycle_state === state;
              const idxCurrent = FLOW_PIPELINE.indexOf(event.lifecycle_state);
              const isPast = idxCurrent > idx;
              const canTransition =
                ALLOWED_TRANSITIONS[
                  event.lifecycle_state as EventLifecycleState
                ]?.includes(state as EventLifecycleState) && !isCurrent;

              return (
                <div key={state} className="flex items-center flex-shrink-0">
                  <button
                    type="button"
                    disabled={!canTransition}
                    onClick={() => {
                      setSelectedTransitionTarget(state as EventLifecycleState);
                      setNextLifecycleState(state as EventLifecycleState);
                    }}
                    className={`relative flex flex-col items-center gap-1 px-3 py-2 rounded-lg border-2 transition-all min-w-[80px] ${isCurrent ? 'ring-2 ring-offset-2 scale-110 shadow-lg' : canTransition ? 'hover:scale-105 hover:shadow cursor-pointer' : 'opacity-30'}`}
                    style={{
                      backgroundColor: isCurrent || isPast ? cfg.bg : '#fafafa',
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
                      style={{ fontFamily: '"Caveat", cursive', fontSize: '0.85rem' }}
                    >
                      {cfg.label}
                    </span>
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

          {/* Transition action area */}
          {selectedTransitionTarget &&
            selectedTransitionTarget !== event.lifecycle_state && (
              <div className="border-2 border-dashed border-gray-400 rounded-lg p-4 bg-yellow-50/50 space-y-3 mb-3">
                <div className="flex items-center gap-2 text-sm">
                  <span
                    className="font-bold"
                    style={{ fontFamily: '"Permanent Marker", cursive' }}
                  >
                    Transition:
                  </span>
                  <ArrowRight className="h-4 w-4 text-gray-500" />
                  <span
                    className="px-2 py-0.5 rounded-full text-xs font-bold"
                    style={{
                      backgroundColor:
                        LIFECYCLE_FLOW_CONFIG[selectedTransitionTarget].bg,
                      color: LIFECYCLE_FLOW_CONFIG[selectedTransitionTarget].color,
                    }}
                  >
                    {LIFECYCLE_FLOW_CONFIG[selectedTransitionTarget].emoji}{' '}
                    {LIFECYCLE_FLOW_CONFIG[selectedTransitionTarget].label}
                  </span>
                </div>
                <input
                  value={transitionReason}
                  onChange={(e) => setTransitionReason(e.target.value)}
                  placeholder="Reason (optional)"
                  className="w-full rounded-lg border bg-white px-3 py-2 text-sm"
                />
                {selectedTransitionTarget === 'event_ready' && (
                  <textarea
                    value={eventReadyMessage}
                    onChange={(e) => setEventReadyMessage(e.target.value)}
                    rows={2}
                    placeholder="Event Ready Message (required)"
                    className="w-full rounded-lg border bg-white px-3 py-2 text-sm"
                  />
                )}
                <div className="flex gap-2">
                  <Button
                    onClick={handleTransitionLifecycle}
                    disabled={transitionLifecycle.isPending}
                    size="sm"
                    className="bg-yellow-300 text-gray-900 border-2 border-gray-800 shadow-[1px_2px_0px_#333]"
                  >
                    Apply
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedTransitionTarget(null)}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            )}

          <button
            onClick={() => setShowHistory(!showHistory)}
            className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-700"
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
              {lifecycleHistory.slice(0, 5).map((entry) => (
                <div key={entry.id} className="flex items-center gap-2 text-[10px]">
                  <span className="font-bold">{entry.from_state}</span>
                  <ArrowRight className="h-2 w-2" />
                  <span className="font-bold">{entry.to_state}</span>
                  <span className="ml-auto opacity-60">
                    {new Date(entry.created_at).toLocaleDateString()}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ═══ Series Timeline ═══ */}
        {event?.series && (
          <div className="bg-white border-2 border-gray-800 p-5 shadow-[3px_4px_0px_#333] relative mb-6 overflow-hidden">
            <div className="flex items-center justify-between mb-4">
              <h3
                className="text-sm font-semibold flex items-center gap-2"
                style={{ fontFamily: '"Permanent Marker", cursive' }}
              >
                Series Timeline
              </h3>
              <span className="px-2 py-0.5 rounded-full bg-purple-100 text-purple-700 text-[10px] font-bold border border-purple-200">
                {
                  occurrences.filter((o: any) => o.lifecycle_state !== 'cancelled')
                    .length
                }{' '}
                scheduled
              </span>
            </div>

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
                        <div
                          role="button"
                          tabIndex={0}
                          onClick={() => {
                            if (!isCurrent) navigate(`/events/${occ.id}/manage`);
                          }}
                          className={`relative group flex flex-col items-center p-3 rounded-xl border-2 min-w-[100px] transition-all ${
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
                            {new Date(occ.start_time).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                            })}
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
                          {!isCurrent && !isCancelled && (
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
                        </div>
                        <div className="w-4 h-0.5 bg-gray-200 flex-shrink-0" />
                      </div>
                    );
                  })
              )}
            </div>
          </div>
        )}

        {/* ═══ Navigation Tabs ═══ */}
        <div className="flex gap-1 mb-8 overflow-x-auto pb-1 mt-4">
          {[
            { id: 'details', icon: FileEdit, label: 'Edit Details', path: '' },
            {
              id: 'attendees',
              icon: Users,
              label: `Attendees (${event.ticket_count || 0})`,
              path: 'attendees',
            },
            { id: 'entry', icon: ScanLine, label: '🎫 Entry', path: 'entry' },
            { id: 'needs', icon: Briefcase, label: 'Needs & Vendors', path: 'needs' },
          ].map((t) => (
            <NavLink
              key={t.id}
              to={t.path}
              end={t.path === ''}
              className={({ isActive }) =>
                `flex items-center gap-2 px-5 py-2.5 border-2 border-b-0 transition-all whitespace-nowrap ${
                  isActive
                    ? 'bg-yellow-300/60 border-gray-800 text-gray-900 -rotate-1 shadow-[2px_-2px_0px_#333] font-bold relative z-10 -mb-[2px]'
                    : 'bg-white/60 border-gray-400 text-gray-500 hover:bg-yellow-100/40 hover:text-gray-700'
                }`
              }
              style={{ fontFamily: '"Permanent Marker", cursive', fontSize: '0.85rem' }}
            >
              <t.icon className="h-4 w-4" /> {t.label}
            </NavLink>
          ))}
        </div>
        <div className="border-t-2 border-gray-800 -mt-8 mb-6" />

        {/* ═══ Content Area ═══ */}
        <Suspense
          fallback={
            <div className="p-8 text-center animate-pulse">Loading section...</div>
          }
        >
          <Routes>
            <Route
              index
              element={
                <ManageDetailsSection
                  event={event}
                  categories={categories}
                  latitude={latitude}
                  longitude={longitude}
                  isDetectingLocation={isDetectingLocation}
                  locationNameRef={locationNameRef}
                  locationAddressRef={locationAddressRef}
                  onlineUrl={onlineUrl}
                  setOnlineUrl={setOnlineUrl}
                  locationMode={locationMode}
                  setLocationMode={setLocationMode}
                  capacity={capacity}
                  setCapacity={setCapacity}
                  eventFeatures={eventFeatures}
                  setEventFeatures={setEventFeatures}
                  ticketTiers={ticketTiers}
                  setTicketTiers={setTicketTiers}
                  applyToSeries={applyToSeries}
                  setApplyToSeries={setApplyToSeries}
                  isSubmitting={isSubmitting}
                  handleUpdate={handleUpdate}
                  handleCoverChange={handleCoverChange}
                  coverPreview={coverPreview}
                  handleUseCurrentLocation={handleUseCurrentLocation}
                  dateToLocalValue={dateToLocalValue}
                  eventDuration={eventDuration}
                  setEventDuration={setEventDuration}
                  generateUntil={generateUntil}
                  setGenerateUntil={setGenerateUntil}
                  previewDates={previewDates}
                />
              }
            />
            <Route
              path="attendees"
              element={
                <ManageAttendeesSection
                  event={event}
                  attendees={attendees}
                  isLoadingAttendees={isLoadingAttendees}
                />
              }
            />
            <Route
              path="entry"
              element={
                <ManageEntrySection
                  event={event}
                  entryBarcode={entryBarcode}
                  setEntryBarcode={setEntryBarcode}
                  handleValidate={handleValidate}
                  handleAdmit={handleAdmit}
                  handleResetEntry={handleResetEntry}
                  isValidating={isValidating}
                  validationError={validationError}
                  validationErrorCode={validationErrorCode}
                  validationResult={validationResult}
                  admitted={admitted}
                  admitError={admitError}
                  isAdmitting={isAdmitting}
                  setIsScannerOpen={setIsScannerOpen}
                  entryInputRef={entryInputRef}
                  attendees={attendees}
                />
              }
            />
            <Route
              path="needs"
              element={
                <ManageNeedsSection eventId={event.id} isSeries={!!event?.series} />
              }
            />
            <Route path="*" element={<Navigate to="" replace />} />
          </Routes>
        </Suspense>
        <QRScannerModal
          isOpen={isScannerOpen}
          onClose={() => setIsScannerOpen(false)}
          onScanResult={async (barcode) => {
            if (!event) return null;
            const res = await validateTicket({
              barcode: barcode.trim(),
              eventId: event.id,
            });
            return res.success ? res.data : null;
          }}
          onAdmitEvent={async (ticketId) => {
            if (!event) return false;
            const res = await admitTicket(ticketId, event.id);
            if (res.success) {
              refetchAttendees();
              return true;
            }
            return false;
          }}
        />
      </div>
    </div>
  );
}
