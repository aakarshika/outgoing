import {
  Briefcase,
  ExternalLink,
  FileEdit,
  ImageIcon,
  Link2,
  LocateFixed,
  MapPin,
  Ticket,
  Timer,
  Users,
} from 'lucide-react';
import React from 'react';

import { Button } from '@/components/ui/button';

export type FeatureTag = 'featured' | 'additional' | 'extra';
export type EventFeature = { name: string; tag: FeatureTag };

export const TAG_COLORS: Record<
  FeatureTag,
  { bg: string; border: string; text: string; label: string; emoji: string }
> = {
  featured: {
    bg: '#fef3c7',
    border: '#f59e0b',
    text: '#92400e',
    label: 'Featured',
    emoji: '⭐',
  },
  additional: {
    bg: '#dbeafe',
    border: '#3b82f6',
    text: '#1e40af',
    label: 'Additional',
    emoji: '➕',
  },
  extra: {
    bg: '#d1fae5',
    border: '#10b981',
    text: '#065f46',
    label: 'Extra',
    emoji: '🎁',
  },
};

export const FEATURE_ITEMS: { name: string; emoji: string }[] = [
  { name: 'Food', emoji: '🍕' },
  { name: 'Non-Alcoholic Drinks', emoji: '🧃' },
  { name: 'Alcoholic Drinks', emoji: '🍷' },
  { name: 'Music', emoji: '🎵' },
  { name: 'DJ', emoji: '🎧' },
  { name: 'Live Band', emoji: '🎸' },
  { name: 'Games', emoji: '🎮' },
  { name: 'Photo Booth', emoji: '📸' },
  { name: 'Surprise Gifts', emoji: '🎁' },
  { name: 'Educational Activities', emoji: '📚' },
  { name: 'Group Activities', emoji: '👥' },
  { name: 'Networking', emoji: '🤝' },
  { name: 'Dance Floor', emoji: '💃' },
  { name: 'Workshops', emoji: '🔧' },
  { name: 'Art', emoji: '🎨' },
  { name: 'Karaoke', emoji: '🎤' },
  { name: 'Bonfire', emoji: '🔥' },
  { name: 'Fireworks', emoji: '🎆' },
  { name: 'Pool', emoji: '🏊' },
  { name: 'Outdoor Seating', emoji: '⛱️' },
  { name: 'Indoor Seating', emoji: '🪑' },
  { name: 'Decorations', emoji: '🎀' },
  { name: 'Themed Costumes', emoji: '🎭' },
  { name: 'Raffle', emoji: '🎟️' },
  { name: 'Trivia', emoji: '🧠' },
  { name: 'Kids Zone', emoji: '🧒' },
  { name: 'Pet-Friendly', emoji: '🐾' },
  { name: 'Open Bar', emoji: '🍹' },
  { name: 'VIP Lounge', emoji: '✨' },
  { name: 'Parking', emoji: '🅿️' },
];

export const detectPlatform = (url: string): { name: string; icon: string } => {
  const lower = url.toLowerCase();
  if (lower.includes('zoom.us') || lower.includes('zoom.com'))
    return { name: 'Zoom', icon: '🎥' };
  if (lower.includes('teams.microsoft.com') || lower.includes('teams.live.com'))
    return { name: 'Teams', icon: '🟦' };
  if (lower.includes('meet.google.com')) return { name: 'Google Meet', icon: '🟢' };
  if (lower.includes('slack.com')) return { name: 'Slack', icon: '💬' };
  if (lower.includes('discord.gg') || lower.includes('discord.com'))
    return { name: 'Discord', icon: '🎮' };
  return { name: 'Link', icon: '🔗' };
};

export const formatDuration = (ms: number) => {
  const mins = Math.round(ms / 60000);
  if (mins < 60) return `${mins}m`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
};

interface ManageDetailsSectionProps {
  event: any;
  categories: any[];
  latitude: string;
  longitude: string;
  isDetectingLocation: boolean;
  locationNameRef: React.RefObject<HTMLInputElement>;
  locationAddressRef: React.RefObject<HTMLInputElement>;
  onlineUrl: string;
  setOnlineUrl: (url: string) => void;
  locationMode: 'offline' | 'online';
  setLocationMode: (mode: 'offline' | 'online') => void;
  capacity: string;
  setCapacity: (capacity: string) => void;
  eventFeatures: EventFeature[];
  setEventFeatures: (features: EventFeature[]) => void;
  ticketTiers: any[];
  setTicketTiers: (tiers: any[]) => void;
  applyToSeries: boolean;
  setApplyToSeries: (apply: boolean) => void;
  isSubmitting: boolean;
  handleUpdate: (e: React.FormEvent<HTMLFormElement>) => Promise<void>;
  handleCoverChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  coverPreview: string | null;
  handleUseCurrentLocation: () => Promise<void>;
  dateToLocalValue: (dateStr: string) => string;
  eventDuration: number;
  setEventDuration: (dur: number) => void;
  generateUntil: string;
  setGenerateUntil: (val: string) => void;
  previewDates: any[];
}

export const ManageDetailsSection: React.FC<ManageDetailsSectionProps> = ({
  event,
  categories,
  latitude,
  longitude,
  isDetectingLocation,
  locationNameRef,
  locationAddressRef,
  onlineUrl,
  setOnlineUrl,
  locationMode,
  setLocationMode,
  capacity,
  setCapacity,
  eventFeatures,
  setEventFeatures,
  ticketTiers,
  setTicketTiers,
  applyToSeries,
  setApplyToSeries,
  isSubmitting,
  handleUpdate,
  handleCoverChange,
  coverPreview,
  handleUseCurrentLocation,
  dateToLocalValue,
  eventDuration,
  setEventDuration,
  generateUntil,
  setGenerateUntil,
  previewDates,
}) => {
  return (
    <form onSubmit={handleUpdate} className="space-y-8 pb-32">
      {/* ═══ Basic Info Card ═══ */}
      <div
        className="bg-white border-2 border-gray-800 p-6 shadow-[3px_4px_0px_#333] relative"
        style={{ transform: 'rotate(-0.1deg)' }}
      >
        <div className="flex items-center gap-2 mb-6 border-b-2 border-gray-800 pb-2 border-dashed">
          <FileEdit className="h-6 w-6 text-gray-800" />
          <h2
            className="text-xl font-bold"
            style={{ fontFamily: '"Caveat", cursive', fontSize: '1.8rem' }}
          >
            Basic Information
          </h2>
        </div>
        <div className="grid md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div>
              <label htmlFor="title" className="block text-sm font-medium mb-1">
                Event Title *
              </label>
              <input
                id="title"
                name="title"
                defaultValue={event.title}
                required
                className="w-full rounded-lg border-2 border-gray-100 bg-background px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary/20 transition-all font-bold"
              />
            </div>

            <div>
              <label htmlFor="category" className="block text-sm font-medium mb-1">
                Category *
              </label>
              <select
                id="category"
                name="category"
                defaultValue={event.category?.id}
                required
                className="w-full rounded-lg border bg-background px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary/20 transition-all"
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.icon} {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="description" className="block text-sm font-medium mb-1">
                Description
              </label>
              <textarea
                id="description"
                name="description"
                defaultValue={event.description}
                rows={5}
                className="w-full rounded-lg border bg-background px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary/20 transition-all resize-none"
                style={{ fontFamily: '"Caveat", cursive', fontSize: '1.25rem' }}
              />
            </div>

            <div>
              <label
                htmlFor="check_in_instructions"
                className="block text-sm font-medium mb-1"
              >
                Check-in Instructions
              </label>
              <textarea
                id="check_in_instructions"
                name="check_in_instructions"
                defaultValue={event.check_in_instructions || ''}
                rows={3}
                placeholder="Where to park, what to bring, who to ask for..."
                className="w-full rounded-lg border bg-background px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary/20 transition-all resize-none"
                style={{ fontFamily: '"Caveat", cursive', fontSize: '1.2rem' }}
              />
              <p className="text-[10px] text-gray-400 mt-1 italic">
                Only visible to ticket holders and hosts
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Cover Image</label>
              <div
                className="group relative h-48 w-full overflow-hidden rounded-xl border-2 border-dashed border-gray-300 transition-all hover:border-primary/50"
                style={{ transform: 'rotate(0.5deg)' }}
              >
                {coverPreview ? (
                  <>
                    <img
                      src={coverPreview}
                      className="h-full w-full object-cover transition-transform group-hover:scale-105"
                    />
                    <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition-opacity group-hover:opacity-100">
                      <label
                        htmlFor="cover_image"
                        className="cursor-pointer rounded-full bg-white px-4 py-2 text-sm font-bold text-gray-900 shadow-xl"
                      >
                        Change Image
                      </label>
                    </div>
                  </>
                ) : (
                  <label
                    htmlFor="cover_image"
                    className="flex h-full w-full cursor-pointer flex-col items-center justify-center gap-2"
                  >
                    <ImageIcon className="h-10 w-10 text-muted-foreground" />
                    <span className="text-sm font-medium text-muted-foreground">
                      Click to upload
                    </span>
                  </label>
                )}
                <input
                  id="cover_image"
                  name="cover_image"
                  type="file"
                  accept="image/*"
                  onChange={handleCoverChange}
                  className="hidden"
                />
              </div>
            </div>

            <div className="space-y-3 bg-blue-50/50 p-4 rounded-xl border border-blue-100">
              <div className="flex items-center gap-2 mb-1">
                <Timer className="h-4 w-4 text-blue-600" />
                <span className="text-xs font-bold text-blue-800 uppercase tracking-wider">
                  Timing details
                </span>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label
                    htmlFor="start_time"
                    className="block text-[10px] font-bold mb-1"
                  >
                    Start
                  </label>
                  <input
                    id="start_time"
                    name="start_time"
                    type="datetime-local"
                    defaultValue={dateToLocalValue(event.start_time)}
                    required
                    className="w-full rounded-lg border bg-background px-3 py-2 text-xs focus:ring-2 focus:ring-primary/20"
                    onChange={(e) => {
                      const startEl = e.target;
                      const endEl = document.getElementById(
                        'end_time',
                      ) as HTMLInputElement;
                      if (startEl.value && endEl && eventDuration > 0) {
                        const newEnd = new Date(
                          new Date(startEl.value).getTime() + eventDuration,
                        );
                        endEl.value = new Date(
                          newEnd.getTime() - newEnd.getTimezoneOffset() * 60000,
                        )
                          .toISOString()
                          .slice(0, 16);
                      }
                    }}
                  />
                </div>
                <div>
                  <label
                    htmlFor="end_time"
                    className="block text-[10px] font-bold mb-1"
                  >
                    End
                  </label>
                  <input
                    id="end_time"
                    name="end_time"
                    type="datetime-local"
                    defaultValue={dateToLocalValue(event.end_time)}
                    required
                    className="w-full rounded-lg border bg-background px-3 py-2 text-xs focus:ring-2 focus:ring-primary/20"
                    onChange={(e) => {
                      const endEl = e.target;
                      const startEl = document.getElementById(
                        'start_time',
                      ) as HTMLInputElement;
                      if (startEl?.value && endEl.value) {
                        const dur =
                          new Date(endEl.value).getTime() -
                          new Date(startEl.value).getTime();
                        if (dur > 0) setEventDuration(dur);
                      }
                    }}
                  />
                </div>
              </div>
              {eventDuration > 0 && (
                <div className="flex flex-col items-center gap-2">
                  <span
                    className="inline-block px-3 py-1 rounded-full bg-blue-100 text-blue-700 font-bold"
                    style={{ fontFamily: '"Caveat", cursive', fontSize: '1rem' }}
                  >
                    Duration: {formatDuration(eventDuration)}
                  </span>
                  <div className="flex items-center gap-1.5 flex-wrap justify-center">
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
                          const startEl = document.getElementById(
                            'start_time',
                          ) as HTMLInputElement;
                          const endEl = document.getElementById(
                            'end_time',
                          ) as HTMLInputElement;
                          if (startEl?.value && endEl) {
                            const newEnd = new Date(
                              new Date(startEl.value).getTime() + preset.ms,
                            );
                            endEl.value = new Date(
                              newEnd.getTime() - newEnd.getTimezoneOffset() * 60000,
                            )
                              .toISOString()
                              .slice(0, 16);
                          }
                        }}
                        className={`px-2 py-0.5 rounded-full text-[9px] font-bold border transition-all ${
                          eventDuration === preset.ms
                            ? 'bg-blue-600 text-white border-blue-600'
                            : 'bg-white text-blue-600 border-blue-200 hover:border-blue-400'
                        }`}
                      >
                        {preset.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Generate more dates */}
              {event?.series && (
                <div className="mt-4 pt-4 border-t border-blue-100">
                  <label className="block text-[10px] font-bold mb-1 uppercase tracking-wider text-blue-800">
                    Generate Until Date
                  </label>
                  <input
                    type="date"
                    value={generateUntil}
                    onChange={(e) => setGenerateUntil(e.target.value)}
                    className="w-full rounded-lg border bg-background px-3 py-2 text-xs focus:ring-2 focus:ring-primary/20"
                  />
                  {previewDates.length > 0 && (
                    <div className="mt-2 p-2 bg-blue-100/50 rounded-lg border border-blue-200">
                      <p className="text-[10px] font-bold text-blue-800 mb-1">
                        WILL GENERATE {previewDates.length} INSTANCES:
                      </p>
                      <div className="max-h-24 overflow-y-auto space-y-1">
                        {previewDates.map((d: any, idx) => (
                          <div
                            key={idx}
                            className="text-[10px] text-blue-700 flex justify-between"
                          >
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
          </div>
        </div>
      </div>

      {/* Location Card */}
      <div
        className="bg-white border-2 border-gray-800 p-6 shadow-[3px_4px_0px_#333] relative"
        style={{ transform: 'rotate(0.2deg)' }}
      >
        <div className="flex items-center justify-between mb-6 border-b-2 border-gray-800 pb-2 border-dashed">
          <div className="flex items-center gap-2">
            <MapPin className="h-6 w-6 text-gray-800" />
            <h2
              className="text-xl font-bold"
              style={{ fontFamily: '"Caveat", cursive', fontSize: '1.8rem' }}
            >
              Location
            </h2>
          </div>
          <div className="flex rounded-full bg-gray-100 p-1 border border-gray-200">
            <button
              type="button"
              onClick={() => setLocationMode('offline')}
              className={`px-4 py-1 rounded-full text-xs font-bold transition-all ${
                locationMode === 'offline'
                  ? 'bg-white shadow-[1px_1px_0px_#333] border-2 border-gray-800'
                  : 'text-gray-500 hover:text-gray-800'
              }`}
            >
              In Person
            </button>
            <button
              type="button"
              onClick={() => setLocationMode('online')}
              className={`px-4 py-1 rounded-full text-xs font-bold transition-all ${
                locationMode === 'online'
                  ? 'bg-white shadow-[1px_1px_0px_#333] border-2 border-gray-800'
                  : 'text-gray-500 hover:text-gray-800'
              }`}
            >
              Online
            </button>
          </div>
        </div>

        {locationMode === 'offline' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <label
                  htmlFor="location_name"
                  className="block text-sm font-medium mb-1"
                >
                  Venue Name *
                </label>
                <div className="relative">
                  <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <input
                    id="location_name"
                    name="location_name"
                    ref={locationNameRef}
                    defaultValue={
                      event.location_address !== 'Online Event'
                        ? event.location_name || ''
                        : ''
                    }
                    placeholder="E.g. Central Park"
                    className="w-full rounded-lg border bg-background pl-10 pr-4 py-2.5 text-sm focus:ring-2 focus:ring-primary/20 transition-all font-bold"
                  />
                </div>
              </div>
            </div>
            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label
                    htmlFor="location_address"
                    className="block text-sm font-medium"
                  >
                    Street Address
                  </label>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={handleUseCurrentLocation}
                    disabled={isDetectingLocation}
                    className="h-6 px-2 text-[10px] font-bold text-blue-600 hover:bg-blue-50"
                  >
                    <LocateFixed className="h-3.5 w-3.5 mr-1.5" />
                    {isDetectingLocation ? 'Detecting...' : '📍 Find My Location'}
                  </Button>
                </div>
                <input
                  id="location_address"
                  name="location_address"
                  ref={locationAddressRef}
                  defaultValue={
                    event.location_address !== 'Online Event'
                      ? event.location_address || ''
                      : ''
                  }
                  placeholder="Full street address"
                  className="w-full rounded-lg border bg-background px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary/20 transition-all"
                />
              </div>
              <input type="hidden" name="latitude" value={latitude} />
              <input type="hidden" name="longitude" value={longitude} />
              {latitude && longitude && (
                <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                  <span className="inline-block w-2 h-2 rounded-full bg-green-500" />
                  Coordinates set ({latitude}, {longitude})
                </p>
              )}
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Meeting URL *</label>
              <div className="relative">
                <Link2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input
                  value={onlineUrl}
                  onChange={(e) => setOnlineUrl(e.target.value)}
                  placeholder="https://zoom.us/j/... or meet.google.com/..."
                  className="w-full rounded-lg border bg-background pl-10 pr-4 py-2.5 text-sm focus:ring-2 focus:ring-primary/20 transition-all"
                />
              </div>
              {/* hidden fields so form submission includes location */}
              <input
                type="hidden"
                name="location_name"
                value={onlineUrl || 'Online Event'}
              />
              <input type="hidden" name="location_address" value="Online Event" />
            </div>

            {/* Detected platform */}
            {onlineUrl && (
              <div className="flex items-center gap-3 p-3 rounded-lg bg-white border-2 border-dashed border-gray-300">
                <span className="text-2xl">{detectPlatform(onlineUrl).icon}</span>
                <div>
                  <p
                    className="text-sm font-bold"
                    style={{
                      fontFamily: '"Caveat", cursive',
                      fontSize: '1.1rem',
                    }}
                  >
                    {detectPlatform(onlineUrl).name}
                  </p>
                  <a
                    href={onlineUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-blue-600 hover:underline flex items-center gap-1"
                  >
                    <ExternalLink className="h-3 w-3" /> Open link
                  </a>
                </div>
              </div>
            )}

            {/* Platform suggestions */}
            <div className="flex flex-wrap gap-2">
              {[
                { name: 'Zoom', icon: '🎥', prefix: 'https://zoom.us/j/' },
                {
                  name: 'Google Meet',
                  icon: '🟢',
                  prefix: 'https://meet.google.com/',
                },
                {
                  name: 'Teams',
                  icon: '🟦',
                  prefix: 'https://teams.microsoft.com/l/meetup-join/',
                },
                { name: 'Discord', icon: '🎮', prefix: 'https://discord.gg/' },
              ].map((p) => (
                <button
                  key={p.name}
                  type="button"
                  onClick={() => {
                    if (!onlineUrl) setOnlineUrl(p.prefix);
                  }}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-full border text-xs font-medium bg-white hover:bg-gray-50 transition-colors"
                >
                  <span>{p.icon}</span> {p.name}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Tickets Card */}
      <div
        className="bg-[#f0f9ff] border-2 border-gray-800 p-6 shadow-[3px_4px_0px_#333] relative mb-8"
        style={{ transform: 'rotate(-0.25deg)' }}
      >
        <div className="flex items-center gap-2 mb-6 border-b-2 border-gray-800 pb-2 border-dashed">
          <Ticket className="h-6 w-6 text-gray-800" />
          <h2
            className="text-xl font-bold"
            style={{ fontFamily: '"Caveat", cursive', fontSize: '1.8rem' }}
          >
            Tickets & Capacity
          </h2>
        </div>
        <div className="grid md:grid-cols-3 gap-6">
          <div>
            <label htmlFor="capacity" className="block text-sm font-medium mb-1">
              Total Event Capacity
            </label>
            <div className="relative">
              <Users className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                id="capacity"
                name="capacity"
                type="number"
                value={capacity}
                onChange={(e) => setCapacity(e.target.value)}
                placeholder="Unlimited"
                className="w-full rounded-lg border bg-background pl-10 pr-4 py-2.5 text-sm focus:ring-2 focus:ring-primary/20 transition-all font-mono"
              />
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Leave empty for unlimited
            </p>
          </div>
        </div>

        {/* ═══ Event Features / Tablets ═══ */}
        <div className="mt-8 border-t-2 border-dashed border-gray-800 pt-6">
          <div className="flex items-center gap-2 mb-4">
            <span className="text-xl">🏷️</span>
            <h3
              className="text-lg font-bold"
              style={{ fontFamily: '"Permanent Marker", cursive' }}
            >
              Event Features
            </h3>
          </div>
          <p
            className="text-sm text-gray-500 mb-4"
            style={{ fontFamily: '"Caveat", cursive', fontSize: '1rem' }}
          >
            Select what your event offers, then tag each as Featured, Additional, or
            Extra
          </p>

          {/* Feature Tag Legend */}
          <div className="flex flex-wrap gap-2 mb-4">
            {(
              Object.entries(TAG_COLORS) as [
                FeatureTag,
                (typeof TAG_COLORS)[FeatureTag],
              ][]
            ).map(([tag, cfg]) => (
              <span
                key={tag}
                className="px-2 py-0.5 text-xs font-bold rounded-full border"
                style={{
                  backgroundColor: cfg.bg,
                  borderColor: cfg.border,
                  color: cfg.text,
                }}
              >
                {cfg.emoji} {cfg.label}
              </span>
            ))}
          </div>

          {/* Feature Grid */}
          <div className="flex flex-wrap gap-2 mb-6">
            {FEATURE_ITEMS.map((item) => {
              const selected = eventFeatures.find((f) => f.name === item.name);
              return (
                <div key={item.name} className="relative">
                  <button
                    type="button"
                    onClick={() => {
                      if (selected) {
                        setEventFeatures(
                          eventFeatures.filter((f) => f.name !== item.name),
                        );
                      } else {
                        setEventFeatures([
                          ...eventFeatures,
                          { name: item.name, tag: 'featured' },
                        ]);
                      }
                    }}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border-2 text-sm font-medium transition-all ${
                      selected
                        ? 'shadow-[1px_2px_0px_#333] font-bold scale-105'
                        : 'border-gray-300 bg-white text-gray-600 hover:border-gray-500 hover:bg-gray-50'
                    }`}
                    style={
                      selected
                        ? {
                            backgroundColor: TAG_COLORS[selected.tag].bg,
                            borderColor: TAG_COLORS[selected.tag].border,
                            color: TAG_COLORS[selected.tag].text,
                          }
                        : undefined
                    }
                  >
                    <span>{item.emoji}</span>
                    <span>{item.name}</span>
                    {selected && <span className="text-xs ml-0.5">✓</span>}
                  </button>

                  {/* Tag selector dropdown for selected items */}
                  {selected && (
                    <div className="absolute -bottom-7 left-1/2 -translate-x-1/2 flex gap-0.5 z-10">
                      {(Object.keys(TAG_COLORS) as FeatureTag[]).map((tag) => (
                        <button
                          key={tag}
                          type="button"
                          onClick={() => {
                            setEventFeatures(
                              eventFeatures.map((f) =>
                                f.name === item.name ? { ...f, tag } : f,
                              ),
                            );
                          }}
                          className={`w-5 h-5 rounded-full border-2 flex items-center justify-center text-[8px] transition-all ${
                            selected.tag === tag
                              ? 'scale-125 ring-1 ring-offset-1'
                              : 'opacity-60 hover:opacity-100'
                          }`}
                          style={{
                            backgroundColor: TAG_COLORS[tag].bg,
                            borderColor: TAG_COLORS[tag].border,
                          }}
                          title={TAG_COLORS[tag].label}
                        >
                          {TAG_COLORS[tag].emoji}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Selected summary */}
          {eventFeatures.length > 0 && (
            <div className="bg-yellow-50/80 border border-yellow-200 rounded-lg p-3 mt-6">
              <p
                className="text-xs font-semibold text-gray-700 mb-2"
                style={{ fontFamily: '"Permanent Marker", cursive' }}
              >
                Selected ({eventFeatures.length})
              </p>
              <div className="flex flex-wrap gap-1">
                {eventFeatures.map((f) => (
                  <span
                    key={f.name}
                    className="px-2 py-0.5 text-xs rounded-full border font-medium"
                    style={{
                      backgroundColor: TAG_COLORS[f.tag].bg,
                      borderColor: TAG_COLORS[f.tag].border,
                      color: TAG_COLORS[f.tag].text,
                    }}
                  >
                    {FEATURE_ITEMS.find((i) => i.name === f.name)?.emoji} {f.name}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="mt-8 border-t-2 border-dashed border-gray-800 pt-6">
          <div className="flex justify-between items-center mb-4">
            <h3
              className="text-lg font-bold"
              style={{ fontFamily: '"Permanent Marker", cursive' }}
            >
              Custom Ticket Tiers
            </h3>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="border-2 border-gray-800 hover:bg-white shadow-[1px_1px_0px_#333]"
              onClick={() => {
                setTicketTiers([
                  ...ticketTiers,
                  {
                    name: 'New Tier',
                    price: '0',
                    is_refundable: false,
                    description: '',
                    admits: 1,
                  },
                ]);
              }}
            >
              + Add Selection
            </Button>
          </div>

          <div className="space-y-4">
            {ticketTiers.map((tier, index) => (
              <div
                key={index}
                className="bg-white border-2 border-gray-800 p-4 rounded-lg relative flex flex-col md:flex-row gap-4 shadow-[2px_2px_0px_#333]"
              >
                <button
                  type="button"
                  onClick={() => {
                    const newTiers = [...ticketTiers];
                    newTiers.splice(index, 1);
                    setTicketTiers(newTiers);
                  }}
                  className="absolute -top-3 -right-3 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center border-2 border-gray-800 hover:bg-red-600 shadow-[1px_1px_0px_#333]"
                >
                  &times;
                </button>

                {/* Left: Basics */}
                <div className="flex-1 space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold mb-1">Pass Name</label>
                      <input
                        type="text"
                        value={tier.name}
                        onChange={(e) => {
                          const newTiers = [...ticketTiers];
                          newTiers[index].name = e.target.value;
                          setTicketTiers(newTiers);
                        }}
                        className="w-full border-b-2 border-gray-800 bg-transparent px-1 py-1 focus:outline-none focus:border-blue-500 font-medium"
                        placeholder="e.g. VIP Pass"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold mb-1">Price ($)</label>
                      <input
                        type="number"
                        step="0.01"
                        value={tier.price}
                        onChange={(e) => {
                          const newTiers = [...ticketTiers];
                          newTiers[index].price = e.target.value;
                          setTicketTiers(newTiers);
                        }}
                        className="w-full border-b-2 border-gray-800 bg-transparent px-1 py-1 focus:outline-none focus:border-blue-500 font-mono"
                        placeholder="0.00"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold mb-1 text-gray-600">
                      Short Description
                    </label>
                    <input
                      type="text"
                      value={tier.description || ''}
                      onChange={(e) => {
                        const newTiers = [...ticketTiers];
                        newTiers[index].description = e.target.value;
                        setTicketTiers(newTiers);
                      }}
                      className="w-full text-sm border-b border-dashed border-gray-400 bg-transparent px-1 py-1 focus:outline-none focus:border-blue-500 italic"
                      placeholder="What does this ticket include?"
                    />
                  </div>
                </div>

                {/* Right: Advanced */}
                <div className="flex-1 space-y-3 bg-gray-50 p-2 rounded border border-gray-200">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-gray-600 mb-1">
                        Admits (People)
                      </label>
                      <input
                        type="number"
                        min="1"
                        value={tier.admits || 1}
                        onChange={(e) => {
                          const newTiers = [...ticketTiers];
                          newTiers[index].admits = parseInt(e.target.value) || 1;
                          setTicketTiers(newTiers);
                        }}
                        className="w-full border border-gray-300 rounded px-2 py-1 text-sm bg-white"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-600 mb-1">
                        Max Passes limit
                      </label>
                      <input
                        type="number"
                        value={tier.capacity === null ? '' : tier.capacity}
                        onChange={(e) => {
                          const newTiers = [...ticketTiers];
                          newTiers[index].capacity =
                            e.target.value === ''
                              ? undefined
                              : parseInt(e.target.value);
                          setTicketTiers(newTiers);
                        }}
                        className="w-full border border-gray-300 rounded px-2 py-1 text-sm bg-white"
                        placeholder="No limit"
                      />
                    </div>
                  </div>

                  <div className="pt-2 flex items-center gap-3 border-t border-gray-200">
                    <label className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={tier.is_refundable}
                        onChange={(e) => {
                          const newTiers = [...ticketTiers];
                          newTiers[index].is_refundable = e.target.checked;
                          setTicketTiers(newTiers);
                        }}
                        className="rounded bg-gray-200 border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      Refundable
                    </label>

                    {tier.is_refundable && (
                      <div className="flex-1 flex items-center gap-2">
                        <span className="text-xs text-gray-500">Refund %</span>
                        <input
                          type="number"
                          min="1"
                          max="100"
                          value={tier.refund_percentage || 100}
                          onChange={(e) => {
                            const newTiers = [...ticketTiers];
                            newTiers[index].refund_percentage =
                              parseInt(e.target.value) || 100;
                            setTicketTiers(newTiers);
                          }}
                          className="w-16 border border-gray-300 rounded px-1 text-sm"
                        />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}

            {ticketTiers.length === 0 && (
              <div className="text-center py-6 text-gray-500 italic bg-white/50 border border-dashed border-gray-300 rounded">
                No ticket tiers created. Event will be free entry.
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="flex items-center justify-end gap-6 pt-2 sticky bottom-6 z-10">
        {event?.series && (
          <label className="flex items-center gap-3 cursor-pointer group bg-white/80 backdrop-blur-sm px-4 py-2 rounded-full border-2 border-gray-800 shadow-[2px_2px_0px_#333] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[1px_1px_0px_#333] transition-all">
            <input
              type="checkbox"
              checked={applyToSeries}
              onChange={(e) => setApplyToSeries(e.target.checked)}
              className="w-5 h-5 rounded border-2 border-gray-800 text-yellow-500 focus:ring-yellow-500 cursor-pointer"
            />
            <span
              className="font-bold text-gray-800 select-none"
              style={{ fontFamily: '"Permanent Marker", cursive' }}
            >
              Apply to entire series
            </span>
          </label>
        )}
        <Button
          type="submit"
          size="lg"
          disabled={isSubmitting}
          className="border-2 border-gray-800 bg-yellow-300 text-gray-900 shadow-[2px_3px_0px_#333] hover:bg-yellow-400 hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[1px_1px_0px_#333] transition-all font-bold px-8"
          style={{
            fontFamily: '"Permanent Marker", cursive',
            fontSize: '1.1rem',
          }}
        >
          {isSubmitting ? 'Saving...' : 'Save All Changes'}
        </Button>
      </div>
    </form>
  );
};
