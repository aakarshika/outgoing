import { Box, Stack, Typography } from '@mui/material';

import type { EventNeed } from '@/types/needs';
import { useParams } from 'react-router-dom';

import { usePlanningSections } from './usePlanningSections';

export default function EventWorkspacePage() {
  const { id } = useParams<{ id?: string }>();
  const eventId = Number(id || 0);

  const { 
    HeroSectionEventStats,
    AttentionItems,
    CheckGrid,
    AllNeeds,
    AddOns,
    Ideas,
    Checklist,
    Chat,
  } = usePlanningSections({ eventId });
 


  return (
    <Box sx={{ mt: 1.5, background: '#F5F0EB', borderRadius: '24px', overflow: 'hidden' }}>
      <Box sx={{ px: 2.1, pt: 1.4 }}>
        <Typography sx={{ fontSize: 12, color: '#888780' }}>← My events</Typography>
      </Box>

      <HeroSectionEventStats />
      <AttentionItems />
      <CheckGrid />
      <AllNeeds />
      <AddOns />
      <Ideas />
      <Checklist />
      <Chat />





    </Box>
  );
}
