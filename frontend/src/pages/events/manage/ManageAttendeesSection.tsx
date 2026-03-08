import { Users } from 'lucide-react';
import React from 'react';

interface ManageAttendeesSectionProps {
  event: any;
  attendees: any[];
  isLoadingAttendees: boolean;
}

export const ManageAttendeesSection: React.FC<ManageAttendeesSectionProps> = ({
  event,
  attendees,
  isLoadingAttendees,
}) => {
  return (
    <div className="space-y-6">
      <div className="flex gap-4 mb-4">
        <div
          className="bg-white border-2 border-gray-800 p-5 shadow-[2px_3px_0px_#333] flex-1 relative"
          style={{ transform: 'rotate(-1deg)' }}
        >
          <div className="absolute -top-3 -right-3 w-8 h-8 rounded-full bg-red-400 border-2 border-gray-800 shadow-[1px_1px_0px_#333] flex items-center justify-center rotate-12 text-sm">
            📌
          </div>
          <p
            className="text-sm font-bold text-gray-500 mb-1"
            style={{ fontFamily: '"Permanent Marker", cursive' }}
          >
            Total Tickets Sold
          </p>
          <p
            className="text-4xl font-bold text-gray-900"
            style={{ fontFamily: '"Caveat", cursive' }}
          >
            {event.ticket_count}
          </p>
        </div>
        <div
          className="bg-white border-2 border-gray-800 p-5 shadow-[2px_3px_0px_#333] flex-1 relative"
          style={{ transform: 'rotate(1deg)' }}
        >
          <div className="absolute -top-2 left-4 w-10 h-3 bg-yellow-200 border border-gray-400/50 shadow-sm rotate-[-5deg]" />
          <p
            className="text-sm font-bold text-gray-500 mb-1"
            style={{ fontFamily: '"Permanent Marker", cursive' }}
          >
            Interested Users
          </p>
          <p
            className="text-4xl font-bold text-gray-900"
            style={{ fontFamily: '"Caveat", cursive' }}
          >
            {event.interest_count}
          </p>
        </div>
      </div>

      <div className="bg-white border-2 border-gray-800 shadow-[3px_4px_0px_#333] overflow-hidden">
        {isLoadingAttendees ? (
          <div className="p-8 text-center text-muted-foreground">
            Loading attendees...
          </div>
        ) : attendees.length === 0 ? (
          <div className="p-8 text-center flex flex-col items-center">
            <Users className="h-12 w-12 text-muted-foreground/30 mb-3" />
            <p className="text-muted-foreground">No tickets sold yet</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-muted/50 text-muted-foreground border-b">
                <tr>
                  <th className="px-6 py-3 font-medium">Attendee</th>
                  <th className="px-6 py-3 font-medium">Ticket Type</th>
                  <th className="px-6 py-3 font-medium">Entry</th>
                  <th className="px-6 py-3 font-medium text-right">Purchase Date</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {attendees.map((attendee) => (
                  <tr key={attendee.id} className="hover:bg-muted/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        {attendee.user.avatar ? (
                          <img
                            src={attendee.user.avatar}
                            className="w-8 h-8 rounded-full object-cover"
                          />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center font-semibold text-primary text-xs">
                            {(
                              attendee.user.first_name?.[0] || attendee.user.username[0]
                            ).toUpperCase()}
                          </div>
                        )}
                        <div>
                          <p className="font-medium text-foreground">
                            {attendee.user.first_name || attendee.user.username}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            @{attendee.user.username}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                          attendee.ticket_type === 'flexible'
                            ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300'
                            : 'bg-secondary text-secondary-foreground'
                        }`}
                      >
                        {attendee.ticket_type.charAt(0).toUpperCase() +
                          attendee.ticket_type.slice(1)}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {attendee.status === 'used' ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                          ✅ Entered
                          {attendee.used_at && (
                            <span className="text-green-600 ml-1">
                              ·{' '}
                              {new Date(attendee.used_at).toLocaleTimeString([], {
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </span>
                          )}
                        </span>
                      ) : attendee.status === 'active' ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-amber-100 text-amber-800">
                          ⏳ Not Entered
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-600 capitalize">
                          {attendee.status}
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right text-muted-foreground">
                      {new Date(attendee.purchased_at).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
