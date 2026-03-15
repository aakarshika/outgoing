import {
  Box,
  Container,
  Divider,
  Popover,
  Typography,
} from '@mui/material';
import {
  CalendarDays,
  PlusCircle,
  MessageCircle,
  Monitor,
  Settings,
  Speech,
  LogIn,
  LogOut,
  Menu,
  UserPlus,
  Bell,
  Users,
} from 'lucide-react';
import { type MouseEvent, useState } from 'react';
import { useNavigate, useLocation, matchPath } from 'react-router-dom';

import { SearchBarSimple } from '@/components/navbar/SearchBarSimple';
import { NavbarProvider } from '@/components/navbar/NavbarContext';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/features/auth/hooks';
import { useEvent } from '@/features/events/hooks';

export function SimpleNavbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, logout, user } = useAuth();
  const eventMatch = matchPath(
    { path: '/events/:id/*', end: false },
    location.pathname,
  );
  const eventId = eventMatch?.params?.id;
  const { data: eventResponse } = useEvent(Number(eventId));
  const event = eventResponse?.data;
  const isEventHost =
    isAuthenticated &&
    !!user &&
    !!event &&
    user.username === event.host?.username;
  const isVendor =
    isAuthenticated &&
    !!user &&
    !!event &&
    !!(event.user_applications && event.user_applications.length > 0);
  const isNotOnManagePage = !location.pathname.includes('manage');
  const [menuAnchorEl, setMenuAnchorEl] = useState<HTMLElement | null>(null);
  const menuPopoverOpen = Boolean(menuAnchorEl);
  const menuItems = [
    { label: 'Create event', to: '/events/create', Icon: PlusCircle },
    { label: 'Calendar', to: '/calendar', Icon: CalendarDays },
    { label: 'Your Network', to: '/network', Icon: Users },
    { label: 'Hosting', to: '/dashboard/events', Icon: Speech },
    { label: 'Servicing', to: '/dashboard/services/my-services', Icon: Monitor },
    { label: 'Settings', to: '/profile/settings', Icon: Settings },
  ] as const;

  const handleMenuButtonClick = (event: MouseEvent<HTMLElement>) => {
    setMenuAnchorEl(event.currentTarget);
  };

  const closeMenuPopover = () => {
    setMenuAnchorEl(null);
  };

  return (
    <Box
      component="header"
      sx={{
        position: 'sticky',
        top: 0,
        zIndex: 40,
        backgroundColor: 'var(--color-background-primary)',
      }}
    >
      <Container
        maxWidth={false}
        sx={{ maxWidth: 1240, px: { xs: 2, sm: 3 }, py: 1.25 }}
      >
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1.5,
            flexWrap: 'nowrap',
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
            }}
          >
            <Typography
              sx={{
                fontFamily: 'Syne, sans-serif',
                fontWeight: 800,
                fontSize: 32,
                lineHeight: 1,
                letterSpacing: '-0.03em',
                color: '#D85A30',
              }}
            >
              outGOing
            </Typography>
          </Box>
          {!eventMatch && (
            <Box
              sx={{
                flex: 1,
                minWidth: 320,
              }}
            >
              <NavbarProvider>
                <SearchBarSimple />
              </NavbarProvider>
            </Box>
          )}

          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 0.25,
              ml: 'auto',
              flexShrink: 0,
            }}
          >
            {isAuthenticated ? (
              <>
                {isVendor && isNotOnManagePage && eventId && (
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
                {isEventHost && isNotOnManagePage && eventId && (
                  <Button
                    type="button"
                    variant="ghost"
                    className="h-9 px-3 text-xs text-[#3f372e] hover:bg-[#f0ebff] hover:text-[#7c5dd6]"
                    onClick={() =>
                      navigate(`/events/${eventId}/host-event-management`)
                    }
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
                <Button
                  type="button"
                  variant="ghost"
                  className="h-9 px-4 text-xs"
                  onClick={() => navigate('/signin')}
                >
                  <LogIn className="mr-1 h-3.5 w-3.5" />
                  Sign in
                </Button>
                <Button
                  type="button"
                  className="h-9  px-4 text-xs text-white hover:bg-slate-800"
                  onClick={() => navigate('/signup')}
                >
                  <UserPlus className="mr-1 h-3.5 w-3.5" />
                  Sign up
                </Button>
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
        <Box sx={{ py: 0.5 }}>
          {menuItems.map((item, index) => (
            <Box key={item.label}>
              <Box
                component="button"
                type="button"
                onClick={() => {
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
                  color: '#3D3124',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1,
                  '&:hover': { backgroundColor: '#FFF1DE' },
                }}
              >
                <item.Icon size={14} />
                {item.label}
              </Box>
              {index < menuItems.length - 1 ? (
                <Divider sx={{ m: 0, borderColor: 'rgba(120,94,60,0.14)' }} />
              ) : null}
            </Box>
          ))}
          {isAuthenticated ? (
            <>
              <Divider sx={{ m: 0, borderColor: 'rgba(120,94,60,0.14)' }} />
              <Box
                component="button"
                type="button"
                onClick={() => {
                  closeMenuPopover();
                  logout();
                }}
                sx={{
                  width: '100%',
                  px: 1.5,
                  py: 1.15,
                  border: 0,
                  backgroundColor: 'transparent',
                  textAlign: 'left',
                  fontSize: 13,
                  color: '#3D3124',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1,
                  '&:hover': { backgroundColor: '#FFF1DE' },
                }}
              >
                <LogOut size={14} />
                Logout
              </Box>
            </>
          ) : null}
        </Box>
      </Popover>
    </Box>
  );
}
