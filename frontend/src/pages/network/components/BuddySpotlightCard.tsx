import { Avatar, Box, Button, Chip, Stack, Typography } from '@mui/material';
import { ArrowRight, MessageCircle, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

import type { BuddyCard } from '../types';

function renderBuddyEventCopy(event: BuddyCard['events'][number]) {
  if (!event.prefix) {
    return event.suffix;
  }

  return (
    <>
      {event.prefix}{' '}
      {event.eventName ? (
        <Box component="span" sx={{ fontWeight: 700, color: '#2B2118' }}>
          {event.eventName}
        </Box>
      ) : null}{' '}
      {event.suffix}
    </>
  );
}

export function BuddySpotlightCard({
  buddy,
  onMessage,
  onJoin,
}: {
  buddy: BuddyCard;
  onMessage?: () => void;
  onJoin?: (eventId: number) => void;
}) {
  const navigate = useNavigate();
  const primaryIsMuted = buddy.primaryAction === 'Suggest an event';
  const eventId = buddy.met_at_event_id ?? buddy.events[0]?.eventId;

  return (
    <Box
      sx={{
        borderRadius: '16px',
        overflow: 'hidden',
        background: 'rgba(255,255,255,0.95)',
        boxShadow: '0 20px 40px rgba(110, 74, 36, 0.06)',
      }}
    >
      <Box
        sx={{
          px: 2,
          py: 1.4,
          background: buddy.categoryTone.bg,
        }}
      >
        <Stack
          direction="row"
          alignItems="center"
          justifyContent="space-between"
          spacing={1}
        >
          <Chip
            label={buddy.category}
            sx={{
              height: 24,
              background: 'rgba(255,255,255,0.72)',
              color: buddy.categoryTone.color,
              fontSize: 10.5,
              fontWeight: 800,
            }}
          />
          <Stack direction="row" spacing={0.75} alignItems="center">
            {buddy.active ? (
              <Box
                sx={{
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  background: '#1D9E75',
                  boxShadow: '0 0 0 5px rgba(29, 158, 117, 0.14)',
                }}
              />
            ) : null}
            <Typography sx={{ fontSize: 11.5, color: 'rgba(66, 50, 28, 0.70)' }}>
              {buddy.active ? 'Making plans now' : 'Quiet but warm'}
            </Typography>
          </Stack>
        </Stack>
      </Box>

      <Box sx={{ p: 2 }}>
        <Stack spacing={1.5}>
          <Stack direction="row" spacing={1.3} alignItems="flex-start">
            <Box sx={{ position: 'relative', flexShrink: 0 }}>
              <Avatar
                sx={{
                  width: 50,
                  height: 50,
                  fontSize: 15,
                  fontWeight: 800,
                  bgcolor: buddy.color,
                }}
              >
                {buddy.initial}
              </Avatar>
              {buddy.active ? (
                <Box
                  sx={{
                    position: 'absolute',
                    right: 2,
                    bottom: 2,
                    width: 10,
                    height: 10,
                    borderRadius: '50%',
                    background: '#1D9E75',
                  }}
                />
              ) : null}
            </Box>
            <Box sx={{ minWidth: 0 }}>
              <Typography
                sx={{
                  fontFamily: 'Syne, sans-serif',
                  fontSize: 20,
                  fontWeight: 800,
                  letterSpacing: '-0.04em',
                  color: '#2B2118',
                }}
              >
                {buddy.name}
              </Typography>
              <Typography
                sx={{
                  mt: 0.45,
                  fontSize: 12.5,
                  lineHeight: 1.55,
                  color: 'rgba(66, 50, 28, 0.68)',
                }}
              >
                {buddy.context}
              </Typography>
            </Box>
          </Stack>

          <Box
            sx={{
              borderRadius: '20px',
              px: 1.4,
              py: 1.15,
              background: '#F8F4EE',
            }}
          >
            <Typography
              sx={{
                fontSize: 12.5,
                lineHeight: 1.55,
                color: '#4A3827',
              }}
            >
              {buddy.note}
            </Typography>
          </Box>

          <Stack spacing={0.9}>
            {buddy.events.map((event, index) => (
              <Stack
                key={`${buddy.name}-${index}`}
                direction="row"
                spacing={1}
                alignItems="flex-start"
              >
                <Box
                  sx={{
                    width: 8,
                    height: 8,
                    borderRadius: '50%',
                    background: event.dot,
                    mt: 0.8,
                    flexShrink: 0,
                  }}
                />
                <Typography
                  sx={{
                    fontSize: 12.5,
                    lineHeight: 1.6,
                    color: 'rgba(66, 50, 28, 0.74)',
                  }}
                >
                  {renderBuddyEventCopy(event)}
                </Typography>
              </Stack>
            ))}
          </Stack>

          <Stack direction="row" spacing={1}>
            <Button
              variant="contained"
              endIcon={<ArrowRight size={15} />}
              onClick={() => {
                if (primaryIsMuted) navigate('/search');
                else if (eventId != null && onJoin) onJoin(eventId);
                else if (buddy.primaryAction === 'Message' && onMessage) onMessage();
                else if (!primaryIsMuted) navigate('/search');
              }}
              sx={{
                flex: 1,
                borderRadius: '999px',
                textTransform: 'none',
                fontWeight: 700,
                background: primaryIsMuted ? '#F3ECE5' : '#D85A30',
                color: primaryIsMuted ? '#4A3827' : '#fff',
                boxShadow: 'none',
              }}
            >
              {buddy.primaryAction}
            </Button>
            <Button
              variant="contained"
              startIcon={
                buddy.secondaryTone === 'assign' ? (
                  <Sparkles size={15} />
                ) : (
                  <MessageCircle size={15} />
                )
              }
              onClick={() => {
                if (buddy.secondaryTone === 'assign') navigate('/search');
                else if (onMessage) onMessage();
              }}
              sx={{
                borderRadius: '999px',
                textTransform: 'none',
                fontWeight: 700,
                color: buddy.secondaryTone === 'assign' ? '#854F0B' : '#2B2118',
                background: buddy.secondaryTone === 'assign' ? '#FAEEDA' : '#F3ECE5',
                boxShadow: 'none',
              }}
            >
              {buddy.secondaryAction}
            </Button>
          </Stack>
        </Stack>
      </Box>
    </Box>
  );
}
