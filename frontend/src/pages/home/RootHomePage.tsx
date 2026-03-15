import { useAuth } from '@/features/auth/hooks';
import MyHomePage from '@/pages/me/MyHomePage';

import GuestLandingPage from './GuestLandingPage';

export default function RootHomePage() {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return null;
  }

  return isAuthenticated ? <MyHomePage /> : <GuestLandingPage />;
}
