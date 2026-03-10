import {
  Avatar,
  Box,
  Button as MuiButton,
  Paper,
  Popover,
  Typography,
} from '@mui/material';
import { type MouseEvent, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { HostCard } from '@/components/ui/HostCard';
import { useAuth } from '@/features/auth/hooks';
import { VendorBusinessCard } from '@/components/ui/VendorBusinessCard';
export const ClassifiedAd = ({
  need,
  event,
  onInquire,
  isEligible = false,
  isOpportunity = false,
}: {
  need: any;
  event?: any;
  onInquire: (n: any) => void;
  isEligible?: boolean;
  isOpportunity?: boolean;
}) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [hostAnchorEl, setHostAnchorEl] = useState<HTMLElement | null>(null);
  const assigned_vendor = need.applications.find(
    (app: any) => app.status === 'accepted',
  );

  const userApplication = event?.user_applications?.find(
    (app: any) => app.need_id === need.id,
  );
  const hostProfile = useMemo(
    () => ({
      username:
        assigned_vendor?.username ||
        assigned_vendor?.vendor_name ||
        assigned_vendor?.name ||
        'host',
      avatar: assigned_vendor?.avatar || null,
      rating: assigned_vendor?.rating,
    }),
    [assigned_vendor],
  );
  const isHostCardOpen = Boolean(hostAnchorEl);

  const isHost =
    event?.host?.username === user?.username ||
    event?.host?.id === user?.username ||
    event?.host === user?.username;
  return (
    <Box sx={{ position: 'relative', width: '100%' }}>
      <Paper
        elevation={0}
        sx={{
          p: 3.5,
          mb: 2,
          bgcolor: '#fffaf2',
          backgroundImage: `
            linear-gradient(0deg, rgba(255, 214, 165, 0.12) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255, 214, 165, 0.12) 1px, transparent 1px),
            radial-gradient(circle at 20% 15%, rgba(255, 186, 120, 0.16), transparent 45%)
          `,
          backgroundSize: '24px 24px, 24px 24px, 100% 100%',
          border: '2px solid #2b2b2b',
          outline: '6px solid #fffaf2',
          position: 'relative',
          opacity: need.status === 'filled' ? 0.6 : 1,
          filter: need.status === 'filled' ? 'grayscale(0.8)' : 'none',
          transform: `rotate(${(Math.random() * 2 - 1).toFixed(1)}deg)`,
          pointerEvents: need.status === 'filled' ? 'none' : 'auto',
          transition: 'all 0.3s ease',
          boxShadow: '10px 12px 0 rgba(43,43,43,0.12), 0 12px 25px rgba(0,0,0,0.12)',
          '&::before': {
            content: '""',
            position: 'absolute',
            top: 14,
            left: 18,
            width: 60,
            height: 18,
            background:
              'linear-gradient(90deg, rgba(255, 216, 151, 0.85), rgba(255, 232, 190, 0.4))',
            border: '1px solid rgba(181, 128, 60, 0.35)',
            transform: 'rotate(-6deg)',
            boxShadow: '0 4px 10px rgba(0,0,0,0.15)',
            opacity: 0.9,
          },
          '&::after': {
            content: '""',
            position: 'absolute',
            bottom: 16,
            right: 18,
            width: 70,
            height: 20,
            background:
              'linear-gradient(90deg, rgba(168, 222, 255, 0.8), rgba(214, 244, 255, 0.4))',
            border: '1px solid rgba(60, 132, 181, 0.35)',
            transform: 'rotate(4deg)',
            boxShadow: '0 4px 10px rgba(0,0,0,0.15)',
            opacity: 0.9,
          },
        }}
      >
        <Typography
          sx={{
            fontFamily: '"Playfair Display", serif',
            fontWeight: 600,
            textTransform: 'capitalize',
            borderBottom: '2px dashed #2b2b2b',
            mb: 1.5,
            fontSize: '1.05rem',
            color: need.status === 'filled' ? '#999' : 'inherit',
          }}
        >
          <span
            style={{
              fontFamily: '"Playfair Display", serif',
              fontWeight: 900,
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
            }}
          >
            {need.category.split('_').join(' ')}{' '}
          </span>
          {need.title ? `: ${need.title}` : ''}
        </Typography>
        <Typography
          variant="body2"
          sx={{
            fontFamily: '"Caveat", cursive',
            fontSize: '1.05rem',
            mb: 2,
            lineHeight: 1.4,
            color: '#2b2b2b',
          }}
        >
          {need.description}
        </Typography>
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-end',
            mt: 0,
          }}
        >
          {need.status === 'open' && !isHost &&
            (userApplication ? (
              <MuiButton
                variant="outlined"
                size="small"
                onClick={() =>
                  navigate(
                    `/events/${(event as any)?.id}/service-event-management/application`,
                  )
                }
                sx={{
                  borderRadius: 0,
                  borderColor: '#0284c7',
                  color: '#0284c7',
                  fontWeight: 'bold',
                  whiteSpace: 'nowrap',
                  '&:hover': { bgcolor: '#0284c7', color: '#fff' },
                }}
              >
                VIEW APPLICATION →
              </MuiButton>
            ) : isEligible ? (
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

      {need.status === 'open' && isOpportunity && (
        <Box
          sx={{
            position: 'absolute',
            top: 10,
            right: 14,
            px: 1.5,
            py: 0.6,
            border: '2px solid rgba(22, 163, 74, 0.6)',
            borderRadius: '4px',
            transform: 'rotate(4deg)',
            pointerEvents: 'none',
            zIndex: 2,
            bgcolor: 'rgba(255, 255, 255, 0.85)',
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

      {need.status === 'filled' && (
        <>
          <Box
            sx={{
              position: 'absolute',
              bottom: -6,
              right: -6,
              zIndex: 10,
              transform: 'rotate(3deg)',
            }}
          >
            <TinyBusinessCard
              name={hostProfile.username}
              avatar={hostProfile.avatar || ''}
              onClick={(event) => {
                event.stopPropagation();
                setHostAnchorEl(event.currentTarget);
              }}
            />
          </Box>
          <Popover
            open={isHostCardOpen}
            anchorEl={hostAnchorEl}
            onClose={() => setHostAnchorEl(null)}
            anchorOrigin={{ vertical: 'top', horizontal: 'left' }}
            transformOrigin={{ vertical: 'bottom', horizontal: 'right' }}
            PaperProps={{
              sx: {
                p: 0,
                bgcolor: 'transparent',
                boxShadow: 'none',
              },
            }}
          >
            <Box sx={{ p: 1 }}>
              {/* <HostCard
                host={{ username: hostProfile.username, avatar: hostProfile.avatar }}
                rating={hostProfile.rating}
                rotation={-1.5}
              /> */}
              <VendorBusinessCard
                vendor={hostProfile}
                rotation={-1.5}
              />
            </Box>
          </Popover>
        </>
      )}
    </Box>
  );
};

const TinyBusinessCard = ({
  name,
  avatar,
  onClick,
}: {
  name: string;
  avatar: string;
  onClick: (event: MouseEvent<HTMLButtonElement>) => void;
}) => {
  return (
    <Box
      component="button"
      type="button"
      onClick={onClick}
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 1,
        px: 1.5,
        py: 1,
        backgroundColor: '#rgb(232, 255, 255)',
        border: '2px solid #00CCCC',
        borderRadius: '8px',
        boxShadow: '4px 5px #00CCCC',
        cursor: 'pointer',
        fontFamily: '"Caveat", cursive',
        textAlign: 'left',
        minWidth: 140,
        '&:hover': {
          transform: 'translate(-1px, -1px)',
          boxShadow: '6px 7px #00CCCC',
        },
      }}
    >
      <Avatar src={avatar} sx={{ width: 26, height: 26, border: '2px solid #fff' }} />
      <Box>
        <Typography
          variant="body2"
          sx={{ fontSize: '0.65rem', color: '#6b5b4a', lineHeight: 1 }}
        >
          Filled by
        </Typography>
        <Typography sx={{ fontSize: '0.85rem', fontWeight: 700, color: '#2b2b2b' }}>
          {name}
        </Typography>
      </Box>
    </Box>
  );
};
