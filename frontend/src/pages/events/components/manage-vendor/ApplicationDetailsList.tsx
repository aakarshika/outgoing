import { Edit2 } from 'lucide-react';
import React, { useState } from 'react';
import { Link } from 'react-router-dom';

import { EditApplicationModal } from '@/components/events/EditApplicationModal';

import { EnclosingBox } from '../manage-redesign/ui/EnclosingBox';
import { VendorAgreement } from './VendorAgreement';

interface ApplicationDetailsListProps {
  applications: any[];
}

export const ApplicationDetailsList: React.FC<ApplicationDetailsListProps> = ({
  applications,
}) => {
  const [editingApplication, setEditingApplication] = useState<any | null>(null);
  const [openApplicationIds, setOpenApplicationIds] = useState<
    Record<string | number, boolean>
  >({});

  if (!applications || applications.length === 0) {
    return (
      <EnclosingBox background="bg-white border text-gray-800 shadow-sm" rotation={0}>
        <div className="mb-2">
          <div className="text-gray-500 italic py-4">
            No application found for this event.
          </div>
        </div>
      </EnclosingBox>
    );
  }

  return (
    <>
      <div className="space-y-6">
        {applications.map((application: any, index: number) => {
          const key = application.id ?? index;
          const isOpen = openApplicationIds[key] ?? false;

          return (
            <div key={key} className="space-y-6">
              <EnclosingBox
                background="bg-white border text-gray-800 shadow-sm"
                rotation={0}
              >
                <div className="mb-2">
                  <div className="flex items-start justify-between gap-4 mb-3">
                    <div>
                      {application.event_id && (
                        <div className="mt-1 text-sm">
                          <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mr-1">
                            Event
                          </span>
                          <Link
                            to={`/events/${application.event_id}`}
                            className="text-blue-600 underline decoration-2 decoration-blue-200 font-semibold"
                          >
                            {application.event_title || 'View event'}
                          </Link>
                        </div>
                      )}
                    </div>
                    {application.status === 'pending' && (
                      <button
                        type="button"
                        onClick={() => setEditingApplication(application)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 border-2 border-gray-800 bg-blue-300 hover:bg-blue-400 text-gray-900 shadow-[2px_2px_0px_#333] transition-all active:translate-x-[1px] active:translate-y-[1px]"
                        style={{
                          fontFamily: '"Permanent Marker"',
                          fontSize: '0.75rem',
                        }}
                      >
                        <Edit2 className="h-3.5 w-3.5" /> Edit
                      </button>
                    )}
                  </div>

                  <>
                    <div className="flex flex-col gap-4">
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                        <div>
                          <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block mb-1">
                            Status
                          </span>
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider
                                ${
                                  application.status === 'accepted'
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
                      <div className="flex h-full w-full justify-between ">
                        {application.message && (
                          <div className="flex-1 w-full h-full mt-2 p-3 bg-gray-50 rounded text-sm text-gray-700 italic border border-gray-100">
                            "{application.message}"
                          </div>
                        )}

                        {application.status !== 'pending' && (
                          <button
                            type="button"
                            className=" items-center gap-2 focus:outline-none"
                            onClick={() =>
                              setOpenApplicationIds((prev) => ({
                                ...prev,
                                [key]: !isOpen,
                              }))
                            }
                          >
                            <span
                              className="ml-4 items-center border-2 border-[#00CCCC] px-2 py-1 justify-center font-bold text-xs font-black"
                              style={{
                                fontFamily: '"Permanent Marker", cursive',
                                color: '#00CCCC',
                              }}
                            >
                              Barcode {!isOpen ? '\\/' : '/\\'}
                            </span>
                          </button>
                        )}
                      </div>
                    </div>
                    {application.status === 'accepted' && isOpen && (
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
                  </>
                </div>
              </EnclosingBox>
            </div>
          );
        })}
      </div>

      <EditApplicationModal
        open={!!editingApplication}
        onClose={() => setEditingApplication(null)}
        application={editingApplication}
      />
    </>
  );
};
