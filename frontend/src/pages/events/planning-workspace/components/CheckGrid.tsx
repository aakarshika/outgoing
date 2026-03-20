import { Box, Collapse, Typography } from '@mui/material';
import { keyframes } from '@mui/material/styles';
import { useEffect, useState, type ComponentType } from 'react';
import { ChevronDown } from 'lucide-react';

type PlanningCheckGridProps = {
  whenWhereSub: string;
  ticketsTiers: number;
  ticketsSold: number;
  /** Total seats when every tier has a cap (sum); null if any tier is unlimited or there are no tiers. */
  totalCapacity: number | null;
  /** Effective overall minimum attendees (explicit or 20% of capped capacity). */
  minimumParticipants: number;
  openNeedsCount: number;
  needsSub: string;
  salesNotDone: boolean;
  setIsQuickCreateOpen: (open: boolean) => void;
  renderWhenWhereSection?: ComponentType;
  renderTicketsSection?: ComponentType;
  renderNeedsSection?: ComponentType;
  renderGuestListSection?: ComponentType;
  /** Used to keep URL + UI in sync for the guest-list expanded view. */
  onGuestListExpandedChange?: (expanded: boolean) => void;
  routeExpandedCard?: 'whenWhere' | 'tickets' | 'needs' | 'guestList' | null;
  routeFlashToken?: number;
};

export function PlanningCheckGrid({
  whenWhereSub,
  ticketsTiers,
  ticketsSold,
  totalCapacity,
  minimumParticipants,
  openNeedsCount,
  needsSub,
  salesNotDone,
  setIsQuickCreateOpen,
  renderWhenWhereSection,
  renderTicketsSection,
  renderNeedsSection,
  renderGuestListSection,
  onGuestListExpandedChange,
  routeExpandedCard = null,
  routeFlashToken = 0,
}: PlanningCheckGridProps) {
  const [expandedCard, setExpandedCard] = useState<'whenWhere' | 'tickets' | 'needs' | 'guestList' | null>(null);
  const [flashCard, setFlashCard] = useState<'whenWhere' | 'tickets' | 'needs' | 'guestList' | null>(null);
  const scrollMarginTopPx = 220;
  const isMinimumParticipantsReached =
    minimumParticipants <= 0 || ticketsSold >= minimumParticipants;
  const isTicketsCardDone = ticketsTiers > 0 && isMinimumParticipantsReached;

  const flashAnimation = keyframes`
    0% { box-shadow: 0 0 0 0 rgba(216, 90, 48, 0); transform: translateY(0); }
    30% { box-shadow: 0 0 0 4px rgba(216, 90, 48, 0.18); transform: translateY(-1px); }
    70% { box-shadow: 0 0 0 2px rgba(216, 90, 48, 0.10); transform: translateY(0); }
    100% { box-shadow: 0 0 0 0 rgba(216, 90, 48, 0); transform: translateY(0); }
  `;

  useEffect(() => {
    if (!routeFlashToken) return;

    setExpandedCard(routeExpandedCard);

    if (!routeExpandedCard) {
      setFlashCard(null);
      return;
    }

    setFlashCard(routeExpandedCard);
    const timeoutId = window.setTimeout(() => setFlashCard(null), 1100);
    return () => window.clearTimeout(timeoutId);
  }, [routeFlashToken, routeExpandedCard]);

  useEffect(() => {
    if (!routeFlashToken) return;
    if (!routeExpandedCard) return;

    // Wait for the expanded layout to be applied before scrolling.
    const timeoutId = window.setTimeout(() => {
      const targetId = `section-planning-check-grid-${routeExpandedCard}`;
      document.getElementById(targetId)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 120);

    return () => window.clearTimeout(timeoutId);
  }, [routeFlashToken, routeExpandedCard]);

  const toggleCard = (cardKey: 'whenWhere' | 'tickets' | 'needs' | 'guestList') => {
    setExpandedCard((prev) => (prev === cardKey ? null : cardKey));
  };

  return (
    <Box sx={{ mx: 1.75, mt: 1.75 }}>
      <Typography
        sx={{
          fontSize: 10,
          fontWeight: 500,
          textTransform: 'uppercase',
          letterSpacing: '0.09em',
          color: '#888780',
          mb: 1.25,
          pl: 0.25,
        }}
      >
        Plan your event
      </Typography>

      <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1.25 }}>
        {[
          {
            key: 'whenWhere' as const,
            state: 'done' as const,
            emoji: '📅',
            title: 'When & where',
            sub: whenWhereSub,
            badge: '',
            onClick: () => toggleCard('whenWhere'),
            expandedContent: renderWhenWhereSection,
          },
          {
            key: 'tickets' as const,
            state: isTicketsCardDone ? ('done' as const) : ('todo' as const),
            emoji: '🎟️',
            title: 'Tickets',
            sub:
              totalCapacity != null
                ? `${ticketsTiers} tier${ticketsTiers === 1 ? '' : 's'} · ${ticketsSold} sold / ${totalCapacity} capacity`
                : `${ticketsTiers} tier${ticketsTiers === 1 ? '' : 's'} · ${ticketsSold} sold · no capacity cap`,
            badge:
              ticketsTiers === 0
                ? 'Not set'
                : minimumParticipants <= 0
                  ? ''
                  : isMinimumParticipantsReached
                    ? ''
                    : `Need ${Math.max(minimumParticipants - ticketsSold, 0)} more`,
            onClick: () => toggleCard('tickets'),
            expandedContent: renderTicketsSection,
          },
          {
            key: 'needs' as const,
            state: openNeedsCount > 0 ? ('warn' as const) : ('done' as const),
            emoji: '🧰',
            title: 'Needs',
            sub: needsSub,
            badge: openNeedsCount > 0 ? 'Needs filling' : '',
            onClick: () => toggleCard('needs'),
            expandedContent: renderNeedsSection,
          },
          {
            key: 'guestList' as const,
            state: salesNotDone ? ('locked' as const) : ('done' as const),
            emoji: '👤',
            title: 'Guest list',
            sub: salesNotDone ? 'Min. threshold not yet reached' : 'Ready to admit guests',
            badge: '',
            onClick: () => {
              const nextExpanded = expandedCard === 'guestList' ? null : 'guestList';
              toggleCard('guestList');
              onGuestListExpandedChange?.(nextExpanded === 'guestList');
            },
            expandedContent: renderGuestListSection,
          },
        ].map((card, idx) => {
          const isDone = card.state === 'done';
          const isWarn = card.state === 'warn';
          const isLocked = card.state === 'locked';
          const isClickable = !!card.onClick;
          const isExpandable =
            card.key === 'whenWhere' ||
            card.key === 'tickets' ||
            card.key === 'needs' ||
            card.key === 'guestList';
          const isExpanded = isExpandable && expandedCard === card.key;
          const ExpandedContent = card.expandedContent;
          const isFlashing = flashCard != null && flashCard === card.key;

          return (
            <Box
              key={idx}
              id={`section-planning-check-grid-${card.key}`}
              sx={{
                background: '#fff',
                borderRadius: '14px',
                p: 1.75,
                gridColumn: isExpanded ? 'span 2' : undefined,
                position: 'relative',
                overflow: 'hidden',
                opacity: isLocked ? 0.55 : 1,
                cursor: isClickable ? 'pointer' : 'default',
                border: '0.5px solid',
                borderColor: isFlashing ? '#D85A30' : '#F0EDE8',
                boxShadow: isFlashing ? '0 0 0 4px rgba(216, 90, 48, 0.12)' : undefined,
                animation: isFlashing ? `${flashAnimation} 900ms ease-in-out` : undefined,
                scrollMarginTop: `${scrollMarginTopPx}px`,
                '&:hover': {
                  background: isClickable ? '#fdfdfd' : 'transparent',
                },
              }}
              onClick={card.onClick}
            >
              <Box
                sx={{
                  position: 'absolute',
                  top: 0,
                  right: 0,
                  width: 32,
                  height: 32,
                  borderRadius: '0 14px 0 32px',
                  display: 'flex',
                  alignItems: 'flex-start',
                  justifyContent: 'flex-end',
                  padding: '5px 6px',
                  fontSize: 12,
                  fontWeight: 700,
                  background: isDone ? '#EAF3DE' : isWarn ? '#FCEBEB' : '#F1EFE8',
                  color: isDone ? '#3B6D11' : isWarn ? '#D12424' : '#888780',
                }}
              >
                {isDone ? '✓' : isWarn ? '!' : ''}
              </Box>

              <Typography sx={{ fontSize: 26, mb: 1 }}>{card.emoji}</Typography>
              <Typography
                sx={{
                  fontFamily: 'Syne, sans-serif',
                  fontSize: 14,
                  fontWeight: 700,
                  color: '#1A1A1A',
                  lineHeight: 1.25,
                  mb: 0.5,
                }}
              >
                {card.title}
              </Typography>
              <Typography sx={{ fontSize: 11, color: '#888780', lineHeight: 1.4 }}>
                {card.sub}
              </Typography>
              <Box 
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 1,
              }}
              >
              {card.badge?.length > 0 && (<Box
                sx={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 0.5,
                  mt: 1.25,
                  fontSize: 10,
                  fontWeight: 500,
                  px: 1.1,
                  py: 0.4,
                  borderRadius: '999px',
                  background: isDone ? '#EAF3DE' : isWarn ? '#FAECE7' : '#F1EFE8',
                  color: isDone ? '#3B6D11' : isWarn ? '#993C1D' : '#5F5E5A',
                }}
              >
                {card.badge}
              </Box>)}
              {isExpandable && (
                <Box
                  sx={{
                    mt: 1,
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 0.5,
                    fontSize: 11,
                    color: '#5F5E5A',
                    fontWeight: 600,
                  }}
                >
                  {isExpanded ? 'Hide details' : 'Show details'}
                  <Box
                    sx={{
                      display: 'inline-flex',
                      transition: 'transform 200ms ease',
                      transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
                    }}
                  >
                    <ChevronDown size={14} />
                  </Box>
                </Box>
              )}
              </Box>
              {ExpandedContent ? (
                <Collapse in={isExpanded} timeout="auto">
                  <Box
                    sx={{
                      mt: 1.5,
                      pt: 1.5,
                      borderTop: '0.5px solid #F0EDE8',
                    }}
                    onClick={(event) => event.stopPropagation()}
                  >
                    <ExpandedContent />
                  </Box>
                </Collapse>
              ) : null}
            </Box>
          );
        })}
      </Box>
    </Box>
  );
}

