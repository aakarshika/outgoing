import client from '@/api/client';
import { ApiResponse } from '@/types/api';

import { UserRole } from '@/types/roles';

export interface User {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  role: UserRole;
  phone_number?: string;
}

export interface AuthResponse {
  user: User;
  access: string;
  refresh: string;
}

export const authApi = {
  signup: async (data: {
    username: string;
    password?: string;
    email?: string;
    first_name?: string;
    last_name?: string;
    phone_number?: string;
  }): Promise<ApiResponse<AuthResponse>> => {
    const res = await client.post('/auth/signup/', data);
    return res.data;
  },

  login: async (data: {
    username: string;
    password?: string;
  }): Promise<ApiResponse<AuthResponse>> => {
    const res = await client.post('/auth/signin/', data);
    return res.data;
  },

  getMe: async (): Promise<ApiResponse<User>> => {
    const res = await client.get('/auth/me/');
    return res.data;
  },
};
