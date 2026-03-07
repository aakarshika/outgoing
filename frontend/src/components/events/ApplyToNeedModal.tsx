import { useState } from 'react';
import { toast } from 'sonner';

import { useApplyToNeed } from '@/features/needs/hooks';
import { useMyServices } from '@/features/vendors/hooks';

interface ApplyToNeedModalProps {
    isOpen: boolean;
    onClose: () => void;
    needId: number;
    needTitle: string;
}

export function ApplyToNeedModal({ isOpen, onClose, needId, needTitle }: ApplyToNeedModalProps) {
    const { data: myServicesResponse } = useMyServices();
    const myServices = myServicesResponse?.data || [];

    const applyMutation = useApplyToNeed();

    const [serviceId, setServiceId] = useState<number | ''>('');
    const [message, setMessage] = useState('');
    const [proposedPrice, setProposedPrice] = useState('');

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await applyMutation.mutateAsync({
                needId,
                payload: {
                    service_id: serviceId || null,
                    message,
                    proposed_price: proposedPrice || null,
                },
            });
            toast.success('Application submitted successfully!');
            onClose();
            setServiceId('');
            setMessage('');
            setProposedPrice('');
        } catch (err: any) {
            toast.error(err?.response?.data?.message || 'Failed to submit application');
        }
    };

    const inputClass =
        'w-full border-2 border-gray-800 bg-white px-4 py-2.5 text-base outline-none shadow-[2px_3px_0px_#333] transition-all focus:translate-x-[1px] focus:translate-y-[1px] focus:shadow-[1px_1px_0px_#333] focus:ring-0 placeholder:text-gray-400';

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="w-full max-w-lg relative">
                {/* Washi tape top */}
                <div
                    className="absolute -top-3 left-[20%] w-28 h-7 z-10 pointer-events-none"
                    style={{ background: 'rgba(251, 191, 36, 0.5)', transform: 'rotate(-4deg)', border: '1px solid rgba(0,0,0,0.05)' }}
                />
                <div
                    className="absolute -top-2 right-[15%] w-24 h-6 z-10 pointer-events-none"
                    style={{ background: 'rgba(239, 68, 68, 0.35)', transform: 'rotate(6deg)', border: '1px solid rgba(0,0,0,0.05)' }}
                />

                <div
                    className="border-2 border-gray-800 bg-[#fdfdfd] shadow-[4px_6px_0px_#333] overflow-hidden"
                    style={{
                        backgroundImage: 'linear-gradient(to right, rgba(0,0,0,0.02) 1px, transparent 1px), linear-gradient(transparent 95%, #e5e7eb 100%)',
                        backgroundSize: '20px 20px, 100% 32px',
                        transform: 'rotate(-0.5deg)',
                    }}
                >
                    {/* Header — Classified ad style */}
                    <div className="px-6 pt-6 pb-4 border-b-2 border-gray-800">
                        <h3
                            className="font-black uppercase text-gray-900"
                            style={{ fontFamily: '"Playfair Display", serif', fontSize: '1.2rem', letterSpacing: '0.5px' }}
                        >
                            HELP WANTED APPLICATION
                        </h3>
                        <p
                            className="text-gray-500 mt-1"
                            style={{ fontFamily: '"Caveat", cursive', fontSize: '1.15rem' }}
                        >
                            applying for: <span className="font-bold text-gray-800">{needTitle}</span>
                        </p>
                    </div>

                    <form onSubmit={handleSubmit} className="p-6 space-y-5">
                        <div className="space-y-1.5">
                            <label
                                className="block font-bold text-gray-700"
                                style={{ fontFamily: '"Caveat", cursive', fontSize: '1.15rem' }}
                            >
                                Select Your Service (Optional)
                            </label>
                            <select
                                value={serviceId}
                                onChange={(e) => setServiceId(e.target.value ? Number(e.target.value) : '')}
                                className={inputClass}
                                style={{ fontFamily: '"Caveat", cursive', fontSize: '1.05rem' }}
                            >
                                <option value="">-- No specific service --</option>
                                {myServices.map((service: any) => (
                                    <option key={service.id} value={service.id}>
                                        {service.title} {service.base_price ? `(from $${service.base_price})` : ''}
                                    </option>
                                ))}
                            </select>
                            {myServices.length === 0 && (
                                <p className="text-amber-600" style={{ fontFamily: '"Caveat", cursive', fontSize: '0.95rem' }}>
                                    You haven't created any services yet. You can still apply without attaching one.
                                </p>
                            )}
                        </div>

                        <div className="space-y-1.5">
                            <label
                                className="block font-bold text-gray-700"
                                style={{ fontFamily: '"Caveat", cursive', fontSize: '1.15rem' }}
                            >
                                Message / Cover Letter
                            </label>
                            <textarea
                                value={message}
                                onChange={(e) => setMessage(e.target.value)}
                                rows={4}
                                placeholder="Why are you a good fit?"
                                className={`${inputClass} resize-none`}
                                style={{ fontFamily: '"Caveat", cursive', fontSize: '1.05rem' }}
                                required
                            />
                        </div>

                        <div className="space-y-1.5">
                            <label
                                className="block font-bold text-gray-700"
                                style={{ fontFamily: '"Caveat", cursive', fontSize: '1.15rem' }}
                            >
                                Proposed Price ($) (Optional)
                            </label>
                            <input
                                type="number"
                                step="0.01"
                                value={proposedPrice}
                                onChange={(e) => setProposedPrice(e.target.value)}
                                placeholder="e.g. 500.00"
                                className={inputClass}
                                style={{ fontFamily: '"Caveat", cursive', fontSize: '1.05rem' }}
                            />
                        </div>

                        <div className="flex justify-end gap-3 pt-4 border-t-2 border-dashed border-gray-300 mt-6">
                            <button
                                type="button"
                                onClick={onClose}
                                className="border-2 border-gray-800 bg-white px-5 py-2 text-gray-800 shadow-[2px_3px_0px_#333] transition-all hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[1px_1px_0px_#333] hover:bg-gray-100"
                                style={{ fontFamily: '"Permanent Marker"', fontSize: '0.85rem' }}
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={applyMutation.isPending}
                                className="border-2 border-gray-800 bg-blue-400 px-5 py-2 text-white shadow-[2px_3px_0px_#333] transition-all hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[1px_1px_0px_#333] hover:bg-blue-500 disabled:opacity-60 disabled:cursor-not-allowed"
                                style={{ fontFamily: '"Permanent Marker"', fontSize: '0.85rem' }}
                            >
                                {applyMutation.isPending ? 'Submitting...' : 'Submit Application →'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
