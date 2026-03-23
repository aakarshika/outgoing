import { Box, Button, Stack, TextField, Typography, MenuItem, ListSubheader, IconButton, Divider, Chip } from '@mui/material';
import { X, User, Briefcase, AlertCircle, CheckCircle2, ChevronDown, ChevronUp, FileText, Info } from 'lucide-react';
import { useState } from 'react';
import { VENDOR_CATEGORIES, getCategoryLabel } from '@/constants/categories';
import { Hostname } from '@/components/ui/Hostname';
import { Servicename } from '@/components/ui/Servicename';
import { useReviewNeedApplication, useUpdateEventNeed } from '@/features/needs/hooks';
import { toast } from 'sonner';
import type { EventNeed } from '@/types/needs';
import { FriendAvatar } from '@/features/events/FriendAvatar';

export interface QuickEditNeedPayload {
  category: string;
  title: string;
  description: string;
  budget_min: string;
  budget_max: string;
}

interface QuickEditNeedProps {
  need: EventNeed | null;
  onClose: () => void;
  onSave: (payload: QuickEditNeedPayload) => Promise<void>;
  isSubmitting?: boolean;
}

const fieldSx = {
  '& .MuiOutlinedInput-root': {
    borderRadius: '12px',
    background: '#fff',
    '& fieldset': {
      borderColor: 'rgba(143, 105, 66, 0.12)',
    },
    '&:hover fieldset': {
      borderColor: 'rgba(216, 90, 48, 0.3)',
    },
    '&.Mui-focused fieldset': {
      borderColor: '#D85A30',
    },
  },
} as const;

export function QuickEditNeed({
  need,
  onClose,
  onSave,
  isSubmitting,
}: QuickEditNeedProps) {
  const isNew = !need;

  const [category, setCategory] = useState(need?.category || '');
  const [description, setDescription] = useState(need?.description || '');
  const [budgetMax, setBudgetMax] = useState(need?.budget_max || '');
  const [expandedAppId, setExpandedAppId] = useState<number | null>(null);
  const [showOverrideHint, setShowOverrideHint] = useState(false);

  const reviewMutation = useReviewNeedApplication();
  const updateNeedMutation = useUpdateEventNeed();

  const handleReview = async (applicationId: number, status: 'accepted' | 'rejected') => {
    try {
      await reviewMutation.mutateAsync({ applicationId, status });
      toast.success(`Application ${status}!`);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to review application');
    }
  };

  const handleHostOverride = async () => {
    if (!need) return;
    try {
      await updateNeedMutation.mutateAsync({
        needId: need.id,
        payload: { status: 'override_filled' },
      });
      toast.success('Need marked as filled via host override');
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to override status');
    }
  };

  const handleUndoOverride = async () => {
    if (!need) return;
    try {
      await updateNeedMutation.mutateAsync({
        needId: need.id,
        payload: { status: 'open' },
      });
      toast.success('Override removed');
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to undo override');
    }
  };

  const handleSave = async () => {
    const payload: QuickEditNeedPayload = {
      category,
      title: getCategoryLabel(category),
      description: description.trim(),
      budget_min: "0",
      budget_max: budgetMax,
    };
    await onSave(payload);
  };

  return (
    <Box
      sx={{
        background: '#fff',
        borderRadius: '16px',
        border: '1px solid rgba(143, 105, 66, 0.12)',
        boxShadow: '0 12px 32px rgba(92, 63, 31, 0.06)',
        p: 2.5,
        height: '100%',
        overflowY: 'auto',
      }}
    >
      <Stack
        direction="row"
        justifyContent="space-between"
        alignItems="center"
        spacing={1}
        sx={{ mb: 1.5 }}
      >
        <Typography
          sx={{
            fontSize: 12,
            fontWeight: 800,
            letterSpacing: '0.08em',
            color: 'rgba(66, 50, 28, 0.5)',
            textTransform: 'uppercase'
          }}
        >
          {isNew ? 'ADD NEED' : 'EDIT NEED'}
        </Typography>
        <IconButton
          onClick={onClose}
          size="small"
          sx={{ color: 'rgba(0,0,0,0.4)', '&:hover': { background: 'rgba(0,0,0,0.04)' } }}
        >
          <X size={20} />
        </IconButton>
      </Stack>

      <Stack spacing={1.5}>
        <TextField
          select
          fullWidth
          label="Need Type"
          variant="outlined"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          sx={fieldSx}
          SelectProps={{
            MenuProps: { PaperProps: { sx: { maxHeight: 400, borderRadius: '12px' } } }
          }}
        >
          {VENDOR_CATEGORIES.map((group) => [
            <ListSubheader
              key={group.group}
              sx={{
                background: '#FDFCFB',
                color: '#8F6942',
                fontWeight: 800,
                fontSize: 10,
                lineHeight: '32px',
                textTransform: 'uppercase'
              }}
            >
              {group.group}
            </ListSubheader>,
            ...group.items.map((item) => (
              <MenuItem key={item.id} value={item.id} sx={{ fontSize: 13, py: 1 }}>
                <Box component="span" sx={{ mr: 1, fontSize: 16 }}>{item.icon}</Box>
                {item.label}
              </MenuItem>
            )),
          ])}
        </TextField>

        <TextField
          label="Describe what you need (Optional)"
          placeholder="Low-light crowd shots, a few portraits..."
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          fullWidth
          multiline
          minRows={2}
          sx={fieldSx}
        />

        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
          <TextField
            label="Max compensation"
            type="number"
            required
            value={budgetMax}
            onChange={(e) => setBudgetMax(e.target.value)}
            fullWidth
            sx={fieldSx}
          />
        </Box>

        {!isNew && need && (
          <Stack spacing={1.5} sx={{ mt: 1, pb: 10 }}>
            <Divider />

            {/* Applications Section */}
            <Box>
              <Typography
                sx={{
                  fontSize: 10,
                  fontWeight: 800,
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                  color: 'rgba(0,0,0,0.4)',
                  mb: 1,
                  px: 0.5
                }}
              >
                Applications ({need.applications.length})
              </Typography>

              {need.applications.length === 0 ? (
                <Box sx={{ py: 3, textAlign: 'center', border: '1px dashed #E5E7EB', borderRadius: '12px' }}>
                  <Typography sx={{ fontSize: 12, color: '#9CA3AF' }}>No applications yet.</Typography>
                </Box>
              ) : (
                <Stack spacing={1}>
                  {need.applications.map((app) => {
                    const isExpanded = expandedAppId === app.id;
                    const isAccepted = app.status === 'accepted';

                    return (
                      <Box
                        key={app.id}
                        sx={{
                          borderRadius: '12px',
                          border: '1px solid',
                          borderColor: isAccepted ? '#10B981' : '#F3F4F6',
                          background: isAccepted ? '#F0FDF4' : '#fff',
                        }}
                      >
                        <Box
                          onClick={() => setExpandedAppId(isExpanded ? null : app.id)}
                          sx={{
                            p: 1.25,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between'
                          }}
                        >
                          <Stack direction="row" alignItems="center" spacing={1.25}>
                            <Box sx={{
                              width: 28,
                              height: 28,
                              borderRadius: '6px',
                              background: isAccepted ? '#D1FAE5' : '#F9FAFB',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              color: isAccepted ? '#059669' : '#9CA3AF',
                              border: '1px solid rgba(0,0,0,0.03)'
                            }}>
                              <FriendAvatar 
                                userId={Number(app.vendor_id)}
                                size={28}
                              />
                            </Box>
                            <Box>
                              <Typography sx={{ fontSize: 12, fontWeight: 700, color: '#1A1A1A' }}>
                                <Hostname username={app.vendor_name} />
                              </Typography>
                              <Typography sx={{ fontSize: 10, color: isAccepted ? '#059669' : '#6B7280', fontWeight: 600 }}>
                                ₹{app.proposed_price || '0'}
                              </Typography>
                            </Box>
                          </Stack>
                          <Stack direction="row" alignItems="center" spacing={1}>
                            {app.status === 'pending' && <Chip label="Pending" size="small" sx={{ height: 18, fontSize: 9, fontWeight: 800, background: '#FEF3C7', color: '#92400E' }} />}
                            {isExpanded ? <ChevronUp size={14} color="#9CA3AF" /> : <ChevronDown size={14} color="#9CA3AF" />}
                          </Stack>
                        </Box>

                        {isExpanded && (
                          <Box sx={{ p: 1.25, pt: 0, borderTop: '1px solid rgba(0,0,0,0.03)' }}>
                            <Typography sx={{ fontSize: 11, color: '#4B5563', mb: 1.5, mt: 1, lineHeight: 1.4 }}>
                              {app.message || 'No message provided.'}
                            </Typography>

                            {app.status === 'pending' && (
                              <Stack direction="row" spacing={1}>
                                <Button
                                  variant="contained"
                                  size="small"
                                  fullWidth
                                  onClick={(e) => { e.stopPropagation(); handleReview(app.id, 'accepted'); }}
                                  sx={{ background: '#10B981', borderRadius: '6px', fontSize: 10, fontWeight: 700, boxShadow: 'none', '&:hover': { background: '#059669', boxShadow: 'none' } }}
                                >
                                  APPROVE
                                </Button>
                                <Button
                                  variant="outlined"
                                  size="small"
                                  fullWidth
                                  onClick={(e) => { e.stopPropagation(); handleReview(app.id, 'rejected'); }}
                                  sx={{ color: '#EF4444', borderColor: '#FCA5A5', borderRadius: '6px', fontSize: 10, fontWeight: 700, '&:hover': { background: '#FFF1F2', borderColor: '#EF4444' } }}
                                >
                                  REJECT
                                </Button>
                              </Stack>
                            )}
                          </Box>
                        )}
                      </Box>
                    );
                  })}
                </Stack>
              )}
            </Box>

            {/* Lightweight Agreement Section */}
            {need.applications.some(a => a.status === 'accepted') && (
              <Box
                sx={{
                  borderRadius: '12px',
                  border: '1px solid #10B981',
                  background: '#F0FDF4',
                  p: 2,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 1.5
                }}
              >
                <Stack direction="row" alignItems="center" spacing={1.25}>
                  <Box sx={{ width: 28, height: 28, borderRadius: '6px', background: '#D1FAE5', color: '#059669', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <FileText size={14} />
                  </Box>
                  <Box sx={{ flex: 1 }}>
                    <Typography sx={{ fontSize: 12, fontWeight: 800, color: '#064E3B' }}>VETTING CONFIRMED</Typography>
                    <Typography sx={{ fontSize: 10, color: '#059669', fontWeight: 500 }}>Signed & Agreed</Typography>
                  </Box>
                  <Chip
                    label="Fully Signed"
                    size="small"
                    sx={{ height: 18, fontSize: 9, fontWeight: 800, background: '#059669', color: '#fff' }}
                  />
                </Stack>

                <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1, pt: 1, borderTop: '0.5px solid rgba(16, 185, 129, 0.2)' }}>
                  <Box>
                    <Typography sx={{ fontSize: 9, color: '#059669', fontWeight: 800, textTransform: 'uppercase', mb: 0.25 }}>Agreed Price</Typography>
                    <Typography sx={{ fontSize: 13, fontWeight: 800, color: '#064E3B' }}>
                      ₹{need.applications.find(a => a.status === 'accepted')?.proposed_price || '0'}
                    </Typography>
                  </Box>
                  <Box sx={{ textAlign: 'right' }}>
                    <Typography sx={{ fontSize: 9, color: '#059669', fontWeight: 800, textTransform: 'uppercase', mb: 0.25 }}>Reference ID</Typography>
                    <Typography sx={{ fontSize: 11, fontWeight: 600, color: '#064E3B', opacity: 0.8 }}>
                      #AGR-{need.applications.find(a => a.status === 'accepted')?.id}
                    </Typography>
                  </Box>
                </Box>
              </Box>
            )}

            {/* Host Override Section */}
            {!need.applications.some(a => a.status === 'accepted') && (<Box
              sx={{
                pt: 5,
                borderRadius: '12px',
                background: need.status === 'override_filled' ? '#FFFBEB' : '#FAFAFA',
                border: '1px solid',
                borderColor: need.status === 'override_filled' ? '#FEF3C7' : '#F0F0F0',
                p: 1.5,
              }}
            >
              <Stack direction="row" alignItems="center" spacing={1}>
                <Box
                  sx={{
                    width: 28,
                    height: 28,
                    borderRadius: '8px',
                    background: need.status === 'override_filled' ? '#FEF3C7' : '#fff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: need.status === 'override_filled' ? '#B45309' : '#6B7280',
                    border: '1px solid rgba(0,0,0,0.05)'
                  }}
                >
                  <Briefcase size={14} />
                </Box>
                <Box sx={{ flex: 1 }}>
                  <Stack direction="row" alignItems="center" spacing={0.5}>
                    <Typography sx={{ fontSize: 12, fontWeight: 700, color: '#1A1A1A' }}>
                      Host Override
                    </Typography>
                    {need.status !== 'filled' && need.status !== 'override_filled' && (
                      <IconButton
                        size="small"
                        onClick={() => setShowOverrideHint(!showOverrideHint)}
                        sx={{ p: 0.25, color: showOverrideHint ? '#D85A30' : 'rgba(0,0,0,0.2)' }}
                      >
                        <Info size={12} />
                      </IconButton>
                    )}
                  </Stack>
                  <Typography sx={{ fontSize: 9, color: '#6B7280', fontWeight: 500 }}>
                    {need.status === 'override_filled' ? 'You are providing this' : 'Manual fill'}
                  </Typography>
                </Box>
                {need.status === 'override_filled' && (
                  <Button
                    size="small"
                    onClick={handleUndoOverride}
                    sx={{
                      fontSize: 9,
                      fontWeight: 800,
                      color: '#DC2626',
                      textTransform: 'none',
                      minWidth: 'auto',
                      px: 1,
                      '&:hover': { background: 'rgba(220, 38, 38, 0.05)' }
                    }}
                  >
                    Undo
                  </Button>
                )}
              </Stack>

              {need.status === 'override_filled' ? (
                <Box sx={{ mt: 1, p: 1, borderRadius: '6px', background: 'rgba(180, 83, 9, 0.04)', border: '1px solid rgba(180, 83, 9, 0.08)' }}>
                  <Typography sx={{ fontSize: 10, fontWeight: 600, color: '#92400E' }}>
                    Marks as Host-Provided.
                  </Typography>
                </Box>
              ) : need.status === 'filled' ? null : (
                showOverrideHint && (
                  <Stack spacing={1} sx={{ mt: 1.5 }}>
                    <Box
                      sx={{
                        p: 1,
                        borderRadius: '6px',
                        background: 'rgba(216, 90, 48, 0.04)',
                        border: '0.5px dashed rgba(216, 90, 48, 0.2)',
                        display: 'flex',
                        gap: 1
                      }}
                    >
                      <AlertCircle size={10} style={{ color: '#D85A30', marginTop: 1, flexShrink: 0 }} />
                      <Typography sx={{ fontSize: 9, color: '#D85A30', fontWeight: 500, lineHeight: 1.3 }}>
                        Provide manually if no vendors are available. You can undo later.
                      </Typography>
                    </Box>
                    <Button
                      variant="outlined"
                      size="small"
                      fullWidth
                      onClick={handleHostOverride}
                      sx={{
                        borderRadius: '6px',
                        textTransform: 'none',
                        fontSize: 10,
                        fontWeight: 700,
                        borderColor: 'rgba(216, 90, 48, 0.3)',
                        color: '#D85A30',
                        py: 0.5,
                        '&:hover': { borderColor: '#D85A30', background: 'rgba(216, 90, 48, 0.02)' }
                      }}
                    >
                      Mark Filled
                    </Button>
                  </Stack>
                )
              )}
            </Box>
            )}
          </Stack>
        )}

        <Button
          type="button"
          variant="contained"
          onClick={handleSave}
          disabled={isSubmitting || !category || !budgetMax}
          sx={{
            position: 'fixed',
            bottom: 20,
            right: 20,
            zIndex: 10,
            borderRadius: '12px',
            py: 1,
            px: 4,
            textTransform: 'none',
            fontSize: 14,
            fontWeight: 700,
            background: '#D85A30',
            boxShadow: 'none',
            '&:hover': { background: '#C44C24', boxShadow: 'none' }
          }}
        >
          {isSubmitting ? 'Saving...' : (isNew ? 'Add need' : 'Save changes')}
        </Button>
      </Stack>
    </Box>
  );
}
