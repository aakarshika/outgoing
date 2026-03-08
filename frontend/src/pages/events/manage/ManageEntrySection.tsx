import { CheckCircle2, QrCode, ScanLine, XCircle } from 'lucide-react';
import React from 'react';

import { Button } from '@/components/ui/button';

interface ManageEntrySectionProps {
  event: any;
  entryBarcode: string;
  setEntryBarcode: (barcode: string) => void;
  handleValidate: () => void;
  handleAdmit: () => Promise<void>;
  handleResetEntry: () => void;
  isValidating: boolean;
  validationError: string | null;
  validationErrorCode: string | null;
  validationResult: any;
  admitted: boolean;
  admitError: string | null;
  isAdmitting: boolean;
  setIsScannerOpen: (open: boolean) => void;
  entryInputRef: React.RefObject<HTMLInputElement>;
  attendees: any[];
}

export const ManageEntrySection: React.FC<ManageEntrySectionProps> = ({
  event,
  entryBarcode,
  setEntryBarcode,
  handleValidate,
  handleAdmit,
  handleResetEntry,
  isValidating,
  validationError,
  validationErrorCode,
  validationResult,
  admitted,
  admitError,
  isAdmitting,
  setIsScannerOpen,
  entryInputRef,
  attendees,
}) => {
  return (
    <div className="space-y-6">
      {/* Entry Header Card */}

      <h2
        className="text-2xl font-bold mb-2"
        style={{ fontFamily: '"Permanent Marker", cursive' }}
      >
        🎫 Ticket Entry
      </h2>
      {/* Barcode Input */}
      <div
        className="bg-white border-2 border-gray-800 p-6 shadow-[3px_4px_0px_#333]"
        style={{ transform: 'rotate(-0.2deg)' }}
      >
        <div className="flex items-center gap-2 mb-4 border-b-2 border-gray-800 pb-2 border-dashed">
          <QrCode className="h-6 w-6 text-gray-800" />
          <h3
            className="text-xl font-bold"
            style={{ fontFamily: '"Permanent Marker", cursive' }}
          >
            Scan QR Code
          </h3>
        </div>

        <div className="mb-6 flex space-x-4">
          <Button
            onClick={() => setIsScannerOpen(true)}
            className="flex-1 border-2 border-gray-800 bg-emerald-400 text-gray-900 shadow-[3px_4px_0px_#333] hover:bg-emerald-500 hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[2px_3px_0px_#333] transition-all font-bold px-6 py-6 text-xl flex items-center justify-center gap-3"
            style={{ fontFamily: '"Permanent Marker", cursive' }}
          >
            <ScanLine className="h-6 w-6" /> Scan with Camera
          </Button>
        </div>

        <div className="flex items-center gap-3 mb-4">
          <div className="h-px bg-gray-300 flex-1"></div>
          <span className="text-gray-700 font-bold uppercase tracking-widest text-sm">
            OR MANUAL ENTRY
          </span>
          <div className="h-px bg-gray-300 flex-1"></div>
        </div>

        <div className="flex gap-3">
          <div className="flex-1 relative">
            <input
              ref={entryInputRef}
              type="text"
              value={entryBarcode}
              onChange={(e) => setEntryBarcode(e.target.value.toUpperCase())}
              onKeyDown={(e) => e.key === 'Enter' && handleValidate()}
              placeholder="Enter ticket barcode..."
              autoFocus
              className="w-full rounded-lg border-2 border-gray-800 bg-yellow-50/50 px-4 py-3.5 text-lg font-mono tracking-wider focus:ring-2 focus:ring-emerald-400/50 focus:border-emerald-600 transition-all shadow-[2px_2px_0px_#333]"
              style={{ fontFamily: '"JetBrains Mono", monospace' }}
              disabled={isValidating}
            />
            {entryBarcode && (
              <button
                type="button"
                onClick={() => {
                  setEntryBarcode('');
                  handleResetEntry();
                }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700"
              >
                ✕
              </button>
            )}
          </div>
          <Button
            onClick={handleValidate}
            disabled={!entryBarcode.trim() || isValidating}
            className="border-2 border-gray-800 bg-blue-400 text-gray-900 shadow-[2px_2px_0px_#333] hover:bg-blue-500 hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[1px_1px_0px_#333] transition-all font-bold px-6 py-3.5 text-base"
            style={{ fontFamily: '"Permanent Marker", cursive' }}
          >
            {isValidating ? '⏳ Checking...' : '🔍 Validate'}
          </Button>
        </div>
      </div>

      {/* Validation Result */}
      {validationError && (
        <div
          className="bg-red-50 border-2 border-red-400 p-5 shadow-[3px_4px_0px_#dc2626] relative"
          style={{ transform: 'rotate(0.3deg)' }}
        >
          <div className="flex items-start gap-3">
            <XCircle className="h-6 w-6 text-red-500 flex-shrink-0 mt-0.5" />
            <div>
              <h4
                className="text-lg font-bold text-red-800 mb-1"
                style={{ fontFamily: '"Permanent Marker", cursive' }}
              >
                {validationErrorCode === 'ALREADY_USED'
                  ? 'Already Entered'
                  : validationErrorCode === 'WRONG_EVENT'
                    ? 'Wrong Event'
                    : validationErrorCode === 'CANCELLED'
                      ? 'Ticket Cancelled'
                      : validationErrorCode === 'REFUNDED'
                        ? 'Ticket Refunded'
                        : 'Invalid Ticket'}
              </h4>
              <p
                className="text-red-700"
                style={{ fontFamily: '"Caveat", cursive', fontSize: '1.1rem' }}
              >
                {validationError}
              </p>
            </div>
          </div>
          <button
            onClick={handleResetEntry}
            className="mt-4 px-4 py-2 bg-white border-2 border-red-400 rounded-lg text-red-700 font-bold text-sm hover:bg-red-100 transition-colors"
            style={{ fontFamily: '"Permanent Marker", cursive' }}
          >
            Try Another Code
          </button>
        </div>
      )}

      {validationResult && !admitted && (
        <>
          <div
            className="bg-emerald-50 border-2 border-emerald-600 p-6 shadow-[3px_4px_0px_#059669] relative"
            style={{ transform: 'rotate(-0.3deg)' }}
          >
            <div className="absolute -top-3 -left-3 w-8 h-8 rounded-full bg-emerald-400 border-2 border-gray-800 shadow-[1px_1px_0px_#333] flex items-center justify-center text-sm">
              ✅
            </div>
            <h4
              className="text-lg font-bold text-emerald-800 mb-4"
              style={{ fontFamily: '"Permanent Marker", cursive' }}
            >
              Ticket Valid!
            </h4>

            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="bg-white/70 rounded-lg p-3 border border-emerald-200">
                <p className="text-xs font-bold text-gray-700 uppercase tracking-wide">
                  Attendee
                </p>
                <p
                  className="text-lg font-bold text-gray-900"
                  style={{ fontFamily: '"Caveat", cursive', fontSize: '1.4rem' }}
                >
                  {validationResult.attendee_name}
                </p>
                <p className="text-xs text-gray-600">
                  @{validationResult.attendee_username}
                </p>
              </div>
              <div className="bg-white/70 rounded-lg p-3 border border-emerald-200">
                <p className="text-xs font-bold text-gray-700 uppercase tracking-wide">
                  Ticket Type
                </p>
                <p
                  className="text-lg font-bold"
                  style={{
                    fontFamily: '"Caveat", cursive',
                    fontSize: '1.4rem',
                    color: validationResult.tier_color || '#1f2937',
                  }}
                >
                  {validationResult.tier_name}
                </p>
                <p className="text-xs text-gray-600">₹{validationResult.price_paid}</p>
              </div>
              {validationResult.guest_name && (
                <div className="bg-white/70 rounded-lg p-3 border border-emerald-200">
                  <p className="text-xs font-bold text-gray-700 uppercase tracking-wide">
                    Guest Name
                  </p>
                  <p
                    className="text-lg font-bold text-gray-900"
                    style={{ fontFamily: '"Caveat", cursive', fontSize: '1.4rem' }}
                  >
                    {validationResult.guest_name}
                  </p>
                </div>
              )}
            </div>
          </div>

          {admitError && (
            <div className="bg-red-50 border border-red-300 rounded-lg p-3 mb-4">
              <p className="text-red-700 text-sm font-medium">{admitError}</p>
            </div>
          )}

          <div className="flex gap-3">
            <Button
              onClick={handleAdmit}
              disabled={isAdmitting}
              className="flex-1 border-2 border-gray-800 bg-emerald-400 text-gray-900 shadow-[3px_3px_0px_#333] hover:bg-emerald-500 hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[2px_2px_0px_#333] transition-all font-bold py-4 text-lg"
              style={{ fontFamily: '"Permanent Marker", cursive', fontSize: '1.2rem' }}
            >
              {isAdmitting ? '⏳ Admitting...' : '✅ Admit Attendee'}
            </Button>
            <Button
              onClick={handleResetEntry}
              variant="outline"
              className="border-2 border-gray-800 shadow-[2px_2px_0px_#333] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[1px_1px_0px_#333] transition-all"
              style={{ fontFamily: '"Permanent Marker", cursive' }}
            >
              Cancel
            </Button>
          </div>
        </>
      )}

      {/* Admission Success */}
      {admitted && (
        <div
          className="bg-gradient-to-br from-green-100 to-emerald-100 border-2 border-green-600 p-8 shadow-[3px_4px_0px_#15803d] relative text-center"
          style={{ transform: 'rotate(0.5deg)' }}
        >
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-400 border-2 border-gray-800 shadow-[2px_2px_0px_#333] mb-4">
            <CheckCircle2 className="h-8 w-8 text-gray-800" />
          </div>
          <h4
            className="text-2xl font-bold text-green-800 mb-2"
            style={{ fontFamily: '"Permanent Marker", cursive' }}
          >
            Admitted! 🎉
          </h4>
          <p
            className="text-green-700 mb-6"
            style={{ fontFamily: '"Caveat", cursive', fontSize: '1.2rem' }}
          >
            {validationResult?.attendee_name || 'Attendee'} has been checked in
            successfully.
          </p>
          <Button
            onClick={handleResetEntry}
            className="border-2 border-gray-800 bg-yellow-300 text-gray-900 shadow-[2px_2px_0px_#333] hover:bg-yellow-400 hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[1px_1px_0px_#333] transition-all font-bold px-8"
            style={{ fontFamily: '"Permanent Marker", cursive', fontSize: '1rem' }}
          >
            Scan Next Ticket →
          </Button>
        </div>
      )}

      {/* Quick Stats */}
      <div className="flex gap-4">
        <div
          className="bg-white border-2 border-gray-800 p-5 shadow-[2px_3px_0px_#333] flex-1 relative"
          style={{ transform: 'rotate(-0.5deg)' }}
        >
          <p
            className="text-sm font-bold text-gray-500 mb-1"
            style={{ fontFamily: '"Permanent Marker", cursive' }}
          >
            Entered
          </p>
          <p
            className="text-4xl font-bold text-emerald-600"
            style={{ fontFamily: '"Caveat", cursive' }}
          >
            {attendees.filter((a) => a.status === 'used').length}
          </p>
        </div>
        <div
          className="bg-white border-2 border-gray-800 p-5 shadow-[2px_3px_0px_#333] flex-1 relative"
          style={{ transform: 'rotate(0.5deg)' }}
        >
          <p
            className="text-sm font-bold text-gray-500 mb-1"
            style={{ fontFamily: '"Permanent Marker", cursive' }}
          >
            Remaining
          </p>
          <p
            className="text-4xl font-bold text-amber-600"
            style={{ fontFamily: '"Caveat", cursive' }}
          >
            {attendees.filter((a) => a.status === 'active').length}
          </p>
        </div>
        <div
          className="bg-white border-2 border-gray-800 p-5 shadow-[2px_3px_0px_#333] flex-1 relative"
          style={{ transform: 'rotate(-0.3deg)' }}
        >
          <p
            className="text-sm font-bold text-gray-500 mb-1"
            style={{ fontFamily: '"Permanent Marker", cursive' }}
          >
            Total Tickets
          </p>
          <p
            className="text-4xl font-bold text-gray-900"
            style={{ fontFamily: '"Caveat", cursive' }}
          >
            {event.ticket_count}
          </p>
        </div>
      </div>
    </div>
  );
};
