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
  showLabels?: boolean;
}

const DEFAULT_TAG: FeatureTag = 'featured';

export const EventFeaturesQuickForm: React.FC<EventFeaturesQuickFormProps> = ({
  eventFeatures,
  setEventFeatures,
  readonly = false,
  showLabels = false,
}) => {
  const [expanded, setExpanded] = React.useState(false);
  const items = expanded ? FEATURE_ITEMS : FEATURE_ITEMS.slice(0, 11);

  return (
    <div className="flex flex-wrap gap-2.5">
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
            className={`border transition-all flex items-center justify-center
              ${
                showLabels
                  ? 'min-h-[3.25rem] rounded-full px-4 gap-2 text-sm font-semibold'
                  : 'h-11 w-11 rounded-full text-xl'
              }
              ${
                selected
                  ? 'shadow-[2px_2px_0px_rgba(0,0,0,0.2)] scale-110'
                  : 'bg-transparent border-gray-200 text-gray-500 hover:text-gray-700 hover:border-gray-400 hover:-translate-y-[0.5px] shadow-[1px_1px_0px_#e5e7eb]'
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
            {showLabels ? (
              <span className="text-[12px] leading-none">{item.name}</span>
            ) : null}
          </button>
        );
      })}

      {FEATURE_ITEMS.length > 11 && (
        <button
          type="button"
          onClick={() => setExpanded(!expanded)}
          className="h-11 px-4 rounded-full border border-dashed border-gray-300 text-[10px] font-bold uppercase tracking-wider text-gray-400 hover:border-gray-400 hover:text-gray-600 transition-all flex items-center justify-center bg-white/50"
        >
          {expanded ? 'Less' : `+${FEATURE_ITEMS.length - 11} more`}
        </button>
      )}
    </div>
  );
};
