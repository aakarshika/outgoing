import { Box, Grid, Typography } from '@mui/material';
import { useMemo } from 'react';

import { CheckInMemo } from '@/components/ui/CheckInMemo';
import { resolveCategorySlug } from '@/features/events/CategoricalBackground';

import { HeroNegativeStripGallery } from './HeroNegativeStripGallery';
import { HeroSideDetailsPanel } from './HeroSideDetailsPanel';
import { PosterForTheEventImageCollage } from './PosterForTheEventImageCollage';
import { TinyHostCard } from './TinyHostCard';

export const HeroSection = ({
  event,
  isHost,
  highlights = [],
  occurrences = [],
  displayNeedsCount = 0,
  displayNeeds = [],
}: {
  event: any;
  isHost: boolean;
  highlights?: any[];
  occurrences?: any[];
  displayNeedsCount?: number;
  displayNeeds?: any[];
}) => {
  const categorySlug = resolveCategorySlug(event.category);

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
      <Grid container spacing={0}>
        {/* Left Half - Important Details Section */}
        <Grid size={{ xs: 12, md: 5 }}>
          <Box sx={{ position: 'relative' }}>
            <Box
              sx={{
                display: 'flex',
                flexDirection: 'column',
                transition: 'all 0.4s ease',
              }}
            >
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
                    fontFamily: '"Permanent Marker"',
                    zIndex: 1,
                    color: 'inherit',
                    textShadow:
                      categorySlug === 'comedy' ? '2px 2px 0px #fbbf24' : 'none',
                    wordBreak: 'break-word',
                  }}
                >
                  {event.title}
                </Typography>
              </Box>
            </Box>

            {/* <WashiTape color="rgba(22, 163, 74, 0.3)" rotate="-2deg" /> */}
            {/* <Typography variant="h6" sx={{ fontFamily: '"Permanent Marker"', mb: 2 }}>
          The Details
        </Typography> */}
            <Typography sx={{ lineHeight: 1.8, whiteSpace: 'pre-wrap', mb: 4 }}>
              {event.description}
            </Typography>

            {/* Check-in Memo - Sibling to description */}
            {event.check_in_instructions && (event.user_has_ticket || isHost) && (
              <Box sx={{ mt: 4, mb: 4 }}>
                <CheckInMemo instructions={event.check_in_instructions} />
              </Box>
            )}
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
                categoryName={event.category.name}
                rating={event.average_rating ?? undefined}
                tag={
                  event.category?.name === 'Photography'
                    ? 'Photographer'
                    : 'Vibe Architect'
                }
                displayNeedsCount={displayNeedsCount}
                displayNeeds={displayNeeds}
                allChips={event.features}
              />
            </Box>
          </Box>
        </Grid>

        {/* Right Half - Event Image + Quick Details */}
        <Grid
          size={{ xs: 12, md: 7 }}
          sx={{
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'center',
          }}
        >
          <Box sx={{ width: '100%' }}>
            {event.cover_image ? (
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
                    WebkitMaskImage: "url('/assets/go-sym.png')",
                    maskImage: "url('/assets/go-sym.png')",
                    WebkitMaskRepeat: 'no-repeat',
                    maskRepeat: 'no-repeat',
                    WebkitMaskPosition: 'center',
                    maskPosition: 'center',
                    WebkitMaskSize: 'contain',
                    maskSize: 'contain',
                  }}
                />
                <Box
                  sx={{
                    width: '100%',
                    position: 'absolute',
                  }}
                >
                  {event.lifecycle_state === 'draft' ||
                  event.lifecycle_state === 'published' ? (
                    <Box sx={{ width: '100%' }}>
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
              </Box>
            ) : null}

            <HeroSideDetailsPanel event={event} />
          </Box>
        </Grid>
      </Grid>
    </>
  );
};
