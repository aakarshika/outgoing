import {
  Box,
  Container,
  Divider,
  Drawer,
  Popover,
  Typography,
  useMediaQuery,
} from '@mui/material';
import { useQueryClient } from '@tanstack/react-query';
import {
  Bell,
  LogOut,
  type LucideIcon,
  Menu,
  MessageCircle,
  Monitor,
  Pencil,
  PlusCircle,
  Settings,
  Speech,
  Ticket,
  UserIcon,
  UserPlus,
  Users,
} from 'lucide-react';
import { type MouseEvent, useState } from 'react';
import { matchPath, useLocation, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

import {
  QuickCreateSpark,
  type QuickCreateSubmitPayload,
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

type MenuItem = {
  label: string;
  Icon: LucideIcon;
  to?: string;
  action?: 'create-event' | 'create-service' | 'logout';
  muted?: boolean;
};

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
  const eventMatch = matchPath(
    { path: '/events/:id/*', end: false },
    location.pathname,
  );
  const eventId = eventMatch?.params?.id;
  const { data: eventResponse } = useEvent(Number(eventId));
  const { data: categoriesResponse } = useCategories();
  const { data: myEventsResponse } = useMyEvents();
  const { data: myServicesResponse } = useMyServices({ enabled: isAuthenticated });
  const { data: myTicketsResponse } = useMyTickets();
  const event = eventResponse?.data;
  const categories = categoriesResponse?.data || [];
  const hasHostedEvents = (myEventsResponse?.data?.length ?? 0) > 0;
  const hasServices = (myServicesResponse?.data?.length ?? 0) > 0;
  const hasTickets = (myTicketsResponse?.data?.length ?? 0) > 0;
  const isEventHost =
    isAuthenticated && !!user && !!event && user.username === event.host?.username;
  const isVendor =
    isAuthenticated &&
    !!user &&
    !!event &&
    !!(event.user_applications && event.user_applications.length > 0);
  const isNotOnManagePage = !location.pathname.includes('manage');
  const [menuAnchorEl, setMenuAnchorEl] = useState<HTMLElement | null>(null);
  const [isQuickCreateOpen, setIsQuickCreateOpen] = useState(false);
  const [isQuickCreateSubmitting, setIsQuickCreateSubmitting] = useState(false);
  const [isQuickCreateServiceOpen, setIsQuickCreateServiceOpen] = useState(false);
  const [quickCreateServiceCategory, setQuickCreateServiceCategory] = useState('');
  const menuPopoverOpen = Boolean(menuAnchorEl);
  const hostingAndServicesItems: MenuItem[] = [];
  if (hasHostedEvents) {
    hostingAndServicesItems.push({ label: 'Hosting', to: '/managing', Icon: Speech });
  }
  if (hasServices) {
    hostingAndServicesItems.push({
      label: 'Servicing',
      to: '/managing/services',
      Icon: Monitor,
    });
  }
  if (hasTickets) {
    hostingAndServicesItems.push({
      label: 'My Tickets',
      to: '/managing/attending',
      Icon: Ticket,
    });
  }

  const menuGroups: MenuItem[][] = [
    [
      {
        label: 'Create Event',
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
    [{ label: 'My Network', to: '/network', Icon: Users }],
    ...(hostingAndServicesItems.length ? [hostingAndServicesItems] : []),
    [{ label: 'Settings', to: '/profile/settings', Icon: Settings }],
    ...(isAuthenticated
      ? [[{ label: 'Logout', Icon: LogOut, action: 'logout' as const, muted: true }]]
      : []),
  ];

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
    action: 'plan' | 'post',
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
      if (action === 'plan') {
        toast.success('Draft created. Keep building it.');
        navigate(`/events/${result.data.id}/manage`);
      } else {
        toast.success('Event posted');
        navigate(`/events/${result.data.id}`);
      }
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Could not create this event');
      throw error;
    } finally {
      setIsQuickCreateSubmitting(false);
    }
  };

  return (
    <Box
      component="header"
      sx={{
        // position: 'sticky',
        // top: 0,
        zIndex: 40,
        backgroundColor: 'rgba(255, 255, 255, 0.0)',
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
              pr: 0.5,
              minWidth: 0,
            }}
          >
            {/* <Typography
              sx={{
                fontFamily: 'Syne, sans-serif',
                fontWeight: 800,
                fontSize: { xs: 24, sm: 32 },
                lineHeight: 1,
                letterSpacing: '-0.03em',
                color: '#D85A30',
                whiteSpace: 'nowrap',
              }}
            >
              outGOing
            </Typography> */}
            <Typography
              sx={{
                fontFamily: 'Syne, sans-serif',
                fontWeight: 800,
                fontSize: { xs: 24, sm: 32 },
                letterSpacing: '-0.03em',
                color: '#D85A30',
                whiteSpace: 'nowrap',
                maxWidth: 580,
                mx: 'auto',
                lineHeight: 1.65,
              }}
            >
              <span className="">
                <strong>out</strong>
              </span>
              <Box
                component="span"
                aria-label="go"
                role="img"
                sx={{
                  display: 'inline-block',
                  width: { xs: 30, md: 36 },
                  height: { xs: 30, md: 35 },
                  // pt: 7,
                  // mx: 0.5,
                  transform: 'translateY(10px)',
                  backgroundColor: 'currentColor',
                  maskImage: "url('/assets/go-symbol.png')",
                  maskRepeat: 'no-repeat',
                  maskPosition: 'center',
                  maskSize: 'contain',
                  WebkitMaskImage: "url('/assets/go-symbol.png')",
                  WebkitMaskRepeat: 'no-repeat',
                  WebkitMaskPosition: 'center',
                  WebkitMaskSize: 'contain',
                }}
              />
              {''}
              <strong>ing</strong>
            </Typography>
          </Box>
          <NavbarProvider>
            <SearchBarSimple />
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
            {isMobile && !isAuthenticated && location.pathname !== '/signin' && (
              <Button
                type="button"
                variant="ghost"
                className="h-9 px-3 text-xs hover:bg-[#ffffff] border-[#D85A30] hover:text-[#D85A30]"
                onClick={() => navigate(`/signin`)}
              >
                <UserIcon size={14} /> Sign In
              </Button>
            )}
            {isMobile && !isAuthenticated && location.pathname !== '/signup' && (
              <Button
                type="button"
                variant="ghost"
                className="h-9 px-3 text-xs hover:bg-[#ffffff] border-[#D85A30] hover:text-[#D85A30]"
                onClick={() => navigate(`/signup`)}
              >
                <UserPlus size={14} /> Sign Up
              </Button>
            )}
            {isAuthenticated ? (
              <>
                {isMobile && isVendor && isNotOnManagePage && eventId && (
                  <Button
                    type="button"
                    variant="ghost"
                    className="h-9 px-3 text-xs text-[#3f372e] hover:bg-[#e6fafa] hover:text-[#008a8a]"
                    onClick={() =>
                      navigate(`/events/${eventId}/service-event-management`)
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
            layout="sheet"
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
