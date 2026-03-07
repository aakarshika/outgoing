import {
    Box,
    Typography,
    Popover,
    Chip,
    Stack,
} from '@mui/material';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserAvatar } from './UserAvatar';
import { Star } from 'lucide-react';

interface HostnameProps {
    username: string;
    avatarSrc?: string;
    datetime?: string;
    mode?: 'simple' | 'normal' | 'bigger';
    userData?: {
        full_name?: string;
        roles?: string[];
        rating?: number;
        joinedDate?: string;
        stats?: {
            going?: number;
            hosting?: number;
            providing?: number;
        };
    };
    className?: string;
}

export const Hostname = ({
    username,
    avatarSrc,
    datetime,
    mode = 'normal',
    userData = {
        full_name: username,
        roles: ['goer'],
        rating: 4.5,
        joinedDate: '2022',
        stats: { going: 5, hosting: 2, providing: 1 }
    },
    className
}: HostnameProps) => {
    const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
    const navigate = useNavigate();

    const handleOpen = (event: React.MouseEvent<HTMLElement>) => {
        event.stopPropagation();
        setAnchorEl(event.currentTarget);
    };

    const handleClose = () => {
        setAnchorEl(null);
    };

    const handleCardClick = () => {
        navigate(`/user/${username}`);
        handleClose();
    };

    const isOpen = Boolean(anchorEl);

    return (
        <>
            <Box
                onClick={handleOpen}
                sx={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    cursor: 'pointer',
                    borderRadius: 1,
                    '&:hover': {
                        opacity: 0.8
                    }
                }}
                className={className}
            >
                {mode === 'simple' && (
                    <Typography
                        sx={{
                            fontFamily: '"Permanent Marker", cursive',
                            fontSize: 'inherit',
                            color: 'inherit'
                        }}
                    >
                        @{username}
                    </Typography>
                )}

                {mode === 'normal' && (
                    <Stack direction="row" spacing={1} alignItems="center">
                        <UserAvatar src={avatarSrc} username={username} size="sm" />
                        <Box>
                            <Typography
                                sx={{
                                    fontFamily: '"Permanent Marker", cursive',
                                    fontWeight: 'bold',
                                    fontSize: '0.9rem',
                                    lineHeight: 1
                                }}
                            >
                                @{username}
                            </Typography>
                            {datetime && (
                                <Typography
                                    variant="caption"
                                    sx={{
                                        fontFamily: '"Caveat", cursive',
                                        fontSize: '0.8rem',
                                        color: 'text.secondary',
                                        display: 'block'
                                    }}
                                >
                                    {datetime}
                                </Typography>
                            )}
                        </Box>
                    </Stack>
                )}

                {mode === 'bigger' && (
                    <Stack direction="row" spacing={2} alignItems="center">
                        <UserAvatar src={avatarSrc} username={username} size="md" />
                        <Box>
                            <Typography
                                sx={{
                                    fontFamily: '"Permanent Marker", cursive',
                                    fontSize: '1.2rem',
                                    lineHeight: 1.1
                                }}
                            >
                                @{username}
                            </Typography>
                            {datetime && (
                                <Typography
                                    variant="caption"
                                    sx={{
                                        fontFamily: '"Caveat", cursive',
                                        fontSize: '1rem',
                                        color: 'text.secondary'
                                    }}
                                >
                                    {datetime}
                                </Typography>
                            )}
                        </Box>
                    </Stack>
                )}
            </Box>

            <Popover
                open={isOpen}
                anchorEl={anchorEl}
                onClose={handleClose}
                anchorOrigin={{
                    vertical: 'bottom',
                    horizontal: 'left',
                }}
                transformOrigin={{
                    vertical: 'top',
                    horizontal: 'left',
                }}
                PaperProps={{
                    sx: {
                        mt: 1,
                        p: 0,
                        overflow: 'visible',
                        borderRadius: '12px',
                        border: '2px solid #000',
                        boxShadow: '8px 8px 0px rgba(0,0,0,0.1)',
                        minWidth: '280px',
                        zIndex: 3000, // Ensure it's above drawers (2500) and other overlays
                        '&::before': {
                            content: '""',
                            position: 'absolute',
                            top: -8,
                            left: 20,
                            width: 14,
                            height: 14,
                            bgcolor: 'background.paper',
                            borderTop: '2px solid #000',
                            borderLeft: '2px solid #000',
                            transform: 'rotate(45deg)',
                            zIndex: 1
                        }
                    }
                }}
            >
                <Box
                    onClick={handleCardClick}
                    sx={{
                        p: 3,
                        cursor: 'pointer',
                        bgcolor: '#fffef9',
                        borderRadius: '10px',
                        position: 'relative'
                    }}
                >
                    <Stack spacing={2}>
                        {/* Header: Roles */}
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                            {(userData.roles || ['goer']).map((role) => (
                                <Chip
                                    key={role}
                                    label={`${role.charAt(0).toUpperCase() + role.slice(1)} Soul`}
                                    size="small"
                                    sx={{
                                        fontFamily: '"Caveat", cursive',
                                        fontWeight: 700,
                                        bgcolor: role === 'host' ? '#fee2e2' : role === 'provider' ? '#e1effe' : '#fef3c7',
                                        color: role === 'host' ? '#b91c1c' : role === 'provider' ? '#1e429f' : '#92400e',
                                        border: '1px solid currentColor',
                                    }}
                                />
                            ))}
                        </Box>

                        {/* Profile Info */}
                        <Stack direction="row" spacing={3} alignItems="center">
                            <Box sx={{ position: 'relative' }}>
                                <Box
                                    sx={{
                                        position: 'absolute',
                                        inset: -4,
                                        borderRadius: '50%',
                                        background: 'linear-gradient(45deg, #f06, #4a90e2)',
                                        zIndex: 0
                                    }}
                                />
                                <UserAvatar
                                    src={avatarSrc}
                                    username={username}
                                    size="lg"
                                    className="border-2 border-white relative z-10"
                                />
                            </Box>
                            <Box>
                                <Typography
                                    sx={{
                                        fontFamily: '"Permanent Marker", cursive',
                                        fontSize: '1.4rem',
                                        lineHeight: 1.1
                                    }}
                                >
                                    {userData.full_name || username}
                                </Typography>
                                <Typography
                                    sx={{
                                        fontFamily: '"Caveat", cursive',
                                        fontSize: '1.1rem',
                                        color: 'text.secondary'
                                    }}
                                >
                                    @{username}
                                </Typography>
                                {userData.joinedDate && (
                                    <Typography
                                        sx={{
                                            fontFamily: '"Caveat", cursive',
                                            fontSize: '0.9rem',
                                            color: 'text.secondary',
                                            mt: 0.5
                                        }}
                                    >
                                        joi. {userData.joinedDate}
                                    </Typography>
                                )}
                            </Box>
                        </Stack>

                        {/* Stats & Rating */}
                        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ pt: 1 }}>
                            <Stack direction="row" spacing={2}>
                                <Box sx={{ textAlign: 'center' }}>
                                    <Typography sx={{ fontFamily: '"Permanent Marker"', fontSize: '1.1rem' }}>
                                        {userData.stats?.going || 0}
                                    </Typography>
                                    <Typography sx={{ fontFamily: '"Caveat"', fontSize: '0.8rem', color: 'text.secondary' }}>
                                        Going
                                    </Typography>
                                </Box>
                                <Box sx={{ textAlign: 'center' }}>
                                    <Typography sx={{ fontFamily: '"Permanent Marker"', fontSize: '1.1rem' }}>
                                        {userData.stats?.hosting || 0}
                                    </Typography>
                                    <Typography sx={{ fontFamily: '"Caveat"', fontSize: '0.8rem', color: 'text.secondary' }}>
                                        Hosting
                                    </Typography>
                                </Box>
                                <Box sx={{ textAlign: 'center' }}>
                                    <Typography sx={{ fontFamily: '"Permanent Marker"', fontSize: '1.1rem' }}>
                                        {userData.stats?.providing || 0}
                                    </Typography>
                                    <Typography sx={{ fontFamily: '"Caveat"', fontSize: '0.8rem', color: 'text.secondary' }}>
                                        Providing
                                    </Typography>
                                </Box>
                            </Stack>

                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                <Star size={16} fill="#f59e0b" color="#f59e0b" />
                                <Typography sx={{ fontFamily: '"Permanent Marker"', fontSize: '1.1rem' }}>
                                    {userData.rating || 0}
                                </Typography>
                            </Box>
                        </Stack>
                    </Stack>
                </Box>
            </Popover>
        </>
    );
};
