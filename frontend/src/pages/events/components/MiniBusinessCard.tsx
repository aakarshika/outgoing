import { useNavigate } from 'react-router-dom';
import { VendorBusinessCard } from '@/components/ui/VendorBusinessCard';
import {
    Avatar,
    Box,
    Button as MuiButton,
    Paper,
    Typography
} from '@mui/material';
import { Media } from '@/components/ui/media';
import { Star } from 'lucide-react';

export const MiniBusinessCard = ({
    name,
    avatar,
    rating,
    service,
    type = 'vendor',
    onClick
}: {
    name: string;
    avatar?: string;
    rating: number;
    service: string;
    type?: 'host' | 'vendor';
    onClick?: () => void;
}) => {
    return (
        <Box
            onClick={onClick}
            sx={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 1,
                p: 0.75,
                pr: 1.5,
                bgcolor: '#f5f5f0',
                borderRadius: '2px',
                border: '1px solid #d1d5db',
                boxShadow: '1px 1px 3px rgba(0,0,0,0.05)',
                cursor: onClick ? 'pointer' : 'default',
                transition: 'transform 0.2s, box-shadow 0.2s',
                '&:hover': onClick ? {
                    transform: 'translateY(-1px)',
                    boxShadow: '2px 2px 6px rgba(0,0,0,0.1)'
                } : {},
                position: 'relative',
                overflow: 'hidden',
                width: 'fit-content',
                maxWidth: 240,
                flexShrink: 0,
            }}
        >
            <Avatar
                src={avatar}
                sx={{
                    width: 28,
                    height: 28,
                    border: '1px solid #ddd',
                    bgcolor: type === 'host' ? '#fee2e2' : '#f0f0f0',
                    color: type === 'host' ? '#ef4444' : '#666',
                    fontSize: '0.8rem',
                    fontWeight: 'bold'
                }}
            >
                {name?.[0]}
            </Avatar>
            <Box sx={{ flex: 1, minWidth: 0 }}>
                <Typography
                    sx={{
                        fontFamily: '"Lora", serif',
                        fontWeight: 700,
                        fontSize: '0.75rem',
                        color: '#1a1a1a',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        lineHeight: 1,
                    }}
                >
                    {name}
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.25 }}>
                    <Typography
                        sx={{
                            fontFamily: '"Permanent Marker"',
                            fontSize: '0.55rem',
                            color: type === 'host' ? '#ef4444' : '#d97706',
                            textTransform: 'uppercase',
                            lineHeight: 1,
                        }}
                    >
                        {service}
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.2, ml: 0.5 }}>
                        <Star size={8} fill="#fbbf24" stroke="#fbbf24" />
                        <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.55rem', fontWeight: 'bold' }}>
                            {rating}
                        </Typography>
                    </Box>
                </Box>
            </Box>
        </Box>
    );
};
