import { Box, Typography } from '@mui/material';

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
        bgcolor: '#f5f5f0', // Linen/Off-white
        backgroundImage:
          'repeating-linear-gradient(45deg, rgba(0,0,0,0.01) 0px, rgba(0,0,0,0.01) 2px, transparent 2px, transparent 4px)',
        border: '1px solid #d1d5db',
        boxShadow: '3px 3px 10px rgba(0,0,0,0.1)',
        position: 'relative',
        p: 2.5,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        transform: `rotate(${rotation}deg)`,
        transition: 'transform 0.3s ease, box-shadow 0.3s ease',
        cursor: onClick ? 'pointer' : 'default',
        '&:hover': onClick
          ? {
              transform: `rotate(${rotation}deg) translateY(-5px)`,
              boxShadow: '5px 5px 15px rgba(0,0,0,0.15)',
            }
          : {},
        '&::before': {
          content: '""',
          position: 'absolute',
          inset: 4,
          border: '1px solid rgba(0,0,0,0.05)',
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
            bgcolor: '#ddd',
            flexShrink: 0,
            border: '1px solid #ccc',
            overflow: 'hidden',
            boxShadow: 'inset 0 0 5px rgba(0,0,0,0.1)',
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
              👤
            </Box>
          )}
        </Box>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography
            sx={{
              fontFamily: '"Lora", serif',
              fontWeight: 700,
              fontSize: '1.1rem',
              color: '#1a1a1a',
              lineHeight: 1.2,
              mb: 0.5,
              letterSpacing: '0.5px',
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {serviceName}
          </Typography>
          {ownerName && (
            <Typography sx={{ fontSize: '0.65rem', color: '#666', mb: 0.5 }}>
              by {ownerName}
            </Typography>
          )}
          <Typography
            sx={{
              fontFamily: '"Permanent Marker"',
              fontSize: '0.75rem',
              color: '#d97706',
              textTransform: 'uppercase',
              mb: 1,
            }}
          >
            {category.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())}{' '}
            Specialist
          </Typography>
          <Typography
            sx={{ fontSize: '0.6rem', color: '#888', fontFamily: 'monospace' }}
          >
            EST. {year} • {events} HIRES
          </Typography>
        </Box>
      </Box>
      <Box
        sx={{
          mt: 'auto',
          borderTop: '1px solid rgba(0,0,0,0.05)',
          pt: 1,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-end',
        }}
      >
        <Box>
          <Typography sx={{ fontSize: '0.65rem', color: '#888', fontStyle: 'italic' }}>
            Verified Outgoing™ Vendor
          </Typography>
          <Box sx={{ display: 'flex', color: '#fbbf24', fontSize: '1rem' }}>
            {'★'.repeat(Math.floor(rating))}
            {rating % 1 >= 0.5 ? '½' : ''}
          </Box>
        </Box>
        <Box
          sx={{
            width: 30,
            height: 30,
            borderRadius: '50%',
            border: '1px solid rgba(0,0,0,0.1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            opacity: 0.4,
            background:
              'radial-gradient(circle, transparent 70%, rgba(0,0,0,0.05) 100%)',
          }}
        >
          <Typography
            sx={{ fontSize: '0.5rem', fontWeight: 'bold', textAlign: 'center' }}
          >
            OFFICIAL
            <br />
            SEAL
          </Typography>
        </Box>
      </Box>
    </Box>
  );
};
