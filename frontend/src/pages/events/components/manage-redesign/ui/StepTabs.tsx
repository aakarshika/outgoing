import React from 'react';

import { StepConfigItem } from './StepProgress';

interface StepTabsProps {
  currentStep: number;
  stepsConfig: StepConfigItem[];
  onStepSelect: (stepId: number) => void;
}

// Separate full steps and half-steps, group them for rendering
// Layout: [1] --[1.5]--> [2] --[2.5]--> [3] ---------> [4]
export const StepTabs: React.FC<StepTabsProps> = ({
  currentStep,
  stepsConfig,
  onStepSelect,
}) => {
  const fullSteps = stepsConfig.filter((s) => !s.isHalfStep);
  const halfStepMap = new Map<number, StepConfigItem>();
  stepsConfig
    .filter((s) => s.isHalfStep)
    .forEach((s) => {
      // half step 1.5 sits between full step 1 and 2, etc.
      halfStepMap.set(Math.floor(s.stepId), s);
    });

  return (
    <div className="mb-10">
      {/* Step title label */}
      <div
        className="text-[10px] uppercase tracking-widest text-gray-400 mb-3 ml-1"
        style={{ fontFamily: '"Permanent Marker", cursive' }}
      >
        Quick step guide ↓
      </div>

      <div className="flex items-center flex-wrap gap-0">
        {fullSteps.map((step, idx) => {
          const isActive = currentStep === step.stepId;
          const isPast = step.stepId < currentStep;
          const halfStep = halfStepMap.get(step.stepId);
          const isHalfActive = halfStep && currentStep === halfStep.stepId;
          const isHalfPast = halfStep && halfStep.stepId < currentStep;
          const stepNumber = idx + 1;

          return (
            <React.Fragment key={step.stepId}>
              {/* ─── Full Step Bubble ─── */}
              <button
                onClick={() => onStepSelect(step.stepId)}
                className={`
                      relative flex flex-col items-center group transition-all
                      ${isActive ? 'z-10' : ''}
                    `}
                style={{
                  transform: isActive
                    ? 'translateY(-3px)'
                    : isPast
                      ? 'rotate(0.5deg)'
                      : 'rotate(-0.5deg)',
                }}
              >
                {/* Circle number badge */}
                <div
                  className={`
                                        aspect-square p-4
                        w-30 h-30 flex items-center justify-center border-2 transition-all font-bold text-lg
                        ${
                          isActive
                            ? 'bg-yellow-300 border-gray-900 shadow-[3px_3px_0px_#333] text-gray-900'
                            : isPast
                              ? 'bg-yellow-100 border-gray-700 shadow-[2px_2px_0px_#555] text-gray-700'
                              : 'bg-white border-gray-300 shadow-[1px_1px_0px_#ccc] text-gray-400'
                        }
                      `}
                  style={{
                    fontFamily: '"Permanent Marker", cursive',
                    borderRadius: '3px',
                  }}
                >
                  {isPast ? '✓' : stepNumber}
                  <br></br>
                  {step.title}
                </div>

                {/* Label below */}
                <span
                  className={`mt-2 text-xs whitespace-nowrap font-bold leading-tight transition-all
                        ${isActive ? 'text-gray-900 text-base' : isPast ? 'text-gray-500' : 'text-gray-400'}
                      `}
                  style={{
                    fontFamily: '"Permanent Marker", cursive',
                    fontSize: isActive ? '0.85rem' : '0.78rem',
                  }}
                ></span>

                {/* Active underline pen-stroke */}
                {isActive && (
                  <div
                    className="mt-0.5 h-0.5 w-full bg-gray-900"
                    style={{
                      borderRadius: '1px',
                      filter: 'blur(0.3px)',
                    }}
                  />
                )}
              </button>

              {/* ─── Connector + optional half-step ─── */}
              {idx < fullSteps.length - 1 && (
                <div className="flex items-center mx-1 gap-1 pb-4">
                  {halfStep ? (
                    // Half-step: show as a small pill between the arrows
                    <>
                      {/* left dots */}
                      <span className="text-gray-300 text-xs">· ·</span>

                      {/* Half step pill */}
                      <button
                        onClick={() => onStepSelect(halfStep.stepId)}
                        className={`
                                                        relative flex flex-col items-center transition-all
                                                        ${isHalfActive ? 'z-10' : ''}
                                                    `}
                        style={{
                          transform: isHalfActive ? 'translateY(-2px)' : 'rotate(1deg)',
                        }}
                      >
                        <div
                          className={`
                                                        px-8 py-1 text-xs font-bold border-2 transition-all leading-tight whitespace-nowrap
                                                        ${
                                                          isHalfActive
                                                            ? 'bg-orange-200 border-orange-700 text-orange-900 shadow-[2px_2px_0px_#c05621]'
                                                            : isHalfPast
                                                              ? 'bg-orange-100 border-gray-400 text-gray-500 shadow-[1px_1px_0px_#ccc]'
                                                              : 'bg-white border-gray-200 text-gray-300 shadow-[1px_1px_0px_#e5e7eb]'
                                                        }
                              `}
                          style={{
                            fontFamily: '"Permanent Marker", cursive',
                            borderRadius: '20px',
                            fontSize: '1.2rem',
                          }}
                        >
                          {halfStep.title}
                        </div>
                        {/* Active underline pen-stroke */}
                        {isHalfActive && (
                          <div
                            className="mt-2 px-3 h-0.5 w-full bg-orange-900"
                            style={{
                              borderRadius: '1px',
                              filter: 'blur(0.3px)',
                            }}
                          />
                        )}
                      </button>

                      {/* right arrow */}
                      <span className="text-gray-300 text-xs">· ·</span>
                    </>
                  ) : (
                    // Plain arrow connector
                    <div className="flex items-center gap-1 pb-1">
                      <div className="w-4 h-px bg-gray-300" />
                      <svg
                        width="6"
                        height="8"
                        viewBox="0 0 6 8"
                        className="text-gray-300 flex-shrink-0"
                      >
                        <path
                          d="M0 0 L6 4 L0 8"
                          stroke="currentColor"
                          strokeWidth="1.5"
                          fill="none"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </div>
                  )}
                </div>
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
};
