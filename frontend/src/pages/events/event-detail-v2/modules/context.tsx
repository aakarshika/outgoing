import { createContext, useContext } from 'react';

import type { EventDetailV2ViewModel, ThemeVariant } from './shared/types';

export const EventDetailV2Context = createContext<EventDetailV2ViewModel | null>(null);

export const useEventDetailV2 = () => {
  const context = useContext(EventDetailV2Context);
  if (!context) {
    throw new Error('useEventDetailV2 must be used within EventDetailV2Provider');
  }
  return context;
};

export const EventDetailV2Provider = EventDetailV2Context.Provider;
