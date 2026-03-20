import { Box, Typography } from '@mui/material';
import { useState } from 'react';

import { useReviewNeedApplication } from '@/features/needs/hooks';
import type { EventNeed, NeedApplication } from '@/types/needs';

type PendingApplicationWithNeed = {
  need: EventNeed;
  application: NeedApplication;
};

type AttentionListProps = {
  pendingApplicationsWithNeed: PendingApplicationWithNeed[];
  pendingAppsCount: number;
  pendingAppsIcon: string;
  attentionAppTitle: string;
  attentionAppSub: string;
  attention2Title: string;
  attention2Sub: string;
  showChecklistAttention3: boolean;
  attention3Title: string;
  attention3Sub: string;
};

export function AttentionList({
  pendingApplicationsWithNeed,
  pendingAppsCount,
  pendingAppsIcon,
  attentionAppTitle,
  attentionAppSub,
  attention2Title,
  attention2Sub,
  showChecklistAttention3,
  attention3Title,
  attention3Sub,
}: AttentionListProps) {
  const reviewNeedApplicationMutation = useReviewNeedApplication();
  const [showPendingApps, setShowPendingApps] = useState(false);
  const [showAllPendingApps, setShowAllPendingApps] = useState(false);

  const getInitials = (name: string) => {
    const parts = (name || '').trim().split(/\s+/).filter(Boolean);
    return parts
      .slice(0, 2)
      .map((p) => p[0]?.toUpperCase())
      .filter(Boolean)
      .join('');
  };

  const pendingAppsToRender = showAllPendingApps
    ? pendingApplicationsWithNeed
    : pendingApplicationsWithNeed.slice(0, 1);
  const extraAppsCount = pendingApplicationsWithNeed.length - pendingAppsToRender.length;

  return (
    <Box sx={{ mx: 2.1, mt: 0 }}>
      <Box sx={{ background: '#fff', borderRadius: 2, overflow: 'hidden', border: '0.5px solid #F0EDE8' }}>
        <Box
          onClick={() => {
            if (pendingAppsCount === 0) return;
            setShowPendingApps((v) => !v);
            setShowAllPendingApps(false);
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
          <Typography
            sx={{ fontSize: 12, fontWeight: 500, color: '#D85A30', whiteSpace: 'nowrap' }}
          >
            Review ›
          </Typography>
        </Box>

        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1.5,
            px: 1.75,
            py: 1.6,
            borderBottom: showChecklistAttention3 ? '0.5px solid #F0EDE8' : 'none',
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
            <Typography sx={{ fontSize: 14, fontWeight: 500, color: '#1A1A1A' }}>
              {attention2Title}
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
              {attention2Sub}
            </Typography>
          </Box>
          <Typography
            sx={{ fontSize: 12, fontWeight: 500, color: '#D85A30', whiteSpace: 'nowrap' }}
          >
            Find ›
          </Typography>
        </Box>

        {showChecklistAttention3 ? (
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
            <Typography sx={{ fontSize: 18, flexShrink: 0 }}>📣</Typography>
            <Box sx={{ flex: 1 }}>
              <Typography sx={{ fontSize: 14, fontWeight: 500, color: '#1A1A1A' }}>
                {attention3Title}
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
                {attention3Sub}
              </Typography>
            </Box>
            <Typography
              sx={{ fontSize: 12, fontWeight: 500, color: '#D85A30', whiteSpace: 'nowrap' }}
            >
              Share ›
            </Typography>
          </Box>
        ) : null}

        {showPendingApps && pendingAppsCount > 0 ? (
          <Box
            sx={{
              borderTop: '0.5px solid #F0EDE8',
              background: '#fff',
              py: 1,
            }}
          >
            {pendingAppsToRender.map(({ need, application }) => (
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
                      setShowPendingApps(false);
                      setShowAllPendingApps(false);
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
                      setShowPendingApps(false);
                      setShowAllPendingApps(false);
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

            {extraAppsCount > 0 ? (
              <Typography
                onClick={(e) => {
                  e.stopPropagation();
                  setShowAllPendingApps(true);
                }}
                sx={{
                  fontSize: '12px',
                  color: '#888780',
                  textAlign: 'center',
                  marginTop: '10px',
                  cursor: 'pointer',
                }}
              >
                +{extraAppsCount} more applications
              </Typography>
            ) : null}
          </Box>
        ) : null}
      </Box>
    </Box>
  );
}

