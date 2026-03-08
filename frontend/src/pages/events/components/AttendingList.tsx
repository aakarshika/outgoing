import { BadgeCheck } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

import { UserAvatar } from '@/components/ui/UserAvatar';

interface Attendee {
  username: string;
  avatar: string | null;
  is_verified: boolean;
}

interface AttendingListProps {
  attendees: Attendee[];
}

export const AttendingList = ({ attendees }: AttendingListProps) => {
  const [isPaused, setIsPaused] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  if (!attendees || attendees.length === 0) {
    return null;
  }

  // Duplicate the list even more to ensure a continuous loop for small lists
  const displayAttendees = [...attendees, ...attendees, ...attendees, ...attendees];

  return (
    <div className="relative mt-12 mb-8">
      {/* Comic book themed header */}
      <div className="flex items-center gap-4 mb-4">
        <h3
          className="text-2xl text-gray-900 bg-yellow-300 px-4 py-1 border-2 border-gray-800 shadow-[3px_3px_0px_#333] transform -rotate-1"
          style={{ fontFamily: '"Permanent Marker", cursive' }}
        >
          CHECK OUT WHO'S GOING
        </h3>
        <div className="h-0.5 flex-1 bg-gray-800" />
      </div>

      <div
        className="relative overflow-hidden border-t-2 border-b-2 border-gray-800 py-6 bg-white/50 backdrop-blur-sm"
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
      >
        <div
          className={`flex gap-8 items-center whitespace-nowrap ${isPaused ? 'pause-scrolling' : 'animate-scroll'}`}
          style={{
            animation:
              attendees.length > 0
                ? `scroll ${attendees.length * 5}s linear infinite`
                : 'none',
            animationPlayState: isPaused ? 'paused' : 'running',
          }}
        >
          {displayAttendees.map((attendee, index) => (
            <div
              key={`${attendee.username}-${index}`}
              className="group flex items-center gap-3 border-2 border-gray-800 bg-white p-2 shadow-[2px_2px_0px_#333] transition-transform hover:-translate-y-1 hover:rotate-1"
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
