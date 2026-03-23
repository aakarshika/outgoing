import { Box, Typography } from '@mui/material';

import { BedroomHeroCarousel } from '@/features/events/BedroomHeroCarousel';

// --- Hero Section ---
export const HeroSection = () => (
  <section className="pt-6 pb-2">
    <Box sx={{ textAlign: 'right', px: { xs: 2, sm: 4, lg: 8 } }}>
      <Typography
        sx={{
          fontFamily: '"Magnolia", "Great Vibes", cursive',
          fontSize: { xs: '3.5rem', md: '5.5rem' },
          color: '#eabe72ff',
        }}
      >
        Start here,
        <Box
          component="span"
          sx={{
            display: 'inline-block',
            width: '1.3em',
            height: '1.3em',
            backgroundColor: '#eabe72', // use the explicit hex color rather than currentColor to be safe
            maskImage: "url('/assets/go-sym.png')",
            maskSize: 'contain',
            maskRepeat: 'no-repeat',
            maskPosition: 'center',
            WebkitMaskImage: "url('/assets/go-sym.png')",
            WebkitMaskSize: 'contain',
            WebkitMaskRepeat: 'no-repeat',
            WebkitMaskPosition: 'center',
            verticalAlign: '-0.44em', // Adjusted to align perfectly with the cursive font height
            // margin: '0 0.15em', // Adds breathing room between the words and the logo
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
    <Box sx={{ transform: 'scale(1)', transformOrigin: 'top center' }}>
      <BedroomHeroCarousel />
    </Box>
  </section>
);
