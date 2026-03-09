import React, { useState } from 'react';

import {
    EventFeature,
    FEATURE_ITEMS,
    FeatureTag,
    TAG_COLORS,
} from '@/pages/events/manage/ManageDetailsSection';

import { ScrapbookHeading } from './ui/ScrapbookHeading';
import { EnclosingBox } from './ui/EnclosingBox';

interface EventFeaturesTagsProps {
    eventFeatures: EventFeature[];
    setEventFeatures: (features: EventFeature[]) => void;
    readonly?: boolean;
}

export const EventFeaturesTags: React.FC<EventFeaturesTagsProps> = ({
    eventFeatures,
    setEventFeatures,
    readonly = false,
}) => {
    const tags = Object.keys(TAG_COLORS) as FeatureTag[];

    const [isActiveMode, setIsActiveMode] = useState(tags[0]);
    return (
        <EnclosingBox background="bg-[#fcf8f2] border-2 border-dashed border-gray-300" rotation={-0.2}>

            <ScrapbookHeading title="Event Features" icon={<span className="text-2xl">🏷️</span>} rotation={-0.5} />

            {/* Tag type selector (always visible, greyed until selected) */}
            <div className="flex items-center gap-4 mb-4 ml-1">
                <span
                    className="text-[10px] uppercase tracking-wider text-gray-400 font-bold"
                    style={{ fontFamily: '"Permanent Marker", cursive' }}
                >
                    Tag mode:
                </span>
                <div className="flex gap-2">
                    {tags.map((tag) => {
                        const cfg = TAG_COLORS[tag];
                        const isActive = isActiveMode === tag;
                        return (
                            <span
                                onClick={() => setIsActiveMode(tag)}
                                key={tag}
                                className="px-2 py-0.5 text-[10px] font-bold border transition-all"
                                style={{
                                    backgroundColor: isActive ? cfg.bg : '#f3f4f6',
                                    borderColor: isActive ? cfg.border : '#d1d5db',
                                    color: isActive ? cfg.text : '#9ca3af',
                                    fontFamily: '"Permanent Marker", cursive',
                                    boxShadow: isActive ? '1px 1px 0px rgba(0,0,0,0.2)' : 'none',
                                }}
                            >
                                {cfg.emoji} {cfg.label}
                            </span>
                        );
                    })}
                </div>
            </div>

            <div
                className="bg-[#fdfbf7] border-2 border-dashed border-gray-300 p-5"
                style={{ transform: 'rotate(0.2deg)' }}
            >
                {/* Feature chips */}
                <div className="flex flex-wrap gap-2.5 gap-y-3">
                    {FEATURE_ITEMS.map((item) => {
                        const selected = eventFeatures.find((f) => f.name === item.name);
                        const cfg = selected ? TAG_COLORS[selected.tag] : null;

                        return (
                            <div key={item.name} className="flex items-center gap-0.5">
                                {/* Main feature button */}
                                <button
                                    type="button"
                                    disabled={readonly}
                                    onClick={() => {
                                        if (readonly) return;
                                        if (selected) {
                                            setEventFeatures(eventFeatures.filter((f) => f.name !== item.name));
                                        } else {
                                            setEventFeatures([...eventFeatures, { name: item.name, tag: isActiveMode }]);
                                        }
                                    }}
                                    className={`flex items-center gap-1.5 px-3 py-1.5 border-2 text-sm font-medium transition-all
                    ${selected
                                            ? 'shadow-[2px_2px_0px_rgba(0,0,0,0.25)]'
                                            : 'border-gray-200 bg-white text-gray-400 hover:text-gray-700 hover:border-gray-400 hover:-translate-y-[1px] shadow-[1px_1px_0px_#e5e7eb]'
                                        } ${readonly ? 'cursor-not-allowed' : ''}`}
                                    style={selected
                                        ? {
                                            backgroundColor: cfg!.bg,
                                            borderColor: cfg!.border,
                                            color: cfg!.text,
                                            fontFamily: '"Permanent Marker", cursive',
                                        }
                                        : { fontFamily: '"Permanent Marker", cursive' }}
                                >
                                    <span>{item.emoji}</span>
                                    <span>{item.name}</span>
                                    {selected && <span className="text-xs ml-0.5">✓</span>}
                                </button>

                            </div>
                        );
                    })}
                </div>
            </div>
        </EnclosingBox>
    );
};
