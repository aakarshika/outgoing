import React, { useState } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Star, Loader2, ImagePlus, X, Store } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from '@/components/ui/form';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { useAddEventReview } from '@/features/events/hooks';
import { cn } from '@/lib/utils';

const vendorReviewSchema = z.object({
    vendor_id: z.number(),
    rating: z.number().min(0).max(5), // 0 means unrated
    text: z.string().optional(),
});

const reviewSchema = z.object({
    rating: z.number().min(1, 'Please select a rating').max(5),
    text: z.string().min(10, 'Review must be at least 10 characters').max(1000, 'Maximum 1000 characters'),
    vendor_reviews: z.array(vendorReviewSchema).optional(),
});

type ReviewFormValues = z.infer<typeof reviewSchema>;

interface ReviewComposerProps {
    eventId: number;
    eventName: string;
    participatingVendors?: any[];
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
    trigger?: React.ReactNode;
}

export function ReviewComposer({ eventId, eventName, participatingVendors = [], isOpen, onOpenChange, trigger }: ReviewComposerProps) {
    const addReview = useAddEventReview();
    const [mediaFiles, setMediaFiles] = useState<File[]>([]);
    const [mediaPreviews, setMediaPreviews] = useState<string[]>([]);
    const [showVendorReviews, setShowVendorReviews] = useState(false);

    const form = useForm<ReviewFormValues>({
        resolver: zodResolver(reviewSchema),
        defaultValues: {
            rating: 0,
            text: '',
            vendor_reviews: participatingVendors.map(v => ({ vendor_id: v.id, rating: 0, text: '' })),
        },
    });

    const { fields } = useFieldArray({
        control: form.control,
        name: "vendor_reviews",
    });

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files?.length) return;
        const newFiles = Array.from(e.target.files);

        // Max 5 files
        if (mediaFiles.length + newFiles.length > 5) {
            toast.error('You can upload a maximum of 5 media files.');
            return;
        }

        setMediaFiles((prev) => [...prev, ...newFiles]);

        const newPreviews = newFiles.map((f) => URL.createObjectURL(f));
        setMediaPreviews((prev) => [...prev, ...newPreviews]);
    };

    const removeFile = (index: number) => {
        setMediaFiles((prev) => prev.filter((_, i) => i !== index));
        setMediaPreviews((prev) => {
            URL.revokeObjectURL(prev[index]);
            return prev.filter((_, i) => i !== index);
        });
    };

    const onSubmit = (data: ReviewFormValues) => {
        const formData = new FormData();
        formData.append('rating', data.rating.toString());
        formData.append('text', data.text);

        // Append media files
        mediaFiles.forEach((file) => {
            formData.append('media', file);
        });

        // Add valid vendor reviews
        if (showVendorReviews && data.vendor_reviews) {
            const validVendorReviews = data.vendor_reviews.filter(vr => vr.rating > 0);
            if (validVendorReviews.length > 0) {
                formData.append('vendor_reviews', JSON.stringify(validVendorReviews));
            }
        }

        addReview.mutate(
            { eventId, formData },
            {
                onSuccess: () => {
                    toast.success('Thank you for your review!');
                    handleClose();
                },
                onError: (error: any) => {
                    toast.error(error?.response?.data?.message || 'Failed to submit review.');
                },
            }
        );
    };

    const handleClose = () => {
        form.reset();
        setMediaFiles([]);
        mediaPreviews.forEach(p => URL.revokeObjectURL(p));
        setMediaPreviews([]);
        setShowVendorReviews(false);
        onOpenChange(false);
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => {
            if (!open) handleClose();
            else onOpenChange(true);
        }}>
            {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
            <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Review {eventName}</DialogTitle>
                    <DialogDescription>
                        Share your experience, add photos or videos, and optionally review individual vendors.
                    </DialogDescription>
                </DialogHeader>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 mt-4">
                        <FormField
                            control={form.control}
                            name="rating"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Event Overall Rating *</FormLabel>
                                    <FormControl>
                                        <div className="flex items-center gap-1 my-2">
                                            {[1, 2, 3, 4, 5].map((star) => (
                                                <button
                                                    key={star}
                                                    type="button"
                                                    onClick={() => form.setValue('rating', star, { shouldValidate: true })}
                                                    className={cn(
                                                        "p-1 focus:outline-none transition-transform hover:scale-110",
                                                        field.value >= star ? "text-yellow-400" : "text-muted hover:text-yellow-200"
                                                    )}
                                                >
                                                    <Star className="h-8 w-8" fill={field.value >= star ? "currentColor" : "none"} />
                                                </button>
                                            ))}
                                        </div>
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="text"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Your Review *</FormLabel>
                                    <FormControl>
                                        <Textarea
                                            placeholder="What did you love about this event? How was the host?..."
                                            className="min-h-[100px] resize-none"
                                            {...field}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        {/* Media Upload */}
                        <div>
                            <FormLabel className="block mb-2">Add Photos/Videos</FormLabel>
                            <div className="flex flex-wrap gap-4">
                                {mediaPreviews.map((preview, i) => (
                                    <div key={i} className="relative w-24 h-24 rounded-lg overflow-hidden border">
                                        {mediaFiles[i].type.startsWith('video/') ? (
                                            <video src={preview} className="w-full h-full object-cover" />
                                        ) : (
                                            <img src={preview} alt="preview" className="w-full h-full object-cover" />
                                        )}
                                        <button
                                            type="button"
                                            onClick={() => removeFile(i)}
                                            className="absolute top-1 right-1 bg-black/50 text-white rounded-full p-1 hover:bg-black/80"
                                        >
                                            <X className="w-3 h-3" />
                                        </button>
                                    </div>
                                ))}
                                {mediaFiles.length < 5 && (
                                    <label className="w-24 h-24 rounded-lg border-2 border-dashed border-primary/30 flex flex-col items-center justify-center text-primary/70 hover:bg-primary/5 hover:border-primary/50 cursor-pointer transition-colors">
                                        <ImagePlus className="w-6 h-6 mb-1" />
                                        <span className="text-[10px] font-medium text-center px-1">Upload Media</span>
                                        <input
                                            type="file"
                                            multiple
                                            accept="image/*,video/mp4,video/quicktime"
                                            className="hidden"
                                            onChange={handleFileChange}
                                        />
                                    </label>
                                )}
                            </div>
                            <p className="text-xs text-muted-foreground mt-2">Max 5 files (images or MP4/MOV videos).</p>
                        </div>

                        {/* Vendor Reviews */}
                        {participatingVendors.length > 0 && (
                            <div className="border rounded-xl p-4 bg-muted/20">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <Store className="w-5 h-5 text-primary" />
                                        <div>
                                            <h4 className="font-semibold text-sm">Review Event Vendors</h4>
                                            <p className="text-xs text-muted-foreground">Optional: Rate the individual vendors that made this event happen.</p>
                                        </div>
                                    </div>
                                    <button
                                        type="button"
                                        role="switch"
                                        aria-checked={showVendorReviews}
                                        onClick={() => setShowVendorReviews(!showVendorReviews)}
                                        className={cn(
                                            "inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50",
                                            showVendorReviews ? "bg-primary" : "bg-input"
                                        )}
                                    >
                                        <span
                                            className={cn(
                                                "pointer-events-none block h-4 w-4 rounded-full bg-background shadow-lg ring-0 transition-transform",
                                                showVendorReviews ? "translate-x-4" : "translate-x-0"
                                            )}
                                        />
                                    </button>
                                </div>

                                {showVendorReviews && (
                                    <div className="mt-6 space-y-6">
                                        {fields.map((field, index) => {
                                            const vendor = participatingVendors.find(v => v.id === field.vendor_id);
                                            if (!vendor) return null;

                                            return (
                                                <div key={field.id} className="pt-4 border-t first:border-0 first:pt-0">
                                                    <div className="flex items-center gap-3 mb-3">
                                                        {vendor.vendor_avatar ? (
                                                            <img src={vendor.vendor_avatar} alt="" className="w-8 h-8 rounded object-cover" />
                                                        ) : (
                                                            <div className="w-8 h-8 rounded bg-primary/10 flex items-center justify-center font-bold text-xs text-primary">
                                                                {vendor.vendor_name[0].toUpperCase()}
                                                            </div>
                                                        )}
                                                        <div>
                                                            <p className="font-medium text-sm leading-none">{vendor.title}</p>
                                                            <p className="text-xs text-muted-foreground leading-none mt-1">by {vendor.vendor_name}</p>
                                                        </div>
                                                    </div>

                                                    <FormField
                                                        control={form.control}
                                                        name={`vendor_reviews.${index}.rating`}
                                                        render={({ field: ratingField }) => (
                                                            <FormItem className="mb-2">
                                                                <FormControl>
                                                                    <div className="flex items-center gap-1">
                                                                        {[1, 2, 3, 4, 5].map((star) => (
                                                                            <button
                                                                                key={star}
                                                                                type="button"
                                                                                onClick={() => form.setValue(`vendor_reviews.${index}.rating`, star)}
                                                                                className={cn(
                                                                                    "p-1 focus:outline-none transition-transform hover:scale-110",
                                                                                    (ratingField.value ?? 0) >= star ? "text-yellow-400" : "text-muted hover:text-yellow-200"
                                                                                )}
                                                                            >
                                                                                <Star className="h-5 w-5" fill={(ratingField.value ?? 0) >= star ? "currentColor" : "none"} />
                                                                            </button>
                                                                        ))}
                                                                    </div>
                                                                </FormControl>
                                                            </FormItem>
                                                        )}
                                                    />

                                                    {(form.watch(`vendor_reviews.${index}.rating`) ?? 0) > 0 && (
                                                        <FormField
                                                            control={form.control}
                                                            name={`vendor_reviews.${index}.text`}
                                                            render={({ field: textField }) => (
                                                                <FormItem>
                                                                    <FormControl>
                                                                        <Textarea
                                                                            placeholder={`Optional: Say something about ${vendor.vendor_name}'s service...`}
                                                                            className="min-h-[60px] text-sm resize-none"
                                                                            {...textField}
                                                                        />
                                                                    </FormControl>
                                                                </FormItem>
                                                            )}
                                                        />
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        )}

                        <div className="flex justify-end gap-3 pt-4 border-t">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={handleClose}
                                disabled={addReview.isPending}
                            >
                                Cancel
                            </Button>
                            <Button type="submit" disabled={addReview.isPending}>
                                {addReview.isPending ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Submitting...
                                    </>
                                ) : (
                                    'Submit Review'
                                )}
                            </Button>
                        </div>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}
