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
  openEditService: (service: VendorService) => void;
  closeQuickCreateService: () => void;
  editingService: VendorService | null;
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
  const [editingService, setEditingService] = useState<VendorService | null>(null);

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
    setEditingService(null);
    setIsQuickCreateServiceOpen(true);
  }, []);

  const openEditService = useCallback((service: VendorService) => {
    setEditingService(service);
    setQuickCreateServiceCategory(service.category || '');
    setIsQuickCreateServiceOpen(true);
  }, []);

  const closeQuickCreateService = useCallback(() => {
    setIsQuickCreateServiceOpen(false);
    setQuickCreateServiceCategory('');
    setEditingService(null);
  }, []);

  const value = useMemo(
    () => ({
      services,
      isLoading,
      getMatchingService,
      hasMatchingService,
      openQuickCreateService,
      openEditService,
      closeQuickCreateService,
      editingService,
    }),
    [
      services,
      isLoading,
      getMatchingService,
      hasMatchingService,
      openQuickCreateService,
      openEditService,
      closeQuickCreateService,
      editingService,
    ],
  );

  return (
    <ServicesContext.Provider value={value}>
      {children}
      <QuickCreateServiceDialog
        open={isQuickCreateServiceOpen}
        service={editingService}
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
