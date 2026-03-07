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
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import React, { useEffect, useState } from 'react';
import { Minus, Plus, X } from 'lucide-react';

import { Media } from '@/components/ui/media';
import { VendorBusinessCard } from '@/components/ui/VendorBusinessCard';
import { CapacityInfographic } from '@/components/ui/CapacityInfographic';

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
                    sx={{ display: 'block', textAlign: 'right', mt: 1, color: 'text.secondary' }}
                >
                    — @{author}
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
