import { Box, Typography } from '@mui/material';

interface NormalStickyFooterModuleProps {
  event: any;
  hasOpenNeeds: boolean;
  onChipIn?: () => void;
  onGetTicket?: () => void;
}

export function NormalStickyFooterModule({
  event,
  hasOpenNeeds,
  onChipIn,
  onGetTicket,
}: NormalStickyFooterModuleProps) {
  const tiers = event.ticket_tiers || [];
  const minPrice =
    tiers.length > 0
      ? Math.min(
          ...tiers.map((t: any) =>
            typeof t.price === 'number' ? t.price : parseFloat(t.price) || 0,
          ),
        )
      : 0;
  const priceDisplay = minPrice === 0 ? 'Free' : `₹${minPrice}`;

  return (
    <Box
      sx={{
        position: 'sticky',
        bottom: 0,
        bgcolor: 'var(--color-background-primary, #fff)',
        borderTop: '0.5px solid var(--color-border-tertiary, #e5e7eb)',
        p: 1.5,
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: 1.25,
        zIndex: 20,
      }}
    >
      {hasOpenNeeds ? (
        <Box
          onClick={onChipIn}
          sx={{
            fontFamily: '"DM Sans", sans-serif',
            fontSize: 13,
            fontWeight: 500,
            py: 1.5,
            borderRadius: 999,
            textAlign: 'center',
            cursor: 'pointer',
            border: '1.5px solid #EF9F27',
            color: '#854F0B',
            bgcolor: '#FAEEDA',
          }}
        >
          Chip in ⚡
        </Box>
      ) : (
        <Box
          sx={{
            fontFamily: '"DM Sans", sans-serif',
            fontSize: 13,
            fontWeight: 500,
            py: 1.5,
            borderRadius: 999,
            textAlign: 'center',
            border: '1.5px solid transparent',
          }}
        />
      )}
      <Box
        onClick={onGetTicket}
        sx={{
          fontFamily: '"DM Sans", sans-serif',
          fontSize: 13,
          fontWeight: 500,
          py: 1.5,
          borderRadius: 999,
          textAlign: 'center',
          cursor: 'pointer',
          bgcolor: '#D85A30',
          color: '#fff',
          border: 'none',
        }}
      >
        Get ticket {minPrice > 0 ? `— ₹${minPrice}` : ''}
      </Box>
    </Box>
  );
}
