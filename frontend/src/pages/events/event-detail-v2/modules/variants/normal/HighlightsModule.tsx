import { Box, Button, Typography } from '@mui/material';
import { useState } from 'react';

import { HighlightChainViewer } from '@/pages/events/components/HighlightChainViewer';
import { SubHeaderEventPage } from './SubHeaderEventPage';

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
  canUpload?: boolean;
  showPublishedPlaceholder?: boolean;
  onOpenComposer?: () => void;
  compact?: boolean;
}

export function NormalHighlightsModule({
  event,
  highlights,
  canUpload = false,
  showPublishedPlaceholder = false,
  onOpenComposer,
  compact = false,
}: NormalHighlightsModuleProps) {
  const [selectedHighlightId, setSelectedHighlightId] = useState<number | null>(null);
  const [isViewerOpen, setIsViewerOpen] = useState(false);

  // Combine media and text highlights into one unified feed
  const displayHighlights = highlights || [];

  const handleHighlightClick = (highlightId: number) => {
    setSelectedHighlightId(highlightId);
    setIsViewerOpen(true);
  };

  if (showPublishedPlaceholder && displayHighlights.length === 0) {
    return (
      <Box sx={{ px: 2, pt: compact ? 1 : 2, pb: compact ? 1 : 0.5 }}>
        <SubHeaderEventPage
          heading="Highlights"
          icon="material-symbols:photo-prints-sharp"
          description="Memories to come"
          iconSide="right"
        />
      </Box>
    );
  }

  if (displayHighlights.length === 0 && !canUpload) return null;

  return (
    <Box sx={{ px: 2, pt: compact ? 1 : 2, pb: compact ? 4 : 2 }}>
      <Box
        sx={{
        }}
      >

        <SubHeaderEventPage
          heading="Highlights"
          icon="material-symbols:photo-prints-sharp"
          description="Memories from the event"
          iconSide="right"
        />
      </Box>

      {displayHighlights.length > 0 ? (
        <Box
          sx={{
            display: 'flex',
            gap: 2,
            overflowX: 'auto',
            pb: 1,
            mx: -2,
            px: 2,
            scrollSnapType: 'x proximity',
            '&::-webkit-scrollbar': { display: 'none' },
            msOverflowStyle: 'none',
            scrollbarWidth: 'none',
          }}
        >
          {displayHighlights.map((highlight: any, idx: number) => {
            const mediaSrc =
              highlight.media_file || highlight.mediaUrl || highlight.file;
            const text = highlight.text || highlight.content;
            const author = highlight.author_username || highlight.author?.username;

            return (
              <Box
                key={highlight.id || idx}
                onClick={() => handleHighlightClick(highlight.id)}
                sx={{
                  flexShrink: 0,
                  cursor: 'pointer',
                  width: { xs: 240, md: 320 },
                  height: { xs: 240, md: 320 },
                  borderRadius: '16px',
                  overflow: 'hidden',
                  border: '0.5px solid #e5e7eb',
                  bgcolor: '#f9fafb',
                  position: 'relative',
                  scrollSnapAlign: 'start',
                }}
              >
                {mediaSrc ? (
                  <Box
                    component="img"
                    src={mediaSrc}
                    alt={text || `Highlight ${idx + 1}`}
                    sx={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                      transition: 'transform 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
                      '&:hover': { transform: 'scale(1.05)' },
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
                      p: 3,
                      bgcolor: '#FAECE7',
                      textAlign: 'center',
                    }}
                  >
                    <Typography
                      sx={{
                        fontSize: 14,
                        fontWeight: 600,
                        color: '#D85A30',
                        lineHeight: 1.5,
                        display: '-webkit-box',
                        WebkitLineClamp: 6,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                      }}
                    >
                      {text}
                    </Typography>
                  </Box>
                )}

                {/* Overlay for text on images */}
                {mediaSrc && text && (
                  <Box
                    sx={{
                      position: 'absolute',
                      inset: '0 0 0 0',
                      background:
                        'linear-gradient(to top, rgba(0,0,0,0.85) 0%, transparent 60%)',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'flex-end',
                      p: 2,
                      color: 'white',
                    }}
                  >
                    <Typography
                      sx={{
                        fontSize: 12,
                        fontWeight: 600,
                        lineHeight: 1.3,
                        mb: 0.5,
                        display: '-webkit-box',
                        WebkitLineClamp: 3,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                      }}
                    >
                      {text}
                    </Typography>
                    {author && (
                      <Typography
                        sx={{ fontSize: 10, opacity: 0.8, letterSpacing: '0.02em' }}
                      >
                        By {author}
                      </Typography>
                    )}
                  </Box>
                )}
              </Box>
            );
          })}
        </Box>
      ) : (
        null
      )}

      {canUpload && (
        <Button
          fullWidth
          onClick={onOpenComposer}
          sx={{
            mt: 2,
            py: 1.25,
            borderRadius: '12px',
            border: '0.5px solid #D85A30',
            color: '#D85A30',
            textTransform: 'none',
            fontSize: 14,
            fontWeight: 700,
            letterSpacing: '0.01em',
          }}
        >
          {displayHighlights.length > 0 ? 'Upload highlight' : 'Add a highlight'}
        </Button>
      )}

      {selectedHighlightId && (
        <HighlightChainViewer
          initialHighlightId={selectedHighlightId}
          isOpen={isViewerOpen}
          onClose={() => setIsViewerOpen(false)}
        />
      )}
    </Box>
  );
}
