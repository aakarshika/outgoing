/** React Query hooks for vendors data. */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
    fetchVendorServices,
    fetchMyServices,
    createVendorService,
    updateVendorService,
    deleteVendorService,
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

export function useCreateVendorService() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: createVendorService,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['myServices'] });
            queryClient.invalidateQueries({ queryKey: ['vendors'] });
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
