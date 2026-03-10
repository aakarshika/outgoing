import React from 'react';

import {
  EventFeature,
  FEATURE_ITEMS,
  FeatureTag,
  TAG_COLORS,
} from '@/pages/events/manage/ManageDetailsSection';

export interface EventFeaturesQuickFormProps {
  eventFeatures: EventFeature[];
  setEventFeatures: (features: EventFeature[]) => void;
  readonly?: boolean;
}

const DEFAULT_TAG: FeatureTag = 'featured';

export const EventFeaturesQuickForm: React.FC<EventFeaturesQuickFormProps> = ({
  eventFeatures,
  setEventFeatures,
  readonly = false,
}) => {
  const items = FEATURE_ITEMS.slice(0, 8);

  return (
    <div className="flex flex-wrap gap-2">
      {items.map((item) => {
        const selected = eventFeatures.find((f) => f.name === item.name);
        const cfg = selected ? TAG_COLORS[selected.tag] : null;

        return (
          <button
            key={item.name}
            type="button"
            disabled={readonly}
            onClick={() => {
              if (readonly) return;
              if (selected) {
                setEventFeatures(eventFeatures.filter((f) => f.name !== item.name));
              } else {
                setEventFeatures([
                  ...eventFeatures,
                  { name: item.name, tag: DEFAULT_TAG },
                ]);
              }
            }}
            className={`h-10 w-10 rounded-full border transition-all flex items-center justify-center text-lg
              ${
                selected
                  ? 'shadow-[2px_2px_0px_rgba(0,0,0,0.2)]'
                  : 'bg-transparent border-gray-200 text-gray-500 hover:text-gray-700 hover:border-gray-400 hover:-translate-y-[1px] shadow-[1px_1px_0px_#e5e7eb]'
              } ${readonly ? 'cursor-not-allowed' : ''}`}
            style={
              selected
                ? {
                    backgroundColor: cfg!.bg,
                    borderColor: cfg!.border,
                    color: cfg!.text,
                  }
                : undefined
            }
            aria-pressed={Boolean(selected)}
            aria-label={item.name}
            title={item.name}
          >
            <span aria-hidden="true">{item.emoji}</span>
          </button>
        );
      })}
      ...
    </div>
  );
};
