import { Box } from '@mui/material';
import { Star } from 'lucide-react';

export const DoodleStar = ({
    size = 24,
    rotate = 0,
    color = '#fcd34d',
}: {
    size?: number;
    rotate?: number;
    color?: string;
}) => (
    <Box sx={{ transform: `rotate(${rotate}deg)`, display: 'inline-block' }}>
        <Star size={size} fill={color} color={color} />
    </Box>
);

export const DoodleHeart = ({
    size = 24,
    rotate = 0,
    color = '#ef4444',
}: {
    size?: number;
    rotate?: number;
    color?: string;
}) => (
    <Box
        sx={{
            transform: `rotate(${rotate}deg)`,
            display: 'inline-block',
            color,
            filter: 'drop-shadow(1px 1px 1px rgba(0,0,0,0.1))',
        }}
    >
        <Box
            component="svg"
            viewBox="0 0 24 24"
            sx={{ width: size, height: size, fill: 'currentColor' }}
        >
            <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
        </Box>
    </Box>
);

export const DoodleArrow = ({
    size = 24,
    rotate = 0,
    color = '#3b82f6',
}: {
    size?: number;
    rotate?: number;
    color?: string;
}) => (
    <Box
        sx={{
            transform: `rotate(${rotate}deg)`,
            display: 'inline-block',
            color,
            filter: 'drop-shadow(1px 1px 1px rgba(0,0,0,0.1))',
        }}
    >
        <Box
            component="svg"
            viewBox="0 0 24 24"
            sx={{
                width: size,
                height: size,
                fill: 'none',
                stroke: 'currentColor',
                strokeWidth: 2.5,
                strokeLinecap: 'round',
                strokeLinejoin: 'round',
            }}
        >
            <path d="M5 12h14M12 5l7 7-7 7" />
        </Box>
    </Box>
);

export const DoodleSwirl = ({
    size = 24,
    rotate = 0,
    color = '#8b5cf6',
}: {
    size?: number;
    rotate?: number;
    color?: string;
}) => (
    <Box
        sx={{
            transform: `rotate(${rotate}deg)`,
            display: 'inline-block',
            color,
            filter: 'drop-shadow(1px 1px 1px rgba(0,0,0,0.1))',
        }}
    >
        <Box
            component="svg"
            viewBox="0 0 24 24"
            sx={{
                width: size,
                height: size,
                fill: 'none',
                stroke: 'currentColor',
                strokeWidth: 2,
                strokeLinecap: 'round',
                strokeLinejoin: 'round',
            }}
        >
            <path d="M12 2a10 10 0 1 0 10 10c0-2.5-2-4.5-4.5-4.5S13 9.5 13 12c0 1.5 1 2.5 2.5 2.5S18 13.5 18 12c0-3.5-3-6-6-6" />
        </Box>
    </Box>
);

export const DoodleCloud = ({
    size = 24,
    rotate = 0,
    color = '#64748b',
}: {
    size?: number;
    rotate?: number;
    color?: string;
}) => (
    <Box
        sx={{
            transform: `rotate(${rotate}deg)`,
            display: 'inline-block',
            color,
            filter: 'drop-shadow(1px 1px 1px rgba(0,0,0,0.1))',
        }}
    >
        <Box
            component="svg"
            viewBox="0 0 24 24"
            sx={{ width: size, height: size, fill: 'currentColor' }}
        >
            <path d="M17.5 19c-3.037 0-5.5-2.463-5.5-5.5 0-.175.011-.346.033-.513A5.485 5.485 0 0110.5 13a5.5 5.5 0 01-5.5-5.5C5 4.463 7.463 2 10.5 2c2.404 0 4.453 1.54 5.211 3.693A4.485 4.485 0 0117.5 5c2.485 0 4.5 2.015 4.5 4.5s-2.015 4.5-4.5 4.5c-.175 0-.346-.011-.513-.033A5.485 5.485 0 0115.5 15a5.5 5.5 0 015.5 5.5c0 3.037-2.463 5.5-5.5 5.5z" />
        </Box>
    </Box>
);

export const DoodleFlower = ({
    size = 24,
    rotate = 0,
    color = '#ec4899',
}: {
    size?: number;
    rotate?: number;
    color?: string;
}) => (
    <Box
        sx={{
            transform: `rotate(${rotate}deg)`,
            display: 'inline-block',
            color,
            filter: 'drop-shadow(1px 1px 1px rgba(0,0,0,0.1))',
        }}
    >
        <Box
            component="svg"
            viewBox="0 0 24 24"
            sx={{ width: size, height: size, fill: 'currentColor' }}
        >
            <path d="M12 11c-.55 0-1 .45-1 1s.45 1 1 1 1-.45 1-1-.45-1-1-1zm6-4c-.55 0-1 .45-1 1s.45 1 1 1 1-.45 1-1-.45-1-1-1zm-6-4c-.55 0-1 .45-1 1s.45 1 1 1 1-.45 1-1-.45-1-1-1zm-6 4c-.55 0-1 .45-1 1s.45 1 1 1 1-.45 1-1-.45-1-1-1zm0 10c-.55 0-1 .45-1 1s.45 1 1 1 1-.45 1-1-.45-1-1-1zm6 4c-.55 0-1 .45-1 1s.45 1 1 1 1-.45 1-1-.45-1-1-1zm6-4c-.55 0-1 .45-1 1s.45 1 1 1 1-.45 1-1-.45-1-1-1zm2-5c0-2.21-1.79-4-4-4-1.01 0-1.91.38-2.61 1.01C12.83 4.28 11.51 3 10 3c-2.21 0-4 1.79-4 4 0 1.01.38 1.91 1.01 2.61C4.28 10.17 3 11.49 3 13c0 2.21 1.79 4 4 4 1.01 0 1.91-.38 2.61-1.01.56.55 1.33.91 2.19.98.07.01.13.03.2.03.86 0 1.63-.36 2.19-.91C15.09 16.62 16.14 17 17.5 17c2.21 0 4-1.79 4-4 0-1.51-1.28-2.83-3.13-3.39.75-.72 1.13-1.62 1.13-2.61z" />
        </Box>
    </Box>
);
