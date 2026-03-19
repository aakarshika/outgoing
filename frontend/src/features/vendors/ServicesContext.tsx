import { createContext, type ReactNode, useCallback, useContext, useMemo, useState } from 'react';

import { QuickCreateServiceDialog } from '@/components/vendors/QuickCreateServiceDialog';
import { useAuth } from '@/features/auth/hooks';
import type { VendorService } from '@/types/vendors';

import { useMyServices } from './hooks';

type ServicesContextValue = {
  services: VendorService[];
  isLoading: boolean;
  getMatchingService: (category?: string | null) => VendorService | null;
  hasMatchingService: (category?: string | null) => boolean;
  openQuickCreateService: (category?: string) => void;
  closeQuickCreateService: () => void;
};

const ServicesContext = createContext<ServicesContextValue | undefined>(undefined);

export function ServicesProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useAuth();
  const { data: myServicesResponse, isLoading } = useMyServices({
    enabled: isAuthenticated,
  });
  const services = useMemo(() => myServicesResponse?.data || [], [myServicesResponse]);
  const [isQuickCreateServiceOpen, setIsQuickCreateServiceOpen] = useState(false);
  const [quickCreateServiceCategory, setQuickCreateServiceCategory] = useState('');

  const getMatchingService = useCallback(
    (category?: string | null) =>
      services.find((service) => service.category === category) || null,
    [services],
  );

  const hasMatchingService = useCallback(
    (category?: string | null) => Boolean(getMatchingService(category)),
    [getMatchingService],
  );

  const openQuickCreateService = useCallback((category?: string) => {
    setQuickCreateServiceCategory(category || '');
    setIsQuickCreateServiceOpen(true);
  }, []);

  const closeQuickCreateService = useCallback(() => {
    setIsQuickCreateServiceOpen(false);
    setQuickCreateServiceCategory('');
  }, []);

  const value = useMemo(
    () => ({
      services,
      isLoading,
      getMatchingService,
      hasMatchingService,
      openQuickCreateService,
      closeQuickCreateService,
    }),
    [
      services,
      isLoading,
      getMatchingService,
      hasMatchingService,
      openQuickCreateService,
      closeQuickCreateService,
    ],
  );

  return (
    <ServicesContext.Provider value={value}>
      {children}
      <QuickCreateServiceDialog
        open={isQuickCreateServiceOpen}
        defaultCategory={quickCreateServiceCategory}
        onClose={closeQuickCreateService}
      />
    </ServicesContext.Provider>
  );
}

export function useServices() {
  const context = useContext(ServicesContext);
  if (!context) {
    throw new Error('useServices must be used within a ServicesProvider');
  }
  return context;
}
