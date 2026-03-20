import { Box, Typography } from '@mui/material';

import { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';

import { usePlanningSections } from './usePlanningSections';

export default function EventWorkspacePage() {
  const { id } = useParams<{ id?: string }>();
  const eventId = Number(id || 0);

  type RouteCardKey = 'whenWhere' | 'tickets' | 'needs' | 'guestList';
  const location = useLocation();
  const routeCardKey = useMemo<RouteCardKey | null>(() => {
    const normalizedPath = location.pathname.replace(/\/+$/, '');
    if (normalizedPath.endsWith('/basic-details')) return 'whenWhere';
    if (normalizedPath.endsWith('/needs')) return 'needs';
    if (normalizedPath.endsWith('/tickets')) return 'tickets';
    if (normalizedPath.endsWith('/admit')) return 'guestList';
    return null;
  }, [location.pathname]);

  const [routeFlashToken, setRouteFlashToken] = useState(0);
  useEffect(() => {
    setRouteFlashToken((t) => t + 1);
  }, [routeCardKey]);

  const {
    HeroSectionEventStats,
    AttentionItems,
    CheckGrid,
    AddOns,
    Ideas,
    Checklist,
    Chat,
  } = usePlanningSections({ eventId, routeCardKey, routeFlashToken });

  const navigate = useNavigate();

  return (
    <Box sx={{ mt: 1.5, background: '#F5F0EB', borderRadius: '24px', overflow: 'hidden' }}>
      <Box
        onClick={() => navigate(-1)}
        sx={{ px: 2.1, pt: 1.4 }}>
        <Typography sx={{ fontSize: 12, color: '#888780' }}>← Back</Typography>
      </Box>

      <HeroSectionEventStats />
      <AttentionItems />
      <CheckGrid />
      <AddOns />
      <Ideas />
      <Checklist />
      <Chat />
    </Box>
  );
}
