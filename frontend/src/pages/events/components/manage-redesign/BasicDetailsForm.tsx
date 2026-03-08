import { FileEdit } from 'lucide-react';
import React from 'react';

import { EnclosingBox } from './ui/EnclosingBox';
import { ScrapbookHeading } from './ui/ScrapbookHeading';
import { ScrapbookInput } from './ui/ScrapbookInput';
import { ScrapbookSelect } from './ui/ScrapbookSelect';

interface BasicDetailsFormProps {
    event: any;
    categories: any[];
    coverPreview: string | null;
    handleCoverChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    title: string;
    setTitle: (val: string) => void;
    category: string;
    setCategory: (val: string) => void;
    description: string;
    setDescription: (val: string) => void;
    readonly?: boolean;
}

export const BasicDetailsForm: React.FC<BasicDetailsFormProps> = ({
    event,
    categories,
    coverPreview,
    handleCoverChange,
    title,
    setTitle,
    category,
    setCategory,
    description,
    setDescription,
    readonly = false,
}) => {
    return (
        <EnclosingBox background="bg-[#fcf8f2] border-2 border-dashed border-gray-300" rotation={-0.2}>
            <div className="mb-8">
                <ScrapbookHeading title="Basic Information" icon={<FileEdit className="h-6 w-6" />} />

                <div className="flex flex-col md:flex-row gap-8">
                    {/* Form Fields */}
                    <div className="flex-1 space-y-5">
                        <ScrapbookInput
                            label="Event Title"
                            name="title"
                            example="Bake Sale Extravaganza"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            required
                            disabled={readonly}
                            readOnly={readonly}
                        />

                        <ScrapbookSelect
                            label="Category"
                            name="category"
                            value={category}
                            onChange={(e) => setCategory(e.target.value)}
                            required
                            disabled={readonly}
                            options={categories.map((c) => ({
                                value: String(c.id),
                                label: c.name,
                                icon: c.icon,
                            }))}
                        />

                        <ScrapbookInput
                            label="Description"
                            name="description"
                            multiline
                            rows={4}
                            example="Join us for an afternoon of sweet treats..."
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            disabled={readonly}
                            readOnly={readonly}
                        />
                    </div>

                    {/* Cover Image Upload (Scrapbook style) */}
                    <div className="w-full md:w-64 flex-shrink-0">
                        <div className="text-[10px] font-bold text-gray-500 mb-1 uppercase tracking-wider">
                            Cover Image
                        </div>
                        <div
                            className={`group relative h-48 w-full overflow-hidden border-2 border-dashed border-gray-400 bg-white shadow-[3px_4px_0px_#333] transition-all flex flex-col items-center justify-center
                ${readonly ? 'opacity-90' : 'hover:-translate-y-1 hover:shadow-[4px_6px_0px_#333] cursor-pointer'}`}
                            style={{ transform: 'rotate(1deg)' }}
                        >
                            {coverPreview ? (
                                <>
                                    <img
                                        src={coverPreview}
                                        alt="Cover Preview"
                                        className="h-full w-full object-cover transition-transform group-hover:scale-105"
                                    />
                                    {!readonly && (
                                        <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition-opacity group-hover:opacity-100">
                                            <label
                                                htmlFor="cover_image"
                                                className="cursor-pointer px-4 py-2 bg-yellow-300 text-gray-900 border-2 border-gray-900 shadow-[2px_2px_0px_#333] font-bold"
                                                style={{ fontFamily: '"Permanent Marker", cursive' }}
                                            >
                                                Change Photo
                                            </label>
                                        </div>
                                    )}
                                </>
                            ) : (
                                <label
                                    htmlFor={readonly ? undefined : 'cover_image'}
                                    className={`flex h-full w-full flex-col items-center justify-center gap-2 p-4 text-center ${readonly ? 'cursor-default' : 'cursor-pointer'}`}
                                >
                                    <span className="text-3xl">📸</span>
                                    <span
                                        className="text-gray-500"
                                        style={{ fontFamily: '"Caveat", cursive', fontSize: '1.2rem' }}
                                    >
                                        {readonly ? 'No photo provided' : 'Tape a photo here!'}
                                    </span>
                                </label>
                            )}
                            {!readonly && (
                                <input
                                    id="cover_image"
                                    name="cover_image"
                                    type="file"
                                    accept="image/*"
                                    onChange={handleCoverChange}
                                    className="hidden"
                                />
                            )}
                            {/* Decorative tape strip */}
                            <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-16 h-6 bg-white/40 backdrop-blur-sm border border-gray-200 shadow-sm rotate-[-2deg]" />
                        </div>
                    </div>
                </div>
            </div>
        </EnclosingBox>
    );
};
