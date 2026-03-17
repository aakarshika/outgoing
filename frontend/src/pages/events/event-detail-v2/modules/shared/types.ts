import type { UseMutationResult } from '@tanstack/react-query';
import type { ReactNode } from 'react';

export type ThemeVariant = 'comic' | 'normal';

export interface EventDetailV2ViewModel {
  event: any;
  user: any;
  isHost: boolean;
  isAuthenticated: boolean;
  isEventOver: boolean;
  canAccessEventChat: boolean;
  highlights: any[];
  reviews: any[];
  occurrences: any[];
  displayNeeds: any[];
  displayNeedsCount: number;
  myServicesResponse: any;
  purchaseTicket: UseMutationResult<any, any, any, any>;
  clearTicketformTrigger: number;
  handleBuyTicket: (tierId: number, quantity: number) => void;
  handleBuyMultiple: (selections: Array<{ tierId: number; quantity: number }>) => void;
  handleOneClickBuy: (tierId: number, quantity: number) => void;
  deleteReview: UseMutationResult<any, any, any, any>;
  themeVariant: ThemeVariant;
}

export interface ModuleProps {
  className?: string;
}

export interface TitleModuleProps extends ModuleProps {
  event: any;
  isHost: boolean;
}

export interface CoverPhotoModuleProps extends ModuleProps {
  event: any;
}

export interface DescriptionModuleProps extends ModuleProps {
  event: any;
}

export interface HighlightsModuleProps extends ModuleProps {
  event: any;
  highlights: any[];
  canAccessEventChat: boolean;
}

export interface CalendarMapModuleProps extends ModuleProps {
  event: any;
  occurrences: any[];
}

export interface StatusModuleProps extends ModuleProps {
  event: any;
  isHost: boolean;
}

export interface SaveTheDateModuleProps extends ModuleProps {
  event: any;
  isAuthenticated: boolean;
}

export interface TicketsModuleProps extends ModuleProps {
  event: any;
  purchaseTicket: UseMutationResult<any, any, any, any>;
  clearTicketformTrigger: number;
  handleBuyTicket: (tierId: number, quantity: number) => void;
  handleBuyMultiple: (selections: Array<{ tierId: number; quantity: number }>) => void;
  handleOneClickBuy: (tierId: number, quantity: number) => void;
}

export interface ServicesModuleProps extends ModuleProps {
  event: any;
  displayNeeds: any[];
  myServicesResponse: any;
  isAuthenticated: boolean;
}

export interface GoersModuleProps extends ModuleProps {
  event: any;
  isEventOver: boolean;
}

export interface GroupChatModuleProps extends ModuleProps {
  event: any;
  canAccessEventChat: boolean;
}

export interface ReviewsModuleProps extends ModuleProps {
  event: any;
  reviews: any[];
  isHost: boolean;
  user: any;
}

export interface BrowseMoreModuleProps extends ModuleProps {}

export interface HeroModuleProps extends ModuleProps {
  event: any;
  isHost: boolean;
  highlights: any[];
  occurrences: any[];
  displayNeedsCount: number;
  displayNeeds: any[];
}

export interface ModulesConfig {
  hero?: ReactNode;
  coverPhoto?: ReactNode;
  title?: ReactNode;
  description?: ReactNode;
  calendarMap?: ReactNode;
  status?: ReactNode;
  saveTheDate?: ReactNode;
  tickets?: ReactNode;
  services?: ReactNode;
  goers?: ReactNode;
  groupChat?: ReactNode;
  highlights?: ReactNode;
  reviews?: ReactNode;
  browseMore?: ReactNode;
}
