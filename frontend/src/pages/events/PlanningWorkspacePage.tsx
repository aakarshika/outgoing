import {
  Avatar,
  Box,
  Button,
  Chip,
  Container,
  LinearProgress,
  Stack,
  Typography,
} from '@mui/material';
import { ArrowLeft, Check, MessageCircle, Plus, Search } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const progressSteps = [
  { label: 'Details set', status: 'done', value: 'check' },
  { label: 'Tickets configured', status: 'done', value: 'check' },
  { label: 'Needs being filled', status: 'active', value: '2' },
  { label: 'Ready to go', status: 'todo', value: '4' },
] as const;

const eventDetails = [
  { label: 'Date & time', value: 'Sat 15 Mar · 8:00 PM' },
  { label: 'Location', value: 'Indiranagar Social, Bengaluru' },
  { label: 'Category', value: 'Music' },
  { label: 'Format', value: 'In person · One-time' },
] as const;

const ticketMetrics = [
  { label: 'Total sold', value: '34' },
  { label: 'Revenue', value: '₹9,450' },
] as const;

const ticketRows = [
  {
    name: 'Early Bird',
    price: '₹250',
    sold: '20 / 20 sold',
    progress: 100,
    color: '#D85A30',
  },
  {
    name: 'Standard',
    price: '₹350',
    sold: '14 / 20 sold',
    progress: 70,
    color: '#D85A30',
  },
  {
    name: 'Contributor',
    price: 'Free',
    sold: '0 / 5 filled',
    progress: 0,
    color: '#1D9E75',
  },
] as const;

const needRows = [
  {
    title: 'DJ / Music',
    subtitle: 'Karan Mehta · confirmed',
    icon: '🎧',
    iconBg: '#EAF3DE',
    status: 'Filled ✓',
    reward: 'Free entry',
    accent: '#1D9E75',
    statusBg: '#EAF3DE',
    statusColor: '#3B6D11',
  },
  {
    title: 'Photographer',
    subtitle: '3 cover letters waiting',
    icon: '📷',
    iconBg: '#E6F1FB',
    status: '3 pending',
    reward: '40% off ticket',
    accent: '#378ADD',
    statusBg: '#E6F1FB',
    statusColor: '#185FA5',
  },
  {
    title: 'Someone to bring speakers',
    subtitle: 'No applicants yet',
    icon: '🔊',
    iconBg: '#FAEEDA',
    status: 'Open',
    reward: '₹200 reimbursed',
    accent: '#EF9F27',
    statusBg: '#FAEEDA',
    statusColor: '#854F0B',
  },
] as const;

const checklistRows = [
  { label: 'Event details complete', status: 'done' },
  { label: 'Tickets published', status: 'done' },
  { label: 'DJ slot filled', status: 'done' },
  {
    label: 'Photographer slot filled',
    status: 'todo',
    due: '3 applications to review',
  },
  { label: 'Speakers still needed', status: 'warn', due: '48h before event' },
  { label: 'Add cover photo', status: 'todo', due: 'Recommended' },
] as const;

const vendorGroups = [
  {
    title: 'Your people',
    vendors: [
      {
        name: 'Karan Mehta',
        tag: 'Music buddy · brought sound to 2 events',
        avatar: 'K',
        color: '#534AB7',
        action: 'Assign',
        accent: true,
      },
      {
        name: 'Priya Nair',
        tag: 'Art buddy · photographer at 3 events',
        avatar: 'P',
        color: '#1D9E75',
        action: 'Assign',
        accent: true,
      },
    ],
  },
  {
    title: 'Community',
    vendors: [
      {
        name: 'Rohan DJ',
        tag: 'DJ · contributed to 8 events on Outgoing',
        avatar: 'R',
        color: '#D85A30',
        action: 'Invite',
        accent: false,
      },
    ],
  },
] as const;

const chatRows = [
  { type: 'system', text: 'Karan confirmed the DJ slot ✓' },
  {
    type: 'incoming',
    avatar: 'A',
    color: '#534AB7',
    text: '3 photog applications came in, you seen them?',
  },
  {
    type: 'outgoing',
    avatar: 'P',
    color: '#D85A30',
    text: 'Checking now — the Priya one looks good',
  },
  { type: 'system', text: '34 tickets sold · ₹9,450 collected' },
] as const;

function WorkspaceCard({
  title,
  action,
  children,
}: {
  title: string;
  action?: string;
  children: React.ReactNode;
}) {
  return (
    <Box
      sx={{
        mt: 1.5,
        background: 'rgb(255, 253, 251)',
        border: '0.5px solid var(--color-border-tertiary)',
        borderRadius: '24px',
        overflow: 'hidden',
      }}
    >
      <Stack
        direction="row"
        alignItems="center"
        justifyContent="space-between"
        sx={{
          px: 2,
          py: 1.5,
          borderBottom: '0.5px solid var(--color-border-tertiary)',
        }}
      >
        <Typography
          sx={{
            fontFamily: 'Syne, sans-serif',
            fontSize: 14,
            fontWeight: 700,
            color: 'var(--color-text-primary)',
          }}
        >
          {title}
        </Typography>
        {action ? (
          <Typography sx={{ fontSize: 12, color: '#D85A30', fontWeight: 500 }}>
            {action}
          </Typography>
        ) : null}
      </Stack>
      <Box sx={{ p: 2 }}>{children}</Box>
    </Box>
  );
}

function FauxInput({ value, width }: { value: string; width?: number | string }) {
  return (
    <Box
      sx={{
        width: width || '100%',
        px: 1.5,
        py: 1.2,
        border: '0.5px solid var(--color-border-secondary)',
        borderRadius: '16px',
        fontSize: 14,
        color: 'var(--color-text-primary)',
        background: 'var(--color-background-primary)',
      }}
    >
      {value}
    </Box>
  );
}

function AddNeedOverlay({ onClose }: { onClose: () => void }) {
  const roleChips = [
    { label: '🎧 DJ / Music', active: false },
    { label: '📷 Photography', active: true },
    { label: '🍽️ Food & Catering', active: false },
    { label: '🔊 Equipment', active: false },
    { label: '🏠 Venue', active: false },
    { label: '👥 Staffing', active: false },
  ] as const;

  const compensationOptions = [
    {
      title: 'Free entry',
      subtitle:
        'Vendor gets a free ticket (value ₹350). Exact match — cleanest option.',
      tag: 'Ticket value = ₹350 · Full cover',
      active: true,
      background: '#FAECE7',
      border: '#D85A30',
      titleColor: '#712B13',
      tagBg: '#FAECE7',
      tagColor: '#712B13',
    },
    {
      title: '₹350 cash payment',
      subtitle:
        "Vendor doesn't attend — gets paid directly after the event. Good for professionals not interested in coming.",
      tag: 'Cash · Paid post-event',
      active: true,
      background: '#E1F5EE',
      border: '#1D9E75',
      titleColor: '#085041',
      tagBg: '#E1F5EE',
      tagColor: '#085041',
    },
    {
      title: '40% discount on ticket',
      subtitle:
        'Vendor pays ₹210 instead of ₹350. Useful if you want them to have some skin in the game.',
      tag: 'Vendor pays ₹210 · You save ₹140',
      active: false,
      background: '#fff',
      border: 'var(--color-border-tertiary)',
      titleColor: 'var(--color-text-primary)',
      tagBg: '#FAEEDA',
      tagColor: '#854F0B',
    },
    {
      title: 'Free entry + ₹0 cash',
      subtitle:
        'Compensation exactly matches ticket price — no cash surplus in this case. If you increase the value above ₹350, a cash top-up will appear here.',
      tag: 'Currently: Free entry only',
      active: true,
      background: '#EEEDFE',
      border: '#534AB7',
      titleColor: '#26215C',
      tagBg: '#EEEDFE',
      tagColor: '#26215C',
    },
  ] as const;

  const cancelOptions = [
    {
      title: 'Full compensation regardless',
      desc: 'Vendor receives their full agreed compensation even if the event is cancelled. You carry the risk.',
      risk: 'Low risk for vendor',
      active: true,
      riskBg: '#EAF3DE',
      riskColor: '#3B6D11',
    },
    {
      title: 'Partial compensation — kill fee',
      desc: 'Vendor receives a fixed amount for their time and preparation. You specify the amount below.',
      risk: 'Medium risk for vendor',
      active: false,
      riskBg: '#FAEEDA',
      riskColor: '#854F0B',
    },
    {
      title: 'Compensation only if cancelled within 48h of event',
      desc: 'Vendor is protected only if you cancel late. Early cancellation = no compensation.',
      risk: 'Medium risk for vendor',
      active: false,
      riskBg: '#FAEEDA',
      riskColor: '#854F0B',
    },
    {
      title: 'No compensation if cancelled',
      desc: 'Vendor accepts full risk. Should only be used for casual, friend-level arrangements.',
      risk: 'Vendor bears full risk',
      active: false,
      riskBg: '#FCEBEB',
      riskColor: '#A32D2D',
    },
  ] as const;

  return (
    <Box
      sx={{
        position: 'fixed',
        inset: 0,
        zIndex: 1200,
        background: 'rgb(255, 251, 249)',
        overflowY: 'auto',
        p: { xs: 2, md: 3 },
      }}
    >
      <Box sx={{ maxWidth: 780, mx: 'auto' }}>
        <Stack direction="row" alignItems="center" spacing={1.5} sx={{ mb: 3 }}>
          <Box
            onClick={onClose}
            sx={{
              fontSize: 14,
              color: 'var(--color-text-secondary)',
              cursor: 'pointer',
            }}
          >
            ← Needs board
          </Box>
          <Typography
            sx={{
              fontFamily: 'Syne, sans-serif',
              fontSize: 20,
              fontWeight: 800,
              color: 'var(--color-text-primary)',
            }}
          >
            Add a need
          </Typography>
          <Typography
            sx={{ ml: 'auto', fontSize: 12, color: 'var(--color-text-secondary)' }}
          >
            Rooftop Vinyl Night · 15 Mar
          </Typography>
        </Stack>

        <WorkspaceCard title="What do you need?">
          <Typography
            sx={{
              fontSize: 11,
              fontWeight: 500,
              textTransform: 'uppercase',
              letterSpacing: '0.07em',
              color: 'var(--color-text-secondary)',
              mb: 0.75,
            }}
          >
            Role type
          </Typography>
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: '1fr 1fr', md: '1fr 1fr 1fr' },
              gap: 1.25,
              mb: 2,
            }}
          >
            {roleChips.map((chip) => (
              <Box
                key={chip.label}
                sx={{
                  px: 1.75,
                  py: 1.1,
                  borderRadius: '16px',
                  border: '0.5px solid',
                  borderColor: chip.active
                    ? '#D85A30'
                    : 'var(--color-border-secondary)',
                  background: chip.active
                    ? '#FAECE7'
                    : 'var(--color-background-primary)',
                  color: chip.active ? '#712B13' : 'var(--color-text-primary)',
                  fontSize: 13,
                  fontWeight: 500,
                  textAlign: 'center',
                }}
              >
                {chip.label}
              </Box>
            ))}
          </Box>

          <Typography
            sx={{
              fontSize: 11,
              fontWeight: 500,
              textTransform: 'uppercase',
              letterSpacing: '0.07em',
              color: 'var(--color-text-secondary)',
              mb: 0.75,
            }}
          >
            Describe exactly what you need
          </Typography>
          <Typography
            sx={{
              fontSize: 11,
              color: 'var(--color-text-secondary)',
              fontStyle: 'italic',
              mb: 1,
            }}
          >
            Be specific — a good description gets better applicants.
          </Typography>
          <Box
            sx={{
              minHeight: 88,
              px: 1.5,
              py: 1.25,
              border: '0.5px solid var(--color-border-secondary)',
              borderRadius: '16px',
              fontSize: 14,
              color: 'var(--color-text-primary)',
              lineHeight: 1.5,
              mb: 1,
              background: 'var(--color-background-primary)',
            }}
          >
            Need someone to photograph the event from 7pm–11pm. Comfortable with
            low-light, candid crowd shots, and a few performer portraits. Edited gallery
            to be shared within 48 hours.
          </Box>

          <Box
            sx={{
              background: '#F1EFE8',
              borderRadius: '16px',
              p: 1.5,
              display: 'flex',
              alignItems: 'flex-start',
              gap: 1,
              mb: 1.5,
            }}
          >
            <Typography sx={{ fontSize: 14, mt: '1px' }}>✍</Typography>
            <Box>
              <Typography sx={{ fontSize: 13, color: '#444441', lineHeight: 1.5 }}>
                Looking for a photographer for Rooftop Vinyl Night on 15 Mar, 7–11pm.
                Must be comfortable with low-light and candid shooting. Edited gallery
                expected within 48 hours of the event.
              </Typography>
              <Typography
                sx={{ fontSize: 11, fontWeight: 500, color: '#D85A30', mt: 0.5 }}
              >
                Use this wording →
              </Typography>
            </Box>
          </Box>

          <Typography
            sx={{
              fontSize: 11,
              fontWeight: 500,
              textTransform: 'uppercase',
              letterSpacing: '0.07em',
              color: 'var(--color-text-secondary)',
              mb: 0.75,
            }}
          >
            Number of slots
          </Typography>
          <Stack direction="row" alignItems="center" spacing={1.25} sx={{ mb: 1.5 }}>
            <FauxInput value="1" width={80} />
            <Typography sx={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>
              slot(s) available for this role
            </Typography>
          </Stack>

          <Typography
            sx={{
              fontSize: 11,
              fontWeight: 500,
              textTransform: 'uppercase',
              letterSpacing: '0.07em',
              color: 'var(--color-text-secondary)',
              mb: 0.75,
            }}
          >
            Fill deadline
          </Typography>
          <Stack direction="row" alignItems="center" spacing={1.25}>
            <FauxInput value="12 Mar 2026" width={160} />
            <Typography sx={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>
              3 days before event — recommended
            </Typography>
          </Stack>
        </WorkspaceCard>

        <WorkspaceCard title="Compensation">
          <Typography
            sx={{
              fontSize: 11,
              fontWeight: 500,
              textTransform: 'uppercase',
              letterSpacing: '0.07em',
              color: 'var(--color-text-secondary)',
              mb: 0.75,
            }}
          >
            What is this role worth to you?
          </Typography>
          <Stack direction="row" alignItems="center" spacing={1.25} sx={{ mb: 2 }}>
            <Typography
              sx={{
                fontSize: 14,
                fontWeight: 500,
                color: 'var(--color-text-secondary)',
              }}
            >
              ₹
            </Typography>
            <FauxInput value="350" width={120} />
            <Typography sx={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>
              Standard ticket price is ₹350
            </Typography>
          </Stack>

          <Stack direction="row" alignItems="center" spacing={1.25} sx={{ mb: 1.75 }}>
            <Box
              sx={{
                flex: 1,
                height: '0.5px',
                background: 'var(--color-border-tertiary)',
              }}
            />
            <Typography
              sx={{
                fontSize: 11,
                fontWeight: 500,
                textTransform: 'uppercase',
                letterSpacing: '0.07em',
                color: 'var(--color-text-secondary)',
              }}
            >
              Choose how to offer this — vendor picks what works for them
            </Typography>
            <Box
              sx={{
                flex: 1,
                height: '0.5px',
                background: 'var(--color-border-tertiary)',
              }}
            />
          </Stack>

          <Typography
            sx={{
              fontSize: 12,
              color: 'var(--color-text-secondary)',
              fontStyle: 'italic',
              mb: 1.5,
            }}
          >
            Select all options you're willing to offer. The vendor will choose one.
          </Typography>

          <Stack spacing={1}>
            {compensationOptions.map((option) => (
              <Box
                key={option.title}
                sx={{
                  border: '0.5px solid',
                  borderColor: option.active
                    ? option.border
                    : 'var(--color-border-tertiary)',
                  borderRadius: '16px',
                  p: 1.5,
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 1.25,
                  background: option.active
                    ? option.background
                    : 'var(--color-background-primary)',
                }}
              >
                <Box
                  sx={{
                    width: 16,
                    height: 16,
                    borderRadius: '50%',
                    border: '1.5px solid',
                    borderColor: option.active
                      ? option.border
                      : 'var(--color-border-secondary)',
                    background: option.active ? option.border : 'transparent',
                    display: 'grid',
                    placeItems: 'center',
                    mt: '2px',
                    flexShrink: 0,
                  }}
                >
                  {option.active ? (
                    <Box
                      sx={{
                        width: 6,
                        height: 6,
                        borderRadius: '50%',
                        background: '#fff',
                      }}
                    />
                  ) : null}
                </Box>
                <Box>
                  <Typography
                    sx={{
                      fontSize: 13,
                      fontWeight: 500,
                      color: option.titleColor,
                      mb: 0.25,
                    }}
                  >
                    {option.title}
                  </Typography>
                  <Typography
                    sx={{
                      fontSize: 11,
                      color: 'var(--color-text-secondary)',
                      lineHeight: 1.4,
                    }}
                  >
                    {option.subtitle}
                  </Typography>
                  <Chip
                    label={option.tag}
                    sx={{
                      mt: 0.75,
                      height: 22,
                      background: option.tagBg,
                      color: option.tagColor,
                      fontSize: 10,
                      fontWeight: 500,
                    }}
                  />
                </Box>
              </Box>
            ))}
          </Stack>
        </WorkspaceCard>

        <WorkspaceCard title="Event thresholds">
          <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1.5 }}>
            <Typography
              sx={{
                fontSize: 11,
                fontWeight: 500,
                textTransform: 'uppercase',
                letterSpacing: '0.07em',
                color: 'var(--color-text-secondary)',
              }}
            >
              Minimum ticket sales for event to happen
            </Typography>
            <Chip
              label="For this need"
              sx={{
                height: 20,
                background: '#EAF3DE',
                color: '#3B6D11',
                fontSize: 10,
                fontWeight: 500,
              }}
            />
          </Stack>
          <Stack direction="row" alignItems="center" spacing={1.5} sx={{ mb: 1 }}>
            <FauxInput value="20" width={90} />
            <Typography sx={{ fontSize: 13, color: 'var(--color-text-secondary)' }}>
              tickets minimum
            </Typography>
            <Chip
              label="Currently at 34 ✓"
              sx={{ background: '#EAF3DE', color: '#3B6D11', fontSize: 12 }}
            />
          </Stack>
          <Typography
            sx={{ fontSize: 12, color: 'var(--color-text-secondary)', mb: 2 }}
          >
            If this threshold isn't reached before the deadline, the event may be
            cancelled. This affects what vendors are owed.
          </Typography>
          <Typography
            sx={{
              fontSize: 11,
              fontWeight: 500,
              textTransform: 'uppercase',
              letterSpacing: '0.07em',
              color: 'var(--color-text-secondary)',
              mb: 0.75,
            }}
          >
            Decision deadline
          </Typography>
          <Stack direction="row" alignItems="center" spacing={1.5}>
            <FauxInput value="13 Mar 2026" width={160} />
            <Typography sx={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>
              By this date, if threshold isn't met, you must cancel or proceed
            </Typography>
          </Stack>
        </WorkspaceCard>

        <WorkspaceCard title="If the event is cancelled">
          <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1.5 }}>
            <Typography
              sx={{
                fontSize: 11,
                fontWeight: 500,
                textTransform: 'uppercase',
                letterSpacing: '0.07em',
                color: 'var(--color-text-secondary)',
              }}
            >
              What happens to this vendor if the event doesn't happen?
            </Typography>
            <Chip
              label="Required"
              sx={{
                height: 20,
                background: '#FCEBEB',
                color: '#A32D2D',
                fontSize: 10,
                fontWeight: 500,
              }}
            />
          </Stack>

          <Stack spacing={1}>
            {cancelOptions.map((option) => (
              <Box
                key={option.title}
                sx={{
                  border: '0.5px solid',
                  borderColor: option.active
                    ? '#D85A30'
                    : 'var(--color-border-tertiary)',
                  borderRadius: '16px',
                  p: 1.5,
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 1.25,
                  background: option.active
                    ? '#FAECE7'
                    : 'var(--color-background-primary)',
                }}
              >
                <Box
                  sx={{
                    width: 16,
                    height: 16,
                    borderRadius: '50%',
                    border: '1.5px solid',
                    borderColor: option.active
                      ? '#D85A30'
                      : 'var(--color-border-secondary)',
                    background: option.active ? '#D85A30' : 'transparent',
                    display: 'grid',
                    placeItems: 'center',
                    mt: '2px',
                    flexShrink: 0,
                  }}
                >
                  {option.active ? (
                    <Box
                      sx={{
                        width: 6,
                        height: 6,
                        borderRadius: '50%',
                        background: '#fff',
                      }}
                    />
                  ) : null}
                </Box>
                <Box>
                  <Typography
                    sx={{
                      fontSize: 13,
                      fontWeight: 500,
                      color: 'var(--color-text-primary)',
                    }}
                  >
                    {option.title}
                  </Typography>
                  <Typography
                    sx={{
                      fontSize: 11,
                      color: 'var(--color-text-secondary)',
                      lineHeight: 1.4,
                      mt: 0.4,
                    }}
                  >
                    {option.desc}
                  </Typography>
                  <Chip
                    label={option.risk}
                    sx={{
                      mt: 0.75,
                      height: 22,
                      background: option.riskBg,
                      color: option.riskColor,
                      fontSize: 10,
                      fontWeight: 500,
                    }}
                  />
                </Box>
              </Box>
            ))}
          </Stack>

          <Box sx={{ background: '#FAEEDA', borderRadius: '16px', p: 1.75, mt: 1.5 }}>
            <Typography
              sx={{
                fontSize: 10,
                fontWeight: 600,
                textTransform: 'uppercase',
                letterSpacing: '0.07em',
                color: '#854F0B',
                mb: 0.75,
              }}
            >
              📄 Auto-generated condition shown to vendor
            </Typography>
            <Typography sx={{ fontSize: 13, color: '#412402', lineHeight: 1.6 }}>
              If Rooftop Vinyl Night is cancelled for any reason, the photographer will
              receive their full agreed compensation of ₹350 regardless of when the
              cancellation occurs. If the event does not reach the minimum threshold of
              20 tickets by 13 Mar 2026, the same condition applies.
            </Typography>
            <Typography
              sx={{ fontSize: 11, fontWeight: 500, color: '#D85A30', mt: 0.75 }}
            >
              Edit this wording →
            </Typography>
          </Box>

          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' },
              gap: 1.5,
              mt: 2,
            }}
          >
            <Button
              variant="outlined"
              onClick={onClose}
              sx={{
                borderRadius: '999px',
                py: 1.5,
                textTransform: 'none',
                borderWidth: '1.5px',
                color: 'var(--color-text-primary)',
                borderColor: 'var(--color-border-primary)',
              }}
            >
              Save draft
            </Button>
            <Button
              variant="contained"
              sx={{
                borderRadius: '999px',
                py: 1.5,
                textTransform: 'none',
                background: '#D85A30',
                boxShadow: 'none',
              }}
            >
              Post need
            </Button>
          </Box>
        </WorkspaceCard>
      </Box>
    </Box>
  );
}

export default function PlanningWorkspacePage() {
  const navigate = useNavigate();
  const [isAddNeedOpen, setIsAddNeedOpen] = useState(false);
  return (
    <Box sx={{ minHeight: '100vh', background: 'var(--color-background-tertiary)' }}>
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 1.5,
          px: { xs: 2, md: 3 },
          py: 2,
          background: 'var(--color-background-primary)',
          borderBottom: '0.5px solid var(--color-border-tertiary)',
        }}
      >
        <Box
          onClick={() => navigate(-1)}
          sx={{
            color: 'var(--color-text-secondary)',
            cursor: 'pointer',
            display: 'grid',
            placeItems: 'center',
          }}
        >
          <ArrowLeft size={18} />
        </Box>
        <Typography
          sx={{
            fontFamily: 'Syne, sans-serif',
            fontWeight: 800,
            fontSize: 18,
            color: '#D85A30',
          }}
        >
          outgoing
        </Typography>
        <Typography
          sx={{
            fontFamily: 'Syne, sans-serif',
            fontSize: 15,
            fontWeight: 700,
            color: 'var(--color-text-primary)',
          }}
        >
          Rooftop Vinyl Night
        </Typography>
        <Stack direction="row" spacing={1} alignItems="center" sx={{ ml: 'auto' }}>
          <Chip
            label="Draft"
            sx={{
              background: '#FAEEDA',
              color: '#854F0B',
              fontSize: 11,
              fontWeight: 500,
            }}
          />
          <Button
            variant="contained"
            sx={{
              borderRadius: '999px',
              px: 2.25,
              py: 0.85,
              textTransform: 'none',
              fontSize: 13,
              background: '#D85A30',
              boxShadow: 'none',
            }}
          >
            Publish event
          </Button>
        </Stack>
      </Box>

      <Box
        sx={{
          background: 'var(--color-background-primary)',
          borderBottom: '0.5px solid var(--color-border-tertiary)',
          px: { xs: 2, md: 3 },
          py: 2,
        }}
      >
        <Stack
          direction="row"
          alignItems="center"
          spacing={1}
          sx={{ overflowX: 'auto' }}
        >
          {progressSteps.map((step, index) => (
            <Stack
              key={step.label}
              direction="row"
              alignItems="center"
              spacing={1}
              sx={{ minWidth: 'fit-content' }}
            >
              <Stack direction="row" alignItems="center" spacing={0.75}>
                <Box
                  sx={{
                    width: 20,
                    height: 20,
                    borderRadius: '50%',
                    display: 'grid',
                    placeItems: 'center',
                    fontSize: 10,
                    fontWeight: 700,
                    background:
                      step.status === 'done'
                        ? '#EAF3DE'
                        : step.status === 'active'
                          ? '#D85A30'
                          : 'var(--color-background-secondary)',
                    color:
                      step.status === 'done'
                        ? '#3B6D11'
                        : step.status === 'active'
                          ? '#fff'
                          : 'var(--color-text-secondary)',
                  }}
                >
                  {step.value === 'check' ? <Check size={11} /> : step.value}
                </Box>
                <Typography
                  sx={{
                    fontSize: 12,
                    fontWeight: step.status === 'active' ? 700 : 500,
                    color:
                      step.status === 'done'
                        ? '#3B6D11'
                        : step.status === 'active'
                          ? '#D85A30'
                          : 'var(--color-text-secondary)',
                  }}
                >
                  {step.label}
                </Typography>
              </Stack>
              {index < progressSteps.length - 1 ? (
                <Box
                  sx={{
                    width: { xs: 24, md: 40 },
                    height: '1px',
                    background: 'var(--color-border-tertiary)',
                  }}
                />
              ) : null}
            </Stack>
          ))}
        </Stack>
      </Box>

      <Container maxWidth={false} sx={{ maxWidth: 1040, px: { xs: 2, md: 3 }, py: 3 }}>
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', lg: 'minmax(0, 1fr) 300px' },
            gap: 3,
          }}
        >
          <Stack spacing={2.5}>
            <WorkspaceCard title="Event details" action="Edit">
              <Box
                sx={{
                  display: 'grid',
                  gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' },
                  gap: 1.25,
                }}
              >
                {eventDetails.map((item) => (
                  <Stack key={item.label} spacing={0.5}>
                    <Typography
                      sx={{
                        fontSize: 10,
                        fontWeight: 500,
                        textTransform: 'uppercase',
                        letterSpacing: '0.07em',
                        color: 'var(--color-text-secondary)',
                      }}
                    >
                      {item.label}
                    </Typography>
                    <Typography
                      sx={{
                        fontSize: 14,
                        color: 'var(--color-text-primary)',
                        fontWeight: 500,
                      }}
                    >
                      {item.value}
                    </Typography>
                  </Stack>
                ))}
                <Stack spacing={0.5} sx={{ gridColumn: { xs: 'auto', sm: '1 / -1' } }}>
                  <Typography
                    sx={{
                      fontSize: 10,
                      fontWeight: 500,
                      textTransform: 'uppercase',
                      letterSpacing: '0.07em',
                      color: 'var(--color-text-secondary)',
                    }}
                  >
                    Description
                  </Typography>
                  <Typography
                    sx={{ fontSize: 13, color: 'var(--color-text-secondary)' }}
                  >
                    An evening of curated vinyl under the stars. BYOB welcome. Capacity
                    capped at 60.
                  </Typography>
                </Stack>
              </Box>
            </WorkspaceCard>

            <WorkspaceCard title="Tickets" action="+ Add type">
              <Box
                sx={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: 1,
                  mb: 1.5,
                }}
              >
                {ticketMetrics.map((metric) => (
                  <Box
                    key={metric.label}
                    sx={{
                      background: 'var(--color-background-secondary)',
                      borderRadius: '16px',
                      p: 1.5,
                    }}
                  >
                    <Typography
                      sx={{
                        fontSize: 11,
                        color: 'var(--color-text-secondary)',
                        mb: 0.5,
                      }}
                    >
                      {metric.label}
                    </Typography>
                    <Typography
                      sx={{
                        fontFamily: 'Syne, sans-serif',
                        fontSize: 20,
                        fontWeight: 700,
                        color: 'var(--color-text-primary)',
                      }}
                    >
                      {metric.value}
                    </Typography>
                  </Box>
                ))}
              </Box>

              <Stack spacing={1.25}>
                {ticketRows.map((ticket) => (
                  <Stack
                    key={ticket.name}
                    direction="row"
                    alignItems="center"
                    spacing={1.5}
                    sx={{
                      py: 1.25,
                      borderBottom: '0.5px solid var(--color-border-tertiary)',
                      '&:last-of-type': { borderBottom: 'none', pb: 0 },
                    }}
                  >
                    <Typography
                      sx={{
                        fontSize: 13,
                        fontWeight: 500,
                        color: 'var(--color-text-primary)',
                        minWidth: 90,
                      }}
                    >
                      {ticket.name}
                    </Typography>
                    <Typography
                      sx={{
                        fontSize: 13,
                        color: 'var(--color-text-secondary)',
                        minWidth: 50,
                      }}
                    >
                      {ticket.price}
                    </Typography>
                    <Box sx={{ flex: 1 }}>
                      <LinearProgress
                        variant="determinate"
                        value={ticket.progress}
                        sx={{
                          height: 6,
                          borderRadius: '999px',
                          backgroundColor: 'var(--color-background-secondary)',
                          '& .MuiLinearProgress-bar': {
                            borderRadius: '999px',
                            backgroundColor: ticket.color,
                          },
                        }}
                      />
                    </Box>
                    <Typography
                      sx={{
                        fontSize: 12,
                        color: 'var(--color-text-secondary)',
                        minWidth: 74,
                        textAlign: 'right',
                      }}
                    >
                      {ticket.sold}
                    </Typography>
                  </Stack>
                ))}
              </Stack>

              <Typography
                sx={{ mt: 1.25, fontSize: 11, color: 'var(--color-text-secondary)' }}
              >
                Min. threshold: 20 attendees ·{' '}
                <Box component="span" sx={{ color: '#3B6D11', fontWeight: 500 }}>
                  Reached ✓
                </Box>
              </Typography>
            </WorkspaceCard>

            <WorkspaceCard title="Needs board" action="Find vendors">
              <Stack spacing={1}>
                {needRows.map((need) => (
                  <Box
                    key={need.title}
                    sx={{
                      border: '0.5px solid var(--color-border-tertiary)',
                      borderLeft: `3px solid ${need.accent}`,
                      borderRadius: '16px',
                      p: 1.25,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1.25,
                    }}
                  >
                    <Box
                      sx={{
                        width: 36,
                        height: 36,
                        borderRadius: '12px',
                        display: 'grid',
                        placeItems: 'center',
                        fontSize: 16,
                        background: need.iconBg,
                        flexShrink: 0,
                      }}
                    >
                      {need.icon}
                    </Box>
                    <Box sx={{ flex: 1 }}>
                      <Typography
                        sx={{
                          fontSize: 13,
                          fontWeight: 500,
                          color: 'var(--color-text-primary)',
                        }}
                      >
                        {need.title}
                      </Typography>
                      <Typography
                        sx={{
                          fontSize: 11,
                          color: 'var(--color-text-secondary)',
                          mt: 0.25,
                        }}
                      >
                        {need.subtitle}
                      </Typography>
                    </Box>
                    <Box sx={{ textAlign: 'right', flexShrink: 0 }}>
                      <Chip
                        label={need.status}
                        sx={{
                          height: 24,
                          background: need.statusBg,
                          color: need.statusColor,
                          fontSize: 11,
                          fontWeight: 500,
                        }}
                      />
                      <Typography
                        sx={{
                          fontSize: 12,
                          color: 'var(--color-text-secondary)',
                          mt: 0.5,
                        }}
                      >
                        {need.reward}
                      </Typography>
                    </Box>
                  </Box>
                ))}
              </Stack>
              <Stack
                direction="row"
                alignItems="center"
                spacing={0.75}
                sx={{ pt: 1.5, cursor: 'pointer', width: 'fit-content' }}
                onClick={() => setIsAddNeedOpen(true)}
              >
                <Plus size={14} color="#D85A30" />
                <Typography sx={{ fontSize: 13, color: '#D85A30', fontWeight: 500 }}>
                  Add a need
                </Typography>
              </Stack>
            </WorkspaceCard>
          </Stack>

          <Stack spacing={2.5}>
            <WorkspaceCard title="Pre-event checklist">
              <Stack spacing={0}>
                {checklistRows.map((item, index) => (
                  <Stack
                    key={item.label}
                    direction="row"
                    spacing={1.1}
                    sx={{
                      py: 1,
                      borderBottom:
                        index < checklistRows.length - 1
                          ? '0.5px solid var(--color-border-tertiary)'
                          : 'none',
                    }}
                  >
                    <Box
                      sx={{
                        width: 16,
                        height: 16,
                        borderRadius: '4px',
                        border: '1.5px solid',
                        borderColor:
                          item.status === 'done'
                            ? '#1D9E75'
                            : item.status === 'warn'
                              ? '#E24B4A'
                              : 'var(--color-border-secondary)',
                        background: item.status === 'done' ? '#1D9E75' : 'transparent',
                        display: 'grid',
                        placeItems: 'center',
                        mt: '2px',
                        flexShrink: 0,
                      }}
                    >
                      {item.status === 'done' ? <Check size={10} color="#fff" /> : null}
                    </Box>
                    <Box>
                      <Typography
                        sx={{
                          fontSize: 13,
                          lineHeight: 1.4,
                          color:
                            item.status === 'warn'
                              ? '#A32D2D'
                              : item.status === 'done'
                                ? 'var(--color-text-secondary)'
                                : 'var(--color-text-primary)',
                          textDecoration:
                            item.status === 'done' ? 'line-through' : 'none',
                        }}
                      >
                        {item.label}
                      </Typography>
                      {'due' in item ? (
                        <Typography
                          sx={{
                            fontSize: 10,
                            mt: 0.25,
                            color:
                              item.status === 'warn'
                                ? '#E24B4A'
                                : 'var(--color-text-secondary)',
                          }}
                        >
                          {item.due}
                        </Typography>
                      ) : null}
                    </Box>
                  </Stack>
                ))}
              </Stack>
            </WorkspaceCard>

            <WorkspaceCard title="Find vendors & friends">
              <Stack
                direction="row"
                alignItems="center"
                spacing={1}
                sx={{
                  background: 'var(--color-background-secondary)',
                  border: '0.5px solid var(--color-border-tertiary)',
                  borderRadius: '999px',
                  px: 1.75,
                  py: 1,
                  mb: 1.5,
                  color: 'var(--color-text-secondary)',
                }}
              >
                <Search size={14} />
                <Typography sx={{ fontSize: 13 }}>
                  Find a DJ, ask Karan to bring...
                </Typography>
              </Stack>

              <Stack spacing={1.5}>
                {vendorGroups.map((group) => (
                  <Box key={group.title}>
                    <Typography
                      sx={{
                        fontSize: 10,
                        fontWeight: 600,
                        textTransform: 'uppercase',
                        letterSpacing: '0.08em',
                        color: 'var(--color-text-secondary)',
                        mb: 0.75,
                      }}
                    >
                      {group.title}
                    </Typography>
                    <Stack spacing={1}>
                      {group.vendors.map((vendor) => (
                        <Box
                          key={vendor.name}
                          sx={{
                            border: '0.5px solid var(--color-border-tertiary)',
                            borderRadius: '16px',
                            p: 1.25,
                          }}
                        >
                          <Stack direction="row" alignItems="center" spacing={1}>
                            <Avatar
                              sx={{
                                width: 32,
                                height: 32,
                                fontSize: 11,
                                fontWeight: 500,
                                bgcolor: vendor.color,
                              }}
                            >
                              {vendor.avatar}
                            </Avatar>
                            <Box sx={{ minWidth: 0 }}>
                              <Typography
                                sx={{
                                  fontSize: 13,
                                  fontWeight: 500,
                                  color: 'var(--color-text-primary)',
                                }}
                              >
                                {vendor.name}
                              </Typography>
                              <Typography
                                sx={{
                                  fontSize: 10,
                                  color: 'var(--color-text-secondary)',
                                }}
                              >
                                {vendor.tag}
                              </Typography>
                            </Box>
                            <Button
                              variant="outlined"
                              size="small"
                              sx={{
                                ml: 'auto',
                                minWidth: 'unset',
                                borderRadius: '999px',
                                px: 1.5,
                                py: 0.5,
                                fontSize: 11,
                                textTransform: 'none',
                                borderColor: vendor.accent
                                  ? '#D85A30'
                                  : 'var(--color-border-secondary)',
                                color: vendor.accent
                                  ? '#D85A30'
                                  : 'var(--color-text-primary)',
                              }}
                            >
                              {vendor.action}
                            </Button>
                          </Stack>
                        </Box>
                      ))}
                    </Stack>
                  </Box>
                ))}
              </Stack>
            </WorkspaceCard>

            <WorkspaceCard title="Co-organiser chat" action="">
              <Stack
                direction="row"
                spacing={0.75}
                sx={{ mb: 1.5, justifyContent: 'flex-end' }}
              >
                <Avatar
                  sx={{
                    width: 32,
                    height: 32,
                    fontSize: 11,
                    fontWeight: 500,
                    bgcolor: '#D85A30',
                  }}
                >
                  P
                </Avatar>
                <Avatar
                  sx={{
                    width: 32,
                    height: 32,
                    fontSize: 11,
                    fontWeight: 500,
                    bgcolor: '#534AB7',
                  }}
                >
                  A
                </Avatar>
              </Stack>
              <Stack spacing={1}>
                {chatRows.map((row, index) => {
                  if (row.type === 'system') {
                    return (
                      <Box
                        key={`${row.text}-${index}`}
                        sx={{ display: 'flex', justifyContent: 'center' }}
                      >
                        <Box
                          sx={{
                            background: '#EAF3DE',
                            borderRadius: '16px',
                            px: 1.25,
                            py: 0.75,
                            fontSize: 11,
                            color: '#27500A',
                            textAlign: 'center',
                            width: '100%',
                          }}
                        >
                          {row.text}
                        </Box>
                      </Box>
                    );
                  }

                  const outgoing = row.type === 'outgoing';
                  return (
                    <Stack
                      key={`${row.text}-${index}`}
                      direction={outgoing ? 'row-reverse' : 'row'}
                      spacing={1}
                      alignItems="flex-start"
                    >
                      <Avatar
                        sx={{
                          width: 26,
                          height: 26,
                          fontSize: 9,
                          fontWeight: 500,
                          bgcolor: row.color,
                        }}
                      >
                        {row.avatar}
                      </Avatar>
                      <Box
                        sx={{
                          background: 'var(--color-background-secondary)',
                          borderRadius: outgoing
                            ? '16px 0 16px 16px'
                            : '0 16px 16px 16px',
                          px: 1.25,
                          py: 0.9,
                          fontSize: 12,
                          color: 'var(--color-text-primary)',
                          lineHeight: 1.45,
                          maxWidth: 200,
                        }}
                      >
                        {row.text}
                      </Box>
                    </Stack>
                  );
                })}
              </Stack>
            </WorkspaceCard>
          </Stack>
        </Box>

        <Stack direction="row" justifyContent="flex-end" sx={{ pt: 2 }}>
          <Button
            variant="contained"
            startIcon={<MessageCircle size={14} />}
            sx={{
              borderRadius: '999px',
              px: 2.25,
              py: 1.2,
              textTransform: 'none',
              fontSize: 13,
              fontWeight: 500,
              background: '#D85A30',
              boxShadow: 'none',
            }}
          >
            Open chat
            <Box
              component="span"
              sx={{
                ml: 0.75,
                width: 18,
                height: 18,
                borderRadius: '50%',
                background: '#fff',
                color: '#D85A30',
                display: 'grid',
                placeItems: 'center',
                fontSize: 10,
                fontWeight: 700,
              }}
            >
              2
            </Box>
          </Button>
        </Stack>
      </Container>
      {isAddNeedOpen ? (
        <AddNeedOverlay onClose={() => setIsAddNeedOpen(false)} />
      ) : null}
    </Box>
  );
}
