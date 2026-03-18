import React, { useEffect } from 'react';
import { useMatch, useNavigate, useParams } from 'react-router-dom';
import { toast } from 'sonner';

import { useAuth } from '@/features/auth/hooks';
import { useEvent } from '@/features/events/hooks';
import { useBackground } from '@/theme/BackgroundProvider';

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
    components: [{ id: 'application', component: ApplicationStep as any }],
  },
  {
    stepId: 2,
    title: 'Live',
    routeSlug: 'live',
    isHalfStep: false,
    components: [{ id: 'live', component: LiveStep as any }],
  },
  {
    stepId: 3,
    title: 'Reviews',
    routeSlug: 'reviews',
    isHalfStep: false,
    components: [{ id: 'reviews', component: ReviewsStep as any }],
  },
];

export default function ManageForVendorPage() {
  const { setBackgroundComponent } = useBackground();

  useEffect(() => {
    setBackgroundComponent(
      <div
        className="fixed inset-0"
        style={{
          // backgroundImage: 'radial-gradient(hsla(174, 99%, 42%, 1.00) 0.5px, transparent 0.5px)',
          backgroundSize: '15px 15px',
          backgroundColor: '#f3fbfaff',
          zIndex: -1,
          pointerEvents: 'none',
        }}
      />,
    );
  }, [setBackgroundComponent]);

  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const vendorStepMatch = useMatch('/events/:id/service-event-management/:step');
  const activeSlug = vendorStepMatch?.params.step;
  const vendorBasePath = id
    ? `/events-new/${id}/service-event-management`
    : '/events/service-event-management';
  const fallbackStep = VENDOR_STEPS[0];
  const matchedStep = activeSlug
    ? VENDOR_STEPS.find((step) => step.routeSlug === activeSlug)
    : null;
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
  const { data: eventResponse, isLoading: isEventLoading } = useEvent(Number(id));
  const event = eventResponse?.data;
  const { user } = useAuth();

  // Auth redirect
  useEffect(() => {
    if (!isEventLoading && event && user) {
      // A vendor must have the `user_is_vendor` flag on the event object
      if (!event.user_is_vendor) {
        toast.error(
          'You do not have permission to access the vendor management view for this event.',
        );
        navigate(`/events-new/${id}`);
      }
    }
  }, [isEventLoading, event, user, id, navigate]);

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
    <div className="min-h-screen px-4 sm:px-6 py-8">
      <div className="mx-auto max-w-4xl">
        {!event || (user && !event.user_is_vendor) ? (
          <div className="flex h-64 items-center justify-center">
            <div className="text-gray-500">Loading or checking permissions...</div>
          </div>
        ) : (
          <>
            <div className="mb-6">
              <h1
                className="text-3xl font-bold text-gray-900"
                style={{ fontFamily: '"Permanent Marker", cursive' }}
              >
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
            <div>{renderCurrentStepComponents()}</div>
          </>
        )}
      </div>
    </div>
  );
}
