import { Box, Chip, Popover, Stack, Typography } from '@mui/material';
import { Star } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { UserAvatar } from './UserAvatar';
import { useVendorService } from '@/features/vendors/hooks';

interface ServicenameProps {
  service_id: number;
  mode?: 'simple' | 'normal' | 'bigger';
  userData?: {
    service_name?: string;
    roles?: string[];
    rating?: number;
    estDate?: string;
  };
  className?: string;
  sx?: any;
}

export const Servicename = ({
  service_id,
  mode = 'normal',
  userData = {
    service_name: 'Service Name',
    roles: ['vendor'],
    rating: 4.5,
    estDate: '2022'
  },
  className,
  sx,
}: ServicenameProps) => {
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const navigate = useNavigate();

  // fetch the service from the API
  const { data: service } = useVendorService(service_id);
  if (!service) {
    return null;
  }
  userData = {
    service_name: service.data.title,
    rating: service.data.avg_rating || 0,
    estDate: service.data.created_at,
  };
  const handleOpen = (event: React.MouseEvent<HTMLElement>) => {
    event.stopPropagation();
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleCardClick = () => {
    navigate(`/services/${service_id}`);
    handleClose();
  };

  const isOpen = Boolean(anchorEl);

  return (
    <>
      <Box
        onClick={handleOpen}
        sx={{
          display: 'inline-flex',
          alignItems: 'center',
          cursor: 'pointer',
          borderRadius: 1,
          '&:hover': {
            opacity: 0.8,
          },
          ...sx,
        }}
        className={className}
      >
        {mode === 'simple' && (
          <Typography
            sx={{
              fontFamily: '"Caveat", cursive',
              fontSize: 'inherit',
              color: 'inherit',
            }}
          >
            {userData.service_name}
          </Typography>
        )}

        {mode === 'normal' && (
          <Stack direction="row" spacing={1} alignItems="center">
            <Box>
              <Typography
                sx={{
                  fontFamily: '"Caveat", cursive',
                  fontWeight: 'bold',
                  fontSize: '0.9rem',
                  lineHeight: 1,
                  color: 'text.secondary',
                  mx: 1,
                }}
              >
                "{userData.service_name}"
              </Typography>
            </Box>
          </Stack>
        )}

        {mode === 'bigger' && (
          <Stack direction="row" spacing={2} alignItems="center">
            <Box>
              <Typography
                sx={{
                  fontFamily: '"Caveat", cursive',
                  fontSize: '1.2rem',
                  lineHeight: 1.1,
                }}
              >
                {userData.service_name}
              </Typography>
            </Box>
          </Stack>
        )}
      </Box>

      <Popover
        open={isOpen}
        anchorEl={anchorEl}
        onClose={handleClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'left',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'left',
        }}
        PaperProps={{
          sx: {
            mt: 1,
            p: 0,
            overflow: 'visible',
            borderRadius: '12px',
            border: '2px solid #000',
            boxShadow: '8px 8px 0px rgba(0,0,0,0.1)',
            minWidth: '280px',
            zIndex: 3000, // Ensure it's above drawers (2500) and other overlays
            '&::before': {
              content: '""',
              position: 'absolute',
              top: -8,
              left: 20,
              width: 14,
              height: 14,
              bgcolor: 'rgba(209, 209, 209, 0.5)',
              borderTop: '2px solid #000',
              borderLeft: '2px solid #000',
              transform: 'rotate(45deg)',
              zIndex: 1,
            },
          },
        }}
      >
        <Box
          onClick={handleCardClick}
          sx={{
            p: 3,
            cursor: 'pointer',
            bgcolor: 'rgba(209, 209, 209, 0.5)',
            borderRadius: '10px',
            position: 'relative',
          }}
        >
          <Stack spacing={2}>
            {/* Profile Info */}
            <Stack direction="row" spacing={3} alignItems="center">
              <Box sx={{ position: 'relative' }}>
                <Box
                  sx={{
                    position: 'absolute',
                    inset: -4,
                    borderRadius: '50%',
                    background: 'linear-gradient(45deg, #f06, #4a90e2)',
                    zIndex: 0,
                  }}
                />
              </Box>
              <Box>
                <Typography
                  sx={{
                    fontFamily: '"Caveat", cursive',
                    fontSize: '1.4rem',
                    lineHeight: 1.1,
                  }}
                >
                  {userData.service_name}
                </Typography>
                {userData.estDate && (
                  <Typography
                    sx={{
                      fontFamily: '"Caveat", cursive',
                      fontSize: '0.9rem',
                      color: 'text.secondary',
                      mt: 0.5,
                    }}
                  >
                    est. {userData.estDate}
                  </Typography>
                )}
              </Box>
            </Stack>

            {/* Stats & Rating */}
            <Stack
              direction="row"
              justifyContent="space-between"
              alignItems="center"
              sx={{ pt: 1 }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <Star size={16} fill="#f59e0b" color="#f59e0b" />
                <Typography
                  sx={{ fontFamily: '"Caveat"', fontSize: '1.1rem' }}
                >
                  {userData.rating || 0}
                </Typography>
              </Box>
            </Stack>
          </Stack>
        </Box>
      </Popover>
    </>
  );
};
