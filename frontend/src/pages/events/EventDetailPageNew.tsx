import { Box, Grid, ThemeProvider } from '@mui/material';
import { Button as MuiButton, Typography } from '@mui/material';
import { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { toast } from 'sonner';

import { ApplyToNeedModal } from '@/components/events/ApplyToNeedModal';
import { HighlightComposer } from '@/components/events/HighlightComposer';
import { QuickBuyPopup } from '@/components/events/QuickBuyPopup';
import { ReviewComposer } from '@/components/events/ReviewComposer';
import { TicketConfirmationModal } from '@/components/events/TicketConfirmationModal';
import { TicketingServiceModal } from '@/components/events/TicketingServiceModal';
import { useAuth } from '@/features/auth/hooks';
import {
  CategoricalBackground,
  getCategoryTheme,
} from '@/features/events/CategoricalBackground';
import {
  useDeleteEventReview,
  useEvent,
  useEventSeriesOccurrences,
  useEventStory,
  usePurchaseTicket,
  useRecordEventView,
  useToggleInterest,
} from '@/features/events/hooks';
import { scrapbookTheme } from '@/features/events/theme/scrapbookTheme';
import { useEventNeeds } from '@/features/needs/hooks';
import { useMyServices } from '@/features/vendors/hooks';
import { useBackground } from '@/theme/BackgroundProvider';

import { AttendingList } from './components/AttendingList';
import { DetailsSection } from './components/DetailsSection';
import { HeroSection } from './components/HeroSection';
import { MemoryBoxSection } from './components/MemoryBoxSection';
import { ReviewsSection } from './components/ReviewsSection';
import { getDaysAgo } from './components/scrapbookHelpers';
import { ServicesSection } from './components/ServicesSection';
import { StatusBannerSection } from './components/StatusBannerSection';
import { TicketsSection } from './components/TicketsSection';
import { WhenWhereCard } from './components/WhenWhereCard';

// --- Main Page Component ---

export default function EventDetailPageNew() {
  const { setBackgroundComponent } = useBackground();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, user } = useAuth();
  const { data: eventResponse, isLoading } = useEvent(Number(id));
  const { data: needsResponse } = useEventNeeds(Number(id));
  const { data: myServicesResponse } = useMyServices({ enabled: !!isAuthenticated });
  const purchaseTicket = usePurchaseTicket();
  const toggleInterest = useToggleInterest();
  const { data: storyResponse } = useEventStory(Number(id));
  const recordView = useRecordEventView(Number(id));
  const { data: occurrencesResponse } = useEventSeriesOccurrences(
    eventResponse?.data?.series?.id ?? 0,
  );

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
  const [selectedTierId, setSelectedTierId] = useState<number | null>(null);
  const [selectedQuantity, setSelectedQuantity] = useState<number | null>(null);

  const [quickBuyData, setQuickBuyData] = useState<{
    tierId: number;
    quantity: number;
  } | null>(null);
  const [oneClickStatus, setOneClickStatus] = useState<
    'idle' | 'loading' | 'success' | 'error'
  >('idle');
  const [editReviewData, setEditReviewData] = useState<any>(null);
  const [clearTicketformTrigger, setClearTicketformTrigger] = useState(0);

  const deleteReview = useDeleteEventReview();

  const event = eventResponse?.data;
  const story = storyResponse?.data;
  const needs = needsResponse?.data || [];
  const occurrences = useMemo(() => {
    return (occurrencesResponse?.data || []).sort(
      (a: any, b: any) =>
        new Date(a.start_time).getTime() - new Date(b.start_time).getTime(),
    );
  }, [occurrencesResponse]);
  const highlights = story?.highlights || event?.highlights || [];

  useEffect(() => {
    if (isAuthenticated && Number(id)) {
      recordView.mutate();
    }
  }, [id, isAuthenticated]);

  useEffect(() => {
    if (event) {
      if (event.lifecycle_state === 'live') {
        setBackgroundComponent(
          <div
            className="fixed inset-0"
            style={{
              backgroundColor: '#fef3c7',
              backgroundImage: 'radial-gradient(#fde68a 0.5px, #ffdebdff 0.5px)',
              backgroundSize: '15px 15px',
              zIndex: -1,
              pointerEvents: 'none',
            }}
          />,
        );
      } else {
        setBackgroundComponent(
          <div
            className="fixed inset-0"
            style={{
              backgroundColor: '#fcfcf3ff',
              backgroundImage: 'radial-gradient(#d1d5db 0.5px, #f4f1ea 0.5px)',
              backgroundSize: '15px 15px',
              zIndex: -1,
              pointerEvents: 'none',
            }}
          />,
        );
      }
    }
  }, [event, setBackgroundComponent]);

  useEffect(() => {
    const handleScroll = (e: any) => {
      const sectionId = e.detail;
      const element = document.getElementById(sectionId);
      if (element) {
        setTimeout(() => {
          element.scrollIntoView({ behavior: 'smooth' });
        }, 100);
      }
    };

    const handleGlobalClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const anchor = target.closest('a');
      if (anchor && anchor.hash && anchor.origin === window.location.origin) {
        const sectionId = anchor.hash.replace('#', '');
        window.dispatchEvent(new CustomEvent('section-scroll', { detail: sectionId }));
      }
    };

    window.addEventListener('section-scroll', handleScroll as any);
    document.addEventListener('click', handleGlobalClick);

    // Initial load scroll
    if (location.hash) {
      const id = location.hash.replace('#', '');
      window.dispatchEvent(new CustomEvent('section-scroll', { detail: id }));
    }

    return () => {
      window.removeEventListener('section-scroll', handleScroll as any);
      document.removeEventListener('click', handleGlobalClick);
    };
  }, [location.hash, event]);

  const reviews = useMemo(() => {
    const baseReviews = story?.reviews || event?.reviews || [];
    return baseReviews.map((rev: any) => ({
      id: rev.id,
      username: rev.reviewer_username,
      rating: rev.rating,
      comment: rev.text,
      avatar: rev.reviewer_avatar,
      likesCount: rev.likes_count || 0,
      commentsCount: rev.comments_count || 0,
      userHasLiked: rev.user_has_liked || false,
      datetime: rev.created_at ? getDaysAgo(rev.created_at) : undefined,
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

  const handleBuyTicket = (tierId: number, _quantity: number) => {
    if (!isAuthenticated) return navigate('/signin');
    setSelectedTierId(tierId);
    setSelectedQuantity(_quantity);
    // For now, let's just open it with the tier selected.
    setIsTicketingModalOpen(true);
  };

  const handleOneClickBuy = (tierId: number, quantity: number) => {
    if (!isAuthenticated) return navigate('/signin');
    setQuickBuyData({ tierId, quantity });
    setOneClickStatus('idle');
  };

  const handleQuickBuyConfirm = ({
    guestName,
  }: {
    guestName: string;
    paymentMethod: string;
  }) => {
    if (!quickBuyData) return;
    setOneClickStatus('loading');

    const tickets = Array.from({ length: quickBuyData.quantity }).map((_, i) => ({
      tier_id: quickBuyData.tierId,
      guest_name: i === 0 ? guestName.trim() : '',
      is_18_plus: true,
    }));

    purchaseTicket.mutate(
      { eventId: Number(id), tickets },
      {
        onSuccess: (_res: any) => {
          setOneClickStatus('success');
          toast.success('Quick Buy Successful!');
          setTimeout(() => {
            setOneClickStatus('idle');
            setQuickBuyData(null);
            setClearTicketformTrigger((prev) => prev + 1);
          }, 3000);
        },
        onError: () => {
          setOneClickStatus('error');
          toast.error('Purchase failed');
          setTimeout(() => setOneClickStatus('idle'), 3000);
        },
      },
    );
  };

  const handleTicketingSuccess = (ticketsData: any[]) => {
    setIsTicketingModalOpen(false);
    toast.success('Tickets purchased successfully!');
    setClearTicketformTrigger((prev) => prev + 1);
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
            category={event?.category}
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
            {/* Section 1: Status Banner & Top Bar */}
            <StatusBannerSection
              event={event}
              isHost={isHost}
              isAuthenticated={isAuthenticated}
              navigate={navigate}
              toggleInterest={toggleInterest}
              occurrences={occurrences}
            />

            {/* Section 2: Hero — Image + Important Details */}
            <HeroSection
              event={event}
              isAuthenticated={isAuthenticated}
              navigate={navigate}
              toggleInterest={toggleInterest}
              highlights={highlights}
              occurrences={occurrences}
              displayNeedsCount={displayNeeds.length}
              displayNeeds={displayNeeds}
            />

            {/* Section 3: Content — Details + Tickets/Attendance */}
            <Grid container spacing={6}>
              {/* Left Column: Details */}
              <Grid size={{ xs: 12, md: 6 }}>
                <Box id="details">
                  <DetailsSection
                    event={event}
                    isHost={isHost}
                    displayNeeds={displayNeeds}
                  />
                </Box>
              </Grid>

              {/* Right Column: Tickets, Attendance, Services */}
              <Grid
                size={{ xs: 12, md: 6 }}
                sx={{ display: 'flex', flexDirection: 'column' }}
              >
                <Box id="tickets">
                  <TicketsSection
                    event={event}
                    purchaseTicket={purchaseTicket}
                    handleBuyTicket={handleBuyTicket}
                    handleOneClickBuy={handleOneClickBuy}
                    clearTicketformTrigger={clearTicketformTrigger}
                  />
                </Box>
              </Grid>
            </Grid>
            <Box id="services">
              <ServicesSection
                event={event}
                displayNeeds={displayNeeds}
                myServicesResponse={myServicesResponse}
                isAuthenticated={isAuthenticated}
                setSelectedNeed={setSelectedNeed}
                setIsApplyModalOpen={setIsApplyModalOpen}
                highlights={highlights}
              />
            </Box>
            {/* Section 4: Attending List */}
            <Box id="attending">
              <AttendingList attendees={event?.attendees || []} />
            </Box>

            {/* Section 5: Memory Box */}
            <Box sx={{ mt: highlights.length === 0 ? 6 : 0 }}>
              <Box id="highlights">
                <MemoryBoxSection
                  event={event}
                  highlights={highlights}
                  setIsHighlightOpen={setIsHighlightOpen}
                />
              </Box>

              {/* Section 6: Reviews */}
              <Box id="reviews">
                <ReviewsSection
                  isHost={isHost}
                  reviews={reviews}
                  currentUser={user}
                  userHasPurchased={event?.user_has_ticket || false}
                  setIsReviewOpen={(open) => {
                    setEditReviewData(null);
                    setIsReviewOpen(open);
                  }}
                  onEditReview={(review) => {
                    setEditReviewData(review);
                    setIsReviewOpen(true);
                  }}
                  onDeleteReview={(reviewId) => {
                    deleteReview.mutate(reviewId, {
                      onSuccess: () => toast.success('Review deleted successfully.'),
                      onError: () => toast.error('Failed to delete review.'),
                    });
                  }}
                />
              </Box>
            </Box>
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
            onOpenChange={(open) => {
              if (!open) {
                setTimeout(() => setEditReviewData(null), 200);
              }
              setIsReviewOpen(open);
            }}
            initialData={editReviewData}
          />
        )}
        <TicketingServiceModal
          isOpen={isTicketingModalOpen}
          onClose={() => {
            setIsTicketingModalOpen(false);
            setSelectedQuantity(null);
          }}
          event={event}
          user={user}
          selectedQuantity={selectedQuantity}
          selectedTierId={selectedTierId}
          onSuccess={handleTicketingSuccess}
        />

        <TicketConfirmationModal
          isOpen={!!confirmedTicket}
          onClose={() => {
            setConfirmedTicket(null);
            setSelectedQuantity(null);
          }}
          eventTitle={event?.title || ''}
          ticketType={confirmedTicket?.type || ''}
          price={confirmedTicket?.price || '0'}
          needsAadharVerification={confirmedTicket?.needsAadharVerification}
        />
        <QuickBuyPopup
          isOpen={!!quickBuyData}
          onClose={() => {
            setQuickBuyData(null);
            setOneClickStatus('idle');
            setSelectedQuantity(null);
          }}
          event={event}
          tierId={quickBuyData?.tierId ?? null}
          quantity={quickBuyData?.quantity || 1}
          user={user}
          status={oneClickStatus}
          onConfirm={handleQuickBuyConfirm}
        />
      </Box>
    </ThemeProvider>
  );
}
