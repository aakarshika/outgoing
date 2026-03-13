import { LocateFixed, ChevronDown, ChevronUp } from 'lucide-react';
import React, { useEffect, useMemo, useState } from 'react';

import { WhenAndWhereForm } from './WhenAndWhereForm';

import { RecurringForm, RecurringFormProps } from './RecurringForm';
import { ScrapbookInput } from './ui/ScrapbookInput';

export interface WhenAndWhereQuickFormProps extends RecurringFormProps {
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
  stepMode?: 'online-toggle' | 'full';
}

const FULL_DAY_MS = 43200000;

const toLocalInputValue = (date: Date) =>
  new Date(date.getTime() - date.getTimezoneOffset() * 60000)
    .toISOString()
    .slice(0, 16);

export const WhenAndWhereQuickForm: React.FC<WhenAndWhereQuickFormProps> = ({
  event,
  latitude,
  longitude,
  isDetectingLocation,
  locationNameRef,
  locationAddressRef,
  onlineUrl,
  locationMode,
  setLocationMode,
  handleUseCurrentLocation,
  setEventDuration,
  generateUntil,
  setGenerateUntil,
  previewDates,
  readonly = false,
  stepMode = 'full',
  ...recurringProps
}) => {
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [startDate, setStartDate] = useState('');
  const [startTimeValue, setStartTimeValue] = useState('');
  const [endTimeValue, setEndTimeValue] = useState('');

  const toggleOnline = () => {
    if (readonly) return;
    setLocationMode(locationMode === 'online' ? 'offline' : 'online');
  };

  const handleStartDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (readonly) return;
    const value = e.target.value;
    setStartDate(value);
    if (!value) {
      setStartTimeValue('');
      setEndTimeValue('');
      return;
    }
    const [y, m, d] = value.split('-').map((part) => Number(part));
    const start = new Date(y, m - 1, d, 0, 0, 0, 0);
    const end = new Date(y, m - 1, d, 12, 0, 0, 0);
    setStartTimeValue(toLocalInputValue(start));
    setEndTimeValue(toLocalInputValue(end));
    setEventDuration(FULL_DAY_MS);
  };

  const showOfflineFields = locationMode === 'offline';

  useEffect(() => {
    if (!event?.start_time) return;
    const start = new Date(event.start_time);
    if (Number.isNaN(start.getTime())) return;
    const startLocal = new Date(start.getTime() - start.getTimezoneOffset() * 60000);
    setStartDate(startLocal.toISOString().slice(0, 10));
    setStartTimeValue(toLocalInputValue(start));
    if (event?.end_time) {
      const end = new Date(event.end_time);
      if (!Number.isNaN(end.getTime())) {
        setEndTimeValue(toLocalInputValue(end));
        return;
      }
    }
    const defaultEnd = new Date(start);
    defaultEnd.setHours(12, 0, 0, 0);
    setEndTimeValue(toLocalInputValue(defaultEnd));
  }, [event?.start_time, event?.end_time]);

  const locationNameDefault = useMemo(() => {
    if (event?.location_address === 'Online Event') return '';
    return event?.location_name || '';
  }, [event]);

  const locationAddressDefault = useMemo(() => {
    if (event?.location_address === 'Online Event') return '';
    return event?.location_address || '';
  }, [event]);

  useEffect(() => {
    if (!showOfflineFields) return;
    if (locationNameRef.current && locationNameDefault) {
      locationNameRef.current.value = locationNameDefault;
    }
    if (locationAddressRef.current && locationAddressDefault) {
      locationAddressRef.current.value = locationAddressDefault;
    }
  }, [
    locationNameDefault,
    locationAddressDefault,
    showOfflineFields,
    locationNameRef,
    locationAddressRef,
  ]);

  const onlineToggleSection = (
    <div className="flex items-center justify-between">
      <div className="text-[10px] font-bold uppercase tracking-wider text-gray-600 right-0">
        Online
      </div>
      <button
        type="button"
        onClick={toggleOnline}
        disabled={readonly}
        className={`relative h-5 w-10 border transition-all ${locationMode === 'online'
            ? 'bg-blue-600 border-blue-600'
            : 'bg-transparent border-gray-300'
          } ${readonly ? 'opacity-60 cursor-not-allowed' : ''}`}
        aria-pressed={locationMode === 'online'}
        aria-label="Toggle online event"
      >
        <span
          className={`absolute top-0.5 h-4 w-4 rounded-full transition-all ${locationMode === 'online'
              ? 'left-[18px] bg-white'
              : 'left-0.5 bg-gray-400'
            }`}
        />
      </button>
    </div>
  );

  const fullSection = (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div className="text-[10px] font-bold uppercase tracking-wider text-gray-500">
          Basic Timing & Location
        </div>
        <button
          type="button"
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="text-[10px] font-bold text-blue-600 uppercase tracking-wider flex items-center hover:underline"
        >
          {showAdvanced ? 'Hide Advanced' : 'Show Advanced (Precise Time/Recurrence)'}
        </button>
      </div>

      {showAdvanced ? (
        <WhenAndWhereForm
          {...{
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
            readonly,
            ...recurringProps,
          }}
        />
      ) : (
        <>
          {onlineToggleSection}

          <ScrapbookInput
            type="date"
            label="Start Date"
            id="start_date"
            name="start_date"
            value={startDate}
            required
            disabled={readonly}
            onChange={handleStartDateChange}
            style={{ backgroundColor: 'transparent' }}
          />

          <div className="text-[11px] text-gray-600 font-bold uppercase tracking-wider">
            Time: 12:00 AM - 12:00 PM
          </div>
          <div className="text-[11px] text-gray-600 font-bold uppercase tracking-wider">
            Duration: Full Day
          </div>

          <input type="hidden" name="start_time" value={startTimeValue} />
          <input type="hidden" name="end_time" value={endTimeValue} />

          {showOfflineFields ? (
            <>
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
                  label="Location Address"
                  example="123 Park Ave, NY"
                  defaultValue={locationAddressDefault}
                  required
                  disabled={readonly}
                  style={{ backgroundColor: 'transparent' }}
                />
              </div>

              <input
                type="hidden"
                id="location_name"
                name="location_name"
                ref={locationNameRef as any}
                defaultValue={locationNameDefault}
              />

              <input type="hidden" name="latitude" value={latitude} />
              <input type="hidden" name="longitude" value={longitude} />
            </>
          ) : (
            <>
              <input
                type="hidden"
                name="location_name"
                value={onlineUrl || 'Online Event'}
              />
              <input type="hidden" name="location_address" value="Online Event" />
            </>
          )}
        </>
      )}
    </div>
  );

  return (
    <div>
      {stepMode === 'online-toggle' ? onlineToggleSection : fullSection}
    </div>
  );
};
