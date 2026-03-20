import { Box, Stack, Typography } from '@mui/material';
import addonsData from '../../../../planning-workspace/addons.json';

interface NormalAddonsModuleProps {
  event: any;
}

export function NormalAddonsModule({ event }: NormalAddonsModuleProps) {
  const addons = event.addons || [];

  if (addons.length === 0) return null;

  return (
    <Box sx={{ px: 2.25, pb: 2, pt: 1.5 }}>
      <Stack spacing={1.5}>
        {addons.map((addon: any, index: number) => {
          const mapping = addonsData.find((a: any) => a.slug === addon.addon_slug);
          if (!mapping) return null;

          const isEven = index % 2 === 0;

          return (
            <Box 
              key={addon.id} 
              sx={{ 
                display: 'flex', 
                flexDirection: isEven ? 'row' : 'row-reverse',
                gap: 1.5,
                p: 0.5,
                borderRadius: '16px',
              }}
            >
              <Box 
                sx={{ 
                  fontSize: '1.4rem',
                  width: 44,
                  height: 44,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: 'rgba(216, 90, 48, 0.05)',
                  border: '1px solid rgba(216, 90, 48, 0.1)',
                  borderRadius: '12px',
                  flexShrink: 0
                }}
              >
                {mapping.icon}
              </Box>
              <Box sx={{ flex: 1, textAlign: isEven ? 'left' : 'right' }}>
                <Typography sx={{ fontSize: 13, fontWeight: 700, color: '#1A1A1A', mb: 0.25 }}>
                  {mapping.title}
                </Typography>
                <Typography sx={{ fontSize: 11, color: '#4B5563', lineHeight: 1.4 }}>
                  {addon.description || mapping.description}
                </Typography>
              </Box>
            </Box>
          );
        })}
      </Stack>
    </Box>
  );
}
