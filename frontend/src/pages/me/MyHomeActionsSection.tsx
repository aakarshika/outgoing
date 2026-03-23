import { Box, Button, Chip, Drawer, Typography } from '@mui/material';
import { ArrowRight, Globe2, Lightbulb, Sparkle } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';

import {
  QuickCreateSpark,
  type QuickCreateAction,
  type QuickCreateSubmitPayload,
} from '@/components/events/QuickCreateSpark';
import { createEvent, updateEventTicketTiers } from '@/features/events/api';
import { useCategories } from '@/features/events/hooks';

export function MyHomeActionsSection() {
  const [isQuickCreateOpen, setIsQuickCreateOpen] = useState(false);
  const [isQuickCreateSubmitting, setIsQuickCreateSubmitting] = useState(false);
  const { data: categoriesResponse } = useCategories();
  const categories = categoriesResponse?.data ?? [];

  const handleQuickCreateSubmit = async (
    action: QuickCreateAction,
    payload: QuickCreateSubmitPayload,
  ) => {
    setIsQuickCreateSubmitting(true);
    const formData = new FormData();
    formData.set('title', payload.title);
    formData.set(
      'description',
      payload.description.trim() || 'Planning is underway. More details are coming soon.',
    );
    formData.set('category_id', String(payload.categoryId));
    formData.set('start_time', payload.startTimeIso);
    formData.set('end_time', payload.endTimeIso);
    formData.set('status', action === 'post' ? 'published' : 'draft');

    if (payload.locationMode === 'online') {
      formData.set('location_name', payload.onlineUrl || 'Online Event');
      formData.set('location_address', 'Online Event');
    } else {
      formData.set('location_name', payload.locationName);
      formData.set('location_address', payload.locationAddress);
      if (payload.latitude) formData.set('latitude', payload.latitude);
      if (payload.longitude) formData.set('longitude', payload.longitude);
    }

    if (payload.capacity) {
      formData.set('capacity', payload.capacity);
    }
    if (payload.ticketPriceStandard !== null) {
      formData.set('ticket_price_standard', payload.ticketPriceStandard);
    }
    if (payload.features.length > 0) {
      formData.set('features', JSON.stringify(payload.features));
    }
    if (payload.coverFile) {
      formData.set('cover_image', payload.coverFile);
    }

    try {
      const result = await createEvent(formData);
      const totalCapacityVal = payload.capacity ? parseInt(payload.capacity, 10) : null;
      const tiersToSave = payload.ticketTiers.map((tier, index) => {
        const isLastTier = index === payload.ticketTiers.length - 1;
        let calculatedCapacity =
          tier.capacity === '' || tier.capacity === null ? null : Number(tier.capacity);
        if (isLastTier && totalCapacityVal !== null) {
          const sumOthers = payload.ticketTiers
            .slice(0, -1)
            .reduce((sum, item) => sum + (Number(item.capacity) || 0), 0);
          calculatedCapacity = Math.max(0, totalCapacityVal - sumOthers);
        }

        return {
          name: tier.name || 'General Admission',
          price: Number(tier.price || 0).toFixed(2),
          capacity: calculatedCapacity,
          is_refundable: true,
          description: tier.description || '',
          admits: Number(tier.admits || 1),
          max_passes_per_ticket: Number(tier.max_passes_per_ticket || 6),
        };
      });

      if (tiersToSave.length > 0) {
        await updateEventTicketTiers(result.data.id, tiersToSave, false);
      }

      setIsQuickCreateOpen(false);
      if (action === 'post') {
        toast.success('Event posted');
        return;
      }
      toast.success('Draft created. Keep building it.');
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Could not create this event');
      throw error;
    } finally {
      setIsQuickCreateSubmitting(false);
    }
  };

  return (
    <>
      <Box
        sx={{
          borderRadius: '30px',
          p: { xs: 2.2, sm: 2.8 },
          display: 'flex',
          flexDirection: { xs: 'column', md: 'row' },
          alignItems: { xs: 'flex-start', md: 'center' },
          gap: 2,
        }}
      >
      </Box>
      <Box
        sx={{
          borderRadius: '30px',
          p: { xs: 2.2, sm: 2.8 },
          background:
            'linear-gradient(135deg, rgba(255,247,236,0.95) 0%, rgba(255,255,255,0.96) 100%)',
          border: '1px solid rgba(143, 105, 66, 0.12)',
          display: 'flex',
          flexDirection: { xs: 'column', md: 'row' },
          alignItems: { xs: 'flex-start', md: 'center' },
          gap: 2,
        }}
      >
        <Box
          sx={{
            width: 52,
            height: 52,
            borderRadius: '18px',
            display: 'grid',
            placeItems: 'center',
            background: '#FAECE7',
            color: '#D85A30',
            flexShrink: 0,
          }}
        >
          <Lightbulb size={24} />
        </Box>
        <Box sx={{ flex: 1 }}>
          <Typography
            sx={{
              fontFamily: 'Syne, sans-serif',
              fontSize: 18,
              fontWeight: 800,
              color: '#2B2118',
            }}
          >
            Got an idea for an event?
          </Typography>
          <Typography
            sx={{
              mt: 0.5,
              fontSize: 14,
              color: 'rgba(66, 50, 28, 0.5)',
              maxWidth: 640,
            }}
          >
            Post it, find contributors, and let your community build it with you.
          </Typography>
        </Box>
        <Button
          type="button"
          onClick={() => setIsQuickCreateOpen(true)}
          variant="contained"
          endIcon={<ArrowRight size={16} />}
          sx={{
            minHeight: 44,
            px: 2.2,
            borderRadius: '999px',
            textTransform: 'none',
            fontWeight: 700,
            background: '#D85A30',
            boxShadow: 'none',
            '&:hover': { background: '#C24E27', boxShadow: 'none' },
          }}
        >
          Start an event
        </Button>
      </Box>

      <Box
        sx={{
          borderRadius: '30px',
          p: { xs: 2.2, sm: 2.8 },
          background:
            'linear-gradient(135deg, rgba(255,247,236,0.95) 0%, rgba(255,255,255,0.96) 100%)',
          border: '1px solid rgba(143, 105, 66, 0.12)',
          display: 'flex',
          flexDirection: { xs: 'column', md: 'row' },
          alignItems: { xs: 'flex-end', md: 'flex-end' },
          gap: 2,
        }}
      >
        <Box
          sx={{
            width: 52,
            height: 52,
            borderRadius: '18px',
            display: 'grid',
            placeItems: 'center',
            background: 'rgba(162, 177, 255, 0.3)',
            color: 'rgba(0, 31, 186, 0.77)',
            flexShrink: 0,
          }}
        >
          <Globe2 size={24} />
        </Box>
        <Box sx={{ flex: 1 }}>
          <Typography
            sx={{
              textAlign: 'right',
              fontFamily: 'Syne, sans-serif',
              fontSize: 18,
              fontWeight: 800,
              color: '#2B2118',
            }}
          >
            There is more in the world to discover
          </Typography>
          <Typography
            sx={{
              mt: 0.5,
              textAlign: 'right',
              fontSize: 14,
              color: 'rgba(66, 50, 28, 0.5)',
              maxWidth: 640,
            }}
          >
            This is not the end of your feed.
          </Typography>
        </Box>
        <Button
          component={Link}
          to="/search"
          variant="contained"
          endIcon={<ArrowRight size={16} />}
          sx={{
            minHeight: 44,
            px: 2.2,
            borderRadius: '999px',
            textTransform: 'none',
            fontWeight: 700,
            background: 'rgba(0, 31, 186, 0.77)',
            boxShadow: 'none',
            '&:hover': { background: '#C24E27', boxShadow: 'none' },
          }}
        >
          Browse more events
        </Button>
      </Box>
      <Drawer
        anchor="bottom"
        open={isQuickCreateOpen}
        onClose={() => setIsQuickCreateOpen(false)}
        PaperProps={{
          sx: {
            background: 'transparent',
            boxShadow: 'none',
            height: '100dvh',
            maxHeight: '100dvh',
          },
        }}
      >
        <Box sx={{ height: '100dvh' }}>
          <QuickCreateSpark
            categories={categories}
            isSubmitting={isQuickCreateSubmitting}
            onSubmit={handleQuickCreateSubmit}
            onClose={() => setIsQuickCreateOpen(false)}
          />
        </Box>
      </Drawer>
    </>
  );
}

