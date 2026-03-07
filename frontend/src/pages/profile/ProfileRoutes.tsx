import { lazy, Suspense } from 'react';
import { Route } from 'react-router-dom';

const UserInfoSection = lazy(() =>
  import('./sections/UserInfoSection').then((m) => ({ default: m.UserInfoSection })),
);
const AccountSettingsSection = lazy(() =>
  import('./sections/AccountSettingsSection').then((m) => ({
    default: m.AccountSettingsSection,
  })),
);

const fallback = (
  <div className="flex items-center justify-center min-h-[50vh]">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
  </div>
);

/** Nested route elements for /profile. Exported so AppRoutes can render them as direct Route children. */
export const profileRouteElements = [
  <Route
    key="index"
    index
    element={
      <Suspense fallback={fallback}>
        <UserInfoSection />
      </Suspense>
    }
  />,
  <Route
    key="user-info"
    path="user-info"
    element={
      <Suspense fallback={fallback}>
        <UserInfoSection />
      </Suspense>
    }
  />,
  <Route
    key="settings"
    path="settings"
    element={
      <Suspense fallback={fallback}>
        <AccountSettingsSection />
      </Suspense>
    }
  />,
];
