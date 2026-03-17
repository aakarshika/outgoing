import { Box, Button, Paper, Typography } from '@mui/material';
import { CalendarPlus } from 'lucide-react';

interface NormalSaveTheDateModuleProps {
  event: any;
  isAuthenticated: boolean;
}

export function NormalSaveTheDateModule({
  event,
  isAuthenticated,
}: NormalSaveTheDateModuleProps) {
  const handleAddToCalendar = () => {
    const startDate = new Date(event.start_time);
    const endDate = new Date(event.end_time || event.start_time);

    const googleCalendarUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(event.title)}&dates=${startDate.toISOString().replace(/[-:]/g, '').split('.')[0]}Z/${endDate.toISOString().replace(/[-:]/g, '').split('.')[0]}Z&details=${encodeURIComponent(event.description || '')}`;

    window.open(googleCalendarUrl, '_blank');
  };

  return (
    <Paper
      elevation={0}
      sx={{
        p: 2,
        borderRadius: '12px',
        border: '1px solid #e2e8f0',
        mb: 3,
      }}
    >
      <Button
        variant="outlined"
        fullWidth
        startIcon={<CalendarPlus size={18} />}
        onClick={handleAddToCalendar}
        sx={{
          borderColor: '#e2e8f0',
          color: '#475569',
          '&:hover': {
            borderColor: '#cbd5e1',
            bgcolor: '#f8fafc',
          },
        }}
      >
        Add to Calendar
      </Button>
    </Paper>
  );
}
