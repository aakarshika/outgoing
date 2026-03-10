import { MessageSquare } from 'lucide-react';
import React from 'react';

import { EnclosingBox } from '../manage-redesign/ui/EnclosingBox';
import { ScrapbookHeading } from '../manage-redesign/ui/ScrapbookHeading';
import { HostVendorGroupChat } from '../manage-shared/HostVendorGroupChat';

export const LiveStep: React.FC<{ event?: any }> = ({ event }) => {
  // We get vendor applications down from the component structure if possible, but for now we might only have event details
  // Getting the same hook to fetch needs, to get full list of users for this vendor.
  // In a real scenario we could fetch it via a hook directly here or pass it down. Let's assume `event` contains basic host info.
  const chatUsers = event
    ? [
        {
          id: event.host?.id || event.host?.username || 'host',
          username: event.host?.username || 'Host',
          avatar: event.host?.avatar || undefined,
          role: 'host',
        },
      ]
    : [];
  return (
    <EnclosingBox rotation={0.8}>
      <div className="mb-8">
        <ScrapbookHeading
          title="Live Event"
          icon={<MessageSquare className="h-6 w-6" />}
        />

        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Messages from host placeholder */}
          <div className="h-[500px]">
            {event?.id && (
              <HostVendorGroupChat
                eventId={event.id}
                title="Live Event Chat"
                authorizedUsers={chatUsers}
                maxHeight={400}
              />
            )}
          </div>
        </div>
      </div>
    </EnclosingBox>
  );
};
