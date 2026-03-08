import { Briefcase, ExternalLink, LocateFixed, MapPin, Timer } from 'lucide-react';
import React from 'react';

import { detectPlatform, formatDuration } from '@/pages/events/manage/ManageDetailsSection';

import { EnclosingBox } from './ui/EnclosingBox';
import { ScrapbookHeading } from './ui/ScrapbookHeading';
import { ScrapbookInput } from './ui/ScrapbookInput';

interface WhenAndWhereFormProps {
    event: any;
    latitude: string;
    longitude: string;
    isDetectingLocation: boolean;
    locationNameRef: React.RefObject<HTMLInputElement>;
    locationAddressRef: React.RefObject<HTMLInputElement>;
    onlineUrl: string;
    setOnlineUrl: (url: string) => void;
    locationMode: 'offline' | 'online';
    setLocationMode: (mode: 'offline' | 'online') => void;
    handleUseCurrentLocation: () => Promise<void>;
    dateToLocalValue: (dateStr: string) => string;
    eventDuration: number;
    setEventDuration: (dur: number) => void;
    generateUntil: string;
    setGenerateUntil: (val: string) => void;
    previewDates: any[];
    readonly?: boolean;
}

export const WhenAndWhereForm: React.FC<WhenAndWhereFormProps> = ({
    event,
    latitude,
    longitude,
    isDetectingLocation,
    locationNameRef,
    locationAddressRef,
    onlineUrl,
    setOnlineUrl,
    locationMode,
    setLocationMode,
    handleUseCurrentLocation,
    dateToLocalValue,
    eventDuration,
    setEventDuration,
    generateUntil,
    setGenerateUntil,
    previewDates,
    readonly = false,
}) => {
    return (
        <EnclosingBox background="bg-[#ebf5ff] border border-blue-100" rotation={0.5} className="mt-2">
            <div className="mb-8  p-1" >
                <div className="flex items-center justify-between">
                    <ScrapbookHeading title="When & Where" icon={<MapPin className="h-6 w-6" />} />
                    <div>
                        <button
                            type="button"
                            disabled={readonly}
                            onClick={() => setLocationMode('offline')}
                            className={`px-3 py-1 text-[10px] font-bold uppercase tracking-wider transition-all ${locationMode === 'offline'
                                ? 'bg-yellow-100 text-gray-900 border border-yellow-300 shadow-[1px_1px_0px_#9ca3af]'
                                : 'text-gray-400 hover:text-gray-600'
                                } ${readonly ? 'opacity-70 cursor-not-allowed' : ''}`}
                        >
                            In Person
                        </button>
                        <button
                            type="button"
                            disabled={readonly}
                            onClick={() => setLocationMode('online')}
                            className={`px-3 py-1 text-[10px] font-bold uppercase tracking-wider transition-all ${locationMode === 'online'
                                ? 'bg-blue-100 text-gray-900 border border-blue-300 shadow-[1px_1px_0px_#9ca3af]'
                                : 'text-gray-400 hover:text-gray-600'
                                } ${readonly ? 'opacity-70 cursor-not-allowed' : ''}`}
                        >
                            Online
                        </button>
                    </div>
                </div>

                <div className="flex flex-col md:flex-row gap-6">
                    {/* Timing Section */}
                    <div className="flex-1 space-y-4">
                        <div className="flex items-center gap-2 mb-2">
                            <Timer className="h-4 w-4 text-blue-600" />
                            <span className="text-xs font-bold text-blue-800 uppercase tracking-wider">
                                Timing
                            </span>
                        </div>

                        <div className="flex flex-row gap-4">
                            <div className="flex-1">
                                <ScrapbookInput
                                    type="datetime-local"
                                    label="Start"
                                    id="start_time"
                                    name="start_time"
                                    defaultValue={dateToLocalValue(event?.start_time)}
                                    required
                                    disabled={readonly}
                                    onChange={(e) => {
                                        if (readonly) return;
                                        const startEl = e.target;
                                        const endEl = document.getElementById('end_time') as HTMLInputElement;
                                        if (startEl.value && endEl && eventDuration > 0) {
                                            const newEnd = new Date(new Date(startEl.value).getTime() + eventDuration);
                                            endEl.value = new Date(newEnd.getTime() - newEnd.getTimezoneOffset() * 60000)
                                                .toISOString()
                                                .slice(0, 16);
                                        }
                                    }}
                                />
                            </div>
                            <div className="flex-1">
                                <ScrapbookInput
                                    type="datetime-local"
                                    label="End"
                                    id="end_time"
                                    name="end_time"
                                    defaultValue={dateToLocalValue(event?.end_time)}
                                    required
                                    disabled={readonly}
                                    onChange={(e) => {
                                        if (readonly) return;
                                        const endEl = e.target;
                                        const startEl = document.getElementById('start_time') as HTMLInputElement;
                                        if (startEl?.value && endEl.value) {
                                            const dur = new Date(endEl.value).getTime() - new Date(startEl.value).getTime();
                                            if (dur > 0) setEventDuration(dur);
                                        }
                                    }}
                                />
                            </div>
                        </div>

                        {eventDuration > 0 && (
                            <div className="flex flex-col gap-2">
                                <span
                                    className="text-blue-700 font-bold"
                                    style={{ fontFamily: '"Caveat", cursive', fontSize: '1.2rem' }}
                                >
                                    Duration: {formatDuration(eventDuration)}
                                </span>
                                {!readonly && (
                                    <div className="flex items-center gap-1.5 flex-wrap">
                                        {[
                                            { label: '1h', ms: 3600000 },
                                            { label: '2h', ms: 7200000 },
                                            { label: '3h', ms: 10800000 },
                                            { label: 'Half Day', ms: 21600000 },
                                            { label: 'Full Day', ms: 43200000 },
                                        ].map((preset) => (
                                            <button
                                                key={preset.label}
                                                type="button"
                                                onClick={() => {
                                                    setEventDuration(preset.ms);
                                                    const startEl = document.getElementById('start_time') as HTMLInputElement;
                                                    const endEl = document.getElementById('end_time') as HTMLInputElement;
                                                    if (startEl?.value && endEl) {
                                                        const newEnd = new Date(new Date(startEl.value).getTime() + preset.ms);
                                                        endEl.value = new Date(
                                                            newEnd.getTime() - newEnd.getTimezoneOffset() * 60000,
                                                        )
                                                            .toISOString()
                                                            .slice(0, 16);
                                                    }
                                                }}
                                                className={`px-2 py-0.5 rounded-none text-[10px] font-bold border transition-all ${eventDuration === preset.ms
                                                    ? 'bg-blue-600 text-white border-blue-600 shadow-[1px_1px_0px_#1e3a8a] translate-y-[1px]'
                                                    : 'bg-white text-blue-600 border-blue-200 hover:border-blue-400 shadow-[2px_2px_0px_#bfdbfe]'
                                                    }`}
                                                style={{ fontFamily: '"Permanent Marker", cursive' }}
                                            >
                                                {preset.label}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Generate more dates */}
                        {event?.series && (
                            <div className="mt-4 pt-4 border-t border-dashed border-blue-200">
                                <ScrapbookInput
                                    type="date"
                                    label="Generate Until Date"
                                    value={generateUntil}
                                    onChange={(e) => setGenerateUntil(e.target.value)}
                                    disabled={readonly}
                                />

                                {previewDates.length > 0 && (
                                    <div className="mt-3 p-3 bg-white/50 border border-blue-100 shadow-sm relative">
                                        <p className="text-[10px] font-bold text-blue-800 mb-2 uppercase tracking-wider border-b border-blue-100 pb-1">
                                            Will Generate {previewDates.length} Instances
                                        </p>
                                        <div className="max-h-24 overflow-y-auto space-y-1 pr-1">
                                            {previewDates.map((d: any, idx) => (
                                                <div key={idx} className="text-[11px] text-blue-900 flex justify-between font-mono">
                                                    <span>{new Date(d.start_time).toLocaleDateString()}</span>
                                                    <span>
                                                        {new Date(d.start_time).toLocaleTimeString([], {
                                                            hour: '2-digit',
                                                            minute: '2-digit',
                                                        })}
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Location / Online Section */}
                    <div className="flex-1 space-y-4">
                        {locationMode === 'offline' ? (
                            <>
                                <div className="flex items-center gap-2 mb-2">
                                    <Briefcase className="h-4 w-4 text-gray-600" />
                                    <span className="text-xs font-bold text-gray-800 uppercase tracking-wider">
                                        Venue
                                    </span>
                                </div>

                                <ScrapbookInput
                                    id="location_name"
                                    name="location_name"
                                    ref={locationNameRef as any}
                                    label="Venue Name"
                                    example="Central Park"
                                    defaultValue={
                                        event?.location_address !== 'Online Event' ? event?.location_name || '' : ''
                                    }
                                    required
                                    disabled={readonly}
                                />

                                <div className="relative">
                                    {!readonly && (
                                        <button
                                            type="button"
                                            onClick={handleUseCurrentLocation}
                                            disabled={isDetectingLocation}
                                            className="absolute right-0 top-[-26px] z-10 text-[9px] font-bold text-blue-600 hover:text-blue-800 uppercase tracking-wider flex items-center"
                                        >
                                            <LocateFixed className="h-3 w-3 mr-1" />
                                            {isDetectingLocation ? 'Detecting...' : 'Find Me'}
                                        </button>
                                    )}
                                    <ScrapbookInput
                                        id="location_address"
                                        name="location_address"
                                        ref={locationAddressRef as any}
                                        label="Street Address"
                                        example="123 Park Ave, NY"
                                        defaultValue={
                                            event?.location_address !== 'Online Event' ? event?.location_address || '' : ''
                                        }
                                        required
                                        disabled={readonly}
                                    />
                                </div>

                                <input type="hidden" name="latitude" value={latitude} />
                                <input type="hidden" name="longitude" value={longitude} />
                                {latitude && longitude && (
                                    <p className="text-[10px] text-green-700 font-mono mt-1">
                                        [Coords: {latitude}, {longitude}]
                                    </p>
                                )}
                            </>
                        ) : (
                            <>
                                <div className="flex items-center gap-2 mb-2">
                                    <ExternalLink className="h-4 w-4 text-gray-600" />
                                    <span className="text-xs font-bold text-gray-800 uppercase tracking-wider">
                                        Meeting Info
                                    </span>
                                </div>

                                <ScrapbookInput
                                    label="Meeting URL"
                                    example="https://zoom.us/j/..."
                                    value={onlineUrl}
                                    onChange={(e) => setOnlineUrl(e.target.value)}
                                    disabled={readonly}
                                />
                                <input type="hidden" name="location_name" value={onlineUrl || 'Online Event'} />
                                <input type="hidden" name="location_address" value="Online Event" />

                                {onlineUrl && (
                                    <div className="flex items-center gap-3 p-3 bg-white border border-gray-200 shadow-[2px_2px_0px_#ccc]">
                                        <span className="text-2xl">{detectPlatform(onlineUrl).icon}</span>
                                        <div>
                                            <p
                                                className="text-sm font-bold text-blue-900"
                                                style={{ fontFamily: '"Permanent Marker", cursive' }}
                                            >
                                                {detectPlatform(onlineUrl).name}
                                            </p>
                                        </div>
                                    </div>
                                )}

                                {!readonly && (
                                    <div className="flex flex-wrap gap-2 mt-2">
                                        {[
                                            { name: 'Zoom', icon: '🎥', prefix: 'https://zoom.us/j/' },
                                            { name: 'Google Meet', icon: '🟢', prefix: 'https://meet.google.com/' },
                                            { name: 'Teams', icon: '🟦', prefix: 'https://teams.microsoft.com/l/meetup-join/' },
                                            { name: 'Discord', icon: '🎮', prefix: 'https://discord.gg/' },
                                        ].map((p) => (
                                            <button
                                                key={p.name}
                                                type="button"
                                                onClick={() => {
                                                    if (!onlineUrl) setOnlineUrl(p.prefix);
                                                }}
                                                className="flex items-center gap-1 px-2 py-0.5 bg-white border border-gray-200 text-[10px] font-bold shadow-[1px_1px_0px_#ccc] hover:shadow-[2px_2px_0px_#ccc] hover:-translate-y-[1px] transition-all"
                                            >
                                                <span>{p.icon}</span> {p.name}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                </div>
            </div>
        </EnclosingBox >
    );
};
