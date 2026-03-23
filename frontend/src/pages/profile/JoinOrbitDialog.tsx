import { useCallback, useEffect, useId } from 'react';
import { toast } from 'sonner';

import { Box } from '@mui/material';

import { Media } from '@/components/ui/media';
import { useSendFriendRequest, useUpdateFriendRequest } from '@/features/events/hooks';

export type JoinOrbitMode = 'send' | 'incoming' | 'outgoing' | 'accepted';

export type JoinOrbitDialogProps = {
  open: boolean;
  onClose: () => void;
  targetUsername: string;
  targetDisplayName: string;
  targetAvatar?: string | null;
  viewerDisplayName: string;
  viewerAvatar?: string | null;
  categoryName: string;
  categoryBg: string;
  orbitGlyph: string;
  mode: JoinOrbitMode;
  eventId: number | null;
  requestMessagePreview?: string | null;
};

const FONT_DM = '"DM Sans", sans-serif';
const FONT_SYNE = 'Syne, sans-serif';

function initials(name: string, fallback: string) {
  const t = name.trim();
  if (t.length >= 2) return t.slice(0, 2).toUpperCase();
  if (t.length === 1) return t.toUpperCase();
  return fallback.slice(0, 2).toUpperCase();
}

export function JoinOrbitDialog({
  open,
  onClose,
  targetUsername,
  targetDisplayName,
  targetAvatar,
  viewerDisplayName,
  viewerAvatar,
  categoryName,
  categoryBg,
  orbitGlyph,
  mode,
  eventId,
  requestMessagePreview,
}: JoinOrbitDialogProps) {
  const titleId = useId();
  const sendRequest = useSendFriendRequest();
  const updateRequest = useUpdateFriendRequest();

  const busy = sendRequest.isPending || updateRequest.isPending;

  const handleBackdrop = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (e.target === e.currentTarget && !busy) onClose();
    },
    [busy, onClose],
  );

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !busy) onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, busy, onClose]);

  const runSend = () => {
    if (!eventId) return;
    sendRequest.mutate(
      {
        eventId,
        targetUsername,
        payload: {},
      },
      {
        onSuccess: (res) => {
          toast.success(res.message || 'Buddy request sent');
          onClose();
        },
        onError: (err: unknown) => {
          const msg =
            (err as { response?: { data?: { message?: string } } })?.response?.data
              ?.message || 'Could not send request';
          toast.error(msg);
        },
      },
    );
  };

  const runPatch = (action: 'accept' | 'withdraw' | 'decline') => {
    if (!eventId) {
      toast.error('Missing event for this request — try from the event page.');
      return;
    }
    updateRequest.mutate(
      { eventId, targetUsername, payload: { action } },
      {
        onSuccess: (res) => {
          toast.success(res.message || 'Updated');
          onClose();
        },
        onError: (err: unknown) => {
          const msg =
            (err as { response?: { data?: { message?: string } } })?.response?.data
              ?.message || 'Could not update request';
          toast.error(msg);
        },
      },
    );
  };

  if (!open) return null;

  const headline = `Join their ${categoryName} orbit`;

  const btnBase = {
    fontFamily: FONT_SYNE,
    fontSize: 12,
    fontWeight: 700,
    py: 1.25,
    px: 2,
    borderRadius: 999,
    border: 'none',
    cursor: 'pointer',
    '&:disabled': { opacity: 0.45, cursor: 'default' },
  } as const;

  return (
    <Box
      role="presentation"
      onMouseDown={handleBackdrop}
      sx={{
        position: 'fixed',
        inset: 0,
        zIndex: 1200,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        p: 2.5,
        bgcolor: 'rgba(26, 18, 8, 0.45)',
        backdropFilter: 'blur(6px)',
      }}
    >
      <Box
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        sx={{
          position: 'relative',
          width: '100%',
          maxWidth: 340,
          bgcolor: '#f7f3ee',
          borderRadius: '22px',
          border: '1px solid #e0dad3',
          pt: 2.75,
          px: 2.5,
          pb: 2.25,
          boxShadow: '0 20px 50px rgba(26, 18, 8, 0.18)',
          fontFamily: FONT_DM,
        }}
      >
        <Box
          component="button"
          type="button"
          aria-label="Close"
          disabled={busy}
          onClick={onClose}
          sx={{
            position: 'absolute',
            top: 12,
            right: 12,
            width: 32,
            height: 32,
            border: 'none',
            borderRadius: '10px',
            bgcolor: 'rgba(224, 218, 211, 0.5)',
            color: '#5a4a3a',
            fontSize: 22,
            lineHeight: 1,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            '&:disabled': { opacity: 0.5, cursor: 'default' },
          }}
        >
          ×
        </Box>

        <Box
          id={titleId}
          component="h2"
          sx={{
            fontFamily: FONT_SYNE,
            fontSize: 18,
            fontWeight: 800,
            color: '#1a1208',
            m: 0,
            mb: 0.5,
            mr: 3.5,
            letterSpacing: '-0.02em',
            lineHeight: 1.15,
          }}
        >
          {headline}
        </Box>
        <Box component="p" sx={{ m: 0, mb: 1.75, fontSize: 12, color: '#a09080' }}>
          @{targetUsername} · {categoryName}
        </Box>

        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 0.75,
            py: 1.75,
            px: 1.5,
            borderRadius: 2,
            border: '0.5px solid rgba(224, 218, 211, 0.9)',
            mb: 1.75,
            bgcolor: categoryBg,
          }}
        >
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 0.75,
              flex: '0 0 auto',
              width: 72,
            }}
          >
            {viewerAvatar ? (
              <Media
                src={viewerAvatar}
                alt=""
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: '50%',
                  objectFit: 'cover',
                  border: '2px solid #fff',
                }}
              />
            ) : (
              <Box
                sx={{
                  width: 48,
                  height: 48,
                  borderRadius: '50%',
                  bgcolor: '#d85a30',
                  color: '#fff',
                  fontFamily: FONT_SYNE,
                  fontSize: 15,
                  fontWeight: 800,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: '2px solid #fff',
                }}
              >
                {initials(viewerDisplayName, 'You')}
              </Box>
            )}
            <Box
              sx={{
                fontSize: 10,
                fontWeight: 600,
                color: '#5a4a3a',
                textAlign: 'center',
                maxWidth: '100%',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              You
            </Box>
          </Box>
          <Box
            sx={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              minWidth: 0,
              px: 0.25,
            }}
          >
            <Box
              component="span"
              aria-hidden
              sx={{
                flex: 1,
                height: 2,
                maxWidth: 36,
                borderRadius: '2px',
                background:
                  'linear-gradient(90deg, transparent, rgba(216, 90, 48, 0.45))',
              }}
            />
            <Box
              component="span"
              aria-hidden
              sx={{
                width: 40,
                height: 40,
                borderRadius: '50%',
                bgcolor: '#fff',
                border: '2px solid rgba(224, 218, 211, 0.95)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontFamily: FONT_SYNE,
                fontSize: 15,
                fontWeight: 800,
                color: '#1a1208',
                flexShrink: 0,
                boxShadow: '0 4px 12px rgba(26, 18, 8, 0.08)',
              }}
            >
              {orbitGlyph}
            </Box>
            <Box
              component="span"
              aria-hidden
              sx={{
                flex: 1,
                height: 2,
                maxWidth: 36,
                borderRadius: '2px',
                background:
                  'linear-gradient(270deg, transparent, rgba(83, 74, 183, 0.45))',
              }}
            />
          </Box>
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 0.75,
              flex: '0 0 auto',
              width: 72,
            }}
          >
            {targetAvatar ? (
              <Media
                src={targetAvatar}
                alt=""
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: '50%',
                  objectFit: 'cover',
                  border: '2px solid #fff',
                }}
              />
            ) : (
              <Box
                sx={{
                  width: 48,
                  height: 48,
                  borderRadius: '50%',
                  bgcolor: '#534ab7',
                  color: '#fff',
                  fontFamily: FONT_SYNE,
                  fontSize: 15,
                  fontWeight: 800,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: '2px solid #fff',
                }}
              >
                {initials(targetDisplayName, targetUsername)}
              </Box>
            )}
            <Box
              sx={{
                fontSize: 10,
                fontWeight: 600,
                color: '#5a4a3a',
                textAlign: 'center',
                maxWidth: '100%',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {targetDisplayName}
            </Box>
          </Box>
        </Box>

        {mode === 'accepted' ? (
          <Box component="p" sx={{ m: 0, mb: 1.25, fontSize: 13, lineHeight: 1.45, color: '#5a4a3a' }}>
            You&apos;re already buddies in this orbit. Say hi from chats or network.
          </Box>
        ) : null}
        {mode === 'incoming' ? (
          <>
            <Box component="p" sx={{ m: 0, mb: 1.25, fontSize: 13, lineHeight: 1.45, color: '#5a4a3a' }}>
              {targetDisplayName} wants to be your {categoryName} buddy.
            </Box>
            {requestMessagePreview ? (
              <Box
                component="blockquote"
                sx={{
                  m: 0,
                  mb: 1.5,
                  py: 1.25,
                  px: 1.5,
                  fontSize: 12,
                  lineHeight: 1.45,
                  color: '#3d3428',
                  bgcolor: '#fff',
                  borderRadius: '12px',
                  border: '0.5px solid #e0dad3',
                }}
              >
                {requestMessagePreview}
              </Box>
            ) : null}
          </>
        ) : null}
        {mode === 'outgoing' ? (
          <>
            <Box component="p" sx={{ m: 0, mb: 1.25, fontSize: 13, lineHeight: 1.45, color: '#5a4a3a' }}>
              Your buddy request is still pending.
            </Box>
            {requestMessagePreview ? (
              <Box
                component="blockquote"
                sx={{
                  m: 0,
                  mb: 1.5,
                  py: 1.25,
                  px: 1.5,
                  fontSize: 12,
                  lineHeight: 1.45,
                  color: '#3d3428',
                  bgcolor: '#fff',
                  borderRadius: '12px',
                  border: '0.5px solid #e0dad3',
                }}
              >
                {requestMessagePreview}
              </Box>
            ) : null}
          </>
        ) : null}
        {mode === 'send' ? (
          <>
            {!eventId ? (
              <Box
                component="p"
                sx={{
                  m: 0,
                  mb: 1.25,
                  fontSize: 13,
                  lineHeight: 1.45,
                  color: '#8b4510',
                  bgcolor: '#faeeda',
                  py: 1.25,
                  px: 1.5,
                  borderRadius: '12px',
                  border: '0.5px solid #e8dcc4',
                }}
              >
                You need a shared event in this orbit to send a request. Attend the same
                event (this category) and try again.
              </Box>
            ) : (
              <Box component="p" sx={{ m: 0, mb: 1.25, fontSize: 13, lineHeight: 1.45, color: '#5a4a3a' }}>
                We&apos;ll send a buddy request for this orbit using your shared event
                in this category.
              </Box>
            )}
          </>
        ) : null}

        <Box
          sx={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: 1,
            justifyContent: 'flex-end',
            mt: 0.5,
          }}
        >
          <Box
            component="button"
            type="button"
            disabled={busy}
            onClick={onClose}
            sx={{
              ...btnBase,
              bgcolor: 'transparent',
              color: '#5a4a3a',
              border: '1.5px solid #e0dad3',
            }}
          >
            Close
          </Box>
          {mode === 'incoming' ? (
            <>
              <Box
                component="button"
                type="button"
                disabled={busy || !eventId}
                onClick={() => runPatch('decline')}
                sx={{
                  ...btnBase,
                  bgcolor: 'transparent',
                  color: '#5a4a3a',
                  border: '1.5px solid #e0dad3',
                }}
              >
                Decline
              </Box>
              <Box
                component="button"
                type="button"
                disabled={busy || !eventId}
                onClick={() => runPatch('accept')}
                sx={{
                  ...btnBase,
                  bgcolor: '#d85a30',
                  color: '#fff',
                }}
              >
                Accept
              </Box>
            </>
          ) : null}
          {mode === 'outgoing' ? (
            <Box
              component="button"
              type="button"
              disabled={busy || !eventId}
              onClick={() => runPatch('withdraw')}
              sx={{
                ...btnBase,
                bgcolor: '#d85a30',
                color: '#fff',
              }}
            >
              Withdraw request
            </Box>
          ) : null}
          {mode === 'send' ? (
            <Box
              component="button"
              type="button"
              disabled={busy || !eventId}
              onClick={runSend}
              sx={{
                ...btnBase,
                bgcolor: '#d85a30',
                color: '#fff',
              }}
            >
              Join their orbit
            </Box>
          ) : null}
        </Box>
      </Box>
    </Box>
  );
}
