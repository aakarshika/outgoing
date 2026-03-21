import {
  Box,
  Chip,
  Container,
  Divider,
  Drawer,
  Popover,
  Stack,
  Typography,
  useMediaQuery,
} from '@mui/material';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  LogOut,
  type LucideIcon,
  Menu,
  Monitor,
  Pencil,
  PlusCircle,
  Settings,
  Speech,
  Ticket,
  UserIcon,
  UserPlus,
  Users,
  Heart,
  Briefcase,
  Search,
} from 'lucide-react';
import { type MouseEvent, useState, useMemo } from 'react';
import { matchPath, useLocation, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

import {
  QuickCreateSpark,
  type QuickCreateSubmitPayload,
  type QuickCreateAction,
} from '@/components/events/QuickCreateSpark';
import { NavbarProvider } from '@/components/navbar/NavbarContext';
import { SearchBarSimple } from '@/components/navbar/SearchBarSimple';
import { Button } from '@/components/ui/button';
import { UserAvatar } from '@/components/ui/UserAvatar';
import { QuickCreateServiceDialog } from '@/components/vendors/QuickCreateServiceDialog';
import { useAuth } from '@/features/auth/hooks';
import { createEvent, updateEventTicketTiers } from '@/features/events/api';
import {
  useCategories,
  useEvent,
  useMyEvents,
  useMyTickets,
} from '@/features/events/hooks';
import { useMyServices } from '@/features/vendors/hooks';
import { EventOverviewRow } from '@/pages/alerts/utils';
import client from '@/api/client';
import { ApiResponse } from '@/types/api';
import { KIND_STYLES } from '@/pages/managing/useManaging';
import { motion, AnimatePresence } from 'framer-motion';

type MenuItem = {
  label: string;
  Icon: LucideIcon;
  to?: string;
  action?: 'create-event' | 'create-service' | 'logout' | 'signin' | 'signup';
  muted?: boolean;
  count?: number;
  color?: string;
};

async function fetchEventOverview() {
  return client.get<ApiResponse<EventOverviewRow[]>>('/alerts/event-overview/');
}
export function SimpleNavbar({
  onCreateService,
}: {
  onCreateService?: (category?: string) => void;
}) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const location = useLocation();
  const { isAuthenticated, logout, user } = useAuth();
  const isMobile = useMediaQuery('(max-width:767px)');
  const eventMatch =
    matchPath({ path: '/events/:id/*', end: false }, location.pathname) ||
    matchPath({ path: '/events-new/:id/*', end: false }, location.pathname);
  const eventId = eventMatch?.params?.id;
  const { data: eventResponse } = useEvent(Number(eventId));
  const { data: categoriesResponse } = useCategories();
  const { data: myEventsResponse } = useMyEvents();
  const { data: myServicesResponse } = useMyServices({ enabled: isAuthenticated });
  const { data: myTicketsResponse } = useMyTickets();
  const event = eventResponse?.data;
  const categories = categoriesResponse?.data || [];

  const { data: overviewResponse, isLoading: loadingOverview } = useQuery({
    queryKey: ['managingOverview'],
    queryFn: fetchEventOverview as any,
    enabled: !!user,
  });

  const overviewRows = (((overviewResponse as any)?.data?.data as EventOverviewRow[]) ||
    []) as EventOverviewRow[];
  const {
    hasPendingHostedEvents,
    hasPendingApplications,
    hasPendingTickets,
    pendingHostedEventsCount,
    pendingApplicationsCount,
    pendingTicketsCount,
  } = useMemo(() => {
    const userId = user?.id;

    const isTerminalLifecycle = (state?: string | null) => {
      const normalized = state?.toLowerCase?.() ?? '';
      return normalized === 'completed' || normalized === 'cancelled';
    };

    const isTicketCancelled = (status?: string | null) => {
      return (status?.toLowerCase?.() ?? '') === 'cancelled';
    };

    // Use distinct event ids so we don't over-count when the overview contains
    // multiple rows per event.
    const hostedEventIds = new Set<number>();
    const applicationEventIds = new Set<number>();
    const ticketEventIds = new Set<number>();

    if (userId) {
      for (const row of overviewRows) {
        if (isTerminalLifecycle(row?.event_lifecycle_state)) continue;

        if (row.host_user_id === userId) {
          hostedEventIds.add(row.event_id);
        }

        if (row.need_applied_to_user_id === userId) {
          applicationEventIds.add(row.event_id);
        }

        if (row.attendee_user_id === userId && !isTicketCancelled(row.ticket_status)) {
          ticketEventIds.add(row.event_id);
        }
      }
    }

    const pendingHostedEventsCount = hostedEventIds.size;
    const pendingApplicationsCount = applicationEventIds.size;
    const pendingTicketsCount = ticketEventIds.size;

    return {
      hasPendingHostedEvents: pendingHostedEventsCount > 0,
      hasPendingApplications: pendingApplicationsCount > 0,
      hasPendingTickets: pendingTicketsCount > 0,
      pendingHostedEventsCount,
      pendingApplicationsCount,
      pendingTicketsCount,
    };
  }, [overviewRows, user?.id]);



  const isEventHost =
    isAuthenticated && !!user && !!event && user.username === event.host?.username;
  const isVendor =
    isAuthenticated &&
    !!user &&
    !!event &&
    !!(event.user_applications && event.user_applications.length > 0);
  const isGuestLandingPage = location.pathname === '/' && !isAuthenticated;
  const isOrangePage = true;
  const hideSearchBar = location.pathname.startsWith('/events') 
  || location.pathname.startsWith('/events-new') 
  || location.pathname.startsWith('/managing') 
  || location.pathname.startsWith('/network')
  || location.pathname.startsWith('/chats');
  const isNotOnManagePage = !location.pathname.includes('manage');
  const [menuAnchorEl, setMenuAnchorEl] = useState<HTMLElement | null>(null);
  const [isQuickCreateOpen, setIsQuickCreateOpen] = useState(false);
  const [isQuickCreateSubmitting, setIsQuickCreateSubmitting] = useState(false);
  const [isQuickCreateServiceOpen, setIsQuickCreateServiceOpen] = useState(false);
  const [quickCreateServiceCategory, setQuickCreateServiceCategory] = useState('');
  const menuPopoverOpen = Boolean(menuAnchorEl);
  const hostingAndServicesItems: MenuItem[] = [];

  hostingAndServicesItems.push({
    label: 'My Tickets',
    to: '/managing/attending',
    Icon: Ticket,
    count: hasPendingTickets ? pendingTicketsCount : 0,
    color: KIND_STYLES.attending.dot
  });

  hostingAndServicesItems.push({
    label: 'My Events',
    to: '/managing/hosting',
    Icon: Speech,
    count: hasPendingHostedEvents ? pendingHostedEventsCount : 0,
    color: KIND_STYLES.hosting.dot
  });
  hostingAndServicesItems.push({
    label: 'My Services',
    to: '/managing/services',
    Icon: Briefcase,
    count: hasPendingApplications ? pendingApplicationsCount : 0,
    color: KIND_STYLES.vendor_request.dot
  });
  hostingAndServicesItems.push({
    label: 'Saved dates',
    to: '/managing/saved',
    Icon: Heart,
  });
  const mobileAccountItems: MenuItem[] = [];
  if (isMobile && !isAuthenticated) {
    if (location.pathname !== '/signin') {
      mobileAccountItems.push({
        label: 'Sign In',
        to: '/signin',
        Icon: UserIcon,
      });
    }
    if (location.pathname !== '/signup') {
      mobileAccountItems.push({
        label: 'Sign Up',
        to: '/signup',
        Icon: UserPlus,
      });
    }
  }

  const mobileManageItems: MenuItem[] = [];
  if (isMobile && isAuthenticated && isVendor && isNotOnManagePage && eventId) {
    mobileManageItems.push({
      label: 'Manage Service',
      to: `/events/${eventId}/service-event-management`,
      Icon: Pencil,
    });
  }
  if (isMobile && isAuthenticated && isEventHost && isNotOnManagePage && eventId) {
    mobileManageItems.push({
      label: 'Manage Event',
      to: `/events/${eventId}/manage`,
      Icon: Pencil,
    });
  }

  const menuGroups: MenuItem[][] = [
    ...(mobileManageItems.length ? [mobileManageItems] : []),
    ...(mobileAccountItems.length ? [mobileAccountItems] : []),
    [
      {
        label: 'Host an Event',
        to: '/manage',
        Icon: PlusCircle,
        action: 'create-event',
      },
      {
        label: 'Create Service',
        Icon: Monitor,
        action: 'create-service',
      },
    ],
    ...(hostingAndServicesItems.length ? [hostingAndServicesItems] : []),
    [{ label: 'My Network', to: '/network', Icon: Users }],
    [{ label: 'Settings', to: '/profile/settings-new', Icon: Settings }],
    ...(isAuthenticated
      ? [[{ label: 'Logout', Icon: LogOut, action: 'logout' as const, muted: true }]]
      : !isMobile
        ? [
          [
            { label: 'Sign In', Icon: UserIcon, action: 'signin' as const },
            { label: 'Sign Up', Icon: UserPlus, action: 'signup' as const },
          ],
        ]
        : []),
  ];


  const NetworkHeadings = () => {
    return (
      <Typography sx={{ display: 'flex', alignItems: 'center', gap: 0.5, fontSize: 11, color: '#6b7280', px: 0.2 }}>
        <Search size={16} />
        Search for people... (Coming soon)
        </Typography>
    );
  };

  const ManagingHeadings = () => {
    return (
      <Stack
              direction="row"
              spacing={1}
              flexWrap="wrap"
              useFlexGap
              sx={{
                justifyContent: 'center',
                overflow: 'visible',
                width: '100%',
              }}
            >
              {rotatedTabs.map((pageTab) => (
                <motion.div
                  key={pageTab.key}
                  layout
                  transition={{
                    type: 'spring',
                    stiffness: 300,
                    damping: 40,
                    mass: 1,
                  }}
                >
                  {pageTab.key == tab && (<Chip
                    label={pageTab.label}
                    onClick={() => navigate(`/managing/${pageTab.key}`)}
                    sx={{
                      bgcolor:
                        'transparent',
                      color: '#121212',
                      fontWeight: 700,
                      fontSize: "15px",
                      cursor: 'pointer',
                      transition: 'background-color 0.2s, color 0.2s',
                      '&:hover': {
                        bgcolor: '#2B2118',
                      }
                    }}
                  />)}
                </motion.div>
              ))}
            </Stack>
    );
  };

  const handleMenuButtonClick = (event: MouseEvent<HTMLElement>) => {
    setMenuAnchorEl(event.currentTarget);
  };

  const closeMenuPopover = () => {
    setMenuAnchorEl(null);
  };

  const handleCreateEventEntry = () => {
    closeMenuPopover();
    if (!isAuthenticated) {
      navigate('/signin');
      return;
    }
    if (isMobile) {
      setIsQuickCreateOpen(true);
      return;
    }
    navigate('/manage');
  };

  const handleCreateServiceEntry = () => {
    closeMenuPopover();
    if (onCreateService) {
      onCreateService();
      return;
    }
    if (!isAuthenticated) {
      navigate('/signin');
      return;
    }
    setIsQuickCreateServiceOpen(true);
  };

  const handleQuickCreateSubmit = async (
    action: QuickCreateAction,
    payload: QuickCreateSubmitPayload,
  ) => {
    setIsQuickCreateSubmitting(true);
    const formData = new FormData();
    formData.set('title', payload.title);
    formData.set(
      'description',
      payload.description.trim() ||
      'Planning is underway. More details are coming soon.',
    );
    formData.set('category_id', String(payload.categoryId));
    formData.set('start_time', payload.startTimeIso);
    formData.set('end_time', payload.endTimeIso);
    formData.set('status', action === 'post' ? 'published' : 'draft');

    if (payload.locationMode === 'online') {
      formData.set('location_name', payload.onlineUrl || 'Online Event');
      formData.set('location_address', 'Online Event');
    } else {
      formData.set('location_name', payload.locationName);
      formData.set('location_address', payload.locationAddress);
      if (payload.latitude) formData.set('latitude', payload.latitude);
      if (payload.longitude) formData.set('longitude', payload.longitude);
    }

    if (payload.capacity) {
      formData.set('capacity', payload.capacity);
    }
    if (payload.ticketPriceStandard !== null) {
      formData.set('ticket_price_standard', payload.ticketPriceStandard);
    }
    if (payload.features.length > 0) {
      formData.set('features', JSON.stringify(payload.features));
    }
    if (payload.coverFile) {
      formData.set('cover_image', payload.coverFile);
    }

    try {
      const result = await createEvent(formData);
      const totalCapacityVal = payload.capacity ? parseInt(payload.capacity, 10) : null;
      const tiersToSave = payload.ticketTiers.map((tier, index) => {
        const isLastTier = index === payload.ticketTiers.length - 1;
        let calculatedCapacity =
          tier.capacity === '' || tier.capacity === null ? null : Number(tier.capacity);
        if (isLastTier && totalCapacityVal !== null) {
          const sumOthers = payload.ticketTiers
            .slice(0, -1)
            .reduce((sum, item) => sum + (Number(item.capacity) || 0), 0);
          calculatedCapacity = Math.max(0, totalCapacityVal - sumOthers);
        }

        return {
          name: tier.name || 'General Admission',
          price: Number(tier.price || 0).toFixed(2),
          capacity: calculatedCapacity,
          is_refundable: true,
          description: tier.description || '',
          admits: Number(tier.admits || 1),
          max_passes_per_ticket: Number(tier.max_passes_per_ticket || 6),
        };
      });

      if (tiersToSave.length > 0) {
        await updateEventTicketTiers(result.data.id, tiersToSave, false);
      }

      await queryClient.invalidateQueries({ queryKey: ['myEvents'] });
      await queryClient.invalidateQueries({ queryKey: ['feed'] });

      setIsQuickCreateOpen(false);
      if (action === 'post') {
        toast.success('Event posted');
        navigate(`/events-new/${result.data.id}`);
        return;
      }

      if (action === 'tickets-more') {
        toast.success('Draft created. Keep building it.');
        navigate(`/events/${result.data.id}/manage/tickets`);
        return;
      }

      if (action === 'needs-more') {
        toast.success('Draft created. Keep building it.');
        navigate(`/events/${result.data.id}/manage/needs`);
        return;
      }

      toast.success('Draft created. Keep building it.');
      navigate(`/events/${result.data.id}/manage`);
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Could not create this event');
      throw error;
    } finally {
      setIsQuickCreateSubmitting(false);
    }
  };

  const goMark = (
    <Box
      component="span"
      aria-label="go"
      role="img"
      sx={{
        display: 'inline-block',
        width:  '100%' ,
        height:  '100%' ,
        backgroundColor: 'currentColor',
        maskImage: "url('/assets/go-sym.png')",
        maskRepeat: 'no-repeat',
        maskPosition: 'center',
        maskSize: 'contain',
        WebkitMaskImage: "url('/assets/go-sym.png')",
        WebkitMaskRepeat: 'no-repeat',
        WebkitMaskPosition: 'center',
        WebkitMaskSize: 'contain',
      }}
    />
  );

  const TABS_CONFIG = [
    { key: 'managing', label: 'Calendar' },
    { key: 'earnings', label: 'Earnings' },
    { key: 'hosting', label: 'My Events' },
    { key: 'attending', label: 'My Tickets' },
    { key: 'services', label: 'My Services' },
    { key: 'saved', label: 'Saved Dates' },
  ] as const;
  const tab = location.pathname.split('/').pop()?.toLowerCase();

  const rotatedTabs = useMemo(() => {
    const idx = TABS_CONFIG.findIndex((t) => t.key === tab)
    if (idx === -1) return TABS_CONFIG;

    const result = [];
    for (let i = 0; i < TABS_CONFIG.length; i++) {
      result.push(
        TABS_CONFIG[(idx - 1 + i + TABS_CONFIG.length) % TABS_CONFIG.length],
      );
    }
    return result;
  }, [tab]);

  return (
    <Box
      component="header"
      sx={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        width: '100%',
        zIndex: (theme) => theme.zIndex.appBar + 10,
        backgroundColor: isOrangePage ? '#D85A30' : 'rgba(255, 252, 247, 0.8)',
        color: isOrangePage ? '#eeeeee' : '#3f372e',
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)',
      }}
    >
      <Container
        maxWidth={false}
        sx={{ maxWidth: 1240, px: { xs: 1.5, sm: 3 }, py: 1.25 }}
      >
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: { xs: 0.75, sm: 1.5 },
            flexWrap: 'nowrap',
            minWidth: 0,
            position: 'relative',
          }}
        >
          <Box
            onClick={() => navigate('/')}
            sx={{
              display: 'flex',
              alignItems: 'center',
              cursor: 'pointer',
              flexShrink: 0,
              pr: { xs: 0, sm: 0.5 },
              minWidth: 0,
            }}
          >
            <Box
              sx={{
                color: isOrangePage ? '#eeeeee' : '#D85A30',
                display: { xs: isGuestLandingPage ? 'none' : 'inline-flex', sm: 'none' },
                alignItems: 'center',
                justifyContent: 'center',
                width: 45,
                height: 45,
              }}
            >
              {goMark}
            </Box>
            <Typography
              sx={{
                display: { xs: isGuestLandingPage ? 'block' : 'none', sm: 'block' },
                fontFamily: 'Syne, sans-serif',
                fontWeight: 800,
                fontSize: { xs: 20, sm: 24, md: 32 },
                letterSpacing: '-0.03em',
                color: isOrangePage ? '#eeeeee' : '#D85A30',
                whiteSpace: 'nowrap',
                maxWidth: 580,
                mx: 'auto',
                lineHeight: 1.2,
              }}
            >
              <strong>out</strong>
              <Box
                component="span"
                sx={{
                  display: 'inline-flex',
                  alignItems: 'flex-end',
                  mx: 0.15,
                  mt: 1,
                  width: 28,
                  height: 28,
                  transform: { xs: 'translateY(2px)', sm: 'translateY(4px)' },
                }}
              >
                {goMark}
              </Box>
              <strong>ing</strong>
            </Typography>
          </Box>
          <NavbarProvider>
            {hideSearchBar ? <></> : <SearchBarSimple />}
            {hideSearchBar && location.pathname.startsWith('/managing') && (
              <ManagingHeadings/>
            )}
            {hideSearchBar && location.pathname.startsWith('/network') && (
              <NetworkHeadings/>
            )}
          </NavbarProvider>

          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: { xs: 0.5, sm: 0.25 },
              ml: 'auto',
              flexShrink: 0,
              minWidth: 0,
            }}
          >
            {/* Auth buttons removed from main row on mobile, now in menu */}
            {isAuthenticated ? (
              <>
                {isMobile && isVendor && isNotOnManagePage && eventId && (
                  <Button
                    type="button"
                    variant="ghost"
                    className="h-9 px-3 text-xs text-[#3f372e] hover:bg-[#e6fafa] hover:text-[#008a8a]"
                    onClick={() =>
                      navigate(`/managing/services`)
                    }
                  >
                    <Pencil size={14} /> Service
                  </Button>
                )}
                {isMobile && isEventHost && isNotOnManagePage && eventId && (
                  <Button
                    type="button"
                    variant="ghost"
                    className="h-9 px-3 text-xs text-[#3f372e] hover:bg-[#f0ebff] hover:text-[#7c5dd6]"
                    onClick={() => navigate(`/events/${eventId}/manage`)}
                  >
                    <Pencil size={14} /> Event
                  </Button>
                )}
                {!isMobile && isVendor && isNotOnManagePage && eventId && (
                  <Button
                    type="button"
                    variant="ghost"
                    className="h-9 px-3 text-xs text-[#3f372e] hover:bg-[#e6fafa] hover:text-[#008a8a]"
                    onClick={() =>
                      navigate(`/events/${eventId}/service-event-management`)
                    }
                  >
                    Manage Service
                  </Button>
                )}
                {!isMobile && isEventHost && isNotOnManagePage && eventId && (
                  <Button
                    type="button"
                    variant="ghost"
                    className="h-9 px-3 text-xs text-[#3f372e] hover:bg-[#f0ebff] hover:text-[#7c5dd6]"
                    onClick={() => navigate(`/events/${eventId}/manage`)}
                  >
                    Manage Event
                  </Button>
                )}
              </>
            ) : (
              <></>
            )}
            <Button
              type="button"
              variant="ghost"
              className="h-9 w-9 p-0 text-[#3f372e] hover:bg-[#f4efe7]"
              onClick={handleMenuButtonClick}
              aria-label="Open quick menu"
            >
              <Menu className="h-4 w-4" />
            </Button>
          </Box>
        </Box>
      </Container>

      <Popover
        open={menuPopoverOpen}
        anchorEl={menuAnchorEl}
        onClose={closeMenuPopover}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
        PaperProps={{
          sx: {
            mt: 1,
            width: 220,
            borderRadius: '14px',
            border: '1px solid rgba(120,94,60,0.2)',
            boxShadow: '0 18px 40px rgba(86,58,28,0.16)',
            backgroundColor: '#FFFCF7',
            overflow: 'hidden',
          },
        }}
      >
        <Box sx={{ py: 0.75 }}>
          {isAuthenticated && user && (
            <>
              <Box
                sx={{
                  px: 2,
                  py: 1.5,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1.5,
                  borderBottom: '1px solid rgba(120,94,60,0.1)',
                  mb: 0.5,
                }}
              >
                <UserAvatar
                  src={user.avatar}
                  username={user.username}
                  size="sm"
                  className="ring-1 ring-[#D85A30]/20"
                />
                <Box sx={{ minWidth: 0 }}>
                  <Typography
                    variant="subtitle2"
                    sx={{
                      fontWeight: 700,
                      color: '#3D3124',
                      lineHeight: 1.2,
                      fontSize: 14,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {user.first_name && user.last_name
                      ? `${user.first_name} ${user.last_name}`
                      : user.username}
                  </Typography>
                  <Typography
                    variant="caption"
                    sx={{
                      color: 'rgba(61,49,36,0.6)',
                      display: 'block',
                      fontSize: 11,
                    }}
                  >
                    Personal Account
                  </Typography>
                </Box>
              </Box>
            </>
          )}
          {menuGroups.map((group, groupIndex) => (
            <Box key={`group-${groupIndex}`} sx={{ py: 0.35 }}>
              {group.map((item) => (
                <Box key={item.label}>
                  <Box
                    component="button"
                    type="button"
                    onClick={() => {
                      if (item.action === 'create-event') {
                        handleCreateEventEntry();
                        return;
                      }
                      if (item.action === 'create-service') {
                        handleCreateServiceEntry();
                        return;
                      }
                      if (item.action === 'logout') {
                        closeMenuPopover();
                        logout();
                        return;
                      }
                      if (item.action === 'signin') {
                        closeMenuPopover();
                        navigate('/signin');
                        return;
                      }
                      if (item.action === 'signup') {
                        closeMenuPopover();
                        navigate('/signup');
                        return;
                      }
                      if (!item.to) {
                        return;
                      }
                      closeMenuPopover();
                      navigate(item.to);
                    }}
                    sx={{
                      width: '100%',
                      px: 1.5,
                      py: 1.15,
                      border: 0,
                      backgroundColor: 'transparent',
                      textAlign: 'left',
                      fontSize: 13,
                      color: item.muted ? 'rgba(61,49,36,0.58)' : '#3D3124',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1,
                      '&:hover': {
                        backgroundColor: '#FFF1DE',
                        color: item.muted ? 'rgba(61,49,36,0.72)' : '#3D3124',
                      },
                    }}
                  >
                    <item.Icon size={14} />
                    {item.label}

                    {item?.count && item.count > 0 ? (
                      <Typography
                        sx={{
                          width: 14,
                          height: 14,
                          borderRadius: '50%',
                          background: item.color,
                          color: 'white',
                          fontWeight: 700,
                          justifyContent: 'center',
                          alignItems: 'center',
                          fontSize: 10
                        }}
                      >
                        {item.count}
                      </Typography>
                    ): null }
                  </Box>
                </Box>
              ))}
              {groupIndex < menuGroups.length - 1 ? (
                <Divider sx={{ my: 0.6, borderColor: 'rgba(120,94,60,0.14)' }} />
              ) : null}
            </Box>
          ))}
        </Box>
      </Popover>
      <Drawer
        anchor="bottom"
        open={isQuickCreateOpen}
        onClose={() => setIsQuickCreateOpen(false)}
        PaperProps={{
          sx: {
            background: 'transparent',
            boxShadow: 'none',
            height: '100dvh',
            maxHeight: '100dvh',
          },
        }}
      >
        <Box sx={{ height: '100dvh' }}>
          <QuickCreateSpark
            categories={categories}
            isSubmitting={isQuickCreateSubmitting}
            onSubmit={handleQuickCreateSubmit}
            onClose={() => setIsQuickCreateOpen(false)}
          />
        </Box>
      </Drawer>

      <QuickCreateServiceDialog
        open={isQuickCreateServiceOpen}
        defaultCategory={quickCreateServiceCategory}
        onClose={async () => {
          setIsQuickCreateServiceOpen(false);
          setQuickCreateServiceCategory('');
          await queryClient.invalidateQueries({ queryKey: ['my-home'] });
        }}
      />
    </Box>
  );
}
