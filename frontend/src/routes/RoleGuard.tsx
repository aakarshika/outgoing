import { ReactNode } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '@/features/auth/AuthContext';
import { UserRole } from '@/types/roles';

interface RoleGuardProps {
    allowedRoles?: UserRole[];
    isPublic?: boolean;
    children?: ReactNode;
}

export const RoleGuard = ({ allowedRoles, isPublic, children }: RoleGuardProps) => {
    const { user, isAuthenticated, loading } = useAuth();

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
        );
    }

    if (isPublic) {
        if (isAuthenticated) {
            return <Navigate to="/profile" replace />;
        }
        return <>{children || <Outlet />}</>;
    }

    if (!isAuthenticated) {
        return <Navigate to="/signin" replace />;
    }

    if (allowedRoles && user && !allowedRoles.includes(user.role || UserRole.USER)) {
        return <Navigate to="/unauthorized" replace />;
    }

    return <>{children || <Outlet />}</>;
};
