import { Box, Button, Stack, TextField, Typography } from '@mui/material';
import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  isToday,
  startOfMonth,
  startOfWeek,
  subMonths,
} from 'date-fns';
import {
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  ImagePlus,
  LocateFixed,
  MapPin,
  Sparkles,
  Tag,
  Ticket,
  X,
} from 'lucide-react';
import { type ChangeEvent, useEffect, useMemo, useRef, useState } from 'react';
import { toast } from 'sonner';

import { EventFeaturesQuickForm } from '@/pages/events/components/manage-redesign/EventFeaturesQuickForm';
import { EventDetail } from '@/types/events';
import { TicketTier } from '@/pages/events/components/manage-redesign/TicketsAndCapacityForm';
import {
  canUseBrowserGeolocation,
  getCurrentCoordinates,
  type LocationSuggestion,
  reverseGeocodeCoordinates,
  searchLocation,
} from '@/utils/geolocation';
import { EventFeature } from '@/pages/events/manage/ManageDetailsSection';
import { QuickCreateAction, QuickEditEventSubmitPayload } from './QuickEditEvent';
import { useCategories } from '@/features/events/hooks';
import { getCategoryTheme } from '@/features/events/CategoricalBackground';
import { TICKET_COLORS } from '@/features/events/constants';

function toLocalDateTimeValue(date: Date) {
  return new Date(date.getTime() - date.getTimezoneOffset() * 60000)
    .toISOString()
    .slice(0, 16);
}


function defaultStartTime() {
  const next = new Date();
  next.setDate(next.getDate() + 1);
  next.setHours(19, 0, 0, 0);
  return toLocalDateTimeValue(next);
}

function buildEndTimeFromDuration(startValue: string, durationHours: number) {
  if (!startValue) return '';
  const start = new Date(startValue);
  if (Number.isNaN(start.getTime())) return '';
  const end = new Date(start.getTime() + durationHours * 60 * 60 * 1000);
  return toLocalDateTimeValue(end);
}

function buildPrimaryTicketTier(): TicketTier {
  return {
    name: 'Genral Admission',
    price: 0,
    admits: '1',
    max_passes_per_ticket: '6',
    capacity: '',
    description: '',
  };
}

function toTierCapacity(value: string): TicketTier['capacity'] {
  return value === '' ? '' : Number(value);
}

function buildVenueName(address: string) {
  return address.split(',')[0]?.trim() || 'TBD';
}

export function useEditEvent({
  event,
  activeStoryStep = 'basics',
  onSubmit,
  isSubmitting,
  isCreate,
}: {
  event: EventDetail | null;
  activeStoryStep?: 'basics' | 'story' | 'features' | 'timing' | 'location' | 'seating' | 'finish';
  onSubmit: (action: QuickCreateAction, payload: QuickEditEventSubmitPayload) => Promise<void>;
  isSubmitting: boolean;
  isCreate?: boolean;
}) {
  const categoryTheme = getCategoryTheme(event?.category ?? undefined);


  const { data: categories } = useCategories();
  const coverInputRef = useRef<HTMLInputElement | null>(null);

  const [title, setTitle] = useState(event?.title ?? '');
  const [description, setDescription] = useState(event?.description ?? '');
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(event?.cover_image ?? null);
  const [categoryId, setCategoryId] = useState<number | null>(event?.category?.id ?? null);
  const [startTime, setStartTime] = useState(
    event?.start_time ? toLocalDateTimeValue(new Date(event.start_time)) : '',
  );
  const [durationHours, setDurationHours] = useState(String(Math.max(0.25, Number((new Date(event?.end_time ?? '').getTime() - new Date(event?.start_time ?? '').getTime()) / (1000 * 60 * 60)) || 2)));
  const [locationMode, setLocationMode] = useState<'offline' | 'online'>(event?.location_address == 'Online Event' ? 'online' : 'offline');
  const [locationName, setLocationName] = useState(event?.location_name ?? '');
  const [locationAddress, setLocationAddress] = useState(event?.location_address ?? '');
  const [locationQuery, setLocationQuery] = useState(event?.location_address ?? '');
  const [locationSuggestions, setLocationSuggestions] = useState<LocationSuggestion[]>(
    [],
  );
  const [isSearchingLocations, setIsSearchingLocations] = useState(false);
  const [isDetectingLocation, setIsDetectingLocation] = useState(false);
  const [latitude, setLatitude] = useState(
    event?.latitude != null ? String(event.latitude) : '',
  );
  const [longitude, setLongitude] = useState(
    event?.longitude != null ? String(event.longitude) : '',
  );
  const [onlineUrl, setOnlineUrl] = useState(
    event?.location_address === 'Online Event' ? (event?.location_name ?? '') : '',
  );
  const [eventFeatures, setEventFeatures] = useState<EventFeature[]>(
    (event?.features as EventFeature[] | undefined) ?? [],
  );
  const [capacity, setCapacity] = useState(
    event?.capacity != null ? String(event.capacity) : '',
  );
  const [isPaidTicket, setIsPaidTicket] = useState(
    event?.ticket_price_standard != null && Number(event.ticket_price_standard) > 0,
  );
  const [minimumParticipants, setMinimumParticipants] = useState('10');
  const [ticketTiers, setTicketTiers] = useState<TicketTier[]>(
    event?.ticket_tiers && event.ticket_tiers.length > 0
      ? event.ticket_tiers.map((t) => ({
        name: t.name,
        price: Number(t.price),
        admits: String(t.admits),
        max_passes_per_ticket: '6',
        capacity: t.capacity != null ? t.capacity : '',
        description: t.description,
      }))
      : [buildPrimaryTicketTier()],
  );
  const [storyStepIndex, setStoryStepIndex] = useState(0);
  const [visibleMonth, setVisibleMonth] = useState(() =>
    startOfMonth(event?.start_time ? new Date(event.start_time) : new Date(defaultStartTime())),
  );

  const fieldSx = {
    '& .MuiOutlinedInput-root': {
      borderRadius: '18px',
      background: '#fff',
      '& fieldset': {
        borderColor: 'rgba(143, 105, 66, 0.18)',
      },
      '&:hover fieldset': {
        borderColor: 'rgba(216, 90, 48, 0.42)',
      },
      '&.Mui-focused fieldset': {
        borderColor: '#D85A30',
      },
    },
  } as const;



  const primaryTier = ticketTiers[0] || buildPrimaryTicketTier();
  const normalizedDurationHours = Math.max(0.25, Number(durationHours) || 2);
  const endTime = useMemo(
    () => buildEndTimeFromDuration(startTime, normalizedDurationHours),
    [normalizedDurationHours, startTime],
  );
  const resolvedPrimaryTier = useMemo<TicketTier>(() => {
    const fallback = buildPrimaryTicketTier();
    return {
      ...fallback,
      ...primaryTier,
      name: primaryTier.name?.trim() || 'Genral Admission',
      price: isPaidTicket ? Number(primaryTier.price || 0) : 0,
      admits: primaryTier.admits || '1',
      max_passes_per_ticket: primaryTier.max_passes_per_ticket || '6',
      capacity: toTierCapacity(capacity),
    };
  }, [capacity, isPaidTicket, primaryTier]);
  const resolvedTicketTiers = useMemo(
    () => [resolvedPrimaryTier],
    [resolvedPrimaryTier],
  );
  const selectedCategory = categories?.data?.find((item: any) => item.id === categoryId);
  const hasStoryAsset = description.trim().length > 0 || Boolean(coverFile);
  const hasValidTime =
    Boolean(startTime) &&
    Boolean(endTime) &&
    new Date(startTime).getTime() < new Date(endTime).getTime();
  const hasResolvedOfflineLocation =
    locationMode === 'offline' &&
    locationAddress.trim().length > 0 &&
    latitude.trim().length > 0 &&
    longitude.trim().length > 0;
  const hasOnlineLocation = locationMode === 'online';
  const hasTicketSetup =
    !isPaidTicket ||
    (resolvedPrimaryTier.name.trim().length > 0 &&
      Number(resolvedPrimaryTier.price || 0) > 0);

  const publishMissing = [
    title.trim() ? null : 'title',
    categoryId !== null ? null : 'category',
    hasStoryAsset ? null : 'description or photo',
    hasValidTime ? null : 'date and time',
    hasResolvedOfflineLocation || hasOnlineLocation
      ? null
      : 'location with coordinates',
    hasTicketSetup ? null : 'ticket amount',
  ].filter(Boolean) as string[];

  const timeSummary = hasValidTime
    ? `${format(new Date(startTime), 'EEE, MMM d · h:mma')} to ${format(
      new Date(endTime),
      'h:mma',
    )} (${normalizedDurationHours}h)`
    : 'Choose a start time and duration';
  const selectedStartDate = startTime ? new Date(startTime) : null;
  const calendarDays = eachDayOfInterval({
    start: startOfWeek(startOfMonth(visibleMonth), { weekStartsOn: 0 }),
    end: endOfWeek(endOfMonth(visibleMonth), { weekStartsOn: 0 }),
  });
  const selectedHour24 =
    selectedStartDate && !Number.isNaN(selectedStartDate.getTime())
      ? selectedStartDate.getHours()
      : 19;
  const selectedMinute =
    selectedStartDate && !Number.isNaN(selectedStartDate.getTime())
      ? selectedStartDate.getMinutes()
      : 0;
  const timeOptions = Array.from({ length: 48 }, (_, index) => {
    const hour24 = Math.floor(index / 2);
    const minute = index % 2 === 0 ? 0 : 30;
    const suffix = hour24 >= 12 ? 'PM' : 'AM';
    const hour12 = hour24 % 12 === 0 ? 12 : hour24 % 12;

    return {
      label: `${hour12}:${minute.toString().padStart(2, '0')} ${suffix}`,
      hour24,
      minute,
    };
  });


  const isPublishReady =
    title.trim().length > 0 &&
    categoryId !== null &&
    hasStoryAsset &&
    hasValidTime &&
    (hasResolvedOfflineLocation || hasOnlineLocation) &&
    hasTicketSetup;

  const canContinueCurrentStep = (() => {
    switch (activeStoryStep) {
      case 'basics':
        return title.trim().length > 0 && categoryId !== null;
      case 'story':
        return hasStoryAsset;
      case 'timing':
        return hasValidTime;
      case 'location':
        return locationMode === 'online' ? hasOnlineLocation : hasResolvedOfflineLocation;
      case 'features':
        return true; // optional
      case 'seating':
        return hasTicketSetup;
      case 'finish':
        return isPublishReady;
      default:
        return true;
    }
  })();


  const validateStep = (stepId: 'basics' | 'story' | 'features' | 'timing' | 'location' | 'seating') => {
    if (stepId === 'basics') {
      if (!title.trim()) {
        toast.error('Give the event a title first.');
        return false;
      }
      if (categoryId === null) {
        toast.error('Pick a category.');
        return false;
      }
    }

    if (stepId === 'story' && !hasStoryAsset) {
      toast.error('Add a description or a photo before continuing.');
      return false;
    }

    if (stepId === 'timing' && !hasValidTime) {
      toast.error('Choose a valid start time and duration.');
      return false;
    }

    if (stepId === 'location') {
      if (locationMode === 'offline' && !hasResolvedOfflineLocation) {
        toast.error('Pick an in-person address so we can capture the coordinates.');
        return false;
      }
    }

    if (stepId === 'seating' && !hasTicketSetup) {
      toast.error('Set a capacity and ticket amount.');
      return false;
    }

    return true;
  };
  useEffect(() => {
    if (locationMode !== 'offline') {
      setLocationSuggestions([]);
      setIsSearchingLocations(false);
      return;
    }

    const query = locationQuery.trim();
    if (query.length < 3) {
      setLocationSuggestions([]);
      setIsSearchingLocations(false);
      return;
    }

    const timeout = window.setTimeout(async () => {
      setIsSearchingLocations(true);
      try {
        const results = await searchLocation(query);
        setLocationSuggestions(results);
      } finally {
        setIsSearchingLocations(false);
      }
    }, 320);

    return () => window.clearTimeout(timeout);
  }, [locationMode, locationQuery]);

  const handleCoverChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] || null;
    setCoverFile(file);
    if (!file) {
      setCoverPreview(null);
      return;
    }

    const reader = new FileReader();
    reader.onload = () => setCoverPreview(reader.result as string);
    reader.readAsDataURL(file);
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
        setLocationAddress(reverse.displayAddress);
        setLocationQuery(reverse.displayAddress);
        setLocationName(reverse.venueName);
      } else {
        setLocationName('Current Location');
      }
      setLocationSuggestions([]);
      toast.success('Location updated from your current position');
    } catch {
      toast.error('Could not access your location.');
    } finally {
      setIsDetectingLocation(false);
    }
  };

  const handleLocationSelect = (suggestion: LocationSuggestion) => {
    setLocationAddress(suggestion.display_name);
    setLocationQuery(suggestion.display_name);
    setLatitude(Number(suggestion.lat).toFixed(6));
    setLongitude(Number(suggestion.lon).toFixed(6));
    if (!locationName.trim()) {
      setLocationName(buildVenueName(suggestion.display_name));
    }
    setLocationSuggestions([]);
  };

  const updateStartTime = (nextDate: Date) => {
    setStartTime(toLocalDateTimeValue(nextDate));
    setVisibleMonth(startOfMonth(nextDate));
  };

  const handleDateSelection = (day: Date) => {
    const base =
      selectedStartDate && !Number.isNaN(selectedStartDate.getTime())
        ? new Date(selectedStartDate)
        : new Date(defaultStartTime());
    const nextDate = new Date(day);
    nextDate.setHours(base.getHours(), base.getMinutes(), 0, 0);
    updateStartTime(nextDate);
  };


  const locationSummary =
    locationMode === 'online'
      ? onlineUrl.trim() || 'Online'
      : locationAddress.trim() || 'Pick an address';
  const locationTitle =
    locationMode === 'online'
      ? 'Online event'
      : locationName.trim() || buildVenueName(locationAddress.trim() || 'Venue TBD');
  const ticketPriceLabel = isPaidTicket
    ? `$${Number(resolvedPrimaryTier.price || 0).toFixed(0)}`
    : 'Free';
  const handleTimeOptionSelection = (hour24: number, minute: number) => {
    const base =
      selectedStartDate && !Number.isNaN(selectedStartDate.getTime())
        ? new Date(selectedStartDate)
        : new Date(defaultStartTime());
    base.setHours(hour24, minute, 0, 0);
    updateStartTime(base);
  };

  const recapItems = [
    {
      label: 'When',
      value: timeSummary,
      Icon: CalendarDays,
      accent: 'rgba(216, 90, 48, 0.12)',
      color: '#B54A26',
    },
    {
      label: 'Where',
      value: locationSummary,
      Icon: MapPin,
      accent: 'rgba(29, 158, 117, 0.14)',
      color: '#187354',
    },
    {
      label: 'Tickets',
      value: `${resolvedPrimaryTier.name || 'General admission'} · ${ticketPriceLabel}`,
      Icon: Ticket,
      accent: 'rgba(83, 74, 183, 0.12)',
      color: '#493FA4',
    },
    {
      label: 'Capacity',
      value: capacity ? `${capacity} spots` : 'Unlimited spots',
      Icon: Tag,
      accent: 'rgba(24, 95, 165, 0.12)',
      color: '#185FA5',
    },
  ] as const;

  const renderFinishSection = () => {

    return (
      <Stack spacing={2}>
        <Box
          sx={{
            position: 'relative',
            overflow: 'hidden',
            // background:
            //   'radial-gradient(circle at top right, rgba(255, 205, 164, 0.55), transparent 32%), linear-gradient(145deg, #FFF8EF 0%, #FFFFFF 48%, #F7F0FF 100%)',
            // borderRadius: '28px',
            // 
            // boxShadow: '0 24px 44px rgba(92, 63, 31, 0.08)',
            p: 1.75,
          }}
        >
          <Box
            sx={{
              position: 'absolute',
              top: -48,
              right: -36,
              width: 140,
              height: 140,
              borderRadius: '999px',
              background: 'rgba(216, 90, 48, 0.08)',
            }}
          />
          <Stack spacing={1.6} sx={{ position: 'relative', zIndex: 1 }}>
            <Stack direction="row" alignItems="center" justifyContent="space-between">
              <Stack direction="row" spacing={1} alignItems="center">
                <Box
                  sx={{
                    width: 38,
                    height: 38,
                    borderRadius: '14px',
                    display: 'grid',
                    placeItems: 'center',
                    background: '#2B2118',
                    color: '#fff',
                    boxShadow: '0 14px 24px rgba(43, 33, 24, 0.18)',
                  }}
                >
                  <Sparkles size={18} />
                </Box>
                <Box>
                  <Typography
                    sx={{
                      fontSize: 11,
                      fontWeight: 800,
                      letterSpacing: '0.12em',
                      textTransform: 'uppercase',
                      color: 'rgba(66, 50, 28, 0.56)',
                    }}
                  >
                    Quick recap
                  </Typography>
                </Box>
              </Stack>
            </Stack>

            <Box
              sx={{
                borderRadius: '24px',
                background: 'rgba(255, 255, 255, 0.82)',
                border: '1px solid rgba(143, 105, 66, 0.12)',
                backdropFilter: 'blur(10px)',
                p: 1.4,
              }}
            >
              <Stack direction="row" spacing={1.25} alignItems="flex-start">
                <Box
                  sx={{
                    width: 66,
                    height: 82,
                    flexShrink: 0,
                    overflow: 'hidden',
                    borderRadius: '18px',
                    background: coverPreview
                      ? 'transparent'
                      : 'linear-gradient(180deg, #fee5cf 0%, #f39a7d 100%)',
                    display: 'grid',
                    placeItems: 'center',
                    color: '#fff',
                  }}
                >
                  {coverPreview ? (
                    <Box
                      component="img"
                      src={coverPreview}
                      alt="Event cover preview"
                      sx={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  ) : (
                    <Typography
                      sx={{
                        fontFamily: 'Syne, sans-serif',
                        fontSize: 30,
                        fontWeight: 800,
                        letterSpacing: '-0.06em',
                      }}
                    >
                      {(title.trim()[0] || 'E').toUpperCase()}
                    </Typography>
                  )}
                </Box>

                <Stack spacing={0.8} sx={{ minWidth: 0, flex: 1 }}>
                  <Typography
                    sx={{
                      fontFamily: 'Syne, sans-serif',
                      fontSize: 26,
                      fontWeight: 800,
                      letterSpacing: '-0.05em',
                      color: '#2B2118',
                      lineHeight: 1,
                    }}
                  >
                    {title || 'Untitled event'}
                  </Typography>
                  <Stack
                    direction="row"
                    spacing={0.8}
                    sx={{ flexWrap: 'wrap', gap: 0.8 }}
                  >
                    <Box
                      sx={{
                        borderRadius: '999px',
                        px: 1.1,
                        py: 0.55,
                        bgcolor: 'rgba(43, 33, 24, 0.08)',
                        fontSize: 12,
                        fontWeight: 700,
                        color: '#2B2118',
                      }}
                    >
                      {selectedCategory?.name || 'No category yet'}
                    </Box>
                    <Box
                      sx={{
                        borderRadius: '999px',
                        px: 1.1,
                        py: 0.55,
                        bgcolor: 'rgba(216, 90, 48, 0.1)',
                        fontSize: 12,
                        fontWeight: 700,
                        color: '#B54A26',
                      }}
                    >
                      {ticketPriceLabel}
                    </Box>
                  </Stack>
                  <Typography
                    sx={{
                      fontSize: 13,
                      lineHeight: 1.65,
                      color: 'rgba(66, 50, 28, 0.72)',
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden',
                    }}
                  >
                    {description.trim() ||
                      `Happening at ${locationName.trim() || buildVenueName(locationAddress.trim() || 'Venue TBD')}. Add a stronger description if you want people to get the vibe faster.`}
                  </Typography>
                </Stack>
              </Stack>
            </Box>

            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, minmax(0, 1fr))' },
                gap: 1,
              }}
            >
              {recapItems.map(({ label, value, Icon, accent, color }) => (
                <Box
                  key={label}
                  sx={{
                    borderRadius: '20px',
                    // border: '1px solid rgba(143, 105, 66, 0.12)',
                    // background: 'rgba(255, 255, 255, 0.78)',
                    px: 1.15,
                    py: 1.05,
                  }}
                >
                  <Stack direction="row" spacing={1} alignItems="flex-start">
                    <Box
                      sx={{
                        width: 34,
                        height: 34,
                        flexShrink: 0,
                        borderRadius: '12px',
                        display: 'grid',
                        placeItems: 'center',
                        bgcolor: accent,
                        color,
                      }}
                    >
                      <Icon size={16} />
                    </Box>
                    <Box sx={{ minWidth: 0 }}>
                      <Typography
                        sx={{
                          fontSize: 10,
                          fontWeight: 800,
                          letterSpacing: '0.1em',
                          textTransform: 'uppercase',
                          color: 'rgba(66, 50, 28, 0.5)',
                          mb: 0.35,
                        }}
                      >
                        {label}
                      </Typography>
                      <Typography
                        sx={{
                          fontSize: 13,
                          fontWeight: 700,
                          lineHeight: 1.5,
                          color: '#2B2118',
                          overflowWrap: 'anywhere',
                        }}
                      >
                        {value}
                      </Typography>
                    </Box>
                  </Stack>
                </Box>
              ))}
            </Box>
          </Stack>
        </Box>

        <Box
          sx={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            gap: 1.2,
            // borderRadius: '24px',
            // background: '#FFF3D8',
            p: 1.8,
          }}
        >
          <Typography
            sx={{
              fontFamily: 'Syne, sans-serif',
              fontSize: 24,
              fontWeight: 800,
              letterSpacing: '-0.04em',
              color: '#2B2118',
            }}
          >
            Do you want Outgoers to help with your event needs?
          </Typography>

          <Button
            type="button"
            variant="contained"
            disabled={isSubmitting || categories?.data?.length === 0}
            onClick={() => void handleAction('needs-more')}
            sx={{
              borderRadius: '999px',
              mx: 8,
              py: 1.5,
              textTransform: 'none',
              background: '#2B2118',
              boxShadow: 'none',
              fontSize: 16,
              fontWeight: 700,
              '&:hover': {
                background: '#1E1711',
                boxShadow: 'none',
              },
            }}
          >
            {isSubmitting ? 'Saving...' : 'Yes, plan it out'}{' '}
            <ArrowRight size={15} style={{ marginLeft: 8 }} />
          </Button>
          <Typography
            sx={{
              mt: 5,
              justifyContent: 'center',
              textAlign: 'center',
              fontSize: 14,
              lineHeight: 1.7,
              color: '#6C4815',
            }}
          >
            If not, post directly and let the interest in.
          </Typography>
          {/* {!isPublishReady ? (
              <Typography sx={{ mt: 1.2, fontSize: 12, lineHeight: 1.6, color: '#8A5A12' }}>
                Post now unlocks once these are set: {publishMissing.join(', ')}.
              </Typography>
    
            ) : null} */}

          <Button
            type="button"
            variant="contained"
            disabled={isSubmitting || categories?.data?.length === 0 || !isPublishReady}
            onClick={() => void handleAction('post')}
            sx={{
              borderRadius: '999px',
              mx: 10,
              py: 1.8,
              textTransform: 'none',
              background: '#D85A30',
              boxShadow: 'none',
              fontSize: 18,
              fontWeight: 700,
              '&:hover': {
                background: '#C44C24',
                boxShadow: 'none',
              },
            }}
          >
            {isSubmitting ? 'Posting...' : 'Publish!'}
          </Button>
        </Box>
      </Stack>
    )
  };
  const renderBasicsSection = () => (
    <Stack spacing={2.2}>
      {isCreate && (<Typography
        sx={{
          display: 'inline-flex',
          alignItems: 'center',
          mt: 1.25,
          px: 1.25,
          py: 0.5,
          borderRadius: '999px',
          backgroundColor: 'rgba(216, 90, 48, 0.1)',
          color: '#B04A27',
          fontSize: 12,
          fontWeight: 700,
          letterSpacing: '0.01em',
        }}
      >
        From idea to sold-out event — plan, collaborate with the community, and watch
        the tickets roll in.{' '}
      </Typography>)}
      <TextField
        value={title}
        onChange={(event) => setTitle(event.target.value)}
        placeholder="Rooftop film night"
        fullWidth
        sx={{
          ...fieldSx,
          '& .MuiInputBase-input': {
            fontSize: isCreate ? 26 : 15,
            fontWeight: 700,
            py: isCreate ? 2 : 1,
          },
        }}
      />

      <Box>
        <Typography
          sx={{
            mb: 1,
            fontSize: 11,
            fontWeight: 800,
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            color: 'rgba(66, 50, 28, 0.58)',
          }}
        >
          Vibe category
        </Typography>
        <Box
          sx={{
            display: isCreate ? 'grid' : '  ',
            gridTemplateColumns: isCreate
              ? 'repeat(2, minmax(0, 1fr))'
              : '',
            gap: 1,
            maxHeight: isCreate ? 280 : 'none',
            overflowY: isCreate ? 'auto' : 'none',
            pr: 0.5,
          }}
        >
          {categories?.data?.map((category: any) => {
            const selected = category.id === categoryId;
            return (
              <Box
                key={category.id}
                component="button"
                type="button"
                onClick={() => setCategoryId(category.id)}
                sx={{
                  minHeight: isCreate ? 68 : 44,
                  borderRadius: '18px',
                  ml: isCreate ? 0 : 1,
                  mt: isCreate ? 0 : 1,
                  background: selected ? '#D85A30' : '#fff',
                  color: selected ? '#fff' : '#2B2118',
                  px: 1.5,
                  py: isCreate ? 1.1 : 0.5,
                  textAlign: 'left',
                  fontSize: isCreate ? 14 : 12,
                  fontWeight: isCreate ? 700 : 500,
                  lineHeight: 1.35,
                  boxShadow: selected ? '0 18px 28px rgba(216, 90, 48, 0.18)' : 'none',
                }}
              >
                {category.name}
              </Box>
            );
          })}
        </Box>
      </Box>
    </Stack>
  );

  const renderStorySection = () => (
    <Stack spacing={2.2}>
      <TextField
        value={description}
        onChange={(event) => setDescription(event.target.value)}
        placeholder="What is this event, who is it for, and why should someone show up?"
        multiline
        minRows={isCreate ? 5 : 4}
        fullWidth
        sx={{
          ...fieldSx,
          '& .MuiInputBase-input': {
            fontSize: 16,
            lineHeight: 1.7,
          },
        }}
      />

      <Box
        sx={{
          borderRadius: '24px',
          border: '1px dashed rgba(143, 105, 66, 0.3)',
          background: '#fff',
          overflow: 'hidden',
        }}
      >
        {coverPreview ? (
          <Box sx={{ position: 'relative' }}>
            <Box
              component="img"
              src={coverPreview}
              alt="Cover preview"
              sx={{
                display: 'block',
                width: '100%',
                height: isCreate ? 220 : 240,
                objectFit: 'cover',
              }}
            />
            <Button
              type="button"
              onClick={() => coverInputRef.current?.click()}
              sx={{
                position: 'absolute',
                right: 14,
                bottom: 14,
                borderRadius: '999px',
                textTransform: 'none',
                bgcolor: '#fff',
                color: '#2B2118',
                '&:hover': { bgcolor: '#fff' },
              }}
            >
              Change photo
            </Button>
          </Box>
        ) : (
          <Button
            type="button"
            onClick={() => coverInputRef.current?.click()}
            sx={{
              width: '100%',
              minHeight: isCreate ? 180 : 200,
              borderRadius: 0,
              textTransform: 'none',
              color: '#2B2118',
              display: 'flex',
              flexDirection: 'column',
              gap: 1,
            }}
          >
            <ImagePlus size={26} />
            <Typography sx={{ fontWeight: 700 }}>Add a photo</Typography>
            <Typography sx={{ fontSize: 13, color: 'rgba(66, 50, 28, 0.7)' }}>
              A strong image can stand in for a longer description.
            </Typography>
          </Button>
        )}
        <input
          ref={coverInputRef}
          type="file"
          accept="image/*"
          onChange={handleCoverChange}
          style={{ display: 'none' }}
        />
      </Box>
    </Stack>
  );

  const renderTimingSection = () => (
    <Stack spacing={2.2}>
      <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-start' }}>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Stack spacing={0.8}>
            <Stack
              direction="row"
              alignItems="center"
              justifyContent="space-between"
              sx={{ px: 0.2 }}
            >
              <Typography sx={{ fontSize: 14, fontWeight: 600 }}>
                {format(visibleMonth, 'MMMM yyyy')}
              </Typography>
              <Stack direction="row" spacing={0.2}>
                <Button
                  type="button"
                  onClick={() => setVisibleMonth((current) => subMonths(current, 1))}
                  sx={{
                    minWidth: 24,
                    width: 24,
                    height: 24,
                    p: 0,
                    color: '#2B2118',
                  }}
                >
                  <ArrowLeft size={14} />
                </Button>
                <Button
                  type="button"
                  onClick={() => setVisibleMonth((current) => addMonths(current, 1))}
                  sx={{
                    minWidth: 24,
                    width: 24,
                    height: 24,
                    p: 0,
                    color: '#2B2118',
                  }}
                >
                  <ArrowRight size={14} />
                </Button>
              </Stack>
            </Stack>

            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: 'repeat(7, minmax(0, 1fr))',
                columnGap: 0.5,
                rowGap: 0.35,
              }}
            >
              {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((label, index) => (
                <Typography
                  key={`${label}-${index}`}
                  sx={{
                    textAlign: 'center',
                    fontSize: 10,
                    color: 'rgba(66, 50, 28, 0.48)',
                    lineHeight: 1.6,
                  }}
                >
                  {label}
                </Typography>
              ))}
              {calendarDays.map((day) => {
                const isSelected =
                  selectedStartDate &&
                  !Number.isNaN(selectedStartDate.getTime()) &&
                  isSameDay(day, selectedStartDate);
                const isTodayCell = isToday(day);
                const isCurrentMonth = isSameMonth(day, visibleMonth);

                return (
                  <Box
                    key={day.toISOString()}
                    component="button"
                    type="button"
                    onClick={() => handleDateSelection(day)}
                    sx={{
                      height: 26,
                      border: 0,
                      borderRadius: 0,
                      background: isSelected
                        ? 'rgba(43, 33, 24, 0.12)'
                        : isTodayCell
                          ? 'rgba(216, 90, 48, 0.12)'
                          : 'transparent',
                      color: isSelected
                        ? '#2B2118'
                        : isCurrentMonth
                          ? '#2B2118'
                          : 'rgba(66, 50, 28, 0.3)',
                      fontSize: 12,
                      fontWeight: isSelected ? 700 : 400,
                      lineHeight: 1,
                      textAlign: 'center',
                    }}
                  >
                    {format(day, 'd')}
                  </Box>
                );
              })}
            </Box>
          </Stack>
        </Box>

        <Box
          sx={{
            width: 92,
            maxHeight: 220,
            overflowY: 'auto',
            pr: 0.3,
          }}
        >
          <Stack spacing={0}>
            {timeOptions.map((option) => {
              const isSelected =
                option.hour24 === selectedHour24 && option.minute === selectedMinute;

              return (
                <Box
                  key={option.label}
                  component="button"
                  type="button"
                  onClick={() =>
                    handleTimeOptionSelection(option.hour24, option.minute)
                  }
                  sx={{
                    border: 0,
                    borderRadius: 0,
                    background: isSelected ? 'rgba(43, 33, 24, 0.12)' : 'transparent',
                    color: '#2B2118',
                    fontSize: 12,
                    textAlign: 'left',
                    px: 1,
                    py: 0.55,
                    fontWeight: isSelected ? 700 : 400,
                  }}
                >
                  {option.label}
                </Box>
              );
            })}
          </Stack>
        </Box>
      </Box>
      <TextField
        type="number"
        label="Duration (hours)"
        value={durationHours}
        onChange={(event) => setDurationHours(event.target.value)}
        placeholder="2"
        fullWidth
        InputLabelProps={{ shrink: true }}
        inputProps={{ min: 0.25, step: 0.25 }}
        sx={fieldSx}
      />
      
      
    </Stack>
  );

  const renderLocationSection = () => (
    <Stack spacing={2}>
      <Stack direction="row" spacing={1}>
        {[
          { id: 'offline', label: 'In person' },
          { id: 'online', label: 'Online' },
        ].map((option) => {
          const selected = locationMode === option.id;
          return (
            <Box
              key={option.id}
              component="button"
              type="button"
              onClick={() => setLocationMode(option.id as 'offline' | 'online')}
              sx={{
                
                borderRadius: '999px',
                px: 1.8,
                py: 1,
                background: selected ? '#2B2118' : '#fff',
                color: selected ? '#fff' : '#2B2118',
                fontSize: 13,
                fontWeight: 700,
              }}
            >
              {option.label}
            </Box>
          );
        })}
      </Stack>

      {locationMode === 'online' ? (
        <TextField
          label="Meeting link or stream URL (optional)"
          value={onlineUrl}
          onChange={(event) => setOnlineUrl(event.target.value)}
          placeholder="https://zoom.us/j/..."
          fullWidth
          sx={fieldSx}
        />
      ) : (
        <>
          <TextField
            label="Venue name"
            value={locationName}
            onChange={(event) => setLocationName(event.target.value)}
            placeholder="Knitting Factory rooftop"
            fullWidth
            sx={fieldSx}
          />

          <Box sx={{ position: 'relative' }}>
            <Stack
              direction="row"
              justifyContent="space-between"
              alignItems="center"
              sx={{ mb: 0.8 }}
            >
              <Typography
                sx={{
                  fontSize: 11,
                  fontWeight: 800,
                  letterSpacing: '0.1em',
                  textTransform: 'uppercase',
                  color: 'rgba(66, 50, 28, 0.58)',
                }}
              >
                Search address
              </Typography>
              <Button
                type="button"
                onClick={handleUseCurrentLocation}
                sx={{
                  minWidth: 0,
                  px: 1.2,
                  py: 0.35,
                  borderRadius: '999px',
                  textTransform: 'none',
                  fontSize: 12,
                  color: '#2563eb',
                }}
              >
                <LocateFixed size={14} style={{ marginRight: 6 }} />
                {isDetectingLocation ? 'Finding...' : 'Find me'}
              </Button>
            </Stack>

            <TextField
              value={locationQuery}
              onChange={(event) => {
                setLocationQuery(event.target.value);
                setLocationAddress(event.target.value);
                setLatitude('');
                setLongitude('');
              }}
              placeholder="123 Park Ave, Brooklyn, NY"
              fullWidth
              sx={fieldSx}
            />

            {isSearchingLocations ? (
              <Typography sx={{ mt: 1, fontSize: 12, color: 'rgba(66, 50, 28, 0.62)' }}>
                Searching addresses...
              </Typography>
            ) : null}

            {locationSuggestions.length > 0 ? (
              <Box
                sx={{
                  mt: 1,
                  borderRadius: '18px',
                  overflow: 'hidden',
                  border: '1px solid rgba(143, 105, 66, 0.14)',
                  bgcolor: '#fff',
                }}
              >
                {locationSuggestions.map((suggestion) => (
                  <Box
                    key={suggestion.place_id}
                    component="button"
                    type="button"
                    onClick={() => handleLocationSelect(suggestion)}
                    sx={{
                      width: '100%',
                      textAlign: 'left',
                      px: 1.4,
                      py: 1.15,
                      border: 0,
                      background: 'transparent',
                      cursor: 'pointer',
                      '&:hover': { background: '#FFF1DE' },
                    }}
                  >
                    <Typography sx={{ fontSize: 13, lineHeight: 1.6 }}>
                      {suggestion.display_name}
                    </Typography>
                  </Box>
                ))}
              </Box>
            ) : null}
          </Box>

          <Box
            sx={{
              borderRadius: '18px',
              background: '#fff',
              
              px: 1.6,
              py: 1.3,
            }}
          >
            <Stack direction="row" spacing={1} alignItems="center">
              <MapPin size={15} />
              <Typography sx={{ fontSize: 13, fontWeight: 700 }}>
                {latitude && longitude
                  ? `${latitude}, ${longitude}`
                  : 'Select an address to capture coordinates'}
              </Typography>
            </Stack>
          </Box>
        </>
      )}
    </Stack>
  );

  const renderTotalCapacityField = () => (
    <TextField
      label="Total capacity"
      type="number"
      value={capacity}
      onChange={(event) => {
        const nextCapacity = event.target.value;
        setCapacity(nextCapacity);
        setTicketTiers((current) => {
          const tier = current[0] || buildPrimaryTicketTier();
          return [
            {
              ...tier,
              capacity: toTierCapacity(nextCapacity),
            },
          ];
        });
      }}
      placeholder={`${capacity === '' ? 'Unlimited' : 'Total capacity'}`}
      fullWidth
      sx={fieldSx}
      helperText="Leave blank for unlimited capacity."
    />
  );

  const renderTotalCapacitySection = () => (
    <Stack spacing={1.4}>
      <Typography
        sx={{ fontSize: 13, lineHeight: 1.7, color: 'rgba(66, 50, 28, 0.72)' }}
      >
        Total capacity is how many people can attend across all tiers. Leave blank if you
        don&apos;t want a hard cap.
      </Typography>
      {renderTotalCapacityField()}
    </Stack>
  );

  const renderFeaturesSection = () => (
    <Stack spacing={1.4}>
      <Typography
        sx={{ fontSize: 13, lineHeight: 1.7, color: 'rgba(66, 50, 28, 0.72)' }}
      >
        Features are optional, but they help tell the story fast.
      </Typography>
      <Box
        sx={{
          borderRadius: '24px',
          border: '1px solid rgba(143, 105, 66, 0.14)',
          background: '#fff',
          p: 1.4,
        }}
      >
        <EventFeaturesQuickForm
          eventFeatures={eventFeatures}
          setEventFeatures={setEventFeatures}
          showLabels
        />
      </Box>
    </Stack>
  );

  const renderSeatingSection = () => (
    <Box
      sx={{
        borderRadius: '24px',
        border: '1px solid rgba(143, 105, 66, 0.14)',
        background: '#fff',
        p: 1.5,
      }}
    >
      <Stack spacing={2.2}>
        {renderTotalCapacityField()}

        <TextField
          label="Ticket name"
          value={resolvedPrimaryTier.name}
          onChange={(event) =>
            setTicketTiers((current) => {
              const tier = current[0] || buildPrimaryTicketTier();
              return [{ ...tier, name: event.target.value }];
            })
          }
          fullWidth
          sx={fieldSx}
        />

        <Box
          sx={{
            display: 'inline-flex',
            p: 0.5,
            borderRadius: '999px',
            
            background: '#fff',
            width: 'fit-content',
          }}
        >
          {[
            { id: 'free', label: 'Free' },
            { id: 'paid', label: 'Paid' },
          ].map((option) => {
            const selected =
              (option.id === 'paid' && isPaidTicket) ||
              (option.id === 'free' && !isPaidTicket);
            return (
              <Box
                key={option.id}
                component="button"
                type="button"
                onClick={() => {
                  const nextIsPaid = option.id === 'paid';
                  setIsPaidTicket(nextIsPaid);
                  setTicketTiers((current) => {
                    const tier = current[0] || buildPrimaryTicketTier();
                    return [
                      {
                        ...tier,
                        price: nextIsPaid ? Number(tier.price || 0) : 0,
                        capacity: toTierCapacity(capacity),
                      },
                    ];
                  });
                }}
                sx={{
                  minWidth: 92,
                  px: 2.2,
                  py: 1.1,
                  borderRadius: '999px',
                  background: selected ? '#2B2118' : 'transparent',
                  color: selected ? '#fff' : 'rgba(66, 50, 28, 0.72)',
                  fontSize: 14,
                  fontWeight: 700,
                }}
              >
                {option.label}
              </Box>
            );
            
          })}
        </Box>

        <Box
          sx={{
            borderRadius: '24px',
            overflow: 'hidden',
            
            background:
              `linear-gradient(135deg, rgba(216, 90, 48, 0.08) 0%, rgba(255,255,255,1) 36%, ${TICKET_COLORS[0].light} 100%)`,
          }}
        >
          <Box sx={{ display: 'flex', minHeight: 168 }}>
            <Box
              sx={{
                width: 108,
                flexShrink: 0,
                bgcolor: TICKET_COLORS[0].dark,
                color: '#fff',
                position: 'relative',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                px: 1.5,
              }}
            >
              <Box
                sx={{
                  position: 'absolute',
                  top: 0,
                  right: -1,
                  bottom: 0,
                  borderRight: '2px dashed rgba(255,255,255,0.55)',
                }}
              />
              <Box
                sx={{
                  position: 'absolute',
                  top: -9,
                  right: -9,
                  width: 18,
                  height: 18,
                  borderRadius: '999px',
                  bgcolor: '#fff',
                }}
              />
              <Box
                sx={{
                  position: 'absolute',
                  bottom: -9,
                  right: -9,
                  width: 18,
                  height: 18,
                  borderRadius: '999px',
                  bgcolor: '#fff',
                }}
              />
              <Typography
                sx={{
                  fontSize: 10,
                  letterSpacing: '0.18em',
                  textTransform: 'uppercase',
                  opacity: 0.75,
                  writingMode: 'vertical-rl',
                  transform: 'rotate(180deg)',
                  mb: 1,
                }}
              >
                Admits {resolvedPrimaryTier.admits || 1}
              </Typography>
              <Typography
                sx={{
                  mt: 1,
                  fontFamily: 'Syne, sans-serif',
                  fontSize: 28,
                  fontWeight: 800,
                  lineHeight: 1,
                }}
              >
                {isPaidTicket
                  ? `$${Number(resolvedPrimaryTier.price || 0).toFixed(0)}`
                  : 'FREE'}
              </Typography>
            </Box>

            <Box
              sx={{ flex: 1, p: 2, display: 'flex', flexDirection: 'column', gap: 1.5 }}
            >
              <Typography
                sx={{
                  fontSize: 10,
                  fontWeight: 800,
                  letterSpacing: '0.1em',
                  textTransform: 'uppercase',
                  color: 'rgba(66, 50, 28, 0.56)',
                }}
              >
                Ticket
              </Typography>

              {isPaidTicket ? (
                <>
                  <TextField
                    label="Ticket amount"
                    type="number"
                    value={String(resolvedPrimaryTier.price ?? '')}
                    onChange={(event) =>
                      setTicketTiers((current) => {
                        const tier = current[0] || buildPrimaryTicketTier();
                        return [
                          {
                            ...tier,
                            price: Number(event.target.value || 0),
                          },
                        ];
                      })
                    }
                    fullWidth
                    sx={fieldSx}
                  />
                </>
              ) : (
                <Typography
                  sx={{
                    fontFamily: 'Syne, sans-serif',
                    fontSize: 24,
                    fontWeight: 800,
                    letterSpacing: '-0.04em',
                    color: '#2B2118',
                  }}
                >
                  {resolvedPrimaryTier.name}
                </Typography>
              )}

              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.2}>
                <TextField
                  label="People allowed per ticket"
                  type="number"
                  value={String(resolvedPrimaryTier.admits ?? '1')}
                  onChange={(event) =>
                    setTicketTiers((current) => {
                      const tier = current[0] || buildPrimaryTicketTier();
                      return [
                        {
                          ...tier,
                          admits: event.target.value || '1',
                        },
                      ];
                    })
                  }
                  fullWidth
                  sx={fieldSx}
                />
              </Stack>

              <Typography
                sx={{ fontSize: 13, lineHeight: 1.7, color: 'rgba(66, 50, 28, 0.72)' }}
              >
                {`${resolvedPrimaryTier.admits || 1} person allowed per ticket. Event will happen if at least 20% participants come.`}
              </Typography>
            </Box>
          </Box>
        </Box>

        <Button
          type="button"
          onClick={() => void handleAction('tickets-more')}
          disabled={isSubmitting}
          sx={{
            alignSelf: 'flex-start',
            borderRadius: '999px',
            px: 1.6,
            py: 1,
            textTransform: 'none',
            color: '#2B2118',
            
            background: '#fff',
          }}
        >
          Save Draft  for More options
          <ArrowRight size={15} style={{ marginLeft: 8 }} />
        </Button>
      </Stack>
    </Box>
  );


  const handleAction = async (action: QuickCreateAction) => {
    if (!title.trim()) {
      toast.error('Give the event a title first.');
      return;
    }
    if (categoryId === null) {
      toast.error('Pick a category.');
      return;
    }
    if (action === 'post' && !isPublishReady) {
      toast.error(`Add the missing details first: ${publishMissing.join(', ')}.`);
      return;
    }

    const fallbackLocationName =
      locationMode === 'online'
        ? onlineUrl.trim() || 'Online Event'
        : locationName.trim() || buildVenueName(locationAddress.trim() || 'TBD');
    const fallbackLocationAddress =
      locationMode === 'online' ? 'Online Event' : locationAddress.trim() || 'TBD';
    const fallbackStart = startTime
      ? new Date(startTime)
      : new Date(Date.now() + 24 * 60 * 60 * 1000);
    const fallbackEnd = endTime
      ? new Date(endTime)
      : new Date(fallbackStart.getTime() + normalizedDurationHours * 60 * 60 * 1000);

    await onSubmit(action, {
      title: title.trim(),
      description: description.trim(),
      categoryId,
      startTimeIso: fallbackStart.toISOString(),
      endTimeIso: fallbackEnd.toISOString(),
      locationMode,
      locationName: fallbackLocationName,
      locationAddress: fallbackLocationAddress,
      latitude,
      longitude,
      onlineUrl: onlineUrl.trim(),
      coverFile,
      ticketPriceStandard: isPaidTicket
        ? String(resolvedPrimaryTier.price)
        : null,
      capacity: String(capacity),
      ticketTiers: resolvedTicketTiers.map(t => ({
        ...t,
        price: Number(t.price),
        capacity: t.capacity === "" ? null : Number(t.capacity)
      })) as any[],
      features: eventFeatures,
    });
  };

  return {
    renderBasicsSection,
    renderStorySection,
    renderTimingSection,
    renderLocationSection,
    renderFeaturesSection,
    renderTotalCapacitySection,
    renderSeatingSection,
    renderFinishSection,
    handleAction,
    validateStep,
    canContinueCurrentStep,
    isPublishReady,
  }
}