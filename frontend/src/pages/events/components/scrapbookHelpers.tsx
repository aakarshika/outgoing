import {
  Avatar,
  Box,
  Button as MuiButton,
  Checkbox,
  Chip,
  Collapse,
  Dialog,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  IconButton,
  Paper,
  Rating,
  Typography,
} from '@mui/material';
import {
  ArrowRight,
  ChevronDown,
  ChevronUp,
  Circle,
  Clock,
  ExternalLink,
  Info,
  Minus,
  Plus,
  Star,
  Users,
  X,
} from 'lucide-react';
import React, { useMemo, useState } from 'react';

import { Media } from '@/components/ui/media';

// --- Types ---
export type LifecycleState =
  | 'draft'
  | 'published'
  | 'event_ready'
  | 'live'
  | 'completed'
  | 'at_risk'
  | 'closed'
  | 'cancelled';

export const LIFECYCLE_LABELS: Record<LifecycleState, string> = {
  draft: 'DRAFT',
  published: 'UPCOMING',
  event_ready: 'READY',
  live: 'LIVE NOW',
  completed: 'PAST EVENT',
  at_risk: 'AT RISK',
  closed: 'CLOSED',
  cancelled: 'CANCELLED',
};

// --- Helper: format date to "X days ago" ---
export const getDaysAgo = (dateStr: string) => {
  const d = new Date(dateStr);
  const now = new Date();
  const diff = now.getTime() - d.getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  if (days <= 0) return 'today';
  if (days === 1) return 'yesterday';
  return `${days} days ago`;
};

// --- Washi Tape helper ---
export const WashiTape = ({
  color,
  rotate,
  width = 120,
}: {
  color?: string;
  rotate?: string;
  width?: number | string;
}) => (
  <Box
    sx={{
      width,
      height: 35,
      bgcolor: color || 'rgba(252, 211, 77, 0.4)',
      transform: `rotate(${rotate || '3deg'})`,
      position: 'absolute',
      top: -15,
      left: '50%',
      marginLeft: typeof width === 'number' ? -width / 2 : '-60px',
      zIndex: 20,
      opacity: 0.7,
      boxShadow: '1px 1px 2px rgba(0,0,0,0.1)',
      '&::before, &::after': {
        content: '""',
        position: 'absolute',
        top: 0,
        bottom: 0,
        width: 10,
        background:
          'linear-gradient(90deg, transparent, transparent 50%, #fff 50%, #fff)',
        backgroundSize: '4px 100%',
      },
      '&::before': { left: -2 },
      '&::after': { right: -2 },
    }}
  />
);

// --- Highlighter helper ---
export const Highlighter = ({
  children,
  color,
}: {
  children: React.ReactNode;
  color?: string;
}) => (
  <Box
    component="span"
    sx={{
      position: 'relative',
      zIndex: 1,
      px: 0.5,
      '&::after': {
        content: '""',
        position: 'absolute',
        bottom: '10%',
        left: 0,
        width: '100%',
        height: '40%',
        bgcolor: color || 'rgba(252, 211, 77, 0.5)',
        zIndex: -1,
        transform: 'rotate(-1deg)',
      },
    }}
  >
    {children}
  </Box>
);

// --- Polaroid helper ---
export const PolaroidFrame = ({
  src,
  caption,
  author,
  type = 'image',
  rotation,
}: {
  src?: string | null;
  caption?: string;
  author?: string;
  type?: 'image' | 'video';
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
          sx={{
            display: 'flex',
            justifyContent: 'flex-end',
            mt: 1,
            color: 'text.secondary',
          }}
        >
          — <Hostname username={author} mode="simple" />
        </Typography>
      )}
    </Paper>
  );
};

// --- Doodles & Stickers ---
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

const SkewedBox = ({
  children,
  rotate = 0,
  bgcolor = 'white',
}: {
  children: React.ReactNode;
  rotate?: number;
  bgcolor?: string;
}) => (
  <Box
    sx={{
      display: 'inline-block',
      bgcolor,
      p: 0.5,
      px: 1,
      transform: `rotate(${rotate}deg)`,
      boxShadow: '2px 2px 5px rgba(0,0,0,0.1)',
      border: '1px solid #eee',
    }}
  >
    {children}
  </Box>
);

// --- Hostname with specific scrapbook styles ---
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

// --- Ticket Stub Helper ---
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
  userPurchasedCount = 0,
  clearTicketformTrigger,
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
  userPurchasedCount?: number;
  clearTicketformTrigger?: number;
}) => {
  const [quantity, setQuantity] = useState(0);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [isTermsOpen, setIsTermsOpen] = useState(false);

  React.useEffect(() => {
    if (clearTicketformTrigger) {
      setQuantity(1);
    }
  }, [clearTicketformTrigger]);

  const isSoldOut =
    capacity !== null &&
    capacity !== undefined &&
    soldCount !== undefined &&
    soldCount >= capacity;
  const total = price * quantity;

  // For leaflet illusion
  const visualPages = Math.min(userPurchasedCount, 5); // show up to 5 background pages

  return (
    <Box sx={{ mb: 2 }}>
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
          zIndex: 1,
        }}
      >
        {/* purchased bookmark tag */}
        {userPurchasedCount > 0 && (
          <Box
            sx={{
              position: 'absolute',
              top: -12,
              right: 24,
              zIndex: 50,
              transform: 'rotate(2deg)',
            }}
          >
            {/* Leaflet illusion for bookmark */}
            {Array.from({ length: visualPages }).map((_, idx) => (
              <Box
                key={`bookmark-bg-${idx}`}
                sx={{
                  position: 'absolute',
                  top: -(visualPages - idx) * 2,
                  right: (visualPages - idx) * 2,
                  bgcolor: color || '#16a34a',
                  width: '100%',
                  height: '100%',
                  clipPath: 'polygon(0 0, 100% 0, 100% 100%, 50% 80%, 0 100%)',
                  boxShadow: '0px 2px 4px rgba(0,0,0,0.2)',
                  transform: `rotate(${idx % 2 === 0 ? -4 : 4}deg)`,
                  zIndex: 40 + idx,
                  opacity: 0.7 + idx * 0.05,
                }}
              />
            ))}
            <Box
              sx={{
                position: 'relative',
                bgcolor: color || '#16a34a',
                color: 'white',
                px: 1.5,
                py: 3,
                pt: 1,
                pb: 3,
                fontWeight: 'bold',
                fontFamily: '"Permanent Marker"',
                fontSize: '0.8rem',
                zIndex: 50,
                clipPath: 'polygon(0 0, 100% 0, 100% 100%, 50% 80%, 0 100%)', // Bookmark shape
                boxShadow: '0px 4px 6px rgba(0,0,0,0.2)',
                textAlign: 'center',
                minWidth: 40,
              }}
            >
              {userPurchasedCount}
              <br />
              <span style={{ fontSize: '0.6rem' }}>purchased</span>
            </Box>
          </Box>
        )}
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
            <Typography
              variant="caption"
              sx={{ fontWeight: 'bold', letterSpacing: 1 }}
            >
              ADMIT ONE
            </Typography>
            <Typography
              variant="h5"
              sx={{ fontFamily: '"Permanent Marker"', mt: 1 }}
            >
              ${price}
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
            <Typography
              variant="h6"
              sx={{ fontFamily: '"Permanent Marker"', fontSize: '1.1rem' }}
            >
              {type}
            </Typography>

            <Box sx={{ display: 'flex', alignItems: 'center', mt: 1, gap: 1 }}>
              {!isSoldOut && !disabled && (
                <>
                  <IconButton
                    size="small"
                    onClick={() => setQuantity((q) => Math.max(0, q - 1))}
                    sx={{ border: '1px solid #ddd', p: 0.5 }}
                  >
                    <Minus size={14} />
                  </IconButton>
                  <Typography
                    sx={{ fontWeight: 800, minWidth: 20, textAlign: 'center' }}
                  >
                    {quantity}
                  </Typography>
                  <IconButton
                    size="small"
                    onClick={() => setQuantity((q) => q + 1)}
                    sx={{ border: '1px solid #ddd', p: 0.5 }}
                  >
                    <Plus size={14} />
                  </IconButton>
                </>
              )}
            </Box>
          </Box>
        </Box>

        {/* Total and Actions Overlay */}
        {!isSoldOut && quantity > 0 && (
          <Box
            sx={{
              p: 1.5,
              pt: 0,
              display: 'flex',
              flexDirection: 'column',
              gap: 1,
            }}
          >
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                borderTop: '1px solid #e0d8c0',
                pt: 1,
              }}
            >
              <Typography
                variant="caption"
                sx={{
                  fontFamily: '"Caveat", cursive',
                  fontSize: '1rem',
                  fontWeight: 'bold',
                }}
              >
                Total:
              </Typography>
              <Typography
                variant="h6"
                sx={{ fontFamily: '"Permanent Marker"', color: '#333' }}
              >
                ${total.toFixed(2)}
              </Typography>
            </Box>

            <FormControlLabel
              sx={{
                '& .MuiTypography-root': {
                  fontSize: '0.65rem',
                  fontFamily: '"Permanent Marker"',
                  color: 'text.secondary',
                },
              }}
              control={
                <Checkbox
                  size="small"
                  checked={termsAccepted}
                  onChange={(e) => setTermsAccepted(e.target.checked)}
                />
              }
              label={
                <Typography variant="caption">
                  I accept the{' '}
                  <span
                    onClick={(e) => {
                      e.preventDefault();
                      setIsTermsOpen(true);
                    }}
                    style={{ textDecoration: 'underline', cursor: 'pointer' }}
                  >
                    terms & conditions
                  </span>
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
                sx={{
                  borderRadius: 1,
                  bgcolor: '#333',
                  '&:hover': { bgcolor: '#000' },
                  fontSize: '0.7rem',
                }}
              >
                {isLoading ? '...' : 'BUY TICKET'}
              </MuiButton>
              <MuiButton
                fullWidth
                variant="outlined"
                size="small"
                onClick={() => onOneClickBuy(quantity)}
                disabled={disabled || isSoldOut || isLoading || !termsAccepted}
                sx={{
                  borderRadius: 1,
                  borderColor: '#000',
                  color: '#000',
                  fontSize: '0.7rem',
                }}
              >
                Quick Buy
              </MuiButton>
            </Box>
          </Box>
        )}
      </Paper>
      <TermsDialog isOpen={isTermsOpen} onClose={() => setIsTermsOpen(false)} />
      {capacity && (
        <Box sx={{ mt: -1, mb: 2 }}>
          <CapacityInfographic
            variant="mini"
            capacity={capacity}
            filled={soldCount || 0}
          />
        </Box>
      )}
    </Box>
  );
};

// --- Grouped Tickets Stack for already purchased ones ---
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
  onManage: (ticketId?: number) => void;
  isLoading?: boolean;
  capacity?: number;
  soldCount?: number;
  disabled?: boolean;
}) => {
  const type = tickets[0]?.ticket_type || 'Ticket';
  const color = tickets[0]?.color || '#16a34a'; // default green stack
  const isSoldOut =
    capacity !== null &&
    capacity !== undefined &&
    soldCount !== undefined &&
    soldCount >= capacity;

  return (
    <Box sx={{ mb: 4, position: 'relative' }}>
      {/* Visual Stack Background Pieces */}
      {tickets.slice(0, 3).map((_, idx) => (
        <Paper
          key={`stack-bg-${idx}`}
          elevation={1}
          sx={{
            position: 'absolute',
            top: (idx + 1) * 4,
            left: (idx + 1) * 4,
            right: -(idx + 1) * 4,
            bottom: -(idx + 1) * 4,
            bgcolor: '#fff9e6',
            border: '1px solid #e0d8c0',
            borderRadius: '2px',
            opacity: 0.4 - idx * 0.1,
            zIndex: -idx,
            transform: `rotate(${((idx % 2 === 0 ? 1 : -1) * (idx + 1)) / 2}deg)`,
          }}
        />
      ))}

      <Paper
        elevation={2}
        sx={{
          display: 'flex',
          flexDirection: 'column',
          bgcolor: '#fff9e6',
          border: '1px solid #e0d8c0',
          position: 'relative',
          borderRadius: '2px',
          zIndex: 1,
        }}
      >
        {/* Purchased Banner */}
        <Box
          sx={{
            position: 'absolute',
            top: -10,
            right: 10,
            bgcolor: color,
            color: 'white',
            px: 1.5,
            py: 0.5,
            transform: 'rotate(2deg)',
            fontFamily: '"Permanent Marker"',
            fontSize: '0.8rem',
            boxShadow: 2,
            zIndex: 10,
          }}
        >
          {tickets.length} PURCHASED
        </Box>

        <Box sx={{ display: 'flex' }}>
          <Box
            sx={{
              p: 2,
              borderRight: '2px dashed #e0d8c0',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              alignItems: 'center',
              minWidth: 110,
              bgcolor: color,
              color: 'white',
              opacity: 0.9,
            }}
          >
            <Clock size={24} />
            <Typography
              variant="caption"
              sx={{ fontWeight: 'bold', mt: 0.5, textAlign: 'center' }}
            >
              VALID ENTRY
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
            <Typography
              variant="h6"
              sx={{ fontFamily: '"Permanent Marker"', fontSize: '1.2rem' }}
            >
              {type}
            </Typography>
            <Typography
              variant="caption"
              sx={{ fontFamily: '"Caveat", cursive', fontSize: '1rem' }}
            >
              Order #{tickets[0]?.id.toString().padStart(6, '0')}
            </Typography>

            <Box sx={{ display: 'flex', gap: 1, mt: 1.5 }}>
              <MuiButton
                variant="contained"
                size="small"
                fullWidth
                onClick={() => onManage(tickets[0]?.id)}
                sx={{
                  bgcolor: '#333',
                  '&:hover': { bgcolor: '#000' },
                  fontSize: '0.7rem',
                  fontFamily: '"Permanent Marker"',
                }}
              >
                MANAGE
              </MuiButton>
              {!isSoldOut && !disabled && (
                <MuiButton
                  variant="outlined"
                  size="small"
                  fullWidth
                  onClick={() => onBuyMore(1)}
                  disabled={isLoading}
                  sx={{
                    borderColor: '#333',
                    color: '#333',
                    fontSize: '0.7rem',
                    fontFamily: '"Permanent Marker"',
                  }}
                >
                  BUY MORE
                </MuiButton>
              )}
            </Box>
          </Box>
        </Box>
      </Paper>
    </Box>
  );
};

// --- Terms Dialog ---
export const TermsDialog = ({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) => (
  <Dialog open={isOpen} onClose={onClose} maxWidth="sm" fullWidth>
    <DialogTitle>
      <Typography
        variant="h5"
        sx={{ fontFamily: '"Permanent Marker"', textAlign: 'center' }}
      >
        Terms & Conditions
      </Typography>
    </DialogTitle>
    <DialogContent>
      <Typography sx={{ mb: 2, fontFamily: 'serif', fontSize: '1rem' }}>
        By purchasing this ticket, you agree to:
      </Typography>
      <ul
        style={{ fontFamily: 'serif', lineHeight: 1.6, paddingLeft: '1.5rem' }}
      >
        <li>Follow all event rules and code of conduct.</li>
        <li>Arrive at the designated time and location.</li>
        <li>Be responsible for your own safety and belongings.</li>
        <li>Allow media capture (photos/videos) for scrapbook purposes.</li>
        <li>No refunds unless the curator cancels the event.</li>
      </ul>
      <MuiButton
        fullWidth
        onClick={onClose}
        variant="contained"
        sx={{
          mt: 3,
          bgcolor: '#333',
          '&:hover': { bgcolor: '#000' },
          fontFamily: '"Permanent Marker"',
        }}
      >
        I UNDERSTAND
      </MuiButton>
    </DialogContent>
  </Dialog>
);

// --- Capacity Infographic ---
export const CapacityInfographic = ({
  capacity,
  filled,
  variant = 'default',
}: {
  capacity: number;
  filled: number;
  variant?: 'default' | 'mini';
}) => {
  const percent = Math.min(100, (filled / capacity) * 100);
  const isMini = variant === 'mini';

  return (
    <Box sx={{ width: '100%', mb: isMini ? 1 : 4 }}>
      {!isMini && (
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
          <Typography
            variant="caption"
            sx={{ fontFamily: '"Caveat", cursive', fontSize: '1.1rem' }}
          >
            crowd meter
          </Typography>
          <Typography
            variant="caption"
            sx={{ fontFamily: '"Permanent Marker"', color: 'text.secondary' }}
          >
            {filled}/{capacity}
          </Typography>
        </Box>
      )}

      <Box
        sx={{
          height: isMini ? 4 : 12,
          bgcolor: 'rgba(0,0,0,0.05)',
          borderRadius: 6,
          position: 'relative',
          overflow: 'hidden',
          border: isMini ? 'none' : '1px solid #eee',
        }}
      >
        <Box
          sx={{
            height: '100%',
            width: `${percent}%`,
            bgcolor:
              percent > 90
                ? '#ef4444'
                : percent > 70
                  ? '#f59e0b'
                  : 'primary.main',
            transition: 'width 1s ease-out',
            borderRadius: 6,
          }}
        />
      </Box>

      {isMini && (
        <Typography
          variant="caption"
          sx={{
            fontSize: '0.65rem',
            fontFamily: 'serif',
            fontStyle: 'italic',
            color: 'text.disabled',
            display: 'block',
            textAlign: 'right',
            mt: 0.5,
          }}
        >
          {capacity - filled} spots left
        </Typography>
      )}
    </Box>
  );
};

// --- Doodles & Stickers Expanded ---
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
    {/* Simple SVG Heart Doodle */}
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

// --- Cute Countdown Timer ---
export const CuteTimer = ({ targetDate }: { targetDate: string }) => {
  const [timeLeft, setTimeLeft] = useState<{
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
  } | null>(null);

  React.useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date().getTime();
      const distance = new Date(targetDate).getTime() - now;

      if (distance < 0) {
        clearInterval(timer);
        setTimeLeft(null);
      } else {
        setTimeLeft({
          days: Math.floor(distance / (1000 * 60 * 60 * 24)),
          hours: Math.floor(
            (distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60),
          ),
          minutes: Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60)),
          seconds: Math.floor((distance % (1000 * 60)) / 1000),
        });
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [targetDate]);

  if (!timeLeft) return null;

  return (
    <Box
      sx={{
        display: 'inline-flex',
        gap: 1.5,
        p: 1.5,
        bgcolor: 'rgba(59, 130, 246, 0.08)',
        borderRadius: '8px',
        border: '1.5px dashed rgba(59, 130, 246, 0.3)',
        transform: 'rotate(-1deg)',
      }}
    >
      {[
        { val: timeLeft.days, label: 'days' },
        { val: timeLeft.hours, label: 'hrs' },
        { val: timeLeft.minutes, label: 'min' },
        { val: timeLeft.seconds, label: 'sec' },
      ].map((unit, idx) => (
        <React.Fragment key={unit.label}>
          <Box sx={{ textAlign: 'center' }}>
            <Typography
              sx={{
                fontFamily: '"Permanent Marker"',
                lineHeight: 1,
                fontSize: '1.1rem',
                color: '#1e40af',
              }}
            >
              {unit.val.toString().padStart(2, '0')}
            </Typography>
            <Typography
              variant="caption"
              sx={{
                fontFamily: 'serif',
                fontSize: '0.6rem',
                fontStyle: 'italic',
                color: '#60a5fa',
                display: 'block',
              }}
            >
              {unit.label}
            </Typography>
          </Box>
          {idx < 3 && (
            <Typography
              sx={{ fontFamily: '"Permanent Marker"', color: '#60a5fa' }}
            >
              :
            </Typography>
          )}
        </React.Fragment>
      ))}
    </Box>
  );
};

// --- Business Cards ---
export const HostBusinessCard = ({ host }: { host: any }) => (
  <Paper
    elevation={2}
    sx={{
      p: 2.5,
      bgcolor: '#fffef9',
      border: '1px solid #e2e8f0',
      borderRadius: '2px',
      position: 'relative',
      overflow: 'hidden',
      transition: 'transform 0.3s ease',
      '&:hover': { transform: 'rotate(0deg) scale(1.02)' },
      transform: 'rotate(-1deg)',
      maxWidth: 340,
    }}
  >
    <Box
      sx={{
        position: 'absolute',
        top: 0,
        right: 0,
        width: 60,
        height: 60,
        bgcolor: '#fee2e2',
        transform: 'rotate(45deg) translate(0, -40px)',
        zIndex: 0,
      }}
    />

    <Box
      sx={{ display: 'flex', gap: 2, alignItems: 'flex-start', position: 'relative', zIndex: 1 }}
    >
      <Avatar
        src={host.avatar}
        sx={{
          width: 56,
          height: 56,
          border: '2px solid white',
          boxShadow: '0 2px 5px rgba(0,0,0,0.1)',
        }}
      >
        {host.username[0]}
      </Avatar>
      <Box>
        <Typography
          sx={{
            fontFamily: '"Lora", serif',
            fontWeight: 700,
            fontSize: '1.1rem',
            lineHeight: 1.2,
          }}
        >
          {host.username}
        </Typography>
        <Typography
          sx={{
            fontFamily: '"Permanent Marker"',
            color: '#ef4444',
            fontSize: '0.75rem',
            textTransform: 'uppercase',
            letterSpacing: 1,
            mt: 0.5,
          }}
        >
          Host & Curator
        </Typography>
      </Box>
    </Box>

    <Box sx={{ mt: 2.5, borderTop: '1px dashed #cbd5e1', pt: 1.5 }}>
      <Typography
        variant="caption"
        sx={{
          fontFamily: 'serif',
          fontStyle: 'italic',
          color: 'text.secondary',
          display: 'flex',
          alignItems: 'center',
          gap: 1,
        }}
      >
        <Star size={12} fill="#fbbf24" stroke="#fbbf24" /> 5.0 Rating • 24 Events Hosted
      </Typography>
    </Box>
  </Paper>
);

export const ClassifiedAd = ({
  need,
  isEligible,
  isOpportunity,
  onInquire,
}: {
  need: any;
  isEligible: boolean;
  isOpportunity: boolean;
  onInquire: (n: any) => void;
}) => (
  <Paper
    elevation={1}
    sx={{
      p: 2,
      bgcolor: isOpportunity ? '#f0fdf4' : '#fff',
      border: isOpportunity ? '1px dashed #22c55e' : '1px solid #e2e8f0',
      borderRadius: '2px',
      position: 'relative',
      transition: 'all 0.2s',
      '&:hover': {
        boxShadow: '3px 3px 10px rgba(0,0,0,0.08)',
        transform: 'translateY(-2px)',
      },
      transform: `rotate(${Math.random() * 2 - 1}deg)`,
    }}
  >
    {isOpportunity && (
      <Chip
        label="Opportunity"
        size="small"
        sx={{
          position: 'absolute',
          top: -10,
          right: 10,
          bgcolor: '#22c55e',
          color: 'white',
          fontFamily: '"Permanent Marker"',
          fontSize: '0.6rem',
          height: 20,
        }}
      />
    )}

    <Typography
      sx={{
        fontFamily: '"Permanent Marker"',
        fontSize: '0.85rem',
        textTransform: 'uppercase',
        color: isEligible ? '#2563eb' : 'text.primary',
      }}
    >
      Wanted: {need.category}
    </Typography>

    <Typography
      sx={{
        fontFamily: '"Caveat", cursive',
        fontSize: '1.1rem',
        mt: 1,
        lineHeight: 1.2,
      }}
    >
      {need.description}
    </Typography>

    <Box
      sx={{
        mt: 2,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
        <Users size={14} color="#64748b" />
        <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 'bold' }}>
          {need.status.toUpperCase()}
        </Typography>
      </Box>

      {need.status === 'open' && (
        <MuiButton
          size="small"
          onClick={() => onInquire(need)}
          sx={{
            fontFamily: '"Permanent Marker"',
            fontSize: '0.7rem',
            p: 0,
            minWidth: 0,
            color: '#333',
            '&:hover': { textDecoration: 'underline', bgcolor: 'transparent' },
          }}
        >
          INQUIRE <ArrowRight size={12} />
        </MuiButton>
      )}
    </Box>
  </Paper>
);

export const MiniBusinessCard = ({
  name,
  avatar,
  rating,
  service,
  onClick,
  type = 'vendor',
}: {
  name: string;
  avatar?: string;
  rating: number;
  service: string;
  onClick?: () => void;
  type?: 'host' | 'vendor';
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
