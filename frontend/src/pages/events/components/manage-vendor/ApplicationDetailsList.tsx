import { Button, Chip } from '@mui/material';
import { Edit2, Pencil } from 'lucide-react';
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

import { EditApplicationModal } from '@/components/events/EditApplicationModal';
import { ComicButton } from '@/components/ui/ComicButton';

import { EnclosingBox } from '../manage-redesign/ui/EnclosingBox';
import { VendorAgreement } from './VendorAgreement';

interface ApplicationDetailsListProps {
  applications: any[];
  tone?: 'comic' | 'warm';
}

export const ApplicationDetailsList: React.FC<ApplicationDetailsListProps> = ({
  applications,
  tone = 'comic',
}) => {
  const navigate = useNavigate();
  const [editingApplication, setEditingApplication] = useState<any | null>(null);
  const [openApplicationIds, setOpenApplicationIds] = useState<
    Record<string | number, boolean>
  >({});
  const isWarm = tone === 'warm';
  const boxBackground = isWarm
    ? 'bg-[#fffaf2] border border-[#ead8c3] text-[#2b2118] shadow-sm rounded-[18px]'
    : 'bg-white border text-gray-800 shadow-sm';
  const eventLinkClass = isWarm
    ? 'text-[#b45309] underline decoration-2 decoration-[#f2c78f] font-semibold'
    : 'text-blue-600 underline decoration-2 decoration-blue-200 font-semibold';
  const messageClass = isWarm
    ? 'flex-1 w-full h-full mt-2 p-3 bg-[#fff4e6] rounded text-sm text-[#6b4f34] italic border border-[#f0dcc4]'
    : 'flex-1 w-full h-full mt-2 p-3 bg-gray-50 rounded text-sm text-gray-700 italic border border-gray-100';
  const barcodeColor = isWarm ? '#D85A30' : '#00CCCC';
  const manageButtonColor = isWarm ? '#7C3E1D' : '#1e3a5f';
  const manageButtonAccent = isWarm ? '#F7D8A8' : '#00CCCC';
  const editButtonColor = isWarm ? '#7C3E1D' : undefined;
  const editButtonAccent = isWarm ? '#FAE6C7' : undefined;

  if (!applications || applications.length === 0) {
    return (
      <EnclosingBox background={boxBackground} rotation={0}>
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
              <EnclosingBox background={boxBackground} rotation={0}>
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
                            className={eventLinkClass}
                          >
                            {application.event_title || 'View event'}
                          </Link>
                        </div>
                      )}
                    </div>

                    {tone === 'comic' ? (
                      <div className="flex items-center gap-2">
                        <ComicButton
                          type="button"
                          onClick={() =>
                            navigate(
                              `/events/${application.event_id}/service-event-management`,
                            )
                          }
                          color={manageButtonColor}
                          accentColor={manageButtonAccent}
                          Icon={
                            application.event_status == 'Completed' ? undefined : Pencil
                          }
                          label={` ${application.event_status == 'Completed' ? 'Go to Gig' : 'Manage Gig'}`}
                        ></ComicButton>
                        {application.status === 'pending' && (
                          <ComicButton
                            type="button"
                            onClick={() => setEditingApplication(application)}
                            Icon={Edit2}
                            color={editButtonColor}
                            accentColor={editButtonAccent}
                            label="Edit"
                          ></ComicButton>
                        )}
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        {/* <Button
                          size="small"
                          onClick={() =>
                            navigate(
                              `/events/${application.event_id}/service-event-management`,
                            )
                          }
                          startIcon={application.event_status !== 'Completed' ? <Pencil size={14} /> : undefined}
                          sx={{
                            textTransform: 'none',
                            fontWeight: 700,
                            fontSize: 12,
                            borderRadius: '14px',
                            px: 1.6,
                            color: '#7C3E1D',
                            bgcolor: '#FFF4E6',
                            border: '1px solid rgba(143,105,66,0.14)',
                            '&:hover': { bgcolor: '#FAECE7' },
                          }}
                        >
                          {application.event_status === 'Completed' ? 'Go to Gig' : 'Manage Gig'}
                        </Button> */}
                        {application.status === 'pending' && (
                          <Button
                            size="small"
                            onClick={() => setEditingApplication(application)}
                            startIcon={<Edit2 size={14} />}
                            sx={{
                              textTransform: 'none',
                              fontWeight: 700,
                              fontSize: 12,
                              borderRadius: '14px',
                              px: 1.6,
                              color: '#7C3E1D',
                              bgcolor: '#FAE6C7',
                              border: '1px solid rgba(143,105,66,0.14)',
                              '&:hover': { bgcolor: '#F7D8A8' },
                            }}
                          >
                            Edit Application
                          </Button>
                        )}
                      </div>
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
                          <div className={messageClass}>"{application.message}"</div>
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
                                color: barcodeColor,
                                borderColor: barcodeColor,
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
