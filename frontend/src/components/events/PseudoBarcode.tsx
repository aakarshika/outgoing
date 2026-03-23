import { Box, Stack } from '@mui/material';
import { useMemo } from 'react';

export function PseudoBarcode({
  seed,
  compact = false,
}: {
  seed: number;
  /** Shorter bars, fewer lines — for secondary stubs */
  compact?: boolean;
}) {
  const bars = useMemo(() => {
    const count = compact ? 16 : 24;
    const scale = compact ? 0.55 : 1;
    const generatedBars: { width: number; height: number }[] = [];
    let s = seed || 1234;
    for (let i = 0; i < count; i++) {
      s = (s * 1664525 + 1013904223) & 0xffffffff;
      const width = (Math.abs(s) % 3) + 1;
      const base =
        i % 4 === 0 ? 32 : i % 3 === 0 ? 26 : i % 2 === 0 ? 22 : 18;
      const height = Math.max(10, Math.round(base * scale));
      generatedBars.push({ width, height });
    }
    return generatedBars;
  }, [seed, compact]);

  return (
    <Stack
      direction="row"
      spacing={compact ? 0.15 : 0.2}
      alignItems="flex-end"
      sx={{ height: compact ? 22 : 32 }}
    >
      {bars.map((bar, idx) => (
        <Box
          key={idx}
          sx={{
            width: bar.width,
            height: bar.height,
            bgcolor: '#1A1A1A',
            borderRadius: '1px',
          }}
        />
      ))}
    </Stack>
  );
}
