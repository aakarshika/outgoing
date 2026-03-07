import {
  Box,
  Button,
  CircularProgress,
  Container,
  Grid,
  Typography,
} from '@mui/material';
import { ThemeProvider } from '@mui/material/styles';
import { ArrowLeft } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';

import { useFeed } from '@/features/events/hooks';
import { ScrapbookEventCard } from '@/features/events/ScrapbookEventCard';
import { scrapbookTheme } from '@/features/events/theme/scrapbookTheme';

export default function BrowseFeedPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const sort = searchParams.get('sort') || undefined;
  const online = searchParams.get('online') === 'true';
  const category = searchParams.get('category') || undefined;
  const title = searchParams.get('title') || 'Browse Events';
  const page = parseInt(searchParams.get('page') || '1');

  const { data, isLoading } = useFeed({
    sort,
    online: online || undefined,
    category,
    page,
    page_size: 24,
  });

  const events = data?.data || [];
  const meta = data?.meta;

  return (
    <ThemeProvider theme={scrapbookTheme}>
      <Box
        sx={{
          minHeight: '100vh',
          bgcolor: '#f4f1ea',
          backgroundImage:
            'radial-gradient(#d1d5db 0.5px, transparent 0.5px), radial-gradient(#d1d5db 0.5px, #f4f1ea 0.5px)',
          backgroundSize: '20px 20px',
          backgroundPosition: '0 0, 10px 10px',
          pt: 4,
          pb: 12,
        }}
      >
        <Container maxWidth="xl" sx={{ px: { xs: 2, sm: 4, lg: 8 } }}>
          <Box sx={{ mb: 6, display: 'flex', alignItems: 'center', gap: 2 }}>
            <Button
              onClick={() => navigate(-1)}
              startIcon={<ArrowLeft size={20} />}
              sx={{
                fontFamily: '"Permanent Marker"',
                color: '#1a1a1a',
                textTransform: 'none',
                '&:hover': { bgcolor: 'rgba(0,0,0,0.05)' },
              }}
            >
              Back
            </Button>
            <Typography
              variant="h3"
              sx={{ fontFamily: '"Permanent Marker"', color: '#1a1a1a' }}
            >
              {title}
            </Typography>
          </Box>

          {isLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 12 }}>
              <CircularProgress sx={{ color: '#1a1a1a' }} />
            </Box>
          ) : events.length > 0 ? (
            <>
              <Grid container spacing={4}>
                {events.map((event) => (
                  <Grid size={{ xs: 12, sm: 6, md: 4, lg: 3 }} key={event.id}>
                    <ScrapbookEventCard event={event as any} />
                  </Grid>
                ))}
              </Grid>

              {meta && (meta.total_count ?? 0) > (meta.page_size ?? 0) && (
                <Box sx={{ mt: 8, display: 'flex', justifyContent: 'center', gap: 2 }}>
                  <Button
                    disabled={page <= 1}
                    onClick={() => {
                      const newParams = new URLSearchParams(searchParams);
                      newParams.set('page', (page - 1).toString());
                      navigate(`/browse?${newParams.toString()}`);
                    }}
                    variant="outlined"
                    sx={{
                      fontFamily: '"Permanent Marker"',
                      color: '#1a1a1a',
                      borderColor: '#1a1a1a',
                    }}
                  >
                    Previous
                  </Button>
                  <Button
                    disabled={page * (meta.page_size ?? 0) >= (meta.total_count ?? 0)}
                    onClick={() => {
                      const newParams = new URLSearchParams(searchParams);
                      newParams.set('page', (page + 1).toString());
                      navigate(`/browse?${newParams.toString()}`);
                    }}
                    variant="outlined"
                    sx={{
                      fontFamily: '"Permanent Marker"',
                      color: '#1a1a1a',
                      borderColor: '#1a1a1a',
                    }}
                  >
                    Next
                  </Button>
                </Box>
              )}
            </>
          ) : (
            <Box sx={{ py: 12, textAlign: 'center' }}>
              <Typography
                variant="h5"
                sx={{ fontFamily: 'serif', fontStyle: 'italic', color: '#666' }}
              >
                No events found matching this filter.
              </Typography>
              <Button
                onClick={() => navigate('/')}
                sx={{
                  mt: 4,
                  fontFamily: '"Permanent Marker"',
                  textDecoration: 'underline',
                  color: '#1a1a1a',
                }}
              >
                Go back home
              </Button>
            </Box>
          )}
        </Container>
      </Box>
    </ThemeProvider>
  );
}
