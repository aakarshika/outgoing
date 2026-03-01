import { useState } from 'react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
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

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="bg-card w-full max-w-lg rounded-xl shadow-xl overflow-hidden border">
                <div className="p-6 border-b bg-muted/30">
                    <h3 className="text-xl font-bold">Apply for Need</h3>
                    <p className="text-sm text-muted-foreground mt-1">Applying for: <span className="font-medium text-foreground">{needTitle}</span></p>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div>
                        <label className="block text-sm font-medium mb-1">Select Your Service (Optional)</label>
                        <select
                            value={serviceId}
                            onChange={(e) => setServiceId(e.target.value ? Number(e.target.value) : '')}
                            className="w-full rounded-lg border bg-background px-4 py-2 text-sm"
                        >
                            <option value="">-- No specific service --</option>
                            {myServices.map(service => (
                                <option key={service.id} value={service.id}>
                                    {service.title} {service.base_price ? `(from $${service.base_price})` : ''}
                                </option>
                            ))}
                        </select>
                        {myServices.length === 0 && (
                            <p className="text-xs text-muted-foreground mt-1 text-amber-600 dark:text-amber-500">
                                You haven't created any services yet. You can still apply without attaching one.
                            </p>
                        )}
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-1">Message / Cover Letter</label>
                        <textarea
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            rows={4}
                            placeholder="Why are you a good fit?"
                            className="w-full rounded-lg border bg-background px-4 py-2 text-sm"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-1">Proposed Price ($) (Optional)</label>
                        <input
                            type="number"
                            step="0.01"
                            value={proposedPrice}
                            onChange={(e) => setProposedPrice(e.target.value)}
                            placeholder="e.g. 500.00"
                            className="w-full rounded-lg border bg-background px-4 py-2 text-sm"
                        />
                    </div>

                    <div className="flex justify-end gap-3 pt-4 border-t mt-6">
                        <Button type="button" variant="outline" onClick={onClose}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={applyMutation.isPending}>
                            {applyMutation.isPending ? 'Submitting...' : 'Submit Application'}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
}
