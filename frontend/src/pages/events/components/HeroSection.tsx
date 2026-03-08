import { Box, Chip, Collapse, Grid, Paper, Typography } from '@mui/material';
import { useEffect, useMemo, useState } from 'react';

import { CATEGORY_THEMES } from '@/features/events/CategoricalBackground';

import { WashiTape } from './scrapbookHelpers';
import { HeroNegativeStripGallery } from './HeroNegativeStripGallery';
import { TinyHostCard } from './TinyHostCard';
import { WhenWhereCard } from './WhenWhereCard';
import { EventLifecycleState } from '@/types/events';
import { PosterForTheEventImageCollage } from './PosterForTheEventImageCollage';



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
                    fontSize: { xs: '2.0rem', md: '3rem' },
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

            {/* When and Where Card - wrapped in relative box to allow overlapping expansion */}
            <Box sx={{ position: 'relative', height: '40px', mb: 3 }}>
              <WhenWhereCard event={event} />
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
            alignItems: 'flex-start',
            justifyContent: 'center',
            position: 'relative',
          }}
        >
          <Box
            sx={{
              width: '100%',
              minHeight: { xs: 300, md: 450 },
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              position: 'relative',
            }}
          >
            <Box
              sx={{
                width: '100%',
                height: { xs: 200, md: 200 },
                position: 'absolute',
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
          <Box sx={{
            width: '100%',
            position: 'absolute',

          }}>

            {event.lifecycle_state === 'draft' || event.lifecycle_state === 'published' ? (
              <Box
                sx={{
                  width: '100%'
                }}
              >
                <PosterForTheEventImageCollage
                  imageUrl={event.cover_image}
                  title={event.title}
                />
              </Box>
            ) : (
              <Box sx={{ width: '100%' }}>
                <HeroNegativeStripGallery
                  images={galleryImages}
                  title={event.title}
                  host={event.host}
                  categorySlug={event.category?.slug}
                />
              </Box>
            )}
          </Box>
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
