import { Avatar, Box, Button, Stack, Typography } from '@mui/material';
import { ArrowRight, Clock3 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

import type { ActivityItem } from '../types';

export function ActivityCard({
  item,
  onCtaClick,
}: {
  item: ActivityItem;
  onCtaClick?: (eventId?: number) => void;
}) {
  const navigate = useNavigate();

  return (
    <Box
      sx={{
        borderRadius: '18px',
        p: 1.7,
        background: 'rgba(255,255,255,0.88)',
      }}
    >
      <Stack direction="row" spacing={1.3} alignItems="flex-start">
        <Avatar
          sx={{
            width: 38,
            height: 38,
            fontSize: 12,
            fontWeight: 700,
            bgcolor: item.color,
          }}
        >
          {item.initial}
        </Avatar>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Stack
            direction={{ xs: 'column', sm: 'row' }}
            spacing={0.8}
            alignItems={{ xs: 'flex-start', sm: 'center' }}
            justifyContent="space-between"
          >
            <Typography
              sx={{
                fontSize: 13.5,
                lineHeight: 1.55,
                color: '#2B2118',
              }}
            >
              {item.text}
            </Typography>
            <Stack
              direction="row"
              spacing={0.55}
              alignItems="center"
              sx={{ flexShrink: 0 }}
            >
              <Clock3 size={13} color="#8A7762" />
              <Typography sx={{ fontSize: 11.5, color: 'rgba(66, 50, 28, 0.58)' }}>
                {item.time}
              </Typography>
            </Stack>
          </Stack>

          {item.event ? (
            <Box
              sx={{
                mt: 1.1,
                borderRadius: '18px',
                px: 1.2,
                py: 1,
                background: '#F6F1EC',
              }}
            >
              <Stack direction="row" spacing={1} alignItems="center">
                <Typography sx={{ fontSize: 15 }}>{item.event.icon}</Typography>
                <Box sx={{ minWidth: 0 }}>
                  <Typography
                    sx={{ fontSize: 12.5, fontWeight: 700, color: '#2B2118' }}
                  >
                    {item.event.title}
                  </Typography>
                  <Typography sx={{ fontSize: 11.5, color: 'rgba(66, 50, 28, 0.62)' }}>
                    {item.event.subtitle}
                  </Typography>
                </Box>
              </Stack>
            </Box>
          ) : null}

          {item.cta ? (
            <Button
              variant="text"
              endIcon={<ArrowRight size={15} />}
              onClick={() => {
                if (item.event?.eventId != null)
                  navigate(`/events/${item.event.eventId}`);
                else onCtaClick?.(item.event?.eventId);
              }}
              sx={{
                mt: 0.85,
                px: 0,
                minWidth: 0,
                textTransform: 'none',
                fontWeight: 700,
                color: '#D85A30',
              }}
            >
              {item.cta}
            </Button>
          ) : null}
        </Box>
      </Stack>
    </Box>
  );
}
