import { MessageSquare } from 'lucide-react';
import React from 'react';

import { EnclosingBox } from '../manage-redesign/ui/EnclosingBox';
import { ScrapbookHeading } from '../manage-redesign/ui/ScrapbookHeading';

export const LiveStep: React.FC = () => {
    return (
        <EnclosingBox rotation={0.8}>
            <div className="mb-8">
                <ScrapbookHeading title="Live Event" icon={<MessageSquare className="h-6 w-6" />} />

                <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">

                    {/* Messages from host placeholder */}
                    <div className="h-64 border-2 border-dashed border-orange-400 bg-orange-50 p-4 shadow-[3px_3px_0px_#c2410c] flex flex-col items-center justify-center relative" style={{ transform: 'rotate(1deg)' }}>
                        <div className="absolute top-0 right-4 h-6 w-12 bg-orange-300/40 -translate-y-2 rotate-[-5deg]" />
                        <div className="text-4xl mb-2">📢</div>
                        <h3 className="text-xl font-bold text-orange-900" style={{ fontFamily: '"Permanent Marker", cursive' }}>Host Messages</h3>
                        <p className="text-orange-700 font-medium text-center mt-2" style={{ fontFamily: '"Caveat", cursive', fontSize: '1.2rem' }}>
                            (Announcements from host will appear here)
                        </p>
                    </div>
                </div>
            </div>
        </EnclosingBox>
    );
};
