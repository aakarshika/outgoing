import React from 'react';
import { PartyPopper, Star, Image, XCircle } from 'lucide-react';
import { EventDetail } from '@/types/events';
import { useTransitionEventLifecycle } from '@/features/events/hooks';
import { toast } from 'sonner';

interface WrapUpStepProps {
    event: EventDetail;
    readonly?: boolean;
}

export function WrapUpStep({ event, readonly }: WrapUpStepProps) {
    const transitionLifecycle = useTransitionEventLifecycle();
    const isDraftOrPublished = event?.lifecycle_state === 'draft' || event?.lifecycle_state === 'published' ;
    const isCompleted = event?.lifecycle_state === 'completed';
    const isCancelled = event?.lifecycle_state === 'cancelled';
    const markEnabled = !readonly && isDraftOrPublished && event?.lifecycle_state !== 'event_ready';
    const cancelEnabled = !readonly && !isDraftOrPublished  && event?.lifecycle_state !== 'event_ready';
    const handleComplete = async () => {
        try {
            await transitionLifecycle.mutateAsync({
                eventId: event.id,
                toState: 'completed',
            });
            toast.success('Event marked as completed! 🎉');
        } catch (err: any) {
            toast.error(err?.response?.data?.message || 'Failed to complete event');
        }
    };

    const handleCancel = async () => {
        if (!window.confirm('Are you ABSOLUTELY sure you want to cancel this event? This cannot be undone.')) return;
        try {
            await transitionLifecycle.mutateAsync({
                eventId: event.id,
                toState: 'cancelled',
            });
            toast.success('Event cancelled.');
        } catch (err: any) {
            toast.error(err?.response?.data?.message || 'Failed to cancel event');
        }
    };

    return (
        <div className="space-y-8 pb-12">
            <div className="bg-white border-2 border-gray-800 p-8 shadow-[4px_4px_0px_#333] relative">
                {/* Scrapbook decoration: tape */}
                <div className="absolute -top-3 -left-4 w-32 h-6 bg-blue-200/50 -rotate-6 border-y border-dashed border-blue-400" />

                <div className="flex flex-col items-center text-center">
                    <PartyPopper className="h-16 w-16 text-yellow-500 mb-4" />
                    <h2 className="text-3xl font-black text-gray-900 mb-6" style={{ fontFamily: '"Permanent Marker", cursive' }}>
                        THAT'S A WRAP!
                    </h2>

                        {isCompleted ? null : (<div className="flex flex-wrap justify-center gap-6">
                            {!markEnabled ? (<button
                                onClick={handleComplete}
                                disabled={transitionLifecycle.isPending}
                                className="px-10 py-4 bg-yellow-100 border-2 border-gray-800 shadow-[4px_4px_0px_#333] font-bold text-xl hover:-translate-y-[1px] hover:shadow-[5px_5px_0px_#333] transition-all"
                                style={{ fontFamily: '"Permanent Marker", cursive' }}
                            >
                                MARK AS COMPLETED
                            </button>) : (<button
                                disabled={true}
                                className="px-10 py-4 bg-yellow-100 border-2 border-gray-400 shadow-[4px_4px_0px_#aaa] font-bold text-xl hover:-translate-y-[1px] hover:shadow-[5px_5px_0px_#333] transition-all"
                                style={{ fontFamily: '"Permanent Marker", cursive' , color: '#aaa' }}
                            >
                                MARK AS COMPLETED
                            </button>)}
                            {!cancelEnabled ? (<button
                                onClick={handleCancel}
                                disabled={transitionLifecycle.isPending}
                                className="px-10 py-4 bg-white text-red-600 border-2 border-red-200 shadow-[4px_4px_0px_#fee2e2] font-bold text-xl hover:-translate-y-[1px] hover:shadow-[5px_5px_0px_#fee2e2] transition-all"
                                style={{ fontFamily: '"Permanent Marker", cursive' }}
                            >
                                CANCEL EVENT
                            </button>) : (<button
                                disabled={true}
                                className="px-10 py-4 bg-white text-red-400 border-2 border-red-100 shadow-[4px_4px_0px_#f87171] font-bold text-xl hover:-translate-y-[1px] hover:shadow-[5px_5px_0px_#f87171] transition-all"
                                style={{ fontFamily: '"Permanent Marker", cursive' , color: '#red-400' }}
                            >
                                CANCEL EVENT
                            </button>)}
                        </div>)}
                </div>
            </div>

            {/* Post-Event Actions */}
            <div className="grid md:grid-cols-2 gap-6">
                <a
                    href={`/events/${event?.id}#highlights`}
                    className="bg-white border-2 border-gray-800 p-6 shadow-[3px_4px_0px_#333] hover:-translate-y-1 transition-all group"
                >
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-blue-100 border-2 border-gray-800 rounded group-hover:bg-blue-200 transition-colors">
                            <Image className="h-8 w-8 text-blue-800" />
                        </div>
                        <div>
                            <h3 className="text-xl font-bold" style={{ fontFamily: '"Permanent Marker", cursive' }}>
                                Add Highlights
                            </h3>
                            <p className="text-sm text-gray-500 italic" style={{ fontFamily: '"Caveat", cursive', fontSize: '1.2rem' }}>
                                Share photos and videos with goers
                            </p>
                        </div>
                    </div>
                </a>

                <div className="bg-white border-2 border-gray-800 p-6 shadow-[3px_4px_0px_#333] relative">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-purple-100 border-2 border-gray-800 rounded">
                            <Star className="h-8 w-8 text-purple-800" />
                        </div>
                        <div>
                            <h3 className="text-xl font-bold" style={{ fontFamily: '"Permanent Marker", cursive' }}>
                                Rate Vendors
                            </h3>
                            <p className="text-sm text-gray-500 italic" style={{ fontFamily: '"Caveat", cursive', fontSize: '1.2rem' }}>
                                Leave reviews for your services
                            </p>
                        </div>
                    </div>
                    {/* Placeholder content */}
                    <div className="mt-4 border-t-2 border-dashed border-gray-100 pt-4 text-center text-gray-400 italic" style={{ fontFamily: '"Caveat", cursive', fontSize: '1rem' }}>
                        Rating functionality coming soon...
                    </div>
                </div>
            </div>
        </div>
    );
}
