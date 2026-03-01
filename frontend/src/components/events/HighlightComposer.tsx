import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { X, Loader2, Upload } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import {
    Form,
    FormControl,
    FormField,
    FormItem,
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
import { useAddEventHighlight } from '@/features/events/hooks';
import { cn } from '@/lib/utils';

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ACCEPTED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

const highlightSchema = z.object({
    text: z.string().min(1, 'Highlight text is required').max(500, 'Maximum 500 characters'),
    media: z
        .any()
        .refine((file) => file instanceof File, 'Media file is required')
        .refine((file) => file?.size <= MAX_FILE_SIZE, 'Max file size is 10MB.')
        .refine(
            (file) => ACCEPTED_IMAGE_TYPES.includes(file?.type),
            'Only .jpg, .jpeg, .png and .webp formats are supported.'
        )
        .optional()
        .or(z.literal('')),
});

type HighlightFormValues = z.infer<typeof highlightSchema>;

interface HighlightComposerProps {
    eventId: number;
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
    trigger?: React.ReactNode;
}

export function HighlightComposer({ eventId, isOpen, onOpenChange, trigger }: HighlightComposerProps) {
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const addHighlight = useAddEventHighlight();

    const form = useForm<HighlightFormValues>({
        resolver: zodResolver(highlightSchema),
        defaultValues: {
            text: '',
            media: '',
        },
    });

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            form.setValue('media', file);
            form.clearErrors('media');
            // Create preview URL
            const url = URL.createObjectURL(file);
            setPreviewUrl(url);
        }
    };

    const clearMedia = () => {
        form.setValue('media', '');
        if (previewUrl) {
            URL.revokeObjectURL(previewUrl);
        }
        setPreviewUrl(null);
    };

    const onSubmit = (data: HighlightFormValues) => {
        const formData = new FormData();
        formData.append('text', data.text);
        if (data.media instanceof File) {
            formData.append('media_file', data.media);
        }

        addHighlight.mutate(
            { eventId, formData },
            {
                onSuccess: () => {
                    toast.success('Highlight added successfully!');
                    form.reset();
                    clearMedia();
                    onOpenChange(false);
                },
                onError: (error: any) => {
                    toast.error(error?.response?.data?.message || 'Failed to add highlight.');
                },
            }
        );
    };

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>Share a Highlight</DialogTitle>
                    <DialogDescription>
                        Capture the best moments from this event to share with others.
                    </DialogDescription>
                </DialogHeader>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                        <FormField
                            control={form.control}
                            name="media"
                            render={() => (
                                <FormItem>
                                    <FormControl>
                                        <div className="relative">
                                            {previewUrl ? (
                                                <div className="relative aspect-video w-full overflow-hidden rounded-xl border bg-muted">
                                                    <img
                                                        src={previewUrl}
                                                        alt="Preview"
                                                        className="h-full w-full object-cover"
                                                    />
                                                    <Button
                                                        type="button"
                                                        variant="destructive"
                                                        size="icon"
                                                        className="absolute right-2 top-2 h-8 w-8 rounded-full opacity-80 hover:opacity-100"
                                                        onClick={clearMedia}
                                                    >
                                                        <X className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            ) : (
                                                <label
                                                    htmlFor="media-upload"
                                                    className={cn(
                                                        "flex aspect-video w-full cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed bg-muted/50 hover:bg-muted transition-colors",
                                                        form.formState.errors.media && "border-destructive text-destructive"
                                                    )}
                                                >
                                                    <div className="rounded-full bg-background p-3 shadow-sm">
                                                        <Upload className="h-5 w-5 text-muted-foreground" />
                                                    </div>
                                                    <div className="text-center">
                                                        <p className="text-sm font-medium">Click to upload photo or video</p>
                                                        <p className="text-xs text-muted-foreground mt-1">PNG, JPG up to 10MB</p>
                                                    </div>
                                                </label>
                                            )}
                                            <input
                                                id="media-upload"
                                                type="file"
                                                accept="image/*,video/*"
                                                className="hidden"
                                                onChange={handleFileChange}
                                            />
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
                                    <FormControl>
                                        <Textarea
                                            placeholder="What made this moment special?..."
                                            className="min-h-[100px] resize-none"
                                            {...field}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <div className="flex justify-end gap-3">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => {
                                    form.reset();
                                    clearMedia();
                                    onOpenChange(false);
                                }}
                                disabled={addHighlight.isPending}
                            >
                                Cancel
                            </Button>
                            <Button type="submit" disabled={addHighlight.isPending}>
                                {addHighlight.isPending ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Posting...
                                    </>
                                ) : (
                                    'Post Highlight'
                                )}
                            </Button>
                        </div>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}
