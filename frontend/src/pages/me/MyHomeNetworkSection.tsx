import { Box, Stack, Typography } from '@mui/material';

import { SectionHeading } from './MyHomeSectionHeading';

type NetworkGroup = {
  name: string;
  icon: string;
  background: string;
  active: boolean;
};

type Props = {
  groups: readonly NetworkGroup[];
  onClickGroup: () => void;
};

export function MyHomeNetworkSection({ groups, onClickGroup }: Props) {
  return (
    <Box sx={{ minWidth: 0 }}>
      <SectionHeading eyebrow="Your network" title="" />
      <Box
        sx={{
          display: 'flex',
          gap: 1.4,
          overflowX: 'auto',
          pb: 1,
          mt: 2,
          scrollbarWidth: 'none',
          '&::-webkit-scrollbar': { display: 'none' },
        }}
      >
        {groups.map((group) => (
          <Stack
            key={group.name}
            spacing={1}
            alignItems="center"
            sx={{ minWidth: 78, cursor: 'pointer' }}
            onClick={onClickGroup}
          >
            <Box
              sx={{
                width: 62,
                height: 62,
                borderRadius: '50%',
                display: 'grid',
                placeItems: 'center',
                fontSize: 24,
                background: group.background,
                border: group.active ? '2px solid #D85A30' : '2px solid transparent',
                boxShadow: group.active
                  ? '0 0 0 5px rgba(216,90,48,0.08)'
                  : 'none',
                transition: 'all 0.2s ease',
                '&:hover': {
                  transform: 'scale(1.05)',
                  boxShadow: '0 8px 24px rgba(0,0,0,0.08)',
                },
              }}
            >
              {group.icon}
            </Box>
            <Typography
              sx={{
                fontSize: 11.5,
                textAlign: 'center',
                color: 'rgba(66, 50, 28, 0.68)',
                lineHeight: 1.25,
              }}
            >
              {group.name}
            </Typography>
          </Stack>
        ))}
      </Box>
    </Box>
  );
}

