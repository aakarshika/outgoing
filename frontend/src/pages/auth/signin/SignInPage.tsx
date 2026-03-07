import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import * as z from 'zod';

import { authApi } from '@/features/auth/api';
import { useAuth } from '@/features/auth/hooks';

const loginSchema = z.object({
  username: z.string().min(1, 'Username is required'),
  password: z.string().min(1, 'Password is required'),
});

type LoginValues = z.infer<typeof loginSchema>;

export default function SignInPage() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const form = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: 'testuser',
      password: 'password123',
    },
  });

  const onSubmit = async (values: LoginValues) => {
    try {
      const res = await authApi.login({
        username: values.username,
        password: values.password,
      });

      if (res.success) {
        login(res.data.access, res.data.refresh, res.data.user);
        toast.success('Welcome back!');
        navigate('/');
      }
    } catch (err: unknown) {
      const axiosError = err as { response?: { data?: { message?: string } } };
      const errorMessage = axiosError.response?.data?.message || 'Login failed';
      toast.error(errorMessage);
    }
  };

  const inputClass =
    'w-full border-2 border-gray-800 bg-white px-4 py-2.5 text-base outline-none shadow-[2px_3px_0px_#333] transition-all focus:translate-x-[1px] focus:translate-y-[1px] focus:shadow-[1px_1px_0px_#333] focus:ring-0 placeholder:text-gray-400';

  const { register, handleSubmit, formState: { errors, isSubmitting } } = form;

  return (
    <div
      className="flex min-h-screen items-center justify-center px-4 py-12 sm:px-6 lg:px-8"
      style={{
        background: '#f4f1ea',
        backgroundImage: 'radial-gradient(#d1d5db 0.5px, transparent 0.5px)',
        backgroundSize: '15px 15px',
      }}
    >
      <div className="w-full max-w-md relative">
        {/* Washi tape top */}
        <div
          className="absolute -top-3 left-1/4 w-28 h-7 z-10 pointer-events-none"
          style={{
            background: 'rgba(96, 165, 250, 0.5)',
            transform: 'rotate(-3deg)',
            border: '1px solid rgba(0,0,0,0.05)',
          }}
        />
        {/* Washi tape right */}
        <div
          className="absolute -top-2 right-[15%] w-24 h-6 z-10 pointer-events-none"
          style={{
            background: 'rgba(251, 191, 36, 0.45)',
            transform: 'rotate(5deg)',
            border: '1px solid rgba(0,0,0,0.05)',
          }}
        />

        <div
          className="relative border-2 border-gray-800 bg-white p-8 shadow-[4px_6px_0px_#333]"
          style={{
            backgroundImage: 'linear-gradient(transparent 95%, #e5e7eb 100%)',
            backgroundSize: '100% 32px',
            transform: 'rotate(-0.5deg)',
          }}
        >
          {/* Title */}
          <div className="text-center mb-8">
            <h1
              className="text-4xl text-gray-900 mb-2"
              style={{ fontFamily: '"Permanent Marker", cursive' }}
            >
              Sign In
            </h1>
            <p
              className="text-lg text-gray-500"
              style={{ fontFamily: '"Caveat", cursive', fontSize: '1.3rem' }}
            >
              welcome back, friend! ✌️
            </p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div className="space-y-1.5">
              <label
                className="block text-base font-bold text-gray-700"
                style={{ fontFamily: '"Caveat", cursive', fontSize: '1.2rem' }}
              >
                Username
              </label>
              <input
                {...register('username')}
                placeholder="johndoe"
                className={inputClass}
                style={{ fontFamily: '"Caveat", cursive', fontSize: '1.1rem' }}
              />
              {errors.username && (
                <p className="text-sm text-red-500 mt-1" style={{ fontFamily: '"Caveat", cursive' }}>
                  {errors.username.message}
                </p>
              )}
            </div>

            <div className="space-y-1.5">
              <label
                className="block text-base font-bold text-gray-700"
                style={{ fontFamily: '"Caveat", cursive', fontSize: '1.2rem' }}
              >
                Password
              </label>
              <input
                type="password"
                {...register('password')}
                className={inputClass}
                style={{ fontFamily: '"Caveat", cursive', fontSize: '1.1rem' }}
              />
              {errors.password && (
                <p className="text-sm text-red-500 mt-1" style={{ fontFamily: '"Caveat", cursive' }}>
                  {errors.password.message}
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full border-2 border-gray-800 bg-blue-400 px-4 py-3 text-white shadow-[3px_4px_0px_#333] transition-all hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[1px_1px_0px_#333] hover:bg-blue-500 disabled:opacity-60 disabled:cursor-not-allowed"
              style={{ fontFamily: '"Permanent Marker", cursive', fontSize: '1.1rem' }}
            >
              {isSubmitting ? 'Signing in...' : 'Sign In ✨'}
            </button>
          </form>

          {/* Footer */}
          <div className="mt-6 text-center">
            <p style={{ fontFamily: '"Caveat", cursive', fontSize: '1.15rem' }} className="text-gray-600">
              Don't have an account?{' '}
              <Link
                to="/signup"
                className="font-bold text-pink-500 underline decoration-dashed underline-offset-4 hover:text-pink-600 transition-colors"
              >
                Sign Up!
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
