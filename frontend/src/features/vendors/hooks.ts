/** React Query hooks for vendors data. */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import {
  createVendorService,
  deleteVendorService,
  fetchMyServices,
  fetchVendorService,
  fetchVendorServices,
  updateVendorService,
} from './api';

export function useVendorServices(params: {
  category?: string;
  city?: string;
  vendor_id?: number;
  page?: number;
  page_size?: number;
}) {
  return useQuery({
    queryKey: ['vendors', params],
    queryFn: () => fetchVendorServices(params),
  });
}

export function useMyServices(options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: ['myServices'],
    queryFn: fetchMyServices,
    enabled: options?.enabled,
  });
}

export function useVendorService(serviceId: number) {
  return useQuery({
    queryKey: ['vendors', serviceId],
    queryFn: () => fetchVendorService(serviceId),
    enabled: !!serviceId,
  });
}

export function useCreateVendorService() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createVendorService,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['myServices'] });
      queryClient.invalidateQueries({ queryKey: ['vendors'] });
      queryClient.invalidateQueries({ queryKey: ['myVendorOpportunities'] });
      queryClient.invalidateQueries({ queryKey: ['myPotentialOpportunities'] });
      queryClient.invalidateQueries({ queryKey: ['search'] });
      queryClient.invalidateQueries({ queryKey: ['my-home'] });
      queryClient.invalidateQueries({
        queryKey: ['eventCardAllNeeds', 'matchedOpportunities'],
      });
    },
  });
}

export function useUpdateVendorService() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, formData }: { id: number; formData: FormData }) =>
      updateVendorService(id, formData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['myServices'] });
      queryClient.invalidateQueries({ queryKey: ['vendors'] });
    },
  });
}

export function useDeleteVendorService() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteVendorService,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['myServices'] });
      queryClient.invalidateQueries({ queryKey: ['vendors'] });
    },
  });
}
