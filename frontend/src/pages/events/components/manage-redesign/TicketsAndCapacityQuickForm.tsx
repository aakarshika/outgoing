import React from 'react';
import { useEffect, useMemo } from 'react';

import { TICKET_COLORS } from '@/features/events/constants';

import { TicketsAndCapacityForm, TicketTier } from './TicketsAndCapacityForm';
import { ScrapbookInput } from './ui/ScrapbookInput';

export interface TicketsAndCapacityQuickFormProps {
  capacity: string;
  setCapacity: (cap: string) => void;
  ticketTiers: TicketTier[];
  setTicketTiers: (tiers: TicketTier[]) => void;
  readonly?: boolean;
  mode?: 'default' | 'story';
}

function newTier(index: number): TicketTier {
  return {
    name: index === 0 ? 'General Admission' : `Tier ${index + 1}`,
    price: 0,
    admits: '1',
    max_passes_per_ticket: '6',
    capacity: '',
    description: '',
  };
}

export const TicketsAndCapacityQuickForm: React.FC<
  TicketsAndCapacityQuickFormProps
> = ({
  capacity,
  setCapacity,
  ticketTiers,
  setTicketTiers,
  readonly = false,
  mode = 'default',
}) => {
  const [showAdvanced, setShowAdvanced] = React.useState(false);
  useEffect(() => {
    if (ticketTiers.length === 0 && !readonly) {
      setTicketTiers([newTier(0)]);
    }
  }, [ticketTiers, setTicketTiers, readonly]);

  const tier = useMemo(() => ticketTiers[0] || newTier(0), [ticketTiers]);
  const theme = TICKET_COLORS[0];
  const updatePrimaryTier = (field: keyof TicketTier, value: string | number) => {
    const next = ticketTiers[0] || newTier(0);
    setTicketTiers([{ ...next, [field]: value }]);
  };

  if (mode === 'story') {
    return (
      <div className="space-y-5">
        <div className="text-[10px] font-bold uppercase tracking-wider text-gray-500">
          Set the Seating
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <ScrapbookInput
            name="capacity"
            type="number"
            label="Capacity"
            example="80"
            value={capacity}
            onChange={(e) => {
              setCapacity(e.target.value);
              updatePrimaryTier('capacity', e.target.value);
            }}
            disabled={readonly}
            min="0"
            style={{ backgroundColor: 'transparent' }}
          />
          <ScrapbookInput
            name="ticket_price_story"
            type="number"
            label="Ticket Amount"
            example="25"
            value={String(tier.price ?? '')}
            onChange={(e) => updatePrimaryTier('price', Number(e.target.value || 0))}
            disabled={readonly}
            min="0"
            style={{ backgroundColor: 'transparent' }}
          />
        </div>

        <ScrapbookInput
          name="ticket_name_story"
          label="Ticket Name"
          example="General Admission"
          value={tier.name}
          onChange={(e) => updatePrimaryTier('name', e.target.value)}
          disabled={readonly}
          style={{ backgroundColor: 'transparent' }}
        />

        <div
          className="flex relative overflow-visible"
          style={{
            backgroundColor: theme.light,
            border: '1px solid',
            borderColor: theme.dark + '66',
            borderLeft: '2px dashed ' + theme.dark + '44',
            borderRight: '2px dashed ' + theme.dark + '44',
          }}
        >
          <div
            className="flex flex-col items-center justify-center px-3 py-4 min-w-[96px] flex-shrink-0 relative"
            style={{ backgroundColor: theme.dark }}
          >
            <div
              className="absolute right-0 top-0 bottom-0 w-0"
              style={{
                borderRight: `2px dashed ${theme.light}`,
                opacity: 0.6,
              }}
            />
            <div
              className="absolute -top-2 right-0 translate-x-1/2 w-4 h-4 rounded-full"
              style={{ backgroundColor: '#f8fafc' }}
            />
            <div
              className="absolute -bottom-2 right-0 translate-x-1/2 w-4 h-4 rounded-full"
              style={{ backgroundColor: '#f8fafc' }}
            />

            <span
              className="text-white text-[9px] uppercase tracking-widest mb-1 opacity-80"
              style={{
                writingMode: 'vertical-rl',
                transform: 'rotate(180deg)',
                letterSpacing: '0.15em',
              }}
            >
              ADMIT
            </span>
            <span
              className="text-white font-bold text-center"
              style={{
                fontFamily: '"Permanent Marker", cursive',
                fontSize: '1.6rem',
                lineHeight: 1,
              }}
            >
              ${Number(tier.price || 0).toFixed(0)}
            </span>
            <span className="text-white text-[9px] mt-1 opacity-70 text-center">
              {capacity ? `${capacity} seats` : 'Open seating'}
            </span>
          </div>

          <div className="flex-1 px-4 py-3">
            <div className="text-[9px] uppercase tracking-wider mb-1 opacity-60">
              Ticket
            </div>
            <div
              className="text-lg font-bold"
              style={{ color: theme.dark, fontFamily: '"Permanent Marker", cursive' }}
            >
              {tier.name || 'General Admission'}
            </div>
            <div className="text-[10px] mt-2 uppercase tracking-wider opacity-70">
              {capacity ? `${capacity} seats available` : 'Unlimited seating'}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex justify-between items-center">
        <div className="text-[10px] font-bold uppercase tracking-wider text-gray-500">
          Tickets & Capacity
        </div>
        <button
          type="button"
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="text-[10px] font-bold text-blue-600 uppercase tracking-wider flex items-center hover:underline"
        >
          {showAdvanced ? 'Hide Advanced' : 'Show Advanced (Multiple Tiers)'}
        </button>
      </div>

      {showAdvanced ? (
        <TicketsAndCapacityForm
          {...{
            capacity,
            setCapacity,
            ticketTiers,
            setTicketTiers,
            readonly,
          }}
        />
      ) : (
        <>
          <div className="flex items-end gap-3">
            <div className="w-44">
              <ScrapbookInput
                name="capacity"
                type="number"
                label="Capacity"
                example="∞"
                value={capacity}
                onChange={(e) => setCapacity(e.target.value)}
                disabled={readonly}
                min="0"
                style={{ backgroundColor: 'transparent' }}
              />
            </div>
            <div className="text-[10px] text-gray-500 uppercase tracking-wider font-bold pb-2">
              Free ticket
            </div>
          </div>

          {/* Ticket stub preview */}
          <div
            className="flex relative overflow-visible"
            style={{
              backgroundColor: theme.light,
              border: '1px solid',
              borderColor: theme.dark + '66',
              borderLeft: '2px dashed ' + theme.dark + '44',
              borderRight: '2px dashed ' + theme.dark + '44',
            }}
          >
            {/* Left colored stub */}
            <div
              className="flex flex-col items-center justify-center px-3 py-4 min-w-[90px] flex-shrink-0 relative"
              style={{ backgroundColor: theme.dark }}
            >
              <div
                className="absolute right-0 top-0 bottom-0 w-0"
                style={{
                  borderRight: `2px dashed ${theme.light}`,
                  opacity: 0.6,
                }}
              />
              <div
                className="absolute -top-2 right-0 translate-x-1/2 w-4 h-4 rounded-full"
                style={{ backgroundColor: '#f0f9ff' }}
              />
              <div
                className="absolute -bottom-2 right-0 translate-x-1/2 w-4 h-4 rounded-full"
                style={{ backgroundColor: '#f0f9ff' }}
              />

              <span
                className="text-white text-[9px] uppercase tracking-widest mb-1 opacity-80"
                style={{
                  writingMode: 'vertical-rl',
                  transform: 'rotate(180deg)',
                  letterSpacing: '0.15em',
                }}
              >
                ADMIT
              </span>
              <span
                className="text-white font-bold text-center"
                style={{
                  fontFamily: '"Permanent Marker", cursive',
                  fontSize: '1.6rem',
                  lineHeight: 1,
                }}
              >
                $0
              </span>
              <span className="text-white text-[9px] mt-1 opacity-70 text-center">
                × {tier.admits || '1'}
              </span>
            </div>

            {/* Right side */}
            <div className="flex-1 px-4 py-3">
              <div
                className="text-[9px] uppercase tracking-wider mb-1 opacity-60"
                style={{}}
              >
                Ticket
              </div>
              <div
                className="text-lg font-bold"
                style={{ color: theme.dark, fontFamily: '"Permanent Marker", cursive' }}
              >
                Free Ticket
              </div>
              <div
                className="text-[10px] mt-2 uppercase tracking-wider opacity-70"
                style={{}}
              >
                General Admission
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
