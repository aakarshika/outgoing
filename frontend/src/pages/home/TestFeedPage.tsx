import {
  Box,
  Container,
  Chip,
  FormControl,
  FormControlLabel,
  InputLabel,
  MenuItem,
  OutlinedInput,
  Select,
  Stack,
  Switch,
  TextField,
  Typography,
} from '@mui/material';
import { useMemo, useRef, useState } from 'react';

import { SmallEventCard } from '@/components/events/SmallEventCard';
import {
  useCategories,
  useBaseFeed,
} from '@/features/events/hooks';
import type { BaseFeedSort, EventLifecycleState } from '@/types/events';
import { LargeEventCard } from '@/components/events/LargeEventCard';
import { LandscapeEventCard } from '@/components/events/LandscapeEventCard';


function formatTime(dateString: string | undefined | null) {
  if (!dateString) return '';
  return new Date(dateString).toLocaleTimeString(undefined, {
    hour: 'numeric',
    minute: '2-digit',
  });
}

function toIsoOrUndefined(localDateTime: string) {
  if (!localDateTime) return undefined;
  const date = new Date(localDateTime);
  if (Number.isNaN(date.getTime())) return undefined;
  return date.toISOString();
}

export default function TestFeedPage() {
  const nearbySectionRef = useRef<HTMLDivElement | null>(null);

  const { data: categoriesResponse } = useCategories();
  const categoryOptions = categoriesResponse?.data ?? [];

  const [sort, setSort] = useState<BaseFeedSort>('popularity');
  const [online, setOnline] = useState(false);
  const [freeOnly, setFreeOnly] = useState(false);
  const [hasNeeds, setHasNeeds] = useState(false);
  const [lifecycleStates, setLifecycleStates] = useState<EventLifecycleState[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [startTimeGteLocal, setStartTimeGteLocal] = useState('');
  const [startTimeLteLocal, setStartTimeLteLocal] = useState('');
  const [lat, setLat] = useState<string>('');
  const [lng, setLng] = useState<string>('');

  const baseFeedParams = useMemo(() => {
    const parsedLat = lat.trim() ? Number(lat) : undefined;
    const parsedLng = lng.trim() ? Number(lng) : undefined;

    return {
      sort,
      online: online || undefined,
      lifecycle_states: lifecycleStates.length ? lifecycleStates : undefined,
      start_time_gte: toIsoOrUndefined(startTimeGteLocal),
      start_time_lte: toIsoOrUndefined(startTimeLteLocal),
      categories: categories.length ? categories : undefined,
      free_only: freeOnly || undefined,
      has_needs: hasNeeds || undefined,
      lat:
        typeof parsedLat === 'number' && Number.isFinite(parsedLat) ? parsedLat : undefined,
      lng:
        typeof parsedLng === 'number' && Number.isFinite(parsedLng) ? parsedLng : undefined,
      page_size: 100,
    };
  }, [
    categories,
    freeOnly,
    hasNeeds,
    lat,
    lng,
    online,
    sort,
    startTimeGteLocal,
    startTimeLteLocal,
    lifecycleStates,
  ]);

  const { data: nearbyResponse, isLoading: loadingNearby } = useBaseFeed(baseFeedParams);

  const nearbyEvents = (nearbyResponse?.data ?? []).map((item) => {
    const date = new Date(item.event.start_time);

    const ret = {
      ...item,
      ...item.event,
      month: date.toLocaleDateString(undefined, { month: 'short' }),
      day: String(date.getDate()).padStart(2, '0'),
      subtitle: `${item.event.location_name || 'Location TBD'} · ${formatTime(item.event.start_time)}`,
    }
    return ret;
  });

  const lifecycleFilterOptions: EventLifecycleState[] = [
    'draft',
    'published',
    'at_risk',
    'postponed',
    'event_ready',
    'live',
    'cancelled',
    'completed',
  ];

  return (
    <Box sx={{ background: '#F9F9F9' }}>
      <Container maxWidth={false} sx={{ maxWidth: 1040, px: { xs: 2, md: 4 }, pt: 4 }}>
        <Box
          sx={{
            p: 2,
            borderRadius: 2,
            border: '1px solid var(--color-border-tertiary)',
            background: '#fff',
          }}
        >
          <Stack spacing={1.5}>
            <Stack
              direction={{ xs: 'column', md: 'row' }}
              spacing={1.5}
              alignItems={{ xs: 'stretch', md: 'center' }}
            >
              <FormControl size="small" sx={{ minWidth: 220 }}>
                <InputLabel id="base-feed-sort-label">Sort</InputLabel>
                <Select
                  labelId="base-feed-sort-label"
                  value={sort}
                  label="Sort"
                  onChange={(e) => setSort(e.target.value as BaseFeedSort)}
                >
                  <MenuItem value="popularity">Popularity</MenuItem>
                  <MenuItem value="distance">Distance</MenuItem>
                  <MenuItem value="created">Created date</MenuItem>
                  <MenuItem value="start_time">Start time</MenuItem>
                </Select>
              </FormControl>

              <TextField
                size="small"
                label="Lat"
                value={lat}
                onChange={(e) => setLat(e.target.value)}
                placeholder="e.g. 37.7749"
                sx={{ width: { xs: '100%', md: 160 } }}
              />
              <TextField
                size="small"
                label="Lng"
                value={lng}
                onChange={(e) => setLng(e.target.value)}
                placeholder="e.g. -122.4194"
                sx={{ width: { xs: '100%', md: 170 } }}
              />

              <FormControlLabel
                control={<Switch checked={online} onChange={(e) => setOnline(e.target.checked)} />}
                label="Online"
              />
              <FormControlLabel
                control={
                  <Switch checked={freeOnly} onChange={(e) => setFreeOnly(e.target.checked)} />
                }
                label="Free only"
              />
              <FormControlLabel
                control={
                  <Switch checked={hasNeeds} onChange={(e) => setHasNeeds(e.target.checked)} />
                }
                label="Has needs"
              />
            </Stack>

            <Stack direction={{ xs: 'column', md: 'row' }} spacing={1.5}>
              <FormControl size="small" sx={{ minWidth: 280, flex: 1 }}>
                <InputLabel id="base-feed-lifecycle-label">Lifecycle state</InputLabel>
                <Select
                  labelId="base-feed-lifecycle-label"
                  multiple
                  value={lifecycleStates}
                  onChange={(e) =>
                    setLifecycleStates(e.target.value as EventLifecycleState[])
                  }
                  input={<OutlinedInput label="Lifecycle state" />}
                  renderValue={(selected) => (
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                      {selected.map((value) => (
                        <Chip key={value} label={value} size="small" />
                      ))}
                    </Box>
                  )}
                >
                  {lifecycleFilterOptions.map((value) => (
                    <MenuItem key={value} value={value}>
                      {value}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <FormControl size="small" sx={{ minWidth: 320, flex: 1 }}>
                <InputLabel id="base-feed-categories-label">Categories</InputLabel>
                <Select
                  labelId="base-feed-categories-label"
                  multiple
                  value={categories}
                  onChange={(e) => setCategories(e.target.value as string[])}
                  input={<OutlinedInput label="Categories" />}
                  renderValue={(selected) => (
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                      {selected.map((slug) => {
                        const label = categoryOptions.find((c) => c.slug === slug)?.name ?? slug;
                        return <Chip key={slug} label={label} size="small" />;
                      })}
                    </Box>
                  )}
                >
                  {categoryOptions.map((cat) => (
                    <MenuItem key={cat.id} value={cat.slug}>
                      {cat.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Stack>

            <Stack direction={{ xs: 'column', md: 'row' }} spacing={1.5}>
              <TextField
                size="small"
                label="Start time (from)"
                type="datetime-local"
                value={startTimeGteLocal}
                onChange={(e) => setStartTimeGteLocal(e.target.value)}
                sx={{ flex: 1, minWidth: 240 }}
                InputLabelProps={{ shrink: true }}
              />
              <TextField
                size="small"
                label="Start time (to)"
                type="datetime-local"
                value={startTimeLteLocal}
                onChange={(e) => setStartTimeLteLocal(e.target.value)}
                sx={{ flex: 1, minWidth: 240 }}
                InputLabelProps={{ shrink: true }}
              />

              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flex: 1 }}>
                <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                  {loadingNearby ? 'Loading…' : `${nearbyResponse?.meta?.total_count ?? 0} events`}
                </Typography>
              </Box>
            </Stack>
          </Stack>
        </Box>
      </Container>

      <Box
        sx={{
          height: '0.5px',
          background: 'var(--color-border-tertiary)',
          maxWidth: 960,
          mx: 'auto',
          mt: 3,
        }}
      />

      <Container
        ref={nearbySectionRef}
        maxWidth={false}
        sx={{ maxWidth: 1040, px: { xs: 2, md: 4 }, py: 6 }}
      >
        {nearbyEvents.map((event) => (
          <Box
            key={event.id}
            sx={{
              flex: '0 0 clamp(260px, 32vw, 320px)',
              minWidth: 0,
              scrollSnapAlign: 'start',
            }}
          >
            {
            event.id % 3 === 1 ?
             <SmallEventCard event={event} />  : 
            event.id % 3 === 2 ?
             <LandscapeEventCard event={event} />  : 
             <LargeEventCard event={event} />
             }
          </Box>
        ))}
      </Container>

    </Box>
  );
}
