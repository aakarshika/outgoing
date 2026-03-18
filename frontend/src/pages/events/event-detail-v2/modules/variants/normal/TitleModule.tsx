import { Typography } from '@mui/material';

interface NormalTitleModuleProps {
  event: any;
}

export function NormalTitleModule({ event }: NormalTitleModuleProps) {
  return (
    <Typography
      variant="h4"
      sx={{
        fontWeight: 700,
        mb: 2,
        color: '#0f172a',
      }}
    >
      {event.title}
    </Typography>
  );
}
