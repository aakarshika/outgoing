import { Typography } from '@mui/material';
import { SkewedBox } from './SkewedBox';

export const Hostname = ({
    username,
    mode = 'default',
}: {
    username: string;
    mode?: 'default' | 'simple';
}) => {
    if (mode === 'simple') {
        return (
            <Typography
                component="span"
                sx={{
                    fontFamily: '"Caveat", cursive',
                    fontWeight: 'bold',
                    fontSize: '0.9rem',
                    color: 'text.primary',
                }}
            >
                @{username}
            </Typography>
        );
    }

    return (
        <SkewedBox rotate={-1} bgcolor="#fffef0">
            <Typography
                sx={{
                    fontFamily: '"Caveat", cursive',
                    fontWeight: 'bold',
                    color: '#b45309',
                    fontSize: '1.1rem',
                }}
            >
                @{username}
            </Typography>
        </SkewedBox>
    );
};
