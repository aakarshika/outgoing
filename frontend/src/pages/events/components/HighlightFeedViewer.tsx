import {
  Box,
  Dialog,
  Fade,
  IconButton,
  Stack,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import { ChevronLeft, ChevronRight, Heart, MessageCircle, X } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';

import { Hostname } from '@/components/ui/Hostname';
import { useAuth } from '@/features/auth/hooks';
import { useToggleHighlightLike } from '@/features/events/hooks';

import { HighlightCommentDrawer } from './HighlightCommentDrawer';
import { HighlightComments } from './HighlightComments';

// --- Comic Theme Constants ---
const COMIC_BORDER = '3px solid #1a1a1a';
const COMIC_SHADOW = '4px 4px 0px #1a1a1a';
const COMIC_SHADOW_HOVER = '2px 2px 0px #1a1a1a';

// --- Comic Styled Components ---
const ComicIconButton = ({
  children,
  onClick,
  active,
  color = 'white',
  activeColor = '#ef4444',
  sx = {},
}: any) => (
  <IconButton
    onClick={onClick}
    sx={{
      color: active ? activeColor : color,
      bgcolor: 'white',
      border: COMIC_BORDER,
      boxShadow: COMIC_SHADOW,
      transition: 'all 0.1s ease',
      '&:hover': {
        bgcolor: '#f3f4f6',
        transform: 'translate(2px, 2px)',
        boxShadow: COMIC_SHADOW_HOVER,
      },
      '&:active': {
        transform: 'translate(4px, 4px)',
        boxShadow: 'none',
      },
      ...sx,
    }}
  >
    {children}
  </IconButton>
);

// --- Highlight Interaction Section (Mobile) ---
const HighlightInteractionsMobile = ({
  highlight,
  onOpenComments,
}: {
  highlight: any;
  onOpenComments: () => void;
}) => {
  const { isAuthenticated } = useAuth();
  const toggleLike = useToggleHighlightLike();

  return (
    <Stack
      spacing={3}
      alignItems="center"
      sx={{
        position: 'absolute',
        right: 16,
        bottom: 120,
        zIndex: 50,
      }}
    >
      <Box sx={{ textAlign: 'center' }}>
        <Hostname
          username={highlight.author_username}
          avatarSrc={highlight.author_avatar}
          mode="bigger"
          className="!text-white"
          sx={{
            '& .MuiAvatar-root': {
              border: COMIC_BORDER,
              boxShadow: COMIC_SHADOW,
            },
          }}
        />
      </Box>

      <Box sx={{ textAlign: 'center' }}>
        <ComicIconButton
          active={highlight.user_has_liked}
          onClick={() => isAuthenticated && toggleLike.mutate(highlight.id)}
        >
          <Heart fill={highlight.user_has_liked ? '#ef4444' : 'none'} />
        </ComicIconButton>
        <Typography
          sx={{
            fontSize: '0.9rem',
            fontWeight: 900,
            color: 'white',
            textShadow: '2px 2px 0px #000',
            mt: 1,
            fontFamily: '"Permanent Marker", cursive',
          }}
        >
          {highlight.likes_count}
        </Typography>
      </Box>

      <Box sx={{ textAlign: 'center' }}>
        <ComicIconButton onClick={onOpenComments}>
          <MessageCircle fill="none" />
        </ComicIconButton>
        <Typography
          sx={{
            fontSize: '0.9rem',
            fontWeight: 900,
            color: 'white',
            textShadow: '2px 2px 0px #000',
            mt: 1,
            fontFamily: '"Permanent Marker", cursive',
          }}
        >
          {highlight.comments_count}
        </Typography>
      </Box>
    </Stack>
  );
};

interface HighlightFeedViewerProps {
  highlights: any[];
  isOpen: boolean;
  onClose: () => void;
  initialHighlightId?: number;
}

export const HighlightFeedViewer = ({
  highlights,
  isOpen,
  onClose,
  initialHighlightId,
}: HighlightFeedViewerProps) => {
  const { id: eventId } = useParams();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [isCommentsOpen, setIsCommentsOpen] = useState(false);
  const [activeHighlightId, setActiveHighlightId] = useState<number | null>(
    initialHighlightId || null,
  );

  const activeIndex = useMemo(
    () => highlights.findIndex((h) => h.id === activeHighlightId),
    [highlights, activeHighlightId],
  );

  const activeHighlight = highlights[activeIndex] || highlights[0];

  useEffect(() => {
    if (isOpen && !activeHighlightId && highlights.length > 0) {
      setActiveHighlightId(highlights[0].id);
    }
  }, [isOpen, activeHighlightId, highlights]);

  useEffect(() => {
    if (isOpen && initialHighlightId && scrollContainerRef.current && isMobile) {
      const index = highlights.findIndex((h) => h.id === initialHighlightId);
      if (index !== -1) {
        scrollContainerRef.current.scrollTop = index * window.innerHeight;
        setActiveHighlightId(initialHighlightId);
      }
    }
  }, [isOpen, initialHighlightId, highlights, isMobile]);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    if (!isMobile) return;
    const scrollTop = e.currentTarget.scrollTop;
    const index = Math.round(scrollTop / window.innerHeight);
    const highlight = highlights[index];
    if (highlight && highlight.id !== activeHighlightId) {
      setActiveHighlightId(highlight.id);
      window.history.replaceState(
        null,
        '',
        `/events/${eventId}/gallery/${highlight.id}`,
      );
    }
  };

  const handleNext = () => {
    if (activeIndex < highlights.length - 1) {
      const nextHighlight = highlights[activeIndex + 1];
      setActiveHighlightId(nextHighlight.id);
      window.history.replaceState(
        null,
        '',
        `/events/${eventId}/gallery/${nextHighlight.id}`,
      );
    }
  };

  const handlePrev = () => {
    if (activeIndex > 0) {
      const prevHighlight = highlights[activeIndex - 1];
      setActiveHighlightId(prevHighlight.id);
      window.history.replaceState(
        null,
        '',
        `/events/${eventId}/gallery/${prevHighlight.id}`,
      );
    }
  };

  if (!isOpen) return null;

  if (isMobile) {
    return (
      <Box
        sx={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          zIndex: 2000,
          bgcolor: 'black',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <ComicIconButton
          onClick={onClose}
          sx={{ position: 'absolute', top: 16, left: 16, zIndex: 3000 }}
        >
          <X />
        </ComicIconButton>

        <Box
          ref={scrollContainerRef}
          onScroll={handleScroll}
          sx={{
            flex: 1,
            overflowY: 'scroll',
            scrollSnapType: 'y mandatory',
            height: '100%',
            '&::-webkit-scrollbar': { display: 'none' },
            msOverflowStyle: 'none',
            scrollbarWidth: 'none',
          }}
        >
          {highlights.map((h) => (
            <Box
              key={h.id}
              sx={{
                height: '100vh',
                width: '100%',
                scrollSnapAlign: 'start',
                position: 'relative',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                overflow: 'hidden',
              }}
            >
              <Box
                sx={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  backgroundImage: `url(${h.media_file})`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                  filter: 'blur(30px)',
                  opacity: 0.4,
                  transform: 'scale(1.1)',
                }}
              />

              <Box
                sx={{
                  position: 'relative',
                  zIndex: 1,
                  maxHeight: '100%',
                  maxWidth: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                }}
              >
                <img
                  src={h.media_file}
                  alt={h.text}
                  style={{
                    maxHeight: '100vh',
                    maxWidth: '100vw',
                    objectFit: 'contain',
                    display: 'block',
                  }}
                />

                <Box
                  sx={{
                    position: 'absolute',
                    bottom: 0,
                    left: 0,
                    right: 0,
                    p: 4,
                    pb: 10,
                    background: 'linear-gradient(transparent, rgba(0,0,0,0.8))',
                    color: 'white',
                  }}
                >
                  <Hostname
                    username={h.author_username}
                    mode="simple"
                    className="!text-white mb-2"
                  />
                  <Typography
                    variant="body1"
                    sx={{ fontFamily: '"Caveat", cursive', fontSize: '1.4rem' }}
                  >
                    {h.text}
                  </Typography>
                </Box>
              </Box>

              <HighlightInteractionsMobile
                highlight={h}
                onOpenComments={() => setIsCommentsOpen(true)}
              />
            </Box>
          ))}
        </Box>

        <HighlightCommentDrawer
          highlightId={activeHighlightId}
          commentsCount={activeHighlight?.comments_count || 0}
          isOpen={isCommentsOpen}
          onClose={() => setIsCommentsOpen(false)}
        />
      </Box>
    );
  }

  // --- Web Popup Layout ---
  return (
    <Dialog
      fullScreen
      open={isOpen}
      onClose={onClose}
      TransitionComponent={Fade}
      PaperProps={{
        sx: {
          bgcolor: 'rgba(0,0,0,0.85)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          p: { md: 4, lg: 8 },
        },
      }}
    >
      <ComicIconButton
        onClick={onClose}
        sx={{ position: 'absolute', top: 24, left: 24, zIndex: 10 }}
      >
        <X />
      </ComicIconButton>

      <Box
        sx={{
          display: 'flex',
          width: '100%',
          maxWidth: '1200px',
          height: '80vh',
          bgcolor: 'white',
          border: COMIC_BORDER,
          boxShadow: '12px 12px 0px #1a1a1a',
          overflow: 'hidden',
          position: 'relative',
          flexDirection: { md: 'row' },
        }}
      >
        {/* Left Column: Media */}
        <Box
          sx={{
            flex: { md: 1.5 },
            bgcolor: '#f3f4f6',
            position: 'relative',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRight: COMIC_BORDER,
            overflow: 'hidden',
          }}
        >
          <img
            src={activeHighlight?.media_file}
            alt={activeHighlight?.text}
            style={{
              maxWidth: '100%',
              maxHeight: '100%',
              objectFit: 'contain',
            }}
          />

          {/* Caption Overlay Web */}
          <Box
            sx={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              p: 3,
              background: 'linear-gradient(transparent, rgba(0,0,0,0.7))',
              color: 'white',
            }}
          >
            <Hostname
              username={activeHighlight?.author_username}
              avatarSrc={activeHighlight?.author_avatar}
              mode="normal"
              className="!text-white mb-1"
            />
            <Typography sx={{ fontFamily: '"Caveat", cursive', fontSize: '1.5rem' }}>
              {activeHighlight?.text}
            </Typography>
          </Box>
        </Box>

        {/* Right Column: Comments */}
        <Box
          sx={{
            flex: { md: 1 },
            display: 'flex',
            flexDirection: 'column',
            bgcolor: '#fdfbf7',
            backgroundImage: 'radial-gradient(#d1d5db 0.5px, transparent 0.5px)',
            backgroundSize: '15px 15px',
          }}
        >
          <Box sx={{ p: 2, borderBottom: '2px solid #1a1a1a', bgcolor: 'white' }}>
            <Typography
              sx={{
                fontWeight: 900,
                fontSize: '1.2rem',
                fontFamily: '"Permanent Marker", cursive',
                textAlign: 'center',
              }}
            >
              {activeHighlight?.comments_count} thoughts ✏️
            </Typography>
          </Box>
          <Box sx={{ flex: 1, overflow: 'hidden' }}>
            <HighlightComments
              highlightId={activeHighlightId}
              commentsCount={activeHighlight?.comments_count || 0}
            />
          </Box>
        </Box>

        {/* Navigation Buttons Web */}
        <Box
          sx={{
            position: 'absolute',
            bottom: 24,
            right: { md: '41%' }, // Positioned near the split
            display: 'flex',
            gap: 2,
            zIndex: 20,
          }}
        >
          <ComicIconButton
            onClick={handlePrev}
            sx={{ visibility: activeIndex > 0 ? 'visible' : 'hidden' }}
          >
            <ChevronLeft />
          </ComicIconButton>
          <ComicIconButton
            onClick={handleNext}
            sx={{
              visibility: activeIndex < highlights.length - 1 ? 'visible' : 'hidden',
            }}
          >
            <ChevronRight />
          </ComicIconButton>
        </Box>
      </Box>
    </Dialog>
  );
};
