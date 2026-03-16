import { Box } from '@mui/material';

export function SearchFilterButton({
  active,
  label,
  onClick,
  accent = '#1a1a1a',
  square = false,
  icon,
}: {
  active: boolean;
  label: string;
  onClick: () => void;
  accent?: string;
  square?: boolean;
  icon?: string;
}) {
  return (
    <Box
      component="button"
      onClick={onClick}
      sx={{
        border: `1px solid ${active ? accent : 'rgba(17,24,39,0.12)'}`,
        backgroundColor: active ? accent : '#ffffff',
        color: active ? '#ffffff' : '#4b5563',
        borderRadius: square ? '8px' : '999px',
        px: square ? 1.25 : 1.5,
        py: square ? 0.7 : 0.8,
        fontSize: 12,
        fontWeight: 600,
        lineHeight: 1,
        cursor: 'pointer',
        whiteSpace: 'nowrap',
        display: 'inline-flex',
        alignItems: 'center',
        gap: 0.75,
        transition: 'all 0.15s ease',
        '&:hover': {
          borderColor: active ? accent : 'rgba(17,24,39,0.28)',
          color: active ? '#ffffff' : '#111827',
        },
      }}
    >
      {icon ? <span>{icon}</span> : null}
      <span>{label}</span>
    </Box>
  );
}
