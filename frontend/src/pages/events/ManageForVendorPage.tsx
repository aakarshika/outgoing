import React, { useEffect } from 'react';
import { useMatch, useNavigate, useParams } from 'react-router-dom';

import { useEvent } from '@/features/events/hooks';
import { StepTabs } from './components/manage-redesign/ui/StepTabs';
import { ApplicationStep } from './components/manage-vendor/ApplicationStep';
import { LiveStep } from './components/manage-vendor/LiveStep';
import { ReviewsStep } from './components/manage-vendor/ReviewsStep';

export const VENDOR_STEPS = [
    {
        stepId: 1,
        title: 'Application',
        routeSlug: 'application',
        isHalfStep: false,
        components: [
            { id: 'application', component: ApplicationStep as any },
        ],
    },
    {
        stepId: 2,
        title: 'Live',
        routeSlug: 'live',
        isHalfStep: false,
        components: [
            { id: 'live', component: LiveStep as any },
        ],
    },
    {
        stepId: 3,
        title: 'Reviews',
        routeSlug: 'reviews',
        isHalfStep: false,
        components: [
            { id: 'reviews', component: ReviewsStep as any },
        ],
    },
];

export default function ManageForVendorPage() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const vendorStepMatch = useMatch('/events/:id/service-event-management/:step');
    const activeSlug = vendorStepMatch?.params.step;
    const vendorBasePath = id ? `/events/${id}/service-event-management` : '/events/service-event-management';
    const fallbackStep = VENDOR_STEPS[0];
    const matchedStep = activeSlug ? VENDOR_STEPS.find((step) => step.routeSlug === activeSlug) : null;
    const hasValidSlug = Boolean(matchedStep);
    const activeStep = matchedStep ?? fallbackStep;

    const goToStep = (stepId: number) => {
        if (!id) return;
        const targetStep = VENDOR_STEPS.find((step) => step.stepId === stepId);
        if (!targetStep) return;
        navigate(`${vendorBasePath}/${targetStep.routeSlug}`);
    };

    useEffect(() => {
        if (!id) return;
        if (!activeSlug) {
            navigate(`${vendorBasePath}/${fallbackStep.routeSlug}`, { replace: true });
            return;
        }
        if (activeSlug && !hasValidSlug) {
            navigate(`${vendorBasePath}/${fallbackStep.routeSlug}`, { replace: true });
        }
    }, [activeSlug, hasValidSlug, vendorBasePath, fallbackStep.routeSlug, id, navigate]);

    // Data fetching
    const { data: eventResponse } = useEvent(Number(id));
    const event = eventResponse?.data;

    const renderCurrentStepComponents = () => {
        const stepConfig = activeStep;
        if (!stepConfig) return null;

        const commonProps = { event, readonly: true };

        return (
            <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-300">
                {stepConfig.components.map(({ id: cId, component: Component }) => {
                    return <Component key={cId} {...commonProps} />;
                })}
            </div>
        );
    };

    return (
        <div
            className="min-h-screen px-4 sm:px-6 py-8"
            style={{
                // backgroundImage: 'radial-gradient(hsl(174, 20%, 80%) 0.5px, transparent 0.5px)',
                backgroundSize: '15px 15px',
            }}
        >
            <div className="mx-auto max-w-4xl">
                <div className="mb-6">
                    <h1 className="text-3xl font-bold text-gray-900" style={{ fontFamily: '"Permanent Marker", cursive' }}>
                        Servicing Event
                    </h1>
                </div>

                {/* Horizontal Step Tabs */}
                <StepTabs
                    currentStep={activeStep.stepId}
                    stepsConfig={VENDOR_STEPS}
                    onStepSelect={goToStep}
                />

                {/* Step content */}
                <div>
                    {renderCurrentStepComponents()}
                </div>
            </div>
        </div>
    );
}
