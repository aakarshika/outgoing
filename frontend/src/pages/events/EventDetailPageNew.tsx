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
import { EventLocationMap } from '@/components/events/EventLocationMap';
import { HighlightComposer } from '@/components/events/HighlightComposer';
import { ReviewComposer } from '@/components/events/ReviewComposer';
import { TicketConfirmationModal } from '@/components/events/TicketConfirmationModal';
import { TicketManagementModal } from '@/components/events/TicketManagementModal';
import { TicketingServiceModal } from '@/components/events/TicketingServiceModal';
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
  useEventStory,
  usePurchaseTicket,
  useRecordEventView,
  useToggleInterest,
} from '@/features/events/hooks';
import { scrapbookTheme } from '@/features/events/theme/scrapbookTheme';
import { useEventNeeds } from '@/features/needs/hooks';
import { useMyServices } from '@/features/vendors/hooks';

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

const Highlighter = ({
  children,
  color = 'rgba(252, 211, 77, 0.6)',
}: {
  children: React.ReactNode;
  color?: string;
}) => (
  <Box
    component="span"
    sx={{
      position: 'relative',
      display: 'inline-block',
      px: 1,
      zIndex: 1,
      '&::after': {
        content: '""',
        position: 'absolute',
        top: '50%',
        left: '-5%',
        width: '110%',
        height: '80%',
        bgcolor: color,
        transform: 'translateY(-50%) rotate(-1deg)',
        zIndex: -1,
        borderRadius: '2px',
        opacity: 0.8,
      },
    }}
  >
    {children}
  </Box>
);

const getDaysAgo = (dateStr: string) => {
  const start = new Date(dateStr);
  const now = new Date('2026-03-06T23:26:31-05:00'); // Updated timestamp
  const diffTime = Math.abs(now.getTime() - start.getTime());
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  if (diffDays === 0) return 'today';
  return diffDays === 1 ? '1 day ago' : `${diffDays} days ago`;
};

const CuteTimer = ({ targetDate }: { targetDate: string }) => {
  const [timeLeft, setTimeLeft] = useState({ d: 0, h: 0, m: 0, s: 0 });

  useEffect(() => {
    const calculate = () => {
      const now = new Date();
      const target = new Date(targetDate);
      const diff = target.getTime() - now.getTime();

      if (diff <= 0) {
        setTimeLeft({ d: 0, h: 0, m: 0, s: 0 });
        return;
      }

      setTimeLeft({
        d: Math.floor(diff / (1000 * 60 * 60 * 24)),
        h: Math.floor((diff / (1000 * 60 * 60)) % 24),
        m: Math.floor((diff / 1000 / 60) % 60),
        s: Math.floor((diff / 1000) % 60),
      });
    };
    calculate();
    const interval = setInterval(calculate, 1000);
    return () => clearInterval(interval);
  }, [targetDate]);

  const colors = [
    { bg: '#fef08a', border: '#ca8a04', text: '#854d0e' }, // Yellow
    { bg: '#fecdd3', border: '#e11d48', text: '#9f1239' }, // Pink
    { bg: '#bfdbfe', border: '#2563eb', text: '#1e3a8a' }, // Blue
    { bg: '#bbf7d0', border: '#16a34a', text: '#14532d' }, // Green
  ];

  return (
    <Box sx={{ display: 'flex', gap: 1.5, mt: 1 }}>
      {Object.entries(timeLeft).map(([unit, value], index) => {
        const color = colors[index % colors.length];
        return (
          <Box
            key={unit}
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              animation: `pulse ${2 + index * 0.5}s infinite alternate`,
              '@keyframes pulse': {
                '0%': { transform: 'scale(1)' },
                '100%': { transform: 'scale(1.05)' },
              },
            }}
          >
            <Box
              sx={{
                width: 38,
                height: 38,
                borderRadius: index % 2 === 0 ? '40% 60% 70% 30% / 40% 50% 60% 50%' : '50% 50% 30% 70% / 50% 40% 60% 50%',
                border: `2px solid ${color.border}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                bgcolor: color.bg,
                transform: `rotate(${Math.random() * 10 - 5}deg)`,
                boxShadow: '2px 3px 0px rgba(0,0,0,0.15)',
                position: 'relative',
                '&::after': {
                  content: '""',
                  position: 'absolute',
                  top: '10%',
                  right: '15%',
                  width: '20%',
                  height: '20%',
                  bgcolor: 'rgba(255,255,255,0.6)',
                  borderRadius: '50%',
                }
              }}
            >
              <Typography sx={{ fontFamily: '"Fredoka One", "Permanent Marker", cursive', fontSize: '1.2rem', color: color.text }}>
                {value}
              </Typography>
            </Box>
            <Typography
              sx={{
                fontSize: '0.65rem',
                fontFamily: '"Caveat", cursive',
                mt: 0.5,
                fontWeight: 'bold',
                color: 'text.secondary',
                letterSpacing: 1,
                textTransform: 'uppercase',
              }}
            >
              {unit === 'd' ? 'days' : unit === 'h' ? 'hrs' : unit === 'm' ? 'min' : 'sec'}
            </Typography>
          </Box>
        );
      })}
    </Box>
  );
};

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
  color,
  onBuy,
  isLoading,
}: {
  type: string;
  price: number;
  color?: string;
  onBuy: () => void;
  isLoading?: boolean;
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
    <WashiTape color={color ? `${color}44` : "rgba(0,0,0,0.1)"} />
    <Box
      sx={{
        p: 2,
        borderRight: '2px dashed #e0d8c0',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        minWidth: 100,
        bgcolor: color || 'transparent',
        color: color ? 'white' : 'inherit',
      }}
    >
      <Typography
        variant="caption"
        sx={{ fontWeight: 'bold', color: color ? 'white' : 'text.secondary', letterSpacing: 1 }}
      >
        ADMIT ONE
      </Typography>
      <Typography
        variant="h5"
        sx={{ fontFamily: '"Permanent Marker"', color: color ? 'white' : 'primary.main', mt: 1 }}
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
    </Box>
  </Paper>
);

const PurchasedTicketStack = ({
  tickets,
  onBuyMore,
  onManage,
  isLoading
}: {
  tickets: any[],
  onBuyMore: () => void,
  onManage: (ticketId: number) => void,
  isLoading?: boolean
}) => {
  if (tickets.length === 0) return null;

  return (
    <Box sx={{ position: 'relative', mb: 4, pt: tickets.length > 1 ? (tickets.length - 1) * 2 : 0 }}>
      {tickets.map((t, idx) => {
        const isTop = idx === tickets.length - 1;
        const offset = (tickets.length - 1 - idx) * 16; // 16px offset for each layer

        return (
          <Paper
            key={t.id}
            elevation={isTop ? 2 : 1}
            onClick={() => onManage(t.id)}
            sx={{
              display: 'flex',
              position: isTop ? 'relative' : 'absolute',
              top: isTop ? 0 : -offset,
              left: isTop ? 0 : offset / 2,
              width: '100%',
              bgcolor: '#fff9e6',
              border: '1px solid #e0d8c0',
              transform: `rotate(${isTop ? 1 : (idx % 2 === 0 ? -1 : 1)}deg)`,
              zIndex: idx,
              overflow: 'visible',
              cursor: 'pointer',
              transition: 'transform 0.2s',
              opacity: isTop ? 1 : 0.8,
              '&:hover': isTop ? { transform: 'rotate(0deg) translateY(-4px)', zIndex: 100 } : {},
              visibility: !isTop && idx < tickets.length - 5 ? 'hidden' : 'visible' // Max 5 visible in stack
            }}
          >
            <WashiTape color={t.color ? `${t.color}44` : "rgba(22, 163, 74, 0.2)"} />
            <Box
              sx={{
                p: 2,
                borderRight: '2px dashed #e0d8c0',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center',
                minWidth: 100,
                bgcolor: t.color || '#22c55e',
                color: 'white',
              }}
            >
              <Typography variant="caption" sx={{ fontWeight: 'bold', letterSpacing: 1 }}>
                {t.status === 'cancelled' ? 'void' : 'PAID'}
              </Typography>
              <Typography variant="h6" sx={{ fontFamily: '"Permanent Marker"', mt: 1 }}>
                ${parseFloat(t.price_paid).toFixed(2)}
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
              <Typography variant="h6" sx={{ fontFamily: '"Permanent Marker"', fontSize: '1.2rem' }}>
                {t.ticket_type} Pass
              </Typography>
              <Typography variant="body2" sx={{ fontWeight: 'bold', mt: 0.5 }}>
                Guest: {t.guest_name || 'Self'} {tickets.length > 1 && isTop && `(+${tickets.length - 1} more)`}
              </Typography>

              {isTop && (
                <MuiButton
                  variant="outlined"
                  size="small"
                  onClick={(e) => {
                    e.stopPropagation();
                    onBuyMore();
                  }}
                  disabled={isLoading}
                  sx={{
                    mt: 1.5,
                    borderRadius: 0,
                    border: '1px solid #333',
                    color: '#333',
                    alignSelf: 'flex-start',
                    '&:hover': { border: '1px solid #000', bgcolor: 'rgba(0,0,0,0.05)' },
                  }}
                >
                  BUY MORE
                </MuiButton>
              )}
            </Box>
          </Paper>
        );
      })}
    </Box>
  );
};

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
}) => {
  const assigned_vendor = need.applications.find((app: any) => app.status === 'accepted');
  console.log(assigned_vendor)
  return (
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
                onClick={() => navigate(`/vendors/create?category=${need.category}`)}
                sx={{
                  borderRadius: 0,
                  borderColor: '#001708ff',
                  color: '#001708ff',
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
                vendor_name: assigned_vendor?.vendor_name || 'Assigned Vendor',
                category: need.category,
                avg_rating: 4.8,
                event_count: 12,
              }}
              onClick={() => {
                if (assigned_vendor.service) {
                  navigate(`/services/${assigned_vendor.service}`);
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
  )
};

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
  const { data: storyResponse } = useEventStory(Number(id));
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
    needsAadharVerification?: boolean;
  } | null>(null);
  const [isTicketingModalOpen, setIsTicketingModalOpen] = useState(false);
  const [isManageTicketOpen, setIsManageTicketOpen] = useState(false);
  const [manageInitialIndex, setManageInitialIndex] = useState(0);

  useEffect(() => {
    if (isAuthenticated && Number(id)) {
      recordView.mutate();
    }
  }, [id, isAuthenticated]);

  const event = eventResponse?.data;
  const story = storyResponse?.data;
  const needs = needsResponse?.data || [];
  const highlights = story?.highlights || event?.highlights || [];

  const reviews = useMemo(() => {
    const baseReviews = story?.reviews || event?.reviews || [];
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
  }, [event, story]);

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

  const handleBuyTicket = () => {
    if (!isAuthenticated) return navigate('/signin');
    setIsTicketingModalOpen(true);
  };

  const handleManageTicket = (ticketId?: number) => {
    if (ticketId && event?.user_tickets) {
      const idx = event.user_tickets.findIndex((t: any) => t.id === ticketId);
      setManageInitialIndex(idx >= 0 ? idx : 0);
    } else {
      setManageInitialIndex(0);
    }
    setIsManageTicketOpen(true);
  };

  const handleTicketingSuccess = (ticketsData: any[]) => {
    setIsTicketingModalOpen(false);
    toast.success('Tickets purchased successfully!');
    if (ticketsData.length > 0) {
      setConfirmedTicket({
        type: ticketsData.length > 1 ? 'Multiple' : ticketsData[0].ticket_type,
        price: ticketsData.reduce((sum, t) => sum + Number(t.price_paid), 0).toString(),
        needsAadharVerification: ticketsData[0]?.needs_aadhar_verification,
      });
    }
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
            {/* Status Banner */}
            {['live', 'completed', 'published', 'event_ready'].includes(event.lifecycle_state) && (
              <Box
                sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  mb: 4,
                  mt: -2,
                  position: 'relative',
                  zIndex: 2,
                }}
              >
                {event.lifecycle_state === 'live' ? (
                  <Typography
                    sx={{
                      fontFamily: '"Permanent Marker", cursive',
                      fontSize: { xs: '1.2rem', md: '1.8rem' },
                      color: '#92400e', // Amber 800
                      transform: 'rotate(-2deg)',
                    }}
                  >
                    <Highlighter color="rgba(251, 191, 36, 0.7)">happening now!</Highlighter>
                  </Typography>
                ) : event.lifecycle_state === 'completed' ? (
                  <Box sx={{ textAlign: 'center', transform: 'rotate(1deg)' }}>
                    <Typography
                      sx={{
                        fontFamily: '"Permanent Marker", cursive',
                        fontSize: { xs: '1.1rem', md: '1.5rem' },
                        color: 'text.secondary',
                        mb: 0.5,
                      }}
                    >
                      check out the highlights
                    </Typography>
                    <Typography
                      variant="body2"
                      sx={{
                        fontFamily: 'serif',
                        fontStyle: 'italic',
                        color: 'text.disabled',
                        fontWeight: 'bold',
                      }}
                    >
                      {getDaysAgo(event.start_time)}
                    </Typography>
                  </Box>
                ) : event.lifecycle_state === 'published' ? (
                  <Box sx={{ textAlign: 'center', transform: 'rotate(-1deg)' }}>
                    <Typography
                      sx={{
                        fontFamily: '"Permanent Marker", cursive',
                        fontSize: { xs: '1.1rem', md: '1.4rem' },
                        color: 'rgba(37, 99, 235, 0.8)', // Primary blue
                        mb: 0.5,
                      }}
                    >
                      posted {getDaysAgo(event.created_at)}
                    </Typography>
                  </Box>
                ) : event.lifecycle_state === 'event_ready' ? (
                  <Box
                    sx={{
                      textAlign: 'center',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: 0.5,
                    }}
                  >
                    <Typography
                      sx={{
                        fontFamily: '"Permanent Marker", cursive',
                        fontSize: { xs: '1.2rem', md: '1.6rem' },
                        color: '#16a34a', // Green 600
                        transform: 'rotate(2deg)',
                      }}
                    >
                      Live in...
                    </Typography>
                    <CuteTimer targetDate={event.start_time} />
                  </Box>
                ) : null}
              </Box>
            )}

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
                        <EventLocationMap
                          locationName={event.location_name}
                          locationAddress={event.location_address}
                          latitude={event.latitude}
                          longitude={event.longitude}
                        />
                      </Box>
                    )}
                  </Paper>

                  {/* ═══ Tablets Section — Event Features ═══ */}
                  {(() => {
                    const TAG_DISPLAY: Record<string, { label: string; emoji: string; bg: string; border: string; text: string; chipBg: string }> = {
                      featured: { label: 'Featured', emoji: '⭐', bg: '#fef3c7', border: '#f59e0b', text: '#92400e', chipBg: '#fef9c3' },
                      additional: { label: 'Additional', emoji: '➕', bg: '#dbeafe', border: '#3b82f6', text: '#1e40af', chipBg: '#eff6ff' },
                      extra: { label: 'Extra', emoji: '🎁', bg: '#d1fae5', border: '#10b981', text: '#065f46', chipBg: '#ecfdf5' },
                    };
                    const FEATURE_EMOJI_MAP: Record<string, string> = {
                      'Food': '🍕', 'Non-Alcoholic Drinks': '🧃', 'Alcoholic Drinks': '🍷',
                      'Music': '🎵', 'DJ': '🎧', 'Live Band': '🎸', 'Games': '🎮',
                      'Photo Booth': '📸', 'Surprise Gifts': '🎁', 'Educational Activities': '📚',
                      'Group Activities': '👥', 'Networking': '🤝', 'Dance Floor': '💃',
                      'Workshops': '🔧', 'Art': '🎨', 'Karaoke': '🎤', 'Bonfire': '🔥',
                      'Fireworks': '🎆', 'Pool': '🏊', 'Outdoor Seating': '⛱️',
                      'Indoor Seating': '🪑', 'Decorations': '🎀', 'Themed Costumes': '🎭',
                      'Raffle': '🎟️', 'Trivia': '🧠', 'Kids Zone': '🧒', 'Pet-Friendly': '🐾',
                      'Open Bar': '🍹', 'VIP Lounge': '✨', 'Parking': '🅿️',
                    };
                    const features = event.features || [];
                    const grouped: Record<string, { name: string; tag: string }[]> = {};
                    features.forEach((f: { name: string; tag: string }) => {
                      if (!grouped[f.tag]) grouped[f.tag] = [];
                      grouped[f.tag].push(f);
                    });
                    const tagOrder = ['featured', 'additional', 'extra'];

                    const allChips = tagOrder.flatMap(tag => {
                      const items = grouped[tag];
                      if (!items || items.length === 0) return [];
                      const cfg = TAG_DISPLAY[tag];
                      return items.map((f: { name: string; tag: string }, idx: number) => ({
                        ...f, cfg, idx,
                      }));
                    });

                    return (
                      <Box sx={{ mt: 3, display: 'flex', flexWrap: 'wrap', gap: 1, alignItems: 'center' }}>
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
                                transform: `rotate(${(idx % 2 === 0 ? -0.5 : 0.5)}deg)`,
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
                    );
                  })()}

                  {/* Capacity Infographic - Only if highlights exist, otherwise move to right */}
                  {event.capacity && highlights.length > 0 && (
                    <Box sx={{ mt: 6, display: 'flex', justifyContent: 'center' }}>
                      <CapacityInfographic
                        capacity={event.capacity}
                        filled={event.ticket_count}
                        startDate={event.start_time}
                      />
                    </Box>
                  )}

                  {/* Purchased Tickets (if applicable) */}
                  {event.user_tickets && event.user_tickets.length > 0 && (
                    <Box sx={{ mt: 6 }}>
                      <Typography
                        variant="h6"
                        sx={{ fontFamily: '"Permanent Marker"', mb: 3 }}
                      >
                        Your Purchased Tickets
                      </Typography>
                      {(() => {
                        // Group tickets by type
                        const groups: Record<string, any[]> = {};
                        event.user_tickets.forEach((t: any) => {
                          if (!groups[t.ticket_type]) groups[t.ticket_type] = [];
                          groups[t.ticket_type].push(t);
                        });

                        return Object.entries(groups).map(([type, tickets]) => (
                          <PurchasedTicketStack
                            key={type}
                            tickets={tickets}
                            onBuyMore={() => handleBuyTicket()}
                            onManage={(tid) => handleManageTicket(tid)}
                            isLoading={purchaseTicket.isPending}
                          />
                        ));
                      })()}
                    </Box>
                  )}

                  {/* Ticket Stubs (if applicable) - Always on Left */}
                  {event.ticket_tiers && event.ticket_tiers.length > 0 && (
                    <Box sx={{ mt: 6 }}>
                      {/* Only show tiers that have NOT been purchased yet */}
                      {(() => {
                        const boughtTypes = new Set(event.user_tickets?.map((t: any) => t.ticket_type) || []);
                        const availableTiers = event.ticket_tiers.filter((tier: any) => !boughtTypes.has(tier.name));

                        if (availableTiers.length === 0) return null;

                        return (
                          <>
                            <Typography
                              variant="h6"
                              sx={{ fontFamily: '"Permanent Marker"', mb: 3 }}
                            >
                              {(event.user_tickets?.length || 0) > 0 ? 'Get Additional Tickets' : 'Get Your Tickets'}
                            </Typography>
                            {availableTiers.map((tier: any) => (
                              <TicketStub
                                key={tier.id}
                                type={tier.name}
                                price={parseFloat(tier.price)}
                                color={tier.color}
                                onBuy={() => handleBuyTicket()}
                                isLoading={purchaseTicket.isPending}
                              />
                            ))}
                          </>
                        );
                      })()}
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
                            startDate={event.start_time}
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
                </Box>
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
        <TicketingServiceModal
          isOpen={isTicketingModalOpen}
          onClose={() => setIsTicketingModalOpen(false)}
          event={event}
          onSuccess={handleTicketingSuccess}
        />
        <TicketManagementModal
          isOpen={isManageTicketOpen}
          onClose={() => setIsManageTicketOpen(false)}
          tickets={event?.user_tickets || []}
          initialIndex={manageInitialIndex}
        />
        <TicketConfirmationModal
          isOpen={!!confirmedTicket}
          onClose={() => setConfirmedTicket(null)}
          eventTitle={event?.title || ''}
          ticketType={confirmedTicket?.type || ''}
          price={confirmedTicket?.price || '0'}
          needsAadharVerification={confirmedTicket?.needsAadharVerification}
        />
      </Box>
    </ThemeProvider>
  );
}
