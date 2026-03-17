import { Box, Drawer, IconButton, Typography } from '@mui/material';
import { MessageCircle, X } from 'lucide-react';

import { HighlightComments } from './HighlightComments';

interface HighlightCommentDrawerProps {
  highlightId: number | null;
  commentsCount: number;
  isOpen: boolean;
  onClose: () => void;
}

export const HighlightCommentDrawer = ({
  highlightId,
  commentsCount,
  isOpen,
  onClose,
}: HighlightCommentDrawerProps) => {
  return (
    <Drawer
      anchor="bottom"
      open={isOpen}
      onClose={onClose}
      PaperProps={{
        sx: {
          height: { xs: '82%', md: '78%' },
          maxWidth: { xs: '100%', md: '640px' },
          mx: 'auto',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          bgcolor: '#f8fafc',
          borderTopLeftRadius: 28,
          borderTopRightRadius: 28,
          border: '1px solid rgba(148, 163, 184, 0.22)',
          boxShadow: '0 -20px 70px rgba(15, 23, 42, 0.22)',
          backgroundImage:
            'linear-gradient(180deg, rgba(255,255,255,0.94) 0%, rgba(248,250,252,0.96) 100%)',
        },
      }}
      sx={{ zIndex: 10005 }}
    >
      <Box
        sx={{
          px: 2,
          pt: 1.5,
          pb: 1.75,
          borderBottom: '1px solid rgba(148, 163, 184, 0.18)',
          bgcolor: 'rgba(255,255,255,0.78)',
          backdropFilter: 'blur(18px)',
        }}
      >
        <Box
          sx={{
            width: 56,
            height: 5,
            borderRadius: 999,
            bgcolor: 'rgba(148, 163, 184, 0.55)',
            mx: 'auto',
            mb: 1.5,
          }}
        />

        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1.25,
          }}
        >
          <Box
            sx={{
              width: 40,
              height: 40,
              display: 'grid',
              placeItems: 'center',
              borderRadius: 999,
              bgcolor: '#fff',
              color: '#D85A30',
              boxShadow: '0 8px 20px rgba(216, 90, 48, 0.14)',
              border: '1px solid rgba(216, 90, 48, 0.14)',
            }}
          >
            <MessageCircle size={18} />
          </Box>

          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography sx={{ fontSize: '1rem', fontWeight: 800, color: '#0f172a' }}>
              Comments
            </Typography>
            <Typography sx={{ fontSize: '0.86rem', color: '#64748b' }}>
              {commentsCount} {commentsCount === 1 ? 'reply' : 'replies'}
            </Typography>
          </Box>

          <IconButton
            onClick={onClose}
            size="small"
            sx={{
              color: '#475569',
              bgcolor: 'rgba(255,255,255,0.85)',
              border: '1px solid rgba(148, 163, 184, 0.18)',
            }}
          >
            <X size={20} />
          </IconButton>
        </Box>
      </Box>

      <HighlightComments highlightId={highlightId} commentsCount={commentsCount} />
    </Drawer>
  );
};
