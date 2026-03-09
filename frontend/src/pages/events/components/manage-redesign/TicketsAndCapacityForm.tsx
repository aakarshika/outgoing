import { Plus, Trash2, Users } from 'lucide-react';
import React, { useEffect } from 'react';

import { TICKET_COLORS } from '@/features/events/constants';

import { EnclosingBox } from './ui/EnclosingBox';
import { ScrapbookHeading } from './ui/ScrapbookHeading';
import { ScrapbookInput } from './ui/ScrapbookInput';

export interface TicketTier {
    id?: string;
    name: string;
    price: number;
    admits: number | string;
    max_passes_per_ticket: number | string;
    capacity: number | '';
    description: string;
}

interface TicketsAndCapacityFormProps {
    capacity: string;
    setCapacity: (cap: string) => void;
    ticketTiers: TicketTier[];
    setTicketTiers: (tiers: TicketTier[]) => void;
    readonly?: boolean;
}

// Use the shared TICKET_COLORS constant (light = background, dark = left stub strip)
function getTheme(index: number) {
    const c = TICKET_COLORS[index % TICKET_COLORS.length];
    return { dark: c.dark, light: c.light };
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

export const TicketsAndCapacityForm: React.FC<TicketsAndCapacityFormProps> = ({
    capacity,
    setCapacity,
    ticketTiers,
    setTicketTiers,
    readonly = false,
}) => {
    // Ensure at least one tier always exists
    useEffect(() => {
        if (ticketTiers.length === 0 && !readonly) {
            setTicketTiers([newTier(0)]);
        }
    }, [ticketTiers, setTicketTiers, readonly]);

    const handleTierChange = (index: number, field: keyof TicketTier, value: any) => {
        const updated = [...ticketTiers];
        updated[index] = { ...updated[index], [field]: value };
        setTicketTiers(updated);
    };

    const addTier = () => setTicketTiers([...ticketTiers, newTier(ticketTiers.length)]);

    const removeTier = (index: number) => {
        if (ticketTiers.length > 1) {
            setTicketTiers(ticketTiers.filter((_, i) => i !== index));
        }
    };

    // The last tier's capacity = totalCapacity - sum of all other tiers' capacities
    const totalCapacityNum = parseInt(capacity) || 0;
    const getLastTierAutoCapacity = () => {
        if (!totalCapacityNum || ticketTiers.length === 0) return null;
        let sumOthers = 0;
        for (let i = 0; i < ticketTiers.length - 1; i++) {
            sumOthers += parseInt(ticketTiers[i].capacity as string) || 0;
        }
        const rem = totalCapacityNum - sumOthers;
        return rem >= 0 ? rem : 0;
    };

    return (
        <EnclosingBox background="bg-[#f0f9ff] border-2 border-dashed border-blue-200" rotation={-0.2}>
            <div className="mb-8">
                <ScrapbookHeading title="Tickets & Capacity" icon={<span className="text-xl">🎟️</span>} rotation={0.5} />

                {/* Total Capacity */}
                <div className="flex items-end gap-4 mb-8">
                    <div className="w-44">
                        <div className="flex items-center gap-1.5 mb-1">
                            <Users className="h-3.5 w-3.5 text-blue-700" />
                            <span className="text-[10px] font-bold text-blue-800 uppercase tracking-wider">
                                Total Event Cap
                            </span>
                        </div>
                        <ScrapbookInput
                            name="capacity"
                            type="number"
                            label="Capacity"
                            example="500"
                            value={capacity}
                            onChange={(e) => setCapacity(e.target.value)}
                            disabled={readonly}
                            min="0"
                        />
                    </div>
                    <p className="text-[10px] text-gray-400 italic font-mono pb-2">
                        Leave blank for unlimited.<br />The last tier inherits remaining capacity.
                    </p>
                </div>

                {/* Ticket Tiers */}
                <div className="border-t-2 border-dashed border-blue-200 pt-6">
                    <div className="flex items-center justify-between mb-5">
                        <span className="text-xs font-bold text-blue-800 uppercase tracking-wider">
                            Ticket Tiers
                        </span>
                        {!readonly && (
                            <button
                                type="button"
                                onClick={addTier}
                                className="flex items-center gap-1 px-3 py-1 bg-yellow-300 border-2 border-gray-900 shadow-[2px_2px_0px_#333] text-xs font-bold hover:-translate-y-[1px] hover:shadow-[3px_3px_0px_#333] transition-all"
                                style={{ fontFamily: '"Permanent Marker", cursive' }}
                            >
                                <Plus className="h-3 w-3" /> Add Tier
                            </button>
                        )}
                    </div>

                    <div className="flex flex-col gap-5">
                        {ticketTiers.map((tier, index) => {
                            const theme = getTheme(index);
                            const isLastTier = index === ticketTiers.length - 1;
                            const autoCapacity = isLastTier ? getLastTierAutoCapacity() : null;

                            return (
                                <div
                                    key={index}
                                    className="relative overflow-visible"
                                    style={{ transform: `rotate(${index % 2 === 0 ? -0.5 : 0.5}deg)` }}
                                >
                                    {/* Remove button */}
                                    {!readonly && ticketTiers.length > 1 && (
                                        <button
                                            type="button"
                                            onClick={() => removeTier(index)}
                                            className="absolute -top-2.5 -right-2.5 z-20 w-6 h-6 flex items-center justify-center bg-red-400 border-2 border-white rounded-full shadow-[1px_1px_0px_#333] hover:scale-110 transition-transform"
                                        >
                                            <Trash2 className="h-3 w-3 text-white" />
                                        </button>
                                    )}

                                    {/* Ticket card — TicketStub style */}
                                    <div
                                        className="flex relative"
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
                                            {/* Dashed perforation */}
                                            <div
                                                className="absolute right-0 top-0 bottom-0 w-0"
                                                style={{
                                                    borderRight: `2px dashed ${theme.light}`,
                                                    opacity: 0.6,
                                                }}
                                            />
                                            {/* Circular notches */}
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
                                                style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)', letterSpacing: '0.15em' }}
                                            >
                                                ADMIT
                                            </span>
                                            <span
                                                className="text-white font-bold text-center"
                                                style={{ fontFamily: '"Permanent Marker", cursive', fontSize: '1.6rem', lineHeight: 1 }}
                                            >
                                                ${tier.price}
                                            </span>
                                            <span
                                                className="text-white text-[9px] mt-1 opacity-70 text-center"
                                            >
                                                × {tier.admits}
                                            </span>
                                        </div>

                                        {/* Right side — fields */}
                                        <div className="flex-1 px-4 py-3 space-y-3">
                                            {/* Tier name */}
                                            <div style={{ fontFamily: '"Permanent Marker", cursive' }}>
                                                <div className="text-[9px] uppercase tracking-wider mb-1 opacity-60" >
                                                    Tier Name
                                                </div>
                                                {readonly ? (
                                                    <span className="text-lg font-bold" style={{ color: theme.dark }}>{tier.name}</span>
                                                ) : (
                                                    <input
                                                        value={tier.name}
                                                        onChange={(e) => handleTierChange(index, 'name', e.target.value)}
                                                        placeholder="General Admission"
                                                        className="w-full bg-transparent border-0 border-b-2 border-dashed outline-none text-lg font-bold pb-0.5"
                                                        style={{
                                                            borderColor: theme.dark + '66',
                                                            color: theme.dark,
                                                            fontFamily: '"Permanent Marker", cursive',
                                                        }}
                                                    />
                                                )}
                                            </div>

                                            {/* Row: Price, Admits, Max/Txn */}
                                            <div className="grid grid-cols-3 gap-3">
                                                <div>
                                                    <div className="text-[9px] uppercase tracking-wider mb-1" style={{opacity: 0.7 }}>
                                                        Price ($)
                                                    </div>
                                                    <ScrapbookInput
                                                        type="number"
                                                        label="Price"
                                                        example="0"
                                                        value={tier.price}
                                                        onChange={(e) => handleTierChange(index, 'price', parseFloat(e.target.value) || 0)}
                                                        disabled={readonly}
                                                        min="0"
                                                        step="0.01"
                                                    />
                                                </div>
                                                <div>
                                                    <div className="text-[9px] uppercase tracking-wider mb-1" style={{opacity: 0.7 }}>
                                                        Admits
                                                    </div>
                                                    <ScrapbookInput
                                                        type="text"
                                                        label="Admits"
                                                        example="1"
                                                        value={tier.admits}
                                                        onChange={(e) => handleTierChange(index, 'admits', e.target.value)}
                                                        disabled={readonly}
                                                    />
                                                </div>
                                                <div>
                                                    <div className="text-[9px] uppercase tracking-wider mb-1" style={{ opacity: 0.7 }}>
                                                        Max / Txn
                                                    </div>
                                                    <ScrapbookInput
                                                        type="text"
                                                        label="Max"
                                                        example="6"
                                                        value={tier.max_passes_per_ticket}
                                                        onChange={(e) => handleTierChange(index, 'max_passes_per_ticket', e.target.value)}
                                                        disabled={readonly}
                                                    />
                                                </div>
                                            </div>

                                            {/* Row: Capacity + Description */}
                                            <div className="grid grid-cols-3 gap-3">
                                                <div>
                                                    <div className="text-[9px] uppercase tracking-wider mb-1 flex items-center gap-1" style={{ opacity: 0.7 }}>
                                                        Capacity
                                                        {isLastTier && totalCapacityNum > 0 && (
                                                            <span className="text-[8px] italic opacity-60">(auto)</span>
                                                        )}
                                                    </div>
                                                    {isLastTier && totalCapacityNum > 0 ? (
                                                        <div
                                                            className="w-full py-2 px-3 text-sm font-bold shadow-[1px_1px_0px_rgba(0,0,0,0.15)] bg-white/60"
                                                            style={{ fontFamily: '"Caveat", cursive', fontSize: '1.15rem', color: theme.dark }}
                                                        >
                                                            {autoCapacity ?? '—'}
                                                        </div>
                                                    ) : (
                                                        <ScrapbookInput
                                                            type="number"
                                                            label="Qty"
                                                            example="∞"
                                                            value={tier.capacity}
                                                            onChange={(e) => handleTierChange(index, 'capacity', parseInt(e.target.value) || '')}
                                                            disabled={readonly}
                                                            min="0"
                                                        />
                                                    )}
                                                </div>
                                                <div className="col-span-2">
                                                    <div className="text-[9px] uppercase tracking-wider mb-1" style={{ opacity: 0.7 }}>
                                                        Description
                                                    </div>
                                                    <ScrapbookInput
                                                        label="Description"
                                                        example="Includes VIP entry..."
                                                        value={tier.description}
                                                        onChange={(e) => handleTierChange(index, 'description', e.target.value)}
                                                        disabled={readonly}
                                                        multiline
                                                        rows={2}
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        </EnclosingBox>
    );
};
