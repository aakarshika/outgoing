/** Create Event page — form for creating a new event. */

import { ArrowLeft, ImagePlus, LocateFixed, Repeat } from 'lucide-react';
import { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { createEvent } from '@/features/events/api';
import { useCategories } from '@/features/events/hooks';
import {
  canUseBrowserGeolocation,
  getCurrentCoordinates,
  reverseGeocodeCoordinates,
} from '@/utils/geolocation';
import { compressImage } from '@/utils/image';

export default function CreateEventPage() {
  const navigate = useNavigate();
  const { data: catResponse } = useCategories();
  const categories = catResponse?.data || [];
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDetectingLocation, setIsDetectingLocation] = useState(false);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const [latitude, setLatitude] = useState<string>('');
  const [longitude, setLongitude] = useState<string>('');
  const locationNameRef = useRef<HTMLInputElement>(null);
  const locationAddressRef = useRef<HTMLInputElement>(null);

  // Recurrence logic
  const [isRecurring, setIsRecurring] = useState(false);
  const [freq, setFreq] = useState<'DAILY' | 'WEEKLY' | 'MONTHLY'>('WEEKLY');
  const [days, setDays] = useState<string[]>(['MO']);
  const [generateCount, setGenerateCount] = useState('4');

  const dayOptions = [
    { value: 'MO', label: 'Mon' },
    { value: 'TU', label: 'Tue' },
    { value: 'WE', label: 'Wed' },
    { value: 'TH', label: 'Thu' },
    { value: 'FR', label: 'Fri' },
    { value: 'SA', label: 'Sat' },
    { value: 'SU', label: 'Sun' },
  ];

  const handleDayToggle = (day: string) => {
    setDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day],
    );
  };

  const buildRrule = () => {
    if (freq === 'WEEKLY') {
      const dayStr = days.length > 0 ? days.join(',') : 'MO';
      return `FREQ=WEEKLY;BYDAY=${dayStr}`;
    }
    return `FREQ=${freq}`;
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);

    const form = e.currentTarget;
    const formData = new FormData(form);

    // Avoid sending empty strings for optional numeric fields.
    [
      'latitude',
      'longitude',
      'ticket_price_standard',
      'ticket_price_flexible',
      'capacity',
    ].forEach((field) => {
      if (!String(formData.get(field) || '').trim()) {
        formData.delete(field);
      }
    });

    // Handle cover image separately if present
    const coverInput = form.querySelector<HTMLInputElement>('#cover_image');
    if (coverInput?.files?.[0]) {
      try {
        const compressedFile = await compressImage(coverInput.files[0], {
          newFileName: 'event_cover',
        });
        formData.set('cover_image', compressedFile);
      } catch (err) {
        console.error('Image compression failed', err);
        formData.set('cover_image', coverInput.files[0]);
      }
    }

    if (isRecurring) {
      if (freq === 'WEEKLY' && days.length === 0) {
        toast.error('Please select at least one day for weekly recurrence.');
        setIsSubmitting(false);
        return;
      }
      formData.set('is_recurring', 'true');
      formData.set('recurrence_rule', buildRrule());
      formData.set('generate_count', generateCount);
    }

    try {
      const result = await createEvent(formData);
      toast.success('Event created!');
      navigate(`/events/${result.data.id}`);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to create event');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCoverChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => setCoverPreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleUseCurrentLocation = async () => {
    if (!canUseBrowserGeolocation()) {
      toast.error('Location needs HTTPS in production. It should work on localhost.');
      return;
    }

    setIsDetectingLocation(true);
    try {
      const coords = await getCurrentCoordinates();
      setLatitude(coords.latitude.toFixed(6));
      setLongitude(coords.longitude.toFixed(6));

      const reverse = await reverseGeocodeCoordinates(
        coords.latitude,
        coords.longitude,
      );
      if (reverse) {
        if (locationNameRef.current) {
          locationNameRef.current.value = reverse.venueName;
        }
        if (locationAddressRef.current) {
          locationAddressRef.current.value = reverse.displayAddress;
        }
        toast.success('Location filled from your current position');
      } else {
        if (locationNameRef.current && !locationNameRef.current.value.trim()) {
          locationNameRef.current.value = 'Current Location';
        }
        toast.success('Coordinates added. You can edit venue/address manually.');
      }
    } catch (err: any) {
      const message =
        err?.code === 1
          ? 'Location permission was denied.'
          : 'Could not access your location right now.';
      toast.error(message);
    } finally {
      setIsDetectingLocation(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl px-4 sm:px-6 py-8">
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors"
      >
        <ArrowLeft className="h-4 w-4" /> Back
      </button>

      <h1 className="text-2xl font-bold text-foreground mb-6">Create Event</h1>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Cover Image */}
        <div>
          <label className="block text-sm font-medium mb-2">Cover Image</label>
          <label
            htmlFor="cover_image"
            className="flex flex-col items-center justify-center h-48 rounded-xl border-2 border-dashed cursor-pointer hover:border-primary/50 transition-colors overflow-hidden"
          >
            {coverPreview ? (
              <img
                src={coverPreview}
                alt="Cover preview"
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex flex-col items-center gap-2 text-muted-foreground">
                <ImagePlus className="h-8 w-8" />
                <span className="text-sm">Click to upload (max 5 MB)</span>
              </div>
            )}
          </label>
          <input
            id="cover_image"
            name="cover_image"
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={handleCoverChange}
            className="hidden"
          />
        </div>

        {/* Title */}
        <div>
          <label htmlFor="title" className="block text-sm font-medium mb-1">
            Title *
          </label>
          <input
            id="title"
            name="title"
            required
            maxLength={200}
            className="w-full rounded-lg border bg-background px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
            placeholder="Give your event a catchy title"
          />
        </div>

        {/* Category */}
        <div>
          <label htmlFor="category_id" className="block text-sm font-medium mb-1">
            Category *
          </label>
          <select
            id="category_id"
            name="category_id"
            required
            className="w-full rounded-lg border bg-background px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/20"
          >
            <option value="">Select a category</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>
        </div>

        {/* Description */}
        <div>
          <label htmlFor="description" className="block text-sm font-medium mb-1">
            Description *
          </label>
          <textarea
            id="description"
            name="description"
            required
            rows={5}
            className="w-full rounded-lg border bg-background px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/20 resize-none"
            placeholder="Tell people what your event is about..."
          />
        </div>

        {/* Date & Time */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="start_time" className="block text-sm font-medium mb-1">
              Start *
            </label>
            <input
              id="start_time"
              name="start_time"
              type="datetime-local"
              required
              className="w-full rounded-lg border bg-background px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>
          <div>
            <label htmlFor="end_time" className="block text-sm font-medium mb-1">
              End *
            </label>
            <input
              id="end_time"
              name="end_time"
              type="datetime-local"
              required
              className="w-full rounded-lg border bg-background px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>
        </div>

        {/* Location */}
        <div>
          <label htmlFor="location_name" className="block text-sm font-medium mb-1">
            Venue Name *
          </label>
          <input
            id="location_name"
            name="location_name"
            ref={locationNameRef}
            required
            className="w-full rounded-lg border bg-background px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/20"
            placeholder="e.g. Central Park, The Roxy"
          />
        </div>
        <div>
          <div className="mb-1 flex items-center justify-between gap-2">
            <label htmlFor="location_address" className="block text-sm font-medium">
              Address
            </label>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleUseCurrentLocation}
              disabled={isDetectingLocation}
              className="h-8 px-2.5 text-xs"
            >
              <LocateFixed className="h-3.5 w-3.5 mr-1" />
              {isDetectingLocation ? 'Detecting...' : 'Use My Location'}
            </Button>
          </div>
          <input
            id="location_address"
            name="location_address"
            ref={locationAddressRef}
            className="w-full rounded-lg border bg-background px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/20"
            placeholder="Full address (optional)"
          />
        </div>
        <input type="hidden" name="latitude" value={latitude} />
        <input type="hidden" name="longitude" value={longitude} />

        {/* Pricing */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label
              htmlFor="ticket_price_standard"
              className="block text-sm font-medium mb-1"
            >
              Standard Ticket Price
            </label>
            <input
              id="ticket_price_standard"
              name="ticket_price_standard"
              type="number"
              step="0.01"
              min="0"
              className="w-full rounded-lg border bg-background px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/20"
              placeholder="0.00 = Free"
            />
          </div>
          <div>
            <label
              htmlFor="ticket_price_flexible"
              className="block text-sm font-medium mb-1"
            >
              Flexible Ticket Price
            </label>
            <input
              id="ticket_price_flexible"
              name="ticket_price_flexible"
              type="number"
              step="0.01"
              min="0"
              className="w-full rounded-lg border bg-background px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/20"
              placeholder="Leave empty for no flexible option"
            />
          </div>
        </div>

        {/* Capacity */}
        <div>
          <label htmlFor="capacity" className="block text-sm font-medium mb-1">
            Capacity
          </label>
          <input
            id="capacity"
            name="capacity"
            type="number"
            min="1"
            className="w-full rounded-lg border bg-background px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/20"
            placeholder="Leave empty for unlimited"
          />
        </div>

        {/* Status */}
        <div>
          <label htmlFor="status" className="block text-sm font-medium mb-1">
            Status
          </label>
          <select
            id="status"
            name="status"
            className="w-full rounded-lg border bg-background px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/20"
          >
            <option value="draft">Draft (save without publishing)</option>
            <option value="published">Published (visible to everyone)</option>
          </select>
        </div>

        <hr className="border-border my-8" />

        {/* Recurring Form */}
        <div className="space-y-4 rounded-xl border p-4 bg-muted/50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Repeat className="w-5 h-5 text-muted-foreground" />
              <h3 className="font-semibold">Recurring Event</h3>
            </div>
            <label className="flex items-center cursor-pointer">
              <input
                type="checkbox"
                className="sr-only peer"
                checked={isRecurring}
                onChange={(e) => setIsRecurring(e.target.checked)}
              />
              <div className="relative w-11 h-6 bg-muted peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all border peer-checked:bg-primary"></div>
            </label>
          </div>

          {isRecurring && (
            <div className="pt-4 space-y-4 animate-in fade-in slide-in-from-top-2 border-t border-border">
              <div className="space-y-2">
                <label className="block text-sm font-medium">Frequency</label>
                <div className="flex gap-4">
                  {(['DAILY', 'WEEKLY', 'MONTHLY'] as const).map((type) => (
                    <label
                      key={type}
                      className="flex items-center gap-2 cursor-pointer text-sm"
                    >
                      <input
                        type="radio"
                        name="freq"
                        value={type}
                        checked={freq === type}
                        onChange={() => setFreq(type)}
                        className="text-primary focus:ring-primary"
                      />
                      <span className="capitalize">{type.toLowerCase()}</span>
                    </label>
                  ))}
                </div>
              </div>

              {freq === 'WEEKLY' && (
                <div className="space-y-2">
                  <label className="block text-sm font-medium">Repeats On</label>
                  <div className="flex flex-wrap gap-2">
                    {dayOptions.map((day) => (
                      <Button
                        key={day.value}
                        type="button"
                        variant={days.includes(day.value) ? 'default' : 'outline'}
                        size="sm"
                        className="h-8 text-xs px-3"
                        onClick={() => handleDayToggle(day.value)}
                      >
                        {day.label}
                      </Button>
                    ))}
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <label className="block text-sm font-medium">
                  Generate Occurrences
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="1"
                    max="52"
                    value={generateCount}
                    onChange={(e) => setGenerateCount(e.target.value)}
                    className="w-20 rounded-lg border bg-background px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-primary/20"
                  />
                  <span className="text-sm text-muted-foreground">sessions</span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  This dictates how many upcoming sessions are generated to start. The
                  rule:{' '}
                  <strong className="text-foreground">
                    {buildRrule()
                      .replace('FREQ=', 'Repeats ')
                      .replace(';BYDAY=', ' on ')}
                  </strong>
                  .
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Submit */}
        <div className="flex gap-3 pt-4">
          <Button type="submit" disabled={isSubmitting} className="flex-1">
            {isSubmitting ? 'Creating...' : 'Create Event'}
          </Button>
          <Button type="button" variant="outline" onClick={() => navigate(-1)}>
            Cancel
          </Button>
        </div>
      </form>
    </div>
  );
}
