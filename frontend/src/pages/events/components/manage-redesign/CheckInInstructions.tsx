import React from 'react';

import { ScrapbookInput } from './ui/ScrapbookInput';

interface CheckInInstructionsProps {
  event: any;
  readonly?: boolean;
}

export const CheckInInstructions: React.FC<CheckInInstructionsProps> = ({
  event,
  readonly = false,
}) => {
  return (
    <div className="mb-6 relative">
      <ScrapbookInput
        label="Check-in Instructions"
        name="check_in_instructions"
        multiline
        rows={3}
        example="Where to park, what to bring, who to ask for..."
        defaultValue={event?.check_in_instructions || ''}
        disabled={readonly}
      />
      <div className="absolute -bottom-5 right-2 text-[9px] text-gray-400 italic">
        * Only visible to ticket holders and hosts *
      </div>
    </div>
  );
};
