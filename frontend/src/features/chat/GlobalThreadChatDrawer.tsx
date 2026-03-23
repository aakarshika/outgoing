import { Drawer } from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import { useEffect, useMemo, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

import { chatApi } from '@/features/chat/api';
import { ChatThreadDrawerSurface } from '@/features/chat/ChatThreadDrawerSurface';
import {
  useGlobalThreadChatDrawer,
} from '@/features/chat/GlobalThreadChatDrawerContext';
import { decodeThreadKey } from '@/features/chat/threadKeyCodec';

const ALLCHATS_THREAD_PREFIX = '/allchats/t/';

/**
 * Single app-wide drawer for `thread_key` chat: URL (`/allchats/t/:encoded`) or
 * imperative overlay via {@link useGlobalThreadChatDrawer}.openThread.
 */
export function GlobalThreadChatDrawer() {
  const location = useLocation();
  const navigate = useNavigate();
  const { overlay, setOverlay, closeThreadOverlay } = useGlobalThreadChatDrawer();
  const isPoppedRef = useRef(false);
  const locationPathRef = useRef(location.pathname);
  const pathWhenOverlayOpenedRef = useRef<string | null>(null);

  useEffect(() => {
    locationPathRef.current = location.pathname;
  }, [location.pathname]);

  const urlEncodedSegment = useMemo(() => {
    if (!location.pathname.startsWith(ALLCHATS_THREAD_PREFIX)) return null;
    return location.pathname.slice(ALLCHATS_THREAD_PREFIX.length);
  }, [location.pathname]);

  const urlThreadKey = useMemo(() => {
    if (!urlEncodedSegment) return null;
    try {
      return decodeThreadKey(urlEncodedSegment);
    } catch {
      try {
        return decodeThreadKey(decodeURIComponent(urlEncodedSegment));
      } catch {
        return null;
      }
    }
  }, [urlEncodedSegment]);

  useEffect(() => {
    if (location.pathname.startsWith('/allchats')) {
      setOverlay(null);
    }
  }, [location.pathname, setOverlay]);

  const overlayActive = Boolean(overlay);
  const threadKey = overlay?.threadKey ?? urlThreadKey;
  const open = Boolean(threadKey);

  useEffect(() => {
    if (!urlEncodedSegment || urlThreadKey) return;
    toast.error('Invalid chat link');
    navigate('/allchats', { replace: true });
  }, [urlEncodedSegment, urlThreadKey, navigate]);

  useEffect(() => {
    if (!overlayActive) {
      pathWhenOverlayOpenedRef.current = null;
      return;
    }

    pathWhenOverlayOpenedRef.current = locationPathRef.current;
    window.history.pushState({ globalThreadChatOverlay: true }, '');
    isPoppedRef.current = false;

    const handlePopState = () => {
      isPoppedRef.current = true;
      closeThreadOverlay();
    };

    window.addEventListener('popstate', handlePopState);

    return () => {
      window.removeEventListener('popstate', handlePopState);
      const openedOn = pathWhenOverlayOpenedRef.current;
      const stillOnSamePath = openedOn != null && openedOn === locationPathRef.current;
      if (
        !isPoppedRef.current &&
        stillOnSamePath &&
        window.history.state?.globalThreadChatOverlay
      ) {
        window.history.back();
      }
      pathWhenOverlayOpenedRef.current = null;
    };
  }, [overlayActive, closeThreadOverlay]);

  const { data: conversations = [] } = useQuery({
    queryKey: ['chat', 'conversations'],
    queryFn: async () => {
      const res = await chatApi.listConversations();
      if (!res.success) return [];
      return Array.isArray(res.data) ? res.data : [];
    },
    enabled: open,
  });

  const activeConversation = useMemo(
    () => (threadKey ? (conversations.find((c) => c.thread_key === threadKey) ?? null) : null),
    [conversations, threadKey],
  );

  const handleClose = () => {
    if (overlayActive) {
      closeThreadOverlay();
      return;
    }
    if (urlEncodedSegment) {
      navigate('/allchats', { replace: true });
    }
  };

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={handleClose}
      ModalProps={{ keepMounted: true }}
      PaperProps={{
        sx: {
          width: { xs: '100%', sm: 440, lg: 480 },
          maxWidth: '100vw',
          background:
            'linear-gradient(180deg, rgba(255,255,255,0.98) 0%, rgba(251,248,244,0.96) 100%)',
          boxShadow: '-18px 0 48px rgba(86, 58, 28, 0.16)',
          overflow: 'hidden',
        },
      }}
    >
      {threadKey ? (
        <ChatThreadDrawerSurface
          threadKey={threadKey}
          onClose={handleClose}
          activeConversation={activeConversation}
          fallbackTitle={overlay?.title}
          fallbackSubtitle={overlay?.subtitle}
        />
      ) : null}
    </Drawer>
  );
}
