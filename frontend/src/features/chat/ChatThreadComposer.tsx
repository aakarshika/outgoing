import { Box, CircularProgress, IconButton } from '@mui/material';
import { Send } from 'lucide-react';
import type { ChangeEvent, KeyboardEvent } from 'react';

export type ChatThreadComposerProps = {
  draft: string;
  onDraftChange: (value: string) => void;
  onSend: () => void;
  sending?: boolean;
  /** When false, the text field is disabled (read-only / no thread / locked). */
  inputEnabled?: boolean;
  /** When false, send and Enter-to-send are disabled even if there is draft text. */
  sendEnabled?: boolean;
  placeholder?: string;
};

export function ChatThreadComposer({
  draft,
  onDraftChange,
  onSend,
  sending = false,
  inputEnabled = true,
  sendEnabled = true,
  placeholder = 'Say something...',
}: ChatThreadComposerProps) {
  const canSubmit = inputEnabled && sendEnabled && Boolean(draft.trim()) && !sending;

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (canSubmit) onSend();
    }
  };

  return (
    <Box
      sx={{
        p: '10px 12px',
        borderTop: '0.5px solid var(--color-border-tertiary, #e5e7eb)',
        display: 'flex',
        gap: 1,
        alignItems: 'center',
        flexShrink: 0,
      }}
    >
      <Box
        component="input"
        value={draft}
        onChange={(e: ChangeEvent<HTMLInputElement>) => onDraftChange(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        disabled={!inputEnabled}
        sx={{
          flex: 1,
          bgcolor: 'var(--color-background-secondary, #f3f4f6)',
          border: '0.5px solid var(--color-border-tertiary, #e5e7eb)',
          borderRadius: '20px',
          p: '7px 12px',
          fontSize: 13,
          color: 'var(--color-text-primary, #111)',
          outline: 'none',
          fontFamily: 'inherit',
          '&:focus': { borderColor: '#15803d' },
          '&:disabled': { opacity: 0.6 },
        }}
      />
      <IconButton
        onClick={() => {
          if (canSubmit) onSend();
        }}
        disabled={!canSubmit}
        sx={{
          bgcolor: '#15803d',
          color: '#fff',
          width: 30,
          height: 30,
          '&:hover': { bgcolor: '#166534' },
          '&.Mui-disabled': {
            bgcolor: 'var(--color-background-tertiary, #e5e7eb)',
            color: '#9ca3af',
          },
        }}
      >
        {sending ? <CircularProgress size={14} color="inherit" /> : <Send size={14} />}
      </IconButton>
    </Box>
  );
}
