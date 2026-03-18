import { Box, Button, Container, Drawer, Stack, Typography } from '@mui/material';
import { ChevronDown, SlidersHorizontal, X } from 'lucide-react';
import { useState } from 'react';

import { CATEGORY_ICON_MAP } from '@/features/events/constants';
import type { EventCategory } from '@/types/events';

import { FORMAT_OPTIONS, ROLE_OPTIONS, TABS, WHEN_OPTIONS } from '../searchConfig';
import type {
  FormatFilterId,
  RoleFilterId,
  SearchTabId,
  WhenFilterId,
} from '../searchTypes';

type ContextualPill = {
  label: string;
  active?: boolean;
  onClick?: () => void;
  icon?: string;
  accent?: string;
};

const SEARCH_THEME = {
  bgBase: '#F9F4EA',
  bgPanel: '#FFFCF7',
  bgMuted: '#F7EEDF',
  border: 'rgba(120,94,60,0.2)',
  borderSoft: 'rgba(120,94,60,0.14)',
  text: '#3F3123',
  textMuted: '#7A6A55',
  accent: '#D85A30',
};

const railDividerSx = {
  width: '1px',
  backgroundColor: SEARCH_THEME.borderSoft,
  alignSelf: 'stretch',
  my: 1,
  mx: 0.5,
  flexShrink: 0,
} as const;

function RailPill({
  label,
  active = false,
  onClick,
  icon,
  accent = SEARCH_THEME.accent,
  rounded = true,
  filled = false,
  passive = false,
}: {
  label: string;
  active?: boolean;
  onClick?: () => void;
  icon?: string;
  accent?: string;
  rounded?: boolean;
  filled?: boolean;
  passive?: boolean;
}) {
  return (
    <Box
      component="button"
      type="button"
      onClick={onClick}
      sx={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 0.7,
        px: rounded ? 1.5 : 1.35,
        py: rounded ? 0.7 : 0.65,
        borderRadius: rounded ? '999px' : 0,
        border: `1.5px solid ${active || filled ? accent : SEARCH_THEME.borderSoft}`,
        backgroundColor:
          active || filled
            ? accent
            : passive
              ? SEARCH_THEME.bgMuted
              : SEARCH_THEME.bgPanel,
        color: active || filled ? '#ffffff' : SEARCH_THEME.textMuted,
        fontSize: 12,
        fontWeight: 500,
        lineHeight: 1,
        whiteSpace: 'nowrap',
        cursor: 'pointer',
        transition: 'all 0.15s ease',
        '&:hover': {
          borderColor: active || filled ? accent : SEARCH_THEME.border,
          color: active || filled ? '#ffffff' : SEARCH_THEME.text,
        },
      }}
    >
      {icon ? <span style={{ fontSize: 12, lineHeight: 1 }}>{icon}</span> : null}
      <span>{label}</span>
    </Box>
  );
}

function MainTab({
  label,
  icon,
  active,
  badge,
  onClick,
}: {
  label: string;
  icon: string;
  active: boolean;
  badge?: number;
  onClick: () => void;
}) {
  return (
    <Box
      component="button"
      type="button"
      onClick={onClick}
      sx={{
        height: 48,
        px: 2.25,
        border: 0,
        borderBottom: active
          ? `2.5px solid ${SEARCH_THEME.accent}`
          : '2.5px solid transparent',
        backgroundColor: 'transparent',
        color: active ? SEARCH_THEME.accent : SEARCH_THEME.textMuted,
        display: 'inline-flex',
        alignItems: 'center',
        gap: 0.75,
        fontSize: 13,
        fontWeight: 600,
        whiteSpace: 'nowrap',
        cursor: 'pointer',
        flexShrink: 0,
        transition: 'color 0.15s ease, border-color 0.15s ease',
        '&:hover': { color: SEARCH_THEME.text },
      }}
    >
      <span style={{ fontSize: 14, lineHeight: 1 }}>{icon}</span>
      <span>{label}</span>
      {typeof badge === 'number' && badge > 0 ? (
        <Box
          sx={{
            px: 0.7,
            py: 0.15,
            borderRadius: '999px',
            backgroundColor: '#D85A30',
            color: '#ffffff',
            fontSize: 9,
            fontWeight: 700,
            lineHeight: 1.5,
          }}
        >
          {badge}
        </Box>
      ) : null}
    </Box>
  );
}

export function SearchToolbar({
  tab,
  selectedDate,
  effectiveWhen,
  effectiveFormats,
  selectedCategories,
  selectedRoles,
  categories,
  onTabChange,
  onToggleWhen,
  onDateChange,
  onToggleCategory,
  onToggleFormat,
  onToggleRole,
  onClearRoles,
  onClearManualFilters,
  stickyTop = 0,
}: {
  tab: SearchTabId;
  selectedDate: string;
  effectiveWhen: WhenFilterId[];
  effectiveFormats: FormatFilterId[];
  selectedCategories: string[];
  selectedRoles: RoleFilterId[];
  categories: EventCategory[];
  onTabChange: (tab: SearchTabId) => void;
  onToggleWhen: (filter: WhenFilterId) => void;
  onDateChange: (value: string) => void;
  onToggleCategory: (categorySlug: string) => void;
  onToggleFormat: (filter: FormatFilterId) => void;
  onToggleRole: (role: RoleFilterId) => void;
  onClearRoles: () => void;
  onClearManualFilters: () => void;
  stickyTop?: number;
}) {
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);

  const contextualPills: ContextualPill[] = (
    tab === 'all'
      ? [
          { label: 'No defaults', active: true },
          { label: 'Newest first', icon: '🗂️' },
          { label: 'Any date' },
          { label: 'Any price' },
          { label: 'In person + online' },
        ]
      : tab === 'tonight-weekend'
        ? [
            {
              label: 'This evening',
              active: effectiveWhen.includes('tonight'),
              onClick: () => onToggleWhen('tonight'),
            },
            {
              label: 'This week',
              active: effectiveWhen.includes('this-week'),
              onClick: () => onToggleWhen('this-week'),
            },
            {
              label: 'This month',
              active: effectiveWhen.includes('this-month'),
              onClick: () => onToggleWhen('this-month'),
            },
            {
              label: 'This weekend',
              active: effectiveWhen.includes('this-weekend'),
              onClick: () => onToggleWhen('this-weekend'),
            },
            { label: 'Outdoor only' },
            {
              label: 'Tomorrow',
              active: effectiveWhen.includes('tomorrow'),
              onClick: () => onToggleWhen('tomorrow'),
            },
          ]
        : tab === 'trending'
          ? []
          : tab === 'free-cheap'
            ? [
                {
                  label: 'Completely free',
                  active: effectiveFormats.includes('free'),
                  icon: '🎉',
                  onClick: () => onToggleFormat('free'),
                },
                {
                  label: 'Under Rs 200',
                  active: effectiveFormats.includes('under-200'),
                  onClick: () => onToggleFormat('under-200'),
                },
                {
                  label: 'Under Rs 500',
                  active: effectiveFormats.includes('under-500'),
                  onClick: () => onToggleFormat('under-500'),
                },
                {
                  label: 'Discount available',
                  active: effectiveFormats.includes('discount-available'),
                  icon: '🏷️',
                  onClick: () => onToggleFormat('discount-available'),
                },
                { label: 'Chip-in welcome' },
              ]
            : tab === 'chip-in'
              ? [
                  {
                    label: 'All needs',
                    active: selectedRoles.length === 0,
                    onClick: onClearRoles,
                  },
                  {
                    label: 'DJ / Music',
                    active: selectedRoles.includes('dj_music'),
                    icon: '🎵',
                    onClick: () => onToggleRole('dj_music'),
                  },
                  {
                    label: 'Photography',
                    active: selectedRoles.includes('photography'),
                    icon: '📷',
                    onClick: () => onToggleRole('photography'),
                  },
                  {
                    label: 'Food / Catering',
                    active: selectedRoles.includes('food_catering'),
                    icon: '🍳',
                    onClick: () => onToggleRole('food_catering'),
                  },
                  {
                    label: 'Equipment',
                    active: selectedRoles.includes('equipment'),
                    icon: '🎛️',
                    onClick: () => onToggleRole('equipment'),
                  },
                  { label: 'Get paid', icon: '💰' },
                  { label: 'Free entry', icon: '🎟️' },
                ]
              : tab === 'online'
                ? [
                    { label: 'Live now', active: true },
                    { label: 'Talk / Webinar', icon: '🎙️' },
                    { label: 'Gaming', icon: '🎮' },
                    { label: 'Workshop', icon: '🎓' },
                    { label: 'Watch party' },
                    { label: 'Recording available' },
                  ]
                : [
                    { label: 'All buddies', active: true },
                    { label: 'Going tonight' },
                    { label: 'Interested' },
                    { label: 'Hosting' },
                    { label: 'New connections' },
                  ]
  ).concat(
    tab === 'all'
      ? [
          {
            label: 'In person',
            active: effectiveFormats.includes('in-person'),
            onClick: () => onToggleFormat('in-person'),
          },
          {
            label: 'Free',
            active: effectiveFormats.includes('free'),
            onClick: () => onToggleFormat('free'),
          },
          // { label: 'With friends', active: true, onClick: () => { onToggleFormat('With friends'); } },
          {
            label: 'Tonight only',
            active: effectiveWhen.includes('tonight'),
            onClick: () => onToggleWhen('tonight'),
          },
        ]
      : [],
  );

  return (
    <>
      <Box
        sx={{
          maxWidth: 1240,
          justifyContent: 'center',
          borderBottom: `1px solid ${SEARCH_THEME.borderSoft}`,
        }}
      >
        <Container maxWidth={false} sx={{ px: { xs: 0, sm: 0 } }}>
          <Box
            sx={{
              display: 'flex',
              alignItems: 'stretch',
              overflowX: 'auto',
              px: { xs: 1.5, sm: 2.5 },
              backgroundColor: SEARCH_THEME.bgPanel,
              scrollbarWidth: 'none',
              '&::-webkit-scrollbar': { display: 'none' },
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'stretch', flexShrink: 0 }}>
              {TABS.map((item) => (
                <MainTab
                  key={item.id}
                  label={item.label}
                  icon={item.icon}
                  badge={item.badge}
                  active={tab === item.id}
                  onClick={() => onTabChange(item.id)}
                />
              ))}
            </Box>

            {tab !== 'my-network' ? (
              <>
                <Box sx={railDividerSx} />

                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 0.6,
                    px: 1.25,
                    flexShrink: 0,
                  }}
                >
                  <Typography
                    sx={{
                      fontSize: 10,
                      fontWeight: 700,
                      textTransform: 'uppercase',
                      letterSpacing: '0.08em',
                      color: SEARCH_THEME.textMuted,
                      opacity: 0.55,
                      px: 0.5,
                    }}
                  ></Typography>
                  {categories.map((category) => (
                    <RailPill
                      key={category.slug}
                      label={category.name}
                      icon={CATEGORY_ICON_MAP[category.icon] || '•'}
                      active={selectedCategories.includes(category.slug)}
                      accent="#D85A30"
                      filled={selectedCategories.includes(category.slug)}
                      passive={true}
                      onClick={() => onToggleCategory(category.slug)}
                    />
                  ))}
                </Box>
              </>
            ) : null}

            <Box sx={railDividerSx} />
          </Box>

          <Box
            sx={{
              // borderTop: `1px solid ${SEARCH_THEME.borderSoft}`,
              // backgroundColor: SEARCH_THEME.bgMuted,
              px: { xs: 2, sm: 3 },
              py: 1.25,
              display: 'flex',
              alignItems: 'center',
              gap: 0.8,
              overflowX: 'auto',
              scrollbarWidth: 'none',
              '&::-webkit-scrollbar': { display: 'none' },
            }}
          >
            {/* <Typography
              sx={{
                fontSize: 10,
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                color: SEARCH_THEME.textMuted,
                opacity: 0.6,
                whiteSpace: 'nowrap',
                mr: 0.25,
              }}
            >
              {TABS.find((item) => item.id === tab)?.label}
            </Typography> */}

            {contextualPills.map((pill) => (
              <RailPill
                key={pill.label}
                label={pill.label}
                icon={pill.icon}
                active={pill.active}
                accent={pill.accent || '#D85A30'}
                onClick={pill.onClick}
              />
            ))}

            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 0.75,
                px: 1.25,
                flexShrink: 0,
              }}
            >
              <Box
                component="label"
                sx={{
                  position: 'relative',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 0.7,
                  px: 1.4,
                  py: 0.7,
                  borderRadius: '999px',
                  border: '1.5px solid rgba(17,24,39,0.14)',
                  color: '#6b7280',
                  fontSize: 12,
                  fontWeight: 500,
                  whiteSpace: 'nowrap',
                  cursor: 'pointer',
                }}
              >
                <span>📅</span>
                {/* <span>{dateLabel}</span> */}
                <ChevronDown size={12} />
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(event) => onDateChange(event.target.value)}
                  style={{
                    position: 'absolute',
                    inset: 0,
                    opacity: 0,
                    cursor: 'pointer',
                  }}
                />
              </Box>

              <Box
                component="button"
                type="button"
                onClick={() => setIsFiltersOpen(true)}
                sx={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 0.7,
                  px: 1.4,
                  py: 0.7,
                  borderRadius: '999px',
                  border: '1.5px solid rgba(17,24,39,0.14)',
                  backgroundColor: '#ffffff',
                  color: '#111827',
                  fontSize: 12,
                  fontWeight: 600,
                  whiteSpace: 'nowrap',
                  cursor: 'pointer',
                }}
              >
                <SlidersHorizontal size={14} />
                <span>Filters</span>
              </Box>
            </Box>
          </Box>
        </Container>
      </Box>

      <Drawer
        anchor="right"
        open={isFiltersOpen}
        onClose={() => setIsFiltersOpen(false)}
        PaperProps={{
          sx: {
            width: { xs: '100%', sm: 380 },
            p: 2.25,
            backgroundColor: '#F7F5F1',
          },
        }}
      >
        <Stack spacing={2.25}>
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <Box>
              <Typography
                sx={{
                  fontFamily: 'Syne, sans-serif',
                  fontSize: 20,
                  fontWeight: 800,
                  color: '#111827',
                }}
              >
                Filters
              </Typography>
              <Typography sx={{ fontSize: 12, color: '#6b7280', mt: 0.4 }}>
                Use All Events for a true no-filter browse mode.
              </Typography>
            </Box>
            <Box
              component="button"
              type="button"
              onClick={() => setIsFiltersOpen(false)}
              sx={{
                width: 36,
                height: 36,
                borderRadius: '50%',
                border: '1px solid rgba(17,24,39,0.12)',
                backgroundColor: '#ffffff',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
              }}
            >
              <X size={16} />
            </Box>
          </Box>

          <Box
            sx={{
              border: '1px solid rgba(17,24,39,0.08)',
              borderRadius: 0,
              backgroundColor: '#ffffff',
              p: 1.6,
            }}
          >
            <Typography
              sx={{
                fontSize: 10,
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                color: '#6b7280',
                mb: 1,
              }}
            >
              Time
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.8 }}>
              {WHEN_OPTIONS.map((item) => (
                <RailPill
                  key={item.id}
                  label={item.label}
                  active={effectiveWhen.includes(item.id)}
                  onClick={() => onToggleWhen(item.id)}
                />
              ))}
            </Box>
          </Box>

          <Box
            sx={{
              border: '1px solid rgba(17,24,39,0.08)',
              borderRadius: 0,
              backgroundColor: '#ffffff',
              p: 1.6,
            }}
          >
            <Typography
              sx={{
                fontSize: 10,
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                color: '#6b7280',
                mb: 1,
              }}
            >
              Format
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.8 }}>
              {FORMAT_OPTIONS.map((item) => (
                <RailPill
                  key={item.id}
                  label={item.label}
                  active={effectiveFormats.includes(item.id)}
                  accent={item.id === 'online' ? '#1D9E75' : '#111111'}
                  onClick={() => onToggleFormat(item.id)}
                />
              ))}
            </Box>
          </Box>

          {tab !== 'my-network' ? (
            <Box
              sx={{
                border: '1px solid rgba(17,24,39,0.08)',
                borderRadius: 0,
                backgroundColor: '#ffffff',
                p: 1.6,
              }}
            >
              <Typography
                sx={{
                  fontSize: 10,
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                  color: '#6b7280',
                  mb: 1,
                }}
              >
                Categories
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.8 }}>
                {categories.map((category) => (
                  <RailPill
                    key={category.slug}
                    label={category.name}
                    icon={CATEGORY_ICON_MAP[category.icon] || '•'}
                    active={selectedCategories.includes(category.slug)}
                    accent="#D85A30"
                    filled={selectedCategories.includes(category.slug)}
                    passive={true}
                    onClick={() => onToggleCategory(category.slug)}
                  />
                ))}
              </Box>
            </Box>
          ) : null}

          {(tab === 'chip-in' || tab === 'free-cheap') && (
            <Box
              sx={{
                border: '1px solid rgba(17,24,39,0.08)',
                borderRadius: 0,
                backgroundColor: '#ffffff',
                p: 1.6,
              }}
            >
              <Typography
                sx={{
                  fontSize: 10,
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                  color: '#6b7280',
                  mb: 1,
                }}
              >
                Contributor roles
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.8 }}>
                <RailPill
                  label="All roles"
                  active={selectedRoles.length === 0}
                  onClick={onClearRoles}
                />
                {ROLE_OPTIONS.map((item) => (
                  <RailPill
                    key={item.id}
                    label={item.label}
                    active={selectedRoles.includes(item.id)}
                    accent="#EF9F27"
                    onClick={() => onToggleRole(item.id)}
                  />
                ))}
              </Box>
            </Box>
          )}

          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button
              fullWidth
              variant="outlined"
              onClick={onClearManualFilters}
              sx={{
                borderColor: 'rgba(17,24,39,0.14)',
                color: '#111827',
                borderRadius: '999px',
                textTransform: 'none',
                fontWeight: 600,
              }}
            >
              Clear filters
            </Button>
            <Button
              fullWidth
              variant="contained"
              onClick={() => setIsFiltersOpen(false)}
              sx={{
                backgroundColor: '#111827',
                color: '#ffffff',
                borderRadius: '999px',
                textTransform: 'none',
                fontWeight: 700,
                boxShadow: 'none',
                '&:hover': { backgroundColor: '#0f172a', boxShadow: 'none' },
              }}
            >
              Done
            </Button>
          </Box>
        </Stack>
      </Drawer>
    </>
  );
}
