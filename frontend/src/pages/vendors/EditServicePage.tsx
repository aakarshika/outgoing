import { Box, Paper, ThemeProvider, Typography } from '@mui/material';
import {
  ArrowLeft,
  Briefcase,
  DollarSign,
  Image as ImageIcon,
  MapPin,
  Save,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { VENDOR_CATEGORIES } from '@/constants/categories';
import { scrapbookTheme } from '@/features/events/theme/scrapbookTheme';
import { useUpdateVendorService, useVendorService } from '@/features/vendors/hooks';
import { compressImage } from '@/utils/image';

interface EditServiceFormData {
  title: string;
  description: string;
  category: string;
  base_price: string;
  travel_radius_miles: string;
  portfolio_url: string;
}

/* ---- Scrapbook Decorations ---- */

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

const SectionDivider = ({
  icon: Icon,
  title,
}: {
  icon: React.ElementType;
  title: string;
}) => (
  <Box
    sx={{
      display: 'flex',
      alignItems: 'center',
      gap: 1.5,
      borderBottom: '2px solid #333',
      pb: 1,
      mb: 3,
    }}
  >
    <Box
      sx={{
        p: 0.75,
        border: '1px dashed #ccc',
        transform: 'rotate(3deg)',
        bgcolor: '#fff',
      }}
    >
      <Icon style={{ width: 18, height: 18, color: '#2563eb' }} />
    </Box>
    <Typography
      sx={{
        fontFamily: '"Permanent Marker", cursive',
        fontSize: '1.2rem',
        transform: 'rotate(-0.5deg)',
      }}
    >
      {title}
    </Typography>
  </Box>
);

/* ---- Styled input helpers ---- */

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '10px 0 8px 0',
  fontFamily: '"Caveat", cursive',
  fontSize: '1.1rem',
  border: 'none',
  borderBottom: '1.5px solid #ccc',
  background: 'transparent',
  outline: 'none',
  transition: 'border-color 0.2s ease',
};

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: '0.75rem',
  fontWeight: 700,
  letterSpacing: '0.5px',
  textTransform: 'uppercase' as const,
  fontFamily: 'monospace',
  color: '#555',
  marginBottom: 4,
};

export default function EditServicePage() {
  const { id } = useParams<{ id: string }>();
  const serviceId = parseInt(id || '0', 10);
  const navigate = useNavigate();

  const { data: serviceRes, isLoading } = useVendorService(serviceId);
  const updateMutation = useUpdateVendorService();

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<EditServiceFormData>();
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);

  useEffect(() => {
    if (serviceRes?.data) {
      const data = serviceRes.data;
      reset({
        title: data.title,
        description: data.description,
        category: data.category,
        base_price: data.base_price?.toString() || '',
        travel_radius_miles: data.travel_radius_miles?.toString() || '',
        portfolio_url: data.portfolio_url || '',
      });
      if (data.portfolio_image) {
        setImagePreview(data.portfolio_image);
      }
    }
  }, [serviceRes, reset]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedImage(file);
      const reader = new FileReader();
      reader.onloadend = () => setImagePreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const onSubmit = (data: EditServiceFormData) => {
    const formData = new FormData();
    formData.append('title', data.title);
    formData.append('description', data.description);
    formData.append('category', data.category);

    formData.append('base_price', data.base_price || '');
    formData.append('travel_radius_miles', data.travel_radius_miles || '');
    formData.append('portfolio_url', data.portfolio_url || '');

    const submitData = async () => {
      if (selectedImage) {
        try {
          const compressedFile = await compressImage(selectedImage, {
            newFileName: 'portfolio_image',
          });
          formData.append('portfolio_image', compressedFile);
        } catch (err) {
          console.error('Image compression failed', err);
          formData.append('portfolio_image', selectedImage);
        }
      }

      updateMutation.mutate(
        { id: serviceId, formData },
        {
          onSuccess: () => {
            toast.success('Vendor service updated successfully!');
            navigate('/dashboard');
          },
          onError: (error: any) => {
            const message =
              error?.response?.data?.message || 'Failed to update service';
            toast.error(message);
          },
        },
      );
    };

    submitData();
  };

  if (isLoading) {
    return (
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          bgcolor: '#f4f1ea',
        }}
      >
        <Typography
          sx={{
            fontFamily: '"Permanent Marker", cursive',
            fontSize: '2rem',
            animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
          }}
        >
          Loading...
        </Typography>
      </Box>
    );
  }

  if (!serviceRes?.data) {
    return (
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          bgcolor: '#f4f1ea',
        }}
      >
        <Typography
          sx={{ fontFamily: '"Permanent Marker", cursive', fontSize: '2rem' }}
        >
          Service not found.
        </Typography>
      </Box>
    );
  }

  return (
    <ThemeProvider theme={scrapbookTheme}>
      <Box
        sx={{
          minHeight: '100vh',
          bgcolor: '#f4f1ea',
          backgroundImage: 'radial-gradient(#d1d5db 0.5px, #f4f1ea 0.5px)',
          backgroundSize: '15px 15px',
          backgroundAttachment: 'fixed',
          p: { xs: 2, sm: 4, md: 6 },
        }}
      >
        <Box sx={{ maxWidth: 720, mx: 'auto' }}>
          {/* ── Header ── */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 5 }}>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate(-1)}
              className="rounded-full shrink-0"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <Box>
              <Typography
                sx={{
                  fontFamily: '"Permanent Marker", cursive',
                  fontSize: { xs: '1.6rem', sm: '2.2rem' },
                  transform: 'rotate(-1deg)',
                  lineHeight: 1.1,
                }}
              >
                Edit Vendor Service
              </Typography>
              <Typography
                sx={{
                  fontFamily: 'serif',
                  fontStyle: 'italic',
                  color: '#888',
                  mt: 0.5,
                  fontSize: '0.85rem',
                }}
              >
                Make changes to your public service listing.
              </Typography>
            </Box>
          </Box>

          <form onSubmit={handleSubmit(onSubmit)}>
            {/* ── Service Information Section ── */}
            <Paper
              elevation={2}
              sx={{
                p: { xs: 3, sm: 4 },
                mb: 4,
                bgcolor: '#fff',
                position: 'relative',
                overflow: 'visible',
                backgroundImage:
                  'repeating-linear-gradient(transparent, transparent 27px, rgba(0,0,0,0.04) 27px, rgba(0,0,0,0.04) 28px)',
              }}
            >
              <WashiTape color="rgba(37, 99, 235, 0.35)" rotate="-2deg" width={90} />
              <SectionDivider icon={Briefcase} title="Service Info" />

              <Box sx={{ mb: 3 }}>
                <label style={labelStyle}>Service Title *</label>
                <input
                  {...register('title', { required: 'Title is required' })}
                  type="text"
                  placeholder="e.g. Professional Wedding Photography"
                  style={inputStyle}
                  onFocus={(e) => (e.target.style.borderBottomColor = '#2563eb')}
                  onBlur={(e) => (e.target.style.borderBottomColor = '#ccc')}
                />
                {errors.title && (
                  <Typography
                    sx={{
                      color: '#dc2626',
                      mt: 0.5,
                      fontFamily: '"Caveat", cursive',
                      fontSize: '0.9rem',
                    }}
                  >
                    ⚠ {errors.title.message}
                  </Typography>
                )}
              </Box>

              <Box
                sx={{
                  display: 'grid',
                  gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' },
                  gap: 3,
                  mb: 3,
                }}
              >
                <Box>
                  <label style={labelStyle}>Category *</label>
                  <select
                    {...register('category', { required: 'Category is required' })}
                    style={{
                      ...inputStyle,
                      cursor: 'pointer',
                      borderBottom: '1.5px solid #ccc',
                    }}
                    onFocus={(e) => (e.target.style.borderBottomColor = '#2563eb')}
                    onBlur={(e) => (e.target.style.borderBottomColor = '#ccc')}
                  >
                    <option value="">Select a category</option>
                    {VENDOR_CATEGORIES.map((group) => (
                      <optgroup key={group.group} label={group.group}>
                        {group.items.map((item) => (
                          <option key={item.id} value={item.id}>
                            {item.label}
                          </option>
                        ))}
                      </optgroup>
                    ))}
                  </select>
                  {errors.category && (
                    <Typography
                      sx={{
                        color: '#dc2626',
                        mt: 0.5,
                        fontFamily: '"Caveat", cursive',
                        fontSize: '0.9rem',
                      }}
                    >
                      ⚠ {errors.category.message}
                    </Typography>
                  )}
                </Box>

                <Box>
                  <label style={labelStyle}>Starting Price ($)</label>
                  <Box sx={{ position: 'relative' }}>
                    <DollarSign
                      style={{
                        position: 'absolute',
                        left: 0,
                        top: '50%',
                        transform: 'translateY(-50%)',
                        width: 16,
                        height: 16,
                        color: '#999',
                      }}
                    />
                    <input
                      {...register('base_price')}
                      type="number"
                      step="0.01"
                      placeholder="e.g. 150.00"
                      style={{ ...inputStyle, paddingLeft: 20 }}
                      onFocus={(e) => (e.target.style.borderBottomColor = '#2563eb')}
                      onBlur={(e) => (e.target.style.borderBottomColor = '#ccc')}
                    />
                  </Box>
                </Box>
              </Box>

              <Box>
                <label style={labelStyle}>Description *</label>
                <textarea
                  {...register('description', { required: 'Description is required' })}
                  rows={5}
                  placeholder="Describe what you offer, your experience, and what makes your service special..."
                  style={{
                    width: '100%',
                    padding: '10px 0',
                    fontSize: '1.1rem',
                    fontFamily: '"Caveat", cursive',
                    border: 'none',
                    borderBottom: '1.5px solid #ccc',
                    background: 'transparent',
                    outline: 'none',
                    resize: 'none',
                  }}
                  onFocus={(e) => (e.target.style.borderBottomColor = '#2563eb')}
                  onBlur={(e) => (e.target.style.borderBottomColor = '#ccc')}
                />
                {errors.description && (
                  <Typography
                    sx={{
                      color: '#dc2626',
                      mt: 0.5,
                      fontFamily: '"Caveat", cursive',
                      fontSize: '0.9rem',
                    }}
                  >
                    ⚠ {errors.description.message}
                  </Typography>
                )}
              </Box>
            </Paper>

            {/* ── Service Details Section ── */}
            <Paper
              elevation={2}
              sx={{
                p: { xs: 3, sm: 4 },
                mb: 4,
                bgcolor: '#fff',
                position: 'relative',
                overflow: 'visible',
                transform: 'rotate(0.3deg)',
                backgroundImage:
                  'repeating-linear-gradient(transparent, transparent 27px, rgba(0,0,0,0.04) 27px, rgba(0,0,0,0.04) 28px)',
              }}
            >
              <WashiTape color="rgba(22, 163, 74, 0.35)" rotate="4deg" width={90} />
              <SectionDivider icon={MapPin} title="Service Details" />

              <Box
                sx={{
                  display: 'grid',
                  gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' },
                  gap: 3,
                }}
              >
                <Box>
                  <label style={labelStyle}>Travel Radius (miles)</label>
                  <input
                    {...register('travel_radius_miles')}
                    type="number"
                    placeholder="e.g. 50"
                    style={inputStyle}
                    onFocus={(e) => (e.target.style.borderBottomColor = '#2563eb')}
                    onBlur={(e) => (e.target.style.borderBottomColor = '#ccc')}
                  />
                  <Typography
                    sx={{
                      fontSize: '0.75rem',
                      fontFamily: '"Caveat", cursive',
                      color: '#888',
                      mt: 0.5,
                    }}
                  >
                    Leave blank if nationwide or remote 🌍
                  </Typography>
                </Box>

                <Box>
                  <label style={labelStyle}>Portfolio/External URL</label>
                  <input
                    {...register('portfolio_url')}
                    type="url"
                    placeholder="https://yourwebsite.com"
                    style={inputStyle}
                    onFocus={(e) => (e.target.style.borderBottomColor = '#2563eb')}
                    onBlur={(e) => (e.target.style.borderBottomColor = '#ccc')}
                  />
                </Box>
              </Box>
            </Paper>

            {/* ── Cover Image Section — Polaroid ── */}
            <Paper
              elevation={2}
              sx={{
                p: { xs: 3, sm: 4 },
                mb: 4,
                bgcolor: '#fff',
                position: 'relative',
                overflow: 'visible',
                transform: 'rotate(-0.5deg)',
              }}
            >
              <WashiTape color="rgba(234, 179, 8, 0.4)" rotate="-3deg" width={70} />
              <SectionDivider icon={ImageIcon} title="Cover Image" />

              <Box
                sx={{
                  display: 'flex',
                  flexDirection: { xs: 'column', sm: 'row' },
                  gap: 4,
                  alignItems: 'flex-start',
                }}
              >
                {/* Polaroid preview */}
                <Paper
                  elevation={3}
                  sx={{
                    p: 1.5,
                    pb: 5,
                    bgcolor: 'white',
                    width: 200,
                    flexShrink: 0,
                    transform: 'rotate(-2deg)',
                    transition: 'transform 0.3s ease',
                    '&:hover': { transform: 'rotate(0deg) scale(1.02)' },
                    border: '1px solid #efefef',
                    position: 'relative',
                  }}
                >
                  <Box
                    sx={{
                      height: 140,
                      bgcolor: '#f0f0f0',
                      overflow: 'hidden',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      position: 'relative',
                    }}
                  >
                    {imagePreview ? (
                      <>
                        <img
                          src={imagePreview}
                          alt="Preview"
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        />
                        <button
                          type="button"
                          onClick={() => {
                            setImagePreview(null);
                            setSelectedImage(null);
                          }}
                          style={{
                            position: 'absolute',
                            top: 4,
                            right: 4,
                            background: '#dc2626',
                            color: '#fff',
                            border: 'none',
                            borderRadius: '50%',
                            width: 24,
                            height: 24,
                            cursor: 'pointer',
                            fontSize: '14px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        >
                          ×
                        </button>
                      </>
                    ) : (
                      <Box sx={{ textAlign: 'center', color: '#ccc' }}>
                        <ImageIcon style={{ width: 32, height: 32, marginBottom: 4 }} />
                        <Typography
                          sx={{
                            fontSize: '0.65rem',
                            fontFamily: '"Caveat", cursive',
                            color: '#999',
                          }}
                        >
                          No photo yet
                        </Typography>
                      </Box>
                    )}
                  </Box>
                  <Typography
                    sx={{
                      fontFamily: '"Permanent Marker", cursive',
                      fontSize: '0.8rem',
                      textAlign: 'center',
                      mt: 1.5,
                      color: '#666',
                    }}
                  >
                    {imagePreview ? 'Your photo ✓' : 'Add a photo'}
                  </Typography>
                </Paper>

                <Box sx={{ flex: 1 }}>
                  <label style={labelStyle}>Upload Image</label>
                  <Typography
                    sx={{
                      fontSize: '0.8rem',
                      fontFamily: '"Caveat", cursive',
                      color: '#888',
                      mb: 2,
                    }}
                  >
                    Add a cover image or portfolio sample to help your service stand
                    out. Max 5MB. 📷
                  </Typography>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="w-full text-sm file:mr-4 file:py-2 file:px-4 file:rounded-none file:border file:border-solid file:border-gray-300 file:text-sm file:font-semibold file:bg-white file:text-gray-700 hover:file:bg-gray-50 cursor-pointer"
                  />
                  <Typography
                    sx={{
                      mt: 2,
                      fontSize: '0.75rem',
                      fontFamily: '"Caveat", cursive',
                      color: '#666',
                      backgroundColor: '#fdfdfd',
                      p: 1.5,
                      borderLeft: '3px solid #2563eb',
                    }}
                  >
                    Note: If you do not select a new image, your existing portfolio
                    image will be kept.
                  </Typography>
                </Box>
              </Box>
            </Paper>

            {/* ── Submit Actions ── */}
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'flex-end',
                gap: 2,
                pt: 3,
                pb: 6,
              }}
            >
              <Button type="button" variant="outline" onClick={() => navigate(-1)}>
                Cancel
              </Button>
              <Box
                component="button"
                type="submit"
                disabled={updateMutation.isPending}
                sx={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 1,
                  px: 4,
                  py: 1.5,
                  bgcolor: '#333',
                  color: '#fff',
                  border: '2px solid #333',
                  fontFamily: '"Permanent Marker", cursive',
                  fontSize: '0.95rem',
                  cursor: updateMutation.isPending ? 'not-allowed' : 'pointer',
                  opacity: updateMutation.isPending ? 0.6 : 1,
                  transform: 'rotate(-1deg)',
                  transition: 'all 0.2s ease',
                  '&:hover': {
                    bgcolor: '#000',
                    transform: 'rotate(0deg) scale(1.02)',
                    boxShadow: '4px 4px 0px rgba(0,0,0,0.2)',
                  },
                }}
              >
                {updateMutation.isPending ? (
                  'Saving...'
                ) : (
                  <>
                    <Save style={{ width: 16, height: 16 }} />
                    Save Changes
                  </>
                )}
              </Box>
            </Box>
          </form>
        </Box>
      </Box>
    </ThemeProvider>
  );
}
