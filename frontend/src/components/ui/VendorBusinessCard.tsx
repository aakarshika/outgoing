import { Box, Typography } from '@mui/material';
import { Calendar } from 'lucide-react';

import { ImageWatermarkPlaceholder } from '@/features/events/scrapbookCard/ImageWatermarkPlaceholder';

import { Hostname } from './Hostname';

interface VendorBusinessCardProps {
  vendor: {
    vendor_name?: string;
    title?: string;
    category?: string;
    avatar?: string | null;
    portfolio_image?: string | null;
    avg_rating?: number;
    event_count?: number;
    created_at?: string;
  };
  rotation?: number;
  onClick?: () => void;
}

export const VendorBusinessCard = ({
  vendor,
  rotation = 0,
  onClick,
}: VendorBusinessCardProps) => {
  // If it's a "Service Ad", prioritize the service title (vendor.title) over the vendor name.
  const serviceName = vendor.title || vendor.vendor_name || 'Anonymous Service';
  const ownerName = vendor.title && vendor.vendor_name ? vendor.vendor_name : '';
  const category = vendor.category || 'Professional';
  const rating = vendor.avg_rating || 5;
  const events = vendor.event_count || 0;
  const year = new Date(vendor.created_at || Date.now()).getFullYear();
  const image = vendor.avatar || vendor.portfolio_image;

  return (
    <Box
      sx={{
        width: '100%',
        maxWidth: 320,
        aspectRatio: '1.75 / 1',
        bgcolor: 'rgb(232, 255, 255)', // Linen/Off-white
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        transform: `rotate(${rotation}deg)`,
        boxShadow: '1px 1px 1px rgba(168, 168, 168, 0.8)',
        transition: 'transform 0.3s ease, box-shadow 0.3s ease',
        cursor: onClick ? 'pointer' : 'default',
        '&:hover': onClick
          ? {
              transform: `rotate(${rotation}deg) translateY(-5px)`,
              boxShadow: '5px 5px 15px rgba(168, 168, 168, 0.8)',
            }
          : {},
        '&::before': {
          content: '""',
          position: 'absolute',
          inset: 4,
          border: '1px solid rgba(255, 255, 255, 0.05)',
          pointerEvents: 'none',
        },
      }}
      onClick={onClick}
    >
      <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-start' }}>
        <Box
          sx={{
            width: 60,
            height: 60,
            bgcolor: 'rgb(255, 252, 245)',
            flexShrink: 0,
            overflow: 'hidden',
            position: 'relative',
          }}
        >
          {image ? (
            <img
              src={image}
              alt={serviceName}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          ) : (
            <Box
              sx={{
                width: '100%',
                height: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#999',
                fontSize: '1.5rem',
              }}
            >
              <Calendar size={24} color="rgb(5, 116, 116)" />
            </Box>
          )}
        </Box>

        {/* Brand logo */}
        <Box
          sx={{
            position: 'absolute',
            top: 10,
            right: 1,
            width: 68,
            height: 68,
            borderRadius: '999px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden',
          }}
        ></Box>
        <Box sx={{ flex: 1, minWidth: 0, p: 1 }}>
          <Typography
            sx={{
              fontFamily: '"Lora", serif',
              fontWeight: 700,
              fontSize: '1.1rem',
              color: 'rgb(3, 110, 110)',
              lineHeight: 1.2,
              letterSpacing: '0.5px',
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              textTransform: 'uppercase',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {category.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())}{' '}
          </Typography>
          <Box
            sx={{ display: 'flex', alignItems: 'center', justifyContent: '', gap: 0.5 }}
          >
            <Typography
              sx={{
                fontFamily: '"Permanent Marker"',
                fontSize: '0.7rem',
                color: 'rgb(189, 187, 184)',
                textTransform: 'uppercase',
              }}
            >
              by
            </Typography>
            <Hostname
              username={ownerName}
              sx={{
                color: 'rgb(160, 158, 156)',
              }}
            />
          </Box>
        </Box>
      </Box>
      <Box
        sx={{
          mt: 'auto',
          borderTop: '1px solid rgba(0,0,0,0.05)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-end',
        }}
      >
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            p: 1,
            pl: 2,
            pb: 2,
            alignItems: 'flex-start',
            justifyContent: 'flex-start',
          }}
        >
          <Typography
            sx={{
              fontFamily: '"Lora", serif',
              fontSize: '1.2rem',
              color: '#d97706',
            }}
          >
            {serviceName}
          </Typography>
          <Typography
            sx={{ fontSize: '0.6rem', color: '#888', fontFamily: 'monospace' }}
          >
            EST. {year} • {events} HIRES
          </Typography>
        </Box>
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 0.5,
          }}
        >
          <Box
            component="img"
            src="/assets/go-sym.png"
            alt="GO"
            sx={{
              opacity: 0.25,
              width: '70px',
              height: '70px',
              objectFit: 'contain',
            }}
          />

          <Box sx={{ display: 'flex', color: '#fbbf24', fontSize: '1rem' }}>
            {'★'.repeat(Math.floor(rating))}
            {rating % 1 >= 0.5 ? '½' : ''}
          </Box>
        </Box>
      </Box>
    </Box>
  );
};
