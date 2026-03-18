import { Drawer } from '@mui/material';

import { HighlightComments } from './HighlightComments';
import { HighlightCommentDrawerHeader } from './HighlightCommentSheetParts';

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
          height: { xs: '78%', sm: '74%', md: '78%' },
          maxWidth: { xs: '100%', md: '640px' },
          mx: 'auto',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          bgcolor: '#fff',
          borderTopLeftRadius: { xs: 24, sm: 28 },
          borderTopRightRadius: { xs: 24, sm: 28 },
          border: '1px solid rgba(15, 23, 42, 0.08)',
          boxShadow: '0 -24px 80px rgba(15, 23, 42, 0.22)',
        },
      }}
      sx={{ zIndex: 10005 }}
    >
      <HighlightCommentDrawerHeader commentsCount={commentsCount} onClose={onClose} />

      <HighlightComments highlightId={highlightId} commentsCount={commentsCount} />
    </Drawer>
  );
};
