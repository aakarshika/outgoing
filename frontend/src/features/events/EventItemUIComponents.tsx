import { createContext, useContext, useMemo } from "react";
import { formatEventPrice, getEventCardRoles } from "./scrapbookCard";
import { Box, Typography, TypographyProps } from '@mui/material';
import { Calendar, Globe } from 'lucide-react';

import { useAuth } from '@/features/auth/hooks';
import { formatEventRelativeTime } from '@/utils/dateUtils';

import { getCategoryTheme } from './CategoricalBackground';
import { LocationTag } from './LocationTag';
import { ImageWatermarkPlaceholder } from './scrapbookCard';
import { PosterForEventCard } from "@/pages/events/components/PosterForEventCard";

// Calculate font size based on content length with optional multiplier
// For title: base 3rem, decreases by 0.06rem per character (1/50 * 3 = 0.06)
// For description: base 2rem, decreases by 0.013rem per character (1/150 * 2 ≈ 0.013)
export const calculateTitleFontSize = (length: number, multiplier: number = 1): string => {
  const baseSize = 2.5 - (length / 50);
  return Math.max(baseSize * multiplier, 1.2) + 'rem'; // Minimum 0.8rem
};

export const calculateDescriptionFontSize = (length: number, multiplier: number = 1): string => {
  const baseSize = 2.2 - (length / 100);
  return Math.max(baseSize * multiplier, 1) + 'rem'; // Minimum 0.6rem
};

// Title Typography component with dynamic font size
export const DynamicTitleTypography = ({
  multiplier = 1,
  sx,
  children,
}: Omit<TypographyProps, 'children'> & {
  multiplier?: number;
  children: React.ReactNode;
}) => {
  const fontSize = useMemo(
    () => calculateTitleFontSize(children?.toString().length || 0, multiplier),
    [children?.toString().length, multiplier]
  );

  return (
    <Typography
      sx={{
        fontFamily: '"Permanent Marker"',
        fontSize,
        color: '#444444',
        lineHeight: 1.2,
        display: '-webkit-box',
        WebkitLineClamp: 5,
        WebkitBoxOrient: 'vertical',
        overflow: 'hidden',
        textAlign: 'center',
        ...sx,
      }}
    >
      {children}
    </Typography>
  );
};

export const DynamicDescriptionTypography = ({
  children,
  multiplier = 1,
  sx,
  ...props
}: Omit<TypographyProps, 'children'> & {
  children: React.ReactNode;
  multiplier?: number;
}) => {
  const fontSize = useMemo(
    () => calculateDescriptionFontSize(children?.toString().length || 0, multiplier),
    [children?.toString().length, multiplier]
  );

  return (
    <Typography
      sx={{
        fontSize,
        color: '#555',
        fontFamily: 'serif',
        textAlign: 'center',
        display: '-webkit-box',
        WebkitLineClamp: 6,
        WebkitBoxOrient: 'vertical',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        ...sx,
      }}
      {...props}
    >
      {children}
    </Typography>
  );
};

// Flexible event type for UI components that may not have all EventListItem fields
export interface ScrapbookEventData {
  id: number;
  title: string;
  description?: string;
  cover_image: string | null;
  start_time: string;
  location_name: string;
  location_address?: string;
  latitude?: number | null;
  longitude?: number | null;
  category?: { name: string; icon: string; slug?: string } | null;
  ticket_price_standard: string | null;
  ticket_price_flexible: string | null;
  lifecycle_state: string;
  user_is_interested?: boolean;
  interest_count?: number;
  capacity?: number | null;
  ticket_count?: number;
  media?: Array<{
    id: number;
    media_type: 'image' | 'video';
    category: 'gallery' | 'highlight';
    file: string;
  }>;
  user_has_ticket?: boolean;
  user_is_vendor?: boolean;
  host?: { username: string };
  user_applications?: any[];
}



export const MainInfoCardImage = () => {
  const { theme, isFocused, event, relativeTime } = useEventUIContext() ?? {};

  if (!event || !theme || !relativeTime) {
    return null; // or return a loading state
  }

  return (
    <>
      <Box
        sx={{
          aspectRatio: '1.85 / 1',
          minHeight: 'auto',
          overflow: 'hidden',
          mb: 2,
          position: 'relative',
        }}
      >
        <Box
          className="polaroid-img"
          sx={{
            width: '100%',
            height: '100%',
            maxHeight: isFocused ? '400px' : 'auto',
            objectFit: isFocused ? 'contain' : 'cover',
            transition: 'all 0.5s ease',
            transformOrigin: 'top center',
          }}
        >
          <PosterForEventCard
            imageUrl={event?.cover_image || ''}
            title={'df'}
          />
        </Box>
      </Box>

      <Box sx={{ px: 0.5, pl: '12px' }}>
        <DynamicTitleTypography multiplier={0.4}>
          {event.title}
        </DynamicTitleTypography>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
          <DynamicDescriptionTypography multiplier={0.5}>
            {event.description}
          </DynamicDescriptionTypography>
        </Box>
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            width: '100%',
            gap: 1,
          }}
        >
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1,
              flexShrink: 0,
            }}
          >
            <Calendar size={12} color="#666" />
            <Typography
              sx={{
                fontSize: '0.75rem',
                fontWeight: 'bolder',
                color: '#666',
                fontFamily: 'serif',
                whiteSpace: 'nowrap',
              }}
            >
              {relativeTime}
            </Typography>
          </Box>

          <Box
            sx={{
              minWidth: 0,
              flex: 1,
              display: 'flex',
              justifyContent: 'flex-end',
              overflow: 'hidden',
            }}
          >
            <LocationTag
              locationName={event.location_name}
              locationAddress={event.location_address}
              latitude={event.latitude}
              longitude={event.longitude}
              size={12}
              color="#666"
            />
          </Box>
        </Box>
      </Box>
    </>

  )
};


export const MainInfoCard = () => {
  const { theme, titleFontSize, descriptionFontSize, isFocused, event, relativeTime } = useEventUIContext() ?? {};

  if (!event || !theme || !titleFontSize || !descriptionFontSize || !relativeTime) {
    return null; // or return a loading state
  }

  return (
    <Box
      sx={{
        minHeight: { xs: 260, sm: 280 },
      }}
    >
      <MainInfoBaseBox>

        <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>

          <DynamicTitleTypography
            sx={{ pt: 2, pb: 1 }}
          >
            {event.title}
          </DynamicTitleTypography>

          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 1,
            }}
          >
            <DynamicDescriptionTypography>
              {event.description || ''}
            </DynamicDescriptionTypography>
          </Box>
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              width: '100%',
              gap: 1,
            }}
          >
            <MainInfoTimeLocationBox />
          </Box>
        </Box>
      </MainInfoBaseBox>

    </Box>

  )
};

export const OnlineTimeLocationBox = () => {
  const { event, relativeTime } = useEventUIContext() ?? {};


  return (

      <Box
        sx={{
          display: 'flex',
          width: '100%',
        }}>

        <Box sx={{ display: 'flex', gap: 1 }}>
          <Globe size={12} color="#2121b6ff" />
          <Typography
            sx={{
              fontSize: '0.82rem',
              fontWeight: 'bolder',
              color: event?.location_address?.toLowerCase() === 'online event' ? '#5b21b6' : '#555',
              fontFamily: 'serif',
              whiteSpace: 'nowrap',
            }}
          >
            {relativeTime}
          </Typography>
        </Box>

      </Box>
  );
};
export const MainInfoTimeLocationBox = () => {
  const { event, relativeTime } = useEventUIContext() ?? {};


  return (
    <Box
      sx={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        width: '100%',
        gap: 1,
      }}
    >

      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          width: '100%',
          gap: 1,
        }}
      ><Box
        sx={{
          minWidth: 0,
          flex: 1,
          display: 'flex',
          justifyContent: 'flex-start',
          overflow: 'hidden',
        }}
      >
          <LocationTag
            locationName={event?.location_name || ''}
            locationAddress={event?.location_address || ''}
            latitude={event?.latitude}
            longitude={event?.longitude}
            size={13}
            color={event?.location_address?.toLowerCase() === 'online event' ? '#5b21b6' : '#555'}
          />
        </Box>
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1,
            flexShrink: 0,
          }}
        >
          <Typography
            sx={{
              fontSize: '0.82rem',
              fontWeight: 'bolder',
              color: event?.location_address?.toLowerCase() === 'online event' ? '#5b21b6' : '#555',
              fontFamily: 'serif',
              whiteSpace: 'nowrap',
            }}
          >
            {relativeTime}
          </Typography>
        </Box>

      </Box>
    </Box>
  );
};

export const MainInfoBaseBox = ({ children }: { children: React.ReactNode }) => {
  const { theme, titleFontSize, descriptionFontSize, isFocused, event, relativeTime } = useEventUIContext() ?? {};

  if (!event || !theme || !titleFontSize || !descriptionFontSize || !relativeTime) {
    return null; // or return a loading state
  }

  return (
    <Box
      sx={{
        aspectRatio: '1/1',
        width: '100%',
        border: '1px dashed rgba(0,0,0,0.14)',
        bgcolor: 'rgba(255, 255, 255, 0.77)',
        p: 2.2,
      }}
    >
      <ImageWatermarkPlaceholder theme={theme} size="md" iconOnly />

      {children}
    </Box>

  )
};


export function useEventUIData({
  event,
  isFocused,
  showClip = false,
  rotation,
  rotationhover,
  disableHover,
  isBasicEventCard = false,
}: {
  event: ScrapbookEventData;
  isFocused?: boolean;
  showClip?: boolean;
  rotation?: number;
  rotationhover?: number;
  disableHover?: boolean;
  isBasicEventCard?: boolean;
}) {

  const { user, isAuthenticated } = useAuth();
  const { isHost, isVendor } = getEventCardRoles(event, {
    user: user ?? null,
    isAuthenticated,
  });

  const theme = getCategoryTheme(event.category ?? undefined);
  const relativeTime = formatEventRelativeTime(event.start_time);
  const price = formatEventPrice(event.ticket_price_standard);
  const isNoImageCard = !event.cover_image;

  // const rotation = useMemo(
  //   () => (1 + Math.random() * 2),
  //   [],
  // );
  const baseRotation = useMemo(
    () => (rotation !== undefined ? rotation : Math.random() * 8 - 4),
    [rotation],
  );

  const hoverRotation = useMemo(
    () =>
      rotationhover !== undefined
        ? rotationhover
        : baseRotation + (1 + Math.random() * 2),
    [rotationhover, baseRotation],
  );

  // Dynamic font size calculations based on content length
  const titleFontSize = useMemo(() => {
    const length = event.title?.length || 0;
    return (3 - (length / 50)) + 'rem';
  }, [event.title]);

  const descriptionFontSize = useMemo(() => {
    const length = event.description?.length || 0;
    return (2 - (length / 150)) + 'rem';
  }, [event.description]);

  const titleFontSizeWithImage = useMemo(() => {
    const length = event.title?.length || 0;
    return (2 - (length / 50)) + 'rem';
  }, [event.title]);

  const descriptionFontSizeWithImage = useMemo(() => {
    const length = event.description?.length || 0;
    return (1.7 - (length / 150)) + 'rem';
  }, [event.description]);

  return {
    theme,
    relativeTime,
    price,
    isNoImageCard,
    baseRotation,
    hoverRotation,
    titleFontSize,
    descriptionFontSize,
    titleFontSizeWithImage,
    descriptionFontSizeWithImage,
    isHost,
    isVendor,
    event,
    isFocused,
  };
}

// Create context
export type EventUIType = ReturnType<typeof useEventUIData> | null;

export const EventUI = createContext<EventUIType>(null);

// Provider component
export function EventUIProvider({
  children,
  event,
  isFocused,
  showClip = false,
  rotation,
  rotationhover,
  disableHover,
  isBasicEventCard = false,
}: {
  children: React.ReactNode;
  event: ScrapbookEventData;
  isFocused?: boolean;
  showClip?: boolean;
  rotation?: number;
  rotationhover?: number;
  disableHover?: boolean;
  isBasicEventCard?: boolean;
}) {
  const eventUIData = useEventUIData({ event, isFocused, showClip, rotation, rotationhover, disableHover, isBasicEventCard });
  return (
    <EventUI.Provider value={eventUIData}>
      {children}
    </EventUI.Provider>
  );
}
// Hook for child components
export function useEventUIContext() {
  const context = useContext(EventUI);
  if (context === undefined) {
    throw new Error('useEventUI must be used within a EventUIProvider');
  }
  return context;
}
