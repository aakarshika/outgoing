/** ManageForHostPage — redesigned host event management UI. */

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useMatch, useNavigate, useParams } from 'react-router-dom';
import { toast } from 'sonner';

import { updateEvent } from '@/features/events/api';
import { useQueryClient } from '@tanstack/react-query';
import {
    useCategories,
    useEvent,
    useEventSeriesOccurrences,
    useGenerateEventSeriesOccurrences,
    useUpdateTicketTiers,
} from '@/features/events/hooks';
import { CATEGORY_ICON_MAP } from '@/features/events/constants';
import {
    canUseBrowserGeolocation,
    getCurrentCoordinates,
    reverseGeocodeCoordinates,
} from '@/utils/geolocation';
import { compressImage } from '@/utils/image';

import { EventFeature } from './manage/ManageDetailsSection';
import { BasicDetailsForm } from './components/manage-redesign/BasicDetailsForm';
import { CheckInInstructions } from './components/manage-redesign/CheckInInstructions';
import { EventFeaturesTags } from './components/manage-redesign/EventFeaturesTags';
import { SeriesTimeline } from './components/manage-redesign/SeriesTimeline';
import { TicketsAndCapacityForm } from './components/manage-redesign/TicketsAndCapacityForm';
import { TicketTier } from './components/manage-redesign/TicketsAndCapacityForm';
import { WhenAndWhereForm } from './components/manage-redesign/WhenAndWhereForm';
import { StepTabs } from './components/manage-redesign/ui/StepTabs';
import { PublishStep } from './components/manage-redesign/PublishStep';
import { ServicesPrepStep } from './components/manage-redesign/ServicesPrepStep';
import { EventReadinessStep } from './components/manage-redesign/EventReadinessStep';
import { LiveAttendanceStep } from './components/manage-redesign/LiveAttendanceStep';
import { WrapUpStep } from './components/manage-redesign/WrapUpStep';
import { BasicQuick } from './components/manage-redesign/BasicQuick';
// ── Configurable Steps Array ──────────────────────────────────────────────────
export const HOST_STEPS = [
    {
        stepId: 1,
        title: 'Info',
        routeSlug: 'basic-details',
        isHalfStep: false,
        components: [
            { id: 'basic-details', component: BasicDetailsForm as any },
            { id: 'basic-quick', component: BasicQuick as any },
            { id: 'event-features', component: EventFeaturesTags as any },
            { id: 'when-where', component: WhenAndWhereForm as any },
            { id: 'tickets-capacity', component: TicketsAndCapacityForm as any },
        ],
    },
    {
        stepId: 1.5,
        title: 'Publish',
        routeSlug: 'publish',
        isHalfStep: true,
        components: [
            { id: 'publish', component: PublishStep as any },
        ],
    },
    {
        stepId: 2,
        title: 'Prepare',
        routeSlug: 'services-prep',
        isHalfStep: false,
        components: [
            { id: 'services-prep', component: ServicesPrepStep as any },
        ],
    },
    {
        stepId: 2.5,
        title: 'Ready',
        routeSlug: 'event-readiness',
        isHalfStep: true,
        components: [
            { id: 'event-readiness', component: EventReadinessStep as any },
        ],
    },
    {
        stepId: 3,
        title: 'Live',
        routeSlug: 'live-attendance',
        isHalfStep: false,
        components: [
            { id: 'live-attendance', component: LiveAttendanceStep as any },
        ],
    },
    {
        stepId: 4,
        title: 'Wrap Up',
        routeSlug: 'wrap-up',
        isHalfStep: false,
        components: [
            { id: 'wrap-up', component: WrapUpStep as any },
        ],
    },
];


export default function ManageForHostPage() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const hostStepMatch = useMatch('/events/:id/host-event-management/:step');
    const activeSlug = hostStepMatch?.params.step;
    const hostBasePath = id ? `/events/${id}/host-event-management` : '/events/host-event-management';

    // ── Remote data ───────────────────────────────────────────────────────────
    const { data: eventResponse, refetch: refetchEvent, isLoading: isEventLoading } = useEvent(Number(id));
    const { data: catResponse } = useCategories();

    const event = eventResponse?.data;

    const getDefaultStepSlug = () => {
        if (!event) return HOST_STEPS[0].routeSlug;
        switch (event.lifecycle_state) {
            case 'published':
                return 'services-prep';
            case 'event_ready':
                return 'event-readiness';
            case 'live':
                return 'live-attendance';
            case 'completed':
                return 'wrap-up';
            case 'draft':
            case 'cancelled':
            case 'postponed':
            case 'at_risk':
            default:
                return 'basic-details';
        }
    };
    const defaultStepSlug = getDefaultStepSlug();

    const matchedStep = activeSlug ? HOST_STEPS.find((step) => step.routeSlug === activeSlug) : null;
    const hasValidSlug = Boolean(matchedStep);
    const activeStep = matchedStep ?? HOST_STEPS.find((step) => step.routeSlug === defaultStepSlug) ?? HOST_STEPS[0];
    const activeStepIndex = HOST_STEPS.findIndex((step) => step.stepId === activeStep.stepId);
    const goToStep = useCallback(
        (stepId: number) => {
            if (!id) return;
            const targetStep = HOST_STEPS.find((step) => step.stepId === stepId);
            if (!targetStep) return;
            navigate(`${hostBasePath}/${targetStep.routeSlug}`);
        },
        [hostBasePath, id, navigate],
    );

    useEffect(() => {
        if (!id) return;
        if (isEventLoading) return;

        if (!activeSlug) {
            navigate(`${hostBasePath}/${defaultStepSlug}`, { replace: true });
            return;
        }
        if (activeSlug && !hasValidSlug) {
            navigate(`${hostBasePath}/${defaultStepSlug}`, { replace: true });
        }
    }, [activeSlug, hasValidSlug, hostBasePath, defaultStepSlug, id, navigate, isEventLoading]);

    const categories = (catResponse?.data || []).map((c: any) => ({
        id: c.id,
        name: c.name,
        icon: CATEGORY_ICON_MAP[c.icon] || '📌',
    }));
    const canSaveBasicInfo = !event?.lifecycle_state
        || ['draft', 'published'].includes(event.lifecycle_state);


    const { data: occurrencesResponse, refetch: refetchOccurrences } = useEventSeriesOccurrences(event?.series?.id ?? 0);
    const occurrences = occurrencesResponse?.data || [];

    const generateOccurrences = useGenerateEventSeriesOccurrences();
    const updateTicketTiers = useUpdateTicketTiers();

    // ── Cover image ───────────────────────────────────────────────────────────
    const [coverPreview, setCoverPreview] = useState<string | null>(null);
    const handleCoverChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = () => setCoverPreview(reader.result as string);
            reader.readAsDataURL(file);
        }
    };

    // ── Location ──────────────────────────────────────────────────────────────
    const [latitude, setLatitude] = useState('');
    const [longitude, setLongitude] = useState('');
    const [isDetectingLocation, setIsDetectingLocation] = useState(false);
    const locationNameRef = useRef<HTMLInputElement>(null);
    const locationAddressRef = useRef<HTMLInputElement>(null);
    const [onlineUrl, setOnlineUrl] = useState('');
    const [locationMode, setLocationMode] = useState<'offline' | 'online'>('offline');

    const handleUseCurrentLocation = useCallback(async () => {
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
                if (locationNameRef.current) locationNameRef.current.value = reverse.venueName;
                if (locationAddressRef.current) locationAddressRef.current.value = reverse.displayAddress;
                toast.success('Location updated from your current position');
            } else {
                if (locationNameRef.current && !locationNameRef.current.value.trim()) {
                    locationNameRef.current.value = 'Current Location';
                }
                toast.success('Coordinates updated. You can edit venue/address manually.');
            }
        } catch {
            toast.error('Could not access your location.');
        } finally {
            setIsDetectingLocation(false);
        }
    }, []);

    // ── Timing ────────────────────────────────────────────────────────────────
    const [eventDuration, setEventDuration] = useState(0);
    const [generateUntil, setGenerateUntil] = useState('');
    const [previewDates, setPreviewDates] = useState<any[]>([]);
    const [title, setTitle] = useState('');
    const [category, setCategory] = useState('');
    const [description, setDescription] = useState('');

    // ── Tickets & features ────────────────────────────────────────────────────
    const [capacity, setCapacity] = useState('');
    const [ticketTiers, setTicketTiers] = useState<TicketTier[]>([]);
    const [eventFeatures, setEventFeatures] = useState<EventFeature[]>([]);

    // ── Apply to series toggle ────────────────────────────────────────────────
    const [applyToSeries, setApplyToSeries] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [inputMode, setInputMode] = useState<'quick' | 'advanced'>('quick');
    const [isDirty, setIsDirty] = useState(false);

    // ── Seed state from event ─────────────────────────────────────────────────
    useEffect(() => {
        if (event) {
            console.group('🔍 [ManageForHostPage] Data from DB (Initial Seed)');
            console.log('Event ID:', id);
            console.log('Event Details:', event);
            console.log('Ticket Tiers:', event.ticket_tiers);
            console.groupEnd();

            setCoverPreview(event.cover_image || null);
            setLatitude(event.latitude !== null ? String(event.latitude) : '');
            setLongitude(event.longitude !== null ? String(event.longitude) : '');
            if (event.location_address === 'Online Event') {
                setLocationMode('online');
                setOnlineUrl(event.location_name || '');
            }
            const dur = new Date(event.end_time).getTime() - new Date(event.start_time).getTime();
            if (dur > 0) setEventDuration(dur);
            if ((event.ticket_tiers?.length ?? 0) > 0) {
                setTicketTiers(event.ticket_tiers!.map((t: any) => ({
                    ...t,
                    price: t.price,
                    capacity: t.capacity === null ? '' : t.capacity,
                    admits: t.admits,
                    max_passes_per_ticket: t.max_passes_per_ticket,
                    refund_percentage: t.refund_percentage || 100,
                })) as any[]);
            }
            if ((event.features?.length ?? 0) > 0) setEventFeatures((event.features ?? []) as EventFeature[]);
            if (event.capacity) setCapacity(String(event.capacity));
            if (event.title) setTitle(event.title);
            if (event.category?.id) setCategory(String(event.category.id));
            if (event.description) setDescription(event.description);
            setIsDirty(false);
        }
    }, [event]);

    // ── Preview series occurrence dates ──────────────────────────────────────
    useEffect(() => {
        if (generateUntil && event?.series?.id) {
            const timeout = setTimeout(async () => {
                try {
                    const res = await generateOccurrences.mutateAsync({
                        seriesId: event!.series!.id,
                        payload: { generate_until: generateUntil + 'T23:59:59Z', preview: true },
                    });
                    setPreviewDates(res.data);
                } catch {
                    /* silent */
                }
            }, 500);
            return () => clearTimeout(timeout);
        } else {
            setPreviewDates([]);
        }
    }, [generateUntil, event?.series?.id]);

    // ── Save handler ──────────────────────────────────────────────────────────
    const handleUpdate = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!event) return;
        if (!canSaveBasicInfo) return;
        setIsSubmitting(true);

        const form = e.currentTarget;
        const formData = new FormData(form);

        console.group('💾 [ManageForHostPage] Starting Update');
        console.log('Event ID:', id);
        console.log('Step:', activeStep.routeSlug);
        console.log('Apply to Series:', applyToSeries);

        // Capacity + tier validation
        const totalCapacityVal = capacity ? parseInt(capacity, 10) : null;

        // Sync formData capacity
        if (totalCapacityVal !== null) {
            formData.set('capacity', String(totalCapacityVal));
        } else {
            formData.delete('capacity');
        }

        if (ticketTiers.length > 0 && totalCapacityVal !== null) {
            // Check if any tiers have manually specified capacity
            const manuallySetTiers = ticketTiers.slice(0, -1);
            const sumTiers = manuallySetTiers.reduce((acc, t) => acc + (Number(t.capacity) || 0), 0);

            if (sumTiers > totalCapacityVal) {
                toast.error(
                    `Manual tier capacities (${sumTiers}) exceed Total Capacity (${totalCapacityVal}).`,
                );
                setIsSubmitting(false);
                return;
            }
        }

        // Cover image compression
        const coverInput = form.querySelector<HTMLInputElement>('#cover_image');
        if (coverInput?.files?.[0]) {
            try {
                const compressed = await compressImage(coverInput.files[0], { newFileName: 'event_cover' });
                formData.delete('cover_image');
                formData.set('cover_image', compressed);
            } catch {
                formData.set('cover_image', coverInput.files[0]);
            }
        } else {
            formData.delete('cover_image');
        }

        // Fix category name for backend
        const categoryVal = formData.get('category');
        if (categoryVal) {
            formData.set('category_id', String(categoryVal));
            formData.delete('category');
        }

        formData.set('features', JSON.stringify(eventFeatures));
        if (applyToSeries) formData.set('update_series', 'true');

        try {
            // 1. Update main event details
            console.log('📤 Updating Event Details...', Object.fromEntries(formData.entries()));
            const eventUpdateRes = await updateEvent(event.id, formData);
            console.log('📥 Event Details Response:', eventUpdateRes);

            // 2. Update series occurrences if requested
            if (previewDates.length > 0 && generateUntil && event?.series?.id) {
                console.log('📤 Generating Series Occurrences...');
                const genRes = await generateOccurrences.mutateAsync({
                    seriesId: event.series.id,
                    payload: { generate_until: generateUntil + 'T23:59:59Z', preview: false },
                });
                console.log('📥 Generation Response:', genRes);
                setGenerateUntil('');
                setPreviewDates([]);
            }

            // 3. Update ticket tiers
            const tiersToSave = ticketTiers.map((t, index) => {
                const isLastTier = index === ticketTiers.length - 1;
                const totalCapacityNum = parseInt(capacity) || 0;

                let tierCap = t.capacity === '' || t.capacity === null ? null : Number(t.capacity);

                // If it's the last tier and we have a total capacity, calculate auto-capacity if not manually set
                if (isLastTier && totalCapacityNum > 0) {
                    let sumOthers = 0;
                    for (let i = 0; i < ticketTiers.length - 1; i++) {
                        sumOthers += Number(ticketTiers[i].capacity) || 0;
                    }
                    tierCap = Math.max(0, totalCapacityNum - sumOthers);
                }

                const mapped: any = {
                    name: t.name,
                    description: t.description || '',
                    price: Number(t.price || 0).toFixed(2),
                    capacity: tierCap,
                    admits: t.admits,
                    max_passes_per_ticket: t.max_passes_per_ticket,
                    is_refundable: true,
                };
                if (t.id) mapped.id = t.id;
                return mapped;
            });

            console.log('📤 Updating Ticket Tiers...', tiersToSave);
            const tierUpdateResponse = await updateTicketTiers.mutateAsync({
                eventId: event.id,
                tiers: tiersToSave,
                updateSeries: applyToSeries,
            });
            console.log('📥 Ticket Tiers Response:', tierUpdateResponse);

            // 4. Cleanup and refresh
            // We refetch first, but then we manually patch the cache with the tier data we just got
            // because the backend GET response is currently missing some fields (admits, max_passes).
            console.log('🔄 Refetching Event Data...');
            await refetchEvent();
            if (applyToSeries) await refetchOccurrences();

            if (tierUpdateResponse?.success && tierUpdateResponse.data) {
                console.log('🛠️ Patching State & Cache with full data...');
                const refreshedTiers = tierUpdateResponse.data;

                // Update local state directly with the full data from the mutation response
                setTicketTiers(refreshedTiers.map((t: any) => ({
                    ...t,
                    price: t.price,
                    capacity: t.capacity === null ? '' : t.capacity,
                    admits: t.admits,
                    max_passes_per_ticket: t.max_passes_per_ticket,
                    refund_percentage: t.refund_percentage || 100,
                })));

                // Manually patch the event data in cache so it won't revert on next render if refetched
                queryClient.setQueryData(['event', Number(id)], (old: any) => {
                    if (!old) return old;
                    return {
                        ...old,
                        data: {
                            ...old.data,
                            ticket_tiers: refreshedTiers
                        }
                    };
                });
            }

            console.groupEnd();
            toast.success('Event updated successfully!');
            setIsDirty(false);
        } catch (err: any) {
            console.error('❌ Update Failed:', err);
            console.groupEnd();
            toast.error(err?.response?.data?.message || 'Failed to update event');
        } finally {
            setIsSubmitting(false);
        }
    };

    const dateToLocalValue = (dateStr: string) => {
        if (!dateStr) return '';
        const d = new Date(dateStr);
        return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
    };

    // ── Step renderer ─────────────────────────────────────────────────────────
    const renderCurrentStepComponents = () => {
        const stepConfig = activeStep;
        if (!stepConfig) return null;

        const commonProps = { event, readonly: false };
        const isBasicStep = stepConfig.routeSlug === 'basic-details';
        const quickOnlyIds = new Set(['basic-quick']);
        const advancedOnlyIds = new Set([
            'basic-details',
            'event-features',
            'when-where',
            'tickets-capacity',
        ]);

        return (
            <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-300">
                {isBasicStep && (
                    <div className="flex items-center gap-3">
                        <label className="cursor-pointer">
                            <input
                                type="radio"
                                name="input_mode"
                                value="quick"
                                checked={inputMode === 'quick'}
                                onChange={() => setInputMode('quick')}
                                className="sr-only"
                            />
                            <span
                                className={`px-4 py-2 border-2 font-bold text-xs uppercase tracking-wider shadow-[2px_2px_0px_#333] transition-all ${inputMode === 'quick'
                                    ? 'bg-yellow-300 border-gray-800 text-gray-900'
                                    : 'bg-white border-gray-300 text-gray-600 hover:-translate-y-[1px] hover:shadow-[3px_3px_0px_#333]'
                                    }`}
                                style={{ fontFamily: '"Permanent Marker", cursive' }}
                            >
                                Quick Input
                            </span>
                        </label>
                        <label className="cursor-pointer">
                            <input
                                type="radio"
                                name="input_mode"
                                value="advanced"
                                checked={inputMode === 'advanced'}
                                onChange={() => setInputMode('advanced')}
                                className="sr-only"
                            />
                            <span
                                className={`px-4 py-2 border-2 font-bold text-xs uppercase tracking-wider shadow-[2px_2px_0px_#333] transition-all ${inputMode === 'advanced'
                                    ? 'bg-gray-900 border-gray-900 text-white'
                                    : 'bg-white border-gray-300 text-gray-600 hover:-translate-y-[1px] hover:shadow-[3px_3px_0px_#333]'
                                    }`}
                                style={{ fontFamily: '"Permanent Marker", cursive' }}
                            >
                                Advanced Input
                            </span>
                        </label>
                    </div>
                )}
                {stepConfig.components.map(({ id: cId, component: Component }) => {
                    if (isBasicStep) {
                        if (inputMode === 'quick' && advancedOnlyIds.has(cId)) return null;
                        if (inputMode === 'advanced' && quickOnlyIds.has(cId)) return null;
                    }
                    if (cId === 'basic-details') {
                        return (
                            <Component
                                key={cId}
                                {...commonProps}
                                categories={categories}
                                coverPreview={coverPreview}
                                handleCoverChange={handleCoverChange}
                                title={title}
                                setTitle={setTitle}
                                category={category}
                                setCategory={setCategory}
                                description={description}
                                setDescription={setDescription}
                            />
                        );
                    }
                    if (cId === 'basic-quick') {
                        return (
                            <Component
                                key={cId}
                                props={{
                                    ...commonProps,
                                    categories,
                                    coverPreview,
                                    handleCoverChange,
                                    title,
                                    setTitle,
                                    category,
                                    setCategory,
                                    description,
                                    setDescription,
                                }}
                                eprops={{
                                    ...commonProps,
                                    eventFeatures,
                                    setEventFeatures,
                                }}
                                tprops={{
                                    ...commonProps,
                                    capacity,
                                    setCapacity,
                                    ticketTiers,
                                    setTicketTiers,
                                }}
                                wprops={{
                                    ...commonProps,
                                    latitude,
                                    longitude,
                                    isDetectingLocation,
                                    locationNameRef,
                                    locationAddressRef,
                                    onlineUrl,
                                    setOnlineUrl,
                                    locationMode,
                                    setLocationMode,
                                    handleUseCurrentLocation,
                                    dateToLocalValue,
                                    eventDuration,
                                    setEventDuration,
                                    generateUntil,
                                    setGenerateUntil,
                                    previewDates,
                                }}
                            />
                        );
                    }

                    if (cId === 'when-where') {
                        return (
                            <Component
                                key={cId}
                                {...commonProps}
                                latitude={latitude}
                                longitude={longitude}
                                isDetectingLocation={isDetectingLocation}
                                locationNameRef={locationNameRef}
                                locationAddressRef={locationAddressRef}
                                onlineUrl={onlineUrl}
                                setOnlineUrl={setOnlineUrl}
                                locationMode={locationMode}
                                setLocationMode={setLocationMode}
                                handleUseCurrentLocation={handleUseCurrentLocation}
                                dateToLocalValue={dateToLocalValue}
                                eventDuration={eventDuration}
                                setEventDuration={setEventDuration}
                                generateUntil={generateUntil}
                                setGenerateUntil={setGenerateUntil}
                                previewDates={previewDates}
                            />
                        );
                    }
                    if (cId === 'tickets-capacity') {
                        return (
                            <Component
                                key={cId}
                                capacity={capacity}
                                setCapacity={setCapacity}
                                ticketTiers={ticketTiers}
                                setTicketTiers={setTicketTiers}
                                {...commonProps}
                            />
                        );
                    }
                    if (cId === 'event-features') {
                        return (
                            <Component
                                key={cId}
                                eventFeatures={eventFeatures}
                                setEventFeatures={setEventFeatures}
                                {...commonProps}
                            />
                        );
                    }
                    if (cId === 'publish') {
                        return <Component key={cId} {...commonProps} />;
                    }
                    if (cId === 'services-prep') {
                        return <Component key={cId} {...commonProps} />;
                    }
                    if (cId === 'event-readiness') {
                        return <Component key={cId} {...commonProps} />;
                    }
                    if (cId === 'live-attendance') {
                        return <Component key={cId} {...commonProps} />;
                    }
                    if (cId === 'wrap-up') {
                        return <Component key={cId} {...commonProps} />;
                    }
                    return null;
                })}
            </div>
        );
    };

    return (
        <div
            className="min-h-screen px-4 sm:px-6 py-8"
            style={{
                background: 'hsl(235, 45%, 97%)',
                backgroundImage: 'radial-gradient(hsl(235, 25%, 85%) 0.5px, transparent 0.5px)',
                backgroundSize: '15px 15px',
            }}
        >
            <div className="mx-auto max-w-4xl">
                {/* Series timeline (always visible) */}

                {/* Horizontal Step Tabs */}
                <StepTabs
                    currentStep={activeStep.stepId}
                    stepsConfig={HOST_STEPS}
                    onStepSelect={goToStep}
                />

                {/* Step content */}
                <form
                    onSubmit={handleUpdate}
                    onChange={() => {
                        if (!isDirty) setIsDirty(true);
                    }}
                >
                    {renderCurrentStepComponents()}

                    {/* Save actions */}
                    {activeStep.stepId == 1 && (<div className="mt-10 flex flex-wrap items-center justify-between gap-4  pt-6">
                        {/* Apply to series toggle */}
                        {canSaveBasicInfo && event?.series && (
                            <label className="flex items-center gap-2 cursor-pointer select-none">
                                <input
                                    type="checkbox"
                                    className="hidden"
                                    checked={applyToSeries}
                                    onChange={(e) => setApplyToSeries(e.target.checked)}
                                />
                                <div
                                    className={`relative w-10 h-5 transition-colors border-2 border-gray-800 shadow-[1px_1px_0px_#333] ${applyToSeries ? 'bg-yellow-300' : 'bg-white'}`}
                                >
                                    <div
                                        className={`absolute top-0 h-4 w-4 bg-gray-800 transition-transform ${applyToSeries ? 'translate-x-5' : 'translate-x-0'}`}
                                    />
                                </div>
                                <span
                                    className="text-sm font-bold text-gray-700"
                                    style={{ fontFamily: '"Permanent Marker", cursive' }}
                                >
                                    Apply to all drafts
                                </span>
                            </label>
                        )}
                        <SeriesTimeline occurrences={occurrences} currentEventId={Number(id)} />

                        <div className="flex gap-3 ml-auto">
                            {activeStepIndex > 0 && (<button
                                type="button"
                                disabled={activeStepIndex <= 0}
                                onClick={() => {
                                    if (activeStepIndex <= 0) return;
                                    goToStep(HOST_STEPS[activeStepIndex - 1].stepId);
                                }}
                                className="px-5 py-2 bg-white border-2 border-gray-800 shadow-[2px_2px_0px_#333] font-bold text-sm disabled:opacity-40 hover:-translate-y-[1px] hover:shadow-[3px_3px_0px_#333] transition-all"
                                style={{ fontFamily: '"Permanent Marker", cursive' }}
                            >
                                ← Back
                            </button>)}
                            {canSaveBasicInfo && (
                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className={`px-5 py-2 min-w-48 border-2 shadow-[2px_2px_0px_#333] font-bold text-sm transition-all disabled:opacity-60 ${isDirty
                                        ? 'bg-yellow-300 border-gray-800 text-gray-900 hover:-translate-y-[1px] hover:shadow-[3px_3px_0px_#333]'
                                        : 'bg-yellow-200/40 border-gray-300 text-gray-500'
                                        }`}
                                    style={{ fontFamily: '"Permanent Marker", cursive' }}
                                >
                                    {isSubmitting ? 'Saving…' : 'Save'}
                                </button>
                            )}
                            {activeStepIndex < HOST_STEPS.length - 1 && (
                                <button
                                    type="button"
                                    onClick={() => goToStep(HOST_STEPS[activeStepIndex + 1].stepId)}
                                    className={`px-5 py-2 border-2 shadow-[2px_2px_0px_#555] font-bold text-sm transition-all ${isDirty
                                        ? 'bg-yellow-300 text-gray-900 border-gray-800 hover:-translate-y-[1px] hover:shadow-[3px_3px_0px_#333]'
                                        : 'bg-gray-900 text-white border-gray-900 hover:-translate-y-[1px] hover:shadow-[3px_3px_0px_#555]'
                                        }`}
                                    style={{ fontFamily: '"Permanent Marker", cursive' }}
                                >
                                    Next →
                                </button>
                            )}
                        </div>
                    </div>)}
                </form>
            </div>
        </div>
    );
}
