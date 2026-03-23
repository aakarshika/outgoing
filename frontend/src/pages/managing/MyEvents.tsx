import { Avatar, Box, Button, CircularProgress, Stack, Typography } from '@mui/material';
import type { Dispatch, SetStateAction } from 'react';

import type { PlanningChecklistItem } from '@/features/events/planningChecklist';
import { useBaseFeed } from '@/features/events/hooks';
import type { BaseFeedEventItem } from '@/types/events';

import { Plus, Sparkles, Star } from 'lucide-react';
import { FallbackBox } from '@/components/ui/FallbackBox';
import { LandscapeEventCardLow } from '@/components/events/LandscapeEventCardLow';
import { useAuth } from '@/features/auth/hooks';

interface MyEventsProps {
  hostingItems: BaseFeedEventItem[];
  expandedHostingId: string | null;
  setExpandedHostingId: Dispatch<SetStateAction<string | null>>;
  nextChecklistByItemId: Map<string, PlanningChecklistItem | null>;
  onCreateEvent: () => void;
}

export function MyEvents({
  nextChecklistByItemId: _nextChecklistByItemId,
  onCreateEvent,
}: MyEventsProps) {
  const { data, isLoading } = useBaseFeed({
    sort: 'created',
    page_size: 100,
    include_host_drafts: true,
  });

  const hostingItems = ((data?.data as BaseFeedEventItem[] | undefined) || []).filter(
    (item) => item.i_am_host,
  ).map((item) => ({
    ...item,
    ...item.event
  }));
  const { user } = useAuth();

  return (
    <Box>
      {isLoading ? (
        <Box sx={{ py: 6, display: 'grid', placeItems: 'center' }}>
          <CircularProgress sx={{ color: '#D85A30' }} />
        </Box>
      ) : hostingItems.length === 0 ? (
        <FallbackBox
          title="No hosted events"
          description="Create your first event and bring people together."
          icon={<Sparkles />}
          actionLabel="Create an event"
          onAction={onCreateEvent}
        />
      ) : (
        <Stack spacing={1.5}>

      {/* PROFILE HERO */}
      <Box
        sx={{
          background: '#D85A30',
          color: '#ffffff',
          borderRadius: '18px',
          p: 2.25,
          mb: 2.5,
          boxShadow: '0 4px 12px rgba(43, 33, 24, 0.04)',
          border: '1px solid #D85A30'
        }}
      >
        <Stack direction="row" alignItems="center" spacing={1.75} sx={{ mb: 2 }}>
          <Avatar
            src={user?.avatar || undefined}
            sx={{
              width: 52,
              height: 52,
              bgcolor: '#fff',
              color: '#D85A30',
              fontFamily: 'Syne, sans-serif',
              fontWeight: 800,
              fontSize: 18
            }}
          >
            {user?.first_name ? `${user.first_name[0]}${user.last_name?.[0] || ''}` : 'U'}
          </Avatar>
          <Box>
            <Typography sx={{ fontFamily: 'Syne, sans-serif', fontSize: 18, fontWeight: 800, color: '#ffffff' }}>
              {user?.first_name ? `${user.first_name} ${user.last_name || ''}` : 'Your Profile'}
            </Typography>
            <Typography sx={{ fontSize: 12, color: '#ffffff', mt: 0.25 }}>
              Host · { 'Bengaluru'}
            </Typography>
          </Box>
        </Stack>

        <Box sx={{ display: 'flex', borderTop: '0.5px solid #F0EDE8', pt: 1.75 }}>
          {[
            { label: 'Rating', val: '4.9', icon: <Star size={12} /> },
            { label: 'Events hosted', val: '7' },
            { label: 'Total Guests', val: '206' },
          ].map((stat, idx) => (
            <Box
              key={idx}
              sx={{
                flex: 1,
                textAlign: 'center',
                borderRight: idx === 2 ? 'none' : '0.5px solid #F0EDE8'
              }}
            >
              <Stack direction="row" alignItems="center" justifyContent="center" spacing={0.5}>
                <Typography sx={{ fontFamily: 'Syne, sans-serif', fontSize: 18, fontWeight: 800, color: '#ffffff' }}>
                  {stat.val}
                </Typography>
                {stat.icon && <Box sx={{ color: '#ffffff', mt: -0.25 }}>{stat.icon}</Box>}
              </Stack>
              <Typography sx={{ fontSize: 10, color: '#ffffff', mt: 0.25, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                {stat.label}
              </Typography>
            </Box>
          ))}
        </Box>
      </Box>

      {/* SERVICES SECTION */}
        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1.5, px: 0.5 }}>

          <Button

            onClick={(e) => {
              e.stopPropagation();
              onCreateEvent();
            }}
            startIcon={<Plus size={14} />}
            sx={{ fontSize: 12, color: '#D85A30', fontWeight: 600, textTransform: 'none', p: 0 }}
          >
            Add event
          </Button>
        </Stack>

          {hostingItems.map((item) => (
            <Box
              key={item.id}
              sx={{
                opacity: item.lifecycle_state === 'completed' ? 0.78 : 1,
                position: 'relative',
              }}
            >
              <LandscapeEventCardLow event={item} />
            </Box>
          ))}
        </Stack>
      )}
    </Box>
  );
}
