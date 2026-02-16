import { authApi } from '@/features/auth/api';

export const SignInService = {
    signup: authApi.signup,
    login: authApi.login,
    getMe: authApi.getMe,
};
