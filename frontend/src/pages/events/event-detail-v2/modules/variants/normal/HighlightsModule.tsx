import { Box, Typography } from '@mui/material';

const HIGHLIGHT_ICONS: Record<string, string> = {
  music: '🎵',
  venue: '🏠',
  byob: '🍾',
  food: '🍽️',
  drinks: '🍹',
  parking: '🚗',
  age: '🔞',
  dresscode: '👔',
  vibe: '✨',
  special: '⭐',
};

interface NormalHighlightsModuleProps {
  event: any;
  highlights: any[];
}

export function NormalHighlightsModule({
  event,
  highlights,
}: NormalHighlightsModuleProps) {
  const textHighlights =
    highlights?.filter((h: any) => h.type === 'text' || !h.media_file) || [];

  // Fallback to description highlights if no explicit highlights
  const fallbackHighlights =
    event.description?.split('\n').filter((l: string) => l.trim().length > 20) || [];

  const displayHighlights =
    textHighlights.length > 0 ? textHighlights : fallbackHighlights.slice(0, 3);

  if (displayHighlights.length === 0) return null;

  return (
    <Box sx={{ px: 2, pt: 2 }}>
      <Typography
        sx={{
          fontFamily: '"Syne", sans-serif',
          fontSize: 13,
          fontWeight: 700,
          color: 'var(--color-text-primary, #111)',
          mb: 1.25,
          letterSpacing: '0.01em',
        }}
      >
        Highlights
      </Typography>
      {displayHighlights.map((highlight: any, idx: number) => {
        const text =
          typeof highlight === 'string'
            ? highlight
            : highlight.text || highlight.content;
        const icon = HIGHLIGHT_ICONS[text?.toLowerCase().slice(0, 10)] || '✨';

        return (
          <Box
            key={idx}
            sx={{
              display: 'flex',
              gap: 1,
              alignItems: 'flex-start',
              mb: 1,
            }}
          >
            <Box
              sx={{
                width: 28,
                height: 28,
                borderRadius: 'var(--border-radius-md, 8px)',
                bgcolor: '#FAECE7',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 13,
                flexShrink: 0,
              }}
            >
              {icon}
            </Box>
            <Typography
              sx={{
                fontSize: 13,
                color: 'var(--color-text-primary, #111)',
                lineHeight: 1.4,
                pt: 0.25,
              }}
            >
              {text}
            </Typography>
          </Box>
        );
      })}
    </Box>
  );
}
