import { useQueryClient } from '@tanstack/react-query';
import { Info, Menu } from 'lucide-react';
import React, { useState } from 'react';
import { useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { createEvent } from '@/features/events/api';
import { useCategories } from '@/features/events/hooks';
import { BasicDetailsQuickForm } from '@/pages/events/components/manage-redesign/BasicDetailsQuickForm';
import { BasicQuick } from '@/pages/events/components/manage-redesign/BasicQuick';
import { EventFeaturesQuickForm } from '@/pages/events/components/manage-redesign/EventFeaturesQuickForm';
import { TicketTier } from '@/pages/events/components/manage-redesign/TicketsAndCapacityForm';
import { TicketsAndCapacityQuickForm } from '@/pages/events/components/manage-redesign/TicketsAndCapacityQuickForm';
import { WhenAndWhereQuickForm } from '@/pages/events/components/manage-redesign/WhenAndWhereQuickForm';
import { EventFeature } from '@/pages/events/manage/ManageDetailsSection';
import {
  canUseBrowserGeolocation,
  getCurrentCoordinates,
  reverseGeocodeCoordinates,
} from '@/utils/geolocation';
import { compressImage } from '@/utils/image';

export function QuickCreateEventModal({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data: catResponse } = useCategories();
  const categories = catResponse?.data || [];

  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('Join us for a super fun time!');
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [eventId, setEventId] = useState<string | null>(null);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  React.useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Event Features state
  const [eventFeatures, setEventFeatures] = useState<EventFeature[]>([]);

  // Tickets & Capacity state
  const [capacity, setCapacity] = useState('');
  const [ticketTiers, setTicketTiers] = useState<TicketTier[]>([]);

  // Location state
  const [latitude, setLatitude] = useState('');
  const [longitude, setLongitude] = useState('');
  const [isDetectingLocation, setIsDetectingLocation] = useState(false);
  const locationNameRef = useRef<HTMLInputElement>(null);
  const locationAddressRef = useRef<HTMLInputElement>(null);
  const [onlineUrl, setOnlineUrl] = useState('');
  const [locationMode, setLocationMode] = useState<'offline' | 'online'>('offline');

  // Date & Time state
  const [eventDuration, setEventDuration] = useState(0);
  const [generateUntil, setGenerateUntil] = useState('');
  const [previewDates] = useState<any[]>([]);

  // Recurrence state
  const [isRecurring, setIsRecurring] = useState(false);
  const [freq, setFreq] = useState<'DAILY' | 'WEEKLY' | 'MONTHLY'>('WEEKLY');
  const [days, setDays] = useState<string[]>(['MO']);
  const [generateCount, setGenerateCount] = useState('4');

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

  const formRef = useRef<HTMLFormElement>(null);

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
        if (locationNameRef.current) locationNameRef.current.value = reverse.venueName;
        if (locationAddressRef.current)
          locationAddressRef.current.value = reverse.displayAddress;
        toast.success('Location updated from your current position');
      } else {
        if (locationNameRef.current && !locationNameRef.current.value.trim()) {
          locationNameRef.current.value = 'Current Location';
        }
        toast.success('Coordinates updated. You can edit venue/address manually.');
      }
    } catch {
      toast.error('Could not access your location.');
    } finally {
      setIsDetectingLocation(false);
    }
  };

  const dateToLocalValue = (dateStr: string) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return new Date(d.getTime() - d.getTimezoneOffset() * 60000)
      .toISOString()
      .slice(0, 16);
  };

  const handleCoverChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setCoverFile(file);
      const reader = new FileReader();
      reader.onload = () => setCoverPreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleClose = () => {
    setTitle('');
    setCategory('');
    setDescription('Join us for a super fun time!');
    setCoverFile(null);
    setCoverPreview(null);
    setCurrentStep(0);
    setEventId(null);
    onClose();
  };

  const submitEvent = async (
    status: 'draft' | 'published',
    advancedOptions: boolean = false,
  ) => {
    setIsSubmitting(true);
    try {
      const formData = new FormData();
      formData.set('title', title);
      formData.set('category_id', category);
      formData.set('description', description);
      formData.set('status', status);

      if (eventId) formData.set('id', eventId);

      // New fields captured by BasicQuick
      if (capacity) formData.set('capacity', capacity);
      if (eventFeatures.length > 0) {
        formData.set('features', JSON.stringify(eventFeatures));
      }

      // Location handling
      if (locationMode === 'online') {
        formData.set('location_name', onlineUrl || 'Online Event');
        formData.set('location_address', 'Online Event');
      } else {
        formData.set('location_name', locationNameRef.current?.value || '');
        formData.set('location_address', locationAddressRef.current?.value || '');
        if (latitude) formData.set('latitude', latitude);
        if (longitude) formData.set('longitude', longitude);
      }

      // Dates handling
      const formObj = document.getElementById('quick-create-form') as HTMLFormElement;
      if (formObj) {
        const startVal = (formObj.elements.namedItem('start_time') as HTMLInputElement)
          ?.value;
        const endVal = (formObj.elements.namedItem('end_time') as HTMLInputElement)
          ?.value;
        if (startVal) formData.set('start_time', new Date(startVal).toISOString());
        if (endVal) formData.set('end_time', new Date(endVal).toISOString());
      } else if (!eventId) {
        const start = new Date(Date.now() + 24 * 60 * 60 * 1000);
        const end = new Date(Date.now() + 25 * 60 * 60 * 1000);
        formData.set('start_time', start.toISOString());
        formData.set('end_time', end.toISOString());
        if (!formData.get('location_name')) formData.set('location_name', 'TBD');
      }

      if (coverFile) {
        try {
          const compressedFile = await compressImage(coverFile, {
            newFileName: 'event_cover',
          });
          formData.set('cover_image', compressedFile);
        } catch (err) {
          console.error('Image compression failed', err);
          formData.set('cover_image', coverFile);
        }
      }

      let result;
      if (eventId) {
        // Update existing draft if eventId exists
        result = await createEvent(formData);
      } else {
        result = await createEvent(formData);
        setEventId(String(result.data.id));
      }

      if (status === 'published') {
        toast.success('Event published!');
        queryClient.invalidateQueries({ queryKey: ['myEvents'] });
        queryClient.invalidateQueries({ queryKey: ['feed'] });
        handleClose();
        navigate(`/events-new/${result.data.id}`);
      } else {
        if (!isMobile) {
          toast.success('Draft saved!');
          queryClient.invalidateQueries({ queryKey: ['myEvents'] });
          handleClose();
          const mode = advancedOptions ? 'advanced' : 'quick';
          navigate(
            `/events-new/${result.data.id}/manage`,
          );
        }
        return result.data;
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to create event');
      throw err;
    } finally {
      setIsSubmitting(false);
    }
  };

  const bprops = {
    event: null,
    categories,
    coverPreview,
    handleCoverChange,
    title,
    setTitle,
    category,
    setCategory,
    description,
    setDescription,
  };

  const eprops = {
    eventFeatures,
    setEventFeatures,
  };

  const tprops = {
    capacity,
    setCapacity,
    ticketTiers,
    setTicketTiers,
  };

  const wprops = {
    event: null,
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
    isRecurring,
    setIsRecurring,
    freq,
    setFreq,
    days,
    handleDayToggle,
    generateCount,
    setGenerateCount,
    buildRrule,
  };

  const handleNext = async () => {
    if (currentStep === 0) {
      setCurrentStep(1);
    } else if (currentStep === 1) {
      // Save draft on Step 1
      try {
        await submitEvent('draft');
        setCurrentStep(2);
      } catch (err) {
        // Error handled in submitEvent
      }
    } else if (currentStep === 4) {
      setCurrentStep(5);
    } else {
      // For other steps, we can save progress too if needed
      try {
        if (eventId) await submitEvent('draft');
        setCurrentStep((prev) => prev + 1);
      } catch (err) { }
    }
  };

  const handleBack = () => {
    setCurrentStep((prev) => Math.max(0, prev - 1));
  };

  const startDateVal = (
    formRef.current?.elements.namedItem('start_time') as HTMLInputElement
  )?.value;
  const hasDate = !!startDateVal;
  const isLocationValid =
    locationMode === 'online'
      ? true
      : !!(
        locationAddressRef.current &&
        locationAddressRef.current.value.trim().length > 0
      );

  const canSave =
    title.trim().length > 0 && category !== '' && description.trim().length > 0;
  const canPublish = canSave && hasDate && isLocationValid;

  const renderStep = () => {
    switch (currentStep) {
      case 0:
        return (
          <div className="space-y-6 animate-in slide-in-from-bottom duration-300">
            <div
              className="text-2xl font-bold mb-4"
              style={{ fontFamily: '"Permanent Marker", cursive' }}
            >
              Tell us about your event
            </div>
            <BasicDetailsQuickForm
              {...{
                ...bprops,
                coverPreview: null,
                handleCoverChange: () => { },
                description: '', // Not needed in step 0
                setDescription: () => { },
                stepMode: 'names',
              }}
            />
          </div>
        );
      case 1:
        return (
          <div className="space-y-6 animate-in slide-in-from-bottom duration-300">
            <div
              className="text-2xl font-bold mb-4"
              style={{ fontFamily: '"Permanent Marker", cursive' }}
            >
              Add a photo & description
            </div>
            <BasicDetailsQuickForm
              {...{
                ...bprops,
                stepMode: 'photo-desc',
              }}
            />
          </div>
        );
      case 2:
        return (
          <div className="space-y-6 animate-in slide-in-from-bottom duration-300">
            <div
              className="text-2xl font-bold mb-4"
              style={{ fontFamily: '"Permanent Marker", cursive' }}
            >
              Is it online?
            </div>
            <WhenAndWhereQuickForm
              {...{
                ...wprops,
                stepMode: 'online-toggle',
              }}
            />
          </div>
        );
      case 3:
        return (
          <div className="space-y-6 animate-in slide-in-from-bottom duration-300">
            <div
              className="text-2xl font-bold mb-4"
              style={{ fontFamily: '"Permanent Marker", cursive' }}
            >
              Add some features
            </div>
            <EventFeaturesQuickForm {...eprops} />
          </div>
        );
      case 4:
        return (
          <div className="flex flex-col items-center justify-center space-y-6 py-12 animate-in zoom-in duration-500">
            <div className="text-6xl">✨</div>
            <div
              className="text-3xl font-bold text-center"
              style={{ fontFamily: '"Permanent Marker", cursive' }}
            >
              You are ready to plan your event!
            </div>
            <div className="text-gray-600 text-center max-w-sm">
              We've saved your draft. Now let's finalize the details.
            </div>
          </div>
        );
      case 5:
        return (
          <div className="space-y-6 animate-in slide-in-from-bottom duration-300">
            <div
              className="text-2xl font-bold mb-4"
              style={{ fontFamily: '"Permanent Marker", cursive' }}
            >
              Location & Time
            </div>
            <WhenAndWhereQuickForm
              {...{
                ...wprops,
                stepMode: 'full',
              }}
            />
          </div>
        );
      case 6:
        return (
          <div className="space-y-6 animate-in slide-in-from-bottom duration-300">
            <div
              className="text-2xl font-bold mb-4"
              style={{ fontFamily: '"Permanent Marker", cursive' }}
            >
              Capacity & Tickets
            </div>
            <TicketsAndCapacityQuickForm {...tprops} />
          </div>
        );
      case 7:
        return (
          <div className="space-y-8 py-8 animate-in slide-in-from-bottom duration-300">
            <div
              className="text-3xl font-bold text-center mb-8"
              style={{ fontFamily: '"Permanent Marker", cursive' }}
            >
              Ready to go?
            </div>
            <div className="grid grid-cols-1 gap-4">
              <Button
                onClick={() => submitEvent('published')}
                className="h-20 text-xl bg-[#AF90F9] hover:bg-[#9A72F8] text-black border-2 border-gray-800 shadow-[4px_4px_0px_#333]"
                style={{ fontFamily: '"Permanent Marker", cursive' }}
              >
                Publish Now
              </Button>
              <Button
                onClick={() => submitEvent('draft')}
                className="h-20 text-xl bg-white hover:bg-gray-50 text-gray-800 border-2 border-gray-800 shadow-[4px_4px_0px_#333]"
                style={{ fontFamily: '"Permanent Marker", cursive' }}
              >
                Finish Preparing
              </Button>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent
        className={`border-none bg-[#f4f2f9ff] shadow-none ${isMobile ? 'inset-0 w-screen h-screen max-w-none rounded-none' : 'max-w-4xl w-[95vw]'}`}
      >
        <form id="quick-create-form" className="h-full flex flex-col">
          <DialogHeader className="sr-only">
            <DialogTitle>Create New Event</DialogTitle>
            <DialogDescription>
              Quickly create a new event draft or publish immediately.
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto px-4 py-6 hide-scrollbar">
            {isMobile ? (
              <div className="min-h-full flex flex-col">
                <div className="flex-1">{renderStep()}</div>
              </div>
            ) : (
              <>
                <BasicQuick
                  props={bprops}
                  eprops={eprops}
                  tprops={tprops}
                  wprops={wprops}
                />

                <div className="flex items-start gap-2 text-sm text-gray-800 mt-4 mr-2 bg-yellow-100 p-3 rounded-md border-2 border-gray-800 shadow-[2px_2px_0px_#333]">
                  <Info size={18} className="mt-0.5 shrink-0 text-gray-800" />
                  <div
                    style={{ fontFamily: '"Permanent Marker", cursive' }}
                    className="leading-snug"
                  >
                    Access the events you manage from{' '}
                    <span className="text-black bg-white px-1 border border-gray-800 rounded mx-1">
                      <Menu size={14} className="inline mb-0.5" /> Menu
                    </span>{' '}
                    &gt;{' '}
                    <span className="text-black highlight-text inline-block">
                      My Events
                    </span>
                    .
                    <br />
                    Next steps:{' '}
                    <span className="text-black underline decoration-wavy decoration-2 decoration-[#AF90F9] underline-offset-4">
                      Prepare &gt; Live &gt; Done
                    </span>
                  </div>
                </div>
              </>
            )}
          </div>

          <div
            className={`px-4 py-4 border-t-2 border-gray-200 flex ${isMobile ? 'justify-between' : 'justify-end gap-3'}`}
          >
            {isMobile ? (
              <>
                {currentStep > 0 && currentStep !== 4 && (
                  <Button
                    variant="outline"
                    type="button"
                    onClick={handleBack}
                    className="bg-white text-gray-800 border-2 border-gray-800 font-bold px-8 shadow-[2px_2px_0px_#333]"
                    style={{ fontFamily: '"Permanent Marker", cursive' }}
                  >
                    Back
                  </Button>
                )}
                {currentStep < 7 && (
                  <Button
                    type="button"
                    onClick={handleNext}
                    disabled={
                      isSubmitting || (currentStep === 0 && (!title || !category))
                    }
                    className="ml-auto bg-[#AF90F9] text-black border-2 border-gray-800 font-bold px-8 shadow-[2px_2px_0px_#333]"
                    style={{ fontFamily: '"Permanent Marker", cursive' }}
                  >
                    {isSubmitting
                      ? 'Saving...'
                      : currentStep === 4
                        ? 'Continue'
                        : 'Next'}
                  </Button>
                )}
              </>
            ) : (
              <>
                <Button
                  variant="outline"
                  type="button"
                  onClick={handleClose}
                  disabled={isSubmitting}
                  className="bg-white hover:bg-gray-100 text-gray-800 font-bold border-2 border-gray-800 shadow-[2px_2px_0px_#333] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[1px_1px_0px_#333]"
                  style={{ fontFamily: '"Permanent Marker", cursive' }}
                >
                  Cancel
                </Button>
                <Button
                  variant="outline"
                  type="button"
                  onClick={() => submitEvent('draft', true)}
                  disabled={!canSave || isSubmitting}
                  className="bg-blue-100 hover:bg-blue-200 text-gray-800 font-bold border-2 border-gray-800 shadow-[2px_2px_0px_#333] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[1px_1px_0px_#333] disabled:opacity-50"
                  style={{ fontFamily: '"Permanent Marker", cursive' }}
                >
                  Advanced Event Options
                </Button>
                <Button
                  variant="outline"
                  type="button"
                  onClick={() => submitEvent('draft')}
                  disabled={!canSave || isSubmitting}
                  className="bg-yellow-100 hover:bg-yellow-200 text-gray-800 font-bold border-2 border-gray-800 shadow-[2px_2px_0px_#333] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[1px_1px_0px_#333] disabled:opacity-50"
                  style={{ fontFamily: '"Permanent Marker", cursive' }}
                >
                  Save as Draft
                </Button>
                <Button
                  type="button"
                  onClick={() => submitEvent('published')}
                  disabled={!canPublish || isSubmitting}
                  className="bg-[#AF90F9] hover:bg-[#9A72F8] text-black font-bold border-2 border-gray-800 shadow-[2px_2px_0px_#333] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[1px_1px_0px_#333] disabled:opacity-50"
                  style={{ fontFamily: '"Permanent Marker", cursive' }}
                >
                  Publish Event
                </Button>
              </>
            )}
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
