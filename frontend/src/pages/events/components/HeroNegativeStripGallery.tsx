import { Box, Chip, Collapse, Grid, Paper, Typography } from '@mui/material';
import { Calendar, ChevronDown, Clock, MapPin, Navigation } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';

import { EventLocationMap } from '@/components/events/EventLocationMap';
import { HostCard } from '@/components/ui/HostCard';
import { Media } from '@/components/ui/media';
import { CATEGORY_THEMES } from '@/features/events/CategoricalBackground';

import { LIFECYCLE_LABELS, WashiTape } from './scrapbookHelpers';

// --- Hero Photo Negative Strip Gallery ---
export const HeroNegativeStripGallery = ({
  images,
  title,
  host,
  categorySlug,
}: {
  images: string[];
  title: string;
  host: any;
  categorySlug?: string;
}) => {
  // We double/triple the images for infinite scrolling effect
  const extendedImages = useMemo(() => {
    if (images.length === 0) return [];
    // Repeat enough to ensure smooth continuous loop
    return [...images, ...images, ...images, ...images];
  }, [images]);

  if (!images.length) return null;

  return (
    <Box
      sx={{
        transform: 'scale(1.15)',
        width: '100%',
        height: { xs: 300, md: 350 },
        position: 'relative',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
      }}
    >
      {/* The Moving Strip */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 4,
          px: 6,
          py: 3,
          border: `1px solid ${categorySlug ? CATEGORY_THEMES[categorySlug]?.accent : '#e1780898'}`,
          borderRadius: '2px',
          width: 'max-content',
          bgcolor: categorySlug ? CATEGORY_THEMES[categorySlug]?.tape : '#e1780898', // category color dynamic
          // Truly transparent sprocket holes using Mask
          WebkitMaskImage: `
            radial-gradient(circle at 16px 14px, transparent 7px, black 7.5px),
            radial-gradient(circle at 16px calc(100% - 14px), transparent 7px, black 7.5px)
          `,
          WebkitMaskSize: '32px 100%',
          WebkitMaskRepeat: 'repeat-x',
          WebkitMaskComposite: 'source-in',
          maskComposite: 'intersect',
          animation: 'scrollStrip 90s linear infinite',
          '@keyframes scrollStrip': {
            '0%': { transform: 'translateX(0)' },
            '100%': { transform: `translateX(calc(-50%))` }, // Adjust based on doubling/tripling
          },
        }}
      >
        {extendedImages.map((src, idx) => (
          <Box
            key={`${idx}-${src}`}
            sx={{
              position: 'relative',
              flexShrink: 0,
              width: { xs: 200, md: 320 },
              height: { xs: 180, md: 300 },
              overflow: 'hidden',
              transition: 'all 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
              transform: 'scale(0.95)',
              '&:hover': {
                transform: 'scale(1.005) rotate(1deg)',
              },
            }}
          >
            <Media
              src={src}
              alt={`${title}-${idx}`}
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
              }}
            />
            {/* Frame labels - typical of film negatives */}
            <Typography
              sx={{
                position: 'absolute',
                bottom: 4,
                right: 8,
                color: 'rgba(255,255,255,0.8)',
                fontFamily: 'monospace',
                fontSize: '0.8rem',
                letterSpacing: '2px',
              }}
            >
              @{host.username}- 07.11.2026
            </Typography>
          </Box>
        ))}
      </Box>
    </Box>
  );
};
