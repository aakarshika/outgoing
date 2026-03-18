import { lazy, Suspense } from 'react';
import { Navigate, Route, Routes, useLocation } from 'react-router-dom';

import { isNativeSidebarPath } from '@/components/navbar/NavbarContext';
import { dashboardRouteElements } from '@/pages/dashboard/DashboardRoutes';
import { profileRouteElements } from '@/pages/profile/ProfileRoutes';
import { ThemeWrapper } from '@/theme/ThemeWrapper';

import { RoleGuard } from './RoleGuard';
import { RouteDefinition, routesConfig } from './routes.config';

const SignUpPage = lazy(() => import('@/pages/auth/signup/SignUpPage'));
const SignInPage = lazy(() => import('@/pages/auth/signin/SignInPage'));
// const ProfilePage = lazy(() => import('@/pages/profile/ProfilePage'));
const UserProfilePage = lazy(() => import('@/pages/profile/UserProfilePage'));
const SettingsNewPage = lazy(() => import('@/pages/profile/settings-new/SettingsNewPage'));
const HomePage = lazy(() => import('@/pages/home/RootHomePage'));
const HomePageRenewed = lazy(() => import('@/pages/home/HomePageRenewed'));
const HighlightsPage = lazy(() => import('@/pages/highlights/HighlightsPage'));
const HighlightsReelsPage = lazy(() => import('@/pages/highlightsreels/HighlightsReelsPage'));
const EventDetailNewPage = lazy(() => import('@/pages/events/EventDetailPageNew'));
const EventDetailV2Page = lazy(() => import('@/pages/events/EventDetailPageV2'));
const PlanningWorkspacePage = lazy(
  () => import('@/pages/events/PlanningWorkspacePage'),
);
// const CreateEventPage = lazy(() => import('@/pages/events/CreateEventPage'));
// const ManageForHostPage = lazy(() => import('@/pages/events/ManageForHostPage'));
// const ManageForVendorPage = lazy(() => import('@/pages/events/ManageForVendorPage'));
// const DashboardPage = lazy(() => import('@/pages/dashboard/DashboardPage'));
// const CalendarPage = lazy(() => import('@/pages/calendar/CalendarPage'));
const ManagingPage = lazy(() => import('@/pages/managing/ManagingPage'));
// const BrowseVendorsPage = lazy(() => import('@/pages/vendors/BrowseVendorsPage'));
const VendorPortfolioPage = lazy(() => import('@/pages/vendors/VendorPortfolioPage'));
// const CreateServicePage = lazy(() => import('@/pages/vendors/CreateServicePage'));
// const ServiceDetailPage = lazy(() => import('@/pages/vendors/ServiceDetailPage'));
// const EditServicePage = lazy(() => import('@/pages/vendors/EditServicePage'));
// const RequestsPage = lazy(() => import('@/pages/requests/RequestsPage'));
const TestFeedPage = lazy(() => import('@/pages/home/TestFeedPage'));
const ChatsPage = lazy(() => import('@/pages/chats/ChatsPage'));
// const EventsSpecialPage = lazy(() => import('@/pages/alerts/EventSpecialPage'));
const GalleryPage = lazy(() => import('@/pages/events/GalleryPage'));
// const BrowseFeedPage = lazy(() => import('@/pages/events/BrowseFeedPage'));
const SearchPage = lazy(() => import('@/pages/search/SearchPage'));
const YourNetworkPage = lazy(() => import('@/pages/network/YourNetworkPage'));

const PageComponentRegistry: Record<string, React.ComponentType> = {
  SignUp: SignUpPage,
  SignIn: SignInPage,
  // Profile: ProfilePage,
  UserProfile: UserProfilePage,
  SettingsNew: SettingsNewPage,
  Home: HomePage,
  Highlights: HighlightsPage,
  HighlightsReels: HighlightsReelsPage,
  EventDetail: EventDetailNewPage,
  EventDetailV2: EventDetailV2Page,
  PlanningWorkspace: PlanningWorkspacePage,
  TestFeed: TestFeedPage,
  // CreateEvent: CreateEventPage,
  // ManageForHost: ManageForHostPage,
  // ManageForVendor: ManageForVendorPage,
  // Dashboard: DashboardPage,
  // Calendar: CalendarPage,
  Managing: ManagingPage,
  // BrowseVendors: BrowseVendorsPage,
  VendorPortfolio: VendorPortfolioPage,
  // CreateService: CreateServicePage,
  // ServiceDetail: ServiceDetailPage,
  // EditService: EditServicePage,
  // Requests: RequestsPage,
  // Alerts: AlertsPage,
  Chats: ChatsPage,
  // EventsSpecial: EventsSpecialPage,
  Gallery: GalleryPage,
  // BrowseFeed: BrowseFeedPage,
  Search: SearchPage,
  YourNetwork: YourNetworkPage,
  HomeRenewed: HomePageRenewed,
};

import { useAuth } from '@/features/auth/AuthContext';
import { Box } from '@mui/material';

export const AppRoutes = () => {
  const { isAuthenticated } = useAuth();
  const location = useLocation();
  const isSidebarActive = isNativeSidebarPath(location.pathname);

  const renderRoute = (route: RouteDefinition) => {
    const Component = PageComponentRegistry[route.componentName];

    if (!Component) {
      console.warn(`Component ${route.componentName} not found in registry`);
      return null;
    }

    const content = (
      <RoleGuard
        allowedRoles={route.roles}
        isPublic={route.isPublic}
        isGuestOnly={route.isGuestOnly}
      >
        <ThemeWrapper themeName={route.theme}>
          <Suspense
            fallback={
              <div className="flex items-center justify-center min-h-[50vh]">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            }
          >
            {/* shift towards left because sidebar is fixed on the right side. for the paths in : isNativeSidebarPath */}
            <div className={isSidebarActive ? 'md:pr-[22rem]' : ''}>
              <Box className="relative">
              <Box className="absolute top-0 right-0 w-full h-full">
              <Component />
              </Box>
              </Box>
            </div>
          </Suspense>
        </ThemeWrapper>
      </RoleGuard>
    );

    return (
      <Route key={route.path} path={route.path} element={content}>
        {route.path === '/profile'
          ? profileRouteElements
          : route.path === '/dashboard'
            ? dashboardRouteElements
            : route.children?.map(renderRoute)}
      </Route>
    );
  };

  const filteredRoutes = routesConfig.filter((route) => {
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
    // console.log(
    //   'Filtered routes:',
    //   filteredRoutes.map((r) => r.path),
    // );
  }

  return (
    <Routes>
      {filteredRoutes.map(renderRoute)}
      <Route
        path="/unauthorized"
        element={<div className="p-8 text-center">403 - Unauthorized Access</div>}
      />
      <Route
        path="*"
        element={
          isAuthenticated ? (
            <Navigate to="/" replace />
          ) : (
            <Navigate to="/signin" replace />
          )
        }
      />
    </Routes>
  );
};
