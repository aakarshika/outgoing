/** Create Event page — form for creating a new event. */

import { ArrowLeft, ImagePlus } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { createEvent } from '@/features/events/api';
import { useCategories } from '@/features/events/hooks';

export default function CreateEventPage() {
    const navigate = useNavigate();
    const { data: catResponse } = useCategories();
    const categories = catResponse?.data || [];
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [coverPreview, setCoverPreview] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setIsSubmitting(true);

        const form = e.currentTarget;
        const formData = new FormData(form);

        // Handle cover image separately if present
        const coverInput = form.querySelector<HTMLInputElement>('#cover_image');
        if (coverInput?.files?.[0]) {
            formData.set('cover_image', coverInput.files[0]);
        }

        try {
            const result = await createEvent(formData);
            toast.success('Event created!');
            navigate(`/events/${result.data.id}`);
        } catch (err: any) {
            toast.error(err?.response?.data?.message || 'Failed to create event');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleCoverChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = () => setCoverPreview(reader.result as string);
            reader.readAsDataURL(file);
        }
    };

    return (
        <div className="mx-auto max-w-2xl px-4 sm:px-6 py-8">
            <button
                onClick={() => navigate(-1)}
                className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors"
            >
                <ArrowLeft className="h-4 w-4" /> Back
            </button>

            <h1 className="text-2xl font-bold text-foreground mb-6">Create Event</h1>

            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Cover Image */}
                <div>
                    <label className="block text-sm font-medium mb-2">Cover Image</label>
                    <label
                        htmlFor="cover_image"
                        className="flex flex-col items-center justify-center h-48 rounded-xl border-2 border-dashed cursor-pointer hover:border-primary/50 transition-colors overflow-hidden"
                    >
                        {coverPreview ? (
                            <img src={coverPreview} alt="Cover preview" className="h-full w-full object-cover" />
                        ) : (
                            <div className="flex flex-col items-center gap-2 text-muted-foreground">
                                <ImagePlus className="h-8 w-8" />
                                <span className="text-sm">Click to upload (max 5 MB)</span>
                            </div>
                        )}
                    </label>
                    <input
                        id="cover_image"
                        name="cover_image"
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        onChange={handleCoverChange}
                        className="hidden"
                    />
                </div>

                {/* Title */}
                <div>
                    <label htmlFor="title" className="block text-sm font-medium mb-1">Title *</label>
                    <input
                        id="title"
                        name="title"
                        required
                        maxLength={200}
                        className="w-full rounded-lg border bg-background px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                        placeholder="Give your event a catchy title"
                    />
                </div>

                {/* Category */}
                <div>
                    <label htmlFor="category_id" className="block text-sm font-medium mb-1">Category *</label>
                    <select
                        id="category_id"
                        name="category_id"
                        required
                        className="w-full rounded-lg border bg-background px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/20"
                    >
                        <option value="">Select a category</option>
                        {categories.map((cat) => (
                            <option key={cat.id} value={cat.id}>
                                {cat.name}
                            </option>
                        ))}
                    </select>
                </div>

                {/* Description */}
                <div>
                    <label htmlFor="description" className="block text-sm font-medium mb-1">Description *</label>
                    <textarea
                        id="description"
                        name="description"
                        required
                        rows={5}
                        className="w-full rounded-lg border bg-background px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/20 resize-none"
                        placeholder="Tell people what your event is about..."
                    />
                </div>

                {/* Date & Time */}
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label htmlFor="start_time" className="block text-sm font-medium mb-1">Start *</label>
                        <input
                            id="start_time"
                            name="start_time"
                            type="datetime-local"
                            required
                            className="w-full rounded-lg border bg-background px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/20"
                        />
                    </div>
                    <div>
                        <label htmlFor="end_time" className="block text-sm font-medium mb-1">End *</label>
                        <input
                            id="end_time"
                            name="end_time"
                            type="datetime-local"
                            required
                            className="w-full rounded-lg border bg-background px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/20"
                        />
                    </div>
                </div>

                {/* Location */}
                <div>
                    <label htmlFor="location_name" className="block text-sm font-medium mb-1">Venue Name *</label>
                    <input
                        id="location_name"
                        name="location_name"
                        required
                        className="w-full rounded-lg border bg-background px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/20"
                        placeholder="e.g. Central Park, The Roxy"
                    />
                </div>
                <div>
                    <label htmlFor="location_address" className="block text-sm font-medium mb-1">Address</label>
                    <input
                        id="location_address"
                        name="location_address"
                        className="w-full rounded-lg border bg-background px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/20"
                        placeholder="Full address (optional)"
                    />
                </div>

                {/* Pricing */}
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label htmlFor="ticket_price_standard" className="block text-sm font-medium mb-1">Standard Ticket Price</label>
                        <input
                            id="ticket_price_standard"
                            name="ticket_price_standard"
                            type="number"
                            step="0.01"
                            min="0"
                            className="w-full rounded-lg border bg-background px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/20"
                            placeholder="0.00 = Free"
                        />
                    </div>
                    <div>
                        <label htmlFor="ticket_price_flexible" className="block text-sm font-medium mb-1">Flexible Ticket Price</label>
                        <input
                            id="ticket_price_flexible"
                            name="ticket_price_flexible"
                            type="number"
                            step="0.01"
                            min="0"
                            className="w-full rounded-lg border bg-background px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/20"
                            placeholder="Leave empty for no flexible option"
                        />
                    </div>
                </div>

                {/* Capacity */}
                <div>
                    <label htmlFor="capacity" className="block text-sm font-medium mb-1">Capacity</label>
                    <input
                        id="capacity"
                        name="capacity"
                        type="number"
                        min="1"
                        className="w-full rounded-lg border bg-background px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/20"
                        placeholder="Leave empty for unlimited"
                    />
                </div>

                {/* Status */}
                <div>
                    <label htmlFor="status" className="block text-sm font-medium mb-1">Status</label>
                    <select
                        id="status"
                        name="status"
                        className="w-full rounded-lg border bg-background px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/20"
                    >
                        <option value="draft">Draft (save without publishing)</option>
                        <option value="published">Published (visible to everyone)</option>
                    </select>
                </div>

                {/* Submit */}
                <div className="flex gap-3 pt-4">
                    <Button type="submit" disabled={isSubmitting} className="flex-1">
                        {isSubmitting ? 'Creating...' : 'Create Event'}
                    </Button>
                    <Button
                        type="button"
                        variant="outline"
                        onClick={() => navigate(-1)}
                    >
                        Cancel
                    </Button>
                </div>
            </form>
        </div>
    );
}
