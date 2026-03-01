import { UserRole } from '@/types/roles';

export interface RouteDefinition {
    path: string;
    componentName: string; // Refers to the component in src/pages
    roles?: UserRole[];
    theme?: string;
    isPublic?: boolean;
    isGuestOnly?: boolean;
    children?: RouteDefinition[];
}

export const routesConfig: RouteDefinition[] = [
    {
        path: '/',
        componentName: 'Home',
        isPublic: true,
    },
    {
        path: '/events/create',
        componentName: 'CreateEvent',
        roles: [UserRole.USER, UserRole.ADMIN],
    },
    {
        path: '/events/:id/manage',
        componentName: 'ManageEvent',
        roles: [UserRole.USER, UserRole.ADMIN],
    },
    {
        path: '/events/:id',
        componentName: 'EventDetail',
        isPublic: true,
    },
    {
        path: '/dashboard',
        componentName: 'Dashboard',
        roles: [UserRole.USER, UserRole.ADMIN],
    },
    {
        path: '/vendors',
        componentName: 'BrowseVendors',
        isPublic: true,
    },
    {
        path: '/vendors/create',
        componentName: 'CreateService',
        roles: [UserRole.USER, UserRole.ADMIN],
    },
    {
        path: '/requests',
        componentName: 'Requests',
        isPublic: true,
    },
    {
        path: '/signup',
        componentName: 'SignUp',
        isPublic: true,
        isGuestOnly: true,
    },
    {
        path: '/signin',
        componentName: 'SignIn',
        isPublic: true,
        isGuestOnly: true,
    },
    {
        path: '/profile',
        componentName: 'Profile',
        roles: [UserRole.USER, UserRole.ADMIN],
        theme: 'profile-theme',
    },
];
