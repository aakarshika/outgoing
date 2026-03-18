import { Box, Typography } from '@mui/material';
import { LIFECYCLE_CONFIG } from './StatusModule';

interface NormalHostStripModuleProps {
  event: any;
  isHost: boolean;
}

export function NormalHostStripModule({ event, isHost }: NormalHostStripModuleProps) {
  const host = event.host;
  const coHosts = event.co_hosts || [];
  const lifecycle = event?.lifecycle_state || 'draft';
  const config = LIFECYCLE_CONFIG[lifecycle] || LIFECYCLE_CONFIG.draft;

  const getInitials = (name: string) => {
    return name?.charAt(0)?.toUpperCase() || '?';
  };

  const getColorFromName = (name: string) => {
    const colors = ['#D85A30', '#534AB7', '#1D9E75', '#D4537E', '#BA7517', '#3B6D11'];
    const index = name?.charCodeAt(0) % colors.length || 0;
    return colors[index];
  };

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25, px: 2, pt: 2 }}>
      <Box
        sx={{
          width: 36,
          height: 36,
          borderRadius: '50%',
          bgcolor: getColorFromName(host?.username),
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 12,
          fontWeight: 500,
          color: '#fff',
          flexShrink: 0,
          overflow: 'hidden',
        }}
      >
        {host?.avatar ? (
          <Box
            component="img"
            src={host.avatar}
            sx={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
        ) : (
          getInitials(host?.name || host?.username || 'H')
        )}
      </Box>
      <Box sx={{ flex: 1 }}>
        <Typography
          sx={{
            fontSize: 10,
            color: 'var(--color-text-secondary, #6b7280)',
            textTransform: 'uppercase',
            letterSpacing: '0.06em',
            fontWeight: 500,
          }}
        >
          Hosted by
        </Typography>
        <Typography
          sx={{
            fontSize: 13,
            fontWeight: 500,
            color: 'var(--color-text-primary, #111)',
          }}
        >
          {host?.name || host?.username}
          {isHost && " · you're the host"}
        </Typography>
      </Box>

      <Box sx={{ display: 'flex', alignItems: 'center', ml: 'auto', gap: 1 }}>
        <Box
          sx={{
            fontSize: 9,
            fontWeight: 600,
            px: 1,
            py: 0.3,
            borderRadius: '4px',
            bgcolor: config.bg,
            color: config.color,
            textTransform: 'uppercase',
            letterSpacing: '0.02em',
            whiteSpace: 'nowrap',
          }}
        >
          {config.label}
        </Box>

        {coHosts.length > 0 && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <Box sx={{ display: 'flex' }}>
              {coHosts.slice(0, 3).map((coHost: any, idx: number) => (
                <Box
                  key={idx}
                  sx={{
                    width: 26,
                    height: 26,
                    borderRadius: '50%',
                    bgcolor: getColorFromName(coHost.username + idx),
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 9,
                    fontWeight: 500,
                    color: '#fff',
                    ml: idx > 0 ? -0.5 : 0,
                    border: '2px solid var(--color-background-primary, #fff)',
                  }}
                >
                  {getInitials(coHost.name || coHost.username)}
                </Box>
              ))}
            </Box>
            {coHosts.length > 3 && (
              <Typography
                sx={{
                  fontSize: 11,
                  color: 'var(--color-text-secondary, #6b7280)',
                  ml: 0.75,
                }}
              >
                +{coHosts.length - 3}
              </Typography>
            )}
          </Box>
        )}
      </Box>
    </Box>
  );
}
