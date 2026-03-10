import { CheckCircle2, ClipboardList } from 'lucide-react';
import React, { useState } from 'react';
import { toast } from 'sonner';

import { useTransitionEventLifecycle, useUpdateEvent } from '@/features/events/hooks';
import { useEventNeeds } from '@/features/needs/hooks';
import { EventDetail } from '@/types/events';

import { CheckInInstructions } from './CheckInInstructions';

interface EventReadinessStepProps {
  event: EventDetail;
  readonly?: boolean;
}

export function EventReadinessStep({ event, readonly }: EventReadinessStepProps) {
  const transitionLifecycle = useTransitionEventLifecycle();
  const { data: needsResponse } = useEventNeeds(event.id);
  const needs = needsResponse?.data || [];

  const isReady =
    event.lifecycle_state === 'event_ready' ||
    event.lifecycle_state === 'live' ||
    event.lifecycle_state === 'completed';

  const isPublished =
    event.lifecycle_state !== 'draft' && event.lifecycle_state !== 'cancelled';
  const capacity = event.capacity || 0;
  const soldCount = event.ticket_count || 0;
  const salesPercentage = capacity > 0 ? (soldCount / capacity) * 100 : 0;
  const isSalesMet = salesPercentage >= 20;

  const filledNeedsCount = needs.filter(
    (n) => n.status === 'filled' || n.status === 'override_filled',
  ).length;
  const areAllNeedsMet = needs.length === 0 || filledNeedsCount === needs.length;

  const canMarkReady = isPublished && isSalesMet && areAllNeedsMet;

  const handleMarkReady = async () => {
    if (!canMarkReady) return;
    try {
      await transitionLifecycle.mutateAsync({
        eventId: event.id,
        toState: 'event_ready',
      });
      toast.success('Event marked as ready!');
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to mark event as ready');
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white border-2 border-gray-800 p-8 shadow-[4px_4px_0px_#333] relative">
        <div className="absolute -top-3 -right-4 w-24 h-6 bg-green-400/40 border border-green-600/20 rotate-12" />

        <h3
          className="text-xl font-bold mb-6 flex items-center gap-2"
          style={{ fontFamily: '"Permanent Marker", cursive' }}
        >
          <CheckCircle2 className="h-6 w-6" /> Final Readiness Check
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="p-4 border-2 border-dashed border-gray-300 rounded-lg space-y-3">
            <div className="flex items-center justify-between">
              <span
                className="font-bold text-gray-700"
                style={{ fontFamily: '"Permanent Marker", cursive' }}
              >
                Step 1: Publish
              </span>
              {isPublished ? (
                <span className="text-green-600 text-[10px] font-bold px-2 py-0.5 bg-green-100 rounded-full border border-green-200">
                  DONE
                </span>
              ) : (
                <span className="text-amber-600 text-[10px] font-bold px-2 py-0.5 bg-amber-100 rounded-full border border-amber-200">
                  PENDING
                </span>
              )}
            </div>
            <p
              className="text-[10px] text-gray-500 italic"
              style={{ fontFamily: '"Caveat", cursive', fontSize: '1rem' }}
            >
              The event must be published before check-in.
            </p>
          </div>

          <div className="p-4 border-2 border-dashed border-gray-300 rounded-lg space-y-3">
            <div className="flex items-center justify-between">
              <span
                className="font-bold text-gray-700"
                style={{ fontFamily: '"Permanent Marker", cursive' }}
              >
                Step 2: Sales
              </span>
              {isSalesMet ? (
                <span className="text-green-600 text-[10px] font-bold px-2 py-0.5 bg-green-100 rounded-full border border-green-200">
                  DONE
                </span>
              ) : (
                <span className="text-amber-600 text-[10px] font-bold px-2 py-0.5 bg-amber-100 rounded-full border border-amber-200">
                  PENDING
                </span>
              )}
            </div>
            <p
              className="text-[10px] text-gray-500 italic"
              style={{ fontFamily: '"Caveat", cursive', fontSize: '1rem' }}
            >
              Min 20% tickets sold ({soldCount}/{capacity}). Now:{' '}
              {salesPercentage.toFixed(0)}%
            </p>
          </div>

          <div className="p-4 border-2 border-dashed border-gray-300 rounded-lg space-y-3">
            <div className="flex items-center justify-between">
              <span
                className="font-bold text-gray-700 flex items-center gap-1.5"
                style={{ fontFamily: '"Permanent Marker", cursive' }}
              >
                Step 3: Needs
              </span>
              {areAllNeedsMet ? (
                <span className="text-green-600 text-[10px] font-bold px-2 py-0.5 bg-green-100 rounded-full border border-green-200">
                  DONE
                </span>
              ) : (
                <span className="text-amber-600 text-[10px] font-bold px-2 py-0.5 bg-amber-100 rounded-full border border-amber-200">
                  PENDING
                </span>
              )}
            </div>
            <p
              className="text-[10px] text-gray-500 italic"
              style={{ fontFamily: '"Caveat", cursive', fontSize: '1rem' }}
            >
              {needs.length === 0
                ? 'No needs defined.'
                : `All services met: ${filledNeedsCount} / ${needs.length} filled`}
            </p>
          </div>
        </div>

        <div className="mb-8 p-4 bg-gray-50 border-2 border-gray-800 shadow-[2px_2px_0px_#333]">
          <CheckInInstructions event={event} readonly={readonly} />
        </div>

        {!isReady && !readonly && (
          <div className="flex flex-col items-center gap-4 border-t-2 border-dashed border-gray-200 pt-8">
            {!canMarkReady && (
              <p
                className="text-red-500 text-sm font-bold animate-pulse text-center"
                style={{ fontFamily: '"Caveat", cursive', fontSize: '1.2rem' }}
              >
                Looks like we're not quite there yet – finish the steps above!
              </p>
            )}
            <button
              onClick={handleMarkReady}
              disabled={transitionLifecycle.isPending || !canMarkReady}
              className={`px-10 py-4 font-bold text-xl border-2 border-gray-800 shadow-[4px_4px_0px_#333] transition-all ${
                !canMarkReady
                  ? 'bg-gray-200 text-gray-400 cursor-not-allowed opacity-70'
                  : 'bg-green-400 hover:-translate-y-[1px] hover:shadow-[5px_5px_0px_#333]'
              }`}
              style={{ fontFamily: '"Permanent Marker", cursive' }}
            >
              {transitionLifecycle.isPending ? 'Sending...' : 'Event is Ready, Send!'}
            </button>
          </div>
        )}

        {isReady && (
          <div className="text-center p-6 bg-green-50 border-2 border-green-200 rounded-lg">
            <p
              className="text-green-700 font-bold italic"
              style={{ fontFamily: '"Caveat", cursive', fontSize: '1.4rem' }}
            >
              All systems go! The event is marked as ready.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
