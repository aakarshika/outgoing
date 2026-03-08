import { Box, Typography } from '@mui/material';
import { Link, useNavigate } from 'react-router-dom';

export const CommunityRequestsSection = ({ requests }: { requests: any[] }) => {
  const navigate = useNavigate();

  // Always show CommunityRequestsSection

  return (
    <Box
      sx={{
        bgcolor: '#f1ede4',
        border: '1px solid #d1d5db',
        borderRadius: '12px',
        p: { xs: 2, md: 4 },
        mt: 8,
      }}
    >
      <Box sx={{ textAlign: 'center', mb: 5 }}>
        <Typography
          variant="h4"
          sx={{ fontFamily: '"Permanent Marker"', color: '#1a1a1a' }}
        >
          📣 Community Requests
        </Typography>
        <Typography
          variant="body2"
          sx={{ fontFamily: 'serif', fontStyle: 'italic', color: '#666', mt: 1 }}
        >
          (events people want to see happen)
        </Typography>
      </Box>

      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: {
            xs: '1fr',
            md: 'repeat(2, 1fr)',
            lg: 'repeat(3, 1fr)',
          },
          gap: 3,
          mb: 6,
        }}
      >
        {requests?.length > 0 ? (
          requests.slice(0, 6).map((request: any, idx: number) => (
            <Box
              key={request.id}
              sx={{
                bgcolor: '#fff',
                border: '2px solid #e5e7eb',
                borderRadius: '8px',
                p: 3,
                display: 'flex',
                flexDirection: 'column',
                boxShadow: '4px 4px 0px rgba(0,0,0,0.05)',
                transform: `rotate(${idx % 2 === 0 ? 0.5 : -0.5}deg)`,
                transition: 'transform 0.2s, box-shadow 0.2s',
                '&:hover': {
                  transform: 'scale(1.02) rotate(0deg)',
                  boxShadow: '6px 6px 0px rgba(0,0,0,0.1)',
                  zIndex: 2,
                },
              }}
            >
              <Typography
                sx={{
                  fontFamily: '"Permanent Marker"',
                  fontSize: '0.7rem',
                  color: '#6b7280',
                  textTransform: 'uppercase',
                  letterSpacing: 1,
                  mb: 1,
                }}
              >
                Request #{request.id}
              </Typography>
              <Typography
                sx={{
                  fontFamily: '"Lora", serif',
                  fontWeight: 700,
                  fontSize: '1rem',
                  color: '#1a1a1a',
                  mb: 1.5,
                  lineHeight: 1.3,
                  display: '-webkit-box',
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden',
                }}
              >
                {request.title}
              </Typography>
              <Typography
                sx={{
                  fontFamily: 'serif',
                  fontStyle: 'italic',
                  fontSize: '0.85rem',
                  color: '#4b5563',
                  display: '-webkit-box',
                  WebkitLineClamp: 3,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden',
                  lineHeight: 1.4,
                  mb: 2,
                }}
              >
                "{request.description}"
              </Typography>
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  borderTop: '1px dashed #d1d5db',
                  pt: 1.5,
                  mt: 'auto',
                }}
              >
                <Typography
                  sx={{
                    fontFamily: '"Permanent Marker"',
                    fontSize: '0.75rem',
                    color: '#d97706',
                  }}
                >
                  ▲ {request.upvote_count} want this
                </Typography>
                {request.location_city && (
                  <Typography
                    sx={{ fontSize: '0.7rem', color: '#6b7280', fontFamily: 'serif' }}
                  >
                    📍 {request.location_city}
                  </Typography>
                )}
              </Box>
              <Box
                onClick={(e) => {
                  e.stopPropagation();
                  navigate(`/events/create?request_id=${request.id}`);
                }}
                sx={{
                  mt: 2,
                  bgcolor: '#1a1a1a',
                  color: '#fff',
                  px: 2,
                  py: 0.75,
                  fontFamily: '"Permanent Marker"',
                  fontSize: '0.75rem',
                  textAlign: 'center',
                  transform: 'rotate(-0.5deg)',
                  cursor: 'pointer',
                  '&:hover': { bgcolor: '#3b82f6' },
                  transition: 'background 0.2s',
                }}
              >
                Host This Event →
              </Box>
            </Box>
          ))
        ) : (
          <Box sx={{ py: 4, gridColumn: '1 / -1', width: '100%', textAlign: 'center' }}>
            <Typography variant="body1" sx={{ fontFamily: 'serif', fontStyle: 'italic', color: '#666' }}>
              No community requests found yet.
            </Typography>
          </Box>
        )}
      </Box>
      <Box sx={{ textAlign: 'center' }}>
        <Link
          to="/requests"
          style={{
            fontFamily: '"Permanent Marker"',
            fontSize: '1.1rem',
            color: '#1a1a1a',
            textDecoration: 'underline',
            textUnderlineOffset: '6px',
          }}
        >
          View All Requests →
        </Link>
      </Box>
    </Box>
  );
};
