import { Box, Typography } from '@mui/material';
import { LocateFixed, MapPin, Search, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import {
    canUseBrowserGeolocation,
    getCurrentCoordinates,
    reverseGeocodeCoordinates,
} from '@/utils/geolocation';

interface LocationResult {
    displayName: string;
    lat: number;
    lng: number;
}

interface LocationPickerBoxProps {
    /** Called whenever the user picks/detects a location */
    onChange?: (location: { label: string; lat: number; lng: number } | null) => void;
}

const STORAGE_KEY = 'outgoing.locationPicker';

function readStored(): { label: string; lat: number; lng: number } | null {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        return raw ? JSON.parse(raw) : null;
    } catch {
        return null;
    }
}

export function LocationPickerBox({ onChange }: LocationPickerBoxProps) {
    const [inputValue, setInputValue] = useState('');
    const [selected, setSelected] = useState<{ label: string; lat: number; lng: number } | null>(
        readStored,
    );
    const [suggestions, setSuggestions] = useState<LocationResult[]>([]);
    const [isSearchOpen, setIsSearchOpen] = useState(false);
    const [isDetecting, setIsDetecting] = useState(false);
    const [isSearching, setIsSearching] = useState(false);
    const debounceRef = useRef<ReturnType<typeof setTimeout>>();
    const containerRef = useRef<HTMLDivElement>(null);

    // Persist selection
    useEffect(() => {
        if (selected) {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(selected));
        } else {
            localStorage.removeItem(STORAGE_KEY);
        }
        onChange?.(selected);
    }, [selected]);

    // Close dropdown on outside click
    useEffect(() => {
        function handleClick(e: MouseEvent) {
            if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
                setIsSearchOpen(false);
                setSuggestions([]);
            }
        }
        document.addEventListener('mousedown', handleClick);
        return () => document.removeEventListener('mousedown', handleClick);
    }, []);

    const handleDetect = async () => {
        if (!canUseBrowserGeolocation()) return;
        setIsDetecting(true);
        try {
            const { latitude, longitude } = await getCurrentCoordinates();
            const result = await reverseGeocodeCoordinates(latitude, longitude);
            // Shorten the display name to city/neighbourhood level
            const parts = (result?.displayAddress || '').split(',');
            const shortLabel = parts.slice(0, 3).join(',').trim() || result?.venueName || 'Current Location';
            const loc = { label: shortLabel, lat: latitude, lng: longitude };
            setSelected(loc);
            setInputValue('');
            setIsSearchOpen(false);
        } catch {
            // ignore
        } finally {
            setIsDetecting(false);
        }
    };

    const handleInputChange = (value: string) => {
        setInputValue(value);
        clearTimeout(debounceRef.current);
        if (!value.trim()) {
            setSuggestions([]);
            return;
        }
        debounceRef.current = setTimeout(async () => {
            setIsSearching(true);
            try {
                const res = await fetch(
                    `https://nominatim.openstreetmap.org/search?format=jsonv2&q=${encodeURIComponent(value)}&limit=5&addressdetails=1`,
                );
                const data: any[] = await res.json();
                setSuggestions(
                    data.map((item) => ({
                        displayName: item.display_name,
                        lat: parseFloat(item.lat),
                        lng: parseFloat(item.lon),
                    })),
                );
            } catch {
                setSuggestions([]);
            } finally {
                setIsSearching(false);
            }
        }, 350);
    };

    const handleSelect = (s: LocationResult) => {
        const parts = s.displayName.split(',');
        const shortLabel = parts.slice(0, 3).join(',').trim();
        setSelected({ label: shortLabel, lat: s.lat, lng: s.lng });
        setInputValue('');
        setSuggestions([]);
        setIsSearchOpen(false);
    };

    const handleClear = (e: React.MouseEvent) => {
        e.stopPropagation();
        setSelected(null);
        setInputValue('');
        setSuggestions([]);
    };

    return (
        <Box
            ref={containerRef}
            sx={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 1,
                flexWrap: 'wrap',
                position: 'relative',
            }}
        >
            {/* Pill showing selected location OR the search trigger */}
            <Box
                onClick={() => { if (!isSearchOpen) setIsSearchOpen(true); }}
                sx={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 0.8,
                    px: 2,
                    py: 0.6,
                    bgcolor: 'transparent',
                    cursor: 'pointer',
                    transform: 'rotate(-1deg)',
                    transition: 'all 0.15s ease',
                    maxWidth: 320,
                    '&:hover': { transform: 'rotate(-1deg) translate(1px, 1px)' },
                }}
            >
                <MapPin size={15} strokeWidth={2.5} style={{ flexShrink: 0, color: '#ef4444' }} />
                <Typography
                    noWrap
                    sx={{
                        fontSize: '0.82rem',
                        fontFamily: '"Permanent Marker", cursive',
                        color: '#1a1a1a',
                        maxWidth: 220,
                    }}
                >
                    {selected ? selected.label : 'Where are you?'}
                </Typography>

                {/* GPS detect button */}
                <Box
                    component="span"
                    onClick={(e) => { e.stopPropagation(); handleDetect(); }}
                    title="Use my location"
                    sx={{
                        ml: 0.5,
                        display: 'flex',
                        alignItems: 'center',
                        color: isDetecting ? '#6b7280' : '#3b82f6',
                        cursor: isDetecting ? 'wait' : 'pointer',
                        '&:hover': { color: '#2563eb' },
                    }}
                >
                    <LocateFixed size={14} strokeWidth={2.5} />
                </Box>

                {/* Clear */}
                {selected && (
                    <Box
                        component="span"
                        onClick={handleClear}
                        sx={{ ml: 0.3, display: 'flex', alignItems: 'center', color: '#9ca3af', cursor: 'pointer', '&:hover': { color: '#ef4444' } }}
                    >
                        <X size={13} strokeWidth={2.5} />
                    </Box>
                )}
            </Box>

            {/* Expanded search input + dropdown */}
            {isSearchOpen && (
                <Box
                    sx={{
                        position: 'absolute',
                        top: 'calc(100% + 8px)',
                        left: 0,
                        zIndex: 100,
                        bgcolor: '#fff',
                        border: 'none',
                        boxShadow: '0 4px 20px rgba(0,0,0,0.12)',
                        minWidth: 300,
                        maxWidth: 380,
                    }}
                >
                    {/* Input row */}
                    <Box sx={{ display: 'flex', alignItems: 'center', borderBottom: '1.5px solid #e5e7eb', px: 1.5, py: 0.8, gap: 1 }}>
                        <Search size={14} strokeWidth={2} style={{ color: '#9ca3af', flexShrink: 0 }} />
                        <input
                            autoFocus
                            value={inputValue}
                            onChange={(e) => handleInputChange(e.target.value)}
                            placeholder="Search city or address…"
                            style={{
                                border: 'none',
                                outline: 'none',
                                flex: 1,
                                fontFamily: '"Permanent Marker", cursive',
                                fontSize: '0.8rem',
                                color: '#1a1a1a',
                                background: 'transparent',
                            }}
                        />
                        {isSearching && (
                            <Typography sx={{ fontSize: '0.7rem', color: '#9ca3af' }}>…</Typography>
                        )}
                    </Box>

                    {/* Detect row */}
                    <Box
                        onClick={() => { handleDetect(); setIsSearchOpen(false); }}
                        sx={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 1,
                            px: 1.5,
                            py: 1,
                            cursor: isDetecting ? 'wait' : 'pointer',
                            borderBottom: suggestions.length ? '1px solid #f3f4f6' : 'none',
                            '&:hover': { bgcolor: '#f9fafb' },
                        }}
                    >
                        <LocateFixed size={13} strokeWidth={2.5} style={{ color: '#3b82f6', flexShrink: 0 }} />
                        <Typography sx={{ fontFamily: '"Permanent Marker", cursive', fontSize: '0.78rem', color: '#3b82f6' }}>
                            {isDetecting ? 'Detecting…' : 'Use my current location'}
                        </Typography>
                    </Box>

                    {/* Suggestions */}
                    {suggestions.map((s, i) => (
                        <Box
                            key={i}
                            onClick={() => handleSelect(s)}
                            sx={{
                                px: 1.5,
                                py: 0.9,
                                cursor: 'pointer',
                                borderBottom: i < suggestions.length - 1 ? '1px solid #f3f4f6' : 'none',
                                '&:hover': { bgcolor: '#fef9c3' },
                            }}
                        >
                            <Typography sx={{ fontSize: '0.78rem', fontFamily: 'serif', color: '#1a1a1a', lineHeight: 1.3 }}>
                                {s.displayName.split(',').slice(0, 4).join(', ')}
                            </Typography>
                        </Box>
                    ))}
                </Box>
            )}
        </Box>
    );
}
