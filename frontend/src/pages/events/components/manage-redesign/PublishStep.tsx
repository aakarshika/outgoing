import { ArrowRight, Rocket } from 'lucide-react';
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

import { useTransitionEventLifecycle } from '@/features/events/hooks';
import { EventDetail } from '@/types/events';

interface PublishStepProps {
  event: EventDetail;
  readonly?: boolean;
}

export function PublishStep({ event, readonly }: PublishStepProps) {
  const transitionLifecycle = useTransitionEventLifecycle();
  const navigate = useNavigate();
  const navigateToNextStep = () => {
    navigate(`/events/${event.id}/host-event-management/services-prep`);
  };
  const missingBasicInfoFields = [
    { key: 'title', label: 'Event Title', missing: !event.title?.trim() },
    { key: 'category', label: 'Category', missing: !event.category },
    { key: 'location_name', label: 'Location Name', missing: !event.location_name },
    {
      key: 'location_address',
      label: 'Location Address',
      missing: !event.location_address,
    },
    { key: 'start_time', label: 'Start Time', missing: !event.start_time },
    { key: 'end_time', label: 'End Time', missing: !event.end_time },
    { key: 'capacity', label: 'Capacity', missing: !event.capacity },
    {
      key: 'ticket_tiers',
      label: 'Ticket Tiers',
      missing: !event.ticket_tiers || event.ticket_tiers.length === 0,
    },
  ].filter((field) => field.missing);
  const isPublishBlocked = missingBasicInfoFields.length > 0;

  const handlePublish = async () => {
    try {
      await transitionLifecycle.mutateAsync({
        eventId: event.id,
        toState: 'published',
      });
      toast.success('Event published successfully!');
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to publish event');
    }
  };

  const isPublished = event.lifecycle_state !== 'draft';

  return (
    <div className="bg-white border-2 border-gray-800 p-8 shadow-[4px_4px_0px_#333] relative overflow-hidden">
      {/* Scrapbook decoration: tape */}
      <div className="absolute -top-2 -left-8 w-32 h-8 bg-yellow-200/50 -rotate-12 border-y border-dashed border-yellow-400" />

      <div className="relative z-10 flex flex-col items-center text-center">
        <div
          className={`p-4 rounded-full border-2 border-gray-800 mb-4 ${isPublished ? 'bg-green-100' : 'bg-gray-100'}`}
        >
          <Rocket
            className={`h-12 w-12 ${isPublished ? 'text-green-600' : 'text-gray-400'}`}
          />
        </div>

        <h2
          className="text-2xl mb-2 text-gray-900"
          style={{ fontFamily: '"Permanent Marker", cursive' }}
        >
          {isPublished ? 'Hurray! Published!' : 'Ready to go live?'}
        </h2>

        <p
          className="text-gray-600 mb-8 max-w-md"
          style={{ fontFamily: '"Caveat", cursive', fontSize: '1.2rem' }}
        >
          {isPublished
            ? 'Your event is out there for the world to see! You can still edit details if needed.'
            : 'Once you publish, your event will be visible to everyone on the platform. Make sure your basic details are all set!'}
        </p>

        {!isPublished && !readonly && (
          <div className="flex flex-col items-center gap-4 w-full">
            <div className="flex flex-row items-center justify-center gap-4 w-full">
              <button
                onClick={handlePublish}
                disabled={transitionLifecycle.isPending || isPublishBlocked}
                className="px-8 py-3 bg-yellow-300 border-2 border-gray-800 shadow-[4px_4px_0px_#333] font-bold text-lg hover:-translate-y-[1px] hover:shadow-[5px_5px_0px_#333] transition-all disabled:opacity-50 disabled:hover:translate-y-0 disabled:hover:shadow-[4px_4px_0px_#333]"
                style={{ fontFamily: '"Permanent Marker", cursive' }}
              >
                {transitionLifecycle.isPending ? 'Publishing...' : 'Publish Event Now'}
              </button>
              <button
                onClick={navigateToNextStep}
                className="px-8 py-3 border-2 border-gray-800 shadow-[4px_4px_0px_#333] font-bold text-lg hover:-translate-y-[1px] hover:shadow-[5px_5px_0px_#333] transition-all disabled:opacity-50 disabled:hover:translate-y-0 disabled:hover:shadow-[4px_4px_0px_#333]"
                style={{ fontFamily: '"Permanent Marker", cursive' }}
              >
                Skip to PREPERATION
              </button>
            </div>
            {isPublishBlocked && (
              <div className="w-full max-w-md bg-yellow-50 border-2 border-dashed border-yellow-300 p-4 text-left shadow-[2px_2px_0px_#333]">
                <p
                  className="text-sm font-bold text-gray-700 mb-2"
                  style={{ fontFamily: '"Permanent Marker", cursive' }}
                >
                  Complete Basic Information:
                </p>
                <ul className="list-disc list-inside text-sm text-gray-600">
                  {missingBasicInfoFields.map((field) => (
                    <li key={field.key}>{field.label}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {isPublished && (
          <button
            onClick={navigateToNextStep}
            className="px-8 py-3 inline-flex items-center gap-2 border-2 border-gray-800 shadow-[4px_4px_0px_#333] font-bold text-lg hover:-translate-y-[1px] hover:shadow-[5px_5px_0px_#333] transition-all disabled:opacity-50 disabled:hover:translate-y-0 disabled:hover:shadow-[4px_4px_0px_#333]"
            style={{ fontFamily: '"Permanent Marker", cursive' }}
          >
            <ArrowRight className="h-4 w-4" /> Go to PREPERATION
          </button>
        )}
      </div>
    </div>
  );
}
