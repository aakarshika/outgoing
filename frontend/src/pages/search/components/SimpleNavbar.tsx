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
  CalendarDays,
  LogOut,
  type LucideIcon,
  Menu,
  MessageCircle,
  Monitor,
  PlusCircle,
  Settings,
  Speech,
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
import { useAuth } from '@/features/auth/hooks';
import { createEvent, updateEventTicketTiers } from '@/features/events/api';
import { useCategories, useEvent } from '@/features/events/hooks';

type MenuItem = {
  label: string;
  Icon: LucideIcon;
  to?: string;
  action?: 'create-event' | 'logout';
  muted?: boolean;
};

export function SimpleNavbar() {
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
  const event = eventResponse?.data;
  const categories = categoriesResponse?.data || [];
  const showSearchInHeader = !eventMatch ;
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
  const menuPopoverOpen = Boolean(menuAnchorEl);
  const menuGroups: MenuItem[][] = [
    [
      {
        label: 'Create Event',
        to: '/manage',
        Icon: PlusCircle,
        action: 'create-event',
      },
    ],
    [{ label: 'My Network', to: '/network', Icon: Users }],
    [
      { label: 'Calendar', to: '/calendar', Icon: CalendarDays },
      { label: 'Hosting', to: '/dashboard/events', Icon: Speech },
      { label: 'Servicing', to: '/dashboard/services/my-services', Icon: Monitor },
    ],
    [{ label: 'Settings', to: '/profile/settings', Icon: Settings }],
    ...(isAuthenticated
      ? [[{ label: 'Logout', Icon: LogOut, action: 'logout' as const, muted: true }]]
      : []),
  ] as const;

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
                whiteSpace: 'nowrap',              maxWidth: 580,
              mx: 'auto',
              lineHeight: 1.65,
            }}
          >
            <span className=''><strong>out</strong></span>
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
            {''}<strong>ing</strong>
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
            {isAuthenticated ? (
              <>
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
                <Button
                  type="button"
                  variant="ghost"
                  className="h-9 w-9 p-0 text-[#3f372e] hover:bg-[#f4efe7]"
                  onClick={() => navigate('/calendar')}
                  aria-label="Notifications"
                >
                  <Bell className="h-4 w-4" />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  className="h-9 w-9 p-0 text-[#3f372e] hover:bg-[#f4efe7]"
                  onClick={() => navigate('/alerts')}
                  aria-label="Open chats and alerts"
                >
                  <MessageCircle className="h-4 w-4" />
                </Button>
              </>
            ) : (
              <>
              </>
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
                <Divider
                  sx={{ my: 0.6, borderColor: 'rgba(120,94,60,0.14)' }}
                />
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
    </Box>
  );
}
