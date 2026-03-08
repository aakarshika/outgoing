import { useState } from 'react';
import { Scan, Users, MessageSquare, Play, QrCode, XCircle, Ticket as TicketIcon } from 'lucide-react';
import { EventDetail } from '@/types/events';
import { useTransitionEventLifecycle, useEventAttendees } from '@/features/events/hooks';
import { toast } from 'sonner';
import { QRScannerModal } from '@/components/events/QRScannerModal';
import { useTicketValidation, useTicketAdmission } from '@/features/tickets/hooks';
import { admitTicket, validateTicket } from '@/features/tickets/api';

interface LiveAttendanceStepProps {
    event: EventDetail;
    readonly?: boolean;
}

export function LiveAttendanceStep({ event, readonly }: LiveAttendanceStepProps) {
    const transitionLifecycle = useTransitionEventLifecycle();
    const { data: attendeesResponse, refetch: refetchAttendees } = useEventAttendees(event.id);
    const attendees = attendeesResponse?.data || [];

    const [isScannerOpen, setIsScannerOpen] = useState(false);
    const [entryBarcode, setEntryBarcode] = useState('');
    const {
        validate: validateBarcode,
        result: validationResult,
        reset: resetValidation,
        isLoading: isValidating,
        error: validationError,
        errorCode: validationErrorCode
    } = useTicketValidation();
    const {
        admit: performAdmit,
        isLoading: isAdmitting,
        admitted,
        reset: resetAdmission,
        error: admitError
    } = useTicketAdmission();

    const isLive = event.lifecycle_state === 'live';

    const handleGoLive = async () => {
        try {
            await transitionLifecycle.mutateAsync({
                eventId: event.id,
                toState: 'live',
            });
            toast.success('Event is now LIVE!');
        } catch (err: any) {
            toast.error(err?.response?.data?.message || 'Failed to start live event');
        }
    };

    const handleValidate = async () => {
        if (!entryBarcode.trim()) return;
        resetAdmission();
        await validateBarcode({ barcode: entryBarcode.trim(), eventId: event.id });
    };

    const handleAdmit = async () => {
        if (!validationResult) return;
        try {
            await performAdmit(validationResult.ticket_id, event.id);
            toast.success(`${validationResult.attendee_name} admitted!`);
            refetchAttendees();
        } catch (err) {
            // Error handled by hook
        }
    };

    const handleResetEntry = () => {
        setEntryBarcode('');
        resetValidation();
        resetAdmission();
    };

    return (
        <div className="space-y-8">
            {/* Go Live Action */}
            {!isLive && event.lifecycle_state === 'event_ready' && !readonly && (
                <div className="bg-red-50 border-4 border-red-500 p-8 shadow-[6px_6px_0px_#991b1b] relative overflow-hidden animate-pulse">
                    <div className="relative z-10 flex flex-col items-center">
                        <Play className="h-16 w-16 text-red-600 mb-4 fill-red-600" />
                        <h2 className="text-3xl font-black text-red-900 mb-4" style={{ fontFamily: '"Permanent Marker", cursive' }}>
                            READY TO GO LIVE?
                        </h2>
                        <button
                            onClick={handleGoLive}
                            disabled={transitionLifecycle.isPending}
                            className="px-12 py-4 bg-red-600 text-white border-2 border-gray-900 shadow-[4px_4px_0px_#333] font-bold text-2xl hover:-translate-y-[1px] hover:shadow-[5px_5px_0px_#333] transition-all"
                            style={{ fontFamily: '"Permanent Marker", cursive' }}
                        >
                            {transitionLifecycle.isPending ? 'Starting...' : 'START LIVE EVENT'}
                        </button>
                    </div>
                </div>
            )}

            {/* Attendance & Scanning */}
            <div className="bg-white border-2 border-gray-800 p-8 shadow-[4px_4px_0px_#333] relative">
                <div className="absolute -top-4 left-10 px-4 py-1 bg-yellow-400 text-gray-900 font-bold border-2 border-gray-800 rotate-1 shadow-[2px_2px_0px_#333]">
                    ATTENDANCE BOX
                </div>

                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8 mt-4">
                    <div className="flex items-center gap-3">
                        <Users className="h-8 w-8 text-gray-800" />
                        <div>
                            <h3 className="text-xl font-bold" style={{ fontFamily: '"Permanent Marker", cursive' }}>
                                Attendees ({attendees.filter((att) => att.status === 'used').length} / {attendees.length})
                            </h3>
                            <p className="text-sm text-gray-600 italic" style={{ fontFamily: '"Caveat", cursive', fontSize: '1.2rem' }}>
                                Scan tickets or check history
                            </p>
                        </div>
                    </div>

                    {!readonly && (
                        <div className="flex flex-col sm:flex-row gap-3">
                            <button
                                onClick={() => setIsScannerOpen(true)}
                                className="flex items-center justify-center gap-2 px-6 py-3 bg-emerald-400 text-gray-900 border-2 border-gray-800 shadow-[3px_3px_0px_#333] font-bold hover:-translate-y-[1px] hover:shadow-[4px_4px_0px_#333] transition-all"
                                style={{ fontFamily: '"Permanent Marker", cursive' }}
                            >
                                <Scan className="h-5 w-5" /> SCAN TICKET
                            </button>
                        </div>
                    )}
                </div>

                {!readonly && (
                    <div className="mb-8 border-2 border-gray-100 p-6 bg-gray-50/50 rounded-xl">
                        <div className="flex items-center gap-2 mb-4 border-b-2 border-gray-200 pb-2 border-dashed">
                            <QrCode className="h-5 w-5 text-gray-800" />
                            <h4 className="font-bold uppercase tracking-wider text-sm" style={{ fontFamily: '"Permanent Marker", cursive' }}>
                                Manual Code Entry
                            </h4>
                        </div>

                        <div className="flex flex-col md:flex-row gap-3">
                            <div className="flex-1 relative">
                                <input
                                    type="text"
                                    value={entryBarcode}
                                    onChange={(e) => setEntryBarcode(e.target.value.toUpperCase())}
                                    onKeyDown={(e) => e.key === 'Enter' && handleValidate()}
                                    placeholder="Enter ticket barcode..."
                                    className="w-full rounded-lg border-2 border-gray-800 bg-white px-4 py-3 text-lg font-mono tracking-wider focus:ring-2 focus:ring-emerald-400 focus:border-emerald-600 transition-all shadow-[2px_2px_0px_#333]"
                                    style={{ fontFamily: '"JetBrains Mono", monospace' }}
                                    disabled={isValidating}
                                />
                                {entryBarcode && (
                                    <button
                                        type="button"
                                        onClick={handleResetEntry}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700"
                                    >
                                        ✕
                                    </button>
                                )}
                            </div>
                            <button
                                onClick={handleValidate}
                                disabled={!entryBarcode.trim() || isValidating}
                                className="px-8 py-3 bg-blue-400 text-gray-900 border-2 border-gray-800 shadow-[2px_2px_0px_#333] font-bold hover:-translate-y-[1px] hover:shadow-[3px_3px_0px_#333] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                style={{ fontFamily: '"Permanent Marker", cursive' }}
                            >
                                {isValidating ? 'Checking...' : 'VALIDATE'}
                            </button>
                        </div>

                        {/* Manual Validation Results */}
                        {validationErrorCode === 'ALREADY_USED' ? (
                            <div className="mt-8 relative max-w-lg mx-auto">
                                <div
                                    className="border-4 border-gray-800 bg-[#fff9e6] shadow-[6px_8px_0px_#333] flex overflow-hidden relative"
                                    style={{ transform: 'rotate(-1deg)' }}
                                >
                                    {/* Left section — ADMIT ONE */}
                                    <div className="flex flex-col items-center justify-center px-4 py-8 border-r-4 border-dashed border-gray-400 bg-[#fff4cc] min-w-[100px]">
                                        <span
                                            className="font-bold text-gray-700 tracking-[0.25em] text-[10px]"
                                            style={{
                                                writingMode: 'vertical-rl',
                                                textOrientation: 'mixed',
                                                fontFamily: '"Permanent Marker"',
                                            }}
                                        >
                                            ADMIT ONE
                                        </span>
                                        <div className="w-4 h-4 rounded-full border-2 border-gray-400 mt-4 bg-[#f4f1ea]" />
                                        <div className="w-4 h-4 rounded-full border-2 border-gray-400 mt-2 bg-[#f4f1ea]" />
                                    </div>

                                    {/* Right section — Details */}
                                    <div className="flex-1 p-6 flex flex-col justify-center relative">
                                        {/* ADMITTED stamp */}
                                        <div
                                            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 px-6 py-2 border-4 font-black tracking-widest text-3xl animate-in zoom-in-150 duration-300"
                                            style={{
                                                fontFamily: '"Permanent Marker"',
                                                color: '#059669',
                                                borderColor: '#059669',
                                                transform: 'translate(-50%, -50%) rotate(-15deg)',
                                                opacity: 0.85,
                                                backgroundColor: 'rgba(255, 255, 255, 0.95)',
                                                zIndex: 20,
                                                boxShadow: '0 0 0 4px rgba(5, 150, 105, 0.1)'
                                            }}
                                        >
                                            ADMITTED
                                        </div>

                                        <p className="text-gray-500 mb-1" style={{ fontFamily: '"Caveat", cursive', fontSize: '1.1rem' }}>
                                            already checked in...
                                        </p>
                                        <h3 className="text-2xl font-bold text-gray-900 leading-tight mb-2" style={{ fontFamily: '"Permanent Marker", cursive' }}>
                                            {validationResult?.attendee_name || "GUEST"}
                                        </h3>
                                        <p className="text-lg font-bold" style={{
                                            fontFamily: '"Caveat", cursive',
                                            color: validationResult?.tier_color || '#333',
                                            fontSize: '1.3rem'
                                        }}>
                                            {validationResult?.tier_name || "Verified"} Pass
                                        </p>
                                    </div>
                                </div>
                                <button
                                    onClick={handleResetEntry}
                                    className="mt-8 w-full py-4 bg-white border-2 border-gray-800 font-bold hover:bg-amber-50 transition-all shadow-[4px_4px_0px_#333] flex items-center justify-center gap-2"
                                    style={{ fontFamily: '"Permanent Marker", cursive', fontSize: '1.2rem' }}
                                >
                                    BACK TO SCANNER
                                </button>
                            </div>
                        ) : validationError && (
                            <div className="mt-4 bg-red-50 border-2 border-red-400 p-4 shadow-[2px_2px_0px_#dc2626] flex items-start gap-3">
                                <XCircle className="h-6 w-6 text-red-500 flex-shrink-0 mt-0.5" />
                                <div>
                                    <h4 className="font-bold text-red-800" style={{ fontFamily: '"Permanent Marker", cursive' }}>
                                        Invalid Ticket
                                    </h4>
                                    <p className="text-red-700 text-sm" style={{ fontFamily: '"Caveat", cursive', fontSize: '1.1rem' }}>
                                        {validationError}
                                    </p>
                                </div>
                            </div>
                        )}

                        {validationResult && !admitted && (
                            <div className="mt-4 bg-emerald-50 border-2 border-emerald-600 p-5 shadow-[2px_2px_0px_#059669]">
                                <div className="grid grid-cols-2 gap-4 mb-4">
                                    <div>
                                        <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Attendee</p>
                                        <p className="text-xl font-bold text-gray-900" style={{ fontFamily: '"Caveat", cursive' }}>
                                            {validationResult.attendee_name}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Ticket Type</p>
                                        <p className="text-xl font-bold" style={{ fontFamily: '"Caveat", cursive', color: validationResult.tier_color || '#333' }}>
                                            {validationResult.tier_name}
                                        </p>
                                    </div>
                                </div>

                                {admitError && (
                                    <div className="mb-4 p-3 bg-red-100 border border-red-300 rounded text-red-700 text-sm font-bold">
                                        {admitError}
                                    </div>
                                )}

                                <div className="flex gap-2">
                                    <button
                                        onClick={handleAdmit}
                                        disabled={isAdmitting}
                                        className="flex-1 py-3 bg-emerald-400 text-gray-900 border-2 border-gray-800 shadow-[2px_2px_0px_#333] font-bold hover:-translate-y-[1px] hover:shadow-[3px_3px_0px_#333] transition-all"
                                        style={{ fontFamily: '"Permanent Marker", cursive' }}
                                    >
                                        {isAdmitting ? 'Admitting...' : 'ADMIT ATTENDEE'}
                                    </button>
                                    <button
                                        onClick={handleResetEntry}
                                        className="px-6 py-3 bg-white text-gray-600 border-2 border-gray-800 shadow-[2px_2px_0px_#333] font-bold hover:bg-gray-50 transition-all"
                                        style={{ fontFamily: '"Permanent Marker", cursive' }}
                                    >
                                        CANCEL
                                    </button>
                                </div>
                            </div>
                        )}

                        {admitted && (
                            <div className="mt-8 relative max-w-lg mx-auto">
                                <div
                                    className="border-4 border-gray-800 bg-[#fff9e6] shadow-[6px_8px_0px_#333] flex overflow-hidden relative"
                                    style={{ transform: 'rotate(1deg)' }}
                                >
                                    {/* Left section — ADMIT ONE */}
                                    <div className="flex flex-col items-center justify-center px-4 py-8 border-r-4 border-dashed border-gray-400 bg-[#fff4cc] min-w-[100px]">
                                        <span
                                            className="font-bold text-gray-700 tracking-[0.25em] text-[10px]"
                                            style={{
                                                writingMode: 'vertical-rl',
                                                textOrientation: 'mixed',
                                                fontFamily: '"Permanent Marker"',
                                            }}
                                        >
                                            ADMIT ONE
                                        </span>
                                        <div className="w-4 h-4 rounded-full border-2 border-gray-400 mt-4 bg-[#f4f1ea]" />
                                        <div className="w-4 h-4 rounded-full border-2 border-gray-400 mt-2 bg-[#f4f1ea]" />
                                    </div>

                                    {/* Right section — Details */}
                                    <div className="flex-1 p-6 flex flex-col justify-center relative">
                                        {/* ADMITTED stamp */}
                                        <div
                                            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 px-6 py-2 border-4 font-black tracking-widest text-3xl animate-in zoom-in-150 duration-500"
                                            style={{
                                                fontFamily: '"Permanent Marker"',
                                                color: '#16a34a', // greener for success
                                                borderColor: '#16a34a',
                                                transform: 'translate(-50%, -50%) rotate(12deg)',
                                                opacity: 0.9,
                                                backgroundColor: 'rgba(255, 255, 255, 0.95)',
                                                zIndex: 20,
                                                boxShadow: '0 0 0 4px rgba(22, 163, 74, 0.1)'
                                            }}
                                        >
                                            ADMITTED
                                        </div>

                                        <p className="text-gray-500 mb-1" style={{ fontFamily: '"Caveat", cursive', fontSize: '1.1rem' }}>
                                            valid entry!
                                        </p>
                                        <h3 className="text-2xl font-bold text-gray-900 leading-tight mb-2" style={{ fontFamily: '"Permanent Marker", cursive' }}>
                                            {validationResult?.attendee_name || "GUEST"}
                                        </h3>
                                        <p className="text-lg font-bold" style={{
                                            fontFamily: '"Caveat", cursive',
                                            color: validationResult?.tier_color || '#333',
                                            fontSize: '1.3rem'
                                        }}>
                                            {validationResult?.tier_name || "Standard"} Pass
                                        </p>
                                    </div>
                                </div>
                                <button
                                    onClick={handleResetEntry}
                                    className="mt-8 w-full py-4 bg-emerald-400 border-2 border-gray-800 font-bold hover:bg-emerald-500 transition-all shadow-[4px_4px_0px_#333] flex items-center justify-center gap-2"
                                    style={{ fontFamily: '"Permanent Marker", cursive', fontSize: '1.2rem' }}
                                >
                                    SCAN NEXT TICKET <TicketIcon className="h-6 w-6" />
                                </button>
                            </div>
                        )}
                    </div>
                )}

                {/* Attendee List Placeholder (Customized) */}
                <div className="max-h-96 overflow-y-auto border-2 border-gray-100 rounded-lg p-4 no-scrollbar">
                    {attendees.length === 0 ? (
                        <p className="text-center text-gray-400 py-10 italic" style={{ fontFamily: '"Caveat", cursive', fontSize: '1.3rem' }}>
                            No one has checked in yet...
                        </p>
                    ) : (
                        <div className="grid gap-3">
                            {attendees.map((att, idx) => (
                                <div
                                    key={att.id}
                                    className="flex items-center justify-between p-3 bg-gray-50 border-2 border-gray-200 rounded transition-all hover:border-gray-400"
                                    style={{ transform: `rotate(${idx % 2 === 0 ? 0.3 : -0.3}deg)` }}
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="h-10 w-10 rounded-full border-2 border-gray-800 bg-white overflow-hidden shadow-[1px_1px_0px_#333]">
                                            {att.user.avatar ? (
                                                <img src={att.user.avatar} alt={att.user.username} className="h-full w-full object-cover" />
                                            ) : (
                                                <div className="h-full w-full flex items-center justify-center text-gray-400 font-bold">
                                                    {att.user.username[0].toUpperCase()}
                                                </div>
                                            )}
                                        </div>
                                        <div>
                                            <p className="font-bold text-gray-900" style={{ fontFamily: '"Caveat", cursive', fontSize: '1.2rem' }}>
                                                {att.attendee_name || att.user.username}
                                            </p>
                                            <p className="text-[10px] uppercase font-bold text-gray-500">
                                                {att.ticket_type} • {att.status}
                                            </p>
                                        </div>
                                    </div>
                                    {att.status === 'used' ? (
                                        <div
                                            className="px-3 py-1 border-2 border-emerald-600 font-bold text-[10px] tracking-tight bg-emerald-50 text-emerald-700 opacity-90 shadow-sm"
                                            style={{
                                                fontFamily: '"Permanent Marker", cursive',
                                                transform: 'rotate(-8deg)',
                                                boxShadow: '2px 2px 0px rgba(5, 150, 105, 0.2)'
                                            }}
                                        >
                                            ADMITTED
                                        </div>
                                    ) : (
                                        <div className="px-3 py-1.5 rounded bg-blue-100 border border-blue-300">
                                            <span className="text-[10px] font-bold text-blue-600 uppercase tracking-wider">PENDING</span>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Live Chat / Messages */}
            <div className="grid md:grid-cols-2 gap-6">
                <div className="bg-white border-2 border-gray-800 p-6 shadow-[3px_4px_0px_#333] relative">
                    <h3 className="text-lg font-bold mb-4 flex items-center gap-2" style={{ fontFamily: '"Permanent Marker", cursive' }}>
                        <MessageSquare className="h-5 w-5" /> Live Chat
                    </h3>
                    <div className="h-32 border-2 border-dashed border-gray-200 rounded flex items-center justify-center text-gray-400 italic" style={{ fontFamily: '"Caveat", cursive', fontSize: '1.1rem' }}>
                        Chat will appear once live...
                    </div>
                </div>
                <div className="bg-white border-2 border-gray-800 p-6 shadow-[3px_4px_0px_#333] relative">
                    <h3 className="text-lg font-bold mb-4 flex items-center gap-2" style={{ fontFamily: '"Permanent Marker", cursive' }}>
                        <MessageSquare className="h-5 w-5" /> Host Notes
                    </h3>
                    <div className="h-32 border-2 border-dashed border-gray-200 rounded flex items-center justify-center text-gray-400 italic" style={{ fontFamily: '"Caveat", cursive', fontSize: '1.1rem' }}>
                        Broadcast messages to all goers...
                    </div>
                </div>
            </div>

            {isScannerOpen && (
                <QRScannerModal
                    isOpen={isScannerOpen}
                    onClose={() => setIsScannerOpen(false)}
                    onScanResult={async (barcode) => {
                        const res = await validateTicket({ barcode: barcode.trim(), eventId: event.id });
                        return res.success ? res.data : null;
                    }}
                    onAdmitEvent={async (ticketId) => {
                        const res = await admitTicket(ticketId, event.id);
                        if (res.success) {
                            refetchAttendees();
                            return true;
                        }
                        return false;
                    }}
                />
            )}
        </div>
    );
}
