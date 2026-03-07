import { zodResolver } from '@hookform/resolvers/zod';
import { ImagePlus, Loader2, Star, Store, X } from 'lucide-react';
import React, { useState } from 'react';
import { useFieldArray, useForm } from 'react-hook-form';
import { toast } from 'sonner';
import * as z from 'zod';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { ImageUpload } from '@/components/ui/ImageUpload';
import { Media } from '@/components/ui/media';
import { Textarea } from '@/components/ui/textarea';
import { UserAvatar } from '@/components/ui/UserAvatar';
import { useAddEventReview, useUpdateEventReview } from '@/features/events/hooks';
import { cn } from '@/lib/utils';

const vendorReviewSchema = z.object({
  vendor_id: z.number(),
  rating: z.number().min(0).max(5), // 0 means unrated
  text: z.string().optional(),
});

const reviewSchema = z.object({
  rating: z.number().min(1, 'Please select a rating').max(5),
  text: z
    .string()
    .min(10, 'Review must be at least 10 characters')
    .max(1000, 'Maximum 1000 characters'),
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
  initialData?: any;
}

export function ReviewComposer({
  eventId,
  eventName,
  participatingVendors = [],
  isOpen,
  onOpenChange,
  trigger,
  initialData,
}: ReviewComposerProps) {
  const addReview = useAddEventReview();
  const updateReview = useUpdateEventReview();
  const [mediaFiles, setMediaFiles] = useState<File[]>([]);
  const [mediaPreviews, setMediaPreviews] = useState<string[]>([]);
  const [showVendorReviews, setShowVendorReviews] = useState(
    !!initialData?.vendorReviews?.length
  );

  const form = useForm<ReviewFormValues>({
    resolver: zodResolver(reviewSchema),
    defaultValues: {
      rating: initialData?.rating || 0,
      text: initialData?.comment || '',
      vendor_reviews: participatingVendors.map((v) => {
        const existingVendorReview = initialData?.vendorReviews?.find(
          (vr: any) => vr.vendorName === v.vendor_name
        );
        return {
          vendor_id: v.id,
          rating: existingVendorReview?.rating || 0,
          text: existingVendorReview?.comment || '',
        };
      }),
    },
  });

  const { fields } = useFieldArray({
    control: form.control,
    name: 'vendor_reviews',
  });

  const removeFile = (index: number) => {
    setMediaFiles((prev) => prev.filter((_, i) => i !== index));
    setMediaPreviews((prev) => {
      URL.revokeObjectURL(prev[index]);
      return prev.filter((_, i) => i !== index);
    });
  };

  const onSubmit = async (data: ReviewFormValues) => {
    const formData = new FormData();
    formData.append('rating', data.rating.toString());
    formData.append('text', data.text);

    // Media files are already compressed by ImageUpload
    mediaFiles.forEach((file) => {
      formData.append('media', file);
    });

    // Add valid vendor reviews
    if (showVendorReviews && data.vendor_reviews) {
      const validVendorReviews = data.vendor_reviews.filter((vr) => vr.rating > 0);
      if (validVendorReviews.length > 0) {
        formData.append('vendor_reviews', JSON.stringify(validVendorReviews));
      }
    }

    if (initialData?.id) {
      updateReview.mutate(
        { reviewId: initialData.id, formData },
        {
          onSuccess: () => {
            toast.success('Review updated successfully!');
            handleClose();
          },
          onError: (error: any) => {
            toast.error(error?.response?.data?.message || 'Failed to update review.');
          },
        },
      );
    } else {
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
        },
      );
    }
  };

  const handleClose = () => {
    form.reset();
    setMediaFiles([]);
    mediaPreviews.forEach((p) => URL.revokeObjectURL(p));
    setMediaPreviews([]);
    setShowVendorReviews(false);
    onOpenChange(false);
  };

  // Reset form when initialData changes or dialog opens
  React.useEffect(() => {
    if (isOpen) {
      form.reset({
        rating: initialData?.rating || 0,
        text: initialData?.comment || '',
        vendor_reviews: participatingVendors.map((v) => {
          const existingVendorReview = initialData?.vendorReviews?.find(
            (vr: any) => vr.vendorName === v.vendor_name
          );
          return {
            vendor_id: v.id,
            rating: existingVendorReview?.rating || 0,
            text: existingVendorReview?.comment || '',
          };
        }),
      });
      setShowVendorReviews(!!initialData?.vendorReviews?.length);
      setMediaFiles([]);
      setMediaPreviews(initialData?.media?.map((m: any) => m.file) || []);
    }
  }, [isOpen, initialData, participatingVendors, form]);

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) handleClose();
        else onOpenChange(true);
      }}
    >
      {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{initialData ? 'Edit Review' : `Review ${eventName}`}</DialogTitle>
          <DialogDescription>
            Share your experience, add photos or videos, and optionally review

            individual vendors.
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
                          onClick={() =>
                            form.setValue('rating', star, { shouldValidate: true })
                          }
                          className={cn(
                            'p-1 focus:outline-none transition-transform hover:scale-110',
                            field.value >= star
                              ? 'text-yellow-400'
                              : 'text-muted hover:text-yellow-200',
                          )}
                        >
                          <Star
                            className="h-8 w-8"
                            fill={field.value >= star ? 'currentColor' : 'none'}
                          />
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
                  <div
                    key={i}
                    className="relative w-24 h-24 rounded-lg overflow-hidden border"
                  >
                    {mediaFiles[i].type.startsWith('video/') ? (
                      <Media
                        type="video"
                        src={preview}
                        className="w-full h-full object-cover"
                        autoPlay
                        muted
                        loop
                        playsInline
                      />
                    ) : (
                      <Media
                        src={preview}
                        alt="preview"
                        className="w-full h-full object-cover"
                      />
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
                  <ImageUpload
                    multiple
                    onImagesSelected={(newFiles) => {
                      const remainingSlots = 5 - mediaFiles.length;
                      const filesToAdd = newFiles.slice(0, remainingSlots);

                      setMediaFiles((prev) => [...prev, ...filesToAdd]);
                      const newPreviews = filesToAdd.map((f) => URL.createObjectURL(f));
                      setMediaPreviews((prev) => [...prev, ...newPreviews]);

                      if (newFiles.length > remainingSlots) {
                        toast.error(
                          `Only ${remainingSlots} more files could be added.`,
                        );
                      }
                    }}
                    compressionOptions={{ maxWidth: 1200, quality: 0.8 }}
                  >
                    {({ openSelector, isCompressing }) => (
                      <button
                        type="button"
                        onClick={openSelector}
                        disabled={isCompressing}
                        className="w-24 h-24 rounded-lg border-2 border-dashed border-primary/30 flex flex-col items-center justify-center text-primary/70 hover:bg-primary/5 hover:border-primary/50 cursor-pointer transition-colors"
                      >
                        {isCompressing ? (
                          <Loader2 className="w-6 h-6 animate-spin" />
                        ) : (
                          <>
                            <ImagePlus className="w-6 h-6 mb-1" />
                            <span className="text-[10px] font-medium text-center px-1">
                              Upload Media
                            </span>
                          </>
                        )}
                      </button>
                    )}
                  </ImageUpload>
                )}
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Max 5 files (images or MP4/MOV videos).
              </p>
            </div>

            {/* Vendor Reviews */}
            {participatingVendors.length > 0 && (
              <div className="border rounded-xl p-4 bg-muted/20">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Store className="w-5 h-5 text-primary" />
                    <div>
                      <h4 className="font-semibold text-sm">Review Event Vendors</h4>
                      <p className="text-xs text-muted-foreground">
                        Optional: Rate the individual vendors that made this event
                        happen.
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={showVendorReviews}
                    onClick={() => setShowVendorReviews(!showVendorReviews)}
                    className={cn(
                      'inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50',
                      showVendorReviews ? 'bg-primary' : 'bg-input',
                    )}
                  >
                    <span
                      className={cn(
                        'pointer-events-none block h-4 w-4 rounded-full bg-background shadow-lg ring-0 transition-transform',
                        showVendorReviews ? 'translate-x-4' : 'translate-x-0',
                      )}
                    />
                  </button>
                </div>

                {showVendorReviews && (
                  <div className="mt-6 space-y-6">
                    {fields.map((field, index) => {
                      const vendor = participatingVendors.find(
                        (v) => v.id === field.vendor_id,
                      );
                      if (!vendor) return null;

                      return (
                        <div
                          key={field.id}
                          className="pt-4 border-t first:border-0 first:pt-0"
                        >
                          <div className="flex items-center gap-3 mb-3">
                            <UserAvatar
                              src={vendor.vendor_avatar}
                              username={vendor.vendor_name}
                              size="sm"
                            />
                            <div>
                              <p className="font-medium text-sm leading-none">
                                {vendor.title}
                              </p>
                              <p className="text-xs text-muted-foreground leading-none mt-1">
                                by {vendor.vendor_name}
                              </p>
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
                                        onClick={() =>
                                          form.setValue(
                                            `vendor_reviews.${index}.rating`,
                                            star,
                                          )
                                        }
                                        className={cn(
                                          'p-1 focus:outline-none transition-transform hover:scale-110',
                                          (ratingField.value ?? 0) >= star
                                            ? 'text-yellow-400'
                                            : 'text-muted hover:text-yellow-200',
                                        )}
                                      >
                                        <Star
                                          className="h-5 w-5"
                                          fill={
                                            (ratingField.value ?? 0) >= star
                                              ? 'currentColor'
                                              : 'none'
                                          }
                                        />
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
                disabled={addReview.isPending || updateReview.isPending}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={addReview.isPending || updateReview.isPending}>
                {addReview.isPending || updateReview.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {initialData ? 'Updating...' : 'Submitting...'}
                  </>
                ) : (
                  initialData ? 'Update Review' : 'Submit Review'
                )}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
