import { Box, IconButton, Stack, Typography } from '@mui/material';
import { Heart, MessageCircle, Share2, X } from 'lucide-react';
import { type ReactNode, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'sonner';

import { Hostname } from '@/components/ui/Hostname';
import { useAuth } from '@/features/auth/hooks';
import { useToggleHighlightLike } from '@/features/events/hooks';

import { HighlightCommentDrawer } from './HighlightCommentDrawer';
import { getCategoryTheme } from '@/features/events/CategoricalBackground';

const BOTTOM_NAV_OFFSET = 'calc(88px + env(safe-area-inset-bottom, 0px))';
const TOP_SAFE_OFFSET = 'calc(16px + env(safe-area-inset-top, 0px))';

interface HighlightFeedViewerProps {
  highlights: any[];
  isOpen: boolean;
  onClose: () => void;
  initialHighlightId?: number;
  urlPattern?: 'gallery' | 'highlightsreels' | ((highlight: any) => string);
}

function FrostedActionButton({
  icon,
  label,
  count,
  onClick,
  active = false,
  lightMode = false,
}: {
  icon: ReactNode;
  label: string;
  count?: number;
  onClick: () => void;
  active?: boolean;
  lightMode?: boolean;
}) {
  return (
    <Stack alignItems="center" spacing={0.9}>
      <IconButton
        aria-label={label}
        onClick={onClick}
        sx={{
          width: { xs: 58, sm: 64 },
          height: { xs: 58, sm: 64 },
          ...(lightMode
            ? {
                color: active ? '#ff6b81' : '#111',
                bgcolor: 'rgba(0,0,0,0.06)',
                border: '1px solid rgba(0,0,0,0.12)',
                backdropFilter: 'blur(18px)',
                boxShadow: '0 8px 24px rgba(0,0,0,0.08)',
                '&:hover': {
                  bgcolor: 'rgba(0,0,0,0.1)',
                },
              }
            : {
                color: active ? '#ff6b81' : '#fff',
                bgcolor: 'rgba(255,255,255,0.16)',
                border: '1px solid rgba(255,255,255,0.28)',
                backdropFilter: 'blur(18px)',
                boxShadow: '0 16px 40px rgba(0,0,0,0.24)',
                '&:hover': {
                  bgcolor: 'rgba(255,255,255,0.24)',
                },
              }),
        }}
      >
        {icon}
      </IconButton>
      <Typography
        sx={{
          fontSize: '0.78rem',
          fontWeight: 700,
          color: lightMode ? '#111' : 'white',
          textShadow: lightMode ? 'none' : '0 2px 10px rgba(0,0,0,0.45)',
        }}
      >
        {count ?? ''}
      </Typography>
    </Stack>
  );
}

export const HighlightFeedViewer = ({
  highlights,
  isOpen,
  onClose,
  initialHighlightId,
  urlPattern = 'gallery',
}: HighlightFeedViewerProps) => {
  const { id: routeEventId } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const toggleLike = useToggleHighlightLike();
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [isCommentsOpen, setIsCommentsOpen] = useState(false);
  const [activeHighlightId, setActiveHighlightId] = useState<number | null>(
    initialHighlightId || null,
  );
  const [hasInitialScrolled, setHasInitialScrolled] = useState(false);

  const activeIndex = useMemo(
    () => highlights.findIndex((highlight) => highlight.id === activeHighlightId),
    [activeHighlightId, highlights],
  );

  const activeHighlight = highlights[activeIndex] || highlights[0];

  const getHighlightUrl = (highlight: any) => {
    const eventId = highlight?.event?.id ?? highlight?.event_id ?? routeEventId;
    if (!eventId || !highlight?.id) return '';

    if (typeof urlPattern === 'function') {
      return urlPattern(highlight);
    }

    switch (urlPattern) {
      case 'highlightsreels':
        return `/highlightsreels/${highlight.id}`;
      case 'gallery':
      default:
        return `/events/${eventId}/gallery/${highlight.id}`;
    }
  };

  const syncHighlightUrl = (highlight: any) => {
    const url = getHighlightUrl(highlight);
    if (url) {
      window.history.replaceState(null, '', url);
    }
  };

  useEffect(() => {
    if (!isOpen) return;

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, [isOpen]);

  useEffect(() => {
    if (isOpen && !activeHighlightId && highlights.length > 0) {
      setActiveHighlightId(initialHighlightId || highlights[0].id);
    }
  }, [activeHighlightId, highlights, initialHighlightId, isOpen]);

  useEffect(() => {
    if (!isOpen) {
      setHasInitialScrolled(false);
    }
  }, [isOpen]);

  useEffect(() => {
    if (
      !isOpen ||
      !scrollContainerRef.current ||
      highlights.length === 0 ||
      hasInitialScrolled
    )
      return;

    const targetId = initialHighlightId || highlights[0]?.id;
    if (!targetId) return;

    const index = highlights.findIndex((highlight) => highlight.id === targetId);
    if (index === -1) return;

    requestAnimationFrame(() => {
      if (!scrollContainerRef.current) return;
      scrollContainerRef.current.scrollTop =
        index * scrollContainerRef.current.clientHeight;
      setActiveHighlightId(targetId);
      setHasInitialScrolled(true);
    });
  }, [highlights, initialHighlightId, isOpen, hasInitialScrolled]);

  const handleScroll = (event: React.UIEvent<HTMLDivElement>) => {
    const container = event.currentTarget;
    const containerHeight = container.clientHeight || window.innerHeight || 1;
    const index = Math.round(container.scrollTop / containerHeight);
    const clampedIndex = Math.min(
      Math.max(index, 0),
      Math.max(highlights.length - 1, 0),
    );
    const highlight = highlights[clampedIndex];

    if (highlight && highlight.id !== activeHighlightId) {
      setActiveHighlightId(highlight.id);
      syncHighlightUrl(highlight);
    }
  };

  const handleShare = async (highlight: any) => {
    const shareUrl = getHighlightUrl(highlight);
    if (!shareUrl) return;

    try {
      if (navigator.share) {
        await navigator.share({
          title: highlight?.event?.title || 'Event highlight',
          text: highlight?.text || 'Check out this highlight',
          url: shareUrl,
        });
        toast.success('Highlight shared');
        return;
      }

      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(shareUrl);
      } else {
        const input = document.createElement('input');
        input.value = shareUrl;
        document.body.appendChild(input);
        input.select();
        document.execCommand('copy');
        document.body.removeChild(input);
      }
      toast.success('Link copied to clipboard');
    } catch (error) {
      if ((error as Error)?.name !== 'AbortError') {
        toast.error('Unable to share this highlight right now');
        console.log('Share failed', error);
      }
    }
  };

  if (!isOpen || highlights.length === 0) return null;

  return (
    <>
      <Box
        sx={{
          position: 'fixed',
          inset: 0,
          zIndex: 60,
          bgcolor: '#050505',
          pt:8  
        }}
      >
        <Box
          ref={scrollContainerRef}
          onScroll={handleScroll}
          sx={{
            height: '100dvh',
            overflowY: 'auto',
            scrollSnapType: 'y mandatory',
            WebkitOverflowScrolling: 'touch',
            overscrollBehavior: 'contain',
            '&::-webkit-scrollbar': { display: 'none' },
            scrollbarWidth: 'none',
          }}
        >
          {highlights.map((highlight) => {
            const isLiked = Boolean(highlight.user_has_liked);
            const mediaUrl =
              typeof highlight.media_file === 'string'
                ? highlight.media_file.trim()
                : highlight.media_file;
            const hasPhoto = Boolean(mediaUrl);
            const lightSlide = !hasPhoto;

            return (
              <Box
                key={highlight.id}
                sx={{
                  position: 'relative',
                  height: '100dvh',
                  width: '100%',
                  scrollSnapAlign: 'start',
                  overflow: 'hidden',
                  bgcolor: lightSlide ? '#ffffff' : '#050505',
                }}
              >
                {hasPhoto ? (
                  <>
                    <Box
                      component="img"
                      src={mediaUrl}
                      alt={highlight.text || 'Highlight'}
                      sx={{
                        position: 'absolute',
                        inset: 0,
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                      }}
                    />

                    <Box
                      sx={{
                        position: 'absolute',
                        inset: 0,
                        background:
                          'linear-gradient(180deg, rgba(0,0,0,0.2) 0%, rgba(0,0,0,0.12) 28%, rgba(0,0,0,0.4) 58%, rgba(0,0,0,0.84) 100%)',
                      }}
                    />
                  </>
                ) : (
                  <Box
                    sx={{
                      position: 'absolute',
                      inset: 0,
                      bgcolor: '#ffffff',
                    }}
                  />
                )}

                <Stack
                  direction="row"
                  alignItems="center"
                  spacing={1.5}
                  sx={{
                    position: 'absolute',
                    top: TOP_SAFE_OFFSET,
                    left: 16,
                    right: 16,
                    zIndex: 2,
                  }}
                >
                  {highlight.event && (
                    <Box
                      sx={{
                        flex: 1,
                        minWidth: 0,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: 1.5,
                        px: { xs: 1.5, sm: 2 },
                        py: 1.25,
                        borderRadius: 999,
                        ...(lightSlide
                          ? {
                              border: '1px solid rgba(0,0,0,0.1)',
                              bgcolor: 'rgba(0,0,0,0.04)',
                              backdropFilter: 'blur(18px)',
                              boxShadow: '0 8px 28px rgba(0,0,0,0.08)',
                            }
                          : {
                              border: '1px solid rgba(255,255,255,0.26)',
                              bgcolor: 'rgba(15,15,15,0.42)',
                              backdropFilter: 'blur(18px)',
                              boxShadow: '0 18px 50px rgba(0,0,0,0.25)',
                            }),
                      }}
                    >
                      <Box sx={{ minWidth: 0 }}>
                        <Typography
                          sx={{
                            color: lightSlide ? '#111' : 'white',
                            fontWeight: 800,
                            fontSize: { xs: '0.95rem', sm: '1rem' },
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                          }}
                        >
                          {highlight.event.title}
                        </Typography>
                        <Typography
                          sx={{
                            mt: 0.25,
                            color: lightSlide
                              ? 'rgba(0,0,0,0.58)'
                              : 'rgba(255,255,255,0.78)',
                            fontSize: '0.8rem',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                          }}
                        >
                          {highlight.event.location_name}
                        </Typography>
                      </Box>

                      <Box
                        component="button"
                        type="button"
                        onClick={() => {
                          const eventId = highlight.event?.id ?? highlight.event_id;
                          if (eventId) {
                            navigate(`/events-new/${eventId}`);
                          }
                        }}
                        sx={{
                          flexShrink: 0,
                          px: { xs: 1.4, sm: 1.8 },
                          py: 0.9,
                          borderRadius: 999,
                          border: lightSlide
                            ? '1px solid rgba(0,0,0,0.22)'
                            : '1px solid rgba(255,255,255,0.24)',
                          bgcolor: lightSlide ? 'rgba(255,255,255,0.9)' : '#fff6dd',
                          color: '#111',
                          fontWeight: 800,
                          fontSize: '0.8rem',
                          cursor: 'pointer',
                        }}
                      >
                        Go to Event
                      </Box>
                    </Box>
                  )}

                  <IconButton
                    aria-label="Close viewer"
                    onClick={onClose}
                    sx={{
                      width: 48,
                      height: 48,
                      color: lightSlide ? '#111' : 'white',
                      border: lightSlide
                        ? '1px solid rgba(0,0,0,0.12)'
                        : '1px solid rgba(255,255,255,0.26)',
                      bgcolor: lightSlide
                        ? 'rgba(0,0,0,0.06)'
                        : 'rgba(15,15,15,0.42)',
                      backdropFilter: 'blur(18px)',
                    }}
                  >
                    <X size={24} />
                  </IconButton>
                </Stack>

                {!hasPhoto && highlight.text && (
                  <Box
                    sx={{
                      bgcolor: getCategoryTheme(highlight.event.category).tape,
                      position: 'absolute',
                      inset: 0,
                      zIndex: 1,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      px: { xs: 3, sm: 5 },
                      pt: `calc(${TOP_SAFE_OFFSET} + 56px)`,
                      pb: `calc(${BOTTOM_NAV_OFFSET} + 100px)`,
                      overflow: 'auto',
                      WebkitOverflowScrolling: 'touch',
                    }}
                  >
                    <Typography
                      sx={{
                        maxWidth: 'min(640px, 100%)',
                        color: getCategoryTheme(highlight.event.category).accent,
                        fontSize: { xs: '1.35rem', sm: '1.6rem' },
                        fontWeight: 600,
                        lineHeight: 1.45,
                        textAlign: 'center',
                        whiteSpace: 'pre-wrap',
                        wordBreak: 'break-word',
                      }}
                    >
                      {highlight.text}
                    </Typography>
                  </Box>
                )}

                <Box
                  sx={{
                    position: 'absolute',
                    left: { xs: 16, sm: 24 },
                    right: { xs: 104, sm: 128 },
                    bottom: `calc(${BOTTOM_NAV_OFFSET} + 22px)`,
                    zIndex: 2,
                  }}
                >
                  <Stack direction="row" alignItems="center" spacing={1.2}>
                    <Hostname
                      username={highlight.author_username}
                      avatarSrc={highlight.author_avatar}
                      mode="normal"
                      className={lightSlide ? '!text-black' : '!text-white'}
                      sx={{
                        color: lightSlide ? '#111' : 'white',
                        '& .MuiTypography-root': {
                          color: lightSlide ? '#111' : 'white',
                        },
                      }}
                    />
                  </Stack>

                  {hasPhoto && highlight.text && (
                    <Typography
                      sx={{
                        mt: 1.2,
                        maxWidth: 'min(560px, 100%)',
                        color: 'white',
                        fontSize: { xs: '0.98rem', sm: '1.05rem' },
                        lineHeight: 1.5,
                        textShadow: '0 4px 16px rgba(0,0,0,0.45)',
                        display: '-webkit-box',
                        WebkitLineClamp: 3,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                      }}
                    >
                      {highlight.text}
                    </Typography>
                  )}
                </Box>

                <Stack
                  spacing={2}
                  alignItems="center"
                  sx={{
                    position: 'absolute',
                    right: { xs: 16, sm: 24 },
                    bottom: `calc(${BOTTOM_NAV_OFFSET} + 22px)`,
                    zIndex: 2,
                  }}
                >
                  {isAuthenticated && (
                    <FrostedActionButton
                      label="Like highlight"
                      count={highlight.likes_count || 0}
                      active={isLiked}
                      lightMode={lightSlide}
                      onClick={() =>
                        toggleLike.mutate(highlight.id, {
                          onError: () => toast.error('Could not update like right now'),
                        })
                      }
                      icon={
                        <Heart
                          size={28}
                          fill={isLiked ? 'currentColor' : 'none'}
                          strokeWidth={2.1}
                        />
                      }
                    />
                  )}

                  <FrostedActionButton
                    label="Open comments"
                    count={highlight.comments_count || 0}
                    lightMode={lightSlide}
                    onClick={() => {
                      setActiveHighlightId(highlight.id);
                      setIsCommentsOpen(true);
                    }}
                    icon={<MessageCircle size={28} strokeWidth={2.1} />}
                  />

                  <FrostedActionButton
                    label="Share highlight"
                    lightMode={lightSlide}
                    onClick={() => handleShare(highlight)}
                    icon={<Share2 size={28} strokeWidth={2.1} />}
                  />
                </Stack>
              </Box>
            );
          })}
        </Box>
      </Box>

      <HighlightCommentDrawer
        highlightId={activeHighlightId}
        commentsCount={activeHighlight?.comments_count || 0}
        isOpen={isCommentsOpen}
        onClose={() => setIsCommentsOpen(false)}
      />
    </>
  );
};
