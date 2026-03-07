/**
 * Scrapbook-styled ticket purchase confirmation modal.
 * Displays as a giant ticket stub with event details.
 */

interface TicketConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  eventTitle: string;
  ticketType: string;
  price: string;
  needsAadharVerification?: boolean;
}

export function TicketConfirmationModal({
  isOpen,
  onClose,
  eventTitle,
  ticketType,
  price,
  needsAadharVerification,
}: TicketConfirmationModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md relative">
        {/* Scattered emoji confetti */}
        <span
          className="absolute -top-6 left-4 text-2xl animate-bounce"
          style={{ animationDelay: '0s' }}
        >
          🎉
        </span>
        <span
          className="absolute -top-4 right-8 text-xl animate-bounce"
          style={{ animationDelay: '0.2s' }}
        >
          ✨
        </span>
        <span
          className="absolute -bottom-4 left-10 text-xl animate-bounce"
          style={{ animationDelay: '0.4s' }}
        >
          🎊
        </span>
        <span
          className="absolute -bottom-6 right-6 text-2xl animate-bounce"
          style={{ animationDelay: '0.1s' }}
        >
          🥳
        </span>
        <span
          className="absolute top-1/2 -left-6 text-lg animate-bounce"
          style={{ animationDelay: '0.3s' }}
        >
          ⭐
        </span>
        <span
          className="absolute top-1/3 -right-5 text-lg animate-bounce"
          style={{ animationDelay: '0.5s' }}
        >
          🎶
        </span>

        {/* Giant Ticket Stub */}
        <div
          className="border-2 border-gray-800 bg-[#fff9e6] shadow-[4px_6px_0px_#333] flex overflow-hidden"
          style={{ transform: 'rotate(-1.5deg)' }}
        >
          {/* Left section — ADMIT ONE */}
          <div className="flex flex-col items-center justify-center px-6 py-8 border-r-2 border-dashed border-gray-400 bg-[#fff4cc] min-w-[120px]">
            <span
              className="font-bold text-gray-700 tracking-[0.25em] text-xs"
              style={{
                writingMode: 'vertical-rl',
                textOrientation: 'mixed',
                fontFamily: '"Permanent Marker"',
              }}
            >
              ADMIT ONE
            </span>
            {/* Circular hole punch effects */}
            <div className="w-4 h-4 rounded-full border-2 border-gray-400 mt-4 bg-[#f4f1ea]" />
            <div className="w-4 h-4 rounded-full border-2 border-gray-400 mt-2 bg-[#f4f1ea]" />
          </div>

          {/* Right section — Details */}
          <div className="flex-1 p-6 flex flex-col justify-center relative">
            {/* PAID stamp */}
            <div
              className="absolute top-4 right-4 px-4 py-1 border-3 font-bold tracking-widest"
              style={{
                fontFamily: '"Permanent Marker"',
                fontSize: '1rem',
                color: '#16a34a',
                border: '3px solid #16a34a',
                transform: 'rotate(-12deg)',
                opacity: 0.7,
              }}
            >
              PAID
            </div>

            <p
              className="text-gray-500 mb-1"
              style={{ fontFamily: '"Caveat", cursive', fontSize: '1rem' }}
            >
              you're going to...
            </p>
            <h2
              className="text-2xl text-gray-900 mb-3 leading-tight"
              style={{ fontFamily: '"Permanent Marker", cursive' }}
            >
              {eventTitle}
            </h2>

            <div className="flex items-baseline gap-3 mb-4">
              <span
                className="text-3xl text-gray-900"
                style={{ fontFamily: '"Permanent Marker"' }}
              >
                ${price}
              </span>
              <span
                className="text-gray-500 capitalize"
                style={{ fontFamily: '"Caveat", cursive', fontSize: '1.1rem' }}
              >
                {ticketType} access
              </span>
            </div>

            <p
              className="text-gray-400 text-xs mb-3"
              style={{ fontFamily: 'monospace' }}
            >
              Valid for one person · No refunds
            </p>

            {needsAadharVerification && (
              <div
                className="bg-red-100 border border-red-400 text-red-700 px-3 py-2 rounded relative mb-4 flex items-center gap-2"
                role="alert"
                style={{ fontFamily: '"Inter", sans-serif', fontSize: '0.8rem' }}
              >
                <strong className="font-bold">Important:</strong>
                <span className="block sm:inline">Add your Aadhar to complete ticket purchase.</span>
              </div>
            )}

            <button
              onClick={onClose}
              className="w-full border-2 border-gray-800 bg-blue-400 px-4 py-2.5 text-white shadow-[2px_3px_0px_#333] transition-all hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[1px_1px_0px_#333] hover:bg-blue-500"
              style={{ fontFamily: '"Permanent Marker"', fontSize: '1rem' }}
            >
              Got it! 🎉
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
