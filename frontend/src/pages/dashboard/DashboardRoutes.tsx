import { lazy, Suspense } from 'react';
import { Route, Navigate } from 'react-router-dom';

const EventsTab = lazy(() => import('./tabs/EventsTab').then(m => ({ default: m.EventsTab })));
const TicketsTab = lazy(() => import('./tabs/TicketsTab').then(m => ({ default: m.TicketsTab })));
const ServicesTab = lazy(() => import('./tabs/ServicesTab').then(m => ({ default: m.ServicesTab })));
const MyServicesTab = lazy(() => import('./tabs/MyServicesTab').then(m => ({ default: m.MyServicesTab })));
const OpportunitiesTab = lazy(() => import('./OpportunitiesTab').then(m => ({ default: m.OpportunitiesTab })));
const ActivitiesTab = lazy(() => import('./tabs/ActivitiesTab').then(m => ({ default: m.ActivitiesTab })));

const fallback = (
    <div className="flex items-center justify-center min-h-[40vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
    </div>
);

export const dashboardRouteElements = [
    <Route key="index" index element={<Navigate to="events" replace />} />,
    <Route
        key="events"
        path="events"
        element={
            <Suspense fallback={fallback}>
                <EventsTab />
            </Suspense>
        }
    />,
    <Route
        key="tickets"
        path="tickets"
        element={
            <Suspense fallback={fallback}>
                <TicketsTab />
            </Suspense>
        }
    />,
    <Route
        key="services"
        path="services"
        element={
            <Suspense fallback={fallback}>
                <ServicesTab />
            </Suspense>
        }
    >
        <Route index element={<Navigate to="my-services" replace />} />
        <Route
            key="my-services"
            path="my-services"
            element={
                <Suspense fallback={fallback}>
                    <MyServicesTab />
                </Suspense>
            }
        />
        <Route
            key="opportunities"
            path="opportunities"
            element={
                <Suspense fallback={fallback}>
                    <OpportunitiesTab />
                </Suspense>
            }
        />
    </Route>,
    <Route
        key="activities"
        path="activities"
        element={
            <Suspense fallback={fallback}>
                <ActivitiesTab />
            </Suspense>
        }
    />,
];
