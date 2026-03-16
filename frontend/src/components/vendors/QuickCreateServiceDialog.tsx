import {
  Box,
  CircularProgress,
  Dialog,
  DialogContent,
  IconButton,
  MenuItem,
  Stack,
  TextField,
  Typography,
  useMediaQuery,
} from '@mui/material';
import { useQueryClient } from '@tanstack/react-query';
import { ImagePlus, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { VENDOR_CATEGORIES } from '@/constants/categories';
import { useCreateVendorService } from '@/features/vendors/hooks';
import { compressImage } from '@/utils/image';

type QuickCreateServiceFormData = {
  title: string;
  description: string;
  category: string;
  base_price: string;
  travel_radius_miles: string;
  portfolio_url: string;
};

export function QuickCreateServiceDialog({
  open,
  onClose,
  defaultCategory = '',
}: {
  open: boolean;
  onClose: () => void;
  defaultCategory?: string;
}) {
  const isMobile = useMediaQuery('(max-width:767px)');
  const queryClient = useQueryClient();
  const createMutation = useCreateVendorService();
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<QuickCreateServiceFormData>({
    defaultValues: {
      title: '',
      description: '',
      category: defaultCategory,
      base_price: '',
      travel_radius_miles: '',
      portfolio_url: '',
    },
  });

  useEffect(() => {
    if (!open) return;
    reset({
      title: '',
      description: '',
      category: defaultCategory,
      base_price: '',
      travel_radius_miles: '',
      portfolio_url: '',
    });
    setImagePreview(null);
    setSelectedImage(null);
  }, [defaultCategory, open, reset]);

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
      await createMutation.mutateAsync(formData);
      await queryClient.invalidateQueries({ queryKey: ['search'] });
      toast.success('Service created');
      onClose();
    } catch (error: any) {
      const message = error?.response?.data?.message || 'Failed to create service';
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
    >
      <DialogContent
        sx={{
          p: 0,
          overflow: 'hidden',
          bgcolor: '#FCF7EE',
        }}
      >
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            px: { xs: 2, sm: 3 },
            py: 2,
            borderBottom: '1px solid rgba(120,94,60,0.14)',
            background:
              'linear-gradient(180deg, rgba(255,252,247,1) 0%, rgba(252,247,238,1) 100%)',
          }}
        >
          <Box>
            <Typography
              sx={{
                fontFamily: 'Syne, sans-serif',
                fontSize: { xs: 20, sm: 24 },
                fontWeight: 800,
                color: '#3F3123',
                letterSpacing: '-0.02em',
              }}
            >
              Quick create service
            </Typography>
            <Typography sx={{ mt: 0.4, fontSize: 12, color: '#7A6A55' }}>
              Add a service without leaving this page.
            </Typography>
          </Box>
          <IconButton
            onClick={onClose}
            disabled={createMutation.isPending}
            sx={{ color: '#6B5B48' }}
            aria-label="Close service quick create"
          >
            <X size={18} />
          </IconButton>
        </Box>

        <Box
          component="form"
          onSubmit={handleSubmit(onSubmit)}
          sx={{
            px: { xs: 2, sm: 3 },
            py: 2.5,
          }}
        >
          <Stack spacing={2}>
            <TextField
              label="Service title"
              placeholder="DJ for house parties"
              fullWidth
              autoFocus={!isMobile}
              error={!!errors.title}
              helperText={errors.title?.message}
              {...register('title', { required: 'Title is required' })}
            />

            <TextField
              label="Category"
              select
              fullWidth
              error={!!errors.category}
              helperText={errors.category?.message || 'Choose the closest fit.'}
              defaultValue={defaultCategory}
              {...register('category', { required: 'Category is required' })}
            >
              <MenuItem value="" disabled>
                Select a category
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
                    color: '#7A6A55',
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

            <TextField
              label="Description"
              placeholder="What do you offer, what kind of events do you handle, and what should hosts know?"
              fullWidth
              multiline
              minRows={4}
              error={!!errors.description}
              helperText={errors.description?.message}
              {...register('description', {
                required: 'Description is required',
              })}
            />

            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              <TextField
                label="Base price"
                placeholder="2500"
                fullWidth
                error={!!errors.base_price}
                helperText={errors.base_price?.message || 'Optional'}
                {...register('base_price', {
                  pattern: {
                    value: /^\d*\.?\d*$/,
                    message: 'Use numbers only',
                  },
                })}
              />
              <TextField
                label="Travel radius (miles)"
                placeholder="20"
                fullWidth
                error={!!errors.travel_radius_miles}
                helperText={errors.travel_radius_miles?.message || 'Optional'}
                {...register('travel_radius_miles', {
                  pattern: {
                    value: /^\d*\.?\d*$/,
                    message: 'Use numbers only',
                  },
                })}
              />
            </Stack>

            <TextField
              label="Portfolio URL"
              placeholder="https://..."
              fullWidth
              error={!!errors.portfolio_url}
              helperText={errors.portfolio_url?.message || 'Optional'}
              {...register('portfolio_url')}
            />

            <Box>
              <Button
                type="button"
                variant="outline"
                className="w-full justify-start gap-2 border-dashed border-[#CDBBA5] bg-white/70 text-[#5A4938] hover:bg-[#FFF7EC]"
                onClick={() =>
                  document.getElementById('quick-create-service-image')?.click()
                }
              >
                <ImagePlus className="h-4 w-4" />
                {selectedImage ? 'Change portfolio image' : 'Add portfolio image'}
              </Button>
              <input
                id="quick-create-service-image"
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                style={{ display: 'none' }}
              />
              {imagePreview ? (
                <Box
                  component="img"
                  src={imagePreview}
                  alt="Selected portfolio"
                  sx={{
                    mt: 1.25,
                    width: '100%',
                    maxHeight: 180,
                    objectFit: 'cover',
                    borderRadius: 2,
                    border: '1px solid rgba(120,94,60,0.14)',
                  }}
                />
              ) : null}
            </Box>

            <Stack
              direction={{ xs: 'column-reverse', sm: 'row' }}
              spacing={1.5}
              justifyContent="flex-end"
              sx={{ pt: 1 }}
            >
              <Button
                type="button"
                variant="ghost"
                className="text-[#5A4938] hover:bg-[#F3E8D8]"
                onClick={onClose}
                disabled={createMutation.isPending}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="bg-[#0F8C84] text-white hover:bg-[#0C756F]"
                disabled={createMutation.isPending}
              >
                {createMutation.isPending ? (
                  <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 1 }}>
                    <CircularProgress size={14} sx={{ color: '#ffffff' }} />
                    Creating...
                  </Box>
                ) : (
                  'Create service'
                )}
              </Button>
            </Stack>
          </Stack>
        </Box>
      </DialogContent>
    </Dialog>
  );
}
