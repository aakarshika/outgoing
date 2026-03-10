import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';
import {
  Camera,
  CheckCircle2,
  RefreshCw,
  ShieldAlert,
  Smartphone,
  Ticket as TicketIcon,
  X,
  XCircle,
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';

import { TicketValidationResult } from '@/features/tickets/api';

interface QRScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onScanResult: (decodedText: string) => Promise<TicketValidationResult | null>;
  onAdmitEvent: (ticketId: number, isVendor?: boolean) => Promise<boolean>;
}

export function QRScannerModal({
  isOpen,
  onClose,
  onScanResult,
  onAdmitEvent,
}: QRScannerModalProps) {
  const [scanResult, setScanResult] = useState<TicketValidationResult | null>(null);
  const [scanError, setScanError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isCameraReady, setIsCameraReady] = useState(false);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [isSecure, setIsSecure] = useState(true);

  const html5QrCodeRef = useRef<Html5Qrcode | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Check for secure context
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const secure = window.isSecureContext || window.location.hostname === 'localhost';
      setIsSecure(secure);
    }
  }, []);

  const stopScanner = async () => {
    if (html5QrCodeRef.current && html5QrCodeRef.current.isScanning) {
      try {
        await html5QrCodeRef.current.stop();
      } catch (err) {
        console.error('Failed to stop scanner:', err);
      }
    }
  };

  const startScanner = async () => {
    if (!isOpen || !isSecure) return;

    try {
      if (!html5QrCodeRef.current) {
        html5QrCodeRef.current = new Html5Qrcode('reader', {
          formatsToSupport: [Html5QrcodeSupportedFormats.QR_CODE],
        });
      }

      await stopScanner();

      setIsCameraReady(false);

      await html5QrCodeRef.current.start(
        { facingMode },
        {
          fps: 10,
          qrbox: (viewfinderWidth, viewfinderHeight) => {
            const minEdge = Math.min(viewfinderWidth, viewfinderHeight);
            const qrboxSize = Math.floor(minEdge * 0.7);
            return { width: qrboxSize, height: qrboxSize };
          },
        },
        async (decodedText) => {
          console.log('[QRScanner] DETECTED:', decodedText);
          if (isProcessing || scanResult || scanError) {
            console.log('[QRScanner] Busy or has result, ignoring scan');
            return;
          }

          setIsProcessing(true);

          if (navigator.vibrate) navigator.vibrate(50);

          try {
            console.log('[QRScanner] CALLING onScanResult with:', decodedText);
            const result = await onScanResult(decodedText);
            if (result) {
              console.log('[QRScanner] VALIDATION SUCCESS:', result.attendee_name);
              setScanResult(result);
              if (html5QrCodeRef.current?.isScanning) {
                html5QrCodeRef.current.pause();
              }
            } else {
              console.warn('[QRScanner] VALIDATION RETURNED NULL');
              setScanError('Unknown or invalid QR code format.');
            }
          } catch (err: any) {
            console.error('[QRScanner] VALIDATION ERROR:', err);
            setScanError(err.message || 'Invalid ticket code.');
          } finally {
            setIsProcessing(false);
          }
        },
        (errorMessage) => {
          // Log frame errors very sparingly
          if (Math.random() < 0.005)
            console.log('[QRScanner] Frame error:', errorMessage);
        },
      );

      setIsCameraReady(true);
      setHasPermission(true);
    } catch (err: any) {
      console.error('Camera start error:', err);
      if (
        err.toString().includes('NotAllowedError') ||
        err.toString().includes('Permission denied')
      ) {
        setHasPermission(false);
      } else {
        toast.error('Could not start camera. Please refresh.');
      }
    }
  };

  useEffect(() => {
    if (isOpen && isSecure) {
      startScanner();
    } else {
      stopScanner();
      setScanResult(null);
      setScanError(null);
      setIsProcessing(false);
      setIsCameraReady(false);
    }

    return () => {
      stopScanner();
    };
  }, [isOpen, facingMode, isSecure]);

  const handleReset = () => {
    setScanResult(null);
    setScanError(null);
    setIsProcessing(false);
    if (html5QrCodeRef.current) {
      html5QrCodeRef.current.resume();
    }
  };

  const toggleCamera = () => {
    setFacingMode((prev) => (prev === 'environment' ? 'user' : 'environment'));
  };

  const handleAdmit = async () => {
    if (!scanResult) return;
    setIsProcessing(true);
    const success = await onAdmitEvent(scanResult.ticket_id, scanResult.is_vendor);
    if (success) {
      toast.success(`${scanResult.attendee_name} Admitted!`);
      if (navigator.vibrate) navigator.vibrate([100, 50, 100]);
      setTimeout(() => {
        handleReset();
      }, 1000);
    } else {
      setIsProcessing(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] bg-black flex flex-col pt-[max(env(safe-area-inset-top),20px)]">
      {/* Top Navigation */}
      <div className="flex justify-between items-center px-6 py-4 text-white shrink-0 z-50">
        <h2
          className="text-xl flex items-center gap-2"
          style={{ fontFamily: '"Permanent Marker"' }}
        >
          <Camera size={24} /> Entry Scanner
        </h2>
        <button
          onClick={onClose}
          className="p-2 bg-white/20 hover:bg-white/30 rounded-full transition-colors"
        >
          <X size={24} />
        </button>
      </div>

      {/* Secure Context Warning */}
      {!isSecure && (
        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-gray-900">
          <ShieldAlert size={64} className="text-red-500 mb-4 animate-bounce" />
          <h3 className="text-2xl font-black text-white mb-2 uppercase tracking-wide">
            Secure Connection Required
          </h3>
          <p className="text-gray-400 mb-6">
            Browsers only allow camera access over <b>HTTPS</b> or <b>localhost</b>.
          </p>
          <div className="bg-red-500/10 border-2 border-red-500/30 p-4 rounded-lg text-red-400 text-sm font-mono mb-6 break-all">
            https://{window.location.host}
          </div>
          <p className="text-sm text-gray-500 italic">
            Please use the exact URL shown above starting with <b>https://</b>
          </p>
        </div>
      )}

      {/* Permission Denied Error */}
      {isSecure && hasPermission === false && (
        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-gray-900">
          <Smartphone size={64} className="text-yellow-500 mb-4" />
          <h3 className="text-2xl font-black text-white mb-2 uppercase tracking-wide">
            Camera Blocked
          </h3>
          <p className="text-gray-400 mb-6">
            Please allow camera access in your browser settings to scan tickets.
          </p>
          <button
            onClick={startScanner}
            className="px-6 py-3 bg-emerald-500 text-gray-900 font-bold rounded-lg hover:bg-emerald-400 transition-colors"
          >
            Try Again
          </button>
        </div>
      )}

      {/* Main Viewfinder */}
      {isSecure && hasPermission !== false && (
        <div className="flex-1 flex flex-col justify-center items-center overflow-hidden relative">
          {/* Scanner Container */}
          <div
            className={`w-full h-full max-w-lg mx-auto overflow-hidden relative transition-opacity duration-300 ${
              scanResult || scanError ? 'opacity-30 blur-sm' : 'opacity-100'
            }`}
            style={{ background: '#000' }}
          >
            <div
              id="reader"
              className="w-full h-full [&>video]:object-cover [&>video]:h-full [&>video]:w-full"
            ></div>

            {/* Custom Animated Viewfinder Frame */}
            <div className="absolute inset-0 pointer-events-none flex items-center justify-center z-10">
              <div className="w-[250px] h-[250px] border-2 border-white/20 rounded-3xl relative">
                {/* Corner Accents */}
                <div className="absolute -top-1 -left-1 w-8 h-8 border-t-4 border-l-4 border-emerald-400 rounded-tl-xl" />
                <div className="absolute -top-1 -right-1 w-8 h-8 border-t-4 border-r-4 border-emerald-400 rounded-tr-xl" />
                <div className="absolute -bottom-1 -left-1 w-8 h-8 border-b-4 border-l-4 border-emerald-400 rounded-bl-xl" />
                <div className="absolute -bottom-1 -right-1 w-8 h-8 border-b-4 border-r-4 border-emerald-400 rounded-br-xl" />

                {/* Scanning Ray */}
                {!scanResult && !scanError && isCameraReady && (
                  <div className="absolute inset-x-0 h-1 bg-emerald-400/50 shadow-[0_0_15px_#34d399] animate-[scan_2s_ease-in-out_infinite]" />
                )}
              </div>
            </div>

            {/* Camera Toggle Button */}
            <button
              onClick={toggleCamera}
              className="absolute bottom-10 right-10 z-20 p-4 bg-white/20 hover:bg-white/30 rounded-full text-white backdrop-blur-md border border-white/30 transition-all active:scale-95"
            >
              <RefreshCw size={28} />
            </button>
          </div>

          {/* Verifying Spinner */}
          {isProcessing && !scanResult && !scanError && (
            <div className="absolute inset-0 flex items-center justify-center z-30">
              <div className="bg-black/60 backdrop-blur-sm px-6 py-4 rounded-2xl border-2 border-white/20 flex items-center gap-3">
                <div className="w-5 h-5 border-3 border-emerald-400 border-t-transparent rounded-full animate-spin" />
                <span className="text-white font-bold tracking-widest text-lg">
                  VERIFYING...
                </span>
              </div>
            </div>
          )}

          {/* Feedback Overlays (Success/Error) */}
          {(scanResult || scanError) && (
            <div className="absolute inset-x-0 bottom-0 top-0 flex items-center justify-center p-6 z-40 bg-black/40 backdrop-blur-md">
              <div
                className="bg-white p-6 w-full max-w-sm rounded-[2rem] shadow-2xl border-4 relative overflow-hidden"
                style={{
                  borderColor: scanResult?.valid ? '#059669' : '#DC2626',
                  transform: 'rotate(-0.5deg)',
                }}
              >
                {scanError ? (
                  <div className="text-center py-4">
                    <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
                      <XCircle size={48} className="text-red-600" />
                    </div>
                    <h3 className="text-2xl font-black text-gray-900 mb-2 uppercase tracking-wide">
                      Invalid Code
                    </h3>
                    <p className="text-gray-700 font-bold mb-8 px-4 leading-tight">
                      {scanError}
                    </p>

                    <button
                      onClick={handleReset}
                      className="w-full py-4 font-black uppercase tracking-widest text-[#111] bg-yellow-400 border-4 border-[#111] shadow-[4px_4px_0_0_#111] hover:shadow-none hover:translate-x-1 hover:translate-y-1 transition-all"
                      style={{ fontFamily: '"Permanent Marker"' }}
                    >
                      Try Again
                    </button>
                  </div>
                ) : scanResult && scanResult.valid ? (
                  <div className="text-center">
                    <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
                      <CheckCircle2 size={48} className="text-emerald-600" />
                    </div>
                    <h3
                      className="text-3xl font-black text-gray-900 mb-1"
                      style={{ fontFamily: '"Caveat", cursive' }}
                    >
                      {scanResult.attendee_name}
                    </h3>
                    <p className="text-gray-500 font-bold mb-6 text-sm uppercase tracking-widest">
                      @{scanResult.attendee_username}
                    </p>

                    <div className="bg-gray-50 p-5 rounded-2xl mb-8 flex items-center gap-4 text-left border-2 border-gray-100 shadow-inner">
                      <div className="bg-emerald-100 p-3 rounded-xl">
                        <TicketIcon size={24} className="text-emerald-600" />
                      </div>
                      <div>
                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-[0.2em] mb-1">
                          Pass Access
                        </p>
                        <p className="font-black text-gray-900 text-xl leading-none">
                          {scanResult.ticket_type}
                        </p>
                      </div>
                    </div>

                    <button
                      onClick={handleAdmit}
                      disabled={isProcessing}
                      className="w-full py-5 text-white font-black uppercase tracking-widest bg-emerald-600 border-4 border-emerald-800 shadow-[4px_4px_0_0_#064e3b] hover:shadow-none hover:translate-x-1 hover:translate-y-1 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                      style={{ fontFamily: '"Permanent Marker"' }}
                    >
                      {isProcessing ? 'ADMITTING...' : 'ADMIT GUEST'}
                    </button>
                  </div>
                ) : null}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Footer Instructions (Mobile) */}
      {isSecure && hasPermission !== false && !scanResult && !scanError && (
        <div className="shrink-0 p-8 text-center text-gray-400">
          <p
            className="text-sm font-medium tracking-wide mb-1"
            style={{ fontFamily: '"Caveat", cursive', fontSize: '1.2rem' }}
          >
            Scan the ticket QR shown on the buyer's screen
          </p>
          <div className="flex items-center justify-center gap-2 text-[10px] uppercase tracking-[0.2em] font-bold text-gray-600">
            <Smartphone size={12} /> Mobile Check-in Mode
          </div>
        </div>
      )}

      <style>{`
                @keyframes scan {
                    0% { top: 0; }
                    50% { top: 100%; }
                    100% { top: 0; }
                }
            `}</style>
    </div>
  );
}
