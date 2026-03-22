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
    path: '/events/:id/manage',
    componentName: 'EventWorkspace',
    roles: [UserRole.USER, UserRole.ADMIN],
  },
  {
    path: '/events/:id/manage/basic-details',
    componentName: 'EventWorkspace',
    roles: [UserRole.USER, UserRole.ADMIN],
  },
  {
    path: '/events/:id/manage/needs',
    componentName: 'EventWorkspace',
    roles: [UserRole.USER, UserRole.ADMIN],
  },
  {
    path: '/events/:id/manage/tickets',
    componentName: 'EventWorkspace',
    roles: [UserRole.USER, UserRole.ADMIN],
  },
  {
    path: '/events/:id/manage/admit',
    componentName: 'EventWorkspace',
    roles: [UserRole.USER, UserRole.ADMIN],
  },
  {
    path: '/test-feed',
    componentName: 'TestFeed',
    isPublic: true,
  },
  {
    path: '/highlights',
    componentName: 'Highlights',
    isPublic: true,
  },
  {
    path: '/highlightsreels',
    componentName: 'HighlightsReels',
    isPublic: true,
  },
  {
    path: '/highlightsreels/:highlightId',
    componentName: 'HighlightsReels',
    isPublic: true,
  },
  {
    path: '/homerenewed',
    componentName: 'HomeRenewed',
    isPublic: true,
  },
  // {
  //   path: '/alerts',
  //   componentName: 'Alerts',
  //   roles: [UserRole.USER, UserRole.ADMIN],
  // },
  {
    path: '/chats',
    componentName: 'Chats',
    roles: [UserRole.USER, UserRole.ADMIN],
  },
  // {
  //   path: '/special',
  //   componentName: 'EventsSpecial',
  //   roles: [UserRole.USER, UserRole.ADMIN],
  // },
  // {
  //   path: '/events/create',
  //   componentName: 'CreateEvent',
  //   roles: [UserRole.USER, UserRole.ADMIN],
  // },
  // {
  //   path: '/events/:id/manage/*',
  //   componentName: 'PlanningWorkspace',
  //   roles: [UserRole.USER, UserRole.ADMIN],
  // },
  // {
  //   path: '/events/:id/host-event-management/*',
  //   componentName: 'ManageForHost',
  //   roles: [UserRole.USER, UserRole.ADMIN],
  // },
  // {
  //   path: '/events/:id/service-event-management/*',
  //   componentName: 'ManageForVendor',
  //   roles: [UserRole.USER, UserRole.ADMIN],
  // },
  {
    path: '/events/:id',
    componentName: 'EventDetail',
    isPublic: true,
  },
  {
    path: '/events-new/:id',
    componentName: 'EventDetailV2',
    isPublic: true,
  },
  {
    path: '/events/:id/gallery',
    componentName: 'Gallery',
    isPublic: true,
  },
  {
    path: '/events/:id/gallery/:highlightId',
    componentName: 'Gallery',
    isPublic: true,
  },
  // {
  //   path: '/dashboard',
  //   componentName: 'Dashboard',
  //   roles: [UserRole.USER, UserRole.ADMIN],
  // },
  // {
  //   path: '/calendar',
  //   componentName: 'Calendar',
  //   roles: [UserRole.USER, UserRole.ADMIN],
  // },
  {
    path: '/managing/:tab?',
    componentName: 'Managing',
    roles: [UserRole.USER, UserRole.ADMIN],
  },
  // {
  //   path: '/vendors',
  //   componentName: 'BrowseVendors',
  //   isPublic: true,
  // },
  {
    path: '/vendors/portfolio/:vendorId',
    componentName: 'VendorPortfolio',
    isPublic: true,
  },
  // {
  //   path: '/vendors/create',
  //   componentName: 'CreateService',
  //   roles: [UserRole.USER, UserRole.ADMIN],
  // },
  // {
  //   path: '/services/:id',
  //   componentName: 'ServiceDetail',
  //   isPublic: true,
  // },
  // {
  //   path: '/services/:id/edit',
  //   componentName: 'EditService',
  //   roles: [UserRole.USER, UserRole.ADMIN],
  // },
  // {
  //   path: '/requests',
  //   componentName: 'Requests',
  //   isPublic: true,
  // },
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
  // {
  //   path: '/profile',
  //   componentName: 'Profile',
  //   roles: [UserRole.USER, UserRole.ADMIN],
  //   theme: 'profile-theme',
  // },
  {
    path: '/user/:username',
    componentName: 'UserProfile',
    isPublic: true,
  },
  {
    path: '/mock/user-profile/:username',
    componentName: 'UserProfileMock',
    isPublic: true,
  },
  {
    path: '/mock/user-profile',
    componentName: 'UserProfileMock',
    isPublic: true,
  },
  {
    path: '/profile/settings-new',
    componentName: 'SettingsNew',
    roles: [UserRole.USER, UserRole.ADMIN],
    theme: 'profile-theme',
  },
  // {
  //   path: '/browse',
  //   componentName: 'BrowseFeed',
  //   isPublic: true,
  // },
  {
    path: '/search',
    componentName: 'Search',
    isPublic: true,
  },
  {
    path: '/network',
    componentName: 'YourNetwork',
    isPublic: true,
  },
];
