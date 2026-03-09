import { FileEdit } from 'lucide-react';
import React from 'react';

import { useMyApplications } from '@/features/needs/hooks';

import { EnclosingBox } from '../manage-redesign/ui/EnclosingBox';
import { ScrapbookHeading } from '../manage-redesign/ui/ScrapbookHeading';
import { VendorAgreement } from './VendorAgreement';

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

      {applications.length > 0 ? (
        applications.map((application: any, index: number) => (
          <div key={application.id || index} className="space-y-6">
            <EnclosingBox
              background="bg-white border text-gray-800 shadow-sm"
              rotation={0}
            >
              <div className="mb-2">
                <h3 className="text-xl font-bold mb-4">Application Details</h3>
                <div className="flex flex-col gap-4">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    <div>
                      <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block mb-1">
                        Status
                      </span>
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider
                                                ${application.status === 'accepted'
                            ? 'bg-green-100 text-green-800'
                            : application.status === 'rejected'
                              ? 'bg-red-100 text-red-800'
                              : 'bg-yellow-100 text-yellow-800'
                          }`}
                      >
                        {application.status}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block mb-1">
                        Need
                      </span>
                      <div className="text-sm font-semibold text-gray-900">
                        {application.need_title || 'General'}
                      </div>
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block mb-1">
                        Proposed Price
                      </span>
                      <div className="text-sm font-semibold text-gray-900">
                        {application.proposed_price
                          ? `$${application.proposed_price}`
                          : 'N/A'}
                      </div>
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block mb-1">
                        Date Applied
                      </span>
                      <div className="text-sm font-semibold text-gray-900">
                        {new Date(application.created_at).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                  {application.message && (
                    <div className="mt-2 p-3 bg-gray-50 rounded text-sm text-gray-700 italic border border-gray-100">
                      "{application.message}"
                    </div>
                  )}
                </div>

                {application.status === 'accepted' && (
                  <VendorAgreement
                    applicationStatus={application.status}
                    vendorSigned={true}
                    hostSigned={true}
                    price={
                      application.proposed_price
                        ? parseFloat(application.proposed_price)
                        : 0
                    }
                    barcode={application.barcode}
                    qrToken={application.qr_token}
                    isHostView={false}
                  />
                )}
              </div>
            </EnclosingBox>
          </div>
        ))
      ) : (
        <EnclosingBox background="bg-white border text-gray-800 shadow-sm" rotation={0}>
          <div className="mb-2">
            <h3 className="text-xl font-bold mb-4">Application Details</h3>
            <div className="text-gray-500 italic py-4">
              No application found for this event.
            </div>
          </div>
        </EnclosingBox>
      )}
    </div>
  );
};
