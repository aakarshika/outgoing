import {
  Box,
  Button,
  CircularProgress,
  Container,
  Grid,
  Typography,
} from '@mui/material';
import { ArrowLeft, Sparkles } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { useTrendingHighlights } from '@/features/events/hooks';
import { HighlightCard } from '@/pages/events/components/HighlightCard';
import { HighlightChainViewer } from '@/pages/events/components/HighlightChainViewer';

export default function HighlightsPage() {
  const navigate = useNavigate();
  const { data, isLoading } = useTrendingHighlights(24);
  const highlights = data?.data || [];
  const [isViewerOpen, setIsViewerOpen] = useState(false);
  const [selectedHighlightId, setSelectedHighlightId] = useState<number | null>(null);

  useEffect(() => {
    if (!isLoading && highlights.length > 0 && !selectedHighlightId) {
      setSelectedHighlightId(highlights[0].id);
      setIsViewerOpen(true);
    }
  }, [isLoading, highlights, selectedHighlightId]);

  return (
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
        <Box
          sx={{
            mb: 6,
            display: 'flex',
            alignItems: { xs: 'flex-start', sm: 'center' },
            justifyContent: 'space-between',
            gap: 2,
            flexWrap: 'wrap',
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
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
            <Box>
              <Typography
                variant="h3"
                sx={{ fontFamily: '"Permanent Marker"', color: '#1a1a1a' }}
              >
                Highlights
              </Typography>
              <Typography
                sx={{
                  mt: 1,
                  fontFamily: '"Caveat", cursive',
                  fontSize: '1.35rem',
                  color: '#5b5146',
                }}
              >
                Popular moments and standout memories from across the app.
              </Typography>
            </Box>
          </Box>

          <Box
            sx={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 1,
              px: 2,
              py: 1,
              border: '2px solid #1f2937',
              bgcolor: '#fff4c2',
              boxShadow: '4px 4px 0px rgba(31,41,55,0.85)',
              transform: 'rotate(-2deg)',
            }}
          >
            <Sparkles size={18} />
            <Typography
              sx={{
                fontFamily: '"Permanent Marker", cursive',
                fontSize: '0.9rem',
                color: '#1f2937',
              }}
            >
              Trending now
            </Typography>
          </Box>
        </Box>

        {isLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 12 }}>
            <CircularProgress sx={{ color: '#1a1a1a' }} />
          </Box>
        ) : highlights.length > 0 ? (
          <Grid container spacing={{ xs: 3, md: 4 }}>
            {highlights.map((highlight: any, index: number) => (
              <Grid size={{ xs: 12, sm: 6, md: 4, lg: 3 }} key={highlight.id}>
                <Box
                  sx={{ cursor: 'pointer' }}
                  onClick={() => {
                    setSelectedHighlightId(highlight.id);
                    setIsViewerOpen(true);
                  }}
                >
                  <HighlightCard
                    highlight={highlight}
                    rotation={((index % 4) - 1.5) * 1.5}
                    rotationhover={0}
                  />
                </Box>
              </Grid>
            ))}
          </Grid>
        ) : (
          <Box sx={{ py: 12, textAlign: 'center' }}>
            <Typography
              variant="h5"
              sx={{ fontFamily: 'serif', fontStyle: 'italic', color: '#666' }}
            >
              No highlights yet.
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

        {selectedHighlightId && (
          <HighlightChainViewer
            initialHighlightId={selectedHighlightId}
            isOpen={isViewerOpen}
            onClose={() => setIsViewerOpen(false)}
          />
        )}
      </Container>
    </Box>
  );
}
