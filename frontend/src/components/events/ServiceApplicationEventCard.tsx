import { Box, Chip, Stack, Typography, Collapse, Button } from '@mui/material';
import {
  ChevronDown,
  MapPin,
  Calendar,
  User,
  Users,
  MessageSquare,
  Navigation,
  CheckCircle2,
  Clock
} from 'lucide-react';
import { useState, useCallback, useMemo } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { formatShortDate, formatTime } from '@/utils/date';
import { buildGoogleExternalUrl, buildMapQuery } from '@/utils/mapEmbed';
import { getNearYouCoords, getStoredSearchLocation } from '@/utils/locationPrefs';
import { useChatDrawer } from '@/features/events/ChatDrawerContext';
import { useAuth } from '@/features/auth/hooks';
import { getCategoryVisuals } from '@/constants/categories';
import type { NeedApplication } from '@/types/needs';
import type { EventCardEvent } from './useEventCards';
import { APPLICATION_STATUS_STYLES } from '@/pages/managing/useManaging';
import { getCategoryTheme } from '@/features/events/CategoricalBackground';

interface ServiceApplicationEventCardProps {
  application: NeedApplication;
  event: EventCardEvent;
  expanded?: boolean;
  onToggle?: () => void;
}

export function ServiceApplicationEventCard({
  application,
  event,
  expanded: isExpandedProp,
  onToggle: onToggleProp,
}: ServiceApplicationEventCardProps) {
  const [isExpandedInternal, setIsExpandedInternal] = useState(false);
  const isExpanded = isExpandedProp ?? isExpandedInternal;

  const handleToggle = useCallback(() => {
    if (onToggleProp) {
      onToggleProp();
    } else {
      setIsExpandedInternal(prev => !prev);
    }
  }, [onToggleProp]);

  const statusStyle = APPLICATION_STATUS_STYLES[application.status] || APPLICATION_STATUS_STYLES.pending;

  // Mapping data from event/application
  const compensation = application.proposed_price === '0.00' || !application.proposed_price ? 'Free in' : `₹${application.proposed_price}`;
  const compensationDesc = application.status === 'accepted'
    ? 'Entry waived for your set. Bring your own gear. No ticket needed.'
    : 'Proposed compensation for your service.';

  const instructions = application.message || 'No specific instructions provided by the host yet.';
  const expectedCrowd = event.capacity ? `~${event.capacity} people` : 'Crowd size TBD';
  const locationType = event.location_name?.toLowerCase().includes('rooftop') ? 'Rooftop' : 'Indoor';

  const startTime = new Date(event.start_time);
  const endTime = event.end_time ? new Date(event.end_time) : new Date(startTime.getTime() + 3 * 60 * 60 * 1000); // Mock 3h if missing

  const { openChat } = useChatDrawer();
  const { user } = useAuth();

  const mapUrl = useMemo(() => {
    const lat = event.latitude;
    const lng = event.longitude;

    const userCoords = getNearYouCoords() || getStoredSearchLocation()?.coords;

    if (lat && lng) {
      if (userCoords) {
        return `https://www.google.com/maps/dir/?api=1&origin=${userCoords.lat},${userCoords.lng}&destination=${lat},${lng}`;
      }
      return buildGoogleExternalUrl(`${lat},${lng}`);
    }

    const query = buildMapQuery(event.location_name, (event as any).location_address);
    return buildGoogleExternalUrl(query);
  }, [event]);

  const handleGetDirections = useCallback(() => {
    if (mapUrl) window.open(mapUrl, '_blank');
  }, [mapUrl]);

  const handleMessageHost = useCallback(() => {
    if (!user || !event.host?.username) return;

    openChat({
      title: `Message ${event.host.first_name || event.host.username}`,
      mode: 'direct',
      eventId: event.id,
      targetUsername: event.host.username,
      otherUsername: event.host.username,
      otherAvatar: event.host.avatar,
      badgeLabel: 'Host',
    });
  }, [user, event.host, event.id, openChat]);

  return (
    <Box
      sx={{
        background: '#fff',
        borderRadius: '18px',
        overflow: 'hidden',
        boxShadow: isExpanded ? '0 12px 32px rgba(43, 33, 24, 0.12)' : '0 2px 8px rgba(43, 33, 24, 0.04)',
        border: '1px solid rgba(43, 33, 24, 0.06)',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        mb: 1.5
      }}
    >
      {/* COLLAPSED TOP — always visible */}
      <Box
        onClick={handleToggle}
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 1.5,
          padding: '14px 16px',
          cursor: 'pointer',
          borderLeft: `3px solid ${getCategoryTheme(event.category?.slug || '').accent}`,
          borderBottom: isExpanded ? '0.5px solid #F0EDE8' : 'none',
          '&:hover': {
            background: 'rgba(245, 240, 235, 0.3)'
          }
        }}
      >
        <Box
          sx={{
            width: 42,
            height: 42,
            borderRadius: '12px',
            background: '#FAECE7',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 20,
            flexShrink: 0
          }}
        >
          {event.cover_image ? (
            <Box component="img" src={event.cover_image} sx={{ width: '100%', height: '100%', borderRadius: '12px', objectFit: 'cover' }} />
          ) : '🎵'}
        </Box>

        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography
            sx={{
              fontFamily: 'Syne, sans-serif',
              fontSize: 14,
              fontWeight: 700,
              color: '#1A1A1A',
              lineHeight: 1.2,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap'
            }}
          >
            {event.title}
          </Typography>
          <Typography sx={{ fontSize: 11, color: '#888780', mt: 0.25 }}>
            {formatShortDate(event.start_time)} · {event.location_name}
          </Typography>
        </Box>

        <Stack alignItems="flex-end" spacing={0.75}>
          <Chip
            label={statusStyle.label}
            size="small"
            sx={{
              height: 22,
              fontSize: 11,
              fontWeight: 600,
              bgcolor: statusStyle.bg,
              color: statusStyle.color,
              borderRadius: '999px',
              border: 'none'
            }}
          />
          <ChevronDown
            size={16}
            color="#D3D1C7"
            style={{
              transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
              transition: 'transform 0.3s ease'
            }}
          />
        </Stack>
      </Box>

      {/* EXPANDED BODY */}
      <Collapse in={isExpanded} timeout="auto" unmountOnExit>
        <Box sx={{ padding: '16px' }}>

          {/* COMPENSATION */}
          <Box
            sx={{
              background: '#FAEEDA',
              borderRadius: '14px',
              padding: '14px 16px',
              marginBottom: '14px',
              display: 'flex',
              alignItems: 'center',
              gap: 1.75
            }}
          >
            <Box>
              <Typography sx={{ fontSize: 9, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#854F0B', mb: 0.5 }}>
                Your reward
              </Typography>
              <Typography sx={{ fontFamily: 'Syne, sans-serif', fontSize: 28, fontWeight: 800, color: '#BA7517', lineHeight: 1 }}>
                {compensation}
              </Typography>
            </Box>
            <Box sx={{ flex: 1 }}>
              <Typography sx={{ fontSize: 12, color: '#854F0B', lineHeight: 1.5 }}>
                {compensationDesc}
              </Typography>
            </Box>
          </Box>

          {/* DETAILS BOX */}
          <Box
            sx={{
              background: '#F5F0EB',
              borderRadius: '14px',
              overflow: 'hidden',
              marginBottom: '14px'
            }}
          >
            {[
              { icon: <Calendar size={16} />, label: 'When', val: `${formatShortDate(event.start_time)} · ${formatTime(event.start_time)} – ${formatTime(endTime.toISOString())}` },
              { icon: <MapPin size={16} />, label: 'Where', val: event.location_address || event.location_name || 'Location TBD' },
              { icon: <User size={16} />, label: 'Host', val: `${event.host?.username || 'Host'} · View profile`, isLink: true },
              { icon: <Users size={16} />, label: 'Expected crowd', val: `${expectedCrowd} · ${locationType}` },
            ].map((detail, idx) => (
              <Box
                key={idx}
                sx={{
                  display: 'flex',
                  alignItems: 'start',
                  gap: 1.5,
                  padding: '11px 14px',
                  borderBottom: idx === 3 ? 'none' : '0.5px solid #EAE7E2'
                }}
              >
                <Box sx={{ color: '#888780', mt: 0.25 }}>{detail.icon}</Box>
                <Box>
                  <Typography sx={{ fontSize: 10, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#888780', mb: 0.25 }}>
                    {detail.label}
                  </Typography>
                  <Typography sx={{ fontSize: 13, color: detail.isLink ? '#D85A30' : '#1A1A1A', lineHeight: 1.4, fontWeight: detail.isLink ? 600 : 400 }}>
                    {detail.val}
                  </Typography>
                </Box>
              </Box>
            ))}
          </Box>

          {/* INSTRUCTIONS */}
          <Box sx={{ marginBottom: '14px' }}>
            <Typography sx={{ fontSize: 10, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#888780', mb: 1, px: 0.25 }}>
              Instructions from host
            </Typography>
            <Box
              sx={{
                background: '#F5F0EB',
                borderLeft: '3px solid #D85A30',
                borderRadius: '0 10px 10px 0',
                padding: '12px 14px'
              }}
            >
              <Typography sx={{ fontSize: 13, color: '#1A1A1A', lineHeight: 1.6 }}>
                {instructions}
              </Typography>
            </Box>
          </Box>

          {/* QR SECTION */}
          {application.status === 'accepted' && (application.qr_token || application.barcode) && (
            <Box sx={{ marginBottom: '14px' }}>
              <Typography sx={{ fontSize: 10, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#888780', mb: 1, px: 0.25 }}>
                Your entry pass
              </Typography>
              <Box
                sx={{
                  background: '#1A1A1A',
                  borderRadius: '16px',
                  padding: '24px',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 1.5
                }}
              >
                <Typography sx={{ fontFamily: 'Syne, sans-serif', fontSize: 14, fontWeight: 700, color: '#fff', textAlign: 'center' }}>
                  {event.title}
                </Typography>
                <Typography sx={{ fontSize: 10, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'rgba(255,255,255,0.5)', textAlign: 'center', mb: 1 }}>
                  Contributor Pass
                </Typography>

                <Box sx={{ p: 1.5, background: '#fff', borderRadius: '12px' }}>
                  <QRCodeSVG
                    value={application.qr_token || application.barcode || ''}
                    size={140}
                    level="H"
                  />
                </Box>

                <Box sx={{ width: '100%', height: '0.5px', background: 'rgba(255,255,255,0.1)', my: 1.5 }} />

                <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ width: '100%' }}>
                  <Box>
                    <Typography sx={{ fontSize: 13, fontWeight: 600, color: '#fff' }}>
                      {application.vendor_name || 'Contributor'}
                    </Typography>
                    <Typography sx={{ fontSize: 11, color: 'rgba(255,255,255,0.5)' }}>
                      {formatShortDate(event.start_time)} · {formatTime(event.start_time)}
                    </Typography>
                  </Box>
                  <Typography sx={{ fontFamily: 'monospace', fontSize: 9, color: 'rgba(255,255,255,0.4)', letterSpacing: '0.1em' }}>
                    {application.barcode || 'PASS-TKN'}
                  </Typography>
                </Stack>
              </Box>
            </Box>
          )}

          {/* ACTIONS */}
          <Stack spacing={1}>
            <Button
              fullWidth
              variant="contained"
              onClick={handleMessageHost}
              startIcon={<MessageSquare size={18} />}
              sx={{
                background: '#D85A30',
                color: '#fff',
                borderRadius: '12px',
                padding: '13px',
                fontSize: 14,
                fontWeight: 600,
                textTransform: 'none',
                '&:hover': { background: '#BF4E29' }
              }}
            >
              Message Host
            </Button>
            <Button
              fullWidth
              variant="outlined"
              onClick={handleGetDirections}
              startIcon={<Navigation size={18} />}
              sx={{
                borderColor: '#D3D1C7',
                color: '#1A1A1A',
                borderRadius: '12px',
                padding: '13px',
                fontSize: 14,
                fontWeight: 600,
                textTransform: 'none',
                '&:hover': { borderColor: '#1A1A1A', background: 'rgba(0,0,0,0.02)' }
              }}
            >
              Get directions
            </Button>
          </Stack>

        </Box>
      </Collapse>
    </Box>
  );
}
