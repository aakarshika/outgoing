import React from 'react';

import { BasicDetailsQuickForm } from './BasicDetailsQuickForm';
import { BasicDetailsQuickFormProps } from './BasicDetailsQuickForm';
import { EventFeaturesQuickForm } from './EventFeaturesQuickForm';
import { EventFeaturesQuickFormProps } from './EventFeaturesQuickForm';
import { TicketsAndCapacityQuickForm } from './TicketsAndCapacityQuickForm';
import { TicketsAndCapacityQuickFormProps } from './TicketsAndCapacityQuickForm';
import { EnclosingBox } from './ui/EnclosingBox';
import { WhenAndWhereQuickForm } from './WhenAndWhereQuickForm';
import { WhenAndWhereQuickFormProps } from './WhenAndWhereQuickForm';

interface BasicQuickProps {
  props: BasicDetailsQuickFormProps;
  eprops: EventFeaturesQuickFormProps;
  tprops: TicketsAndCapacityQuickFormProps;
  wprops: WhenAndWhereQuickFormProps;
}

export const BasicQuick: React.FC<BasicQuickProps> = ({
  props,
  eprops,
  tprops,
  wprops,
}) => {
  return (
    <EnclosingBox
      background="bg-[#fcf8f2] border-2 border-dashed border-gray-300"
      rotation={-0.2}
    >
      <div className="grid grid-cols-2 gap-4">
        <div className="col-span-1 space-y-4">
          <BasicDetailsQuickForm {...props} />
          <EventFeaturesQuickForm {...eprops} />
        </div>
        <div className="col-span-1 space-y-4">
          <WhenAndWhereQuickForm {...wprops} />
          <TicketsAndCapacityQuickForm {...tprops} />
        </div>
      </div>
    </EnclosingBox>
  );
};
