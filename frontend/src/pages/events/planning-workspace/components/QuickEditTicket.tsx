import { Box, Button, Stack, TextField, Typography } from '@mui/material';
import { X } from 'lucide-react';
import { useState } from 'react';

import type { EventDetail, EventTicketTier } from '@/types/events';
import { TICKET_COLORS } from '@/features/events/constants';

export interface QuickEditTicketTierPayload {
  name: string;
  price: string;
  capacity: number | null;
  is_refundable: boolean;
  refund_percentage: number;
  description: string;
  admits: number;
  max_passes_per_ticket: number;
}

interface QuickEditTicketProps {
  event: EventDetail;
  /** The tier id to edit, or -1 to create a new tier, or null when closed. */
  ticketId: number | null;
  onClose: () => void;
  onSave: (tiers: QuickEditTicketTierPayload[]) => Promise<void>;
}

function buildEmptyTier(): Omit<EventTicketTier, 'id' | 'sold_count' | 'color'> {
  return {
    name: 'General Admission',
    price: '0',
    capacity: null,
    is_refundable: false,
    refund_percentage: 0,
    description: '',
    admits: 1,
  };
}

const fieldSx = {
  '& .MuiOutlinedInput-root': {
    borderRadius: '18px',
    background: '#fff',
    '& fieldset': {
      borderColor: 'rgba(143, 105, 66, 0.18)',
    },
    '&:hover fieldset': {
      borderColor: 'rgba(216, 90, 48, 0.42)',
    },
    '&.Mui-focused fieldset': {
      borderColor: '#D85A30',
    },
  },
} as const;

export function QuickEditTicket({
  event,
  ticketId,
  onClose,
  onSave,
}: QuickEditTicketProps) {
  const existingTier =
    ticketId !== null && ticketId !== -1
      ? event.ticket_tiers?.find((t) => t.id === ticketId) ?? null
      : null;

  const rawIndex = event.ticket_tiers?.findIndex((t) => t.id === ticketId) ?? -1;
  const ticket_tier_index =
    rawIndex >= 0
      ? rawIndex % TICKET_COLORS.length
      : (event.ticket_tiers?.length ?? 0) % TICKET_COLORS.length;

  const isNew = ticketId === -1;

  const initial = existingTier ?? buildEmptyTier();

  const [name, setName] = useState(initial.name);
  const [price, setPrice] = useState(String(initial.price));
  const [capacity, setCapacity] = useState(
    initial.capacity != null ? String(initial.capacity) : '',
  );
  const [admits, setAdmits] = useState(String(initial.admits));
  const [maxPerTxn, setMaxPerTxn] = useState('6');
  const [description, setDescription] = useState(initial.description);
  const [isRefundable, setIsRefundable] = useState(initial.is_refundable);
  const [refundPercentage, setRefundPercentage] = useState(
    String(initial.refund_percentage ?? 0),
  );
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const existingTiers = event.ticket_tiers ?? [];

      const buildTierPayload = (
        tier: EventTicketTier,
      ): QuickEditTicketTierPayload => ({
        name: tier.name,
        price: String(tier.price),
        capacity: tier.capacity,
        is_refundable: tier.is_refundable,
        refund_percentage: tier.refund_percentage,
        description: tier.description,
        admits: tier.admits,
        max_passes_per_ticket: 6,
      });

      const currentTierPayload: QuickEditTicketTierPayload = {
        name: name.trim() || 'General Admission',
        price: price,
        capacity: capacity ? parseInt(capacity, 10) : null,
        is_refundable: isRefundable,
        refund_percentage: Number(refundPercentage) || 0,
        description,
        admits: parseInt(admits, 10) || 1,
        max_passes_per_ticket: parseInt(maxPerTxn, 10) || 6,
      };

      let allTiers: QuickEditTicketTierPayload[];

      if (isNew) {
        allTiers = [
          ...existingTiers.map(buildTierPayload),
          currentTierPayload,
        ];
      } else {
        allTiers = existingTiers.map((t) =>
          t.id === ticketId ? currentTierPayload : buildTierPayload(t),
        );
      }

      await onSave(allTiers);
      onClose();
    } catch {
      // error handling is done in the parent via toast
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Box
      sx={{
        background: '#fffdf9',
        borderRadius: '28px',
        border: '0.5px solid rgba(143, 105, 66, 0.18)',
        boxShadow: '0 24px 64px rgba(92, 63, 31, 0.08)',
        p: 3,
        height: '100%',
        overflowY: 'auto',
      }}
    >
      <Stack
        direction="row"
        justifyContent="space-between"
        spacing={1.1}
        sx={{ mb: 2.2 }}
      >
        <Typography
          sx={{
            fontSize: 14,
            lineHeight: 1.6,
            letterSpacing: '0.04em',
            color: 'rgba(66, 50, 28, 0.74)',
            maxWidth: 680,
          }}
        >
          {isNew ? 'ADD TICKET TIER' : 'EDIT TICKET TIER'}
        </Typography>
        <Button
          type="button"
          variant="contained"
          onClick={onClose}
          sx={{
            borderRadius: '999px',
            py: 1.35,
            textTransform: 'none',
            background: '#000000ff',
            boxShadow: 'none',
            minWidth: 'auto',
            '&:hover': {
              background: '#d8d8d8ff',
              boxShadow: 'none',
            },
          }}
        >
          <X />
        </Button>
      </Stack>

      <Stack spacing={2.2}>
        {/* Tier Name */}
        <Box
          sx={{
            borderRadius: '24px',
            background: '#FFFCF7',
            border: '1px solid rgba(143, 105, 66, 0.16)',
            p: 2,
          }}
        >
          <Typography
            sx={{
              fontSize: 11,
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              color: 'rgba(66, 50, 28, 0.56)',
              mb: 1,
            }}
          >
            Tier name
          </Typography>
          <TextField
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="General Admission"
            fullWidth
            sx={fieldSx}
          />

          <>
            <TextField
              label="Ticket amount"
              type="number"
              value={String(price ?? '')}
              fullWidth
              onChange={(e) => setPrice(e.target.value)}
              sx={fieldSx}
            />
          </>
        </Box>

        {/* Pricing & Admits */}

        <Box
          sx={{
            borderRadius: '24px',
            overflow: 'hidden',
            border: '1px solid rgba(143, 105, 66, 0.18)',
            background:
              `linear-gradient(135deg, rgba(216, 90, 48, 0.08) 0%, rgba(255,255,255,1) 36%, ${TICKET_COLORS[ticket_tier_index].light} 100%)`,
          }}
        >
          <Box sx={{ display: 'flex', minHeight: 168 }}>
            <Box
              sx={{
                width: 108,
                flexShrink: 0,
                bgcolor: TICKET_COLORS[ticket_tier_index].dark,
                color: '#fff',
                position: 'relative',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                px: 1.5,
              }}
            >
              <Box
                sx={{
                  position: 'absolute',
                  top: 0,
                  right: -1,
                  bottom: 0,
                  borderRight: '2px dashed rgba(255,255,255,0.55)',
                }}
              />
              <Box
                sx={{
                  position: 'absolute',
                  top: -9,
                  right: -9,
                  width: 18,
                  height: 18,
                  borderRadius: '999px',
                  bgcolor: '#fff',
                }}
              />
              <Box
                sx={{
                  position: 'absolute',
                  bottom: -9,
                  right: -9,
                  width: 18,
                  height: 18,
                  borderRadius: '999px',
                  bgcolor: '#fff',
                }}
              />
              <Typography
                sx={{
                  fontSize: 10,
                  letterSpacing: '0.18em',
                  textTransform: 'uppercase',
                  opacity: 0.75,
                  writingMode: 'vertical-rl',
                  transform: 'rotate(180deg)',
                  mb: 1,
                }}
              >
                Admits
                {/* {resolvedPrimaryTier.admits || 1} */}
              </Typography>
              <Typography
                sx={{
                  mt: 1,
                  fontFamily: 'Syne, sans-serif',
                  fontSize: 28,
                  fontWeight: 800,
                  lineHeight: 1,
                }}
              >
                {Number(price || 0) > 0 ?
                  `$${Number(price || 0).toFixed(0)}`
                  : 'FREE'}
              </Typography>
            </Box>

            <Box
              sx={{ flex: 1, p: 2, display: 'flex', flexDirection: 'column', gap: 1.5 }}
            >
              <Typography
                sx={{
                  fontSize: 10,
                  fontWeight: 800,
                  letterSpacing: '0.1em',
                  textTransform: 'uppercase',
                  color: 'rgba(66, 50, 28, 0.56)',
                }}
              >
                Ticket
              </Typography>

              <Typography
                sx={{
                  fontFamily: 'Syne, sans-serif',
                  fontSize: 24,
                  fontWeight: 800,
                  letterSpacing: '-0.04em',
                  color: '#2B2118',
                }}
              >
                {name}
              </Typography>

              <TextField
                label="People allowed per ticket"
                type="number"
                value={String(admits ?? '1')}
                onChange={(event) => setAdmits(event.target.value || '1')}
                fullWidth
                sx={fieldSx}
              />

              <Typography
                sx={{ fontSize: 13, lineHeight: 1.7, color: 'rgba(66, 50, 28, 0.72)' }}
              >
                {Number(admits) === 1
                  ? '1 person admitted per ticket.'
                  : `${admits || 1} people admitted per ticket.`}
              </Typography>
            </Box>
          </Box>
        </Box>


        {/* Capacity & Description */}
        <Box
          sx={{
            borderRadius: '24px',
            background: '#FFFCF7',
            border: '1px solid rgba(143, 105, 66, 0.16)',
            p: 2,
          }}
        >
          <Typography
            sx={{
              fontSize: 11,
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              color: 'rgba(66, 50, 28, 0.56)',
              mb: 1,
            }}
          >
            Capacity & description
          </Typography>
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', sm: '1fr 2fr' },
              gap: 1.5,
            }}
          >
            <TextField
              label="Capacity"
              type="number"
              value={capacity}
              onChange={(e) => setCapacity(e.target.value)}
              placeholder="∞"
              helperText="Leave blank for unlimited"
              inputProps={{ min: 0 }}
              fullWidth
              sx={fieldSx}
            />
            <TextField
              label="Description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Includes VIP entry, front row seating…"
              multiline
              minRows={2}
              fullWidth
              sx={fieldSx}
            />
          </Box>
        </Box>

        {/* Save button */}
        <Stack direction="row" spacing={1}>
          <Button
            type="button"
            variant="contained"
            onClick={handleSave}
            disabled={isSaving}
            sx={{
              position: 'fixed',
              bottom: 20,
              right: 20,
              flex: 1,
              borderRadius: '999px',
              py: 1.35,
              textTransform: 'none',
              background: '#D85A30',
              boxShadow: 'none',
              '&:hover': {
                background: '#C44C24',
                boxShadow: 'none',
              },
            }}
          >
            {isSaving
              ? 'Saving…'
              : isNew
                ? 'Add tier'
                : 'Save changes'}
          </Button>
        </Stack>
      </Stack>
    </Box>
  );
}
