import { Box, Stack, Typography } from '@mui/material';
import { CircleDollarSign, Receipt, Wallet } from 'lucide-react';
import type { Dispatch, SetStateAction } from 'react';

import { EarningsEventRow, SummaryValueCard, formatMoney } from './useManaging';

export interface EarningsItem {
  id: string;
  eventTime: string;
  totalEarned: number;
}

interface MyEarningsProps {
  lifetimeEarned: number;
  earningsItems: EarningsItem[];
  expandedEarningId: string | null;
  setExpandedEarningId: Dispatch<SetStateAction<string | null>>;
}

export function MyEarnings({
  lifetimeEarned,
  earningsItems,
  expandedEarningId,
  setExpandedEarningId,
}: MyEarningsProps) {
  return (
    <Box>
      <Box
        sx={{
          display: 'flex',
          flexWrap: 'nowrap',
          gap: 1,
          mb: 2.2,
          overflowX: 'auto',
          pb: 0.5,
          scrollbarWidth: 'thin',
          '& > *': {
            flex: { xs: '1 1 0', md: '1 1 0' },
            minWidth: { xs: 180, sm: 200 },
          },
        }}
      >
        <SummaryValueCard
          label="Lifetime earned"
          value={formatMoney(lifetimeEarned)}
          hint="UI-first estimate across hosted and serviced live/completed events."
          icon={<Wallet size={18} />}
          compact
        />
        <SummaryValueCard
          label="Total saved"
          value="Rs 0"
          hint="Keeping this at zero until payout and savings tracking are wired."
          icon={<Receipt size={18} />}
          compact
        />
        <SummaryValueCard
          label="Events counted"
          value={String(earningsItems.length)}
          hint="Completed and live hosted or serviced events only."
          icon={<CircleDollarSign size={18} />}
          compact
        />
      </Box>

      <Box sx={{ mb: 2 }}>
        <Typography
          sx={{
            fontFamily: 'Syne, sans-serif',
            fontSize: 12,
            fontWeight: 700,
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            color: 'rgba(66, 50, 28, 0.62)',
          }}
        >
          Earnings history
        </Typography>
        <Typography
          sx={{
            mt: 0.6,
            fontFamily: 'Syne, sans-serif',
            fontSize: { xs: 22, sm: 28 },
            fontWeight: 800,
            letterSpacing: '-0.04em',
            color: '#2B2118',
          }}
        >
          Live and completed event earnings
        </Typography>
      </Box>

      {earningsItems.length === 0 ? (
        <Box sx={{ p: 4, textAlign: 'center' }}>
          <Typography
            sx={{
              fontFamily: 'Syne, sans-serif',
              fontSize: 20,
              fontWeight: 800,
              color: '#2B2118',
            }}
          >
            No earnings yet
          </Typography>
          <Typography sx={{ mt: 1, fontSize: 14, color: 'rgba(66, 50, 28, 0.72)' }}>
            Start Hosting Evemts or Providing Services to Earn Money.
          </Typography>
        </Box>
      ) : (
        <Stack spacing={1.5}>
          {earningsItems.map((item) => (
            <EarningsEventRow
              key={item.id}
              item={item as any}
              expanded={expandedEarningId === item.id}
              onToggle={() =>
                setExpandedEarningId((current) => (current === item.id ? null : item.id))
              }
            />
          ))}
        </Stack>
      )}
    </Box>
  );
}