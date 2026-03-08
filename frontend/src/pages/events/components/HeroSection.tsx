import { Box, Chip, Collapse, Grid, Paper, Typography } from '@mui/material';
import {
  Calendar,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Clock,
  MapPin,
  Navigation,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';

import { EventLocationMap } from '@/components/events/EventLocationMap';
import { HostCard } from '@/components/ui/HostCard';
import { Media } from '@/components/ui/media';
import { CATEGORY_THEMES } from '@/features/events/CategoricalBackground';

import { LIFECYCLE_LABELS, WashiTape } from './scrapbookHelpers';

// --- When & Where expandable card ---
const WhenWhereCard = ({ event }: { event: any }) => {
  const [expanded, setExpanded] = useState(false);
  const [distanceMiles, setDistanceMiles] = useState<number | null>(null);

  // Calculate days to go
  const daysToGo = useMemo(() => {
    const now = new Date();
    const target = new Date(event.start_time);
    const diff = target.getTime() - now.getTime();
    if (diff <= 0) return 0;
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  }, [event.start_time]);

  // Calculate distance using browser geolocation
  useEffect(() => {
    if (!event.latitude || !event.longitude) return;
    if (!navigator.geolocation) return;

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const R = 3958.8; // Earth radius in miles
        const dLat = ((event.latitude - pos.coords.latitude) * Math.PI) / 180;
        const dLon = ((event.longitude - pos.coords.longitude) * Math.PI) / 180;
        const a =
          Math.sin(dLat / 2) ** 2 +
          Math.cos((pos.coords.latitude * Math.PI) / 180) *
          Math.cos((event.latitude * Math.PI) / 180) *
          Math.sin(dLon / 2) ** 2;
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        setDistanceMiles(Math.round(R * c));
      },
      () => {
        /* silently ignore if user denies location */
      },
      { timeout: 5000 },
    );
  }, [event.latitude, event.longitude]);

  const isPast = new Date(event.start_time) < new Date();
  const recurrenceRule = event.series?.recurrence_rule;

  const formatRecurrence = (rule: string) => {
    if (!rule) return null;
    if (rule.includes('FREQ=WEEKLY')) {
      const days = rule.match(/BYDAY=([^;]+)/)?.[1];
      const dayMap: Record<string, string> = {
        MO: 'Mondays',
        TU: 'Tuesdays',
        WE: 'Wednesdays',
        TH: 'Thursdays',
        FR: 'Fridays',
        SA: 'Saturdays',
        SU: 'Sundays',
      };
      if (days) {
        const dayNames = days
          .split(',')
          .map((d) => dayMap[d] || d)
          .join(', ');
        return `Weekly on ${dayNames}`;
      }
      return 'Weekly';
    }
    if (rule.includes('FREQ=DAILY')) return 'Daily';
    if (rule.includes('FREQ=MONTHLY')) return 'Monthly';
    return 'Recurring';
  };

  // Build summary text
  const summaryParts: string[] = [];
  if (recurrenceRule) {
    const rText = formatRecurrence(recurrenceRule);
    if (rText) summaryParts.push(rText);
  }
  if (distanceMiles !== null) summaryParts.push(`${distanceMiles} miles away`);
  if (!isPast && daysToGo > 0)
    summaryParts.push(`${daysToGo} day${daysToGo !== 1 ? 's' : ''} to go`);
  else if (isPast) summaryParts.push('already happened');
  else summaryParts.push('happening today!');

  return (
    <Paper
      elevation={0}
      onClick={() => setExpanded(!expanded)}
      sx={{
        position: expanded ? 'absolute' : 'relative',
        top: 0,
        left: 0,
        width: expanded ? 'calc(100% - 24px)' : 'auto',
        zIndex: expanded ? 100 : 10,
        mb: expanded ? 0 : 3,
        px: 2,
        py: expanded ? 3 : 1, // More padding when expanded
        bgcolor: '#fff9e6', // Aged Paper
        border: '1.5px solid #e0d8c0',
        borderRadius: '4px', // Slightly sharper corners for paper feel
        cursor: 'pointer',
        transition: 'all 0.3s ease',
        transform: expanded
          ? 'rotate(0deg) translateX(12px)'
          : 'rotate(-0.5deg) translateX(12px)',
        boxShadow: expanded ? '4px 4px 15px rgba(0,0,0,0.15)' : 'none',
        '&:hover': {
          bgcolor: '#fffaf0',
          transform: expanded
            ? 'rotate(0deg) scale(1.01)  translateX(12px)'
            : 'rotate(0deg) scale(1.01)  translateX(12px)',
          boxShadow: expanded
            ? '4px 4px 15px rgba(0,0,0,0.2)'
            : '2px 2px 8px rgba(0,0,0,0.08)',
        },
        overflow: 'visible', // For WashiTape
      }}
    >
      {/* Collapsed summary */}
      <Box
        sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Navigation size={14} style={{ opacity: 0.6, color: '#2563eb' }} />
          <Typography
            sx={{
              fontFamily: '"Caveat", cursive',
              fontSize: '1.1rem',
              fontWeight: 'bold',
              color: 'text.secondary',
              letterSpacing: '0.5px',
            }}
          >
            {summaryParts.join(' · ')}
          </Typography>
        </Box>
        <ChevronDown
          size={16}
          style={{
            transition: 'transform 0.3s ease',
            transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)',
            opacity: 0.5,
          }}
        />
      </Box>

      {/* Expanded content */}
      <Collapse in={expanded}>
        <Box sx={{ mt: 3, mb: 1 }}>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3, mb: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Calendar size={16} style={{ color: '#ef4444' }} />
              <Box>
                <Typography
                  sx={{
                    fontFamily: '"Permanent Marker"',
                    fontSize: '0.65rem',
                    color: 'text.disabled',
                    lineHeight: 1,
                  }}
                >
                  DATE
                </Typography>
                <Typography
                  sx={{
                    fontFamily: '"Caveat"',
                    fontSize: '1.2rem',
                    fontWeight: 'bold',
                  }}
                >
                  {new Date(event.start_time).toLocaleDateString(undefined, {
                    weekday: 'long',
                    month: 'short',
                    day: 'numeric',
                  })}
                </Typography>
              </Box>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Clock size={16} style={{ color: '#f59e0b' }} />
              <Box>
                <Typography
                  sx={{
                    fontFamily: '"Permanent Marker"',
                    fontSize: '0.65rem',
                    color: 'text.disabled',
                    lineHeight: 1,
                  }}
                >
                  TIME
                </Typography>
                <Typography
                  sx={{
                    fontFamily: '"Caveat"',
                    fontSize: '1.2rem',
                    fontWeight: 'bold',
                  }}
                >
                  {new Date(event.start_time).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </Typography>
              </Box>
            </Box>
            {event.location_name && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <MapPin size={16} style={{ color: '#22c55e' }} />
                <Box>
                  <Typography
                    sx={{
                      fontFamily: '"Permanent Marker"',
                      fontSize: '0.65rem',
                      color: 'text.disabled',
                      lineHeight: 1,
                    }}
                  >
                    LOCATION
                  </Typography>
                  <Typography
                    sx={{
                      fontFamily: '"Caveat"',
                      fontSize: '1.2rem',
                      fontWeight: 'bold',
                    }}
                  >
                    {event.location_name}
                  </Typography>
                </Box>
              </Box>
            )}
          </Box>

          {/* Map - Polaroid style */}
          {event.location_name && (
            <Box
              onClick={(e) => e.stopPropagation()}
              sx={{
                p: 1,
                bgcolor: 'white',
                borderRadius: '2px',
                border: '1px solid #efefef',
                boxShadow: '0 4px 10px rgba(0,0,0,0.1)',
                transform: 'rotate(0.5deg)',
                overflow: 'hidden',
              }}
            >
              <Box sx={{ borderRadius: '2px', overflow: 'hidden' }}>
                <EventLocationMap
                  locationName={event.location_name}
                  locationAddress={event.location_address}
                  latitude={event.latitude}
                  longitude={event.longitude}
                />
              </Box>
            </Box>
          )}
          <Typography
            sx={{
              fontFamily: '"Caveat", cursive',
              fontSize: '0.85rem',
              color: 'text.disabled',
              textAlign: 'center',
              mt: 2,
            }}
          >
            tap to collapse map
          </Typography>
        </Box>
      </Collapse>
    </Paper>
  );
};

// --- Hero Auto-Rotating Gallery ---
const HeroAutoGallery = ({ images, title }: { images: string[]; title: string }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    if (images.length <= 1 || isHovered) return;

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % images.length);
    }, 3000);

    return () => clearInterval(interval);
  }, [images.length, isHovered]);

  const handlePrev = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  const handleNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentIndex((prev) => (prev + 1) % images.length);
  };

  if (!images.length) return null;

  return (
    <Box
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      sx={{
        width: '100%',
        minHeight: { xs: 300, md: 450 },
        height: '100%',
        position: 'relative',
        overflow: 'hidden',
        borderRadius: '12px',
        boxShadow: '0 10px 30px rgba(0,0,0,0.15)',
        '&:hover .gallery-nav': { opacity: 1 },
      }}
    >
      <Media
        src={images[currentIndex]}
        alt={`${title}-${currentIndex}`}
        style={{
          width: '100%',
          objectFit: 'fill',
          transition: 'all 0.6s cubic-bezier(0.4, 0, 0.2, 1)',
        }}
      />

      {/* Navigation Arrows */}
      {images.length > 1 && (
        <>
          <Box
            className="gallery-nav"
            onClick={handlePrev}
            sx={{
              position: 'absolute',
              left: 10,
              top: '50%',
              transform: 'translateY(-50%)',
              bgcolor: 'rgba(255,255,255,0.8)',
              backdropFilter: 'blur(4px)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 36,
              height: 36,
              borderRadius: '50%',
              opacity: 0,
              transition: 'all 0.2s',
              cursor: 'pointer',
              zIndex: 2,
              boxShadow: '0 4px 10px rgba(0,0,0,0.1)',
              '&:hover': {
                bgcolor: 'rgba(255,255,255,1)',
                transform: 'translateY(-50%) scale(1.1)',
              },
            }}
          >
            <ChevronLeft size={20} />
          </Box>
          <Box
            className="gallery-nav"
            onClick={handleNext}
            sx={{
              position: 'absolute',
              right: 10,
              top: '50%',
              transform: 'translateY(-50%)',
              bgcolor: 'rgba(255,255,255,0.8)',
              backdropFilter: 'blur(4px)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 36,
              height: 36,
              borderRadius: '50%',
              opacity: 0,
              transition: 'all 0.2s',
              cursor: 'pointer',
              zIndex: 2,
              boxShadow: '0 4px 10px rgba(0,0,0,0.1)',
              '&:hover': {
                bgcolor: 'rgba(255,255,255,1)',
                transform: 'translateY(-50%) scale(1.1)',
              },
            }}
          >
            <ChevronRight size={20} />
          </Box>
        </>
      )}

      {/* Indicator Dots */}
      {images.length > 1 && (
        <Box
          sx={{
            position: 'absolute',
            bottom: 16,
            left: '50%',
            transform: 'translateX(-50%)',
            display: 'flex',
            gap: 1,
            zIndex: 3,
            bgcolor: 'rgba(0,0,0,0.2)',
            backdropFilter: 'blur(4px)',
            px: 1.5,
            py: 0.8,
            borderRadius: '20px',
          }}
        >
          {images.map((_, idx) => (
            <Box
              key={idx}
              onClick={(e) => {
                e.stopPropagation();
                setCurrentIndex(idx);
              }}
              sx={{
                width: 6,
                height: 6,
                borderRadius: '50%',
                bgcolor: idx === currentIndex ? 'white' : 'rgba(255,255,255,0.4)',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                '&:hover': {
                  bgcolor: 'rgba(255,255,255,0.8)',
                  transform: 'scale(1.2)',
                },
              }}
            />
          ))}
        </Box>
      )}
    </Box>
  );
};

// --- Tiny Host Card with expand ---
const TinyHostCard = ({
  host,
  rating,
  tag,
  displayNeedsCount,
  onClick,
}: {
  host: any;
  rating?: number;
  tag: string;
  displayNeedsCount?: number;
  onClick?: () => void;
}) => {
  const [expanded, setExpanded] = useState(false);

  const handleContainerClick = () => {
    setExpanded(!expanded);
    onClick?.();
  };

  return (
    <Box
      onClick={handleContainerClick}
      sx={{
        cursor: 'pointer',
        transition: 'all 0.3s ease',
        transform: expanded ? 'rotate(0deg)' : 'rotate(-1deg)',
      }}
    >
      <Paper
        elevation={0}
        onClick={() => {
          window.location.hash = 'services';
          window.dispatchEvent(new CustomEvent('section-scroll', { detail: 'services' }));
        }}
        sx={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 1.5,
          px: 2,
          py: 1,
          bgcolor: 'transparent',
          '&:hover': {
            transform: 'scale(1.03)',
          },
        }}
      >
        <Box
          sx={{
            width: 28,
            height: 28,
            borderRadius: '50%',
            overflow: 'hidden',
            bgcolor: '#eee',
            flexShrink: 0,
          }}
        >
          <Media
            src={host.avatar || undefined}
            alt={host.username}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
        </Box>
        <Typography
          sx={{
            fontFamily: '"Caveat", cursive',
            fontSize: '0.95rem',
            fontWeight: 'bold',
            color: 'text.secondary',
          }}
        >
          planned by <span style={{ fontWeight: 'bolder' }}>@{host.username}</span>
          {!!displayNeedsCount && displayNeedsCount > 0 && ` and ${displayNeedsCount} others..`}
        </Typography>
      </Paper>
    </Box>
  );
};

export const HeroSection = ({
  event,
  isAuthenticated,
  navigate,
  toggleInterest,
  highlights = [],
  occurrences = [],
  displayNeedsCount = 0,
}: {
  event: any;
  isAuthenticated: boolean;
  navigate: any;
  toggleInterest: any;
  highlights?: any[];
  occurrences?: any[];
  displayNeedsCount?: number;
}) => {
  // Unique list of all images for the gallery
  const galleryImages = useMemo(() => {
    const imageSet = new Set<string>();

    // 1. Current event's cover image
    if (event.cover_image) imageSet.add(event.cover_image);

    // 2. Other occurrences' cover images (series-wide synchronization)
    occurrences.forEach((occ: any) => {
      if (occ.cover_image) imageSet.add(occ.cover_image);
    });

    // 3. Gallery Media (Backend already aggregated these series-wide)
    (event.media || []).forEach((m: any) => {
      if (m.file) imageSet.add(m.file);
    });

    // 4. Highlights (Backend already aggregated these series-wide)
    (highlights || []).forEach((h: any) => {
      if (h.media_file) imageSet.add(h.media_file);
    });

    return Array.from(imageSet);
  }, [event.cover_image, event.media, highlights, occurrences]);

  return (
    <>
      <Grid container spacing={0} sx={{ mb: 8 }}>
        {/* Left Half - Important Details Section */}
        <Grid size={{ xs: 12, md: 5 }}>
          <Box sx={{ position: 'relative' }}>
            <Box
              sx={{
                position: 'relative',
                display: 'flex',
                flexDirection: 'column',
                transition: 'all 0.4s ease',
              }}
            >
              <WashiTape
                color={
                  CATEGORY_THEMES[event.category?.slug || '']?.tape ||
                  'rgba(37, 99, 235, 0.4)'
                }
                rotate={event.category?.slug === 'comedy' ? '10deg' : '3deg'}
              />

              {/* Category Tag - small */}
              <Box
                sx={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: 1,
                  mb: 2,
                  position: 'relative',
                  zIndex: 1,
                }}
              >
                {event.category && (
                  <Chip
                    label={event.category.name}
                    size="small"
                    sx={{
                      bgcolor: 'primary.main',
                      color: 'white',
                      fontFamily: '"Permanent Marker"',
                    }}
                  />
                )}
                <Chip
                  label={LIFECYCLE_LABELS[event.lifecycle_state]}
                  size="small"
                  variant={event.lifecycle_state === 'live' ? 'filled' : 'outlined'}
                  sx={{
                    fontWeight: 'bold',
                    fontFamily: '"Permanent Marker"',
                    bgcolor:
                      event.lifecycle_state === 'live' ? 'success.main' : 'transparent',
                    color:
                      event.lifecycle_state === 'live'
                        ? 'white'
                        : event.category?.icon === 'cpu'
                          ? '#fff'
                          : 'inherit',
                    borderColor: event.category?.icon === 'cpu' ? '#fff' : 'inherit',
                    boxShadow:
                      event.lifecycle_state === 'live'
                        ? '0 0 15px rgba(34, 197, 94, 0.5)'
                        : 'none',
                  }}
                />
              </Box>

              {/* When and Where Card - wrapped in relative box to allow overlapping expansion */}
              <Box sx={{ position: 'relative', height: '40px', mb: 3 }}>
                <WhenWhereCard event={event} />
              </Box>

              {/* Event Name */}
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: 2,
                  mb: 2,
                }}
              >
                <Typography
                  variant="h1"
                  sx={{
                    fontSize: { xs: '2.5rem', md: '4rem' },
                    position: 'relative',
                    zIndex: 1,
                    color: 'inherit',
                    textShadow:
                      event.category?.slug === 'comedy'
                        ? '2px 2px 0px #fbbf24'
                        : 'none',
                    wordBreak: 'break-word',
                  }}
                >
                  {event.title}
                </Typography>
              </Box>
            </Box>

            {/* Host Card - bottom right overlapped area */}
            <Box
              sx={{
                position: 'absolute',
                bottom: -40,
                right: { xs: 0, md: -20 },
                zIndex: 10,
                display: { xs: 'none', sm: 'block' },
              }}
            >
              <TinyHostCard
                host={event.host}
                rating={event.average_rating ?? undefined}
                tag={
                  event.category?.name === 'Photography'
                    ? 'Photographer'
                    : 'Vibe Architect'
                }
                displayNeedsCount={displayNeedsCount}
              />
            </Box>
          </Box>

          {/* Save the Date stamp */}
          {['published', 'at_risk', 'event_ready'].includes(event.lifecycle_state) &&
            event.category?.icon !== 'cpu' && (
              <Box
                component="button"
                onClick={() => {
                  if (!isAuthenticated) {
                    navigate('/signin');
                    return;
                  }
                  toggleInterest.mutate({
                    eventId: event.id,
                    isInterested: !event.user_is_interested,
                  });
                }}
                sx={{
                  width: 80,
                  height: 80,
                  border: '3px solid rgba(239, 68, 68, 0.6)',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transform: 'rotate(-15deg)',
                  mt: 2,
                  cursor: 'pointer',
                  bgcolor: event.user_is_interested
                    ? 'rgba(239, 68, 68, 0.15)'
                    : 'transparent',
                  transition: 'all 0.2s',
                  '&:hover': {
                    transform: 'rotate(-10deg) scale(1.05)',
                    bgcolor: 'rgba(239, 68, 68, 0.1)',
                  },
                }}
              >
                <Typography
                  sx={{
                    color: 'rgba(239, 68, 68, 0.6)',
                    fontFamily: '"Permanent Marker"',
                    fontSize: '0.7rem',
                    textAlign: 'center',
                    lineHeight: 1,
                  }}
                >
                  {event.user_is_interested ? (
                    <>
                      SAVED
                      <br />
                      DATE
                    </>
                  ) : (
                    <>
                      SAVE THE
                      <br />
                      DATE
                      <br />
                    </>
                  )}
                </Typography>
              </Box>
            )}
        </Grid>

        {/* Right Half - Event Image Section */}
        <Grid
          size={{ xs: 12, md: 7 }}
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            position: 'relative',
          }}
        >
          {galleryImages.length === 0 ? (
            <Box
              sx={{
                width: '100%',
                minHeight: { xs: 300, md: 450 },
                padding: { xs: 6, md: 12 },
                display: 'flex',
              }}
            >
              <Box
                sx={{
                  flex: 1,
                  bgcolor: 'black',
                  opacity: 0.14,
                  WebkitMaskImage: "url('/assets/go-symbol.png')",
                  maskImage: "url('/assets/go-symbol.png')",
                  WebkitMaskRepeat: 'no-repeat',
                  maskRepeat: 'no-repeat',
                  WebkitMaskPosition: 'center',
                  maskPosition: 'center',
                  WebkitMaskSize: 'contain',
                  maskSize: 'contain',
                }}
              />
            </Box>
          ) : (
            <Box sx={{ width: '100%' }}>
              <HeroAutoGallery images={galleryImages} title={event.title} />
            </Box>
          )}
        </Grid>
      </Grid>

      {/* Mobile Host details */}
      <Box sx={{ display: { xs: 'block', sm: 'none' }, mb: 4, textAlign: 'center' }}>
        <TinyHostCard
          host={event.host}
          rating={event.average_rating ?? undefined}
          tag={
            event.category?.name === 'Photography' ? 'Photographer' : 'Vibe Architect'
          }
          displayNeedsCount={displayNeedsCount}
        />
      </Box>
    </>
  );
};
