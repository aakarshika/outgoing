import React from 'react';

import { EventNeed, NeedApplication } from '@/types/needs';

import { VendorAgreement } from '../manage-vendor/VendorAgreement';

interface AgreementSectionProps {
  need: EventNeed;
  application: NeedApplication;
}

export function NeedAgreements({ need, application }: AgreementSectionProps) {
  const isSigned = application.status === 'accepted'; // Placeholder logic

  return (
    <div className="mt-4">
      <VendorAgreement
        vendorName={application.vendor_name}
        applicationStatus={
          application.status as
            | 'sent'
            | 'accepted'
            | 'rejected'
            | 'pending'
            | 'withdrawn'
        }
        vendorSigned={isSigned} // Placeholder logic: Assume signed if accepted for now
        hostSigned={isSigned} // Placeholder logic: Assume host signed if accepted
        price={application.proposed_price ? Number(application.proposed_price) : 0}
        barcode={application.barcode}
        qrToken={application.qr_token}
        isHostView={true}
        onVendorConfirm={() =>
          console.log('Vendor confirm clicked (Host view - disabled)')
        }
        onHostConfirm={() => console.log('Host confirm clicked')}
      />
      <div className="flex justify-between items-center text-[10px] text-gray-500 pt-2 px-2">
        <span>Ref: #AGR-{application.id}</span>
      </div>
    </div>
  );
}
