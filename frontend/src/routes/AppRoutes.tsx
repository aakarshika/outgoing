import { Suspense, lazy } from 'react';
import { Route, Routes, Navigate } from 'react-router-dom';
import { profileRouteElements } from '@/pages/profile/ProfileRoutes';
import { RoleGuard } from './RoleGuard';
import { routesConfig, RouteDefinition } from './routes.config';
import { ThemeWrapper } from '@/theme/ThemeWrapper';

const SignUpPage = lazy(() => import('@/pages/auth/signup/SignUpPage'));
const SignInPage = lazy(() => import('@/pages/auth/signin/SignInPage'));
const ProfilePage = lazy(() => import('@/pages/profile/ProfilePage'));
const HomePage = lazy(() => import('@/pages/home/HomePage'));
const EventDetailPage = lazy(() => import('@/pages/events/EventDetailPage'));
const CreateEventPage = lazy(() => import('@/pages/events/CreateEventPage'));
const ManageEventPage = lazy(() => import('@/pages/events/ManageEventPage'));
const DashboardPage = lazy(() => import('@/pages/dashboard/DashboardPage'));
const CalendarPage = lazy(() => import('@/pages/calendar/CalendarPage'));
const BrowseVendorsPage = lazy(() => import('@/pages/vendors/BrowseVendorsPage'));
const VendorPortfolioPage = lazy(() => import('@/pages/vendors/VendorPortfolioPage'));
const VendorOpportunitiesPage = lazy(() => import('@/pages/vendors/VendorOpportunitiesPage'));
const CreateServicePage = lazy(() => import('@/pages/vendors/CreateServicePage'));
const RequestsPage = lazy(() => import('@/pages/requests/RequestsPage'));
const AlertsPage = lazy(() => import('@/pages/alerts/AlertsPage'));

const PageComponentRegistry: Record<string, React.ComponentType> = {
    SignUp: SignUpPage,
    SignIn: SignInPage,
    Profile: ProfilePage,
    Home: HomePage,
    EventDetail: EventDetailPage,
    CreateEvent: CreateEventPage,
    ManageEvent: ManageEventPage,
    Dashboard: DashboardPage,
    Calendar: CalendarPage,
    BrowseVendors: BrowseVendorsPage,
    VendorPortfolio: VendorPortfolioPage,
    VendorOpportunities: VendorOpportunitiesPage,
    CreateService: CreateServicePage,
    Requests: RequestsPage,
    Alerts: AlertsPage,
};

import { useAuth } from '@/features/auth/AuthContext';

export const AppRoutes = () => {
    const { isAuthenticated } = useAuth();

    const renderRoute = (route: RouteDefinition) => {
        const Component = PageComponentRegistry[route.componentName];

        if (!Component) {
            console.warn(`Component ${route.componentName} not found in registry`);
            return null;
        }

        const content = (
            <RoleGuard allowedRoles={route.roles} isPublic={route.isPublic} isGuestOnly={route.isGuestOnly}>
                <ThemeWrapper themeName={route.theme}>
                    <Suspense fallback={
                        <div className="flex items-center justify-center min-h-[50vh]">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                        </div>
                    }>
                        <Component />
                    </Suspense>
                </ThemeWrapper>
            </RoleGuard>
        );

        return (
            <Route key={route.path} path={route.path} element={content}>
                {route.path === '/profile' ? profileRouteElements : route.children?.map(renderRoute)}
            </Route>
        );
    };

    const filteredRoutes = routesConfig.filter(route => {
        // Always include routes that require auth (they'll be protected by RoleGuard)
        if (route.roles && route.roles.length > 0) {
            return true;
        }
        // Filter public routes based on auth state
        if (isAuthenticated) {
            // When logged in, hide guest-only routes like sign-in/sign-up
            return !route.isGuestOnly;
        } else {
            // When logged out, only show public routes
            return !!route.isPublic;
        }
    });

    // Debug: log filtered routes
    if (process.env.NODE_ENV === 'development') {
        console.log('Filtered routes:', filteredRoutes.map(r => r.path));
    }

    return (
        <Routes>
            {filteredRoutes.map(renderRoute)}
            <Route path="/unauthorized" element={<div className="p-8 text-center">403 - Unauthorized Access</div>} />
            <Route path="*" element={
                isAuthenticated ? (
                    <Navigate to="/" replace />
                ) : (
                    <Navigate to="/signin" replace />
                )
            } />
        </Routes>
    );
};
