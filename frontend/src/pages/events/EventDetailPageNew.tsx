import {
  Box,
  Button as MuiButton,
  Chip,
  Grid,
  IconButton,
  Paper,
  ThemeProvider,
  Typography,
} from '@mui/material';
import { ArrowLeft, Calendar, Clock, FileEdit, Heart, MapPin } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'sonner';

import { ApplyToNeedModal } from '@/components/events/ApplyToNeedModal';
import { HighlightComposer } from '@/components/events/HighlightComposer';
import { ReviewComposer } from '@/components/events/ReviewComposer';
import { TicketConfirmationModal } from '@/components/events/TicketConfirmationModal';
import { CapacityInfographic } from '@/components/ui/CapacityInfographic';
import { CheckInMemo } from '@/components/ui/CheckInMemo';
import { HostCard } from '@/components/ui/HostCard';
import { Media } from '@/components/ui/media';
import { PostItNote } from '@/components/ui/PostItNote';
import { VendorBusinessCard } from '@/components/ui/VendorBusinessCard';
import { useAuth } from '@/features/auth/hooks';
import {
  CategoricalBackground,
  CATEGORY_THEMES,
} from '@/features/events/CategoricalBackground';
import {
  useEvent,
  usePurchaseTicket,
  useRecordEventView,
  useToggleInterest,
} from '@/features/events/hooks';
import { scrapbookTheme } from '@/features/events/theme/scrapbookTheme';
import { useEventNeeds } from '@/features/needs/hooks';
import { useMyServices } from '@/features/vendors/hooks';

const MapPlaceholder = ({ location }: { location: string }) => (
  <Box
    component="a"
    href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(location)}`}
    target="_blank"
    rel="noopener noreferrer"
    sx={{
      display: 'block',
      width: '100%',
      height: 200,
      bgcolor: '#e5e7eb',
      borderRadius: '4px',
      position: 'relative',
      overflow: 'hidden',
      border: '2px solid #333',
      transform: 'rotate(1deg)',
      textDecoration: 'none',
      '&:hover': {
        transform: 'rotate(0deg) scale(1.02)',
        transition: 'all 0.3s ease',
      },
    }}
  >
    <Box
      sx={{
        position: 'absolute',
        inset: 0,
        backgroundImage:
          'repeating-linear-gradient(45deg, #d1d5db 0, #d1d5db 1px, transparent 0, transparent 50%)',
        backgroundSize: '10px 10px',
        opacity: 0.5,
      }}
    />
    <Box
      sx={{
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        textAlign: 'center',
        color: '#374151',
        zIndex: 1,
      }}
    >
      <MapPin size={32} style={{ margin: '0 auto 8px' }} />
      <Typography sx={{ fontFamily: '"Permanent Marker"', fontSize: '0.9rem' }}>
        View on Maps
      </Typography>
      <Typography
        variant="caption"
        sx={{ display: 'block', mt: 0.5, px: 2, lineClamp: 1 }}
      >
        {location}
      </Typography>
    </Box>
    <WashiTape color="rgba(239, 68, 68, 0.4)" rotate="-15deg" />
  </Box>
);

const LIFECYCLE_LABELS: Record<string, string> = {
  draft: 'Draft',
  published: 'Published',
  at_risk: 'At Risk',
  postponed: 'Postponed',
  event_ready: 'Event Ready',
  live: 'Live',
  cancelled: 'Cancelled',
  completed: 'Completed',
};

// --- Scrapbook Components ---

const WashiTape = ({ color = 'rgba(251, 191, 36, 0.5)', rotate = '3deg' }) => (
  <Box
    sx={{
      position: 'absolute',
      top: -10,
      left: '20%',
      width: 100,
      height: 30,
      bgcolor: color,
      backdropFilter: 'blur(2px)',
      border: '1px solid rgba(0,0,0,0.05)',
      transform: `rotate(${rotate})`,
      zIndex: 1,
      pointerEvents: 'none',
    }}
  />
);

const PolaroidFrame = ({
  src,
  type = 'image',
  caption,
  author,
  rotation,
}: {
  src: string | null;
  type?: 'image' | 'video';
  caption?: string;
  author?: string;
  rotation?: number;
}) => {
  const rot = rotation ?? Math.random() * 8 - 4;
  return (
    <Paper
      elevation={3}
      sx={{
        p: 1.5,
        pb: 6,
        bgcolor: 'white',
        transform: `rotate(${rot}deg)`,
        transition: 'transform 0.3s ease',
        '&:hover': { transform: 'scale(1.05) rotate(0deg)', zIndex: 10 },
        maxWidth: '100%',
        border: '1px solid #efefef',
        position: 'relative',
      }}
    >
      <Box
        sx={{
          aspectSquare: 1,
          bgcolor: '#f0f0f0',
          overflow: 'hidden',
          position: 'relative',
        }}
      >
        {type === 'video' ? (
          <Media
            type="video"
            src={src || undefined}
            controls
            className="w-full h-full object-cover"
          />
        ) : (
          <Media src={src || undefined} className="w-full h-full object-cover" />
        )}
      </Box>
      {caption && (
        <Typography
          sx={{
            fontFamily: '"Permanent Marker", cursive',
            fontSize: '1rem',
            mt: 2,
            textAlign: 'center',
            lineClamp: 2,
            display: '-webkit-box',
            overflow: 'hidden',
            WebkitBoxOrient: 'vertical',
          }}
        >
          {caption}
        </Typography>
      )}
      {author && (
        <Typography
          variant="caption"
          sx={{ display: 'block', textAlign: 'right', mt: 1, color: 'text.secondary' }}
        >
          — @{author}
        </Typography>
      )}
    </Paper>
  );
};

const TicketStub = ({
  type,
  price,
  onBuy,
  isLoading,
  hasTicket,
}: {
  type: string;
  price: number;
  onBuy: () => void;
  isLoading?: boolean;
  hasTicket?: boolean;
}) => (
  <Paper
    elevation={2}
    sx={{
      display: 'flex',
      position: 'relative',
      bgcolor: '#fff9e6', // Aged paper
      border: '1px solid #e0d8c0',
      transform: 'rotate(-1.5deg)',
      mb: 2,
      overflow: 'visible',
    }}
  >
    <WashiTape color="rgba(0,0,0,0.1)" />
    <Box
      sx={{
        p: 2,
        borderRight: '2px dashed #e0d8c0',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        minWidth: 100,
      }}
    >
      <Typography
        variant="caption"
        sx={{ fontWeight: 'bold', color: 'text.secondary', letterSpacing: 1 }}
      >
        ADMIT ONE
      </Typography>
      <Typography
        variant="h5"
        sx={{ fontFamily: '"Permanent Marker"', color: 'primary.main', mt: 1 }}
      >
        ${price}
      </Typography>
    </Box>
    <Box
      sx={{
        p: 2,
        flexGrow: 1,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
      }}
    >
      <Typography
        variant="h6"
        sx={{ fontFamily: '"Permanent Marker"', fontSize: '1.2rem' }}
      >
        {type} Access
      </Typography>
      <Typography variant="caption" sx={{ display: 'block', mt: 0.5, opacity: 0.7 }}>
        Valid for one person. No refunds.
      </Typography>
      {!hasTicket ? (
        <MuiButton
          variant="contained"
          size="small"
          onClick={onBuy}
          disabled={isLoading}
          sx={{
            mt: 1.5,
            borderRadius: 0,
            bgcolor: '#333',
            '&:hover': { bgcolor: '#000' },
          }}
        >
          {isLoading ? 'Processing...' : 'BUY TICKET'}
        </MuiButton>
      ) : (
        <Box
          sx={{
            mt: 1.5,
            p: 0.5,
            border: '2px solid #16a34a',
            color: '#16a34a',
            textAlign: 'center',
            transform: 'rotate(-3deg)',
            fontWeight: 'bold',
            fontFamily: '"Permanent Marker"',
          }}
        >
          PAID / ARCHIVED
        </Box>
      )}
    </Box>
  </Paper>
);

const ClassifiedAd = ({
  need,
  onInquire,
  isEligible = false,
  isOpportunity = false,
  navigate,
}: {
  need: any;
  onInquire: (n: any) => void;
  isEligible?: boolean;
  isOpportunity?: boolean;
  navigate: any;
}) => (
  <Box sx={{ position: 'relative', width: '100%' }}>
    <Paper
      elevation={0}
      sx={{
        p: 3,
        mb: 2,
        bgcolor: '#fdfdfd',
        backgroundImage:
          'linear-gradient(to right, rgba(0,0,0,0.03) 1px, transparent 1px)',
        border: '1px solid #333',
        outline: '3px solid #fdfdfd',
        position: 'relative',
        opacity: need.status === 'filled' ? 0.3 : 1,
        filter: need.status === 'filled' ? 'grayscale(0.8)' : 'none',
        transform: `rotate(${(Math.random() * 2 - 1).toFixed(1)}deg)`,
        pointerEvents: need.status === 'filled' ? 'none' : 'auto',
        transition: 'all 0.3s ease',
      }}
    >
      <Typography
        sx={{
          fontFamily: '"Playfair Display", serif',
          fontWeight: 900,
          textTransform: 'uppercase',
          borderBottom: '2px solid #333',
          mb: 1,
          fontSize: '1rem',
          color: need.status === 'filled' ? '#999' : 'inherit',
        }}
      >
        HELP WANTED: {need.title}
      </Typography>
      <Typography
        variant="body2"
        sx={{ fontFamily: 'serif', fontStyle: 'italic', mb: 2, lineHeight: 1.4 }}
      >
        {need.description}
      </Typography>
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-end',
          mt: 2,
        }}
      >
        <Box>
          <Typography sx={{ fontSize: '0.7rem', color: '#666', mb: 0.5 }}>
            Criticality: {need.criticality}
          </Typography>
          <Typography sx={{ fontSize: '1rem', fontWeight: 'bold' }}>
            Budget: ${need.budget_max || '???'}
          </Typography>
        </Box>
        {need.status === 'open' &&
          (isEligible ? (
            <MuiButton
              variant="outlined"
              size="small"
              onClick={() => onInquire(need)}
              sx={{
                borderRadius: 0,
                borderColor: '#333',
                color: '#333',
                fontWeight: 'bold',
                whiteSpace: 'nowrap',
                '&:hover': { bgcolor: '#333', color: '#fff' },
              }}
            >
              SEND INQUIRY →
            </MuiButton>
          ) : isOpportunity ? (
            <MuiButton
              variant="outlined"
              size="small"
              onClick={() => navigate('/vendors/create')}
              sx={{
                borderRadius: 0,
                borderColor: '#16a34a',
                color: '#16a34a',
                fontWeight: 'bold',
                whiteSpace: 'nowrap',
                '&:hover': { bgcolor: '#16a34a', color: '#fff' },
              }}
            >
              CREATE SERVICE →
            </MuiButton>
          ) : null)}
      </Box>
    </Paper>

    {/* Opportunity stamp */}
    {need.status === 'open' && isOpportunity && (
      <Box
        sx={{
          position: 'absolute',
          top: 12,
          right: 12,
          px: 1.5,
          py: 0.5,
          border: '2px solid rgba(22, 163, 74, 0.6)',
          borderRadius: '2px',
          transform: 'rotate(3deg)',
          pointerEvents: 'none',
          zIndex: 2,
        }}
      >
        <Typography
          sx={{
            fontFamily: '"Permanent Marker", cursive',
            fontSize: '0.65rem',
            color: 'rgba(22, 163, 74, 0.8)',
            letterSpacing: 2,
            textTransform: 'uppercase',
          }}
        >
          OPPORTUNITY
        </Typography>
      </Box>
    )}

    {/* Overlap if filled */}
    {need.status === 'filled' && (
      <Box
        sx={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 10,
          pointerEvents: 'none',
        }}
      >
        <Box
          sx={{
            transform: 'rotate(-3deg) scale(0.95)',
            pointerEvents: 'auto',
            filter: 'drop-shadow(5px 5px 15px rgba(0,0,0,0.2))',
          }}
        >
          <VendorBusinessCard
            vendor={{
              vendor_name: need.assigned_vendor_name || 'Assigned Vendor',
              category: need.category,
              avg_rating: 4.8,
              event_count: 12,
            }}
            onClick={() => {
              if (need.assigned_vendor_id) {
                navigate(`/services/${need.assigned_vendor_id}`);
              }
            }}
          />
          <Box
            sx={{
              position: 'absolute',
              top: -10,
              left: '50%',
              transform: 'translateX(-50%) rotate(5deg)',
              width: 50,
              height: 18,
              bgcolor: 'rgba(59, 130, 246, 0.5)',
              borderRadius: '1px',
              boxShadow: '0 1px 2px rgba(0,0,0,0.1)',
            }}
          />{' '}
          {/* Blue tape holding the card */}
        </Box>
      </Box>
    )}
  </Box>
);

// --- Main Page Component ---

export default function EventDetailPageNew() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();
  const { data: eventResponse, isLoading } = useEvent(Number(id));
  const { data: needsResponse } = useEventNeeds(Number(id));
  const { data: myServicesResponse } = useMyServices({ enabled: !!isAuthenticated });
  const purchaseTicket = usePurchaseTicket();
  const toggleInterest = useToggleInterest();
  const recordView = useRecordEventView(Number(id));

  const [isApplyModalOpen, setIsApplyModalOpen] = useState(false);
  const [selectedNeed, setSelectedNeed] = useState<{
    id: number;
    title: string;
  } | null>(null);
  const [isHighlightOpen, setIsHighlightOpen] = useState(false);
  const [isReviewOpen, setIsReviewOpen] = useState(false);
  const [confirmedTicket, setConfirmedTicket] = useState<{
    type: string;
    price: string;
  } | null>(null);

  useEffect(() => {
    if (isAuthenticated && Number(id)) {
      recordView.mutate();
    }
  }, [id, isAuthenticated]);

  const event = eventResponse?.data;
  const needs = needsResponse?.data || [];
  const highlights = event?.highlights || [];

  const reviews = useMemo(() => {
    const baseReviews = event?.reviews || [];
    return baseReviews.map((rev: any) => ({
      id: rev.id,
      username: rev.reviewer_username,
      rating: rev.rating,
      comment: rev.text,
      avatar: rev.reviewer_avatar,
      vendorReviews: (rev.vendor_reviews || []).map((vRev: any) => {
        const vendorInfo = event?.participating_vendors?.find(
          (v: any) => v.id === vRev.vendor_id,
        );
        return {
          vendorName: vRev.vendor_name,
          vendorAvatar: vendorInfo?.vendor_avatar,
          rating: vRev.rating,
          comment: vRev.text,
        };
      }),
    }));
  }, [event]);

  if (isLoading) {
    return <Box sx={{ p: 4 }}>Loading...</Box>; // Simple loader for now
  }

  if (!event) {
    return (
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '50vh',
        }}
      >
        <Typography>Event not found</Typography>
        <MuiButton onClick={() => navigate('/')}>Go Home</MuiButton>
      </Box>
    );
  }

  const isHost = user?.username === event.host.username;
  const displayNeeds = needs.filter((n: any) => n.status !== 'cancelled');

  const handleBuyTicket = (tier: 'standard' | 'flexible') => {
    if (!isAuthenticated) return navigate('/signin');
    const price =
      tier === 'standard'
        ? event.ticket_price_standard || '0'
        : event.ticket_price_flexible || '0';
    purchaseTicket.mutate(
      { eventId: event.id, ticketType: tier },
      {
        onSuccess: () => {
          toast.success('Ticket purchased!');
          setConfirmedTicket({ type: tier, price });
        },
        onError: (err: any) =>
          toast.error(err?.response?.data?.message || 'Failed to purchase ticket'),
      },
    );
  };

  return (
    <ThemeProvider theme={scrapbookTheme}>
      <Box
        sx={{
          minHeight: '100vh',
          bgcolor: event.lifecycle_state === 'live' ? '#fef3c7' : '#f4f1ea', // Light amber for live
          backgroundAttachment: 'fixed',
          backgroundImage:
            event.lifecycle_state === 'live'
              ? 'radial-gradient(#fde68a 0.5px, #fef3c7 0.5px)'
              : 'radial-gradient(#d1d5db 0.5px, #f4f1ea 0.5px)',
          backgroundSize: '15px 15px',
          p: { xs: 2, sm: 4, md: 8 },
          color: 'inherit',
          transition: 'all 0.5s ease',
        }}
      >
        <Box
          sx={{
            maxWidth: '1000px',
            mx: 'auto',
            position: 'relative',
            '&::before, &::after': {
              content: '""',
              position: 'absolute',
              zIndex: 0,
              bottom: '25px',
              width: '40%',
              height: '20px',
              boxShadow: '0 25px 20px rgba(0,0,0,0.4)',
              transition: 'all 0.3s ease',
            },
            '&::before': { left: '12px', transform: 'rotate(-4deg)' },
            '&::after': { right: '12px', transform: 'rotate(4deg)' },
          }}
        >
          <CategoricalBackground
            slug={event.category?.slug}
            sx={{
              width: '100%',
              height: '100%',
              position: 'relative',
              zIndex: 1,
              p: { xs: 2, sm: 4, md: 6 },
              boxShadow: '0 4px 10px rgba(0,0,0,0.1)',
              borderRadius: '4px',
              overflow: 'visible',
            }}
          >
            {/* Top Bar */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 4 }}>
              <IconButton
                onClick={() => navigate(-1)}
                sx={{
                  bgcolor: 'white',
                  '&:hover': { bgcolor: '#f0f0f0' },
                  boxShadow: 1,
                }}
              >
                <ArrowLeft />
              </IconButton>
              {isHost && (
                <MuiButton
                  variant="contained"
                  startIcon={<FileEdit />}
                  onClick={() => navigate(`/events/${event.id}/manage`)}
                  sx={{
                    bgcolor: 'white',
                    color: 'black',
                    '&:hover': { bgcolor: '#f0f0f0' },
                    boxShadow: 2,
                    textTransform: 'none',
                    fontWeight: 'bold',
                  }}
                >
                  Manage Event
                </MuiButton>
              )}
            </Box>

            {/* Media Gallery - Polaroid Pile */}
            <Grid container spacing={4} sx={{ mb: 8 }}>
              <Grid size={{ xs: 12, md: 7 }}>
                <PolaroidFrame
                  src={event.cover_image}
                  rotation={-2}
                  caption={event.title}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 5 }}>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  {(event.media || []).slice(0, 2).map((m: any, idx: number) => (
                    <PolaroidFrame
                      key={m.id}
                      src={m.file}
                      type={m.media_type}
                      rotation={idx % 2 === 0 ? 3 : -4}
                    />
                  ))}
                </Box>
              </Grid>
            </Grid>

            {/* Header Section Container to fix cropping */}
            <Box sx={{ position: 'relative', mb: 6 }}>
              <Box
                sx={{
                  p: { xs: 2, sm: 4 },
                  position: 'relative',
                  display: 'flex',
                  flexDirection: 'column',
                  transition: 'all 0.4s ease',
                }}
              >
                <WashiTape
                  color={
                    CATEGORY_THEMES[event.category?.slug || '']?.tape ||
                    'rgba(37, 99, 235, 0.4)'
                  }
                  rotate={event.category?.slug === 'comedy' ? '10deg' : '3deg'}
                />
                <Box
                  sx={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: 2,
                    mb: 2,
                    position: 'relative',
                    zIndex: 1,
                  }}
                >
                  {event.category && (
                    <Chip
                      label={event.category.name}
                      sx={{
                        bgcolor: 'primary.main',
                        color: 'white',
                        fontFamily: '"Permanent Marker"',
                      }}
                    />
                  )}
                  <Chip
                    label={LIFECYCLE_LABELS[event.lifecycle_state]}
                    variant={event.lifecycle_state === 'live' ? 'filled' : 'outlined'}
                    sx={{
                      fontWeight: 'bold',
                      fontFamily: '"Permanent Marker"',
                      bgcolor:
                        event.lifecycle_state === 'live'
                          ? 'success.main'
                          : 'transparent',
                      color:
                        event.lifecycle_state === 'live'
                          ? 'white'
                          : event.category?.icon === 'cpu'
                            ? '#fff'
                            : 'inherit',
                      borderColor: event.category?.icon === 'cpu' ? '#fff' : 'inherit',
                      boxShadow:
                        event.lifecycle_state === 'live'
                          ? '0 0 15px rgba(34, 197, 94, 0.5)'
                          : 'none',
                    }}
                  />
                  {['published', 'at_risk', 'event_ready'].includes(
                    event.lifecycle_state,
                  ) &&
                    event.category?.icon !== 'cpu' && (
                      <Box
                        component="button"
                        onClick={() => {
                          if (!isAuthenticated) {
                            navigate('/signin');
                            return;
                          }
                          toggleInterest.mutate({
                            eventId: event.id,
                            isInterested: !event.user_is_interested,
                          });
                        }}
                        sx={{
                          width: 80,
                          height: 80,
                          border: '3px solid rgba(239, 68, 68, 0.6)',
                          borderRadius: '50%',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          transform: 'rotate(-15deg)',
                          position: 'absolute',
                          top: -10,
                          right: 20,
                          zIndex: 2,
                          cursor: 'pointer',
                          bgcolor: event.user_is_interested
                            ? 'rgba(239, 68, 68, 0.15)'
                            : 'transparent',
                          transition: 'all 0.2s',
                          '&:hover': {
                            transform: 'rotate(-10deg) scale(1.05)',
                            bgcolor: 'rgba(239, 68, 68, 0.1)',
                          },
                        }}
                      >
                        <Typography
                          sx={{
                            color: 'rgba(239, 68, 68, 0.6)',
                            fontFamily: '"Permanent Marker"',
                            fontSize: '0.7rem',
                            textAlign: 'center',
                            lineHeight: 1,
                          }}
                        >
                          {event.user_is_interested ? (
                            <>
                              SAVED
                              <br />
                              DATE
                            </>
                          ) : (
                            <>
                              SAVE THE
                              <br />
                              DATE
                            </>
                          )}
                        </Typography>
                      </Box>
                    )}
                </Box>
                <Box sx={{ pr: { xs: 0, sm: '240px' } }}>
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      flexWrap: 'wrap',
                      gap: 2,
                      mb: 2,
                    }}
                  >
                    <Typography
                      variant="h1"
                      sx={{
                        fontSize: { xs: '2.5rem', md: '4rem' },
                        position: 'relative',
                        zIndex: 1,
                        color: 'inherit',
                        textShadow:
                          event.category?.slug === 'comedy'
                            ? '2px 2px 0px #fbbf24'
                            : 'none',
                        wordBreak: 'break-word',
                      }}
                    >
                      {event.title}
                    </Typography>

                    {isAuthenticated && (
                      <IconButton
                        onClick={() =>
                          toggleInterest.mutate({
                            eventId: event.id,
                            isInterested: !event.user_is_interested,
                          })
                        }
                        sx={{
                          bgcolor: event.user_is_interested
                            ? 'rgba(239, 68, 68, 0.1)'
                            : 'rgba(255,255,255,0.5)',
                          border: '2px solid',
                          borderColor: event.user_is_interested ? '#ef4444' : '#333',
                          '&:hover': {
                            bgcolor: event.user_is_interested
                              ? 'rgba(239, 68, 68, 0.2)'
                              : 'rgba(255,255,255,0.8)',
                            transform: 'scale(1.1) rotate(5deg)',
                          },
                          transition: 'all 0.2s',
                          p: 1.5,
                          boxShadow: '3px 3px 0px rgba(0,0,0,0.1)',
                        }}
                      >
                        <Heart
                          size={32}
                          fill={event.user_is_interested ? '#ef4444' : 'transparent'}
                          color={event.user_is_interested ? '#ef4444' : '#333'}
                        />
                      </IconButton>
                    )}
                  </Box>

                  <Grid
                    container
                    spacing={2}
                    sx={{
                      color: 'inherit',
                      opacity: 0.8,
                      position: 'relative',
                      zIndex: 1,
                    }}
                  >
                    <Grid
                      size="auto"
                      sx={{ display: 'flex', alignItems: 'center', gap: 1 }}
                    >
                      <Calendar size={18} />
                      <Typography>
                        {new Date(event.start_time).toLocaleDateString()}
                      </Typography>
                    </Grid>
                    <Grid
                      size="auto"
                      sx={{ display: 'flex', alignItems: 'center', gap: 1 }}
                    >
                      <Clock size={18} />
                      <Typography>
                        {new Date(event.start_time).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </Typography>
                    </Grid>
                    {event.location_name && (
                      <Grid
                        size="auto"
                        sx={{ display: 'flex', alignItems: 'center', gap: 1 }}
                      >
                        <MapPin size={18} />
                        <Typography>{event.location_name}</Typography>
                      </Grid>
                    )}
                  </Grid>
                </Box>
              </Box>

              {/* Host Card Placement - Sibling to Background to fix cropping */}
              <Box
                sx={{
                  position: 'absolute',
                  bottom: -40,
                  right: { xs: 20, md: 40 },
                  zIndex: 10,
                  display: { xs: 'none', sm: 'block' },
                }}
              >
                <HostCard
                  host={event.host}
                  rating={event.average_rating ?? undefined}
                  tag={
                    event.category?.name === 'Photography'
                      ? 'Photographer'
                      : 'Vibe Architect'
                  }
                />
              </Box>
            </Box>

            {/* Mobile Host details */}
            <Box
              sx={{ display: { xs: 'block', sm: 'none' }, mb: 4, textAlign: 'center' }}
            >
              <HostCard
                host={event.host}
                rating={event.average_rating ?? undefined}
                tag={
                  event.category?.name === 'Photography'
                    ? 'Photographer'
                    : 'Vibe Architect'
                }
              />
            </Box>

            {/* Content Section based on State */}
            <Grid container spacing={6}>
              {/* Left Column: Info & Actions */}
              <Grid size={{ xs: 12, md: 6 }}>
                <Box sx={{ spaceY: 6 }}>
                  {/* Description */}
                  <Paper
                    sx={{
                      p: 4,
                      position: 'relative',
                      bgcolor: ['utensils', 'book-open'].includes(
                        event.category?.icon || '',
                      )
                        ? '#fdf8f4'
                        : '#fff',
                      color: 'inherit',
                    }}
                  >
                    <WashiTape color="rgba(22, 163, 74, 0.3)" rotate="-2deg" />
                    <Typography
                      variant="h6"
                      sx={{ fontFamily: '"Permanent Marker"', mb: 2 }}
                    >
                      The Details
                    </Typography>
                    <Typography sx={{ lineHeight: 1.8, whiteSpace: 'pre-wrap', mb: 4 }}>
                      {event.description}
                    </Typography>

                    {/* Check-in Memo - Sibling to description */}
                    {event.check_in_instructions &&
                      (event.user_has_ticket || isHost) && (
                        <Box sx={{ mt: 4, mb: 4 }}>
                          <CheckInMemo instructions={event.check_in_instructions} />
                        </Box>
                      )}

                    {event.location_name && (
                      <Box sx={{ mt: 4 }}>
                        <Typography
                          variant="caption"
                          sx={{ display: 'block', mb: 1, fontWeight: 'bold' }}
                        >
                          LOCATION
                        </Typography>
                        <MapPlaceholder
                          location={event.location_address || event.location_name}
                        />
                      </Box>
                    )}
                  </Paper>

                  {/* Capacity Infographic - Only if highlights exist, otherwise move to right */}
                  {event.capacity && highlights.length > 0 && (
                    <Box sx={{ mt: 6, display: 'flex', justifyContent: 'center' }}>
                      <CapacityInfographic
                        capacity={event.capacity}
                        filled={event.ticket_count}
                      />
                    </Box>
                  )}

                  {/* Ticket Stubs (if applicable) - Always on Left */}
                  {['published', 'at_risk', 'event_ready'].includes(
                    event.lifecycle_state,
                  ) &&
                    !event.user_has_ticket &&
                    !isHost && (
                      <Box sx={{ mt: 6 }}>
                        <Typography
                          variant="h6"
                          sx={{ fontFamily: '"Permanent Marker"', mb: 3 }}
                        >
                          Get Your Tickets
                        </Typography>
                        <TicketStub
                          type="Standard"
                          price={parseFloat(event.ticket_price_standard || '0')}
                          onBuy={() => handleBuyTicket('standard')}
                          isLoading={purchaseTicket.isPending}
                        />
                        {event.ticket_price_flexible && (
                          <TicketStub
                            type="Flexible"
                            price={parseFloat(event.ticket_price_flexible)}
                            onBuy={() => handleBuyTicket('flexible')}
                            isLoading={purchaseTicket.isPending}
                          />
                        )}
                      </Box>
                    )}

                  {['published', 'at_risk', 'event_ready'].includes(
                    event.lifecycle_state,
                  ) &&
                    (event.user_has_ticket || isHost) && (
                      <Box sx={{ mt: 6 }}>
                        <Typography
                          variant="h6"
                          sx={{ fontFamily: '"Permanent Marker"', mb: 3 }}
                        >
                          Get Your Tickets
                        </Typography>
                        <TicketStub
                          type="Standard"
                          price={parseFloat(event.ticket_price_standard || '0')}
                          onBuy={() => handleBuyTicket('standard')}
                          isLoading={purchaseTicket.isPending}
                          hasTicket={event.user_has_ticket || isHost}
                        />
                        {event.ticket_price_flexible && (
                          <TicketStub
                            type="Flexible"
                            price={parseFloat(event.ticket_price_flexible)}
                            onBuy={() => handleBuyTicket('flexible')}
                            isLoading={purchaseTicket.isPending}
                            hasTicket={event.user_has_ticket || isHost}
                          />
                        )}
                      </Box>
                    )}

                  {/* Vendor Needs - Classified Ads - Only if highlights exist, otherwise move to right */}
                  {displayNeeds.length > 0 && highlights.length > 0 && (
                    <Box sx={{ mt: 6 }}>
                      <Typography
                        variant="h6"
                        sx={{ fontFamily: '"Permanent Marker"', mb: 3 }}
                      >
                        Host is Looking For...
                      </Typography>
                      {displayNeeds.map((need: any) => {
                        const myServices = myServicesResponse?.data || [];
                        const isEligible = myServices.some(
                          (s: any) =>
                            s.category
                              .toLowerCase()
                              .includes(need.category.toLowerCase()) ||
                            need.category
                              .toLowerCase()
                              .includes(s.category.toLowerCase()),
                        );
                        const isOpportunity =
                          isAuthenticated && !isEligible && need.status === 'open';
                        return (
                          <ClassifiedAd
                            key={need.id}
                            need={need}
                            isEligible={isEligible}
                            isOpportunity={isOpportunity}
                            onInquire={(n) => {
                              setSelectedNeed(n);
                              setIsApplyModalOpen(true);
                            }}
                            navigate={navigate}
                          />
                        );
                      })}
                    </Box>
                  )}
                </Box>
              </Grid>

              {/* Right Column: Community / Highlights or Infrastructure when Left is full */}
              <Grid
                size={{ xs: 12, md: 6 }}
                sx={{ display: 'flex', flexDirection: 'column' }}
              >
                {/* If not live/completed OR highlights are empty, we move infrastructure here */}
                {(!['live', 'completed'].includes(event.lifecycle_state) ||
                  highlights.length === 0) && (
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {/* Capacity Infographic (Moved from left if empty right) */}
                    {event.capacity && highlights.length === 0 && (
                      <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                        <CapacityInfographic
                          capacity={event.capacity}
                          filled={event.ticket_count}
                        />
                      </Box>
                    )}

                    {/* Vendor Needs (Moved from left if empty right) */}
                    {displayNeeds.length > 0 && highlights.length === 0 && (
                      <Box>
                        <Typography
                          variant="h6"
                          sx={{
                            fontFamily: '"Permanent Marker"',
                            mb: 3,
                            textAlign: 'center',
                          }}
                        >
                          Host is Looking For...
                        </Typography>
                        {displayNeeds.map((need: any) => {
                          const myServices = myServicesResponse?.data || [];
                          const isEligible = myServices.some(
                            (s: any) =>
                              s.category
                                .toLowerCase()
                                .includes(need.category.toLowerCase()) ||
                              need.category
                                .toLowerCase()
                                .includes(s.category.toLowerCase()),
                          );
                          const isOpportunity =
                            isAuthenticated && !isEligible && need.status === 'open';
                          return (
                            <ClassifiedAd
                              key={need.id}
                              need={need}
                              isEligible={isEligible}
                              isOpportunity={isOpportunity}
                              onInquire={(n) => {
                                setSelectedNeed(n);
                                setIsApplyModalOpen(true);
                              }}
                              navigate={navigate}
                            />
                          );
                        })}
                      </Box>
                    )}
                  </Box>
                )}

                {['live', 'completed'].includes(event.lifecycle_state) && (
                  <Box sx={{ mt: highlights.length === 0 ? 6 : 0 }}>
                    <Typography variant="h2" sx={{ mb: 4, textAlign: 'center' }}>
                      Memory Box
                    </Typography>

                    {/* Highlights */}
                    {highlights.length > 0 && (
                      <Grid container spacing={3} sx={{ mb: 6 }}>
                        {highlights.map((h: any) => (
                          <Grid size={{ xs: 6 }} key={h.id}>
                            <PolaroidFrame
                              src={h.media_file}
                              caption={h.text}
                              author={h.author_username}
                            />
                          </Grid>
                        ))}
                      </Grid>
                    )}

                    <MuiButton
                      fullWidth
                      variant="outlined"
                      onClick={() => setIsHighlightOpen(true)}
                      sx={{
                        fontFamily: '"Permanent Marker"',
                        p: 2,
                        border: '2px dashed #ccc',
                        mb: 6,
                      }}
                    >
                      + Add to the pile
                    </MuiButton>

                    {/* Reviews */}
                    {event.lifecycle_state === 'completed' && (
                      <Box>
                        <Typography variant="h3" sx={{ mb: 4 }}>
                          What people said
                        </Typography>
                        {reviews.length > 0 ? (
                          reviews.map((rev: any, idx: number) => (
                            <PostItNote
                              key={rev.id}
                              username={rev.username}
                              rating={rev.rating}
                              comment={rev.comment}
                              avatar={rev.avatar}
                              vendorReviews={rev.vendorReviews}
                              color={['#fff740', '#ff7eb9', '#7afcff'][idx % 3]}
                            />
                          ))
                        ) : (
                          <Typography
                            sx={{
                              fontStyle: 'italic',
                              color: 'text.secondary',
                              textAlign: 'center',
                            }}
                          >
                            No sticky notes yet.
                          </Typography>
                        )}

                        <MuiButton
                          fullWidth
                          variant="contained"
                          onClick={() => setIsReviewOpen(true)}
                          sx={{
                            bgcolor: 'warning.main',
                            color: 'black',
                            fontWeight: 'bold',
                            '&:hover': { bgcolor: '#f59e0b' },
                            mt: 2,
                          }}
                        >
                          Leave a Review
                        </MuiButton>
                      </Box>
                    )}
                  </Box>
                )}
              </Grid>
            </Grid>
          </CategoricalBackground>
        </Box>

        {/* Modals from original logic */}
        {selectedNeed && (
          <ApplyToNeedModal
            isOpen={isApplyModalOpen}
            onClose={() => {
              setIsApplyModalOpen(false);
              setTimeout(() => setSelectedNeed(null), 200);
            }}
            needId={selectedNeed.id}
            needTitle={selectedNeed.title}
          />
        )}
        <HighlightComposer
          eventId={Number(id)}
          isOpen={isHighlightOpen}
          onOpenChange={setIsHighlightOpen}
        />
        {event && (
          <ReviewComposer
            eventId={Number(id)}
            eventName={event.title}
            participatingVendors={event.participating_vendors}
            isOpen={isReviewOpen}
            onOpenChange={setIsReviewOpen}
          />
        )}
        <TicketConfirmationModal
          isOpen={!!confirmedTicket}
          onClose={() => setConfirmedTicket(null)}
          eventTitle={event?.title || ''}
          ticketType={confirmedTicket?.type || ''}
          price={confirmedTicket?.price || '0'}
        />
      </Box>
    </ThemeProvider>
  );
}
