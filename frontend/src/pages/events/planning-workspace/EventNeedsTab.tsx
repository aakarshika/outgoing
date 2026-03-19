import { Avatar, Box, Button, Chip, Stack, Typography } from '@mui/material';
import { MessageCircle } from 'lucide-react';

import type { EventNeed, NeedApplication } from '@/types/needs';
import { getCategoryVisuals } from '@/constants/categories';

import { getNeedPresentation, WorkspaceCard } from './shared';

type EventNeedsTabProps = {
  assignedVendors: NeedApplication[];
  eventNeeds: EventNeed[];
  expandedNeedId: number | null;
  quickCreateNeedSeed: string;
  onAddNeed: () => void;
  onEditNeed: (need: EventNeed) => void;
  onOpenChat: () => void;
  onToggleNeed: (needId: number) => void;
  onReviewApplication: (
    applicationId: number,
    status: 'accepted' | 'rejected',
  ) => Promise<void>;
};

export function EventNeedsTab({
  assignedVendors,
  eventNeeds,
  expandedNeedId,
  quickCreateNeedSeed,
  onAddNeed,
  onEditNeed,
  onOpenChat,
  onToggleNeed,
  onReviewApplication,
}: EventNeedsTabProps) {
  return (
    <Stack spacing={2.25}>
      {assignedVendors.length > 0 ? (
        <WorkspaceCard
          title="Co-organizers chat"
          action={
            <Button
              variant="contained"
              size="small"
              startIcon={<MessageCircle size={14} />}
              onClick={onOpenChat}
              sx={{
                borderRadius: '999px',
                textTransform: 'none',
                background: '#D85A30',
                boxShadow: 'none',
              }}
            >
              Open chat
            </Button>
          }
        >
          <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
            {assignedVendors.map((application) => (
              <Chip
                key={application.id}
                avatar={
                  <Avatar>
                    {(application.vendor_name || '?').slice(0, 1).toUpperCase()}
                  </Avatar>
                }
                label={application.vendor_name}
                sx={{ background: '#F1EFE8' }}
              />
            ))}
          </Stack>
        </WorkspaceCard>
      ) : null}

      <WorkspaceCard
        title="Needs board"
        action={
          <Button
            variant="text"
            onClick={onAddNeed}
            sx={{ textTransform: 'none', color: '#D85A30', fontWeight: 600 }}
          >
            + Add need
          </Button>
        }
      >
        <Stack spacing={1.2}>
          {eventNeeds.length === 0 ? (
            <Box
              sx={{
                border: '0.5px dashed var(--color-border-secondary)',
                borderRadius: '18px',
                p: 2,
                background: '#fffdfb',
              }}
            >
              <Typography sx={{ fontSize: 13, color: 'var(--color-text-secondary)' }}>
                No needs have been added yet.
              </Typography>
              {quickCreateNeedSeed ? (
                <Typography sx={{ mt: 1, fontSize: 12, color: '#5A3909' }}>
                  Quick create seed: "{quickCreateNeedSeed}"
                </Typography>
              ) : null}
            </Box>
          ) : null}

          {eventNeeds.map((need) => {
            const presentation = getNeedPresentation(need);
            const visuals = getCategoryVisuals(need.category);
            const isExpanded = expandedNeedId === need.id;
            const acceptedApplications = (need.applications || []).filter(
              (application) => application.status === 'accepted',
            );

            return (
              <Box
                key={need.id}
                sx={{
                  border: '0.5px solid var(--color-border-tertiary)',
                  borderLeft: `3px solid ${visuals.accent}`,
                  borderRadius: '18px',
                  background: '#fffdfb',
                  overflow: 'hidden',
                }}
              >
                <Box
                  onClick={() => onToggleNeed(need.id)}
                  sx={{
                    p: 1.5,
                    cursor: 'pointer',
                  }}
                >
                  <Stack spacing={1.1}>
                    <Stack
                      direction={{ xs: 'column', sm: 'row' }}
                      spacing={1}
                      alignItems={{ xs: 'flex-start', sm: 'center' }}
                      justifyContent="space-between"
                    >
                      <Stack direction="row" spacing={1.1} alignItems="center">
                        <Box
                          sx={{
                            width: 34,
                            height: 34,
                            borderRadius: '11px',
                            display: 'grid',
                            placeItems: 'center',
                            fontSize: 15,
                            background: visuals.iconBg,
                            flexShrink: 0,
                          }}
                        >
                          {visuals.icon}
                        </Box>
                        <Box>
                          <Typography
                            sx={{
                              fontSize: 11,
                              color: 'var(--color-text-secondary)',
                            }}
                          >
                            {need.category}
                          </Typography>
                          <Typography sx={{ fontSize: 14, fontWeight: 700 }}>
                            {need.title}
                          </Typography>
                        </Box>
                      </Stack>
                      <Stack direction="row" spacing={0.8} alignItems="center">
                        <Chip
                          label={`${need.application_count || 0} applications`}
                          sx={{ height: 24, fontSize: 11, background: '#F1EFE8' }}
                        />
                        <Chip
                          label={presentation.statusLabel.toLowerCase()}
                          sx={{
                            height: 24,
                            background: presentation.statusBg,
                            color: presentation.statusColor,
                            fontSize: 11,
                            fontWeight: 600,
                          }}
                        />
                        <Button
                          variant="outlined"
                          size="small"
                          onClick={(event) => {
                            event.stopPropagation();
                            onEditNeed(need);
                          }}
                          sx={{ borderRadius: '999px', textTransform: 'none' }}
                        >
                          Edit
                        </Button>
                      </Stack>
                    </Stack>

                    {acceptedApplications.length > 0 ? (
                      <Stack direction="row" spacing={0.8} flexWrap="wrap" useFlexGap>
                        {acceptedApplications.map((application) => (
                          <Chip
                            key={application.id}
                            avatar={
                              <Avatar>
                                {(application.vendor_name || '?')
                                  .slice(0, 1)
                                  .toUpperCase()}
                              </Avatar>
                            }
                            label={application.vendor_name}
                            sx={{
                              height: 26,
                              fontSize: 12,
                              background: '#EAF3DE',
                            }}
                          />
                        ))}
                      </Stack>
                    ) : null}
                  </Stack>
                </Box>

                {isExpanded && need.application_count > 0 ? (
                  <Box
                    sx={{
                      px: 1.5,
                      pb: 1.5,
                      borderTop: '0.5px solid var(--color-border-tertiary)',
                      background: '#f9f9f9',
                    }}
                  >
                    <Stack spacing={1} sx={{ pt: 1.2 }}>
                      {(need.applications || []).map((application) => (
                        <Box
                          key={application.id}
                          sx={{
                            border: '0.5px solid var(--color-border-tertiary)',
                            borderRadius: '14px',
                            p: 1.15,
                          }}
                        >
                          <Stack spacing={0.9}>
                            <Stack
                              direction={{ xs: 'column', sm: 'row' }}
                              justifyContent="space-between"
                              spacing={0.75}
                            >
                              <Typography sx={{ fontSize: 13, fontWeight: 600 }}>
                                {application.vendor_name}
                              </Typography>
                              <Chip
                                label={application.status}
                                size="small"
                                sx={{
                                  width: 'fit-content',
                                  textTransform: 'capitalize',
                                }}
                              />
                            </Stack>
                            <Typography
                              sx={{
                                fontSize: 12,
                                color: 'var(--color-text-secondary)',
                              }}
                            >
                              {application.message ||
                                application.cover_letter ||
                                'No cover letter provided.'}
                            </Typography>
                            {application.status === 'pending' ? (
                              <Stack direction="row" spacing={0.8}>
                                <Button
                                  size="small"
                                  variant="contained"
                                  onClick={() =>
                                    onReviewApplication(application.id, 'accepted')
                                  }
                                  sx={{
                                    textTransform: 'none',
                                    borderRadius: '999px',
                                    background: '#1D9E75',
                                    boxShadow: 'none',
                                  }}
                                >
                                  Accept
                                </Button>
                                <Button
                                  size="small"
                                  variant="outlined"
                                  onClick={() =>
                                    onReviewApplication(application.id, 'rejected')
                                  }
                                  sx={{
                                    textTransform: 'none',
                                    borderRadius: '999px',
                                  }}
                                >
                                  Reject
                                </Button>
                              </Stack>
                            ) : null}
                          </Stack>
                        </Box>
                      ))}
                    </Stack>
                  </Box>
                ) : null}
              </Box>
            );
          })}
        </Stack>
      </WorkspaceCard>
    </Stack>
  );
}
