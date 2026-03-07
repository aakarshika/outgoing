import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import * as z from 'zod';

import { authApi } from '@/features/auth/api';
import { useAuth } from '@/features/auth/hooks';

const signupSchema = z.object({
  username: z.string().min(3, 'Username must be at least 3 characters'),
  email: z.string().email('Invalid email address'),
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  phoneNumber: z.string().optional(),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

type SignupValues = z.infer<typeof signupSchema>;

export default function SignUpPage() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const form = useForm<SignupValues>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      username: 'testuser',
      email: 'test@example.com',
      firstName: 'Test',
      lastName: 'User',
      phoneNumber: '555-0199',
      password: 'password123',
    },
  });

  const onSubmit = async (values: SignupValues) => {
    try {
      const res = await authApi.signup({
        username: values.username,
        password: values.password,
        email: values.email,
        first_name: values.firstName,
        last_name: values.lastName,
        phone_number: values.phoneNumber,
      });

      if (res.success) {
        login(res.data.access, res.data.refresh, res.data.user);
        toast.success('Account created successfully!');
        navigate('/');
      }
    } catch (err: unknown) {
      const axiosError = err as { response?: { data?: { message?: string } } };
      const errorMessage = axiosError.response?.data?.message || 'Signup failed';
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
      <div className="w-full max-w-lg relative">
        {/* Washi tape top-left */}
        <div
          className="absolute -top-3 left-[18%] w-28 h-7 z-10 pointer-events-none"
          style={{
            background: 'rgba(244, 114, 182, 0.5)',
            transform: 'rotate(-4deg)',
            border: '1px solid rgba(0,0,0,0.05)',
          }}
        />
        {/* Washi tape top-right */}
        <div
          className="absolute -top-2 right-[12%] w-24 h-6 z-10 pointer-events-none"
          style={{
            background: 'rgba(167, 243, 208, 0.55)',
            transform: 'rotate(6deg)',
            border: '1px solid rgba(0,0,0,0.05)',
          }}
        />

        <div
          className="relative border-2 border-gray-800 bg-white p-8 shadow-[4px_6px_0px_#333]"
          style={{
            backgroundImage: 'linear-gradient(transparent 95%, #e5e7eb 100%)',
            backgroundSize: '100% 32px',
            transform: 'rotate(0.5deg)',
          }}
        >
          {/* Title */}
          <div className="text-center mb-8">
            <h1
              className="text-4xl text-gray-900 mb-2"
              style={{ fontFamily: '"Permanent Marker", cursive' }}
            >
              Sign Up
            </h1>
            <p
              className="text-gray-500"
              style={{ fontFamily: '"Caveat", cursive', fontSize: '1.3rem' }}
            >
              join the party! 🎉
            </p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            {/* First + Last name row */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label
                  className="block font-bold text-gray-700"
                  style={{ fontFamily: '"Caveat", cursive', fontSize: '1.2rem' }}
                >
                  First Name
                </label>
                <input
                  {...register('firstName')}
                  placeholder="John"
                  className={inputClass}
                  style={{ fontFamily: '"Caveat", cursive', fontSize: '1.1rem' }}
                />
                {errors.firstName && (
                  <p className="text-sm text-red-500 mt-1" style={{ fontFamily: '"Caveat", cursive' }}>
                    {errors.firstName.message}
                  </p>
                )}
              </div>
              <div className="space-y-1.5">
                <label
                  className="block font-bold text-gray-700"
                  style={{ fontFamily: '"Caveat", cursive', fontSize: '1.2rem' }}
                >
                  Last Name
                </label>
                <input
                  {...register('lastName')}
                  placeholder="Doe"
                  className={inputClass}
                  style={{ fontFamily: '"Caveat", cursive', fontSize: '1.1rem' }}
                />
                {errors.lastName && (
                  <p className="text-sm text-red-500 mt-1" style={{ fontFamily: '"Caveat", cursive' }}>
                    {errors.lastName.message}
                  </p>
                )}
              </div>
            </div>

            <div className="space-y-1.5">
              <label
                className="block font-bold text-gray-700"
                style={{ fontFamily: '"Caveat", cursive', fontSize: '1.2rem' }}
              >
                Email
              </label>
              <input
                type="email"
                {...register('email')}
                placeholder="m@example.com"
                className={inputClass}
                style={{ fontFamily: '"Caveat", cursive', fontSize: '1.1rem' }}
              />
              {errors.email && (
                <p className="text-sm text-red-500 mt-1" style={{ fontFamily: '"Caveat", cursive' }}>
                  {errors.email.message}
                </p>
              )}
            </div>

            <div className="space-y-1.5">
              <label
                className="block font-bold text-gray-700"
                style={{ fontFamily: '"Caveat", cursive', fontSize: '1.2rem' }}
              >
                Phone Number
              </label>
              <input
                {...register('phoneNumber')}
                placeholder="555-0199"
                className={inputClass}
                style={{ fontFamily: '"Caveat", cursive', fontSize: '1.1rem' }}
              />
            </div>

            <div className="space-y-1.5">
              <label
                className="block font-bold text-gray-700"
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
                className="block font-bold text-gray-700"
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
              className="w-full border-2 border-gray-800 bg-pink-400 px-4 py-3 text-white shadow-[3px_4px_0px_#333] transition-all hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[1px_1px_0px_#333] hover:bg-pink-500 disabled:opacity-60 disabled:cursor-not-allowed"
              style={{ fontFamily: '"Permanent Marker", cursive', fontSize: '1.1rem' }}
            >
              {isSubmitting ? 'Signing up...' : 'Sign Up 🚀'}
            </button>
          </form>

          {/* Footer */}
          <div className="mt-6 text-center">
            <p style={{ fontFamily: '"Caveat", cursive', fontSize: '1.15rem' }} className="text-gray-600">
              Already have an account?{' '}
              <Link
                to="/signin"
                className="font-bold text-blue-500 underline decoration-dashed underline-offset-4 hover:text-blue-600 transition-colors"
              >
                Sign In!
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
