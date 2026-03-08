import React from 'react';

export interface StepProgressConfig {
    stepId: number;
    title: string;
    isHalfStep?: boolean;
}

export type StepConfigItem = StepProgressConfig;

interface StepProgressProps {
    currentStep: number;
    stepsConfig: StepProgressConfig[];
    onStepSelect: (stepId: number) => void;
}

export const StepProgress: React.FC<StepProgressProps> = ({
    currentStep,
    stepsConfig,
    onStepSelect,
}) => {
    return (
        <div className="flex items-center gap-2 mb-8 flex-wrap">
            {stepsConfig.map((step, index) => {
                const isCurrent = currentStep === step.stepId;
                const isPast = step.stepId < currentStep;

                return (
                    <React.Fragment key={step.stepId}>
                        <button
                            onClick={() => onStepSelect(step.stepId)}
                            className={`
                px-3 py-1.5 text-xs font-bold transition-all relative
                ${isCurrent
                                    ? 'bg-yellow-300 text-gray-900 shadow-[2px_2px_0px_#333] -translate-y-[1px] scale-105 z-10'
                                    : ''
                                }
                ${isPast ? 'bg-white text-gray-600 shadow-[1px_1px_0px_#333] hover:bg-gray-50' : ''}
                ${!isCurrent && !isPast
                                    ? 'bg-gray-100/50 text-gray-400 opacity-70 hover:opacity-100 hover:shadow-[1px_1px_0px_#ccc]'
                                    : ''
                                }
                ${step.isHalfStep
                                    ? 'rounded-full border border-dashed border-gray-400'
                                    : 'rounded-none border border-gray-800'
                                }
              `}
                            style={{
                                fontFamily: '"Permanent Marker", cursive',
                                transform: isCurrent
                                    ? 'rotate(-1deg)'
                                    : index % 2 === 0
                                        ? 'rotate(1deg)'
                                        : 'rotate(-1deg)',
                            }}
                        >
                            {step.isHalfStep ? '' : `Step ${Math.floor(step.stepId)}: `}
                            {step.title}
                        </button>

                        {index < stepsConfig.length - 1 && (
                            <div className="flex items-center gap-1.5 px-1 opacity-50">
                                <span className="w-1.5 h-1.5 rounded-full bg-gray-600" />
                                <span className="w-1.5 h-1.5 rounded-full bg-gray-600" />
                                <span className="w-1.5 h-1.5 rounded-full bg-gray-600" />
                            </div>
                        )}
                    </React.Fragment>
                );
            })}
        </div>
    );
};
