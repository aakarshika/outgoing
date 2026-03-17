import { Box, Button, Typography } from '@mui/material';
import { CalendarCheck, CalendarPlus } from 'lucide-react';

interface NormalSaveToggleModuleProps {
  event: any;
  isAuthenticated: boolean;
  isSaved: boolean;
  onToggle?: () => void;
  disabled?: boolean;
}

export function NormalSaveToggleModule({
  event,
  isAuthenticated,
  isSaved,
  onToggle,
  disabled = false,
}: NormalSaveToggleModuleProps) {
  const handleToggle = () => {
    if (onToggle && isAuthenticated && !disabled) {
      onToggle();
    }
  };

  return (
    <Box
      sx={{
        mx: 2,
        mt: 1.75,
      }}
    >
      <Button
        variant="outlined"
        fullWidth
        onClick={handleToggle}
        disabled={!isAuthenticated || disabled}
        startIcon={isSaved ? <CalendarCheck size={18} /> : <CalendarPlus size={18} />}
        sx={{
          borderColor: isSaved ? '#D85A30' : '#e2e8f0',
          color: isSaved ? '#D85A30' : '#475569',
          bgcolor: isSaved ? '#FFF5F2' : 'transparent',
          borderRadius: '12px',
          py: 1.25,
          '&:hover': {
            borderColor: '#D85A30',
            bgcolor: '#FFF5F2',
          },
          '&.Mui-disabled': {
            borderColor: '#e2e8f0',
            color: '#9ca3af',
          },
        }}
      >
        <Typography sx={{ fontSize: 14, fontWeight: 500 }}>
          {isSaved ? 'Saved to your calendar' : 'Save to calendar'}
        </Typography>
      </Button>
      {isAuthenticated && (
        <Typography
          sx={{ fontSize: 11, color: '#6b7280', mt: 0.75, textAlign: 'center' }}
        >
          {disabled
            ? 'Saving opens once the event is published'
            : isSaved
            ? "You'll get a reminder 24h before"
            : 'Get reminded before it starts'}
        </Typography>
      )}
    </Box>
  );
}
