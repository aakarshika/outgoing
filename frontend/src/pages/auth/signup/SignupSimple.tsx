import { zodResolver } from '@hookform/resolvers/zod';
import ArrowOutwardIcon from '@mui/icons-material/ArrowOutward';
import HandshakeOutlinedIcon from '@mui/icons-material/HandshakeOutlined';
import LocalActivityOutlinedIcon from '@mui/icons-material/LocalActivityOutlined';
import VolunteerActivismOutlinedIcon from '@mui/icons-material/VolunteerActivismOutlined';
import {
  Box,
  Button,
  CircularProgress,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import * as z from 'zod';

import { authApi } from '@/features/auth/api';
import { useAuth } from '@/features/auth/hooks';
import {
  authFieldSx,
  AuthSimpleLayout,
} from '@/pages/auth/components/AuthSimpleLayout';

const signupSchema = z.object({
  username: z.string().min(3, 'Username must be at least 3 characters'),
  email: z.string().email('Invalid email address'),
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  phoneNumber: z.string().optional(),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

type SignupValues = z.infer<typeof signupSchema>;

export default function SignupSimple() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const form = useForm<SignupValues>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      username: 'shika_a',
      email: 'shika_a@outgoing.com',
      firstName: 'Shika',
      lastName: 'Artist',
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

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = form;

  return (
    <AuthSimpleLayout
      mode="signup"
      heroEyebrow="Join free"
      heroTitle={
        <>
          Meet people by
          <br />
          showing up for things.
        </>
      }
      heroDescription="Create your account to find events, join communities, and step into contributor roles that turn attendance into connection."
      heroChips={[
        'Discover nearby plans',
        'Follow groups and hosts',
        'Claim contributor spots',
      ]}
      highlights={[]}
      stats={[
        { value: 'Free', label: 'to join and explore' },
        { value: '4 ways', label: 'to show up and participate' },
        { value: '1 profile', label: 'for events, groups, and hosts' },
      ]}
      formEyebrow="Create account"
      formTitle="Sign up for "
      formDescription="Set up your account once, then use it to RSVP, message, contribute, and keep track of the events that matter."
      alternatePrompt="Already have an account?"
      alternateLinkLabel="Log in instead"
      alternateLinkTo="/signin"
    >
      <Box component="form" noValidate onSubmit={handleSubmit(onSubmit)}>
        <Stack spacing={2}>

          <TextField
            label="Email"
            type="email"
            autoComplete="email"
            fullWidth
            {...register('email')}
            error={!!errors.email}
            helperText={errors.email?.message}
            sx={authFieldSx}
          />
          <TextField
            label="Username"
            autoComplete="username"
            fullWidth
            {...register('username')}
            error={!!errors.username}
            helperText={errors.username?.message}
            sx={authFieldSx}
          />
          <TextField
            label="Password"
            type="password"
            autoComplete="new-password"
            fullWidth
            {...register('password')}
            error={!!errors.password}
            helperText={errors.password?.message}
            sx={authFieldSx}
          />

          <Button
            type="submit"
            variant="contained"
            disabled={isSubmitting}
            endIcon={
              isSubmitting ? (
                <CircularProgress size={18} sx={{ color: '#fff' }} />
              ) : (
                <ArrowOutwardIcon />
              )
            }
            sx={{
              mt: 0.5,
              minHeight: 56,
              borderRadius: '18px',
              textTransform: 'none',
              fontSize: 16,
              fontWeight: 700,
              background: '#D85A30',
              boxShadow: 'none',
            }}
          >
            {isSubmitting ? 'Creating account...' : 'Create account'}
          </Button>
        </Stack>

      </Box>
    </AuthSimpleLayout>
  );
}
