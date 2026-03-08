import { Box, ThemeProvider, Typography } from '@mui/material';
import { Link } from 'react-router-dom';

import { VendorBusinessCard } from '@/components/ui/VendorBusinessCard';
import { scrapbookTheme } from '@/features/events/theme/scrapbookTheme';

export const VendorServicesSection = ({ services }: { services: any[] }) => {
  // Always show VendorServicesSection

  return (
    <Box
      sx={{
        bgcolor: '#fdfaf6',
        border: '2px dashed #d1d5db',
        borderRadius: '12px',
        p: { xs: 2, md: 4 },
      }}
    >
      <Box sx={{ textAlign: 'center', mb: 5 }}>
        <Typography
          variant="h4"
          sx={{ fontFamily: '"Permanent Marker"', color: '#1a1a1a' }}
        >
          🏢 Trusted Event Services
        </Typography>
        <Typography
          variant="body2"
          sx={{ fontFamily: 'serif', fontStyle: 'italic', color: '#666', mt: 1 }}
        >
          (services that help run events)
        </Typography>
      </Box>
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: {
            xs: '1fr',
            sm: 'repeat(2, 1fr)',
            md: 'repeat(3, 1fr)',
            lg: 'repeat(4, 1fr)',
          },
          gap: 4,
          mb: 6,
          justifyItems: 'center',
        }}
      >
        <ThemeProvider theme={scrapbookTheme}>
          {services?.length > 0 ? (
            services.slice(0, 8).map((service: any, idx: number) => (
              <Box key={service.id} sx={{ width: '100%', maxWidth: 300 }}>
                <Link to={`/services/${service.id}`} style={{ textDecoration: 'none' }}>
                  <VendorBusinessCard
                    vendor={service}
                    rotation={idx % 2 === 0 ? 1 : -1.5}
                  />
                </Link>
              </Box>
            ))
          ) : (
            <Box sx={{ py: 4, gridColumn: '1 / -1', width: '100%', textAlign: 'center' }}>
              <Typography variant="body1" sx={{ fontFamily: 'serif', fontStyle: 'italic', color: '#666' }}>
                No vendor services available right now.
              </Typography>
            </Box>
          )}
        </ThemeProvider>
      </Box>
      <Box sx={{ textAlign: 'center' }}>
        <Link
          to="/services"
          style={{
            fontFamily: '"Permanent Marker"',
            fontSize: '1.1rem',
            color: '#1a1a1a',
            textDecoration: 'underline',
            textUnderlineOffset: '6px',
          }}
        >
          View All Services →
        </Link>
      </Box>
    </Box>
  );
};
