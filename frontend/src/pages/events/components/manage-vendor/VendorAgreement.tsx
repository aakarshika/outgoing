import { QRCodeSVG } from 'qrcode.react';
import React, { useState } from 'react';
export interface VendorAgreementProps {
    vendorName?: string;
    applicationStatus: 'sent' | 'accepted' | 'rejected';
    vendorSigned: boolean;
    hostSigned: boolean;
    price?: number;
    isHostView: boolean;
    onVendorConfirm?: () => void;
    onHostConfirm?: () => void;
}

export const VendorAgreement: React.FC<VendorAgreementProps> = ({
    vendorName = 'Vendor',
    applicationStatus,
    vendorSigned,
    hostSigned,
    price = 0,
    isHostView,
    onVendorConfirm,
    onHostConfirm,
}) => {
    const [showVendorConfirmModal, setShowVendorConfirmModal] = useState(false);

    // Vendor only sees this section when host has confirmed (application is accepted)
    if (!isHostView && applicationStatus !== 'accepted') {
        return null;
    }

    const isHostConfirmed = hostSigned || applicationStatus === 'accepted';
    const isVendorConfirmed = vendorSigned;

    // Determine if agreements are enabled based on view
    const canVendorConfirm = !isHostView && !isVendorConfirmed;
    const canHostConfirm = isHostView && !isHostConfirmed;

    // Status display logic
    const vendorStatusText = isVendorConfirmed ? 'Confirmed' : (!isHostView ? 'Confirm' : 'Pending');
    const hostStatusText = isHostConfirmed ? 'Confirmed' : (isHostView ? 'Confirm' : 'Pending');

    const getStatusMessage = () => {
        if (isVendorConfirmed && isHostConfirmed) return 'Fully Signed';
        if (isVendorConfirmed) return 'Signed by Vendor';
        if (isHostConfirmed) return 'Signed by Host';
        return 'Not signed yet';
    };

    return (
        <div className="bg-white border rounded shadow-sm overflow-hidden mb-8">
            <div className="bg-gray-100 px-6 py-4 border-b flex justify-between items-center">
                <div className="flex items-center gap-3">
                    <h3 className="text-lg font-bold text-gray-900">
                        {isHostView ? `${vendorName}'s Agreement` : "Application & Agreement"}
                    </h3>
                </div>
                <div className="text-sm font-medium text-gray-600 bg-white px-3 py-1 rounded-full border shadow-sm">
                    {getStatusMessage()}
                </div>
            </div>

            <div className="p-6">

                {/* Host Confirmation Section */}
                <div className={`flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 p-4 border rounded bg-gray-50 mb-4 ${!isHostView ? 'opacity-80' : ''}`}>
                    <div>
                        <div className="font-bold text-gray-800">Host Confirmation</div>
                        <div className="text-sm text-gray-500">Host approves the application</div>
                    </div>
                    <button
                        disabled={!canHostConfirm}
                        onClick={onHostConfirm}
                        className={`px-6 py-2 rounded font-semibold text-sm transition-all
                            ${isHostConfirmed ? 'bg-blue-100 text-blue-800 border border-blue-200 cursor-default' :
                                (canHostConfirm ? 'bg-blue-600 text-white hover:bg-blue-700' : 'bg-gray-100 text-gray-400 cursor-not-allowed')}`}
                    >
                        {hostStatusText}
                    </button>
                </div>

                {/* Vendor Confirmation Section */}
                <div className={`flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 p-4 border rounded bg-gray-50 mb-6 ${isHostView ? 'opacity-80' : ''}`}>
                    <div>
                        <div className="font-bold text-gray-800">Vendor Confirmation</div>
                        <div className="text-sm text-gray-500">Agreed Price: ${price.toFixed(2)}</div>
                    </div>
                    <button
                        disabled={!canVendorConfirm}
                        onClick={() => {
                            if (canVendorConfirm) {
                                setShowVendorConfirmModal(true);
                            }
                        }}
                        className={`px-6 py-2 rounded font-semibold text-sm transition-all
                            ${isVendorConfirmed ? 'bg-green-100 text-green-800 border border-green-200 cursor-default' :
                                (canVendorConfirm ? 'bg-green-600 text-white hover:bg-green-700' : 'bg-gray-100 text-gray-400 cursor-not-allowed')}`}
                    >
                        {vendorStatusText}
                    </button>
                </div>

                {/* Barcode Section (Only when BOTH are confirmed) */}
                {isVendorConfirmed && isHostConfirmed && !isHostView && (
                    <div className="mt-8 pt-8 border-t flex flex-col items-center">
                        <h4 className="text-lg font-bold text-gray-800 mb-2">Vendor Pass</h4>
                        <p className="text-sm text-gray-500 mb-6 text-center max-w-sm">
                            Show this QR code to the host when you arrive at the event for quick check-in.
                        </p>
                        <div className="bg-white p-4 border rounded-xl shadow-sm inline-block">
                            <QRCodeSVG
                                value={`vendor-pass-${vendorName}-${price}`}
                                size={160}
                                level="M"
                                includeMargin={true}
                            />
                        </div>
                        <div className="mt-4 font-mono text-sm tracking-widest text-gray-600 font-bold bg-gray-100 px-4 py-2 rounded">
                            VNDR-{Math.floor(Math.random() * 90000) + 10000}
                        </div>
                    </div>
                )}

                {/* Vendor Confirm Modal */}
                {showVendorConfirmModal && (
                    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                        <div className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full">
                            <h2 className="text-xl font-bold text-gray-900 mb-2">Confirm Agreement?</h2>
                            <p className="text-gray-600 mb-6">
                                By confirming, you agree to the terms and the set price of <span className="font-bold text-gray-900">${price.toFixed(2)}</span>. This action cannot be undone.
                            </p>
                            <div className="flex justify-end gap-3">
                                <button
                                    onClick={() => setShowVendorConfirmModal(false)}
                                    className="px-5 py-2 rounded text-gray-600 font-medium hover:bg-gray-100 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={() => {
                                        setShowVendorConfirmModal(false);
                                        if (onVendorConfirm) onVendorConfirm();
                                    }}
                                    className="px-5 py-2 rounded bg-green-600 text-white font-medium hover:bg-green-700 transition-colors"
                                >
                                    Confirm Agreement
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
