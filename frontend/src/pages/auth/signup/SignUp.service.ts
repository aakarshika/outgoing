import { authApi } from '@/features/auth/api';

export const SignUpService = {
    signup: authApi.signup,
    login: authApi.login,
    getMe: authApi.getMe,
};
