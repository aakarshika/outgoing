import { Box, createTheme, ThemeProvider } from '@mui/material';
import { Button as MuiButton, Typography } from '@mui/material';
import { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { toast } from 'sonner';

import { HighlightComposer } from '@/components/events/HighlightComposer';
import { QuickBuyPopup } from '@/components/events/QuickBuyPopup';
import { ReviewComposer } from '@/components/events/ReviewComposer';
import { useAuth } from '@/features/auth/hooks';
import {
  useDeleteEventReview,
  useEvent,
  useEventSeriesOccurrences,
  useEventStory,
  usePurchaseTicket,
  useRecordEventView,
} from '@/features/events/hooks';
import { scrapbookTheme } from '@/features/events/theme/scrapbookTheme';
import { useEventNeeds } from '@/features/needs/hooks';
import { useMyServices } from '@/features/vendors/hooks';
import { useBackground } from '@/theme/BackgroundProvider';

import { getDaysAgo } from './components/scrapbookHelpers';
import { EventDetailV2Provider } from './event-detail-v2/modules/context';
import { buildEventDetailCapabilities } from './event-detail-v2/modules/shared/statePolicy';
import type { EventDetailV2ViewModel } from './event-detail-v2/modules/shared/types';
import { VariantRegistry } from './event-detail-v2/modules/VariantRegistry';
import { NormalTicketConfirmationModal } from './event-detail-v2/modules/variants/normal/components/NormalTicketConfirmationModal';
import { NormalTicketManagementModal } from './event-detail-v2/modules/variants/normal/components/NormalTicketManagementModal';
import { NormalTicketPurchaseModal } from './event-detail-v2/modules/variants/normal/components/NormalTicketPurchaseModal';

const modernTheme = createTheme({
  ...scrapbookTheme,
  palette: {
    ...scrapbookTheme.palette,
    primary: {
      main: '#0f172a',
    },
  },
  components: {
    ...scrapbookTheme.components,
    MuiPaper: {
      styleOverrides: {
        root: {
          boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
          border: '1px solid #e2e8f0',
        },
      },
    },
  },
});

export default function EventDetailPageV2() {
  const { setBackgroundComponent } = useBackground();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const themeParam = searchParams.get('theme');
  const themeVariant: 'comic' | 'normal' = themeParam === 'comic' ? 'comic' : 'normal';

  const { isAuthenticated, user } = useAuth();
  const { data: eventResponse, isLoading } = useEvent(Number(id));
  const { data: needsResponse } = useEventNeeds(Number(id));
  const { data: myServicesResponse } = useMyServices({ enabled: !!isAuthenticated });
  const purchaseTicket = usePurchaseTicket();
  const { data: storyResponse } = useEventStory(Number(id));
  const recordView = useRecordEventView(Number(id));
  const { data: occurrencesResponse } = useEventSeriesOccurrences(
    eventResponse?.data?.series?.id ?? 0,
  );

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
  const [selectedSelections, setSelectedSelections] = useState<
    Array<{ tierId: number; quantity: number }> | undefined
  >(undefined);
  const [selectedTicketId, setSelectedTicketId] = useState<number | null>(null);
  const [isTicketManagementModalOpen, setIsTicketManagementModalOpen] = useState(false);

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

  const event: any = eventResponse?.data;
  const story: any = storyResponse?.data;
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
      if (themeVariant === 'normal') {
        // Normal theme - neutral background handled by component
        setBackgroundComponent(null);
      } else if (event.lifecycle_state === 'live') {
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
  }, [event, setBackgroundComponent, themeVariant]);

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
    return <Box sx={{ p: 4 }}>Loading...</Box>;
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
  const hasTicket = Boolean(event.user_has_ticket);
  const isAcceptedVendor = Boolean(event.user_is_vendor);
  const capabilities = buildEventDetailCapabilities({
    lifecycleState: event.lifecycle_state,
    isHost,
    hasTicket,
    isAcceptedVendor,
  });

  if (!capabilities.canViewDraftPage) {
    return (
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '50vh',
          gap: 1.5,
        }}
      >
        <Typography sx={{ fontWeight: 600, textAlign: 'center', p: 4 }}>Seems like you're not authorized to be here</Typography>
        <Typography sx={{ color: 'text.secondary' }}>
          404
        </Typography>
        <MuiButton variant="contained" onClick={() => navigate('/')}>Go Home</MuiButton>
      </Box>
    );
  }

  const displayNeeds = needs.filter((n: any) => n.status !== 'cancelled');

  const canAccessEventChat = capabilities.canAccessEventChat;

  const handleBuyTicket = (tierId: number, _quantity: number) => {
    if (!isAuthenticated) return navigate('/signin');
    setSelectedTierId(tierId);
    setSelectedQuantity(_quantity);
    setSelectedSelections(undefined);
    setIsTicketingModalOpen(true);
  };

  const handleBuyMultiple = (
    selections: Array<{ tierId: number; quantity: number }>,
  ) => {
    if (!isAuthenticated) return navigate('/signin');
    setSelectedSelections(selections);
    setSelectedTierId(null);
    setSelectedQuantity(null);
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
          toast.success('Quick Buy successful!');
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

  const handleViewTicket = (ticketId: number) => {
    setSelectedTicketId(ticketId);
    setIsTicketManagementModalOpen(true);
  };

  const isEventOver = !['published', 'draft', 'postponed', 'event_ready'].includes(
    event.lifecycle_state,
  );

  const viewModel: EventDetailV2ViewModel = {
    event,
    user,
    isHost,
    isAcceptedVendor,
    hasTicket,
    isAuthenticated,
    isEventOver,
    canAccessEventChat,
    capabilities,
    highlights,
    reviews,
    occurrences,
    displayNeeds,
    displayNeedsCount: displayNeeds.length,
    myServicesResponse,
    purchaseTicket,
    clearTicketformTrigger,
    handleBuyTicket,
    handleBuyMultiple,
    handleOneClickBuy,
    onViewTicket: handleViewTicket,
    onOpenHighlightComposer: () => setIsHighlightOpen(true),
    onOpenReviewComposer: () => setIsReviewOpen(true),
    deleteReview,
    themeVariant,
  };

  const activeTheme = themeVariant === 'comic' ? scrapbookTheme : modernTheme;

  // Normal theme handles its own layout entirely
  return (
    <EventDetailV2Provider value={viewModel}>
      <ThemeProvider theme={activeTheme}>
        <VariantRegistry variant={themeVariant} />

        <HighlightComposer
          eventId={Number(id)}
          isOpen={isHighlightOpen}
          onOpenChange={setIsHighlightOpen}
        />

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

        <NormalTicketPurchaseModal
          isOpen={isTicketingModalOpen}
          onClose={() => {
            setIsTicketingModalOpen(false);
            setSelectedQuantity(null);
          }}
          event={event}
          user={user}
          selectedQuantity={selectedQuantity}
          selectedTierId={selectedTierId}
          selections={selectedSelections}
          onSuccess={handleTicketingSuccess}
        />


        <NormalTicketConfirmationModal
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
        <NormalTicketManagementModal
          event={event}
          isOpen={isTicketManagementModalOpen}
          onClose={() => setIsTicketManagementModalOpen(false)}
          tickets={event.user_tickets}
          initialIndex={Math.max(
            0,
            event.user_tickets?.findIndex((t: any) => t.id === selectedTicketId) ?? 0,
          )}
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
      </ThemeProvider>
    </EventDetailV2Provider>
  );
}
