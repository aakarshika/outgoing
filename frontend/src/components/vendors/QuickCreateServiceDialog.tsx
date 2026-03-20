import {
  Box,
  Button as MuiButton,
  CircularProgress,
  Dialog,
  DialogContent,
  MenuItem,
  Stack,
  TextField,
  Typography,
  useMediaQuery,
} from '@mui/material';
import { useQueryClient } from '@tanstack/react-query';
import { ImagePlus, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { toast } from 'sonner';

import { VENDOR_CATEGORIES } from '@/constants/categories';
import { useAuth } from '@/features/auth/AuthContext';
import { useCreateVendorService, useUpdateVendorService } from '@/features/vendors/hooks';
import type { VendorService } from '@/types/vendors';
import { compressImage } from '@/utils/image';

type QuickCreateServiceFormData = {
  title: string;
  description: string;
  category: string;
  base_price: string;
  travel_radius_miles: string;
  portfolio_url: string;
};

const fieldSx = {
  '& .MuiOutlinedInput-root': {
    borderRadius: '18px',
    background: '#fff',
    '& fieldset': {
      borderColor: 'rgba(143, 105, 66, 0.18)',
    },
    '&:hover fieldset': {
      borderColor: 'rgba(216, 90, 48, 0.42)',
    },
    '&.Mui-focused fieldset': {
      borderColor: '#D85A30',
    },
  },
} as const;

export function QuickCreateServiceDialog({
  open,
  onClose,
  defaultCategory = '',
  service = null,
}: {
  open: boolean;
  onClose: () => void;
  defaultCategory?: string;
  service?: VendorService | null;
}) {
  const isMobile = useMediaQuery('(max-width:767px)');
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const createMutation = useCreateVendorService();
  const updateMutation = useUpdateVendorService();
  const isEdit = !!service;
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const {
    register,
    handleSubmit,
    reset,
    control,
    watch,
    formState: { errors },
  } = useForm<QuickCreateServiceFormData>({
    defaultValues: {
      title: service?.title || '',
      description: service?.description || '',
      category: service?.category || defaultCategory,
      base_price: service?.base_price || '',
      travel_radius_miles: service?.travel_radius_miles || '',
      portfolio_url: service?.portfolio_url || '',
    },
  });

  useEffect(() => {
    if (!open) return;
    reset({
      title: service?.title || '',
      description: service?.description || '',
      category: service?.category || defaultCategory,
      base_price: service?.base_price || '',
      travel_radius_miles: service?.travel_radius_miles || '',
      portfolio_url: service?.portfolio_url || '',
    });
    setImagePreview(service?.portfolio_image || null);
    setSelectedImage(null);
  }, [defaultCategory, open, reset, service]);

  const watchedCategory = watch('category');
  const categorySelected = VENDOR_CATEGORIES.flatMap((g) => g.items).find(
    (item) => item.id === watchedCategory,
  );

  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setSelectedImage(file);
    const reader = new FileReader();
    reader.onloadend = () => setImagePreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  const onSubmit = async (data: QuickCreateServiceFormData) => {
    const formData = new FormData();
    formData.append('title', data.title.trim());
    formData.append('description', data.description.trim());
    formData.append('category', data.category);

    if (data.base_price.trim()) {
      formData.append('base_price', data.base_price.trim());
    }
    if (data.travel_radius_miles.trim()) {
      formData.append('travel_radius_miles', data.travel_radius_miles.trim());
    }
    if (data.portfolio_url.trim()) {
      formData.append('portfolio_url', data.portfolio_url.trim());
    }

    if (selectedImage) {
      try {
        const compressedFile = await compressImage(selectedImage, {
          newFileName: 'portfolio_image',
        });
        formData.append('portfolio_image', compressedFile);
      } catch (error) {
        console.error('Image compression failed', error);
        formData.append('portfolio_image', selectedImage);
      }
    }

    try {
      if (isEdit && service) {
        await updateMutation.mutateAsync({ id: service.id, formData });
        toast.success('Service updated');
      } else {
        await createMutation.mutateAsync(formData);
        toast.success('Service created');
      }
      await queryClient.invalidateQueries({ queryKey: ['search'] });
      onClose();
    } catch (error: any) {
      const message = error?.response?.data?.message || `Failed to ${isEdit ? 'update' : 'create'} service`;
      toast.error(message);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={createMutation.isPending ? undefined : onClose}
      fullScreen={isMobile}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: isMobile ? 0 : '28px',
          overflow: 'hidden',
        },
      }}
    >
      <DialogContent
        sx={{
          p: 0,
          overflow: 'auto',
          background:
            'radial-gradient(circle at top left, rgba(255, 216, 173, 0.48), transparent 30%), linear-gradient(180deg, #FFF7EE 0%, #FFFDF9 38%, #F7F1FF 100%)',
          color: '#2B2118',
        }}
      >
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            px: { xs: 2, sm: 3 },
            pt: 2.5,
            pb: 1.5,
            borderBottom: '1px solid rgba(143, 105, 66, 0.12)',
          }}
        >
          <Box>
            <Typography
              sx={{
                fontSize: 12,
                fontWeight: 800,
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
                color: 'rgba(66, 50, 28, 0.56)',
              }}
            >
              {isEdit ? 'Edit your service' : 'List your service'}
            </Typography>
            <Typography
              sx={{
                mt: 0.5,
                fontFamily: 'Syne, sans-serif',
                fontSize: { xs: 24, sm: 30 },
                fontWeight: 800,
                letterSpacing: '-0.04em',
                color: '#2B2118',
                lineHeight: 1.1,
              }}
            >
              {isEdit ? 'Update your service details' : 'Any talent or equipment you would like to offer?'}
            </Typography>
            <Typography
              sx={{
                display: 'inline-flex',
                alignItems: 'center',
                mt: 1.25,
                px: 1.25,
                py: 0.5,
                borderRadius: '999px',
                backgroundColor: 'rgba(216, 90, 48, 0.1)',
                color: '#B04A27',
                fontSize: 12,
                fontWeight: 700,
                letterSpacing: '0.01em',
              }}
            >
              All skill levels welcome — from beginner to pro.<br></br> Help your
              community grow, and receieve self-growth, discounts, or money!
            </Typography>
          </Box>
          <MuiButton
            type="button"
            onClick={onClose}
            disabled={createMutation.isPending}
            sx={{
              minWidth: 0,
              width: 42,
              height: 42,
              borderRadius: '999px',
              color: '#2B2118',
            }}
            aria-label="Close service quick create"
          >
            <X size={18} />
          </MuiButton>
        </Box>

        <Box
          component="form"
          onSubmit={handleSubmit(onSubmit)}
          sx={{
            px: { xs: 2, sm: 3 },
            py: 2.5,
          }}
        >
          <Stack spacing={2.2}>
            <Controller
              name="category"
              control={control}
              rules={{ required: 'Category is required' }}
              render={({ field }) => (
                <TextField
                  label="Service Type"
                  select
                  fullWidth
                  required
                  error={!!errors.category}
                  helperText={errors.category?.message || 'Choose the closest fit.'}
                  sx={fieldSx}
                  {...field}
                >
                  <MenuItem value="" disabled>
                    Service Type
                  </MenuItem>
                  {VENDOR_CATEGORIES.flatMap((group) => [
                    <MenuItem
                      key={`${group.group}-label`}
                      value={`group-${group.group}`}
                      disabled
                      sx={{
                        opacity: 1,
                        fontSize: 11,
                        fontWeight: 800,
                        color: 'rgba(66, 50, 28, 0.58)',
                        textTransform: 'uppercase',
                      }}
                    >
                      {group.group}
                    </MenuItem>,
                    ...group.items.map((item) => (
                      <MenuItem key={item.id} value={item.id}>
                        {item.label}
                      </MenuItem>
                    )),
                  ])}
                </TextField>
              )}
            />

            <TextField
              label="Company Name"
              placeholder={`${user?.first_name ? `${user.first_name}'s` : 'Your'} ${
                categorySelected?.label?.length
                  ? categorySelected.label.substring(
                      categorySelected.label.lastIndexOf(' ') + 1,
                    )
                  : ''
              } Services Inc.
              `}
              required
              fullWidth
              autoFocus={!isMobile}
              error={!!errors.title}
              helperText={errors.title?.message}
              sx={fieldSx}
              {...register('title', { required: 'Title is required' })}
            />

            <TextField
              label="Description"
              placeholder="What do you offer, what kind of events do you handle, and what should hosts know?"
              fullWidth
              required
              multiline
              minRows={4}
              error={!!errors.description}
              helperText={errors.description?.message}
              sx={{
                ...fieldSx,
                '& .MuiInputBase-input': {
                  fontSize: 16,
                  lineHeight: 1.7,
                },
              }}
              {...register('description', {
                required: 'Description is required',
              })}
            />

            <TextField
              label="Portfolio URL"
              placeholder="https://..."
              fullWidth
              error={!!errors.portfolio_url}
              helperText={errors.portfolio_url?.message || ''}
              sx={fieldSx}
              {...register('portfolio_url')}
            />

            <Box
              sx={{
                borderRadius: '24px',
                border: '1px dashed rgba(143, 105, 66, 0.3)',
                background: '#fff',
                overflow: 'hidden',
              }}
            >
              {imagePreview ? (
                <Box sx={{ position: 'relative' }}>
                  <Box
                    component="img"
                    src={imagePreview}
                    alt="Selected portfolio"
                    sx={{
                      display: 'block',
                      width: '100%',
                      height: 200,
                      objectFit: 'cover',
                    }}
                  />
                  <MuiButton
                    type="button"
                    onClick={() =>
                      document.getElementById('quick-create-service-image')?.click()
                    }
                    sx={{
                      position: 'absolute',
                      right: 14,
                      bottom: 14,
                      borderRadius: '999px',
                      textTransform: 'none',
                      bgcolor: '#fff',
                      color: '#2B2118',
                      '&:hover': { bgcolor: '#fff' },
                    }}
                  >
                    Change photo
                  </MuiButton>
                </Box>
              ) : (
                <MuiButton
                  type="button"
                  onClick={() =>
                    document.getElementById('quick-create-service-image')?.click()
                  }
                  sx={{
                    width: '100%',
                    minHeight: 160,
                    borderRadius: 0,
                    textTransform: 'none',
                    color: '#2B2118',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 1,
                  }}
                >
                  <ImagePlus size={26} />
                  <Typography sx={{ fontWeight: 700 }}>
                    Add a portfolio image
                  </Typography>
                  <Typography sx={{ fontSize: 13, color: 'rgba(66, 50, 28, 0.7)' }}>
                    Show off your best work.
                  </Typography>
                </MuiButton>
              )}
              <input
                id="quick-create-service-image"
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                style={{ display: 'none' }}
              />
            </Box>

            <Stack
              direction={{ xs: 'column-reverse', sm: 'row' }}
              spacing={1.5}
              justifyContent="flex-end"
              sx={{ pt: 1 }}
            >
              <MuiButton
                type="button"
                onClick={onClose}
                disabled={createMutation.isPending}
                sx={{
                  borderRadius: '999px',
                  px: 2.5,
                  py: 1.2,
                  textTransform: 'none',
                  color: '#2B2118',
                  border: '1px solid rgba(143, 105, 66, 0.18)',
                  background: '#fff',
                  fontWeight: 700,
                }}
              >
                Cancel
              </MuiButton>
              <MuiButton
                type="submit"
                variant="contained"
                disabled={createMutation.isPending}
                sx={{
                  borderRadius: '999px',
                  px: 3,
                  py: 1.4,
                  textTransform: 'none',
                  background: '#D85A30',
                  boxShadow: 'none',
                  fontSize: 16,
                  fontWeight: 700,
                  '&:hover': {
                    background: '#C44C24',
                    boxShadow: 'none',
                  },
                }}
              >
                {createMutation.isPending || updateMutation.isPending ? (
                  <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 1 }}>
                    <CircularProgress size={14} sx={{ color: '#ffffff' }} />
                    {isEdit ? 'Saving...' : 'Creating...'}
                  </Box>
                ) : (
                  isEdit ? 'Save changes' : 'Create service'
                )}
              </MuiButton>
            </Stack>
          </Stack>
        </Box>
      </DialogContent>
    </Dialog>
  );
}
