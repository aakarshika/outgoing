import {
  ArrowLeft,
  Briefcase,
  Calendar,
  CalendarDays,
  LocateFixed,
  MapPin,
  Menu,
  MessageSquare,
  MessageSquareIcon,
  Pencil,
  Plus,
  Search,
  Settings,
  Shield,
  Ticket,
  User,
  UserPlus,
} from 'lucide-react';
import { Link } from 'react-router-dom';

import { ComicIconButton } from '@/components/ui/ComicIconButton';
import { ComicSinkButton } from '@/components/ui/ComicSinkButton';
import type { EventSearchSuggestion } from '@/types/events';

import { AllChatsList } from './AllChatsList';
import { useNavbarContext } from './NavbarContext';

export const dashboardLinks: {
  [key: string]: {
    key: string;
    label: string;
    icon?: any;
    type?: string;
    indent: number;
    to?: string;
  };
} = {
  going: {
    key: 'going',
    label: 'Going',
    icon: CalendarDays,
    type: 'heading',
    indent: 1,
  },
  saved: {
    key: 'saved',
    to: '/dashboard/saved',
    label: 'Saved Dates',
    icon: Ticket,
    indent: 2,
  },
  tickets: {
    key: 'tickets',
    to: '/dashboard/tickets',
    label: 'My Tickets',
    icon: Ticket,
    indent: 2,
  },

  activities: {
    key: 'activities',
    label: 'Activities',
    icon: CalendarDays,
    type: 'heading',
    indent: 1,
  },
  calendar: {
    key: 'calendar',
    to: '/calendar',
    label: 'Calendar',
    icon: CalendarDays,
    indent: 2,
  },
  'my-activities': {
    key: 'my-activities',
    to: '/dashboard/activities',
    label: 'My Activities',
    icon: MessageSquare,
    indent: 1,
  },

  organizing: {
    key: 'organizing',
    label: 'Organizing',
    icon: Menu,
    type: 'heading',
    indent: 1,
  },
  'my-events': {
    key: 'my-events',
    to: '/dashboard/events',
    label: 'My Events',
    icon: CalendarDays,
    indent: 2,
  },

  services: {
    key: 'services',
    label: 'Services',
    icon: Briefcase,
    type: 'heading',
    indent: 1,
  },
  'my-services': {
    key: 'my-services',
    to: '/dashboard/services/my-services',
    label: 'My Services',
    indent: 2,
  },
  'my-opportunities': {
    key: 'my-opportunities',
    to: '/dashboard/services/opportunities',
    label: 'Service Opportunities',
    indent: 2,
  },

  profile: { key: 'profile', label: 'Profile + Settings', type: 'heading', indent: 1 },
  'user-info': {
    key: 'user-info',
    to: '/profile/user-info',
    label: 'User Info',
    icon: User,
    indent: 2,
  },
  'account-settings': {
    key: 'account-settings',
    to: '/profile/settings',
    label: 'Account Settings',
    icon: Settings,
    indent: 2,
  },
  privacy: {
    key: 'privacy',
    to: '/profile/privacy',
    label: 'Privacy',
    icon: Shield,
    indent: 2,
  },
};

export const SidebarLinkItem = ({ itemKey }: { itemKey: string }) => {
  const { location } = useNavbarContext();
  const item: {
    key: string;
    label: string;
    icon?: any;
    type?: string;
    indent: number;
    to?: string;
  } = dashboardLinks[itemKey];

  return (
    <>
      {item.type === 'heading' ? (
        item.to === undefined ? (
          <p
            key={item.label}
            className="mb-3 mt-5 text-sm uppercase tracking-wider text-gray-600"
            style={{
              fontFamily: '"Permanent Marker"',
              transform: 'rotate(-1deg)',
            }}
          >
            {item.label}
          </p>
        ) : (
          <Link
            key={item.label}
            to={item.to || ''}
            className={`flex items-center gap-2.5 px-3 py-2 text-base transition-all hover:bg-yellow-200/60 hover:translate-x-1 ${location.pathname === item.to ? 'bg-yellow-300/50 -rotate-1 border-l-4 border-yellow-500 font-bold' : 'text-gray-700'}`}
            style={{ fontFamily: '"Caveat", cursive', fontSize: '1.15rem' }}
          >
            {item.icon ? <item.icon className="h-4 w-4 shrink-0" /> : null}
            {item.label}
          </Link>
        )
      ) : (
        <Link
          key={item.label}
          to={item.to || ''}
          className={`flex items-center gap-2.5 px-3 py-2 text-base transition-all hover:bg-yellow-200/60 hover:translate-x-1 ${location.pathname === item.to ? 'bg-yellow-300/50 -rotate-1 border-l-4 border-yellow-500 font-bold' : 'text-gray-700'}`}
          style={{ fontFamily: '"Caveat", cursive', fontSize: '1.15rem' }}
        >
          {item.icon ? <item.icon className="h-4 w-4 shrink-0" /> : null}
          {item.label}
        </Link>
      )}
    </>
  );
};

export const ManageEventButton = ({
  type,
}: {
  type: 'manage-service-ghost' | 'manage-event-ghost';
}) => {
  const { location } = useNavbarContext();
  const isActive =
    (location.pathname.includes('host-event-management') &&
      type === 'manage-event-ghost') ||
    (location.pathname.includes('service-event-management') &&
      type === 'manage-service-ghost');

  if (!isActive) return null;
  return (
    <div
      className={`w-full  ${isActive ? 'bg-yellow-300/50 -rotate-1 border-l-4 border-yellow-500' : ''}`}
    >
      <ComicSinkButton
        type="button"
        variant={'solid'}
        size="default"
        shape="square"
        Icon={Pencil}
        iconProps={{ strokeWidth: 3 }}
        color={'#1e3a5f'}
        accentColor={
          type === 'manage-service-ghost'
            ? '#00CCCC'
            : type === 'manage-event-ghost'
              ? '#AF90F9'
              : '#AF90F9'
        }
        className="h-12 w-full"
      >
        {type === 'manage-service-ghost'
          ? 'Manage Service'
          : type === 'manage-event-ghost'
            ? 'Manage Event'
            : '99999'}
      </ComicSinkButton>
    </div>
  );
};

export const CreateEventButton = ({
  type,
}: {
  type: 'event' | 'service' | 'manage-event' | 'manage-service' | 'signin' | 'signup';
}) => {
  const { navigate, setIsQuickCreateOpen, eventId } = useNavbarContext();
  const isActive =
    location.pathname.includes('host-event-management') ||
    location.pathname.includes('service-event-management');

  if (isActive) return null;
  return (
    <ComicSinkButton
      type="button"
      variant={'solid'}
      size="default"
      shape="square"
      Icon={type === 'signin' ? User : type === 'signup' ? UserPlus : Plus}
      iconProps={{ strokeWidth: 3 }}
      color={'#1e3a5f'}
      accentColor={
        type === 'event'
          ? '#AF90F9'
          : type === 'service'
            ? '#00CCCC'
            : type === 'manage-event'
              ? '#AF90F9'
              : type === 'manage-service'
                ? '#00CCCC'
                : type === 'signin'
                  ? '#ffffff'
                  : type === 'signup'
                    ? 'rgb(255, 191, 103)'
                    : '#AF90F9'
      }
      onClick={() => {
        if (type === 'event') setIsQuickCreateOpen(true);
        else if (type === 'service') navigate('/vendors/create');
        else if (type === 'manage-event')
          navigate(`/events/${eventId}/manage`);
        else if (type === 'manage-service')
          navigate(`/events/${eventId}/service-event-management`);
        else if (type === 'signin') navigate('/signin');
        else if (type === 'signup') navigate('/signup');
      }}
      className="h-12 w-full"
    >
      {type === 'event'
        ? 'Create Event'
        : type === 'service'
          ? 'Create Service'
          : type === 'manage-event'
            ? 'Manage Event'
            : type === 'manage-service'
              ? 'Manage Service'
              : type === 'signin'
                ? 'Sign In'
                : type === 'signup'
                  ? 'Sign Up'
                  : 'Create Event'}
    </ComicSinkButton>
  );
};

export const LogoSection = () => {
  return (
    <div>
      <div className="sm:hidden xs:hidden flex">
        {/* Logo for small screens */}
        <Link to="/" className="flex flex-shrink-0 items-center mr-4 relative group">
          <span
            className="text-4xl font-bold text-gray-900 relative z-10"
            style={{ fontFamily: '"Permanent Marker"', scale: 1.2 }}
          >
            <img
              src="assets/go-symbol.png"
              alt="Outgoing"
              title="Outgoing"
              className="h-10 w-10"
              style={{
                filter: 'drop-shadow(2px 2px 1px #E2BF00) ',
                transform: 'scale(1.3)',
              }}
            />
          </span>
        </Link>
      </div>
      <div className="sm:flex xs:flex hidden">
        {/* Logo for medium screens */}
        <Link to="/" className="flex flex-shrink-0 items-center relative group">
          <span
            className="text-4xl inline-flex items-center font-bold text-gray-900 relative z-10"
            style={{ fontFamily: '"Permanent Marker"', scale: 1.2 }}
          >
            Out
            <img
              src="assets/go-symbol.png"
              alt="Outgoing"
              title="Outgoing"
              className="h-10 w-10"
              style={{
                filter: 'drop-shadow(2px 2px 1px #E2BF00) ',
                transform: 'scale(1.3)',
              }}
            />
            ing
          </span>
        </Link>
      </div>
    </div>
  );
};

export const IconButtonsSection = () => {
  const {
    alertsCount,
    isVendor,
    isEventHost,
    setIsQuickCreateOpen,
    setIsAllChatsSidebarOpen,
  } = useNavbarContext();

  return (
    <div>
      <AllChatsList />
      <div className="hidden sm:flex xs:flex items-center gap-2">
        <ComicIconButton
          onClick={() => setIsAllChatsSidebarOpen(true)}
          variant="ghost"
          size="icon"
          asChild
          Icon={MessageSquareIcon}
        >
          <Link to="#" aria-label="AllchatsList" onClick={(e) => e.preventDefault()}>
            <div className="absolute top-0 right-0 h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white z-10">
              {alertsCount > 0 && <span>{alertsCount}</span>}
            </div>
          </Link>
        </ComicIconButton>
        <ComicIconButton variant="ghost" size="icon" asChild Icon={Calendar}>
          <Link to="/calendar" aria-label="Calendar" />
        </ComicIconButton>
        {!isVendor && !isEventHost && (
          <ComicIconButton
            variant="ghost"
            size="icon"
            Icon={Plus}
            color="#AF90F9"
            onClick={() => setIsQuickCreateOpen(true)}
          />
        )}
      </div>
    </div>
  );
};

export const UserInfoSection = () => {
  const { user, navigate } = useNavbarContext();

  return (
    <div>
      {/* User Details Header */}
      <div className="mb-6 relative group">
        <div
          className="absolute -inset-2 bg-yellow-200/40 border-2 border-dashed border-gray-400 -rotate-2 group-hover:rotate-0 transition-transform"
          style={{ borderRadius: '4px' }}
        />
        <div
          className="relative flex cursor-pointer items-center gap-4 p-2 bg-white/40 border border-gray-200"
          onClick={() => navigate(`/user/${user?.username}`)}
        >
          <div className="w-16 h-16 rounded-none bg-white overflow-hidden shadow-[2px_2px_0] p-1 rotate-3">
            {user?.avatar ? (
              <img
                src={user.avatar}
                alt={user.username}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                <User className="h-8 w-8 text-gray-400" />
              </div>
            )}
          </div>
          <div>
            <h3
              className="text-xl text-gray-900 leading-tight"
              style={{ fontFamily: '"Permanent Marker", cursive' }}
            >
              {user ? `${user.first_name} ${user.last_name}` : 'Logged In'}
            </h3>
            <p
              className="text-gray-500 text-sm"
              style={{ fontFamily: '"Caveat", cursive', fontSize: '1.2rem' }}
            >
              @{user?.username}
            </p>
          </div>
        </div>
        {/* Washi tape accent */}
        <div
          className="absolute -top-3 -left-2 w-12 h-6 pointer-events-none z-10"
          style={{
            background: 'rgba(59, 130, 246, 0.4)',
            transform: 'rotate(-15deg)',
            border: '1px solid rgba(0,0,0,0.05)',
          }}
        />
      </div>
    </div>
  );
};

export const EventManagementHeader = () => {
  const { event, navigate } = useNavbarContext();

  return (
    <div>
      <div className="w-full">
        <div className="mx-auto flex w-full max-w-4xl items-center gap-4 pt-2 pb-3">
          <button
            type="button"
            onClick={() => navigate('/events/' + event?.id + '')}
            className="flex items-center justify-center h-10 w-10 rounded-full bg-white shadow-[2px_2px_0px_#333] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[1px_1px_0px_#333] transition-all relative z-10"
          >
            <ArrowLeft className="h-5 w-5" strokeWidth={3} />
          </button>
          <div>
            <h1
              className="text-3xl text-gray-900"
              style={{
                fontFamily: '"Permanent Marker", cursive',
                transform: 'rotate(-1deg)',
              }}
            >
              {event?.title || 'Host Event Management'}
            </h1>
          </div>
        </div>
      </div>
    </div>
  );
};
