import { Repeat } from 'lucide-react';
import React from 'react';

import { Button } from '@/components/ui/button';

export interface RecurringFormProps {
    isRecurring: boolean;
    setIsRecurring: (val: boolean) => void;
    freq: 'DAILY' | 'WEEKLY' | 'MONTHLY';
    setFreq: (val: 'DAILY' | 'WEEKLY' | 'MONTHLY') => void;
    days: string[];
    handleDayToggle: (day: string) => void;
    generateCount: string;
    setGenerateCount: (val: string) => void;
    buildRrule: () => string;
    readonly?: boolean;
}

const dayOptions = [
    { value: 'MO', label: 'Mon' },
    { value: 'TU', label: 'Tue' },
    { value: 'WE', label: 'Wed' },
    { value: 'TH', label: 'Thu' },
    { value: 'FR', label: 'Fri' },
    { value: 'SA', label: 'Sat' },
    { value: 'SU', label: 'Sun' },
];

export const RecurringForm: React.FC<RecurringFormProps> = ({
    isRecurring,
    setIsRecurring,
    freq,
    setFreq,
    days,
    handleDayToggle,
    generateCount,
    setGenerateCount,
    buildRrule,
    readonly = false,
}) => {
    return (
        <div className="space-y-4 rounded-xl border-2 border-blue-200 p-4 bg-white shadow-[2px_2px_0px_#bfdbfe] transition-all">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Repeat className="w-5 h-5 text-blue-600" />
                    <h3
                        className="font-bold text-blue-900 tracking-wider"
                        style={{ fontFamily: '"Permanent Marker", cursive' }}
                    >
                        Recurring Event
                    </h3>
                </div>
                <label className="flex items-center cursor-pointer">
                    <input
                        type="checkbox"
                        className="sr-only peer"
                        checked={isRecurring}
                        onChange={(e) => {
                            if (!readonly) setIsRecurring(e.target.checked);
                        }}
                        disabled={readonly}
                    />
                    <div className={`relative w-11 h-6 transition-colors border-2 shadow-[1px_1px_0px_#9ca3af] ${isRecurring ? 'bg-blue-400 border-blue-600' : 'bg-gray-200 border-gray-400'} ${readonly ? 'opacity-60 cursor-not-allowed' : ''}`}>
                        <div
                            className={`absolute top-0.5 h-4 w-4 bg-white transition-transform ${isRecurring ? 'translate-x-5' : 'translate-x-0.5'}`}
                        />
                    </div>
                </label>
            </div>

            {isRecurring && (
                <div className="pt-4 space-y-4 animate-in fade-in slide-in-from-top-2 border-t border-dashed border-blue-200">
                    <div className="space-y-2">
                        <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider">
                            Frequency
                        </label>
                        <div className="flex gap-4">
                            {(['DAILY', 'WEEKLY', 'MONTHLY'] as const).map((type) => (
                                <label
                                    key={type}
                                    className={`flex items-center gap-2 text-sm font-bold ${readonly ? 'cursor-not-allowed opacity-70' : 'cursor-pointer'}`}
                                >
                                    <input
                                        type="radio"
                                        name={`freq_${Math.random().toString(36).substring(7)}`} // Prevent name collision with CreateEvent
                                        value={type}
                                        checked={freq === type}
                                        onChange={() => {
                                            if (!readonly) setFreq(type);
                                        }}
                                        disabled={readonly}
                                        className="text-blue-600 focus:ring-blue-600 w-4 h-4"
                                    />
                                    <span className="capitalize">{type.toLowerCase()}</span>
                                </label>
                            ))}
                        </div>
                    </div>

                    {freq === 'WEEKLY' && (
                        <div className="space-y-2">
                            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider">
                                Repeats On
                            </label>
                            <div className="flex flex-wrap gap-2">
                                {dayOptions.map((day) => (
                                    <button
                                        key={day.value}
                                        type="button"
                                        disabled={readonly}
                                        onClick={() => {
                                            if (!readonly) handleDayToggle(day.value);
                                        }}
                                        className={`px-3 py-1 text-xs font-bold uppercase tracking-wider border-2 transition-all ${days.includes(day.value)
                                            ? 'bg-blue-600 text-white border-blue-800 shadow-[1px_1px_0px_#1e3a8a] translate-y-[1px]'
                                            : 'bg-white text-gray-700 border-gray-300 shadow-[2px_2px_0px_#9ca3af] hover:shadow-[3px_3px_0px_#9ca3af] hover:-translate-y-[1px]'
                                            } flex items-center justify-center ${readonly ? 'opacity-60 cursor-not-allowed' : ''}`}
                                        style={{ fontFamily: '"Permanent Marker", cursive' }}
                                    >
                                        {day.label}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    <div className="space-y-2">
                        <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider">
                            Generate Occurrences
                        </label>
                        <div className="flex items-center gap-2 relative z-10">
                            <input
                                type="number"
                                min="1"
                                max="52"
                                value={generateCount}
                                onChange={(e) => {
                                    if (!readonly) setGenerateCount(e.target.value);
                                }}
                                disabled={readonly}
                                className={`w-20 bg-transparent border-none text-blue-900 font-bold outline-none focus:ring-0 px-0 py-1 border-b-2 border-blue-300 focus:border-blue-600 transition-colors ${readonly ? 'opacity-70 cursor-not-allowed' : ''}`}
                                style={{
                                    fontFamily: '"Permanent Marker", cursive',
                                    fontSize: '1rem',
                                    paddingLeft: '4px'
                                }}
                            />
                            <span
                                className="text-sm font-bold text-blue-700"
                            >
                                sessions
                            </span>
                        </div>
                        <p className="text-xs text-gray-600 mt-1 font-mono">
                            The rule:{' '}
                            <strong className="text-blue-800">
                                {buildRrule()
                                    .replace('FREQ=', 'Repeats ')
                                    .replace(';BYDAY=', ' on ')}
                            </strong>
                            .
                        </p>
                    </div>

                    {/* Hidden inputs to be included in formData if it's rendered as part of form */}
                    <input type="hidden" name="is_recurring" value="true" />
                    <input type="hidden" name="recurrence_rule" value={buildRrule()} />
                    <input type="hidden" name="generate_count" value={generateCount} />
                </div>
            )}
        </div>
    );
};
