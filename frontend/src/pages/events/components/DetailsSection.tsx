import { Box, Chip, Paper, Typography } from '@mui/material';

import { CheckInMemo } from '@/components/ui/CheckInMemo';

import { WashiTape } from './scrapbookHelpers';

export const DetailsSection = ({ event, isHost }: { event: any; isHost: boolean }) => {
  const TAG_DISPLAY: Record<
    string,
    {
      label: string;
      emoji: string;
      bg: string;
      border: string;
      text: string;
      chipBg: string;
    }
  > = {
    featured: {
      label: 'Featured',
      emoji: '⭐',
      bg: '#fef3c7',
      border: '#f59e0b',
      text: '#92400e',
      chipBg: '#fef9c3',
    },
    additional: {
      label: 'Additional',
      emoji: '➕',
      bg: '#dbeafe',
      border: '#3b82f6',
      text: '#1e40af',
      chipBg: '#eff6ff',
    },
    extra: {
      label: 'Extra',
      emoji: '🎁',
      bg: '#d1fae5',
      border: '#10b981',
      text: '#065f46',
      chipBg: '#ecfdf5',
    },
  };
  const FEATURE_EMOJI_MAP: Record<string, string> = {
    Food: '🍕',
    'Non-Alcoholic Drinks': '🧃',
    'Alcoholic Drinks': '🍷',
    Music: '🎵',
    DJ: '🎧',
    'Live Band': '🎸',
    Games: '🎮',
    'Photo Booth': '📸',
    'Surprise Gifts': '🎁',
    'Educational Activities': '📚',
    'Group Activities': '👥',
    Networking: '🤝',
    'Dance Floor': '💃',
    Workshops: '🔧',
    Art: '🎨',
    Karaoke: '🎤',
    Bonfire: '🔥',
    Fireworks: '🎆',
    Pool: '🏊',
    'Outdoor Seating': '⛱️',
    'Indoor Seating': '🪑',
    Decorations: '🎀',
    'Themed Costumes': '🎭',
    Raffle: '🎟️',
    Trivia: '🧠',
    'Kids Zone': '🧒',
    'Pet-Friendly': '🐾',
    'Open Bar': '🍹',
    'VIP Lounge': '✨',
    Parking: '🅿️',
  };
  const features = event.features || [];
  const grouped: Record<string, { name: string; tag: string }[]> = {};
  features.forEach((f: { name: string; tag: string }) => {
    if (!grouped[f.tag]) grouped[f.tag] = [];
    grouped[f.tag].push(f);
  });
  const tagOrder = ['featured', 'additional', 'extra'];

  const allChips = tagOrder.flatMap((tag) => {
    const items = grouped[tag];
    if (!items || items.length === 0) return [];
    const cfg = TAG_DISPLAY[tag];
    return items.map((f: { name: string; tag: string }, idx: number) => ({
      ...f,
      cfg,
      idx,
    }));
  });

  return (
    <Box sx={{ spaceY: 6 }}>
      {/* ═══ Tablets Section — Event Features ═══ */}
      <Box
        sx={{ mb: 3, display: 'flex', flexWrap: 'wrap', gap: 1, alignItems: 'center' }}
      >
        {allChips.length === 0 ? (
          <Typography
            variant="body2"
            sx={{
              fontFamily: '"Caveat", cursive',
              fontSize: '1.1rem',
              color: 'text.disabled',
              fontStyle: 'italic',
            }}
          >
            No features listed yet — stay tuned! ✨
          </Typography>
        ) : (
          allChips.map(({ name, cfg, idx }) => (
            <Chip
              key={name}
              label={`${FEATURE_EMOJI_MAP[name] || '🏷️'} ${name}`}
              sx={{
                bgcolor: cfg.chipBg,
                border: `1.5px solid ${cfg.border}`,
                color: cfg.text,
                fontWeight: 600,
                fontSize: '0.8rem',
                height: 'auto',
                py: 0.5,
                transform: `rotate(${idx % 2 === 0 ? -0.5 : 0.5}deg)`,
                transition: 'all 0.2s',
                '&:hover': {
                  transform: 'rotate(0deg) scale(1.05)',
                  boxShadow: '2px 2px 0px rgba(0,0,0,0.1)',
                },
              }}
            />
          ))
        )}
      </Box>
      {/* Description */}
      <Paper
        sx={{
          p: 4,
          position: 'relative',
          bgcolor: ['utensils', 'book-open'].includes(event.category?.icon || '')
            ? '#fdf8f4'
            : '#fff',
          color: 'inherit',
        }}
      >
        <WashiTape color="rgba(22, 163, 74, 0.3)" rotate="-2deg" />
        <Typography variant="h6" sx={{ fontFamily: '"Permanent Marker"', mb: 2 }}>
          The Details
        </Typography>
        <Typography sx={{ lineHeight: 1.8, whiteSpace: 'pre-wrap', mb: 4 }}>
          {event.description}
        </Typography>

        {/* Check-in Memo - Sibling to description */}
        {event.check_in_instructions && (event.user_has_ticket || isHost) && (
          <Box sx={{ mt: 4, mb: 4 }}>
            <CheckInMemo instructions={event.check_in_instructions} />
          </Box>
        )}
      </Paper>
    </Box>
  );
};
