import { Box, Typography } from '@mui/material';
import { Facebook, Instagram, Twitter } from 'lucide-react';
import { Link } from 'react-router-dom';

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <Box
      component="footer"
      sx={{
        bgcolor: '#eae6da', // Slightly darker old paper tone
        borderTop: '3px dashed #d1d5db',
        pt: 8,
        pb: 4,
        px: { xs: 4, sm: 6, lg: 8 },
        position: 'relative',
        mt: 'auto',
        overflow: 'hidden',
      }}
    >
      {/* Decorative Tape */}
      <Box
        sx={{
          position: 'absolute',
          top: -10,
          left: '50%',
          transform: 'translateX(-50%) rotate(-2deg)',
          width: 120,
          height: 25,
          bgcolor: 'rgba(239, 68, 68, 0.4)', // Red tape
          zIndex: 10,
        }}
      />

      <Box
        sx={{
          maxWidth: 1200,
          mx: 'auto',
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', md: '2fr 1fr 1fr 1fr' },
          gap: 6,
          mb: 6,
        }}
      >
        {/* Brand Section */}
        <Box>
          <Typography
            variant="h4"
            sx={{
              fontFamily: '"Permanent Marker"',
              color: '#1a1a1a',
              mb: 2,
              transform: 'rotate(-2deg)',
            }}
          >
            Outgoing
          </Typography>
          <Typography
            variant="body2"
            sx={{
              fontFamily: '"Caveat", cursive',
              fontSize: '1.2rem',
              color: '#4b5563',
              maxWidth: 300,
              lineHeight: 1.4,
            }}
          >
            Turning every living room, rooftop, and backyard into the best venue in the
            city. Start hosting or find your next adventure.
          </Typography>
          <Box sx={{ display: 'flex', gap: 2, mt: 3 }}>
            <a
              href="#"
              className="p-2 bg-white rounded-full shadow-sm hover:scale-110 transition-transform hover:-rotate-6 border border-gray-200"
            >
              <Instagram size={20} color="#1a1a1a" />
            </a>
            <a
              href="#"
              className="p-2 bg-white rounded-full shadow-sm hover:scale-110 transition-transform hover:rotate-6 border border-gray-200"
            >
              <Twitter size={20} color="#1a1a1a" />
            </a>
            <a
              href="#"
              className="p-2 bg-white rounded-full shadow-sm hover:scale-110 transition-transform hover:-rotate-3 border border-gray-200"
            >
              <Facebook size={20} color="#1a1a1a" />
            </a>
          </Box>
        </Box>

        {/* Links 1 */}
        <Box>
          <Typography
            variant="h6"
            sx={{
              fontFamily: '"Permanent Marker"',
              fontSize: '1.1rem',
              color: '#374151',
              mb: 3,
            }}
          >
            Explore
          </Typography>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
            <Link
              to="/events"
              className="font-serif text-sm text-gray-600 hover:text-primary hover:underline transition-colors w-fit"
            >
              All Events
            </Link>
            <Link
              to="/requests"
              className="font-serif text-sm text-gray-600 hover:text-primary hover:underline transition-colors w-fit"
            >
              Community Requests
            </Link>
            <Link
              to="/services"
              className="font-serif text-sm text-gray-600 hover:text-primary hover:underline transition-colors w-fit"
            >
              Hire Talent
            </Link>
            <Link
              to="/events/create"
              className="font-serif text-sm text-gray-600 hover:text-primary hover:underline transition-colors w-fit"
            >
              Host an Event
            </Link>
          </Box>
        </Box>

        {/* Links 2 */}
        <Box>
          <Typography
            variant="h6"
            sx={{
              fontFamily: '"Permanent Marker"',
              fontSize: '1.1rem',
              color: '#374151',
              mb: 3,
            }}
          >
            Company
          </Typography>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
            <Link
              to="#"
              className="font-serif text-sm text-gray-600 hover:text-primary hover:underline transition-colors w-fit"
            >
              About Us
            </Link>
            <Link
              to="#"
              className="font-serif text-sm text-gray-600 hover:text-primary hover:underline transition-colors w-fit"
            >
              Careers
            </Link>
            <Link
              to="#"
              className="font-serif text-sm text-gray-600 hover:text-primary hover:underline transition-colors w-fit"
            >
              Contact
            </Link>
            <Link
              to="#"
              className="font-serif text-sm text-gray-600 hover:text-primary hover:underline transition-colors w-fit"
            >
              Trust & Safety
            </Link>
          </Box>
        </Box>

        {/* Links 3 */}
        <Box>
          <Typography
            variant="h6"
            sx={{
              fontFamily: '"Permanent Marker"',
              fontSize: '1.1rem',
              color: '#374151',
              mb: 3,
            }}
          >
            Legal
          </Typography>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
            <Link
              to="#"
              className="font-serif text-sm text-gray-600 hover:text-primary hover:underline transition-colors w-fit"
            >
              Terms of Service
            </Link>
            <Link
              to="#"
              className="font-serif text-sm text-gray-600 hover:text-primary hover:underline transition-colors w-fit"
            >
              Privacy Policy
            </Link>
            <Link
              to="#"
              className="font-serif text-sm text-gray-600 hover:text-primary hover:underline transition-colors w-fit"
            >
              Cookie Policy
            </Link>
            <Link
              to="#"
              className="font-serif text-sm text-gray-600 hover:text-primary hover:underline transition-colors w-fit"
            >
              Host Agreement
            </Link>
          </Box>
        </Box>
      </Box>

      {/* Bottom Bar */}
      <Box
        sx={{
          borderTop: '1px solid rgba(0,0,0,0.1)',
          pt: 4,
          display: 'flex',
          flexDirection: { xs: 'column', sm: 'row' },
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: 2,
        }}
      >
        <Typography sx={{ fontFamily: 'serif', fontSize: '0.85rem', color: '#6b7280' }}>
          &copy; {currentYear} Outgoing, Inc. All rights reserved.
        </Typography>
        <Box sx={{ display: 'flex', gap: 3 }}>
          <Typography
            sx={{ fontFamily: 'serif', fontSize: '0.85rem', color: '#6b7280' }}
          >
            Built with 💛 for the culture.
          </Typography>
        </Box>
      </Box>
    </Box>
  );
}
