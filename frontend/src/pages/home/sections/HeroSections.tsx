import { Box, Typography } from '@mui/material';

import { BedroomHeroCarousel } from '@/features/events/BedroomHeroCarousel';

// --- Hero Section ---
export const HeroSection = () => (
  <section className="pt-6 pb-2">
    <Box sx={{ textAlign: 'center', mb: 1, px: { xs: 2, sm: 4, lg: 8 } }}>
      <Typography
        sx={{
          fontFamily: '"Magnolia", "Great Vibes", cursive',
          fontSize: { xs: '3.5rem', md: '5.5rem' },
          color: '#eabe72ff',
          lineHeight: 1,
        }}
      >
        Start here,
        <Box
          component="span"
          sx={{
            display: 'inline-block',
            fontWeight: 'bold',
            width: '1.4em',
            height: '1.4em',
            backgroundColor: 'currentColor',
            maskImage: 'url(/assets/go-symbol.png)',
            maskSize: 'contain',
            maskRepeat: 'no-repeat',
            maskPosition: 'center',
            WebkitMaskImage: 'url(/assets/go-symbol.png)',
            WebkitMaskSize: 'contain',
            WebkitMaskRepeat: 'no-repeat',
            WebkitMaskPosition: 'center',
            verticalAlign: 'middle',
          }}
        />
        places..
      </Typography>
      <Typography
        variant="h6"
        sx={{ fontFamily: '"Caveat", cursive', color: '#888', mt: 0.5 }}
      >
        Discover local events, host your own, or hire event talent.
      </Typography>
    </Box>
  </section>
);

// --- Featured Carousel ---
export const FeaturedCarouselSection = () => (
  <section>
    <Box
      sx={{
        mt: 3,
        mb: 0.5,
        px: { xs: 2, sm: 4, lg: 8 },
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'baseline',
      }}
    >
      <Typography
        variant="h5"
        sx={{ fontFamily: '"Permanent Marker"', color: '#1a1a1a' }}
      >
        Featured Events
      </Typography>
    </Box>
    <Box sx={{ transform: 'scale(0.82)', transformOrigin: 'top center', mt: -4 }}>
      <BedroomHeroCarousel />
    </Box>
  </section>
);
