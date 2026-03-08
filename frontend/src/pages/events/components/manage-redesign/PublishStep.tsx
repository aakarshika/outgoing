import React from 'react';
import { Rocket } from 'lucide-react';
import { EventDetail } from '@/types/events';
import { useTransitionEventLifecycle } from '@/features/events/hooks';
import { toast } from 'sonner';

interface PublishStepProps {
    event: EventDetail;
    readonly?: boolean;
}

export function PublishStep({ event, readonly }: PublishStepProps) {
    const transitionLifecycle = useTransitionEventLifecycle();

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
                <div className={`p-4 rounded-full border-2 border-gray-800 mb-4 ${isPublished ? 'bg-green-100' : 'bg-gray-100'}`}>
                    <Rocket className={`h-12 w-12 ${isPublished ? 'text-green-600' : 'text-gray-400'}`} />
                </div>

                <h2
                    className="text-2xl mb-2 text-gray-900"
                    style={{ fontFamily: '"Permanent Marker", cursive' }}
                >
                    {isPublished ? 'Already Published!' : 'Ready to go live?'}
                </h2>

                <p
                    className="text-gray-600 mb-8 max-w-md"
                    style={{ fontFamily: '"Caveat", cursive', fontSize: '1.2rem' }}
                >
                    {isPublished
                        ? "Your event is out there for the world to see! You can still edit details if needed."
                        : "Once you publish, your event will be visible to everyone on the platform. Make sure your basic details are all set!"
                    }
                </p>

                {!isPublished && !readonly && (
                    <button
                        onClick={handlePublish}
                        disabled={transitionLifecycle.isPending}
                        className="px-8 py-3 bg-yellow-300 border-2 border-gray-800 shadow-[4px_4px_0px_#333] font-bold text-lg hover:-translate-y-[1px] hover:shadow-[5px_5px_0px_#333] transition-all disabled:opacity-50"
                        style={{ fontFamily: '"Permanent Marker", cursive' }}
                    >
                        {transitionLifecycle.isPending ? 'Publishing...' : 'Publish Event Now'}
                    </button>
                )}

                {isPublished && (
                    <div className="px-6 py-2 bg-green-50 border-2 border-green-200 text-green-700 font-bold rounded-full">
                        Status: {event.lifecycle_state.toUpperCase()}
                    </div>
                )}
            </div>
        </div>
    );
}
