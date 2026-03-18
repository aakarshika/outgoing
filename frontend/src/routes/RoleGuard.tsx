import { ReactNode } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';

import { useAuth } from '@/features/auth/AuthContext';
import { UserRole } from '@/types/roles';

interface RoleGuardProps {
  allowedRoles?: UserRole[];
  isPublic?: boolean;
  isGuestOnly?: boolean;
  children?: ReactNode;
}

export const RoleGuard = ({
  allowedRoles,
  isPublic,
  isGuestOnly,
  children,
}: RoleGuardProps) => {
  const { user, isAuthenticated, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (isGuestOnly) {
    if (isAuthenticated) {
      return <Navigate to="/" replace />;
    }
    return <>{children || <Outlet />}</>;
  }

  if (isPublic) {
    return <>{children || <Outlet />}</>;
  }

  if (!isAuthenticated) {
    const redirectTo = encodeURIComponent(location.pathname + location.search);
    return <Navigate to={`/signin?redirectTo=${redirectTo}`} replace />;
  }

  if (allowedRoles && user && !allowedRoles.includes(user.role || UserRole.USER)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return <>{children || <Outlet />}</>;
};
