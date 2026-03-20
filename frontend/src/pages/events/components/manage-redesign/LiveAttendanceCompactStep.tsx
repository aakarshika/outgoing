import {
  Box,
  Button,
  IconButton,
  InputAdornment,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import {
  Box as BoxIcon,
  QrCode,
  Scan,
  Ticket as TicketIcon,
  Users,
  X,
  XCircle,
} from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

import { QRScannerModal } from '@/components/events/QRScannerModal';
import { useEventAttendees } from '@/features/events/hooks';
import { useEventNeeds } from '@/features/needs/hooks';
import { admitTicket, validateTicket } from '@/features/tickets/api';
import { useTicketAdmission, useTicketValidation } from '@/features/tickets/hooks';
import type { EventDetail } from '@/types/events';

interface LiveAttendanceCompactStepProps {
  event: EventDetail;
  readonly?: boolean;
  onClose?: () => void;
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

export function LiveAttendanceCompactStep({
  event,
  readonly = false,
  onClose,
}: LiveAttendanceCompactStepProps) {
  const { data: attendeesResponse, refetch: refetchAttendees } = useEventAttendees(
    event?.id,
  );
  const attendees = attendeesResponse?.data || [];

  const { data: needsResponse, refetch: refetchNeeds } = useEventNeeds(event?.id);
  const needs = needsResponse?.data || [];
  const vendorApplications = needs.flatMap((need) =>
    (need.applications || []).filter((app: any) => app.status === 'accepted'),
  );

  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [entryBarcode, setEntryBarcode] = useState('');

  const {
    validate: validateBarcode,
    result: validationResult,
    reset: resetValidation,
    isLoading: isValidating,
    error: validationError,
    errorCode: validationErrorCode,
  } = useTicketValidation();

  const {
    admit: performAdmit,
    isLoading: isAdmitting,
    admitted,
    reset: resetAdmission,
    error: admitError,
  } = useTicketAdmission();

  const lifecycleState = event?.lifecycle_state;
  const isLive = lifecycleState === 'live';
  const isEventReady = lifecycleState === 'event_ready';
  const canUseActions = !readonly;

  const handleValidate = async () => {
    if (!entryBarcode.trim()) return;
    resetAdmission();
    await validateBarcode({ barcode: entryBarcode.trim(), eventId: event.id });
  };

  const handleAdmit = async () => {
    if (!validationResult) return;
    try {
      await performAdmit(
        validationResult.ticket_id,
        event.id,
        validationResult.is_vendor,
      );
      toast.success(`${validationResult.attendee_name} admitted!`);
      if (validationResult.is_vendor) refetchNeeds();
      else refetchAttendees();
    } catch {
      // `useTicketAdmission` exposes errors via `admitError`.
    }
  };

  const handleResetEntry = () => {
    setEntryBarcode('');
    resetValidation();
    resetAdmission();
  };

  const usedCount = attendees.filter((a: any) => a.status === 'used').length;
  const admittedVendorsCount = vendorApplications.filter(
    (a: any) => a.admitted_at,
  ).length;

  return (
    <Box
      sx={{ height: '100%', overflowY: 'auto', px: 2, py: 1.5, background: '#F5F0EB' }}
    >
      <Stack spacing={1.5} sx={{ pb: 2 }}>
        <Box
          sx={{
            background: '#fff',
            borderRadius: '14px',
            border: '0.5px solid #F0EDE8',
            p: 2,
          }}
        >
          <Stack
            direction="row"
            alignItems="flex-start"
            justifyContent="space-between"
            spacing={2}
          >
            <Stack
              direction="row"
              alignItems="center"
              spacing={1.25}
              sx={{ minWidth: 0 }}
            >
              <Users size={22} color="#1A1A1A" />
              <Box sx={{ minWidth: 0 }}>
                <Typography sx={{ fontSize: 14, fontWeight: 800, color: '#1A1A1A' }}>
                  Attendees ({usedCount} / {attendees.length})
                </Typography>
                <Typography sx={{ fontSize: 12, color: '#888780', mt: 0.25 }}>
                  Scan tickets or check history
                </Typography>
              </Box>
            </Stack>

            <Stack direction="row" alignItems="center" spacing={1}>
              {canUseActions ? (
                <Button
                  onClick={() => setIsScannerOpen(true)}
                  disableElevation
                  variant="contained"
                  sx={{
                    textTransform: 'none',
                    borderRadius: 999,
                    py: 0.9,
                    px: 2,
                    fontWeight: 800,
                    background: '#1D9E75',
                    '&:hover': { background: '#168564' },
                    whiteSpace: 'nowrap',
                  }}
                >
                  <Scan size={16} style={{ marginRight: 8 }} />
                  SCAN TICKET
                </Button>
              ) : null}

              {onClose ? (
                <IconButton
                  onClick={onClose}
                  size="small"
                  sx={{
                    color: 'rgba(0,0,0,0.4)',
                    '&:hover': { background: 'rgba(0,0,0,0.04)' },
                  }}
                >
                  <X size={20} />
                </IconButton>
              ) : null}
            </Stack>
          </Stack>

          {canUseActions ? (
            <Box
              sx={{
                mt: 2,
                borderRadius: '14px',
                background: '#FAFAF9',
                border: '0.5px solid #F0EDE8',
                p: 1.5,
              }}
            >
              <Stack
                direction="row"
                alignItems="center"
                spacing={1}
                sx={{
                  pb: 1.25,
                  borderBottom: '0.5px dashed #EDE8E1',
                  mb: 1.5,
                }}
              >
                <QrCode size={16} color="#1A1A1A" />
                <Typography
                  sx={{
                    fontSize: 10,
                    fontWeight: 800,
                    textTransform: 'uppercase',
                    letterSpacing: '0.08em',
                    color: 'rgba(66, 50, 28, 0.56)',
                  }}
                >
                  Manual Code Entry
                </Typography>
              </Stack>

              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
                <TextField
                  value={entryBarcode}
                  onChange={(e) => setEntryBarcode(e.target.value.toUpperCase())}
                  placeholder="Enter ticket barcode..."
                  fullWidth
                  size="small"
                  disabled={isValidating}
                  sx={fieldSx}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') void handleValidate();
                  }}
                  InputProps={{
                    endAdornment: entryBarcode ? (
                      <InputAdornment position="end">
                        <IconButton
                          size="small"
                          onClick={handleResetEntry}
                          aria-label="Clear barcode"
                        >
                          ✕
                        </IconButton>
                      </InputAdornment>
                    ) : undefined,
                  }}
                />

                <Button
                  onClick={() => void handleValidate()}
                  disabled={!entryBarcode.trim() || isValidating}
                  disableElevation
                  variant="contained"
                  sx={{
                    textTransform: 'none',
                    borderRadius: 999,
                    py: 1,
                    px: 2.2,
                    fontWeight: 800,
                    background: '#2563EB',
                    '&:hover': { background: '#1D4ED8' },
                    whiteSpace: 'nowrap',
                  }}
                >
                  {isValidating ? 'Checking...' : 'VALIDATE'}
                </Button>
              </Stack>

              {validationErrorCode === 'ALREADY_USED' ? (
                <Box
                  sx={{
                    mt: 2,
                    p: 1.25,
                    borderRadius: '14px',
                    background: '#FFF4CC',
                    border: '0.5px solid rgba(216, 90, 48, 0.18)',
                  }}
                >
                  <Typography sx={{ fontSize: 12, fontWeight: 900, color: '#854F0B' }}>
                    ALREADY CHECKED IN
                  </Typography>
                  <Typography sx={{ fontSize: 12, color: '#5F5E5A', mt: 0.5 }}>
                    {validationResult?.attendee_name || 'GUEST'} •{' '}
                    {validationResult?.tier_name || 'Verified'} Pass
                  </Typography>

                  <Button
                    fullWidth
                    onClick={handleResetEntry}
                    disableElevation
                    variant="contained"
                    sx={{
                      mt: 1.25,
                      textTransform: 'none',
                      borderRadius: 999,
                      py: 1,
                      fontWeight: 800,
                      background: '#fff',
                      color: '#1A1A1A',
                      border: '0.5px solid #F0EDE8',
                      '&:hover': { background: '#FAFAF9' },
                    }}
                  >
                    BACK TO SCAN
                  </Button>
                </Box>
              ) : validationError ? (
                <Box
                  sx={{
                    mt: 2,
                    p: 1.25,
                    borderRadius: '14px',
                    background: '#FEE2E2',
                    border: '0.5px solid rgba(220, 38, 38, 0.25)',
                  }}
                >
                  <Stack direction="row" alignItems="flex-start" spacing={1}>
                    <XCircle size={18} color="#DC2626" style={{ marginTop: 2 }} />
                    <Box sx={{ minWidth: 0, flex: 1 }}>
                      <Typography
                        sx={{ fontSize: 12, fontWeight: 900, color: '#B91C1C' }}
                      >
                        Invalid Ticket
                      </Typography>
                      <Typography
                        sx={{
                          fontSize: 12,
                          color: '#B91C1C',
                          mt: 0.25,
                          lineHeight: 1.4,
                        }}
                      >
                        {validationError}
                      </Typography>
                      <Button
                        fullWidth
                        onClick={handleResetEntry}
                        disableElevation
                        variant="contained"
                        sx={{
                          mt: 1.25,
                          textTransform: 'none',
                          borderRadius: 999,
                          py: 1,
                          fontWeight: 800,
                          background: '#fff',
                          color: '#1A1A1A',
                          border: '0.5px solid #F0EDE8',
                          '&:hover': { background: '#FAFAF9' },
                        }}
                      >
                        TRY AGAIN
                      </Button>
                    </Box>
                  </Stack>
                </Box>
              ) : null}

              {validationResult &&
              !admitted &&
              validationErrorCode !== 'ALREADY_USED' ? (
                <Box
                  sx={{
                    mt: 2,
                    p: 1.25,
                    borderRadius: '14px',
                    background: '#EAF3DE',
                    border: '0.5px solid rgba(29, 158, 117, 0.35)',
                  }}
                >
                  <Stack direction="row" spacing={1.5}>
                    <Box sx={{ flex: 1 }}>
                      <Typography
                        sx={{
                          fontSize: 10,
                          fontWeight: 900,
                          textTransform: 'uppercase',
                          letterSpacing: '0.08em',
                          color: 'rgba(0,0,0,0.45)',
                        }}
                      >
                        Attendee
                      </Typography>
                      <Typography
                        sx={{
                          fontSize: 13,
                          fontWeight: 800,
                          color: '#1A1A1A',
                          mt: 0.2,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {validationResult.attendee_name}
                      </Typography>
                    </Box>
                    <Box sx={{ flex: 1 }}>
                      <Typography
                        sx={{
                          fontSize: 10,
                          fontWeight: 900,
                          textTransform: 'uppercase',
                          letterSpacing: '0.08em',
                          color: 'rgba(0,0,0,0.45)',
                        }}
                      >
                        Ticket
                      </Typography>
                      <Typography
                        sx={{
                          fontSize: 13,
                          fontWeight: 800,
                          color: validationResult.tier_color || '#333',
                          mt: 0.2,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {validationResult.tier_name}
                      </Typography>
                    </Box>
                  </Stack>

                  {admitError ? (
                    <Box
                      sx={{
                        mt: 1,
                        p: 1,
                        borderRadius: '12px',
                        background: '#FEE2E2',
                        border: '0.5px solid rgba(220, 38, 38, 0.25)',
                      }}
                    >
                      <Typography
                        sx={{ fontSize: 12, fontWeight: 900, color: '#B91C1C' }}
                      >
                        {admitError}
                      </Typography>
                    </Box>
                  ) : null}

                  <Stack direction="row" spacing={1} sx={{ mt: 1.25 }}>
                    <Button
                      onClick={() => void handleAdmit()}
                      disabled={isAdmitting}
                      disableElevation
                      variant="contained"
                      sx={{
                        flex: 1,
                        textTransform: 'none',
                        borderRadius: 999,
                        py: 0.95,
                        fontWeight: 800,
                        background: '#1D9E75',
                        '&:hover': { background: '#168564' },
                      }}
                    >
                      {isAdmitting ? 'Admitting...' : 'ADMIT'}
                    </Button>
                    <Button
                      onClick={handleResetEntry}
                      disableElevation
                      variant="outlined"
                      sx={{
                        px: 2,
                        textTransform: 'none',
                        borderRadius: 999,
                        py: 0.95,
                        fontWeight: 800,
                        border: '0.5px solid #F0EDE8',
                        color: '#5F5E5A',
                        '&:hover': { background: '#FAFAF9' },
                      }}
                    >
                      CANCEL
                    </Button>
                  </Stack>
                </Box>
              ) : null}

              {admitted ? (
                <Box
                  sx={{
                    mt: 2,
                    p: 1.25,
                    borderRadius: '14px',
                    background: '#EAF3DE',
                    border: '0.5px solid rgba(29, 158, 117, 0.35)',
                  }}
                >
                  <Typography sx={{ fontSize: 12, fontWeight: 900, color: '#3B6D11' }}>
                    VALID ENTRY
                  </Typography>
                  <Typography sx={{ fontSize: 12, color: '#5F5E5A', mt: 0.5 }}>
                    {validationResult?.attendee_name || 'GUEST'} •{' '}
                    {validationResult?.tier_name || 'Standard'} Pass
                  </Typography>

                  <Button
                    fullWidth
                    onClick={handleResetEntry}
                    disableElevation
                    variant="contained"
                    sx={{
                      mt: 1.25,
                      textTransform: 'none',
                      borderRadius: 999,
                      py: 1,
                      fontWeight: 800,
                      background: '#1D9E75',
                      '&:hover': { background: '#168564' },
                    }}
                  >
                    <TicketIcon size={16} style={{ marginRight: 8 }} />
                    SCAN NEXT
                  </Button>
                </Box>
              ) : null}
            </Box>
          ) : null}

          <Box
            sx={{
              mt: 2,
              maxHeight: 220,
              overflowY: 'auto',
              borderRadius: '14px',
              border: '0.5px solid #F0EDE8',
              background: '#fff',
              p: 1.25,
            }}
          >
            {attendees.length === 0 ? (
              <Typography
                sx={{
                  textAlign: 'center',
                  fontSize: 13,
                  color: '#888780',
                  fontStyle: 'italic',
                  py: 2,
                }}
              >
                No one has checked in yet...
              </Typography>
            ) : (
              <Stack spacing={1}>
                {attendees.map((att: any, idx: number) => {
                  const isUsed = att.status === 'used';
                  const name = att.attendee_name || att.user.username;
                  return (
                    <Box
                      key={att.id}
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: 1,
                        p: 1,
                        borderRadius: '12px',
                        border: '0.5px solid #F0EDE8',
                        background: '#FAFAF9',
                      }}
                      style={{
                        transform: `rotate(${idx % 2 === 0 ? 0.15 : -0.15}deg)`,
                      }}
                    >
                      <Stack
                        direction="row"
                        alignItems="center"
                        spacing={1}
                        sx={{ minWidth: 0 }}
                      >
                        <Box
                          sx={{
                            width: 36,
                            height: 36,
                            borderRadius: '50%',
                            border: '0.5px solid #F0EDE8',
                            background: '#fff',
                            overflow: 'hidden',
                            flexShrink: 0,
                          }}
                        >
                          {att.user.avatar ? (
                            <Box
                              component="img"
                              src={att.user.avatar}
                              alt={att.user.username}
                              sx={{ width: '100%', height: '100%', objectFit: 'cover' }}
                            />
                          ) : (
                            <Typography
                              sx={{
                                width: '100%',
                                height: '100%',
                                display: 'grid',
                                placeItems: 'center',
                                fontWeight: 900,
                                color: '#9CA3AF',
                              }}
                            >
                              {String(att.user.username || '?')[0].toUpperCase()}
                            </Typography>
                          )}
                        </Box>

                        <Box sx={{ minWidth: 0 }}>
                          <Typography
                            sx={{
                              fontSize: 13,
                              fontWeight: 800,
                              color: '#1A1A1A',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                            }}
                          >
                            {name}
                          </Typography>
                          <Typography
                            sx={{
                              fontSize: 10,
                              fontWeight: 800,
                              color: '#888780',
                              textTransform: 'uppercase',
                              letterSpacing: '0.06em',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                            }}
                          >
                            {att.ticket_type} • {att.status}
                          </Typography>
                        </Box>
                      </Stack>

                      <Box
                        sx={{
                          px: 1.25,
                          py: 0.5,
                          borderRadius: 999,
                          border: '0.5px solid',
                          flexShrink: 0,
                          fontSize: 10,
                          fontWeight: 900,
                          letterSpacing: '0.06em',
                          textTransform: 'uppercase',
                          background: isUsed ? '#EAF3DE' : '#EEEDFE',
                          borderColor: isUsed ? 'rgba(29, 158, 117, 0.5)' : '#E0D9FF',
                          color: isUsed ? '#3B6D11' : '#185FA5',
                        }}
                      >
                        {isUsed ? 'Admitted' : 'Pending'}
                      </Box>
                    </Box>
                  );
                })}
              </Stack>
            )}
          </Box>

          <Box sx={{ mt: 2, pt: 2, borderTop: '0.5px dashed #EDE8E1' }}>
            <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1.25 }}>
              <BoxIcon size={20} color="#1A1A1A" />
              <Typography sx={{ fontSize: 14, fontWeight: 900, color: '#1A1A1A' }}>
                Vendor Services ({admittedVendorsCount} / {vendorApplications.length})
              </Typography>
            </Stack>

            <Box
              sx={{
                maxHeight: 160,
                overflowY: 'auto',
                borderRadius: '14px',
                border: '0.5px solid #F0EDE8',
                background: '#fff',
                p: 1.25,
              }}
            >
              {vendorApplications.length === 0 ? (
                <Typography
                  sx={{
                    textAlign: 'center',
                    fontSize: 13,
                    color: '#888780',
                    fontStyle: 'italic',
                    py: 2,
                  }}
                >
                  No services confirmed yet...
                </Typography>
              ) : (
                <Stack spacing={1}>
                  {vendorApplications.map((app: any) => {
                    const admittedAt = Boolean(app.admitted_at);
                    return (
                      <Box
                        key={app.id}
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          gap: 1,
                          p: 1,
                          borderRadius: '12px',
                          border: '0.5px solid #F0EDE8',
                          background: '#FAFAF9',
                        }}
                      >
                        <Stack
                          direction="row"
                          alignItems="center"
                          spacing={1}
                          sx={{ minWidth: 0 }}
                        >
                          <Box
                            sx={{
                              width: 36,
                              height: 36,
                              borderRadius: '50%',
                              background: '#EEF2FF',
                              border: '0.5px solid #E0E7FF',
                              color: '#4F46E5',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              flexShrink: 0,
                              fontWeight: 900,
                              overflow: 'hidden',
                            }}
                          >
                            {app.vendor_name
                              ? String(app.vendor_name)[0].toUpperCase()
                              : 'V'}
                          </Box>

                          <Box sx={{ minWidth: 0 }}>
                            <Typography
                              sx={{
                                fontSize: 13,
                                fontWeight: 800,
                                color: '#1A1A1A',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap',
                              }}
                            >
                              {app.vendor_name}
                            </Typography>
                            <Typography
                              sx={{
                                fontSize: 10,
                                fontWeight: 900,
                                textTransform: 'uppercase',
                                letterSpacing: '0.06em',
                                color: '#4F46E5',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap',
                              }}
                            >
                              {app.need_title}
                            </Typography>
                          </Box>
                        </Stack>

                        <Box
                          sx={{
                            px: 1.25,
                            py: 0.5,
                            borderRadius: 999,
                            border: '0.5px solid',
                            flexShrink: 0,
                            fontSize: 10,
                            fontWeight: 900,
                            letterSpacing: '0.06em',
                            textTransform: 'uppercase',
                            background: admittedAt ? '#EEF2FF' : '#F3F4F6',
                            borderColor: admittedAt
                              ? 'rgba(79, 70, 229, 0.45)'
                              : '#E5E7EB',
                            color: admittedAt ? '#4F46E5' : '#6B7280',
                          }}
                        >
                          {admittedAt ? 'Admitted' : 'Pending'}
                        </Box>
                      </Box>
                    );
                  })}
                </Stack>
              )}
            </Box>
          </Box>
        </Box>
      </Stack>

      {isScannerOpen ? (
        <QRScannerModal
          isOpen={isScannerOpen}
          onClose={() => setIsScannerOpen(false)}
          onScanResult={async (barcode) => {
            const res = await validateTicket({
              barcode: barcode.trim(),
              eventId: event.id,
            });
            return res.success ? res.data : null;
          }}
          onAdmitEvent={async (ticketId, isVendor) => {
            const res = await admitTicket(ticketId, event.id, isVendor);
            if (res.success) {
              if (isVendor) refetchNeeds();
              else refetchAttendees();
              return true;
            }
            return false;
          }}
        />
      ) : null}
    </Box>
  );
}
