import { Box, Typography } from '@mui/material';
import { Facebook, Instagram, Twitter } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';

export function Footer() {
  const location = useLocation();
  if (location.pathname.includes('/gallery/')) return null;

  const currentYear = new Date().getFullYear();

  return (
    <Box
      component="footer"
      sx={{
        bgcolor: '#fefcf2ff', // Soft yellowish cream
        borderTop: '1px solid #e2e8f0',
        pt: { xs: 4, md: 6 },
        pb: { xs: 3, md: 4 },
        px: { xs: 2, sm: 6, lg: 8 },
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <Box
        sx={{
          maxWidth: 1200,
          mx: 'auto',
          mb: { xs: 3, md: 4 },
        }}
      >
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr 1fr 1fr', md: '2fr 1fr 1fr 1fr' },
            gap: { xs: 2.5, md: 8 },
            alignItems: 'start',
          }}
        >
          {/* Brand Section */}
          <Box
            sx={{
              gridColumn: { xs: '1 / span 3', md: 'auto' },
              textAlign: 'center',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              mb: { xs: 3, md: 0 },
            }}
          >
            <Typography
              variant="h4"
              sx={{
                fontFamily: '"Syne", sans-serif',
                fontWeight: 800,
                color: '#1e293b',
                mb: 1,
                fontSize: { xs: '1.8rem', md: '2rem' },
                letterSpacing: '-0.02em',
              }}
            >
              Outgoing
            </Typography>
            <Typography
              variant="body2"
              sx={{
                fontFamily: '"Inter", sans-serif',
                fontSize: { xs: '0.85rem', md: '0.9rem' },
                color: '#64748b',
                maxWidth: { xs: '90%', md: 300 },
                lineHeight: 1.5,
                mx: 'auto',
              }}
            >
              Turning every room and rooftop into the best venue.
            </Typography>
            <Box
              sx={{
                display: 'flex',
                gap: 1.5,
                mt: 2,
                justifyContent: 'center',
              }}
            >
              <a
                href="#"
                className="p-2 bg-white rounded-full shadow-sm hover:scale-105 transition-transform border border-slate-100 text-slate-500"
              >
                <Instagram size={18} />
              </a>
              <a
                href="#"
                className="p-2 bg-white rounded-full shadow-sm hover:scale-105 transition-transform border border-slate-100 text-slate-500"
              >
                <Twitter size={18} />
              </a>
              <a
                href="#"
                className="p-2 bg-white rounded-full shadow-sm hover:scale-105 transition-transform border border-slate-100 text-slate-500"
              >
                <Facebook size={18} />
              </a>
            </Box>
          </Box>

          {/* Links 1 */}
          <Box sx={{ textAlign: 'center' }}>
            <Typography
              sx={{
                fontFamily: '"Syne", sans-serif',
                fontWeight: 700,
                fontSize: '0.65rem',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                color: '#94a3b8',
                mb: 1.5,
              }}
            >
              Explore
            </Typography>
            <Box
              sx={{
                display: 'flex',
                flexDirection: 'column',
                gap: 1,
                alignItems: 'center',
              }}
            >
              <Link
                to="/events"
                className="text-xs font-medium text-slate-600 hover:text-slate-900 transition-colors"
              >
                Events
              </Link>
              <Link
                to="/requests"
                className="text-xs font-medium text-slate-600 hover:text-slate-900 transition-colors"
              >
                Requests
              </Link>
              <Link
                to="/services"
                className="text-xs font-medium text-slate-600 hover:text-slate-900 transition-colors"
              >
                Talent
              </Link>
              <Link
                to="/events/create"
                className="text-xs font-medium text-slate-600 hover:text-slate-900 transition-colors"
              >
                Host
              </Link>
            </Box>
          </Box>

          {/* Links 2 */}
          <Box sx={{ textAlign: 'center' }}>
            <Typography
              sx={{
                fontFamily: '"Syne", sans-serif',
                fontWeight: 700,
                fontSize: '0.65rem',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                color: '#94a3b8',
                mb: 1.5,
              }}
            >
              Company
            </Typography>
            <Box
              sx={{
                display: 'flex',
                flexDirection: 'column',
                gap: 1,
                alignItems: 'center',
              }}
            >
              <Link
                to="#"
                className="text-xs font-medium text-slate-600 hover:text-slate-900 transition-colors"
              >
                About
              </Link>
              <Link
                to="#"
                className="text-xs font-medium text-slate-600 hover:text-slate-900 transition-colors"
              >
                Careers
              </Link>
              <Link
                to="#"
                className="text-xs font-medium text-slate-600 hover:text-slate-900 transition-colors"
              >
                Contact
              </Link>
              <Link
                to="#"
                className="text-xs font-medium text-slate-600 hover:text-slate-900 transition-colors"
              >
                Safety
              </Link>
            </Box>
          </Box>

          {/* Links 3 */}
          <Box sx={{ textAlign: 'center' }}>
            <Typography
              sx={{
                fontFamily: '"Syne", sans-serif',
                fontWeight: 700,
                fontSize: '0.65rem',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                color: '#94a3b8',
                mb: 1.5,
              }}
            >
              Legal
            </Typography>
            <Box
              sx={{
                display: 'flex',
                flexDirection: 'column',
                gap: 1,
                alignItems: 'center',
              }}
            >
              <Link
                to="#"
                className="text-xs font-medium text-slate-600 hover:text-slate-900 transition-colors"
              >
                Terms
              </Link>
              <Link
                to="#"
                className="text-xs font-medium text-slate-600 hover:text-slate-900 transition-colors"
              >
                Privacy
              </Link>
              <Link
                to="#"
                className="text-xs font-medium text-slate-600 hover:text-slate-900 transition-colors"
              >
                Cookie
              </Link>
              <Link
                to="#"
                className="text-xs font-medium text-slate-600 hover:text-slate-900 transition-colors"
              >
                Host
              </Link>
            </Box>
          </Box>
        </Box>
      </Box>

      {/* Bottom Bar */}
      <Box
        sx={{
          borderTop: '1px solid rgba(0,0,0,0.05)',
          pt: 2.5,
          display: 'flex',
          flexDirection: { xs: 'column', sm: 'row' },
          justifyContent: 'center',
          alignItems: 'center',
          textAlign: 'center',
          gap: 1,
        }}
      >
        <Typography
          sx={{
            fontFamily: '"Inter", sans-serif',
            fontSize: '0.7rem',
            color: '#94a3b8',
            fontWeight: 500,
          }}
        >
          &copy; {currentYear} Outgoing, Inc. &bull; Built for the culture.
        </Typography>
      </Box>
    </Box>
  );
}
