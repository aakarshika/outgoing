/** API functions for the vendors domain. */

import client from '@/api/client';
import type {
  VendorServiceDetailResponse,
  VendorServiceListResponse,
} from '@/types/vendors';

export async function fetchVendorServices(params: {
  category?: string;
  city?: string;
  vendor_id?: number;
  page?: number;
  page_size?: number;
}) {
  const { data } = await client.get<VendorServiceListResponse>('/vendors/', { params });
  return data;
}

export async function fetchMyServices() {
  const { data } = await client.get<VendorServiceListResponse>('/vendors/my/');
  return data;
}

export async function createVendorService(formData: FormData) {
  const { data } = await client.post<VendorServiceDetailResponse>(
    '/vendors/',
    formData,
    {
      headers: { 'Content-Type': 'multipart/form-data' },
    },
  );
  return data;
}

export async function updateVendorService(serviceId: number, formData: FormData) {
  const { data } = await client.patch<VendorServiceDetailResponse>(
    `/vendors/${serviceId}/`,
    formData,
    {
      headers: { 'Content-Type': 'multipart/form-data' },
    },
  );
  return data;
}

export async function fetchVendorService(serviceId: number) {
  const { data } = await client.get<VendorServiceDetailResponse>(
    `/vendors/${serviceId}/`,
  );
  return data;
}

export async function deleteVendorService(serviceId: number) {
  const { data } = await client.delete(`/vendors/${serviceId}/`);
  return data;
}
