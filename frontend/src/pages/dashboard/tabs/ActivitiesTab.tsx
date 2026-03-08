import { MessageCircle, MessageSquare, Star } from 'lucide-react';
import { Link } from 'react-router-dom';

import { useMyActivities } from '@/features/profiles/hooks';

// Internal shared components from DashboardPage
function LoadingSkeleton({ count }: { count: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="h-20 border-2 border-dashed border-gray-300 bg-white/50 animate-pulse"
        />
      ))}
    </div>
  );
}

function EmptyState({ icon, title, subtitle, actionLabel, actionTo }: any) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-6 border-2 border-dashed border-gray-300 bg-white/30 text-center">
      <div className="mb-4 opacity-50">{icon}</div>
      <h3
        className="text-xl font-bold text-gray-900 mb-1"
        style={{ fontFamily: '"Permanent Marker", cursive' }}
      >
        {title}
      </h3>
      <p className="text-gray-500 mb-6 font-serif italic">{subtitle}</p>
      {actionLabel && (
        <Link
          to={actionTo}
          className="px-6 py-2 bg-yellow-300 border-2 border-gray-800 text-gray-900 font-bold hover:bg-yellow-400 transition-colors shadow-[3px_3px_0px_#333]"
          style={{ fontFamily: '"Permanent Marker", cursive' }}
        >
          {actionLabel}
        </Link>
      )}
    </div>
  );
}

export function ActivitiesTab() {
  const { data: activitiesResponse, isLoading } = useMyActivities();
  const activities = activitiesResponse?.data;

  if (isLoading) return <LoadingSkeleton count={3} />;

  if (
    !activities ||
    (activities.reviews.length === 0 && activities.comments.length === 0)
  ) {
    return (
      <EmptyState
        icon={<MessageSquare className="h-12 w-12 text-gray-400" />}
        title="No activities yet"
        subtitle="Share your thoughts by reviewing events or joining the conversation!"
        actionLabel="Browse Events"
        actionTo="/"
      />
    );
  }

  return (
    <div className="space-y-10">
      {/* Reviews Section */}
      {activities.reviews.length > 0 && (
        <div className="relative">
          <div className="absolute -top-6 -left-2 transform -rotate-6 z-10">
            <div
              className="bg-pink-400/80 px-4 py-1 border-2 border-gray-800 shadow-[2px_2px_0px_#333]"
              style={{ fontFamily: '"Permanent Marker", cursive' }}
            >
              MY REVIEWS
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6">
            {activities.reviews.map((rev: any, idx: number) => (
              <div
                key={`rev-${rev.id}`}
                className="p-5 border-2 border-gray-800 shadow-[4px_4px_0px_#333] relative transition-transform hover:scale-[1.02]"
                style={{
                  backgroundColor:
                    idx % 3 === 0 ? '#fef9c3' : idx % 3 === 1 ? '#dcfce7' : '#fff1f2',
                  transform: `rotate(${idx % 2 === 0 ? -1 : 1.5}deg)`,
                }}
              >
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-16 h-6 bg-blue-300/40 border border-blue-400/20 rotate-2 z-10" />

                <div className="flex justify-between items-start mb-2">
                  <h4
                    className="font-bold text-gray-900 leading-tight pr-2"
                    style={{
                      fontFamily: '"Permanent Marker", cursive',
                      fontSize: '1rem',
                    }}
                  >
                    {rev.title}
                  </h4>
                  <div className="flex bg-white/50 px-1 rounded border border-black/10">
                    <Star className="h-3 w-3 text-yellow-500 fill-yellow-500 mt-0.5" />
                    <span className="text-xs font-bold ml-1">{rev.rating}/5</span>
                  </div>
                </div>

                <p
                  className="text-gray-700 italic text-sm mb-4 line-clamp-4"
                  style={{ fontFamily: '"Caveat", cursive', fontSize: '1.2rem' }}
                >
                  "{rev.text}"
                </p>

                <div className="flex justify-between items-center mt-auto pt-2 border-t border-black/10">
                  <span className="text-[0.6rem] font-bold text-gray-500 tracking-tighter uppercase">
                    {rev.type === 'event_review' ? 'Event' : 'Vendor Service'}
                  </span>
                  <span className="text-[0.6rem] text-gray-500">
                    {new Date(rev.created_at).toLocaleDateString()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Comments Section */}
      {activities.comments.length > 0 && (
        <div className="relative mt-12">
          <div className="absolute -top-6 -left-2 transform rotate-3 z-10">
            <div
              className="bg-yellow-300 px-4 py-1 border-2 border-gray-800 shadow-[2px_2px_0px_#333]"
              style={{ fontFamily: '"Permanent Marker", cursive' }}
            >
              MY COMMENTS
            </div>
          </div>
          <div className="space-y-4 pt-6">
            {activities.comments.map((comm: any, idx: number) => (
              <div key={`comm-${comm.id}`} className="flex gap-4 items-start">
                <div className="flex-shrink-0 mt-2">
                  <MessageCircle className="h-5 w-5 text-gray-400" />
                </div>
                <div
                  className="flex-1 p-4 border-2 border-gray-800 bg-white shadow-[2px_2px_0px_#333] relative"
                  style={{
                    transform: `rotate(${idx % 2 === 0 ? 0.3 : -0.3}deg)`,
                    borderRadius: '0 12px 12px 12px',
                  }}
                >
                  <p className="text-sm text-gray-600 mb-2">
                    Replying to{' '}
                    <span className="font-bold text-gray-900 underline decoration-yellow-200 decoration-4">
                      {comm.target_title}
                    </span>
                  </p>
                  <p
                    className="text-gray-900"
                    style={{ fontFamily: '"Caveat", cursive', fontSize: '1.25rem' }}
                  >
                    {comm.text}
                  </p>
                  <div className="text-[0.6rem] text-right text-gray-400 mt-1">
                    {new Date(comm.created_at).toLocaleDateString()}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
