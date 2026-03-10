import React from 'react';

import { ScrapbookInput } from './ui/ScrapbookInput';
import { ScrapbookSelect } from './ui/ScrapbookSelect';

export interface BasicDetailsQuickFormProps {
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

export const BasicDetailsQuickForm: React.FC<BasicDetailsQuickFormProps> = ({
  categories,
  coverPreview,
  handleCoverChange,
  title,
  setTitle,
  category,
  setCategory,
  readonly = false,
}) => {
  return (
    <div className="space-y-5">
      <ScrapbookInput
        label="Event Title"
        name="title"
        example="Bake Sale Extravaganza"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        required
        disabled={readonly}
        readOnly={readonly}
        style={{ backgroundColor: 'transparent' }}
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
        style={{ backgroundColor: 'transparent' }}
      />

      <div>
        <div className="text-[10px] font-bold text-gray-500 mb-1 uppercase tracking-wider">
          Picture
        </div>
        <div
          className={`group relative h-44 w-full overflow-hidden border border-gray-300 bg-transparent shadow-[2px_2px_0px_#333] transition-all flex flex-col items-center justify-center
          ${readonly ? 'opacity-90' : 'hover:-translate-y-1 hover:shadow-[3px_4px_0px_#333] cursor-pointer'}`}
        >
          {coverPreview ? (
            <>
              <img
                src={coverPreview}
                alt="Cover Preview"
                className="h-full w-full object-cover transition-transform group-hover:scale-105"
              />
              {!readonly && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 transition-opacity group-hover:opacity-100">
                  <label
                    htmlFor="cover_image_quick"
                    className="cursor-pointer px-3 py-1.5 bg-yellow-300 text-gray-900 border border-gray-900 shadow-[2px_2px_0px_#333] font-bold text-sm"
                    style={{ fontFamily: '"Permanent Marker", cursive' }}
                  >
                    Change
                  </label>
                </div>
              )}
            </>
          ) : (
            <label
              htmlFor={readonly ? undefined : 'cover_image_quick'}
              className={`flex h-full w-full flex-col items-center justify-center gap-2 p-4 text-center ${readonly ? 'cursor-default' : 'cursor-pointer'}`}
            >
              <span className="text-2xl">📷</span>
              <span
                className="text-gray-500"
                style={{ fontFamily: '"Caveat", cursive', fontSize: '1.1rem' }}
              >
                {readonly ? 'No photo provided' : 'Add a photo'}
              </span>
            </label>
          )}
          {!readonly && (
            <input
              id="cover_image_quick"
              name="cover_image"
              type="file"
              accept="image/*"
              onChange={handleCoverChange}
              className="hidden"
            />
          )}
        </div>
      </div>
    </div>
  );
};
