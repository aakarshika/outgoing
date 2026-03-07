import {
    Box,
    Button as MuiButton,
    Paper,
    Typography,
    Checkbox,
    FormControlLabel,
    Dialog,
    DialogTitle,
    DialogContent,
    IconButton,
    Divider,
    Avatar,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import React, { useEffect, useState } from 'react';
import { Minus, Plus, X, Star } from 'lucide-react';

import { Media } from '@/components/ui/media';
import { VendorBusinessCard } from '@/components/ui/VendorBusinessCard';
import { CapacityInfographic } from '@/components/ui/CapacityInfographic';
import { Hostname } from '@/components/ui/Hostname';

export const LIFECYCLE_LABELS: Record<string, string> = {
    draft: 'Draft',
    published: 'Published',
    at_risk: 'At Risk',
    postponed: 'Postponed',
    event_ready: 'Event Ready',
    live: 'Live',
    cancelled: 'Cancelled',
    completed: 'Completed',
};

// --- Scrapbook Components ---

export const DoodleStar = ({ size = 40, color = "#fbbf24", rotate = 0 }) => (
    <svg
        width={size}
        height={size}
        viewBox="0 0 100 100"
        style={{ transform: `rotate(${rotate}deg)`, fill: 'none', stroke: color, strokeWidth: 4, strokeLinecap: 'round', strokeLinejoin: 'round' }}
    >
        <path d="M50 5 L63 38 L95 38 L68 58 L78 91 L50 71 L22 91 L32 58 L5 38 L37 38 Z" />
    </svg>
);

export const DoodleHeart = ({ size = 40, color = "#f87171", rotate = 0 }) => (
    <svg
        width={size}
        height={size}
        viewBox="0 0 100 100"
        style={{ transform: `rotate(${rotate}deg)`, fill: 'none', stroke: color, strokeWidth: 4, strokeLinecap: 'round', strokeLinejoin: 'round' }}
    >
        <path d="M50 30 C50 10, 90 10, 90 40 C90 70, 50 90, 50 90 C50 90, 10 70, 10 40 C10 10, 50 10, 50 30" />
    </svg>
);

export const DoodleArrow = ({ size = 60, color = "#60a5fa", rotate = 0 }) => (
    <svg
        width={size}
        height={size}
        viewBox="0 0 100 100"
        style={{ transform: `rotate(${rotate}deg)`, fill: 'none', stroke: color, strokeWidth: 4, strokeLinecap: 'round', strokeLinejoin: 'round' }}
    >
        <path d="M10 50 Q 50 10, 90 50 M 90 50 L 70 30 M 90 50 L 70 70" />
    </svg>
);

export const DoodleSwirl = ({ size = 50, color = "#a78bfa", rotate = 0 }) => (
    <svg
        width={size}
        height={size}
        viewBox="0 0 100 100"
        style={{ transform: `rotate(${rotate}deg)`, fill: 'none', stroke: color, strokeWidth: 4, strokeLinecap: 'round', strokeLinejoin: 'round' }}
    >
        <path d="M50 50 C 70 30, 90 50, 70 70 C 50 90, 30 70, 50 50 C 70 30, 50 10, 30 30 C 10 50, 30 70, 50 50" />
    </svg>
);

export const DoodleCloud = ({ size = 50, color = "#94a3b8", rotate = 0 }) => (
    <svg
        width={size}
        height={size}
        viewBox="0 0 100 100"
        style={{ transform: `rotate(${rotate}deg)`, fill: 'none', stroke: color, strokeWidth: 3, strokeLinecap: 'round', strokeLinejoin: 'round' }}
    >
        <path d="M25 60 C 15 60, 15 45, 25 45 C 25 30, 45 30, 50 40 C 60 30, 80 30, 80 45 C 90 45, 90 60, 80 60 Z" />
    </svg>
);

export const DoodleFlower = ({ size = 40, color = "#f472b6", rotate = 0 }) => (
    <svg
        width={size}
        height={size}
        viewBox="0 0 100 100"
        style={{ transform: `rotate(${rotate}deg)`, fill: 'none', stroke: color, strokeWidth: 3, strokeLinecap: 'round', strokeLinejoin: 'round' }}
    >
        <circle cx="50" cy="50" r="10" />
        <path d="M50 40 C 60 20, 80 20, 80 40 C 80 60, 60 60, 50 50" />
        <path d="M60 50 C 80 60, 80 80, 60 80 C 40 80, 40 60, 50 50" />
        <path d="M50 60 C 40 80, 20 80, 20 60 C 20 40, 40 40, 50 50" />
        <path d="M40 50 C 20 40, 20 20, 40 20 C 60 20, 60 40, 50 50" />
    </svg>
);

export const WashiTape = ({ color = 'rgba(251, 191, 36, 0.5)', rotate = '3deg' }) => (
    <Box
        sx={{
            position: 'absolute',
            top: -10,
            left: '20%',
            width: 100,
            height: 30,
            bgcolor: color,
            backdropFilter: 'blur(2px)',
            border: '1px solid rgba(0,0,0,0.05)',
            transform: `rotate(${rotate})`,
            zIndex: 1,
            pointerEvents: 'none',
        }}
    />
);

export const Highlighter = ({
    children,
    color = 'rgba(252, 211, 77, 0.6)',
}: {
    children: React.ReactNode;
    color?: string;
}) => (
    <Box
        component="span"
        sx={{
            position: 'relative',
            display: 'inline-block',
            px: 1,
            zIndex: 1,
            '&::after': {
                content: '""',
                position: 'absolute',
                top: '50%',
                left: '-5%',
                width: '110%',
                height: '80%',
                bgcolor: color,
                transform: 'translateY(-50%) rotate(-1deg)',
                zIndex: -1,
                borderRadius: '2px',
                opacity: 0.8,
            },
        }}
    >
        {children}
    </Box>
);

export const getDaysAgo = (dateStr: string) => {
    const start = new Date(dateStr);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - start.getTime());
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    if (diffDays === 0) return 'today';
    return diffDays === 1 ? '1 day ago' : `${diffDays} days ago`;
};

export const CuteTimer = ({ targetDate }: { targetDate: string }) => {
    const [timeLeft, setTimeLeft] = useState({ d: 0, h: 0, m: 0, s: 0 });

    useEffect(() => {
        const calculate = () => {
            const now = new Date();
            const target = new Date(targetDate);
            const diff = target.getTime() - now.getTime();

            if (diff <= 0) {
                setTimeLeft({ d: 0, h: 0, m: 0, s: 0 });
                return;
            }

            setTimeLeft({
                d: Math.floor(diff / (1000 * 60 * 60 * 24)),
                h: Math.floor((diff / (1000 * 60 * 60)) % 24),
                m: Math.floor((diff / 1000 / 60) % 60),
                s: Math.floor((diff / 1000) % 60),
            });
        };
        calculate();
        const interval = setInterval(calculate, 1000);
        return () => clearInterval(interval);
    }, [targetDate]);

    const colors = [
        { bg: '#fef08a', border: '#ca8a04', text: '#854d0e' }, // Yellow
        { bg: '#fecdd3', border: '#e11d48', text: '#9f1239' }, // Pink
        { bg: '#bfdbfe', border: '#2563eb', text: '#1e3a8a' }, // Blue
        { bg: '#bbf7d0', border: '#16a34a', text: '#14532d' }, // Green
    ];

    return (
        <Box sx={{ display: 'flex', gap: 1.5, mt: 1 }}>
            {Object.entries(timeLeft).map(([unit, value], index) => {
                const color = colors[index % colors.length];
                return (
                    <Box
                        key={unit}
                        sx={{
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            animation: `pulse ${2 + index * 0.5}s infinite alternate`,
                            '@keyframes pulse': {
                                '0%': { transform: 'scale(1)' },
                                '100%': { transform: 'scale(1.05)' },
                            },
                        }}
                    >
                        <Box
                            sx={{
                                width: 38,
                                height: 38,
                                borderRadius: index % 2 === 0 ? '40% 60% 70% 30% / 40% 50% 60% 50%' : '50% 50% 30% 70% / 50% 40% 60% 50%',
                                border: `2px solid ${color.border}`,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                bgcolor: color.bg,
                                transform: `rotate(${Math.random() * 10 - 5}deg)`,
                                boxShadow: '2px 3px 0px rgba(0,0,0,0.15)',
                                position: 'relative',
                                '&::after': {
                                    content: '""',
                                    position: 'absolute',
                                    top: '10%',
                                    right: '15%',
                                    width: '20%',
                                    height: '20%',
                                    bgcolor: 'rgba(255,255,255,0.6)',
                                    borderRadius: '50%',
                                }
                            }}
                        >
                            <Typography sx={{ fontFamily: '"Fredoka One", cursive', fontSize: '1.2rem', color: color.text }}>
                                {value}
                            </Typography>
                        </Box>
                        <Typography
                            sx={{
                                fontSize: '0.65rem',
                                fontFamily: '"Caveat", cursive',
                                mt: 0.5,
                                fontWeight: 'bold',
                                color: 'text.secondary',
                                letterSpacing: 1,
                                textTransform: 'uppercase',
                            }}
                        >
                            {unit === 'd' ? 'days' : unit === 'h' ? 'hrs' : unit === 'm' ? 'min' : 'sec'}
                        </Typography>
                    </Box>
                );
            })}
        </Box>
    );
};

export const TermsDialog = ({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) => (
    <Dialog open={isOpen} onClose={onClose} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontFamily: '"Permanent Marker"', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            Terms & Conditions
            <IconButton onClick={onClose} size="small"><X size={20} /></IconButton>
        </DialogTitle>
        <DialogContent sx={{ pb: 4 }}>
            <Typography variant="body2" sx={{ mb: 2 }}>
                1. No refunds unless event is cancelled or ticket is flexible. <br />
                2. Identification card matching the purchasing profile may be verified at the venue. <br />
                3. At least one person in the group must be 18+ and take responsibility for minors. <br />
                4. Admission is subject to security check at the venue entrance.
            </Typography>
            <MuiButton fullWidth variant="contained" onClick={onClose} sx={{ borderRadius: 2, bgcolor: '#000' }}>
                Got it
            </MuiButton>
        </DialogContent>
    </Dialog>
);

export const PolaroidFrame = ({
    src,
    type = 'image',
    caption,
    author,
    rotation,
}: {
    src: string | null;
    type?: 'image' | 'video';
    caption?: string;
    author?: string;
    rotation?: number;
}) => {
    const rot = rotation ?? Math.random() * 8 - 4;

    return (
        <Paper
            elevation={3}
            sx={{
                p: 1.5,
                pb: 6,
                bgcolor: 'white',
                transform: `rotate(${rot}deg)`,
                transition: 'transform 0.3s ease',
                '&:hover': { transform: 'scale(1.05) rotate(0deg)', zIndex: 10 },
                maxWidth: '100%',
                border: '1px solid #efefef',
                position: 'relative',
            }}
        >
            <Box
                sx={{
                    aspectRatio: '1/1',
                    bgcolor: '#f0f0f0',
                    overflow: 'hidden',
                    position: 'relative',
                }}
            >
                {type === 'video' ? (
                    <Media
                        type="video"
                        src={src || undefined}
                        controls
                        className="w-full h-full object-cover"
                    />
                ) : (
                    <Media src={src || undefined} className="w-full h-full object-cover" />
                )}
            </Box>
            {caption && (
                <Typography
                    sx={{
                        fontFamily: '"Permanent Marker", cursive',
                        fontSize: '1rem',
                        mt: 0,
                        textAlign: 'center',
                        lineClamp: 2,
                        display: '-webkit-box',
                        overflow: 'hidden',
                        WebkitBoxOrient: 'vertical',
                    }}
                >
                    {caption}
                </Typography>
            )}
            {author && (
                <Typography
                    variant="caption"
                    sx={{ display: 'flex', justifyContent: 'flex-end', mt: 1, color: 'text.secondary' }}
                >
                    — <Hostname username={author} mode="simple" />
                </Typography>
            )}
        </Paper>
    );
};

export const TicketStub = ({
    type,
    price,
    color,
    capacity,
    soldCount,
    onBuy,
    onOneClickBuy,
    isLoading,
    disabled,
}: {
    type: string;
    price: number;
    color?: string;
    capacity?: number | null;
    soldCount?: number;
    onBuy: (quantity: number) => void;
    onOneClickBuy: (quantity: number) => void;
    isLoading?: boolean;
    disabled?: boolean;
}) => {
    const [quantity, setQuantity] = useState(0);
    const [termsAccepted, setTermsAccepted] = useState(false);
    const [isTermsOpen, setIsTermsOpen] = useState(false);

    const isSoldOut = capacity !== null && capacity !== undefined && soldCount !== undefined && soldCount >= capacity;
    const total = (price * quantity);

    return (
        <>
            <Paper
                elevation={2}
                sx={{
                    display: 'flex',
                    my: 1,
                    flexDirection: 'column',
                    position: 'relative',
                    bgcolor: '#fff9e6',
                    border: '1px solid #e0d8c0',
                    transform: 'rotate(-0.5deg)',
                    overflow: 'visible',
                    opacity: isSoldOut ? 0.8 : 1,
                }}
            >
                {isSoldOut && (
                    <Box
                        sx={{
                            position: 'absolute',
                            top: '50%',
                            right: '0%',
                            transform: 'rotate(-10deg)',
                            bgcolor: '#ef4444',
                            color: 'white',
                            px: 2,
                            py: 0.5,
                            border: '3px solid #fff',
                            boxShadow: '0 4px 10px rgba(0,0,0,0.3)',
                            fontFamily: '"Permanent Marker"',
                            fontSize: '1.4rem',
                            whiteSpace: 'nowrap',
                            zIndex: 50,
                            pointerEvents: 'none',
                            letterSpacing: 1,
                        }}
                    >
                        FULL HOUSE
                    </Box>
                )}
                <Box sx={{ display: 'flex' }}>
                    <Box
                        sx={{
                            p: 2,
                            borderRight: '2px dashed #e0d8c0',
                            display: 'flex',
                            flexDirection: 'column',
                            justifyContent: 'center',
                            alignItems: 'center',
                            minWidth: 100,
                            bgcolor: color || '#555',
                            color: 'white',
                        }}
                    >
                        <Typography variant="caption" sx={{ fontWeight: 'bold', letterSpacing: 1 }}>ADMIT ONE</Typography>
                        <Typography variant="h5" sx={{ fontFamily: '"Permanent Marker"', mt: 1 }}>${price}</Typography>
                    </Box>
                    <Box sx={{ p: 2, flexGrow: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                        <Typography variant="h6" sx={{ fontFamily: '"Permanent Marker"', fontSize: '1.1rem' }}>{type}</Typography>

                        <Box sx={{ display: 'flex', alignItems: 'center', mt: 1, gap: 1 }}>
                            <Typography variant="h5" sx={{ fontFamily: '"Permanent Marker"', fontSize: '0.7rem' }}></Typography>
                            {(!isSoldOut && !disabled) && (
                                <>
                                    <IconButton
                                        size="small"
                                        onClick={() => setQuantity(q => Math.max(0, q - 1))}
                                        sx={{ border: '1px solid #ddd', p: 0.5 }}
                                    ><Minus size={14} /></IconButton>
                                    <Typography sx={{ fontWeight: 800, minWidth: 20, textAlign: 'center' }}>{quantity}</Typography>
                                    <IconButton
                                        size="small"
                                        onClick={() => setQuantity(q => Math.min(10, q + 1))}
                                        sx={{ border: '1px solid #ddd', p: 0.5 }}
                                    ><Plus size={14} /></IconButton>
                                    <Typography variant="caption" sx={{ ml: 'auto', fontWeight: 700 }}>Total: ${total}</Typography>
                                </>)}
                        </Box>
                    </Box>
                </Box>

                {total > 0 && (<Box sx={{ px: 2, pb: 2 }}>
                    <Divider sx={{ mb: 1, borderStyle: 'dashed' }} />
                    <FormControlLabel
                        control={<Checkbox size="small" checked={termsAccepted} onChange={e => setTermsAccepted(e.target.checked)} />}
                        label={
                            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                                I accept the <span
                                    style={{ textDecoration: 'underline', cursor: 'pointer', color: '#000' }}
                                    onClick={(e) => { e.preventDefault(); setIsTermsOpen(true); }}
                                >terms & conditions</span>
                            </Typography>
                        }
                    />

                    <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
                        <MuiButton
                            fullWidth
                            variant="contained"
                            size="small"
                            onClick={() => onBuy(quantity)}
                            disabled={disabled || isSoldOut || isLoading || !termsAccepted}
                            sx={{ borderRadius: 1, bgcolor: '#333', '&:hover': { bgcolor: '#000' }, fontSize: '0.7rem' }}
                        >
                            {isLoading ? '...' : 'BUY TICKET'}
                        </MuiButton>
                        <MuiButton
                            fullWidth
                            variant="outlined"
                            size="small"
                            onClick={() => onOneClickBuy(quantity)}
                            disabled={disabled || isSoldOut || isLoading || !termsAccepted}
                            sx={{ borderRadius: 1, borderColor: '#000', color: '#000', fontSize: '0.7rem' }}
                        >
                            Quick Buy
                        </MuiButton>
                    </Box>
                </Box>)}
            </Paper>
            <TermsDialog isOpen={isTermsOpen} onClose={() => setIsTermsOpen(false)} />
            {capacity && (
                <Box sx={{ mt: -1, mb: 2 }}>
                    <CapacityInfographic variant="mini" capacity={capacity} filled={soldCount || 0} />
                </Box>
            )}
        </>
    );
};

export const PurchasedTicketStack = ({
    tickets,
    onBuyMore,
    onManage,
    isLoading,
    capacity,
    soldCount,
    disabled,
}: {
    tickets: any[];
    onBuyMore: (quantity: number) => void;
    onManage: (ticketId: number) => void;
    isLoading?: boolean;
    capacity?: number | null;
    soldCount?: number;
    disabled?: boolean;
}) => {
    if (tickets.length === 0) return null;
    const isSoldOut = capacity !== null && capacity !== undefined && soldCount !== undefined && soldCount >= capacity;

    return (
        <Box sx={{ position: 'relative', pt: tickets.length > 1 ? (tickets.length - 1) * 2 : 0 }}>
            {tickets.map((t, idx) => {
                const isTop = idx === Math.max(tickets.length - 1, 0);
                const offset = (-(idx + 4)) * 8;

                return (
                    <Box key={t.id} sx={{
                        position: isTop ? 'relative' : 'absolute',
                        top: isTop ? 0 : -offset,
                        left: isTop ? 0 : offset / 2,
                        width: '100%',
                        zIndex: idx
                    }}>
                        <Paper
                            elevation={isTop ? 1 : 1}
                            onClick={() => onManage(t.id)}
                            sx={{
                                position: 'relative',
                                display: 'flex',
                                width: '100%',
                                bgcolor: '#fff9e6',
                                border: '1px solid #e0d8c0',
                                transform: `rotate(${isTop ? 1 : (idx % 3 === 0 ? -1 : 1)}deg)`,
                                overflow: 'visible',
                                cursor: 'pointer',
                                transition: 'transform 0.2s',
                                opacity: isTop ? 1 : 0.8,
                                '&:hover': isTop ? { transform: 'rotate(0deg)', zIndex: 100 } : {},
                                visibility: !isTop && idx < tickets.length - 5 ? 'hidden' : 'visible'
                            }}
                        >
                            {isSoldOut && (
                                <Box
                                    sx={{
                                        position: 'absolute',
                                        top: '50%',
                                        right: '0%',
                                        transform: 'rotate(-10deg)',
                                        bgcolor: '#ef4444',
                                        color: 'white',
                                        px: 2,
                                        py: 0.5,
                                        border: '3px solid #fff',
                                        boxShadow: '0 4px 10px rgba(0,0,0,0.3)',
                                        fontFamily: '"Permanent Marker"',
                                        fontSize: '1.4rem',
                                        whiteSpace: 'nowrap',
                                        zIndex: 50,
                                        pointerEvents: 'none',
                                        letterSpacing: 1,
                                    }}
                                >
                                    FULL HOUSE
                                </Box>
                            )}
                            <Box
                                sx={{
                                    p: 2,
                                    borderRight: '2px dashed #e0d8c0',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    justifyContent: 'center',
                                    alignItems: 'center',
                                    minWidth: 100,
                                    bgcolor: t.color || '#22c55e',
                                    color: 'white',
                                }}
                            >
                                <Typography variant="caption" sx={{ fontWeight: 'bold', letterSpacing: 1 }}>
                                    {t.status === 'cancelled' ? 'void' : 'PAID'}
                                </Typography>
                                <Typography variant="h6" sx={{ fontFamily: '"Permanent Marker"', mt: 1 }}>
                                    ${parseFloat(t.price_paid).toFixed(2)}
                                </Typography>
                            </Box>
                            <Box
                                sx={{
                                    p: 2,
                                    flexGrow: 1,
                                    display: 'flex',
                                    flexDirection: 'column',
                                    justifyContent: 'center',
                                }}
                            >
                                <Typography variant="h6" sx={{ fontFamily: '"Permanent Marker"', fontSize: '1.2rem' }}>
                                    {t.ticket_type} Pass
                                </Typography>
                                <Typography variant="body2" sx={{ fontWeight: 'bold', mt: 0.5 }}>
                                    Guest: {t.guest_name || 'Self'} {tickets.length > 1 && isTop && `(+${tickets.length - 1} more)`}
                                </Typography>

                                {isTop && (
                                    <MuiButton
                                        variant="outlined"
                                        size="small"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            onBuyMore(1);
                                        }}
                                        disabled={disabled || isSoldOut || isLoading}
                                        sx={{
                                            mt: 1.5,
                                            borderRadius: 0,
                                            border: '1px solid #333',
                                            color: '#333',
                                            alignSelf: 'flex-start',
                                            '&:hover': { border: '1px solid #000', bgcolor: 'rgba(0,0,0,0.05)' },
                                        }}
                                    >
                                        BUY MORE
                                    </MuiButton>
                                )}
                            </Box>
                        </Paper>
                        {isTop && capacity && (
                            <Box sx={{ mt: 0 }}>
                                <CapacityInfographic
                                    variant="mini"
                                    capacity={capacity}
                                    filled={soldCount || 0}
                                />
                            </Box>
                        )}
                    </Box>
                );
            })}
        </Box>
    );
};

export const ClassifiedAd = ({
    need,
    onInquire,
    isEligible = false,
    isOpportunity = false,
}: {
    need: any;
    onInquire: (n: any) => void;
    isEligible?: boolean;
    isOpportunity?: boolean;
}) => {
    const navigate = useNavigate();
    const assigned_vendor = need.applications.find((app: any) => app.status === 'accepted');

    return (
        <Box sx={{ position: 'relative', width: '100%' }}>
            <Paper
                elevation={0}
                sx={{
                    p: 3,
                    mb: 2,
                    bgcolor: '#fdfdfd',
                    backgroundImage:
                        'linear-gradient(to right, rgba(0,0,0,0.03) 1px, transparent 1px)',
                    border: '1px solid #333',
                    outline: '3px solid #fdfdfd',
                    position: 'relative',
                    opacity: need.status === 'filled' ? 0.3 : 1,
                    filter: need.status === 'filled' ? 'grayscale(0.8)' : 'none',
                    transform: `rotate(${(Math.random() * 2 - 1).toFixed(1)}deg)`,
                    pointerEvents: need.status === 'filled' ? 'none' : 'auto',
                    transition: 'all 0.3s ease',
                }}
            >
                <Typography
                    sx={{
                        fontFamily: '"Playfair Display", serif',
                        fontWeight: 600,
                        textTransform: 'capitalize',
                        borderBottom: '2px solid #333',
                        mb: 1,
                        fontSize: '1rem',
                        color: need.status === 'filled' ? '#999' : 'inherit',
                    }}
                >
                    <span style={{ fontFamily: '"Playfair Display", serif', fontWeight: 900, textTransform: 'uppercase' }}>HELP WANTED: </span>{need.title}
                </Typography>
                <Typography
                    variant="body2"
                    sx={{ fontFamily: 'serif', fontStyle: 'italic', mb: 2, lineHeight: 1.4 }}
                >
                    {need.description}
                </Typography>
                <Box
                    sx={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'flex-end',
                        mt: 0,
                    }}
                >
                    <Box>
                        <Typography sx={{ fontSize: '0.7rem', color: '#666', mb: 0.5 }}>
                            Criticality: {need.criticality}
                        </Typography>
                        <Typography sx={{ fontSize: '1rem', fontWeight: 'bold' }}>
                            Budget: ${need.budget_max || '???'}
                        </Typography>
                    </Box>
                    {need.status === 'open' &&
                        (isEligible ? (
                            <MuiButton
                                variant="outlined"
                                size="small"
                                onClick={() => onInquire(need)}
                                sx={{
                                    borderRadius: 0,
                                    borderColor: '#333',
                                    color: '#333',
                                    fontWeight: 'bold',
                                    whiteSpace: 'nowrap',
                                    '&:hover': { bgcolor: '#333', color: '#fff' },
                                }}
                            >
                                SEND INQUIRY →
                            </MuiButton>
                        ) : isOpportunity ? (
                            <MuiButton
                                variant="outlined"
                                size="small"
                                onClick={() => navigate(`/vendors/create?category=${need.category}`)}
                                sx={{
                                    borderRadius: 0,
                                    borderColor: '#001708ff',
                                    color: '#001708ff',
                                    fontWeight: 'bold',
                                    whiteSpace: 'nowrap',
                                    '&:hover': { bgcolor: '#16a34a', color: '#fff' },
                                }}
                            >
                                CREATE SERVICE →
                            </MuiButton>
                        ) : null)}
                </Box>
            </Paper>

            {need.status === 'open' && isOpportunity && (
                <Box
                    sx={{
                        position: 'absolute',
                        top: 12,
                        right: 12,
                        px: 1.5,
                        py: 0.5,
                        border: '2px solid rgba(22, 163, 74, 0.6)',
                        borderRadius: '2px',
                        transform: 'rotate(3deg)',
                        pointerEvents: 'none',
                        zIndex: 2,
                    }}
                >
                    <Typography
                        sx={{
                            fontFamily: '"Permanent Marker", cursive',
                            fontSize: '0.65rem',
                            color: 'rgba(22, 163, 74, 0.8)',
                            letterSpacing: 2,
                            textTransform: 'uppercase',
                        }}
                    >
                        OPPORTUNITY
                    </Typography>
                </Box>
            )}

            {need.status === 'filled' && (
                <Box
                    sx={{
                        position: 'absolute',
                        inset: 0,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        zIndex: 10,
                        pointerEvents: 'none',
                    }}
                >
                    <Box
                        sx={{
                            transform: 'rotate(-3deg) scale(0.95)',
                            pointerEvents: 'auto',
                            filter: 'drop-shadow(5px 5px 15px rgba(0,0,0,0.2))',
                        }}
                    >
                        <VendorBusinessCard
                            vendor={{
                                vendor_name: assigned_vendor?.vendor_name || 'Assigned Vendor',
                                category: need.category,
                                avg_rating: 4.8,
                                event_count: 12,
                            }}
                            onClick={() => {
                                if (assigned_vendor.service) {
                                    navigate(`/services/${assigned_vendor.service}`);
                                }
                            }}
                        />
                        <Box
                            sx={{
                                position: 'absolute',
                                top: -10,
                                left: '50%',
                                transform: 'translateX(-50%) rotate(5deg)',
                                width: 50,
                                height: 18,
                                bgcolor: 'rgba(59, 130, 246, 0.5)',
                                borderRadius: '1px',
                                boxShadow: '0 1px 2px rgba(0,0,0,0.1)',
                            }}
                        />
                    </Box>
                </Box>
            )}
        </Box>
    );
};

export const HostBusinessCard = ({
    host,
}: {
    host: any;
}) => {
    return (
        <Box
            sx={{
                width: '100%',
                maxWidth: 320,
                aspectRatio: '1.75 / 1',
                bgcolor: '#f5f5f0', // Linen/Off-white (matches Vendor card)
                backgroundImage:
                    'repeating-linear-gradient(45deg, rgba(0,0,0,0.01) 0px, rgba(0,0,0,0.01) 2px, transparent 2px, transparent 4px)',
                border: '1px solid #d1d5db',
                boxShadow: '3px 3px 10px rgba(0,0,0,0.1)',
                position: 'relative',
                p: 2.5,
                mb: 2, // Match ClassifiedAd margin
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                transform: 'rotate(-3deg) scale(0.95)', // Match "filled" ad positioning
                transition: 'transform 0.3s ease, box-shadow 0.3s ease',
                '&:hover': {
                    transform: 'rotate(0deg) scale(1) translateY(-5px)',
                    boxShadow: '5px 5px 15px rgba(0,0,0,0.15)',
                },
                '&::before': {
                    content: '""',
                    position: 'absolute',
                    inset: 4,
                    border: '1px solid rgba(0,0,0,0.05)',
                    pointerEvents: 'none',
                },
            }}
        >
            <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                <Box
                    sx={{
                        width: 60,
                        height: 60,
                        borderRadius: '50%',
                        bgcolor: '#ddd',
                        flexShrink: 0,
                        border: '1px solid #ccc',
                        overflow: 'hidden',
                        boxShadow: 'inset 0 0 5px rgba(0,0,0,0.1)',
                        position: 'relative',
                    }}
                >
                    {host.avatar ? (
                        <Media src={host.avatar} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                        <Box sx={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#999', fontSize: '1.5rem' }}>
                            👤
                        </Box>
                    )}
                </Box>
                <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography
                        sx={{
                            fontFamily: '"Lora", serif',
                            fontWeight: 700,
                            fontSize: '1.1rem',
                            color: '#1a1a1a',
                            lineHeight: 1.2,
                            mb: 0.5,
                            letterSpacing: '0.5px',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                        }}
                    >
                        {host.username}
                    </Typography>
                    <Typography
                        sx={{
                            fontFamily: '"Permanent Marker"',
                            fontSize: '0.75rem',
                            color: '#ef4444',
                            textTransform: 'uppercase',
                            mb: 1,
                        }}
                    >
                        Host & Curator
                    </Typography>
                    <Typography
                        sx={{ fontSize: '0.6rem', color: '#888', fontFamily: 'monospace' }}
                    >
                        JOI. 2026 - 11 EVENTS
                    </Typography>
                </Box>
            </Box>

            <Box
                sx={{
                    mt: 'auto',
                    borderTop: '1px solid rgba(0,0,0,0.05)',
                    pt: 1,
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-end',
                }}
            >
                <Box>
                    <Typography sx={{ fontSize: '0.65rem', color: '#888', fontStyle: 'italic' }}>
                        Verified Outgoing™ Host
                    </Typography>
                    <Box sx={{ display: 'flex', color: '#fbbf24', fontSize: '1rem' }}>
                        {'★'.repeat(5)}
                    </Box>
                </Box>
                <Box
                    sx={{
                        width: 30,
                        height: 30,
                        borderRadius: '50%',
                        border: '1px solid rgba(0,0,0,0.1)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        opacity: 0.4,
                        background: 'radial-gradient(circle, transparent 70%, rgba(0,0,0,0.05) 100%)',
                    }}
                >
                    <Typography
                        sx={{ fontSize: '0.45rem', fontWeight: 'bold', textAlign: 'center', color: '#ef4444' }}
                    >
                        HOST
                        <br />
                        SEAL
                    </Typography>
                </Box>
            </Box>
        </Box>
    );
};

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
