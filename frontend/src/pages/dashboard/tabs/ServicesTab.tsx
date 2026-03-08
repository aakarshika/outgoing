import { Box } from '@mui/material';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';

export function ServicesTab() {
  const navigate = useNavigate();
  const location = useLocation();

  // Determine active subtab from pathname
  const isOpportunities = location.pathname.includes('/opportunities');
  const serviceSubTab = isOpportunities ? 'opportunities' : 'my_services';

  const setServiceSubTab = (newSubTab: 'my_services' | 'opportunities') => {
    if (newSubTab === 'my_services') {
      navigate('/dashboard/services/my-services');
    } else {
      navigate('/dashboard/services/opportunities');
    }
  };

  return (
    <div className="mt-2">
      {/* Washi tape style sub-tabs */}
      <Box
        sx={{
          mb: 4,
          display: 'flex',
          gap: 1,
          borderBottom: '2px dashed #ccc',
          pb: 1,
          overflowX: 'auto',
        }}
      >
        <Box
          onClick={() => setServiceSubTab('my_services')}
          sx={{
            px: 3,
            py: 1,
            cursor: 'pointer',
            bgcolor: serviceSubTab === 'my_services' ? '#fde047' : 'transparent',
            border: '2px solid #333',
            borderBottom: 'none',
            transition: 'all 0.2s ease',
            transform: 'rotate(-1deg) translateY(2px)',
            zIndex: serviceSubTab === 'my_services' ? 2 : 1,
            '&:hover': { bgcolor: '#fef08a' },
            fontFamily: '"Permanent Marker", cursive',
            color: '#111',
            fontSize: '0.9rem',
            boxShadow: serviceSubTab === 'my_services' ? '2px -2px 0px #333' : 'none',
          }}
        >
          My Services
        </Box>
        <Box
          onClick={() => setServiceSubTab('opportunities')}
          sx={{
            px: 3,
            py: 1,
            cursor: 'pointer',
            bgcolor: serviceSubTab === 'opportunities' ? '#93c5fd' : 'transparent',
            border: '2px solid #333',
            borderBottom: 'none',
            transition: 'all 0.2s ease',
            transform: 'rotate(1deg) translateY(2px)',
            zIndex: serviceSubTab === 'opportunities' ? 2 : 1,
            '&:hover': { bgcolor: '#bfdbfe' },
            fontFamily: '"Permanent Marker", cursive',
            color: '#111',
            fontSize: '0.9rem',
            boxShadow: serviceSubTab === 'opportunities' ? '2px -2px 0px #333' : 'none',
          }}
        >
          Opportunities Feed
        </Box>
      </Box>

      <Outlet />
    </div>
  );
}
