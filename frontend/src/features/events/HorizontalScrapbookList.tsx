import { Box, Button, Typography } from '@mui/material';
import { type ReactNode } from 'react';

import { HostCard } from '@/components/ui/HostCard';

import { ScrapbookEventCard } from './ScrapbookEventCard';
import { SideEnvelope } from './SideEnvelope';
import { PlatformDescriptionCard } from './cards/PlatformDescriptionCard';

interface HorizontalScrapbookListProps {
  title?: string;
  items?: any[];
  renderItem?: (item: any) => ReactNode;
  events?: any[]; // Legacy alias
  isLoading?: boolean;
  emptyMessage?: ReactNode;
  forceShowHeader?: boolean;
  onSeeAll?: () => void;
}

export function HorizontalScrapbookList({
  title,
  items,
  renderItem,
  events,
  isLoading,
  emptyMessage,
  forceShowHeader,
  onSeeAll,
}: HorizontalScrapbookListProps) {
  const displayItems = items || events || [];
  const showEnvelope = displayItems.length > 5;
  const Title = () => {
    return (
      <Box
        sx={{
          px: { xs: 2, sm: 4, lg: 8 },
          display: 'flex',
          alignItems: 'baseline',
          justifyContent: 'space-between',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          zIndex: 10,
          pointerEvents: 'none',
        }}
      >
        <Box sx={{ position: 'relative' }}>
          <Box
            sx={{
              position: 'absolute',
              top: -10,
              left: -10,
              width: 40,
              height: 20,
              bgcolor: 'rgba(251, 191, 36, 0.4)',
              transform: 'rotate(-5deg)',
              zIndex: 0,
            }}
          />
          <Typography
            variant="h4"
            sx={{
              fontFamily: '"serif"',
              color: '#1a1a1a',
              fontSize: { xs: '1rem', sm: '1rem' },
              position: 'relative',
              zIndex: 1,
            }}
          >
            {title}
          </Typography>
        </Box>
        {onSeeAll && (
          <Button
            onClick={onSeeAll}
            sx={{
              fontFamily: 'serif',
              textTransform: 'none',
              color: '#666',
              pointerEvents: 'auto',
              '&:hover': { textDecoration: 'underline', bgcolor: 'transparent' },
            }}
          >
            See more →
          </Button>
        )}
      </Box>
    );
  };

  const ListItems = () => {
    return (

      <Box
        sx={{
          display: 'flex',
          justifyContent:
            !isLoading && displayItems.length > 0 && displayItems.length <= 5
              ? 'center'
              : 'flex-start',
          gap: { xs: 1, sm: 2, md: 3 },
          overflowX: 'auto',
          overflowY: 'hidden',
          overscrollBehaviorX: 'contain',
          scrollbarWidth: 'none',
          px: { xs: 2, sm: 4, lg: 8 },
          pb: 4,
          pt: 2,
          pr: { xs: 4, sm: 6, lg: 20 },
          // scrollSnapType: 'x mandatory',
          // scrollbarWidth: 'none',
          // '&::-webkit-scrollbar': { display: 'none' },
          // Decorative pencil line behind the cards
          position: 'relative',
          '&::before': {
            content: '""',
            position: 'absolute',
            top: '50%',
            left: 0,
            right: 0,
            height: 1,
            backgroundImage:
              'linear-gradient(to right, rgba(0,0,0,0.1) 50%, transparent 50%)',
            backgroundSize: '10px 1px',
            zIndex: -1,
          },
        }}
      >
        {isLoading ? (
          Array.from({ length: 5 }).map((_, i) => (
            <Box
              key={i}
              sx={{
                width: { xs: 280, sm: 320 },
                flexShrink: 0,
                aspectRatio: '1 / 1.2',
                bgcolor: 'rgba(0,0,0,0.05)',
                borderRadius: 1,
                animation: 'pulse 1.5s infinite',
              }}
            />
          ))
        ) : displayItems.length > 0 ? (
          displayItems.map((item, idx) => {
            return (
              <Box
                key={item.id || idx}
                sx={{
                  display: 'flex',
                  gap: { xs: 3, sm: 4, md: 6 },
                  alignItems: 'center',
                }}
              >
                <Box
                  sx={{
                    width: { xs: 240, sm: 280, md: 320 },
                    flexShrink: 0,
                  }}
                >
                  {renderItem ? renderItem(item) : <ScrapbookEventCard event={item} />}
                </Box>
              </Box>
            );
          }).concat(
            displayItems.length <= 5
              ? [
                <Box/>,
                  // <Box
                  //   key="custom-card"
                  //   sx={{
                  //     display: 'flex',
                  //     gap: { xs: 3, sm: 4, md: 6 },
                  //     alignItems: 'center',
                  //   }}
                  // >
                  //   <Box
                  //     sx={{
                  //       width: { xs: 240, sm: 280, md: 320 },
                  //       flexShrink: 0,
                  //     }}
                  //   >
                  //     <Box
                  //       sx={{
                  //         display: 'flex',
                  //         justifyContent: 'center',
                  //         alignItems: 'center',
                  //         transform: 'translateY(10px)',
                  //         bgcolor: 'transparent',
                  //       }}
                  //     >
                  //       <PlatformDescriptionCard /> 
                  //     </Box>
                  //   </Box>
                  // </Box>,
                ]
              : [],
          )
        ) : (
          <Box sx={{ py: 4, width: '100%', textAlign: 'center' }}>
            {typeof emptyMessage === 'string' ? (
              <Typography
                variant="body1"
                sx={{ fontFamily: 'serif', fontStyle: 'italic', color: '#666' }}
              >
                {emptyMessage}
              </Typography>
            ) : (
              emptyMessage || (
                <Typography
                  variant="body1"
                  sx={{ fontFamily: 'serif', fontStyle: 'italic', color: '#666' }}
                >
                  No events found.
                </Typography>
              )
            )}
          </Box>
        )}
      </Box>

    );
  };





  // Always show the section even if it has no items.
  return (
    <Box sx={{ py: 0, position: 'relative', overflow: 'hidden' }}>
      {title && (
        <Title />
      )}
      {showEnvelope ? (
        <SideEnvelope>
          <ListItems />
        </SideEnvelope>
      ) : (
        <ListItems />
      )}
    </Box>
  );
}
