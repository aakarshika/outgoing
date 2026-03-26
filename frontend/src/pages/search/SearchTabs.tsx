import { Box, Container, Stack, Typography } from '@mui/material';
import { useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { exploreTabs, normalizeTab, type ExploreTabId } from './searchTabsConfig';



export default function SearchTabs() {
  const [searchParams, setSearchParams] = useSearchParams();
  const rawTab = searchParams.get('tab');
  const tab = normalizeTab(rawTab);
  useEffect(() => {
    if (rawTab === tab) return;
    const next = new URLSearchParams(searchParams);
    next.set('tab', tab);
    setSearchParams(next, { replace: true });
  }, [rawTab, searchParams, setSearchParams, tab]);

  const tabMetrics = useMemo(() => {
    const progress = 1.5;

    return {
      /** Fully hidden at end of tab shrink range (no mini title). */
      exploreSectionMaxHeight: 140 * (1 - progress),
      exploreSectionOpacity: 1 - progress,
      borderRadius: 22 - progress * 4,
      px: 1.4 - progress * 0.3,
      py: 1.2 - progress * 0.35,
      my: 2 - progress * 0.6,
      minWidthXs: 118 - progress * 18,
      minWidthMd: 128 - progress * 18,
      iconSize: 44 - progress * 10,
      iconRadius: 16 - progress * 4,
      iconStroke: 2.4 - progress * 0.3,
      glyphSize: 24 - progress * 4,
      labelFontSize: 13 - progress,
      stackSpacing: 0.8 - progress * 0.35,
    };
  }, []);



  const handleTabChange = (nextTab: ExploreTabId) => {
    if (nextTab === tab) return;
    const next = new URLSearchParams(searchParams);
    next.set('tab', nextTab);
    setSearchParams(next, { replace: true });
  };


  return (
      <Box sx={{  }}>
        <Box
          sx={{
            position: 'sticky',
            top: 0,
            zIndex: 30,
        backgroundColor: 'rgba(237, 232, 226, 0.9)',
            
            // borderBottom: '1px solid rgba(120, 94, 60, 0.12)',
          }}
        >
          <Container
          disableGutters
            maxWidth={false}
            sx={{ maxWidth: 1040, pt: 8}}
          >
            <Box
              sx={{
                display: 'flex',
                // gap: 1,
                overflowX: 'auto',
                '&::-webkit-scrollbar': {
                  display: 'none',
                },
                scrollbarWidth: 'none',
              }}
            >
              {exploreTabs.map((item) => {
                const isActive = item.id === tab;

                return (
                  <Box
                    key={item.id}
                    component="button"
                    type="button"
                    onClick={() => handleTabChange(item.id)}
                    sx={{
                      color: isActive ? '#D85A30' : '#3D3124',
                      // borderRadius: `${tabMetrics.borderRadius}px`,
                      px: tabMetrics.px,
                      py: tabMetrics.py,
                      minWidth: { xs: tabMetrics.minWidthXs, md: tabMetrics.minWidthMd },
                      fontSize: 14,
                      fontWeight: 700,
                      whiteSpace: 'nowrap',
                    }}
                  >
                    <Stack
                      spacing={tabMetrics.stackSpacing}
                      alignItems="center"
                      justifyContent="center"
                      sx={{ minWidth: 0 }}
                    >
                      <Box
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          width: tabMetrics.iconSize,
                          height: tabMetrics.iconSize,
                          borderRadius: `${tabMetrics.iconRadius}px`,
                        }}
                      >
                        <item.Icon size={tabMetrics.glyphSize} strokeWidth={tabMetrics.iconStroke} />
                      </Box>
                      <Typography
                        sx={{
                          fontSize: tabMetrics.labelFontSize,
                          fontWeight: 700,
                          lineHeight: 1.1,
                          color: 'inherit',
                        }}
                      >
                        {item.label}
                      </Typography>
                    </Stack>
                  </Box>
                );
              })}
            </Box>
          </Container>
        </Box>

      </Box>
  );
}
