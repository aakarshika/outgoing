import { Star } from 'lucide-react';
import React from 'react';

import { EnclosingBox } from '../manage-redesign/ui/EnclosingBox';
import { ScrapbookHeading } from '../manage-redesign/ui/ScrapbookHeading';

export const ReviewsStep: React.FC = () => {
  return (
    <EnclosingBox
      background="bg-[#f3e8ff] border-2 border-purple-800 shadow-[4px_4px_0px_#333]"
      rotation={-0.6}
    >
      <div className="mb-8">
        <ScrapbookHeading
          title="Reviews & Wrap Up"
          icon={<Star className="h-6 w-6" />}
        />

        <div className="mt-8 space-y-6">
          <div
            className="bg-white border-2 border-gray-800 p-6 shadow-[3px_3px_0px_#333]"
            style={{ transform: 'rotate(0.5deg)' }}
          >
            <h3
              className="text-xl font-bold text-gray-900 mb-4"
              style={{ fontFamily: '"Permanent Marker", cursive' }}
            >
              Host Review
            </h3>
            <div className="flex gap-2 text-yellow-500 mb-2">
              <Star fill="currentColor" />
              <Star fill="currentColor" />
              <Star fill="currentColor" />
              <Star fill="currentColor" />
              <Star fill="currentColor" />
            </div>
            <p
              className="text-gray-700 font-medium"
              style={{ fontFamily: '"Caveat", cursive', fontSize: '1.4rem' }}
            >
              "Great vendor, was on time and brought everything we asked. 10/10 would
              hire again!"
            </p>
          </div>

          <div
            className="bg-white border-2 border-dashed border-gray-400 p-6 shadow-[2px_2px_0px_#aaa] text-center"
            style={{ transform: 'rotate(-1deg)' }}
          >
            <h3
              className="text-lg font-bold text-gray-500 uppercase tracking-widest mb-2"
              style={{ fontFamily: '"Permanent Marker", cursive' }}
            >
              User Reviews
            </h3>
            <p className="text-gray-400 font-medium">No reviews from users yet.</p>
          </div>
        </div>
      </div>
    </EnclosingBox>
  );
};
