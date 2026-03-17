import { BadgeCheck } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

import { AttendeePopover, type Attendee } from '@/components/ui/AttendeePopover';
import { UserAvatar } from '@/components/ui/UserAvatar';

interface AttendingListProps {
  attendees: Attendee[];
  isEventOver: boolean;
}

export const AttendingList = ({ attendees, isEventOver }: AttendingListProps) => {
  const [isPaused, setIsPaused] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  if (!attendees || attendees.length === 0) {
    return null;
  }

  const displayAttendees = [...attendees, ...attendees, ...attendees, ...attendees];

  return (
    <div className="relative mt-12">
      <div className="flex items-center">
        <h3
          className="text-2xl text-gray-900  px-4 py-1  transform -rotate-1"
          style={{ fontFamily: '"Permanent Marker", cursive' }}
        >
          {!isEventOver ? 'CHECK OUT WHO\'S GOING' :
            <span>
              the <span className="" style={{ color: 'rgb(216, 90, 48)' }}>Go</span>ers
            </span>}
        </h3>
        <div className="h-0.5 flex-1 bg-gray-800" />
      </div>

      <div
        className="relative overflow-hidden border-b-2 border-gray-800 backdrop-blur-sm"
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
      >
        <div
          className={`flex items-center whitespace-nowrap ${isPaused ? 'pause-scrolling' : 'animate-scroll'}`}
          style={{
            animation:
              attendees.length > 0
                ? `scroll ${attendees.length * 5}s linear infinite`
                : 'none',
            animationPlayState: isPaused ? 'paused' : 'running',
          }}
        >
          {displayAttendees.map((attendee, index) => (
            <AttendeePopover
              key={`${attendee.username}-${index}`}
              attendee={attendee}
              variant="comic"
            >
              <div
                className="group flex items-center p-2 transition-transform hover:-translate-y-1 hover:rotate-1 cursor-pointer"
              >
                <div className="relative">
                  <UserAvatar
                    src={attendee.avatar}
                    username={attendee.username}
                    size="md"
                    borderGradient
                  />
                  {attendee.is_verified && (
                    <BadgeCheck
                      className="absolute -top-1 -right-1 text-blue-500 bg-white rounded-full p-0.5 border-2 border-gray-800"
                      size={16}
                    />
                  )}
                </div>
                <div className="flex flex-col">
                  <span
                    className="font-bold text-gray-900"
                    style={{ fontFamily: '"Caveat", cursive', fontSize: '1.25rem' }}
                  >
                    @{attendee.username}
                  </span>
                  <span
                    className="text-xs text-gray-500 uppercase tracking-widest font-bold"
                    style={{
                      fontFamily: '"Permanent Marker", cursive',
                      fontSize: '0.65rem',
                    }}
                  >
                    Soul Identity
                  </span>
                </div>
              </div>
            </AttendeePopover>
          ))}
        </div>
      </div>

      <style>{`
        @keyframes scroll {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .animate-scroll {
          animation: scroll 30s linear infinite;
        }
        .pause-scrolling {
          animation-play-state: paused;
        }
      `}</style>
    </div>
  );
};
