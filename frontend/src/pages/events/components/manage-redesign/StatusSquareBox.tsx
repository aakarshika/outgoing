import { CheckCircle, Play } from 'lucide-react';

interface StatusSquareBoxProps {
    readonly?: boolean;
    isDraftOrPublished: boolean;
    isEventReady: boolean;
    isLive: boolean;
    isCompleted: boolean;
    isPending: boolean;
    canGoLive: boolean;
    onGoLive: () => void;
}

export function StatusSquareBox({
    readonly,
    isDraftOrPublished,
    isEventReady,
    isLive,
    isCompleted,
    isPending,
    canGoLive,
    onGoLive,
}: StatusSquareBoxProps) {
    if (readonly) return null;

    const showReadyState = isDraftOrPublished || isEventReady;
    const pulse = showReadyState || isLive;

    if (!showReadyState && !isLive && !isCompleted) return null;

    return (
        <div
            className={[
                'aspect-square bg-red-50 border-4 border-red-500 p-8 shadow-[6px_6px_0px_#991b1b] relative overflow-hidden',
                pulse ? 'animate-pulse' : '',
            ]
                .filter(Boolean)
                .join(' ')}
        >
            {showReadyState && (
                <div className="relative z-10 flex flex-col items-center">
                    <Play className="h-16 w-16 text-red-600 mb-4 fill-red-600" />
                    <h2 className="text-3xl font-black text-red-900 mb-4" style={{ fontFamily: '"Permanent Marker", cursive' }}>
                        READY TO GO LIVE?
                    </h2>
                    <button
                        onClick={onGoLive}
                        disabled={isPending || !canGoLive}
                        className="px-12 py-4 bg-red-600 text-white border-2 border-gray-900 shadow-[4px_4px_0px_#333] font-bold text-2xl hover:-translate-y-[1px] hover:shadow-[5px_5px_0px_#333] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        style={{ fontFamily: '"Permanent Marker", cursive' }}
                    >
                        {isPending ? 'Starting...' : 'READY'}
                    </button>
                </div>
            )}
            {isLive && !showReadyState && (
                <div className="relative z-10 flex flex-col items-center">
                    <h2 className="text-3xl font-black text-red-900 mb-4 inline-flex items-center gap-2 justify-center" style={{ fontFamily: '"Permanent Marker", cursive' }}>
                        <CheckCircle className="h-5 w-5 text-red-600 fill-red-600" /> We are LIVE!
                    </h2>
                </div>
            )}
            {isCompleted && !showReadyState && !isLive && (
                <div className="relative z-10 flex flex-col items-center">
                    <h2 className="text-3xl font-black text-red-900 mb-4" style={{ fontFamily: '"Permanent Marker", cursive' }}>
                        Event is over
                    </h2>
                </div>
            )}
        </div>
    );
}
