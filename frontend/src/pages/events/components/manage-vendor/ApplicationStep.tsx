import { FileEdit } from 'lucide-react';
import React from 'react';

import { useMyApplications } from '@/features/needs/hooks';

import { EnclosingBox } from '../manage-redesign/ui/EnclosingBox';
import { ScrapbookHeading } from '../manage-redesign/ui/ScrapbookHeading';
import { ApplicationDetailsList } from './ApplicationDetailsList';

// Mock types for quick implementation
interface ApplicationStepProps {
  event: any;
  readonly?: boolean;
}

export const ApplicationStep: React.FC<ApplicationStepProps> = ({ event }) => {
  const { data: myAppsResponse } = useMyApplications();
  const myApps = myAppsResponse?.data || [];
  const applications = myApps.filter((app: any) => app.event_id === event?.id);

  return (
    <div className="space-y-6">
      <EnclosingBox
        background="bg-[#fcf8f2] border-2 border-dashed border-gray-300"
        rotation={-0.2}
      >
        <div className="mb-8">
          <ScrapbookHeading
            title="Event Basic Info"
            icon={<FileEdit className="h-6 w-6" />}
          />

          <div className="mt-4 flex flex-col md:flex-row gap-6">
            <div className="flex-1 space-y-4">
              <div>
                <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                  Event Title
                </span>
                <div
                  className="text-xl font-bold text-gray-900"
                  style={{ fontFamily: '"Permanent Marker", cursive' }}
                >
                  {event?.title || 'Bake Sale Extravaganza (Placeholder)'}
                </div>
              </div>
              <div>
                <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                  Description
                </span>
                <div
                  className="text-gray-700 font-medium"
                  style={{ fontFamily: '"Caveat", cursive', fontSize: '1.4rem' }}
                >
                  {event?.description || 'Join us for an afternoon of sweet treats...'}
                </div>
              </div>
            </div>
            {event?.cover_image && (
              <div className="w-full md:w-64 flex-shrink-0">
                <div
                  className="group relative h-48 w-full overflow-hidden border-2 border-dashed border-gray-400 bg-white shadow-[3px_4px_0px_#333]"
                  style={{ transform: 'rotate(1deg)' }}
                >
                  <img
                    src={event.cover_image}
                    alt="Cover"
                    className="h-full w-full object-cover"
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      </EnclosingBox>

      <ApplicationDetailsList applications={applications} />
    </div>
  );
};
