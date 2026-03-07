import {
  Box,
  IconButton,
  Modal,
  Paper,
  ThemeProvider,
  Typography,
} from '@mui/material';
import { DollarSign, Send, X } from 'lucide-react';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';

import { scrapbookTheme } from '@/features/events/theme/scrapbookTheme';
import { useUpdateNeedApplication } from '@/features/needs/hooks';
import { useMyServices } from '@/features/vendors/hooks';

interface EditApplicationFormData {
  message: string;
  proposed_price: string;
  service_id: string;
}

interface EditApplicationModalProps {
  open: boolean;
  onClose: () => void;
  application: any;
}

const WashiTape = ({
  color = 'rgba(251, 191, 36, 0.5)',
  rotate = '3deg',
  width = 80,
}: {
  color?: string;
  rotate?: string;
  width?: number;
}) => (
  <Box
    sx={{
      position: 'absolute',
      top: -10,
      left: '50%',
      transform: `translateX(-50%) rotate(${rotate})`,
      width,
      height: 20,
      bgcolor: color,
      opacity: 0.8,
      zIndex: 2,
      boxShadow: '0 1px 2px rgba(0,0,0,0.1)',
      pointerEvents: 'none',
    }}
  />
);

export function EditApplicationModal({
  open,
  onClose,
  application,
}: EditApplicationModalProps) {
  const { data: servicesRes } = useMyServices();
  const services = servicesRes?.data || [];
  const updateMutation = useUpdateNeedApplication();

  const { register, handleSubmit, reset } = useForm<EditApplicationFormData>();

  useEffect(() => {
    if (application) {
      reset({
        message: application.message || '',
        proposed_price: application.proposed_price?.toString() || '',
        service_id: application.service?.toString() || '',
      });
    }
  }, [application, reset]);

  const onSubmit = (data: EditApplicationFormData) => {
    if (!application) return;

    const payload = {
      message: data.message,
      proposed_price: data.proposed_price ? parseFloat(data.proposed_price) : null,
      service_id: data.service_id ? parseInt(data.service_id, 10) : null,
    };

    updateMutation.mutate(
      { applicationId: application.id, payload },
      {
        onSuccess: () => {
          toast.success('Application updated successfully! 🎉');
          onClose();
        },
        onError: (error: any) => {
          const message =
            error?.response?.data?.message || 'Failed to update application';
          toast.error(message);
        },
      },
    );
  };

  if (!application) return null;

  return (
    <ThemeProvider theme={scrapbookTheme}>
      <Modal
        open={open}
        onClose={onClose}
        aria-labelledby="edit-application-modal"
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          p: 2,
          backdropFilter: 'blur(3px)',
        }}
      >
        <Paper
          elevation={0}
          sx={{
            width: '100%',
            maxWidth: 500,
            position: 'relative',
            bgcolor: '#fdfdfd',
            p: { xs: 3, sm: 4 },
            maxHeight: '90vh',
            overflowY: 'auto',
            border: '2px solid #333',
            boxShadow: '4px 6px 0px #333',
            backgroundImage:
              'linear-gradient(to right, rgba(0,0,0,0.02) 1px, transparent 1px)',
            backgroundSize: '20px 20px',
            transform: 'rotate(-0.5deg)',
            '&:focus': { outline: 'none' },
          }}
        >
          <WashiTape color="rgba(239, 68, 68, 0.4)" rotate="-2deg" width={100} />

          <IconButton
            onClick={onClose}
            sx={{
              position: 'absolute',
              top: 8,
              right: 8,
              color: '#666',
              '&:hover': {
                color: '#000',
                transform: 'rotate(90deg)',
                bgcolor: 'transparent',
              },
              transition: 'all 0.2s',
            }}
          >
            <X className="h-5 w-5" />
          </IconButton>

          <Typography
            id="edit-application-modal"
            sx={{
              fontFamily: '"Permanent Marker", cursive',
              fontSize: '1.6rem',
              mb: 1,
              color: '#111',
              transform: 'rotate(-1deg)',
            }}
          >
            Edit Application
          </Typography>

          <Typography
            sx={{
              fontFamily: '"Caveat", cursive',
              fontSize: '1.2rem',
              mb: 4,
              color: '#555',
              lineHeight: 1.3,
            }}
          >
            Update your proposal for{' '}
            <strong style={{ color: '#000' }}>{application.event_title}</strong>
          </Typography>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5 relative z-10">
            {/* Select Service Component */}
            <Box
              sx={{
                p: 2,
                border: '1px dashed #ccc',
                bgcolor: '#fff',
                transform: 'rotate(0.5deg)',
              }}
            >
              <label className="block text-xs font-bold tracking-wider text-gray-500 uppercase mb-2 font-mono">
                Select Service (Optional)
              </label>
              <select
                {...register('service_id')}
                className="w-full bg-transparent border-b-2 border-gray-300 pb-2 focus:outline-none focus:border-blue-500 transition-colors"
                style={{
                  fontFamily: '"Caveat", cursive',
                  fontSize: '1.2rem',
                  color: '#333',
                  cursor: 'pointer',
                }}
              >
                <option value="">Draft a custom proposal</option>
                {services.map((svc: any) => (
                  <option key={svc.id} value={svc.id}>
                    {svc.title}
                  </option>
                ))}
              </select>
            </Box>

            {/* Proposed Price Component */}
            <Box
              sx={{
                p: 2,
                border: '1px dashed #ccc',
                bgcolor: '#fff',
                transform: 'rotate(-0.5deg)',
              }}
            >
              <label className="block text-xs font-bold tracking-wider text-gray-500 uppercase mb-2 font-mono">
                Proposed Price (Optional)
              </label>
              <Box sx={{ position: 'relative' }}>
                <DollarSign className="absolute left-0 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  {...register('proposed_price')}
                  type="number"
                  step="0.01"
                  placeholder="e.g. 150.00"
                  className="w-full bg-transparent border-b-2 border-gray-300 pb-2 pl-7 focus:outline-none focus:border-blue-500 transition-colors"
                  style={{
                    fontFamily: '"Caveat", cursive',
                    fontSize: '1.2rem',
                    color: '#333',
                  }}
                />
              </Box>
            </Box>

            {/* Message Component */}
            <Box
              sx={{
                p: 2,
                border: '1px dashed #ccc',
                bgcolor: '#fff',
                transform: 'rotate(0.2deg)',
              }}
            >
              <label className="block text-xs font-bold tracking-wider text-gray-500 uppercase mb-2 font-mono">
                Your Message *
              </label>
              <textarea
                {...register('message', { required: true })}
                rows={4}
                placeholder="Write a compelling message about why you are a great fit..."
                className="w-full bg-transparent border-b-2 border-gray-300 pb-2 focus:outline-none focus:border-blue-500 transition-colors resize-none"
                style={{
                  fontFamily: '"Caveat", cursive',
                  fontSize: '1.2rem',
                  color: '#333',
                }}
              />
            </Box>

            {/* Submit Button */}
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 4 }}>
              <button
                type="submit"
                disabled={updateMutation.isPending}
                className="inline-flex items-center gap-2 border-2 border-gray-800 bg-blue-400 px-6 py-2.5 text-white shadow-[2px_3px_0px_#333] transition-all hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[1px_1px_0px_#333] hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                style={{
                  fontFamily: '"Permanent Marker"',
                  fontSize: '1rem',
                  transform: 'rotate(-1deg)',
                }}
              >
                {updateMutation.isPending ? 'Updating...' : 'Save Changes'}
                {!updateMutation.isPending && <Send className="h-4 w-4" />}
              </button>
            </Box>
          </form>
        </Paper>
      </Modal>
    </ThemeProvider>
  );
}
