import { Box, Stack, Typography } from '@mui/material';
import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useState } from 'react';

/** Copy aligned with GuestLandingPage “how it works” and discovery storylines. */
const EMPTY_UPCOMING_SLIDES = [
  {
    icon: '🔍',
    title: 'Discover what’s actually happening',
    body: 'Browse hyper-local and online events built around your interests — from underground nights to niche hobby meetups you didn’t know existed.',
  },
  {
    icon: '🎉',
    title: 'Go further than “just attending”',
    body: 'Grab a ticket or claim a contributor role — bring supplies, run the music, cater the food — and earn discounts or get paid.',
  },
  {
    icon: '👥',
    title: 'Find your people, one event at a time',
    body: 'Follow groups, meet regulars, and go from stranger to the person everyone’s glad showed up. Communities here grow one RSVP at a time.',
  },
  {
    icon: '💡',
    title: 'Start something small, watch it grow',
    body: 'Got an idea? Post it, set what you need, and let your community help you pull it off. No perfect venue or budget required — just a spark.',
  },
  {
    icon: '⚡',
    title: 'Filters that keep your feed sharp',
    body: 'Dial in this weekend, tonight, free, online, outdoors — tune the city’s calendar until it feels like it was made for you.',
  },
  {
    icon: '🗺️',
    title: 'Your city, your categories',
    body: 'Outdoors, music, food, arts, tech, wellness — explore the slices of life you care about and skip the noise.',
  },
  {
    icon: '🤝',
    title: 'Chip in where you’re needed',
    body: 'Hosts list real needs; you can step in with skills, gear, or time — and make something happen that wouldn’t exist without you.',
  },
  {
    icon: '🌐',
    title: 'Network that starts in the room',
    body: 'Connect with hosts, vendors, and friends you actually meet at events — not endless feeds of strangers.',
  },
  {
    icon: '✨',
    title: 'Your first yes starts here',
    body: 'Save a spot, buy a ticket, or raise your hand to help — when you’re ready, your upcoming events will show up right in this space.',
  },
] as const;

const ROTATE_MS = 5200;

export function MyHomeEmptyUpcomingCarousel() {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (paused) return undefined;
    const id = window.setInterval(() => {
      setIndex((i) => (i + 1) % EMPTY_UPCOMING_SLIDES.length);
    }, ROTATE_MS);
    return () => window.clearInterval(id);
  }, [paused]);

  const slide = EMPTY_UPCOMING_SLIDES[index];

  return (
    <Box
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      sx={{
        mt: 2.5,
        maxWidth: 640,
        borderRadius: '20px',
        border: '1px solid rgba(143, 105, 66, 0.14)',
        background:
          'linear-gradient(135deg, rgba(255,255,255,0.72) 0%, rgba(250,238,218,0.35) 100%)',
        px: { xs: 2, sm: 2.5 },
        py: { xs: 2, sm: 2.25 },
        backdropFilter: 'blur(10px)',
      }}
    >
      <Box
        sx={{
          position: 'relative',
          overflow: 'hidden',
          minHeight: { xs: 118, sm: 102 },
        }}
      >
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={index}
            initial={{ opacity: 0, x: 44, filter: 'blur(4px)' }}
            animate={{ opacity: 1, x: 0, filter: 'blur(0px)' }}
            exit={{ opacity: 0, x: -44, filter: 'blur(4px)' }}
            transition={{ duration: 0.48, ease: [0.22, 1, 0.36, 1] }}
            style={{ width: '100%' }}
          >
            <Stack spacing={1}>
              <Stack direction="row" alignItems="center" spacing={1.25}>
                <Typography
                  component="span"
                  sx={{ fontSize: 22, lineHeight: 1 }}
                  aria-hidden
                >
                  {slide.icon}
                </Typography>
                <Typography
                  sx={{
                    fontFamily: 'Syne, sans-serif',
                    fontWeight: 800,
                    fontSize: { xs: 17, sm: 18 },
                    letterSpacing: '-0.03em',
                    color: '#2B2118',
                    lineHeight: 1.25,
                  }}
                >
                  {slide.title}
                </Typography>
              </Stack>
              <Typography
                sx={{
                  fontSize: 14,
                  lineHeight: 1.65,
                  color: 'rgba(66, 50, 28, 0.78)',
                  pl: { xs: 0, sm: 0.25 },
                }}
              >
                {slide.body}
              </Typography>
            </Stack>
          </motion.div>
        </AnimatePresence>
      </Box>

      <Stack direction="row" spacing={0.75} sx={{ mt: 1.75, justifyContent: 'center' }}>
        {EMPTY_UPCOMING_SLIDES.map((dotSlide, i) => (
          <Box
            key={dotSlide.title}
            component="button"
            type="button"
            aria-label={`Tip ${i + 1} of ${EMPTY_UPCOMING_SLIDES.length}`}
            aria-current={i === index ? 'true' : undefined}
            onClick={() => setIndex(i)}
            sx={{
              width: i === index ? 22 : 7,
              height: 7,
              borderRadius: '999px',
              border: 'none',
              p: 0,
              cursor: 'pointer',
              bgcolor:
                i === index ? 'rgba(216, 90, 48, 0.95)' : 'rgba(143, 105, 66, 0.22)',
              transition: 'width 0.35s ease, background-color 0.25s ease',
              '&:focus-visible': {
                outline: '2px solid rgba(216, 90, 48, 0.55)',
                outlineOffset: 2,
              },
            }}
          />
        ))}
      </Stack>
    </Box>
  );
}
