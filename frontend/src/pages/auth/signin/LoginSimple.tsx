import { zodResolver } from '@hookform/resolvers/zod';
import ArrowOutwardIcon from '@mui/icons-material/ArrowOutward';
import CelebrationOutlinedIcon from '@mui/icons-material/CelebrationOutlined';
import GroupsOutlinedIcon from '@mui/icons-material/GroupsOutlined';
import TravelExploreOutlinedIcon from '@mui/icons-material/TravelExploreOutlined';
import {
  Box,
  Button,
  CircularProgress,
  Divider,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { useForm } from 'react-hook-form';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import * as z from 'zod';

import { authApi } from '@/features/auth/api';
import { useAuth } from '@/features/auth/hooks';
import {
  authFieldSx,
  AuthSimpleLayout,
} from '@/pages/auth/components/AuthSimpleLayout';

const loginSchema = z.object({
  username: z.string().min(1, 'Username is required'),
  password: z.string().min(1, 'Password is required'),
});

type LoginValues = z.infer<typeof loginSchema>;

export default function LoginSimple() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const form = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: 'shika_a',
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

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = form;

  return (
    <AuthSimpleLayout
      mode="signin"
      heroEyebrow="Welcome back"
      heroTitle={
        <>
          Pick up where
          <br />
          your plans left off.
        </>
      }
      heroDescription="Jump back into local plans, contributor roles, and conversations already in motion. Outgoing keeps your events, hosts, and people in one place."
      heroChips={['RSVP faster', 'Track your crew', 'Manage contributor roles']}
      highlights={[
        {
          icon: <TravelExploreOutlinedIcon sx={{ fontSize: 22 }} />,
          title: 'See what is happening tonight',
          description:
            'Your saved interests and nearby events are ready the moment you log in.',
        },
        {
          icon: <GroupsOutlinedIcon sx={{ fontSize: 22 }} />,
          title: 'Keep your people close',
          description:
            'Reconnect with hosts, groups, and regulars without rebuilding your network.',
        },
        {
          icon: <CelebrationOutlinedIcon sx={{ fontSize: 22 }} />,
          title: 'Jump back into events',
          description:
            'Tickets, plans, and contributor details stay tied to your account.',
        },
      ]}
      stats={[
        { value: '2.4k+', label: 'events ready to browse' },
        { value: '640+', label: 'open contributor spots' },
        { value: '1 place', label: 'for your plans and people' },
      ]}
      formEyebrow="Log in"
      formTitle="Sign in to your Outgoing account"
      formDescription="Use your existing account to browse events, manage tickets, and keep conversations moving."
      alternatePrompt="New here?"
      alternateLinkLabel="Create an account"
      alternateLinkTo="/signup"
    >
      <Box component="form" noValidate onSubmit={handleSubmit(onSubmit)}>
        <Stack spacing={2}>
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
            autoComplete="current-password"
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
            {isSubmitting ? 'Signing in...' : 'Sign in'}
          </Button>
        </Stack>

        <Divider sx={{ my: 3, color: 'var(--color-text-secondary)', fontSize: 13 }}>
          or
        </Divider>

        <Stack spacing={1.5}>
          <Button
            component={RouterLink}
            to="/search"
            variant="outlined"
            fullWidth
            sx={{
              minHeight: 52,
              borderRadius: '18px',
              textTransform: 'none',
              color: 'var(--color-text-primary)',
              borderColor: 'var(--color-border-secondary)',
            }}
          >
            Browse events as a guest
          </Button>

          <Typography
            sx={{
              textAlign: 'center',
              color: 'var(--color-text-secondary)',
              fontSize: 13,
            }}
          >
            Hosts, tickets, and contributor tools unlock after login.
          </Typography>
        </Stack>
      </Box>
    </AuthSimpleLayout>
  );
}
