import React from 'react';

import { BasicDetailsQuickForm } from './BasicDetailsQuickForm';
import { EventFeaturesQuickForm } from './EventFeaturesQuickForm';
import { TicketsAndCapacityQuickForm } from './TicketsAndCapacityQuickForm';
import { WhenAndWhereQuickForm } from './WhenAndWhereQuickForm';
import { BasicDetailsQuickFormProps } from './BasicDetailsQuickForm';
import { EventFeaturesQuickFormProps } from './EventFeaturesQuickForm';
import { TicketsAndCapacityQuickFormProps } from './TicketsAndCapacityQuickForm';
import { WhenAndWhereQuickFormProps } from './WhenAndWhereQuickForm';
import { EnclosingBox } from './ui/EnclosingBox';

interface BasicQuickProps {
    props: BasicDetailsQuickFormProps,
    eprops: EventFeaturesQuickFormProps,
    tprops: TicketsAndCapacityQuickFormProps,
    wprops: WhenAndWhereQuickFormProps
}

export const BasicQuick: React.FC<BasicQuickProps> = ({
    props,
    eprops,
    tprops,
    wprops,
}) => {
    return (
        <EnclosingBox background="bg-[#fcf8f2] border-2 border-dashed border-gray-300" rotation={-0.2}>
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
