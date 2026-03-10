import { Box, Typography } from '@mui/material';
import { Calendar, Heart, MapPin } from 'lucide-react';
import { useMemo } from 'react';
import { Link } from 'react-router-dom';

import { Media } from '@/components/ui/media';
import { useAuth } from '@/features/auth/hooks';

import { CategoricalBackground, CATEGORY_THEMES } from './CategoricalBackground';
import { useToggleInterest } from './hooks';

interface EventListItem {
  id: number;
  title: string;
  cover_image: string | null;
  start_time: string;
  location_name: string;
  category?: { name: string; icon: string };
  ticket_price_standard: string | null;
  ticket_price_flexible: string | null;
  lifecycle_state: string;
  user_is_interested?: boolean;
}

const WashiTape = ({ color = 'rgba(59, 130, 246, 0.5)', rotate = '0deg' }) => (
  <Box
    sx={{
      position: 'absolute',
      top: -10,
      left: '50%',
      transform: `translateX(-50%) rotate(${rotate})`,
      width: 60,
      height: 18,
      bgcolor: color,
      opacity: 0.8,
      zIndex: 2,
      boxShadow: '0 1px 2px rgba(0,0,0,0.1)',
      '&::before, &::after': {
        content: '""',
        position: 'absolute',
        top: 0,
        bottom: 0,
        width: 4,
        backgroundImage: `linear-gradient(to right, ${color} 50%, transparent 50%)`,
        backgroundSize: '2px 4px',
      },
      '&::before': { left: -2 },
      '&::after': { right: -2 },
    }}
  />
);

export const ScrapbookEventCard = ({ event }: { event: EventListItem }) => {
  const rotation = useMemo(() => (Math.random() * 4 - 2).toFixed(1), []);
  const { isAuthenticated } = useAuth();
  const toggleInterest = useToggleInterest();

  const handleInterestClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isAuthenticated) return;
    toggleInterest.mutate({
      eventId: event.id,
      isInterested: event.user_is_interested || false,
    });
  };

  const theme = CATEGORY_THEMES[
    event.category?.name?.toLowerCase().replace(/\s+/g, '-') || ''
  ] || {
    tape: 'rgba(59, 130, 246, 0.4)',
  };
  const tapeColor = theme.tape;

  const date = new Date(event.start_time).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });
  const price = event.ticket_price_standard
    ? `$${parseFloat(event.ticket_price_standard).toFixed(0)}`
    : 'Free';

  return (
    <Box
      component={Link}
      to={`/events/${event.id}`}
      sx={{
        display: 'block',
        textDecoration: 'none',
        position: 'relative',
        transition: 'transform 0.3s ease, box-shadow 0.3s ease',
        '&:hover': {
          transform: `rotate(${rotation}deg) scale(1.02) translateY(-5px)`,
          zIndex: 10,
          '& .polaroid-img': { transform: 'scale(1.05)' },
        },
      }}
    >
      <WashiTape color={tapeColor} rotate={`${Math.random() * 10 - 5}deg`} />

      <CategoricalBackground
        category={event.category}
        showDecoration={false}
        sx={{
          bgcolor: '#fff',
          p: '12px 12px 40px 12px',
          boxShadow: '0 10px 25px rgba(0,0,0,0.1), 0 5px 10px rgba(0,0,0,0.05)',
          border: '1px solid #e5e7eb',
          transform: `rotate(${rotation}deg)`,
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Main Polaroid Image */}
        <Box
          sx={{
            aspectRatio: '1 / 1',
            bgcolor: '#eee',
            overflow: 'hidden',
            mb: 2,
            border: '1px solid rgba(0,0,0,0.05)',
            position: 'relative',
          }}
        >
          {event.cover_image ? (
            <Media
              src={event.cover_image}
              alt={event.title}
              className="polaroid-img"
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                transition: 'transform 0.5s ease',
              }}
            />
          ) : (
            <Box
              sx={{
                width: '100%',
                height: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#ccc',
              }}
            >
              <Calendar size={48} />
            </Box>
          )}

          {/* Interest Heart */}
          <button
            onClick={handleInterestClick}
            className="absolute top-2 left-2 rounded-full bg-white/80 backdrop-blur-sm p-1.5 transition-all hover:bg-white hover:scale-110 shadow-sm z-10"
            aria-label={
              event.user_is_interested ? 'Remove interest' : 'Mark interested'
            }
          >
            <Heart
              size={16}
              className={`transition-colors ${
                event.user_is_interested ? 'fill-red-500 text-red-500' : 'text-gray-500'
              }`}
            />
          </button>

          {/* Category "Sticker" */}
          {event.category && (
            <Box
              sx={{
                position: 'absolute',
                top: 10,
                right: 10,
                bgcolor: '#fff',
                color: '#1a1a1a',
                p: '4px 8px',
                borderRadius: '2px',
                boxShadow: '2px 2px 5px rgba(0,0,0,0.15)',
                transform: 'rotate(5deg)',
                zIndex: 2,
                border: '1px dashed #ccc',
              }}
            >
              <Typography
                sx={{
                  fontSize: '0.65rem',
                  fontWeight: 'bold',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                }}
              >
                {event.category.name}
              </Typography>
            </Box>
          )}

          {/* LIVE indicator as a badge or stamp */}
          {event.lifecycle_state === 'live' && (
            <Box
              sx={{
                position: 'absolute',
                bottom: 10,
                left: 10,
                bgcolor: '#ef4444',
                color: '#fff',
                p: '2px 8px',
                borderRadius: '4px',
                fontFamily: '"Permanent Marker"',
                fontSize: '0.8rem',
                transform: 'rotate(-5deg)',
                zIndex: 2,
                animation: 'pulse 2s infinite',
              }}
            >
              LIVE!
            </Box>
          )}
        </Box>

        {/* Event Details */}
        <Box sx={{ px: 0.5 }}>
          <Typography
            sx={{
              fontFamily: '"Permanent Marker"',
              fontSize: '1.1rem',
              color: '#1a1a1a',
              lineHeight: 1.2,
              mb: 1,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {event.title}
          </Typography>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
            <Calendar size={12} color="#666" />
            <Typography
              sx={{ fontSize: '0.75rem', color: '#666', fontFamily: 'serif' }}
            >
              {date}
            </Typography>
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <MapPin size={12} color="#666" />
            <Typography
              sx={{
                fontSize: '0.75rem',
                color: '#666',
                fontFamily: 'serif',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {event.location_name}
            </Typography>
          </Box>
        </Box>

        {/* Bottom stickers based on status */}
        {event.lifecycle_state === 'event_ready' && (
          <Box
            sx={{
              position: 'absolute',
              bottom: 15,
              right: -10,
              bgcolor: '#10b981',
              color: '#fff',
              p: '4px 15px 4px 10px',
              transform: 'rotate(-5deg)',
              boxShadow: '2px 2px 5px rgba(0,0,0,0.1)',
              zIndex: 2,
              '&::before': {
                content: '""',
                position: 'absolute',
                left: -5,
                top: '50%',
                transform: 'translateY(-50%)',
                width: 10,
                height: 10,
                bgcolor: 'inherit',
                borderRadius: '50%',
              },
            }}
          >
            <Typography sx={{ fontSize: '0.65rem', fontWeight: 'bold' }}>
              FULL HOUSE!
            </Typography>
          </Box>
        )}

        {(event.lifecycle_state === 'published' ||
          event.lifecycle_state === 'live') && (
          <Box
            sx={{
              position: 'absolute',
              bottom: 15,
              right: -10,
              bgcolor: '#fbbf24',
              color: '#000',
              p: '4px 15px 4px 10px',
              transform: 'rotate(-10deg)',
              boxShadow: '2px 2px 5px rgba(0,0,0,0.1)',
              zIndex: 2,
              '&::before': {
                content: '""',
                position: 'absolute',
                left: -5,
                top: '50%',
                transform: 'translateY(-50%)',
                width: 10,
                height: 10,
                bgcolor: 'inherit',
                borderRadius: '50%',
                borderRight: '1px solid rgba(0,0,0,0.1)',
              },
            }}
          >
            <Typography sx={{ fontSize: '0.7rem', fontWeight: 'bold' }}>
              {price}
            </Typography>
          </Box>
        )}

        {event.lifecycle_state === 'completed' && (
          <Box
            sx={{
              position: 'absolute',
              bottom: 15,
              right: -10,
              bgcolor: '#fff',
              color: '#ec4899',
              p: '4px 15px 4px 10px',
              transform: 'rotate(-15deg)',
              boxShadow: '2px 2px 8px rgba(0,0,0,0.15)',
              border: '2px solid #ec4899',
              borderRadius: '2px',
              zIndex: 2,
            }}
          >
            <Typography
              sx={{
                fontSize: '0.65rem',
                fontWeight: '900',
                textTransform: 'uppercase',
              }}
            >
              ⭐ 4.9 RATED
            </Typography>
          </Box>
        )}

        {/* Pencil mark/sketch detail */}
        <Box
          sx={{
            position: 'absolute',
            bottom: 8,
            left: '20%',
            width: '30%',
            height: 2,
            bgcolor: 'rgba(0,0,0,0.05)',
            borderRadius: '1px',
            transform: 'rotate(-1deg)',
          }}
        />
      </CategoricalBackground>
    </Box>
  );
};
