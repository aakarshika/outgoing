


import {
    Avatar,
    Box,
    Button,
    Checkbox,
    Chip,
    CircularProgress,
    Container,
    LinearProgress,
    MenuItem,
    Stack,
    Tab,
    Tabs,
    TextField,
    Typography,
} from '@mui/material';
import { ArrowLeft, Check, MessageCircle, Plus, Search } from 'lucide-react';
import { type ReactNode, useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';

import { getCategoryLabel, VENDOR_CATEGORIES } from '@/constants/categories';

import type { EventNeed } from '@/types/needs';
import {
    canUseBrowserGeolocation,
    getCurrentCoordinates,
    reverseGeocodeCoordinates,
} from '@/utils/geolocation';

import { type EventFeature, FEATURE_ITEMS } from './manage/ManageDetailsSection';

export function formatMoney(value?: string | number | null) {
    const numeric = Number(value || 0);
    if (Number.isNaN(numeric)) return '₹0';
    return `₹${numeric.toLocaleString()}`;
}



export function inputSx() {
    return {
        '& .MuiOutlinedInput-root': {
            borderRadius: '16px',
            background: '#F9F9F9',
        },
    };
}


function NeedWorkspaceCard({
    title,
    action,
    children,
}: {
    title: string;
    action?: ReactNode;
    children: ReactNode;
}) {
    return (
        <Box
            sx={{
                mt: 1.5,
                background: '#f9f9f9',
                border: '0.5px solid var(--color-border-tertiary)',
                borderRadius: '24px',
                overflow: 'hidden',
            }}
        >
            <Stack
                direction="row"
                alignItems="center"
                justifyContent="space-between"
                sx={{
                    px: 2.5,
                    py: 1.75,
                    borderBottom: '0.5px solid var(--color-border-tertiary)',
                }}
            >
                {typeof action === 'string' ? (
                    <Typography sx={{ fontSize: 12, color: '#D85A30', fontWeight: 600 }}>
                        {action}
                    </Typography>
                ) : (
                    action || null
                )}
            </Stack>
            <Box sx={{ p: 2.5 }}>{children}</Box>
        </Box>
    );
}
export function toDatetimeLocalValue(dateString?: string | null) {
    if (!dateString) return '';
    const date = new Date(dateString);
    return new Date(date.getTime() - date.getTimezoneOffset() * 60000)
        .toISOString()
        .slice(0, 16);
}

type VendorSuggestion = {
    id: string;
    name: string;
    tag: string;
    avatar: string;
    color: string;
    action: 'Assign' | 'Invite';
    accent: boolean;
    source: 'Your people' | 'Community';
    blurb: string;
    recommendedNeedId: string;
};

type NeedActionDialogState = {
    type: 'assign' | 'invite' | 'override';
    needId: number;
    applicationId?: number;
    nextNeedStatus?: 'override_filled' | 'open';
    title: string;
    description: string;
    confirmLabel: string;
    placeholder: string;
    targetLabel: string;
};




export function AddNeedOverlay({
    onClose,
    onSave,
    eventTitle,
    eventDateLabel,
    initialBudgetHint,
    initialNeed,
    canApplyToSeries,
    isSaving,
}: {
    onClose: () => void;
    onSave: (payload: {
        title: string;
        description: string;
        category: string;
        budgetMin: string;
        budgetMax: string;
        updateSeries: boolean;
    }) => Promise<void>;
    eventTitle?: string;
    eventDateLabel?: string;
    initialBudgetHint?: string | null;
    initialNeed?: EventNeed | null;
    canApplyToSeries?: boolean;
    isSaving?: boolean;
}) {
    const overlayTitle = initialNeed ? 'Edit need' : 'Add a need';
    const eventLabel = eventTitle || 'Rooftop Vinyl Night';
    const [category, setCategory] = useState(initialNeed?.category || '');
    const [title, setTitle] = useState(initialNeed?.title || '');
    const [description, setDescription] = useState(initialNeed?.description || '');
    const [budgetMin, setBudgetMin] = useState(initialNeed?.budget_min || '');
    const [budgetMax, setBudgetMax] = useState(initialNeed?.budget_max || '');
    const [updateSeries, setUpdateSeries] = useState(false);
    const [selectedCompStyles, setSelectedCompStyles] = useState<string[]>(
        initialNeed ? ['cash'] : ['free-entry', 'cash'],
    );

    const activeCategory = featuredNeedCategories.find((item) => item.id === category);
    const activeCategoryLabel = category
        ? getCategoryLabel(category)
        : 'Pick a role type';
    const displayDateLabel = eventDateLabel || 'Date TBD';
    const trimmedTitle = title.trim();
    const trimmedDescription = description.trim();
    const previewTitle =
        trimmedTitle ||
        (category ? `${getCategoryLabel(category)} needed` : 'Your role brief');
    const previewDescription =
        trimmedDescription ||
        'Describe the timing, expected output, and what “done well” looks like so the right people can self-select quickly.';
    const canSubmit = Boolean(trimmedTitle && category);
    const fieldSx = {
        '& .MuiOutlinedInput-root': {
            borderRadius: '18px',
            background: 'rgba(255,255,255,0.9)',
            alignItems: 'flex-start',
            '& fieldset': {
                borderColor: 'rgba(143, 105, 66, 0.22)',
            },
            '&:hover fieldset': {
                borderColor: 'rgba(216, 90, 48, 0.42)',
            },
            '&.Mui-focused fieldset': {
                borderColor: '#D85A30',
            },
        },
        '& .MuiInputBase-input': {
            fontSize: 14,
            lineHeight: 1.5,
        },
    } as const;

    const handleCategoryChange = (nextCategory: string) => {
        setCategory(nextCategory);
        if (!title.trim()) {
            setTitle(getCategoryLabel(nextCategory));
        }
    };

    const handleToggleCompStyle = (styleId: string) => {
        setSelectedCompStyles((current) =>
            current.includes(styleId)
                ? current.filter((item) => item !== styleId)
                : [...current, styleId],
        );
    };

    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault();
        if (!canSubmit) return;
        await onSave({
            title: trimmedTitle,
            description: trimmedDescription,
            category,
            budgetMin: budgetMin.trim(),
            budgetMax: budgetMax.trim(),
            updateSeries,
        });
    };

    return (
        <Box
            sx={{
                position: 'fixed',
                inset: 0,
                zIndex: 1200,
                background: 'rgb(255, 251, 249)',
                overflowY: 'auto',
                p: { xs: 2, md: 3 },
            }}
        >
            <Box component="form" onSubmit={handleSubmit} sx={{ maxWidth: 1120, mx: 'auto' }}>
                <Stack direction="row" alignItems="center" spacing={1.5} sx={{ mb: 3 }}>
                    <Box
                        onClick={onClose}
                        sx={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 0.75,
                            fontSize: 14,
                            color: 'var(--color-text-secondary)',
                            cursor: 'pointer',
                        }}
                    >
                        <ArrowLeft size={16} />
                        Needs board
                    </Box>
                    <Chip
                        label={initialNeed ? 'Editing live brief' : 'Fast brief'}
                        sx={{
                            height: 24,
                            background: '#FAECE7',
                            color: '#712B13',
                            fontWeight: 700,
                            fontSize: 11,
                        }}
                    />
                </Stack>

                <Box
                    sx={{
                    }}
                >
                    <Stack
                        direction={{ xs: 'column', md: 'row' }}
                        spacing={0}
                        alignItems={{ xs: 'flex-start', md: 'center' }}
                        justifyContent="space-between"
                    >
                        <Stack spacing={1.1} sx={{ maxWidth: 720 }}>
                            <Typography
                                sx={{
                                    fontFamily: 'Syne, sans-serif',
                                    fontSize: { xs: 28, md: 34 },
                                    lineHeight: 1.05,
                                    letterSpacing: '-0.04em',
                                    fontWeight: 800,
                                    color: '#2B2118',
                                }}
                            >
                                {overlayTitle}
                            </Typography>
                        </Stack>
                        <Stack
                            spacing={0.85}
                            sx={{
                                px: 1.6,
                                py: 1.4,
                                minWidth: { xs: '100%', md: 260 },
                                borderRadius: '20px',
                                background: 'rgba(255,255,255,0.72)',
                                border: '0.5px solid rgba(143, 105, 66, 0.18)',
                            }}
                        >
                            <Typography sx={{ fontSize: 11, color: 'rgba(66, 50, 28, 0.62)' }}>
                                {eventLabel}
                            </Typography>
                            <Typography
                                sx={{
                                    fontFamily: 'Syne, sans-serif',
                                    fontSize: 18,
                                    fontWeight: 700,
                                    color: '#2B2118',
                                }}
                            >
                                {previewTitle}
                            </Typography>
                            <Typography sx={{ fontSize: 12, color: 'rgba(66, 50, 28, 0.68)' }}>
                                {displayDateLabel}
                            </Typography>
                        </Stack>
                    </Stack>
                </Box>

                <Box
                    sx={{
                        display: 'grid',
                        gridTemplateColumns: {
                            xs: '1fr',
                            lg: 'minmax(0, 1.55fr) minmax(300px, 0.95fr)',
                        },
                        gap: 2,
                        alignItems: 'start',
                        mt: 2,
                    }}
                >
                    <Box>
                        <NeedWorkspaceCard title="Start with the role" >

                            <TextField
                                select
                                fullWidth
                                label="Need Type"
                                value={category}
                                onChange={(event) => handleCategoryChange(event.target.value)}
                                sx={{ ...fieldSx, mb: 1.5 }}
                            >
                                {allVendorCategoryOptions.map((option) => (
                                    <MenuItem key={option.id} value={option.id}>
                                        {option.group} · {option.label}
                                    </MenuItem>
                                ))}
                            </TextField>

                            <Box
                                sx={{
                                    display: 'grid',
                                    gridTemplateColumns: { xs: '1fr', md: '1fr 1.2fr' },
                                    gap: 1.5,
                                }}
                            >
                                <TextField
                                    label="Short label"
                                    placeholder="Photography help"
                                    value={title}
                                    onChange={(event) => setTitle(event.target.value)}
                                    helperText="This becomes the visible need title on the board."
                                    fullWidth
                                    required
                                    sx={fieldSx}
                                />
                                <TextField
                                    label="Describe what you need"
                                    placeholder="Low-light crowd shots, a few portraits, and edited delivery within 48 hours."
                                    value={description}
                                    onChange={(event) => setDescription(event.target.value)}
                                    fullWidth
                                    multiline
                                    minRows={4}
                                    sx={fieldSx}
                                />
                            </Box>

                            {canApplyToSeries && !initialNeed ? (
                                <Box
                                    sx={{
                                        mt: 1.6,
                                        px: 1.5,
                                        py: 1.25,
                                        borderRadius: '18px',
                                        background: '#F1EFE8',
                                        border: '0.5px solid rgba(143, 105, 66, 0.14)',
                                    }}
                                >
                                    <Stack direction="row" spacing={1.2} alignItems="flex-start">
                                        <Checkbox
                                            checked={updateSeries}
                                            onChange={(event) => setUpdateSeries(event.target.checked)}
                                            sx={{
                                                mt: -0.7,
                                                color: '#8F6942',
                                                '&.Mui-checked': { color: '#D85A30' },
                                            }}
                                        />
                                        <Box>
                                            <Typography
                                                sx={{
                                                    fontSize: 13,
                                                    fontWeight: 700,
                                                    color: 'var(--color-text-primary)',
                                                }}
                                            >
                                                Apply this need to the full series
                                            </Typography>
                                            <Typography
                                                sx={{
                                                    fontSize: 12,
                                                    color: 'var(--color-text-secondary)',
                                                    lineHeight: 1.5,
                                                }}
                                            >
                                                Use this when the role will likely repeat across draft and
                                                published occurrences.
                                            </Typography>
                                        </Box>
                                    </Stack>
                                </Box>
                            ) : null}
                        </NeedWorkspaceCard>

                        <NeedWorkspaceCard
                            title="Frame the compensation"
                        >
                            <Box
                                sx={{
                                    mt: 1.6,
                                    px: 1.5,
                                    py: 1.35,
                                    borderRadius: '18px',
                                    background: '#F8F4EF',
                                    border: '0.5px solid rgba(143, 105, 66, 0.16)',
                                }}
                            >
                                <Box
                                    sx={{
                                        display: 'grid',
                                        gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' },
                                        gap: 1.25,
                                    }}
                                >
                                    <TextField
                                        label="Budget min"
                                        placeholder="0"
                                        value={budgetMin}
                                        onChange={(event) => setBudgetMin(event.target.value)}
                                        type="number"
                                        fullWidth
                                        sx={fieldSx}
                                    />
                                    <TextField
                                        label="Budget max"
                                        placeholder="350"
                                        value={budgetMax}
                                        onChange={(event) => setBudgetMax(event.target.value)}
                                        type="number"
                                        fullWidth
                                        sx={fieldSx}
                                    />
                                </Box>
                            </Box>
                        </NeedWorkspaceCard>

                        <NeedWorkspaceCard
                            title="Next backend pass"
                            action="Visible, not persisted yet"
                        >
                            <Typography
                                sx={{
                                    fontSize: 13,
                                    color: 'var(--color-text-secondary)',
                                    lineHeight: 1.55,
                                }}
                            >
                                These planning notes stay visible here so the team can design the fuller
                                vendor agreement without overwhelming the save flow today.
                            </Typography>
                            <Box
                                sx={{
                                    mt: 1.5,
                                    display: 'grid',
                                    gridTemplateColumns: { xs: '1fr', md: '1fr 1fr 1fr' },
                                    gap: 1.1,
                                }}
                            >
                                {[
                                    {
                                        title: 'Slots and fill deadline',
                                        text: 'Use this when one role needs multiple people or when the host wants a clear latest-by date.',
                                        accent: '#FAECE7',
                                        color: '#712B13',
                                    },
                                    {
                                        title: 'Threshold and decision timing',
                                        text: 'This matters when vendors need to know how ticket sales affect whether the event proceeds.',
                                        accent: '#EEEDFE',
                                        color: '#26215C',
                                    },
                                    {
                                        title: 'Cancellation terms',
                                        text: 'Good agreements explain what happens if the event is called off and who carries the risk.',
                                        accent: '#FAEEDA',
                                        color: '#704707',
                                    },
                                ].map((item) => (
                                    <Box
                                        key={item.title}
                                        sx={{
                                            p: 1.4,
                                            borderRadius: '18px',
                                            background: item.accent,
                                            border: '0.5px solid rgba(143, 105, 66, 0.14)',
                                        }}
                                    >
                                        <Typography
                                            sx={{
                                                fontSize: 13,
                                                fontWeight: 700,
                                                color: item.color,
                                                mb: 0.55,
                                            }}
                                        >
                                            {item.title}
                                        </Typography>
                                        <Typography
                                            sx={{ fontSize: 12, lineHeight: 1.55, color: item.color }}
                                        >
                                            {item.text}
                                        </Typography>
                                    </Box>
                                ))}
                            </Box>
                        </NeedWorkspaceCard>
                    </Box>

                </Box>
            </Box>
        </Box>
    );
}



const featuredNeedCategories = [
    {
        id: 'dj',
        label: 'DJ / Music',
        emoji: '🎧',
        tint: '#FAECE7',
        border: '#D85A30',
        text: '#712B13',
    },
    {
        id: 'photography',
        label: 'Photography',
        emoji: '📷',
        tint: '#E6F1FB',
        border: '#4A87C6',
        text: '#204D74',
    },
    {
        id: 'catering',
        label: 'Food & catering',
        emoji: '🍽️',
        tint: '#FAEEDA',
        border: '#C38A18',
        text: '#704707',
    },
    {
        id: 'lighting_audio',
        label: 'Lighting / audio',
        emoji: '🔊',
        tint: '#EEEDFE',
        border: '#534AB7',
        text: '#26215C',
    },
    {
        id: 'venue_rental',
        label: 'Venue',
        emoji: '🏠',
        tint: '#EAF3DE',
        border: '#5A8A28',
        text: '#33540F',
    },
    {
        id: 'staffing',
        label: 'Staffing',
        emoji: '👥',
        tint: '#F1EFE8',
        border: '#8F6942',
        text: '#4F3A26',
    },
] as const;

const compensationDesignOptions = [
    {
        id: 'free-entry',
        title: 'Free entry',
        subtitle: 'Good when the role is lightweight and the person also wants to attend.',
        detail: 'Best for friends, collaborators, and community contributors.',
        tint: '#FAECE7',
        border: '#D85A30',
        text: '#712B13',
    },
    {
        id: 'cash',
        title: 'Cash payment',
        subtitle: 'Use this when you want the role to feel clearly professional.',
        detail: 'Most direct option for specialists who are coming to work, not hang.',
        tint: '#E1F5EE',
        border: '#1D9E75',
        text: '#085041',
    },
    {
        id: 'discount',
        title: 'Discounted ticket',
        subtitle: 'Useful when you want some commitment without covering the full ticket.',
        detail: 'This keeps the event paid while still recognising the contribution.',
        tint: '#FAEEDA',
        border: '#C38A18',
        text: '#704707',
    },
    {
        id: 'hybrid',
        title: 'Mix and match',
        subtitle: 'For cases where a little cash plus access feels fairest.',
        detail: 'We will wire the exact combination rules in the next backend pass.',
        tint: '#EEEDFE',
        border: '#534AB7',
        text: '#26215C',
    },
] as const;

const allVendorCategoryOptions = VENDOR_CATEGORIES.flatMap((group) =>
    group.items.map((item) => ({
        ...item,
        group: group.group,
    })),
);


export function EventDetailsOverlay({
    event,
    categories,
    onClose,
    onSave,
}: {
    event: any;
    categories: Array<{ id: number; name: string }>;
    onClose: () => void;
    onSave: (payload: {
        title: string;
        categoryId: string;
        description: string;
        coverFile: File | null;
        startTime: string;
        durationHours: string;
        locationMode: 'offline' | 'online';
        locationName: string;
        locationAddress: string;
        onlineUrl: string;
        latitude: string;
        longitude: string;
    }) => Promise<void>;
}) {
    const [title, setTitle] = useState(event.title || '');
    const [categoryId, setCategoryId] = useState(String(event.category?.id || ''));
    const [description, setDescription] = useState(event.description || '');
    const [coverFile, setCoverFile] = useState<File | null>(null);
    const [coverPreview, setCoverPreview] = useState<string | null>(
        event.cover_image || null,
    );
    const [startTime, setStartTime] = useState(toDatetimeLocalValue(event.start_time));
    const [durationHours, setDurationHours] = useState(
        event.start_time && event.end_time
            ? String(
                Math.max(
                    1,
                    Math.round(
                        (new Date(event.end_time).getTime() -
                            new Date(event.start_time).getTime()) /
                        (1000 * 60 * 60),
                    ),
                ),
            )
            : '2',
    );
    const [locationMode, setLocationMode] = useState<'offline' | 'online'>(
        event.location_address === 'Online Event' ? 'online' : 'offline',
    );
    const [locationName, setLocationName] = useState(
        event.location_address === 'Online Event' ? '' : event.location_name || '',
    );
    const [locationAddress, setLocationAddress] = useState(
        event.location_address === 'Online Event' ? '' : event.location_address || '',
    );
    const [onlineUrl, setOnlineUrl] = useState(
        event.location_address === 'Online Event' ? event.location_name || '' : '',
    );
    const [latitude, setLatitude] = useState(
        event.latitude ? String(event.latitude) : '',
    );
    const [longitude, setLongitude] = useState(
        event.longitude ? String(event.longitude) : '',
    );
    const [isSaving, setIsSaving] = useState(false);
    const [isDetectingLocation, setIsDetectingLocation] = useState(false);

    const handleUseCurrentLocation = async () => {
        if (!canUseBrowserGeolocation()) {
            toast.error('Location needs HTTPS in production. It should work on localhost.');
            return;
        }

        setIsDetectingLocation(true);
        try {
            const coords = await getCurrentCoordinates();
            setLatitude(coords.latitude.toFixed(6));
            setLongitude(coords.longitude.toFixed(6));
            const reverse = await reverseGeocodeCoordinates(
                coords.latitude,
                coords.longitude,
            );
            if (reverse) {
                setLocationName(reverse.venueName);
                setLocationAddress(reverse.displayAddress);
            }
        } catch {
            toast.error('Could not access your location.');
        } finally {
            setIsDetectingLocation(false);
        }
    };

    return (
        <Box
            sx={{
                position: 'fixed',
                inset: 0,
                zIndex: 1200,
                background: 'rgba(24, 18, 12, 0.38)',
                overflowY: 'auto',
                p: { xs: 2, md: 3 },
            }}
        >
            <Box sx={{ maxWidth: 820, mx: 'auto' }}>
                <Stack direction="row" alignItems="center" spacing={1.5} sx={{ mb: 3 }}>
                    <Box
                        onClick={onClose}
                        sx={{
                            fontSize: 14,
                            color: 'var(--color-text-secondary)',
                            cursor: 'pointer',
                        }}
                    >
                        ← Event details
                    </Box>
                    <Typography
                        sx={{ fontFamily: 'Syne, sans-serif', fontSize: 20, fontWeight: 800 }}
                    >
                        Edit event details
                    </Typography>
                </Stack>

                <NeedWorkspaceCard title="Everything important lives here together">
                    <Typography
                        sx={{
                            fontSize: 13,
                            display: 'none',
                            color: 'var(--color-text-secondary)',
                            mb: 2,
                        }}
                    >
                        This section controls the core information people use to decide whether they
                        trust, understand, and show up for the event.
                    </Typography>

                    <Stack spacing={2}>
                        <TextField
                            label="Event title"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            fullWidth
                            sx={inputSx()}
                        />
                        <TextField
                            select
                            label="Category"
                            value={categoryId}
                            onChange={(e) => setCategoryId(e.target.value)}
                            fullWidth
                            sx={inputSx()}
                        >
                            {categories.map((category) => (
                                <MenuItem key={category.id} value={String(category.id)}>
                                    {category.name}
                                </MenuItem>
                            ))}
                        </TextField>
                        <TextField
                            label="Description"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            fullWidth
                            multiline
                            minRows={4}
                            helperText="All the sentences here matter. This is the line between vague interest and a confident RSVP."
                            sx={inputSx()}
                        />

                        <Box>
                            <Typography
                                sx={{
                                    fontSize: 11,
                                    fontWeight: 500,
                                    textTransform: 'uppercase',
                                    letterSpacing: '0.07em',
                                    color: 'var(--color-text-secondary)',
                                    mb: 0.75,
                                }}
                            >
                                Cover image
                            </Typography>
                            {coverPreview ? (
                                <Box
                                    component="img"
                                    src={coverPreview}
                                    alt="Cover preview"
                                    sx={{
                                        width: '100%',
                                        height: 180,
                                        objectFit: 'cover',
                                        borderRadius: '18px',
                                        mb: 1,
                                    }}
                                />
                            ) : null}
                            <Button
                                component="label"
                                variant="outlined"
                                sx={{ borderRadius: '999px', textTransform: 'none' }}
                            >
                                {coverPreview ? 'Replace cover image' : 'Add cover image'}
                                <input
                                    hidden
                                    type="file"
                                    accept="image/*"
                                    onChange={(e) => {
                                        const file = e.target.files?.[0] || null;
                                        setCoverFile(file);
                                        if (file) {
                                            setCoverPreview(URL.createObjectURL(file));
                                        }
                                    }}
                                />
                            </Button>
                        </Box>

                        <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
                            <TextField
                                label="Start date & time"
                                type="datetime-local"
                                value={startTime}
                                onChange={(e) => setStartTime(e.target.value)}
                                fullWidth
                                InputLabelProps={{ shrink: true }}
                                helperText="Hosts set the start time. The frontend calculates the end time from duration."
                                sx={inputSx()}
                            />
                            <TextField
                                label="Duration (hours)"
                                value={durationHours}
                                onChange={(e) => setDurationHours(e.target.value)}
                                fullWidth
                                helperText="This controls the end time automatically."
                                sx={inputSx()}
                            />
                        </Stack>

                        <Box>
                            <Typography
                                sx={{
                                    fontSize: 11,
                                    fontWeight: 500,
                                    textTransform: 'uppercase',
                                    letterSpacing: '0.07em',
                                    color: 'var(--color-text-secondary)',
                                    mb: 0.75,
                                }}
                            >
                                Format
                            </Typography>
                            <Stack direction="row" spacing={1}>
                                <Chip
                                    label="In person"
                                    onClick={() => setLocationMode('offline')}
                                    sx={{
                                        background:
                                            locationMode === 'offline'
                                                ? '#FAECE7'
                                                : '#f9f9f9',
                                        color:
                                            locationMode === 'offline'
                                                ? '#712B13'
                                                : 'var(--color-text-primary)',
                                        border: '0.5px solid',
                                        borderColor:
                                            locationMode === 'offline'
                                                ? '#D85A30'
                                                : 'var(--color-border-secondary)',
                                    }}
                                />
                                <Chip
                                    label="Online"
                                    onClick={() => setLocationMode('online')}
                                    sx={{
                                        background:
                                            locationMode === 'online'
                                                ? '#E1F5EE'
                                                : '#f9f9f9',
                                        color:
                                            locationMode === 'online'
                                                ? '#085041'
                                                : 'var(--color-text-primary)',
                                        border: '0.5px solid',
                                        borderColor:
                                            locationMode === 'online'
                                                ? '#1D9E75'
                                                : 'var(--color-border-secondary)',
                                    }}
                                />
                            </Stack>
                        </Box>

                        {locationMode === 'offline' ? (
                            <>
                                <TextField
                                    label="Venue name"
                                    value={locationName}
                                    onChange={(e) => setLocationName(e.target.value)}
                                    fullWidth
                                    sx={inputSx()}
                                />
                                <TextField
                                    label="Address"
                                    value={locationAddress}
                                    onChange={(e) => setLocationAddress(e.target.value)}
                                    fullWidth
                                    sx={inputSx()}
                                />
                                <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
                                    <TextField
                                        label="Latitude"
                                        value={latitude}
                                        onChange={(e) => setLatitude(e.target.value)}
                                        fullWidth
                                        sx={inputSx()}
                                    />
                                    <TextField
                                        label="Longitude"
                                        value={longitude}
                                        onChange={(e) => setLongitude(e.target.value)}
                                        fullWidth
                                        sx={inputSx()}
                                    />
                                </Stack>
                                <Button
                                    variant="outlined"
                                    onClick={handleUseCurrentLocation}
                                    disabled={isDetectingLocation}
                                    sx={{
                                        borderRadius: '999px',
                                        width: 'fit-content',
                                        textTransform: 'none',
                                    }}
                                >
                                    {isDetectingLocation ? 'Detecting location…' : 'Use current location'}
                                </Button>
                            </>
                        ) : (
                            <TextField
                                label="Online event URL"
                                value={onlineUrl}
                                onChange={(e) => setOnlineUrl(e.target.value)}
                                fullWidth
                                helperText="If this is online, the join link becomes the primary location signal."
                                sx={inputSx()}
                            />
                        )}
                    </Stack>

                    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} sx={{ mt: 3 }}>
                        <Button
                            variant="outlined"
                            onClick={onClose}
                            sx={{ borderRadius: '999px', py: 1.35, textTransform: 'none' }}
                        >
                            Cancel
                        </Button>
                        <Button
                            variant="contained"
                            disabled={isSaving}
                            onClick={async () => {
                                setIsSaving(true);
                                try {
                                    await onSave({
                                        title,
                                        categoryId,
                                        description,
                                        coverFile,
                                        startTime,
                                        durationHours,
                                        locationMode,
                                        locationName,
                                        locationAddress,
                                        onlineUrl,
                                        latitude,
                                        longitude,
                                    });
                                    onClose();
                                } finally {
                                    setIsSaving(false);
                                }
                            }}
                            sx={{
                                borderRadius: '999px',
                                py: 1.35,
                                textTransform: 'none',
                                background: '#D85A30',
                                boxShadow: 'none',
                            }}
                        >
                            {isSaving ? 'Saving details…' : 'Save details'}
                        </Button>
                    </Stack>
                </NeedWorkspaceCard>
            </Box>
        </Box>
    );
}

export function FeaturesOverlay({
    initialFeatures,
    onClose,
    onSave,
}: {
    initialFeatures: EditableFeature[];
    onClose: () => void;
    onSave: (features: EditableFeature[]) => Promise<void>;
}) {
    const [features, setFeatures] = useState<EditableFeature[]>(initialFeatures);
    const [isSaving, setIsSaving] = useState(false);

    const toggleFeature = (name: string) => {
        setFeatures((current) => {
            const exists = current.some((f) => f.name === name);
            if (exists) {
                return current.filter((f) => f.name !== name);
            } else {
                return [...current, { name, tag: 'additional', outsourced: false }];
            }
        });
    };

    const toggleOutsourced = (name: string) => {
        setFeatures((current) =>
            current.map((f) =>
                f.name === name ? { ...f, outsourced: !f.outsourced } : f
            )
        );
    };

    return (
        <Box
            sx={{
                position: 'fixed',
                inset: 0,
                zIndex: 1200,
                background: 'rgba(24, 18, 12, 0.38)',
                overflowY: 'auto',
                p: { xs: 2, md: 3 },
            }}
        >
            <Box sx={{ maxWidth: 820, mx: 'auto' }}>
                <Stack direction="row" alignItems="center" spacing={1.5} sx={{ mb: 3 }}>
                    <Box
                        onClick={onClose}
                        sx={{
                            fontSize: 14,
                            color: '#fff',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 1
                        }}
                    >
                        ← Back
                    </Box>
                    <Typography
                        sx={{ fontFamily: 'Syne, sans-serif', fontSize: 20, fontWeight: 800, color: '#fff' }}
                    >
                        Add the things people will care about
                    </Typography>
                </Stack>

                <NeedWorkspaceCard title="Features">
                    <Typography
                        sx={{
                            fontSize: 13,
                            color: 'var(--color-text-secondary)',
                            mb: 3,
                        }}
                    >
                        Pick the features that best describe your event. Mark them as outsourced if you'll need help managing them later.
                    </Typography>

                    <Box
                        sx={{
                            display: 'grid',
                            gridTemplateColumns: { xs: 'repeat(2, 1fr)', sm: 'repeat(3, 1fr)', md: 'repeat(4, 1fr)' },
                            gap: 2,
                            mb: 4
                        }}
                    >
                        {FEATURE_ITEMS.map((item) => {
                            const selectedFeature = features.find((f) => f.name === item.name);
                            const isSelected = !!selectedFeature;
                            return (
                                <Stack key={item.name} spacing={1}>
                                    <Box
                                        onClick={() => toggleFeature(item.name)}
                                        sx={{
                                            height: 80,
                                            display: 'flex',
                                            flexDirection: 'column',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            gap: 0.5,
                                            borderRadius: '16px',
                                            cursor: 'pointer',
                                            transition: 'all 0.2s',
                                            background: isSelected ? '#FAECE7' : 'var(--color-background-secondary)',
                                            border: '2px solid',
                                            borderColor: isSelected ? '#D85A30' : 'transparent',
                                            '&:hover': {
                                                transform: 'translateY(-2px)',
                                                boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
                                                borderColor: isSelected ? '#D85A30' : 'var(--color-border-tertiary)'
                                            }
                                        }}
                                    >
                                        <Typography sx={{ fontSize: 24 }}>{item.emoji}</Typography>
                                        <Typography
                                            sx={{
                                                fontSize: 12,
                                                fontWeight: 700,
                                                color: isSelected ? '#712B13' : 'var(--color-text-primary)',
                                                textAlign: 'center'
                                            }}
                                        >
                                            {item.name}
                                        </Typography>
                                    </Box>
                                    {isSelected && (
                                        <Stack
                                            direction="row"
                                            spacing={0.5}
                                            alignItems="center"
                                            onClick={() => toggleOutsourced(item.name)}
                                            sx={{ cursor: 'pointer', px: 0.5 }}
                                        >
                                            <Checkbox
                                                size="small"
                                                checked={!!selectedFeature.outsourced}
                                                sx={{ p: 0, color: '#D85A30', '&.Mui-checked': { color: '#D85A30' } }}
                                            />
                                            <Typography sx={{ fontSize: 10, fontWeight: 600, color: 'var(--color-text-secondary)' }}>
                                                Outsource
                                            </Typography>
                                        </Stack>
                                    )}
                                </Stack>
                            );
                        })}
                    </Box>

                    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} sx={{ mt: 3 }}>
                        <Button
                            variant="outlined"
                            onClick={onClose}
                            sx={{ borderRadius: '999px', py: 1.35, textTransform: 'none', fontWeight: 600 }}
                        >
                            Cancel
                        </Button>
                        <Button
                            variant="contained"
                            disabled={isSaving}
                            onClick={async () => {
                                setIsSaving(true);
                                try {
                                    await onSave(features);
                                    onClose();
                                } finally {
                                    setIsSaving(false);
                                }
                            }}
                            sx={{
                                borderRadius: '999px',
                                py: 1.35,
                                px: 4,
                                textTransform: 'none',
                                fontWeight: 700,
                                background: '#D85A30',
                                boxShadow: 'none',
                                '&:hover': { background: '#BF4E29', boxShadow: 'none' }
                            }}
                        >
                            {isSaving ? 'Saving...' : 'Save changes'}
                        </Button>
                    </Stack>
                </NeedWorkspaceCard>
            </Box>
        </Box>
    );
}

export function TicketsOverlay({
    initialCapacity,
    initialTiers,
    onClose,
    onSave,
}: {
    initialCapacity: string;
    initialTiers: EditableTicketTier[];
    onClose: () => void;
    onSave: (payload: { capacity: string; tiers: EditableTicketTier[] }) => Promise<void>;
}) {
    const [capacity, setCapacity] = useState(initialCapacity);
    const [tiers, setTiers] = useState<EditableTicketTier[]>(
        initialTiers.length > 0
            ? initialTiers
            : [
                {
                    name: 'General Admission',
                    price: 0,
                    admits: 1,
                    max_passes_per_ticket: 6,
                    capacity: '',
                    description: '',
                    refund_percentage: 100,
                },
            ],
    );
    const [isSaving, setIsSaving] = useState(false);

    const totalCapacityNum = Number(capacity) || 0;
    const lastTierAutoCapacity = useMemo(() => {
        if (!totalCapacityNum || tiers.length === 0) return null;
        const sumOthers = tiers
            .slice(0, -1)
            .reduce((sum, tier) => sum + (Number(tier.capacity) || 0), 0);
        return Math.max(0, totalCapacityNum - sumOthers);
    }, [tiers, totalCapacityNum]);

    return (
        <Box
            sx={{
                position: 'fixed',
                inset: 0,
                zIndex: 1200,
                background: 'rgba(24, 18, 12, 0.38)',
                overflowY: 'auto',
                p: { xs: 2, md: 3 },
            }}
        >
            <Box sx={{ maxWidth: 900, mx: 'auto' }}>
                <Stack direction="row" alignItems="center" spacing={1.5} sx={{ mb: 3 }}>
                    <Box
                        onClick={onClose}
                        sx={{
                            fontSize: 14,
                            color: 'var(--color-text-secondary)',
                            cursor: 'pointer',
                        }}
                    >
                        ← Tickets
                    </Box>
                    <Typography
                        sx={{ fontFamily: 'Syne, sans-serif', fontSize: 20, fontWeight: 800 }}
                    >
                        Ticket manager
                    </Typography>
                </Stack>
                <NeedWorkspaceCard title="Tickets & capacity">
                    <Typography
                        sx={{
                            fontSize: 13,
                            display: 'none',
                            color: 'var(--color-text-secondary)',
                            mb: 2,
                        }}
                    >
                        Every ticket communicates value. Price, capacity, refund logic, admits, and
                        pass limits should all read clearly at a glance.
                    </Typography>

                    <TextField
                        label="Total event capacity"
                        value={capacity}
                        onChange={(e) => setCapacity(e.target.value)}
                        helperText="Leave blank for unlimited. If you set a total cap, the last tier inherits remaining capacity."
                        fullWidth
                        sx={{ ...inputSx(), mb: 2 }}
                    />

                    <Stack spacing={2}>
                        {tiers.map((tier, index) => {
                            const isLastTier = index === tiers.length - 1;
                            const accent = ['#FAECE7', '#E6F1FB', '#EAF3DE', '#EEEDFE'][index % 4];
                            return (
                                <Box
                                    key={`${tier.name}-${index}`}
                                    sx={{
                                        border: '0.5px solid var(--color-border-tertiary)',
                                        borderRadius: '22px',
                                        overflow: 'hidden',
                                        background: '#fffdfb',
                                    }}
                                >
                                    <Box sx={{ background: accent, px: 2, py: 1.25 }}>
                                        <Stack
                                            direction="row"
                                            alignItems="center"
                                            justifyContent="space-between"
                                        >
                                            <Typography
                                                sx={{
                                                    fontFamily: 'Syne, sans-serif',
                                                    fontSize: 16,
                                                    fontWeight: 700,
                                                }}
                                            >
                                                Tier {index + 1}
                                            </Typography>
                                            {tiers.length > 1 ? (
                                                <Button
                                                    variant="text"
                                                    onClick={() =>
                                                        setTiers((current) =>
                                                            current.filter(
                                                                (_, currentIndex) => currentIndex !== index,
                                                            ),
                                                        )
                                                    }
                                                    sx={{ textTransform: 'none', color: '#D85A30' }}
                                                >
                                                    Remove
                                                </Button>
                                            ) : null}
                                        </Stack>
                                    </Box>
                                    <Box sx={{ p: 2 }}>
                                        <Stack spacing={1.5}>
                                            <TextField
                                                label="Tier name"
                                                value={tier.name}
                                                onChange={(e) =>
                                                    setTiers((current) =>
                                                        current.map((item, currentIndex) =>
                                                            currentIndex === index
                                                                ? { ...item, name: e.target.value }
                                                                : item,
                                                        ),
                                                    )
                                                }
                                                fullWidth
                                                sx={inputSx()}
                                            />
                                            <Stack direction={{ xs: 'column', md: 'row' }} spacing={1.5}>
                                                <TextField
                                                    label="Price"
                                                    value={tier.price}
                                                    onChange={(e) =>
                                                        setTiers((current) =>
                                                            current.map((item, currentIndex) =>
                                                                currentIndex === index
                                                                    ? { ...item, price: e.target.value }
                                                                    : item,
                                                            ),
                                                        )
                                                    }
                                                    fullWidth
                                                    sx={inputSx()}
                                                />
                                                <TextField
                                                    label="Admits"
                                                    value={tier.admits}
                                                    onChange={(e) =>
                                                        setTiers((current) =>
                                                            current.map((item, currentIndex) =>
                                                                currentIndex === index
                                                                    ? { ...item, admits: e.target.value }
                                                                    : item,
                                                            ),
                                                        )
                                                    }
                                                    fullWidth
                                                    sx={inputSx()}
                                                />
                                                <TextField
                                                    label="Max passes"
                                                    value={tier.max_passes_per_ticket}
                                                    onChange={(e) =>
                                                        setTiers((current) =>
                                                            current.map((item, currentIndex) =>
                                                                currentIndex === index
                                                                    ? { ...item, max_passes_per_ticket: e.target.value }
                                                                    : item,
                                                            ),
                                                        )
                                                    }
                                                    fullWidth
                                                    sx={inputSx()}
                                                />
                                            </Stack>
                                            <Stack direction={{ xs: 'column', md: 'row' }} spacing={1.5}>
                                                <TextField
                                                    label={
                                                        isLastTier && totalCapacityNum
                                                            ? 'Capacity (auto if blank)'
                                                            : 'Capacity'
                                                    }
                                                    value={
                                                        tier.capacity === '' || tier.capacity === null
                                                            ? ''
                                                            : String(tier.capacity)
                                                    }
                                                    onChange={(e) =>
                                                        setTiers((current) =>
                                                            current.map((item, currentIndex) =>
                                                                currentIndex === index
                                                                    ? {
                                                                        ...item,
                                                                        capacity:
                                                                            e.target.value === ''
                                                                                ? ''
                                                                                : Number(e.target.value),
                                                                    }
                                                                    : item,
                                                            ),
                                                        )
                                                    }
                                                    helperText={
                                                        isLastTier && totalCapacityNum
                                                            ? `If left blank, this tier inherits ${lastTierAutoCapacity ?? 0} spots.`
                                                            : undefined
                                                    }
                                                    fullWidth
                                                    sx={inputSx()}
                                                />
                                                <TextField
                                                    label="Refund %"
                                                    value={tier.refund_percentage ?? 100}
                                                    onChange={(e) =>
                                                        setTiers((current) =>
                                                            current.map((item, currentIndex) =>
                                                                currentIndex === index
                                                                    ? {
                                                                        ...item,
                                                                        refund_percentage: Number(e.target.value) || 0,
                                                                    }
                                                                    : item,
                                                            ),
                                                        )
                                                    }
                                                    fullWidth
                                                    sx={inputSx()}
                                                />
                                            </Stack>
                                            <TextField
                                                label="Description"
                                                value={tier.description}
                                                onChange={(e) =>
                                                    setTiers((current) =>
                                                        current.map((item, currentIndex) =>
                                                            currentIndex === index
                                                                ? { ...item, description: e.target.value }
                                                                : item,
                                                        ),
                                                    )
                                                }
                                                fullWidth
                                                multiline
                                                minRows={2}
                                                sx={inputSx()}
                                            />
                                        </Stack>
                                    </Box>
                                </Box>
                            );
                        })}
                    </Stack>

                    <Button
                        variant="outlined"
                        onClick={() =>
                            setTiers((current) => [
                                ...current,
                                {
                                    name: `Tier ${current.length + 1}`,
                                    price: 0,
                                    admits: 1,
                                    max_passes_per_ticket: 6,
                                    capacity: '',
                                    description: '',
                                    refund_percentage: 100,
                                },
                            ])
                        }
                        sx={{ mt: 2, borderRadius: '999px', textTransform: 'none' }}
                    >
                        + Add ticket
                    </Button>

                    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} sx={{ mt: 3 }}>
                        <Button
                            variant="outlined"
                            onClick={onClose}
                            sx={{ borderRadius: '999px', py: 1.35, textTransform: 'none' }}
                        >
                            Cancel
                        </Button>
                        <Button
                            variant="contained"
                            disabled={isSaving}
                            onClick={async () => {
                                setIsSaving(true);
                                try {
                                    await onSave({ capacity, tiers });
                                    onClose();
                                } finally {
                                    setIsSaving(false);
                                }
                            }}
                            sx={{
                                borderRadius: '999px',
                                py: 1.35,
                                textTransform: 'none',
                                background: '#D85A30',
                                boxShadow: 'none',
                            }}
                        >
                            {isSaving ? 'Saving tickets…' : 'Save tickets'}
                        </Button>
                    </Stack>
                </NeedWorkspaceCard>
            </Box>
        </Box>
    );
}


export function formatNeedReward(need: EventNeed) {
    const min = need.budget_min ? Number(need.budget_min) : null;
    const max = need.budget_max ? Number(need.budget_max) : null;
    if (min !== null && max !== null) return `${formatMoney(min)}-${formatMoney(max)}`;
    if (min !== null) return `From ${formatMoney(min)}`;
    if (max !== null) return `Up to ${formatMoney(max)}`;
    return 'Compensation TBD';
}

export function getRecommendedNeedForVendor(needs: EventNeed[], vendor: VendorSuggestion) {
    return (
        needs.find((need) =>
            `${need.category} ${need.title}`
                .toLowerCase()
                .includes(vendor.recommendedNeedId.split('-')[0]),
        ) ||
        needs[0] ||
        null
    );
}

export function ReviewApplicantsOverlay({
    need,
    onClose,
    onApprove,
    onReject,
}: {
    need: EventNeed;
    onClose: () => void;
    onApprove: (applicationId: number) => Promise<void>;
    onReject: (applicationId: number) => Promise<void>;
}) {
    return (
        <Box
            sx={{
                position: 'fixed',
                inset: 0,
                zIndex: 1200,
                background: 'rgba(24, 18, 12, 0.38)',
                overflowY: 'auto',
                p: { xs: 2, md: 3 },
            }}
        >
            <Box sx={{ maxWidth: 820, mx: 'auto' }}>
                <Stack direction="row" alignItems="center" spacing={1.5} sx={{ mb: 3 }}>
                    <Box
                        onClick={onClose}
                        sx={{
                            fontSize: 14,
                            color: 'var(--color-text-secondary)',
                            cursor: 'pointer',
                        }}
                    >
                        ← Needs board
                    </Box>
                    <Typography
                        sx={{ fontFamily: 'Syne, sans-serif', fontSize: 20, fontWeight: 800 }}
                    >
                        Review applicants
                    </Typography>
                </Stack>

                <NeedWorkspaceCard title={need.title}>
                    <Typography
                        sx={{
                            fontSize: 13,
                            display: 'none',
                            color: 'var(--color-text-secondary)',
                            mb: 2,
                        }}
                    >
                        These people already raised their hand. Read for clarity, reliability, and
                        whether they reduce host stress instead of adding more of it.
                    </Typography>

                    <Stack spacing={1.5}>
                        {need.applications.length === 0 ? (
                            <Box
                                sx={{
                                    border: '0.5px dashed var(--color-border-secondary)',
                                    borderRadius: '20px',
                                    p: 2.5,
                                    background: '#fffdfb',
                                }}
                            >
                                <Typography
                                    sx={{
                                        fontSize: 13,
                                        display: 'none',
                                        color: 'var(--color-text-secondary)',
                                    }}
                                >
                                    No applications have come in yet. This is the point where a direct
                                    invite or a stronger need description usually changes the outcome.
                                </Typography>
                            </Box>
                        ) : null}
                        {need.applications.map((applicant, index) => (
                            <Box
                                key={applicant.id}
                                sx={{
                                    border: '0.5px solid var(--color-border-tertiary)',
                                    borderRadius: '20px',
                                    background: '#fffdfb',
                                    p: 1.75,
                                }}
                            >
                                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
                                    <Avatar
                                        sx={{
                                            width: 42,
                                            height: 42,
                                            bgcolor: ['#1D9E75', '#534AB7', '#D85A30', '#185FA5'][index % 4],
                                            fontSize: 13,
                                            fontWeight: 700,
                                        }}
                                    >
                                        {applicant.vendor_name?.[0]?.toUpperCase() || 'V'}
                                    </Avatar>
                                    <Box sx={{ flex: 1 }}>
                                        <Stack
                                            direction={{ xs: 'column', md: 'row' }}
                                            spacing={1}
                                            alignItems={{ xs: 'flex-start', md: 'center' }}
                                            justifyContent="space-between"
                                        >
                                            <Typography sx={{ fontSize: 15, fontWeight: 700 }}>
                                                {applicant.vendor_name}
                                            </Typography>
                                            <Chip
                                                label={
                                                    applicant.status === 'accepted'
                                                        ? 'Accepted'
                                                        : applicant.status === 'rejected'
                                                            ? 'Rejected'
                                                            : 'Awaiting decision'
                                                }
                                                sx={{
                                                    height: 24,
                                                    background:
                                                        applicant.status === 'accepted'
                                                            ? '#EAF3DE'
                                                            : applicant.status === 'rejected'
                                                                ? '#FCEBEB'
                                                                : '#EEEDFE',
                                                    color:
                                                        applicant.status === 'accepted'
                                                            ? '#3B6D11'
                                                            : applicant.status === 'rejected'
                                                                ? '#A32D2D'
                                                                : '#26215C',
                                                    fontSize: 11,
                                                    fontWeight: 600,
                                                }}
                                            />
                                        </Stack>
                                        <Typography sx={{ fontSize: 13, fontWeight: 500, mt: 0.75 }}>
                                            {applicant.proposed_price
                                                ? `Proposed price ${formatMoney(applicant.proposed_price)}`
                                                : 'No price proposed yet'}
                                        </Typography>
                                        <Typography
                                            sx={{
                                                fontSize: 12,
                                                color: 'var(--color-text-secondary)',
                                                lineHeight: 1.5,
                                                mt: 0.75,
                                            }}
                                        >
                                            {applicant.message || 'No note added.'}
                                        </Typography>
                                        <Stack direction="row" spacing={1} sx={{ mt: 1.5 }}>
                                            {applicant.status === 'pending' ? (
                                                <>
                                                    <Button
                                                        variant="contained"
                                                        onClick={() => void onApprove(applicant.id)}
                                                        sx={{
                                                            borderRadius: '999px',
                                                            textTransform: 'none',
                                                            background: '#D85A30',
                                                            boxShadow: 'none',
                                                        }}
                                                    >
                                                        Approve
                                                    </Button>
                                                    <Button
                                                        variant="outlined"
                                                        onClick={() => void onReject(applicant.id)}
                                                        sx={{ borderRadius: '999px', textTransform: 'none' }}
                                                    >
                                                        Reject
                                                    </Button>
                                                </>
                                            ) : null}
                                        </Stack>
                                    </Box>
                                </Stack>
                            </Box>
                        ))}
                    </Stack>
                </NeedWorkspaceCard>
            </Box>
        </Box>
    );
}

export function NeedActionDialog({
    state,
    onClose,
    onConfirm,
}: {
    state: NeedActionDialogState;
    onClose: () => void;
    onConfirm: (message: string) => Promise<void>;
}) {
    const [message, setMessage] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    return (
        <Box
            sx={{
                position: 'fixed',
                inset: 0,
                zIndex: 1300,
                background: 'rgba(24, 18, 12, 0.42)',
                display: 'grid',
                placeItems: 'center',
                p: 2,
            }}
        >
            <Box
                sx={{
                    width: '100%',
                    maxWidth: 520,
                    background: '#fffdfb',
                    borderRadius: '28px',
                    border: '0.5px solid var(--color-border-tertiary)',
                    p: 2.25,
                }}
            >
                <Typography
                    sx={{ fontFamily: 'Syne, sans-serif', fontSize: 22, fontWeight: 800 }}
                >
                    {state.title}
                </Typography>
                <Typography
                    sx={{
                        fontSize: 13,
                        color: 'var(--color-text-secondary)',
                        lineHeight: 1.55,
                        mt: 1,
                    }}
                >
                    {state.description}
                </Typography>
                <Chip
                    label={state.targetLabel}
                    sx={{
                        mt: 1.5,
                        height: 26,
                        background: '#F1EFE8',
                        color: 'var(--color-text-primary)',
                        fontSize: 11,
                        fontWeight: 600,
                    }}
                />
                <TextField
                    label="Optional message"
                    value={message}
                    onChange={(event) => setMessage(event.target.value)}
                    placeholder={state.placeholder}
                    fullWidth
                    multiline
                    minRows={3}
                    sx={{ ...inputSx(), mt: 2 }}
                />
                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.25} sx={{ mt: 2 }}>
                    <Button
                        variant="outlined"
                        onClick={onClose}
                        sx={{ borderRadius: '999px', py: 1.3, textTransform: 'none' }}
                    >
                        Cancel
                    </Button>
                    <Button
                        variant="contained"
                        onClick={async () => {
                            setIsSubmitting(true);
                            try {
                                await onConfirm(message);
                            } finally {
                                setIsSubmitting(false);
                            }
                        }}
                        disabled={isSubmitting}
                        sx={{
                            borderRadius: '999px',
                            py: 1.3,
                            textTransform: 'none',
                            background: '#D85A30',
                            boxShadow: 'none',
                        }}
                    >
                        {isSubmitting ? 'Saving…' : state.confirmLabel}
                    </Button>
                </Stack>
            </Box>
        </Box>
    );
}
