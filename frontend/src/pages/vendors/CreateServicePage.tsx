import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { ArrowLeft, Save, Briefcase, DollarSign, Image as ImageIcon, MapPin } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { useCreateVendorService } from '@/features/vendors/hooks';

interface CreateServiceFormData {
    title: string;
    description: string;
    category: string;
    base_price: string;
    travel_radius_miles: string;
    portfolio_url: string;
    portfolio_image: string | FileList;
}

import { VENDOR_CATEGORIES } from '@/constants/categories';

export default function CreateServicePage() {
    const navigate = useNavigate();
    const createMutation = useCreateVendorService();

    const { register, handleSubmit, formState: { errors } } = useForm<CreateServiceFormData>();
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [selectedImage, setSelectedImage] = useState<File | null>(null);

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setSelectedImage(file);
            const reader = new FileReader();
            reader.onloadend = () => setImagePreview(reader.result as string);
            reader.readAsDataURL(file);
        }
    };

    const onSubmit = (data: CreateServiceFormData) => {
        const formData = new FormData();
        formData.append('title', data.title);
        formData.append('description', data.description);
        formData.append('category', data.category);

        if (data.base_price) formData.append('base_price', data.base_price);
        if (data.travel_radius_miles) formData.append('travel_radius_miles', data.travel_radius_miles);
        if (data.portfolio_url) formData.append('portfolio_url', data.portfolio_url);
        if (selectedImage) formData.append('portfolio_image', selectedImage);

        createMutation.mutate(formData, {
            onSuccess: () => {
                toast.success('Vendor service created successfully!');
                navigate('/dashboard');
            },
            onError: (error: any) => {
                const message = error?.response?.data?.message || 'Failed to create service';
                toast.error(message);
            }
        });
    };

    return (
        <div className="mx-auto max-w-3xl px-4 sm:px-6 py-8">
            {/* Header */}
            <div className="flex items-center gap-4 mb-8">
                <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="rounded-full shrink-0">
                    <ArrowLeft className="h-5 w-5" />
                </Button>
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Create Vendor Service</h1>
                    <p className="text-muted-foreground mt-1">
                        List your service to start accepting event applications.
                    </p>
                </div>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-8 pb-20">
                <div className="bg-card rounded-xl border p-6 space-y-6 shadow-sm">
                    {/* Basic Info */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-2 border-b pb-2 mb-4">
                            <Briefcase className="h-5 w-5 text-primary" />
                            <h2 className="text-lg font-semibold">Service Information</h2>
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-1.5">Service Title *</label>
                            <input
                                {...register('title', { required: 'Title is required' })}
                                type="text"
                                placeholder="e.g. Professional Wedding Photography"
                                className="w-full rounded-lg border bg-background px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/50 transition-all font-medium"
                            />
                            {errors.title && <p className="text-xs text-red-500 mt-1">{errors.title.message}</p>}
                        </div>

                        <div className="grid gap-4 sm:grid-cols-2">
                            <div>
                                <label className="block text-sm font-medium mb-1.5">Category *</label>
                                <select
                                    {...register('category', { required: 'Category is required' })}
                                    className="w-full rounded-lg border bg-background px-4 py-2.5 text-sm"
                                >
                                    <option value="">Select a category</option>
                                    {VENDOR_CATEGORIES.map(group => (
                                        <optgroup key={group.group} label={group.group}>
                                            {group.items.map(item => (
                                                <option key={item.id} value={item.id}>{item.label}</option>
                                            ))}
                                        </optgroup>
                                    ))}
                                </select>
                                {errors.category && <p className="text-xs text-red-500 mt-1">{errors.category.message}</p>}
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-1.5">Starting Price ($)</label>
                                <div className="relative">
                                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                    <input
                                        {...register('base_price')}
                                        type="number"
                                        step="0.01"
                                        placeholder="e.g. 150.00"
                                        className="w-full rounded-lg border bg-background pl-9 pr-4 py-2.5 text-sm"
                                    />
                                </div>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-1.5">Description *</label>
                            <textarea
                                {...register('description', { required: 'Description is required' })}
                                rows={5}
                                placeholder="Describe what you offer, your experience, and what makes your service special..."
                                className="w-full rounded-lg border bg-background px-4 py-2.5 text-sm resize-none"
                            />
                            {errors.description && <p className="text-xs text-red-500 mt-1">{errors.description.message}</p>}
                        </div>
                    </div>

                    {/* Service Settings */}
                    <div className="space-y-4 pt-4">
                        <div className="flex items-center gap-2 border-b pb-2 mb-4">
                            <MapPin className="h-5 w-5 text-primary" />
                            <h2 className="text-lg font-semibold">Service Details</h2>
                        </div>

                        <div className="grid gap-4 sm:grid-cols-2">
                            <div>
                                <label className="block text-sm font-medium mb-1.5">Travel Radius (miles)</label>
                                <input
                                    {...register('travel_radius_miles')}
                                    type="number"
                                    placeholder="e.g. 50"
                                    className="w-full rounded-lg border bg-background px-4 py-2.5 text-sm"
                                />
                                <p className="text-xs text-muted-foreground mt-1">Leave blank if nationwide or remote.</p>
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-1.5">Portfolio/External URL</label>
                                <input
                                    {...register('portfolio_url')}
                                    type="url"
                                    placeholder="https://yourwebsite.com"
                                    className="w-full rounded-lg border bg-background px-4 py-2.5 text-sm"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Media */}
                    <div className="space-y-4 pt-4">
                        <div className="flex items-center gap-2 border-b pb-2 mb-4">
                            <ImageIcon className="h-5 w-5 text-primary" />
                            <h2 className="text-lg font-semibold">Cover Image</h2>
                        </div>

                        <div className="flex flex-col sm:flex-row gap-6 items-start">
                            {imagePreview ? (
                                <div className="relative group">
                                    <img src={imagePreview} alt="Preview" className="h-32 w-48 object-cover rounded-xl border border-primary/20 shadow-sm" />
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setImagePreview(null);
                                            setSelectedImage(null);
                                        }}
                                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                                    </button>
                                </div>
                            ) : (
                                <div className="h-32 w-48 rounded-xl border-2 border-dashed flex flex-col items-center justify-center text-muted-foreground bg-muted/20">
                                    <ImageIcon className="h-8 w-8 mb-2 opacity-50" />
                                    <span className="text-xs font-medium">No image selected</span>
                                </div>
                            )}

                            <div className="flex-1 space-y-2">
                                <label className="block text-sm font-medium">Upload Image</label>
                                <p className="text-xs text-muted-foreground mb-3">Add a cover image or portfolio sample to help your service stand out. Max 5MB.</p>
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={handleImageChange}
                                    className="w-full text-sm file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20 cursor-pointer"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Submit Actions */}
                <div className="flex justify-end gap-3 pt-4 border-t sticky bottom-6 bg-background/80 backdrop-blur pb-4">
                    <Button type="button" variant="outline" onClick={() => navigate(-1)}>
                        Cancel
                    </Button>
                    <Button type="submit" disabled={createMutation.isPending} className="min-w-[140px]">
                        {createMutation.isPending ? 'Creating...' : (
                            <>
                                <Save className="mr-2 h-4 w-4" /> Publish Service
                            </>
                        )}
                    </Button>
                </div>
            </form>
        </div>
    );
}
