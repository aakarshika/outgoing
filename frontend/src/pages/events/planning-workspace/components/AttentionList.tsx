import { Box, Button, Typography } from '@mui/material';
import { useState } from 'react';

import { useReviewNeedApplication } from '@/features/needs/hooks';
import type { EventNeed, NeedApplication } from '@/types/needs';
import type { PlanningChecklistRuleKey } from '@/features/events/planningChecklistConfig';

export type ChecklistAttentionPayload =
  | { kind: 'lifecycle'; due: string; resolver?: PlanningChecklistRuleKey }
  | {
      kind: 'sales';
      due: string;
      resolver?: PlanningChecklistRuleKey;
      soldCount: number;
      capacity: number | null;
      minRequired: number;
      progressPct: number;
      isReady: boolean;
    }
  | { kind: 'default'; due: string; resolver?: PlanningChecklistRuleKey };

type PendingApplicationWithNeed = {
  need: EventNeed;
  application: NeedApplication;
};

type AttentionListProps = {
  /** When false (no event need slots), applications + needs rows are omitted. */
  hasDefinedEventNeeds: boolean;
  pendingApplicationsWithNeed: PendingApplicationWithNeed[];
  pendingAppsCount: number;
  pendingAppsIcon: string;
  attentionAppTitle: string;
  attentionAppSub: string;
  needsAttentionTitle: string;
  needsAttentionSub: string;
  checklistAttention: ChecklistAttentionPayload[];
  checklistLifecycleActionLabel?: string;
  onChecklistLifecycleAction?: (resolver?: PlanningChecklistRuleKey) => void;
  onChecklistSalesAction?: () => void;
  onChecklistCoreAction?: () => void;
};

function getInitials(name: string) {
  const parts = (name || '').trim().split(/\s+/).filter(Boolean);
  return parts
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .filter(Boolean)
    .join('');
}

function AttentionApplicationsSection({
  pendingApplicationsWithNeed,
  pendingAppsCount,
  pendingAppsIcon,
  attentionAppTitle,
  attentionAppSub,
}: Pick<
  AttentionListProps,
  | 'pendingApplicationsWithNeed'
  | 'pendingAppsCount'
  | 'pendingAppsIcon'
  | 'attentionAppTitle'
  | 'attentionAppSub'
>) {
  const reviewNeedApplicationMutation = useReviewNeedApplication();
  const [expanded, setExpanded] = useState(false);
  const [showAll, setShowAll] = useState(false);

  const toRender = showAll ? pendingApplicationsWithNeed : pendingApplicationsWithNeed.slice(0, 1);
  const extraCount = pendingApplicationsWithNeed.length - toRender.length;

  return (
    <>
      <Box
        onClick={() => {
          if (pendingAppsCount === 0) return;
          setExpanded((v) => !v);
          setShowAll(false);
        }}
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 1.5,
          px: 1.75,
          py: 1.6,
          borderBottom: '0.5px solid #F0EDE8',
          cursor: pendingAppsCount === 0 ? 'default' : 'pointer',
        }}
      >
        <Box
          sx={{
            width: 8,
            height: 8,
            borderRadius: '50%',
            background: '#E24B4A',
            flexShrink: 0,
          }}
        />
        <Typography sx={{ fontSize: 18, flexShrink: 0 }}>{pendingAppsIcon}</Typography>
        <Box sx={{ flex: 1 }}>
          <Typography sx={{ fontSize: 14, fontWeight: 500, color: '#1A1A1A' }}>
            {attentionAppTitle}
          </Typography>
          <Typography
            sx={{
              fontSize: 12,
              color: '#888780',
              mt: 0.1,
              display: '-webkit-box',
              WebkitLineClamp: 1,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
            }}
          >
            {attentionAppSub}
          </Typography>
        </Box>
        <Typography sx={{ fontSize: 12, fontWeight: 500, color: '#D85A30', whiteSpace: 'nowrap' }}>
          Review ›
        </Typography>
      </Box>

      {expanded && pendingAppsCount > 0 ? (
        <Box sx={{ borderTop: '0.5px solid #F0EDE8', background: '#fff', py: 1 }}>
          {toRender.map(({ need, application }) => (
            <Box
              key={application.id}
              sx={{
                background: '#fff',
                borderRadius: '14px',
                padding: '14px 16px',
                margin: '10px 14px 0',
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                <Box
                  sx={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '50%',
                    background: '#534AB7',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '13px',
                    color: '#fff',
                    fontWeight: 500,
                    flexShrink: 0,
                  }}
                >
                  {getInitials(application.vendor_name)}
                </Box>

                <Box>
                  <Typography sx={{ fontSize: '14px', fontWeight: 500, color: '#1A1A1A' }}>
                    {application.vendor_name}
                  </Typography>
                  <Typography sx={{ fontSize: '11px', color: '#888780' }}>★ Pending review</Typography>
                </Box>

                <Typography
                  sx={{
                    fontSize: '11px',
                    fontWeight: 500,
                    padding: '2px 9px',
                    borderRadius: '999px',
                    background: '#EEEDFE',
                    color: '#3C3489',
                    marginLeft: 'auto',
                    flexShrink: 0,
                    whiteSpace: 'nowrap',
                  }}
                >
                  {need.category}
                </Typography>
              </Box>

              <Typography
                sx={{
                  fontSize: '13px',
                  color: '#444441',
                  lineHeight: 1.55,
                  fontStyle: 'italic',
                  borderLeft: '3px solid #FAECE7',
                  paddingLeft: '12px',
                  marginBottom: '14px',
                }}
              >
                &quot;{application.cover_letter || application.message || 'No cover letter provided.'}&quot;
              </Typography>

              <Box sx={{ display: 'flex', gap: '8px' }}>
                <Box
                  component="button"
                  onClick={async (e) => {
                    e.stopPropagation();
                    await reviewNeedApplicationMutation.mutateAsync({
                      applicationId: application.id,
                      status: 'accepted',
                    });
                    setExpanded(false);
                    setShowAll(false);
                  }}
                  disabled={reviewNeedApplicationMutation.isPending}
                  sx={{
                    fontFamily: `'DM Sans', sans-serif`,
                    fontSize: '13px',
                    fontWeight: 500,
                    flex: 1,
                    padding: '10px',
                    borderRadius: '999px',
                    border: 'none',
                    background: '#D85A30',
                    color: '#fff',
                    cursor: 'pointer',
                  }}
                >
                  Lock him in ✓
                </Box>

                <Box
                  component="button"
                  onClick={async (e) => {
                    e.stopPropagation();
                    await reviewNeedApplicationMutation.mutateAsync({
                      applicationId: application.id,
                      status: 'rejected',
                    });
                    setExpanded(false);
                    setShowAll(false);
                  }}
                  disabled={reviewNeedApplicationMutation.isPending}
                  sx={{
                    fontFamily: `'DM Sans', sans-serif`,
                    fontSize: '13px',
                    fontWeight: 500,
                    padding: '10px 18px',
                    borderRadius: '999px',
                    border: '0.5px solid #D3D1C7',
                    background: 'transparent',
                    color: '#1A1A1A',
                    cursor: 'pointer',
                  }}
                >
                  Pass
                </Box>
              </Box>
            </Box>
          ))}

          {extraCount > 0 ? (
            <Typography
              onClick={(e) => {
                e.stopPropagation();
                setShowAll(true);
              }}
              sx={{
                fontSize: '12px',
                color: '#888780',
                textAlign: 'center',
                marginTop: '10px',
                cursor: 'pointer',
              }}
            >
              +{extraCount} more applications
            </Typography>
          ) : null}
        </Box>
      ) : null}
    </>
  );
}

function AttentionNeedsRow({ title, sub }: { title: string; sub: string }) {
  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 1.5,
        px: 1.75,
        py: 1.6,
      }}
    >
      <Box
        sx={{
          width: 8,
          height: 8,
          borderRadius: '50%',
          background: '#EF9F27',
          flexShrink: 0,
        }}
      />
      <Typography sx={{ fontSize: 18, flexShrink: 0 }}>🧰</Typography>
      <Box sx={{ flex: 1 }}>
        <Typography sx={{ fontSize: 14, fontWeight: 500, color: '#1A1A1A' }}>{title}</Typography>
        <Typography
          sx={{
            fontSize: 12,
            color: '#888780',
            mt: 0.1,
            display: '-webkit-box',
            WebkitLineClamp: 1,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
          }}
        >
          {sub}
        </Typography>
      </Box>
      <Typography sx={{ fontSize: 12, fontWeight: 500, color: '#D85A30', whiteSpace: 'nowrap' }}>
        Find › (TODO)
      </Typography>
    </Box>
  );
}

/** Lifecycle checklist attention — due text only (layout can diverge later). */
function AttentionChecklistLifecycleItem({
  due,
  resolver,
  actionLabel,
  onAction,
}: {
  due: string;
  resolver?: PlanningChecklistRuleKey;
  actionLabel: string;
  onAction?: (resolver?: PlanningChecklistRuleKey) => void;
}) {
  return (
    <Box
      sx={{
        px: 1.75,
        py: 1.75,
        background:
          'linear-gradient(135deg, rgba(83, 74, 183, 0.07) 0%, rgba(216, 90, 48, 0.06) 100%)',
        borderLeft: '4px solid #534AB7',
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5, mb: 1.5 }}>
        <Box
          sx={{
            width: 8,
            height: 8,
            borderRadius: '50%',
            background: '#534AB7',
            flexShrink: 0,
            mt: 0.6,
          }}
        />
        <Typography sx={{ fontSize: 22, flexShrink: 0, lineHeight: 1 }}>🚀</Typography>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography
            sx={{
              fontSize: 11,
              fontWeight: 600,
              letterSpacing: '0.06em',
              textTransform: 'uppercase',
              color: '#534AB7',
              mb: 0.5,
            }}
          >
            Next step
          </Typography>
          <Typography sx={{ fontSize: 15, fontWeight: 600, color: '#1A1A1A', lineHeight: 1.45 }}>
            {due}
          </Typography>
        </Box>
      </Box>
      <Button
        fullWidth
        variant="contained"
        disableElevation
        onClick={(e) => {
          e.stopPropagation();
          onAction?.(resolver);
        }}
        sx={{
          fontFamily: `'DM Sans', sans-serif`,
          fontSize: 13,
          fontWeight: 600,
          textTransform: 'none',
          borderRadius: '999px',
          py: 1.1,
          background: '#D85A30',
          '&:hover': { background: '#c24e2a' },
        }}
      >
        {actionLabel}
      </Button>
    </Box>
  );
}

function AttentionChecklistSalesItem({
  due,
  soldCount,
  capacity,
  minRequired,
  progressPct,
  isReady,
  onSalesAction,
}: {
  due: string;
  soldCount: number;
  capacity: number | null;
  minRequired: number;
  progressPct: number;
  isReady: boolean;
  onSalesAction?: () => void;
}) {
  const salesLabel = capacity != null ? `${soldCount}/${capacity} sold` : `${soldCount} sold`;
  const requirementLabel =
    capacity != null ? `Min ${minRequired} (${Math.round(progressPct)}% progress)` : `Min ${minRequired} sold`;
  return (
    <Box
      onClick={(e) => {
        e.stopPropagation();
        onSalesAction?.();
      }}
      sx={{ px: 1.75, py: 1.5, cursor: onSalesAction ? 'pointer' : 'default' }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.2, mb: 0.9 }}>
        
      <Box
        sx={{
          width: 8,
          height: 8,
          borderRadius: '50%',
          background: '#EF9F27',
          flexShrink: 0,
        }}
      />
        <Typography sx={{ fontSize: 18, flexShrink: 0, lineHeight: 1 }}>📊</Typography>
        <Typography sx={{ fontSize: 14, fontWeight: 600, color: '#1A1A1A', lineHeight: 1.35 }}>
          Ticket sales readiness
        </Typography>
      </Box>
      <Box
        sx={{
          height: 7,
          bgcolor: '#ECE9E2',
          borderRadius: 999,
          overflow: 'hidden',
          mb: 0.75,
        }}
      >
        <Box
          sx={{
            height: 7,
            width: `${Math.max(0, Math.min(progressPct, 100))}%`,
            borderRadius: 999,
            bgcolor: isReady ? '#3B6D11' : '#D85A30',
          }}
        />
      </Box>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1 }}>
        <Typography sx={{ fontSize: 12, color: '#5F5E5A' }}>{salesLabel}</Typography>
        <Typography sx={{ fontSize: 12, fontWeight: 600, color: isReady ? '#3B6D11' : '#704707' }}>
          {isReady ? 'Ready' : requirementLabel}
        </Typography>
      </Box>
      <Typography sx={{ fontSize: 12, color: '#888780', mt: 0.6, lineHeight: 1.4 }}>
        {due}
      </Typography>
    </Box>
  );
}

function shouldOpenQuickEditFromCoreResolver(resolver?: PlanningChecklistRuleKey) {
  return resolver === 'cover_image_uploaded' || resolver === 'event_details_complete';
}

function AttentionChecklistDefaultItem({
  due,
  resolver,
  onCoreAction,
}: {
  due: string;
  resolver?: PlanningChecklistRuleKey;
  onCoreAction?: () => void;
}) {
  const isActionable = shouldOpenQuickEditFromCoreResolver(resolver);
  return (
    <Box
      sx={{ display: 'flex', alignItems: 'center', gap: 1.5, px: 1.75, py: 1.6 }}
      onClick={(e) => {
        e.stopPropagation();
        if (!isActionable) return;
        onCoreAction?.();
      }}
    >
      <Box
        sx={{
          width: 8,
          height: 8,
          borderRadius: '50%',
          background: '#EF9F27',
          flexShrink: 0,
        }}
      />
      <Typography sx={{ fontSize: 18, flexShrink: 0 }}>📣</Typography>
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Typography sx={{ fontSize: 14, fontWeight: 500, color: '#1A1A1A', lineHeight: 1.45 }}>
          {due}
        </Typography>
      </Box>
    </Box>
  );
}

function AttentionChecklistSection({
  payload,
  actionLabel,
  onLifecycleAction,
  onSalesAction,
  onCoreAction,
}: {
  payload: ChecklistAttentionPayload;
  actionLabel: string;
  onLifecycleAction?: (resolver?: PlanningChecklistRuleKey) => void;
  onSalesAction?: () => void;
  onCoreAction?: () => void;
}) {
  switch (payload.kind) {
    case 'lifecycle':
      return (
        <AttentionChecklistLifecycleItem
          due={payload.due}
          resolver={payload.resolver}
          actionLabel={actionLabel}
          onAction={onLifecycleAction}
        />
      );
    case 'default':
      return (
        <AttentionChecklistDefaultItem
          due={payload.due}
          resolver={payload.resolver}
          onCoreAction={onCoreAction}
        />
      );
    case 'sales':
      return (
        <AttentionChecklistSalesItem
          due={payload.due}
          soldCount={payload.soldCount}
          capacity={payload.capacity}
          minRequired={payload.minRequired}
          progressPct={payload.progressPct}
          isReady={payload.isReady}
          onSalesAction={onSalesAction}
        />
      );
    default:
      return null;
  }
}

export function AttentionList({
  hasDefinedEventNeeds,
  pendingApplicationsWithNeed,
  pendingAppsCount,
  pendingAppsIcon,
  attentionAppTitle,
  attentionAppSub,
  needsAttentionTitle,
  needsAttentionSub,
  checklistAttention,
  checklistLifecycleActionLabel = 'Continue',
  onChecklistLifecycleAction,
  onChecklistSalesAction,
  onChecklistCoreAction,
}: AttentionListProps) {
  const showChecklist = checklistAttention.length > 0;
  const showNeedsAndApplications = hasDefinedEventNeeds;

  if (!showNeedsAndApplications && !showChecklist) {
    return null;
  }

  return (
    <Box sx={{ mx: 2.1, mt: 0 }}>
      <Box
        sx={{ background: '#fff', borderRadius: 2, overflow: 'hidden', border: '0.5px solid #F0EDE8' }}
      >
        {showNeedsAndApplications ? (
          <>
            <AttentionApplicationsSection
              pendingApplicationsWithNeed={pendingApplicationsWithNeed}
              pendingAppsCount={pendingAppsCount}
              pendingAppsIcon={pendingAppsIcon}
              attentionAppTitle={attentionAppTitle}
              attentionAppSub={attentionAppSub}
            />

            <Box
              sx={{
                borderBottom: showChecklist ? '0.5px solid #F0EDE8' : 'none',
              }}
            >
              <AttentionNeedsRow title={needsAttentionTitle} sub={needsAttentionSub} />
            </Box>
          </>
        ) : null}

        {showChecklist
          ? checklistAttention.map((payload, idx) => (
              <Box
                // eslint-disable-next-line react/no-array-index-key
                key={`${payload.kind}-${idx}`}
                sx={{
                  borderTop: idx > 0 ? '0.5px solid #F0EDE8' : 'none',
                }}
              >
                <AttentionChecklistSection
                  payload={payload}
                  actionLabel={checklistLifecycleActionLabel}
                  onLifecycleAction={onChecklistLifecycleAction}
                  onSalesAction={onChecklistSalesAction}
                  onCoreAction={onChecklistCoreAction}
                />
              </Box>
            ))
          : null}
      </Box>
    </Box>
  );
}
