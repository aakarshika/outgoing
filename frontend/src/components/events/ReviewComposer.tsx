import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Star, Loader2 } from 'lucide-react';
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

const reviewSchema = z.object({
    rating: z.number().min(1, 'Please select a rating').max(5),
    text: z.string().min(10, 'Review must be at least 10 characters').max(1000, 'Maximum 1000 characters'),
});

type ReviewFormValues = z.infer<typeof reviewSchema>;

interface ReviewComposerProps {
    eventId: number;
    eventName: string;
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
    trigger?: React.ReactNode;
}

export function ReviewComposer({ eventId, eventName, isOpen, onOpenChange, trigger }: ReviewComposerProps) {
    const addReview = useAddEventReview();

    const form = useForm<ReviewFormValues>({
        resolver: zodResolver(reviewSchema),
        defaultValues: {
            rating: 0,
            text: '',
        },
    });

    const onSubmit = (data: ReviewFormValues) => {
        addReview.mutate(
            { eventId, payload: data },
            {
                onSuccess: () => {
                    toast.success('Thank you for your review!');
                    form.reset();
                    onOpenChange(false);
                },
                onError: (error: any) => {
                    toast.error(error?.response?.data?.message || 'Failed to submit review.');
                },
            }
        );
    };

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>Review {eventName}</DialogTitle>
                    <DialogDescription>
                        Share your experience to help others find great events.
                    </DialogDescription>
                </DialogHeader>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 mt-4">
                        <FormField
                            control={form.control}
                            name="rating"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Overall Rating</FormLabel>
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
                                    <FormLabel>Your Review</FormLabel>
                                    <FormControl>
                                        <Textarea
                                            placeholder="What did you love about this event? How was the host?..."
                                            className="min-h-[120px] resize-none"
                                            {...field}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <div className="flex justify-end gap-3 pt-4">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => {
                                    form.reset();
                                    onOpenChange(false);
                                }}
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
