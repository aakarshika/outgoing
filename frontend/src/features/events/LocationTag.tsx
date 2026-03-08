import { Box, Typography } from '@mui/material';
import { Globe, MapPin } from 'lucide-react';
import { useEffect, useState } from 'react';

interface LocationTagProps {
    locationName: string;
    locationAddress?: string;
    latitude?: number | null;
    longitude?: number | null;
    color?: string;
    size?: number;
}

export const LocationTag = ({
    locationName,
    locationAddress,
    latitude,
    longitude,
    color = '#666',
    size = 12,
}: LocationTagProps) => {
    const [distanceMiles, setDistanceMiles] = useState<number | null>(null);

    const isOnline =
        (locationAddress && locationAddress.toLowerCase() === 'online event');

    useEffect(() => {
        if (isOnline || !latitude || !longitude || !navigator.geolocation) return;

        navigator.geolocation.getCurrentPosition(
            (pos) => {
                const R = 3958.8; // Earth radius in miles
                const dLat = ((latitude - pos.coords.latitude) * Math.PI) / 180;
                const dLon = ((longitude - pos.coords.longitude) * Math.PI) / 180;
                const a =
                    Math.sin(dLat / 2) ** 2 +
                    Math.cos((pos.coords.latitude * Math.PI) / 180) *
                    Math.cos((latitude * Math.PI) / 180) *
                    Math.sin(dLon / 2) ** 2;
                const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
                setDistanceMiles(Math.round(R * c));
            },
            () => {
                // silently ignore if user denies location
            },
            { timeout: 5000 },
        );
    }, [latitude, longitude, isOnline]);

    if (isOnline) {
        return (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Globe size={size} color="#3b82f6" />
                <Typography
                    sx={{
                        fontSize: `${size / 16 + 0.05}rem`,
                        color: '#3b82f6',
                        fontFamily: 'serif',
                        fontWeight: 'bold',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        px: 0.5,
                        py: 0.2,
                        bgcolor: 'rgba(59, 130, 246, 0.1)',
                        borderRadius: '4px',
                        border: '1px solid rgba(59, 130, 246, 0.3)',
                    }}
                >
                    Online
                </Typography>
            </Box>
        );
    }

    let displayText = locationName;
    if (distanceMiles !== null && distanceMiles < 50) {
        displayText = `${distanceMiles} miles away`;
    }

    return (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <MapPin size={size} color={color} />
            <Typography
                sx={{
                    fontSize: `${size / 16 + 0.05}rem`,
                    color,
                    fontFamily: 'serif',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                }}
            >
                {displayText}
            </Typography>
        </Box>
    );
};
