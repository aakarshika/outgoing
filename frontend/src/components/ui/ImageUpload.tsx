import React, { useRef, useState, useEffect } from 'react';
import { Camera, X, Upload, Loader2 } from 'lucide-react';
import { compressImage } from '@/utils/image';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface ImageUploadProps {
    onImageSelected?: (file: File | null) => void;
    onImagesSelected?: (files: File[]) => void;
    multiple?: boolean;
    currentImage?: string | null;
    previewClassName?: string;
    containerClassName?: string;
    aspectRatio?: 'square' | 'video' | 'wide';
    maxSizeMB?: number;
    label?: string;
    description?: string;
    compressionOptions?: {
        maxWidth?: number;
        maxHeight?: number;
        quality?: number;
        newFileName?: string;
    };
    children?: (props: {
        previewUrl: string | null;
        isCompressing: boolean;
        openSelector: () => void;
        removeImage: () => void;
    }) => React.ReactNode;
}

const aspectClasses = {
    square: 'aspect-square',
    video: 'aspect-video',
    wide: 'aspect-[21/9]',
};

export const ImageUpload: React.FC<ImageUploadProps> = ({
    onImageSelected,
    onImagesSelected,
    multiple = false,
    currentImage,
    previewClassName,
    containerClassName,
    aspectRatio = 'square',
    maxSizeMB = 10,
    label,
    description,
    compressionOptions,
    children,
}) => {
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [isCompressing, setIsCompressing] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Clean up preview URL on unmount
    useEffect(() => {
        return () => {
            if (previewUrl && previewUrl.startsWith('blob:')) {
                URL.revokeObjectURL(previewUrl);
            }
        };
    }, [previewUrl]);

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files || files.length === 0) return;

        setIsCompressing(true);
        try {
            if (multiple) {
                const fileList = Array.from(files);
                const validFiles = fileList.filter(f => f.size <= maxSizeMB * 1024 * 1024);

                if (validFiles.length < fileList.length) {
                    toast.error(`Some files were too large. Max size is ${maxSizeMB}MB.`);
                }

                const compressedFiles = await Promise.all(
                    validFiles.map(async (f) => {
                        if (f.type.startsWith('image/')) {
                            return await compressImage(f, compressionOptions);
                        }
                        return f;
                    })
                );

                onImagesSelected?.(compressedFiles);
            } else {
                const file = files[0];
                if (file.size > maxSizeMB * 1024 * 1024) {
                    toast.error(`File is too large. Max size is ${maxSizeMB}MB.`);
                    return;
                }

                if (!file.type.startsWith('image/') && !file.type.startsWith('video/')) {
                    toast.error('Unsupported file type.');
                    return;
                }

                let processed = file;
                if (file.type.startsWith('image/')) {
                    processed = await compressImage(file, compressionOptions);
                }

                const url = URL.createObjectURL(processed);

                if (previewUrl && previewUrl.startsWith('blob:')) {
                    URL.revokeObjectURL(previewUrl);
                }

                setPreviewUrl(url);
                onImageSelected?.(processed);
            }
        } catch (error) {
            console.error('Image processing failed:', error);
            toast.error('Failed to process one or more images.');
        } finally {
            setIsCompressing(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    const openSelector = () => fileInputRef.current?.click();

    const removeImage = () => {
        if (previewUrl && previewUrl.startsWith('blob:')) {
            URL.revokeObjectURL(previewUrl);
        }
        setPreviewUrl(null);
        if (onImageSelected) onImageSelected(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const currentPreview = previewUrl || currentImage || null;

    if (children) {
        return (
            <>
                <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    accept="image/*"
                    className="hidden"
                />
                {children({ previewUrl: currentPreview, isCompressing, openSelector, removeImage })}
            </>
        );
    }

    return (
        <div className={cn('w-full', containerClassName)}>
            <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept="image/*"
                className="hidden"
            />

            {currentPreview ? (
                <div className={cn('relative overflow-hidden rounded-xl border bg-muted', aspectClasses[aspectRatio], previewClassName)}>
                    <img
                        src={currentPreview}
                        alt="Preview"
                        className="h-full w-full object-cover"
                    />
                    <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition-opacity hover:opacity-100">
                        <button
                            onClick={openSelector}
                            disabled={isCompressing}
                            className="rounded-full bg-white/20 p-2 text-white transition-colors hover:bg-white/40"
                        >
                            <Camera className="h-6 w-6" />
                        </button>
                    </div>
                    <button
                        onClick={removeImage}
                        className="absolute right-2 top-2 rounded-full bg-destructive p-1.5 text-destructive-foreground shadow-sm hover:scale-110 transition-transform"
                    >
                        <X className="h-4 w-4" />
                    </button>
                    {isCompressing && (
                        <div className="absolute inset-0 flex items-center justify-center bg-background/50">
                            <Loader2 className="h-8 w-8 animate-spin text-primary" />
                        </div>
                    )}
                </div>
            ) : (
                <button
                    onClick={openSelector}
                    disabled={isCompressing}
                    className={cn(
                        'flex w-full cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed bg-muted/50 transition-colors hover:bg-muted',
                        aspectClasses[aspectRatio],
                        previewClassName
                    )}
                >
                    {isCompressing ? (
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    ) : (
                        <>
                            <div className="rounded-full bg-background p-3 shadow-sm">
                                <Upload className="h-5 w-5 text-muted-foreground" />
                            </div>
                            <div className="text-center px-4">
                                <p className="text-sm font-medium">{label || 'Click to upload image'}</p>
                                <p className="text-xs text-muted-foreground mt-1">{description || `PNG, JPG up to ${maxSizeMB}MB`}</p>
                            </div>
                        </>
                    )}
                </button>
            )}
        </div>
    );
};
