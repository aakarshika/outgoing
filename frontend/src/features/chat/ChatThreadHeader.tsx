import { Box, IconButton, Stack } from '@mui/material';
import type { SxProps, Theme } from '@mui/material/styles';
import { X } from 'lucide-react';
import type { ReactNode } from 'react';

export type ChatThreadHeaderProps = {
  /** Avatar or icon slot (left). */
  leading?: ReactNode;
  title: ReactNode;
  subtitle?: ReactNode;
  /** Extra lines under subtitle (relationship, event meta, etc.). */
  details?: ReactNode;
  /** Right-side actions. If omitted and `onClose` is set, a close button is shown. */
  trailing?: ReactNode;
  onClose?: () => void;
  /** Override default header chrome (border, padding, background). */
  sx?: SxProps<Theme>;
};

/**
 * Presentational header for a chat surface (drawer, modal, embedded column).
 * Styling matches the All Chats drawer header.
 */
export function ChatThreadHeader({
  leading,
  title,
  subtitle,
  details,
  trailing,
  onClose,
  sx,
}: ChatThreadHeaderProps) {
  const right =
    trailing ??
    (onClose ? (
      <IconButton aria-label="Close" onClick={onClose} size="small">
        <X size={20} />
      </IconButton>
    ) : null);

  return (
    <Stack
      direction="row"
      alignItems="center"
      spacing={1.5}
      sx={{
        px: 2,
        py: 1.75,
        flexShrink: 0,
        borderBottom: '1px solid rgba(120, 94, 60, 0.1)',
        background:
          'linear-gradient(180deg, rgba(250, 236, 231, 0.95) 0%, rgba(255,255,255,0.9) 100%)',
        ...sx,
      }}
    >
      {leading}
      <Box sx={{ minWidth: 0, flex: 1 }}>
        {title}
        {subtitle}
        {details}
      </Box>
      {right}
    </Stack>
  );
}
