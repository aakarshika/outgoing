import React, { useState } from 'react';
import { CheckCircle2, ChevronDown, ChevronUp, QrCode, FileText } from 'lucide-react';
import { EventNeed, NeedApplication } from '@/types/needs';
import { Button } from '@/components/ui/button';

interface AgreementSectionProps {
    need: EventNeed;
    application: NeedApplication;
}

export function NeedAgreements({ need, application }: AgreementSectionProps) {
    const [isExpanded, setIsExpanded] = useState(false);
    const isSigned = application.status === 'accepted'; // Placeholder logic

    return (
        <div className="mt-4 border-2 border-gray-100 rounded-lg overflow-hidden bg-gray-50/30">
            <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="w-full flex items-center justify-between p-3 hover:bg-gray-100/50 transition-colors"
            >
                <div className="flex items-center gap-3">
                    <FileText className={`h-4 w-4 ${isSigned ? 'text-green-500' : 'text-gray-400'}`} />
                    <span className="text-sm font-bold text-gray-700" style={{ fontFamily: '"Permanent Marker", cursive' }}>
                        Agreement: {isSigned ? 'Signed On' : 'Pending'}
                    </span>
                </div>
                {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </button>

            {isExpanded && (
                <div className="p-4 border-t-2 border-dashed border-gray-100 space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="p-3 bg-white border-2 border-gray-200 rounded shadow-[1px_1px_0px_#eee] space-y-2">
                            <span className="text-[10px] font-bold text-blue-600 uppercase tracking-wider">Vendor Agreement</span>
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-medium">Agreement Confirmed</span>
                                {isSigned ? <CheckCircle2 className="h-4 w-4 text-green-500" /> : <div className="h-4 w-4 bg-gray-100 rounded-full" />}
                            </div>
                            <Button
                                variant="outline"
                                size="sm"
                                className="w-full text-[10px] h-7 border-2 border-gray-800 shadow-[1px_1px_0px_#333]"
                            >
                                <QrCode className="h-3 w-3 mr-1" /> VIEW BARCODE
                            </Button>
                        </div>

                        <div className="p-3 bg-white border-2 border-gray-200 rounded shadow-[1px_1px_0px_#eee] space-y-2">
                            <span className="text-[10px] font-bold text-purple-600 uppercase tracking-wider">Host Agreement</span>
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-medium">Service Paid</span>
                                {isSigned ? <CheckCircle2 className="h-4 w-4 text-green-500" /> : <div className="h-4 w-4 bg-gray-100 rounded-full" />}
                            </div>
                            <div className="text-[10px] text-gray-500 italic">Placeholder: Free/Paid Architecture Ready</div>
                        </div>
                    </div>

                    <div className="flex justify-between items-center text-[10px] text-gray-500 pt-2 border-t border-gray-100">
                        <span>Status: {application.status.toUpperCase()}</span>
                        <span>Reference: #AGR-{application.id}</span>
                    </div>
                </div>
            )}
        </div>
    );
}
