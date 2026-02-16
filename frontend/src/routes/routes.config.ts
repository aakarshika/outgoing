import { UserRole } from '@/types/roles';

export interface RouteDefinition {
    path: string;
    componentName: string; // Refers to the component in src/pages
    roles?: UserRole[];
    theme?: string;
    isPublic?: boolean;
    children?: RouteDefinition[];
}

export const routesConfig: RouteDefinition[] = [
    {
        path: '/signup',
        componentName: 'SignUp',
        isPublic: true,
    },
    {
        path: '/signin',
        componentName: 'SignIn',
        isPublic: true,
    },
    {
        path: '/website-preview',
        componentName: 'WebsitePreview',
        roles: [UserRole.USER, UserRole.ADMIN],
        theme: 'profile-theme',
    },
    {
        path: '/website',
        componentName: 'WebsitePreview',
        isPublic: true,
    },
    {
        path: '/profile',
        componentName: 'Profile',
        roles: [UserRole.USER, UserRole.ADMIN],
        theme: 'profile-theme',
    },
];
