import { Box, Grid, useMediaQuery, useTheme } from '@mui/material';
import { useEffect, useState } from 'react';

import { useToggleInterest } from '@/features/events/hooks';

import { useEventDetailV2 } from './context';
import type { ThemeVariant } from './shared/types';
import { ComicGoersModule } from './variants/comic/GoersModule';
import { ComicGroupChatModule } from './variants/comic/GroupChatModule';
import { ComicHeroModule } from './variants/comic/HeroModule';
import { ComicHighlightsModule } from './variants/comic/HighlightsModule';
import { ComicReviewsModule } from './variants/comic/ReviewsModule';
import { ComicServicesModule } from './variants/comic/ServicesModule';
import { ComicTicketsModule } from './variants/comic/TicketsModule';
import { NormalAddonsModule } from './variants/normal/AddonsModule';
import { NormalBrowseModule } from './variants/normal/BrowseModule';
import { NormalCalendarMapModule } from './variants/normal/CalendarMapModule';
import { NormalChatModule } from './variants/normal/ChatModule';
import { NormalChipsModule } from './variants/normal/ChipsModule';
import { NormalDescriptionModule } from './variants/normal/DescriptionModule';
import { NormalDivider } from './variants/normal/Divider';
import { NormalGoersModule } from './variants/normal/GoersModule';
import { NormalHeroModule } from './variants/normal/HeroModule';
import { NormalHighlightsModule } from './variants/normal/HighlightsModule';
import { NormalHostStripModule } from './variants/normal/HostStripModule';
import { NormalNavigationModule } from './variants/normal/NavigationModule';
import { NormalRecommendedModule } from './variants/normal/RecommendedModule';
import { NormalReviewsModule } from './variants/normal/ReviewsModule';
import { NormalSaveToggleModule } from './variants/normal/SaveToggleModule';
import { NormalServicesModule } from './variants/normal/ServicesModule';
import { NormalStatusModule } from './variants/normal/StatusModule';
import { NormalTicketsModule } from './variants/normal/TicketsModule';

interface VariantRegistryProps {
  variant: ThemeVariant;
}

export function VariantRegistry({ variant }: VariantRegistryProps) {
  const viewModel = useEventDetailV2();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [isMobileDevice, setIsMobileDevice] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobileDevice(
        window.innerWidth < 768 ||
        /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
          navigator.userAgent,
        ),
      );
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const {
    event,
    isHost,
    highlights,
    displayNeeds,
    reviews,
    isEventOver,
    canAccessEventChat,
    capabilities,
    isAuthenticated,
  } = viewModel;

  const toggleInterest = useToggleInterest();

  const handleToggleSave = () => {
    if (!isAuthenticated || !capabilities.canSaveEvent) return;
    toggleInterest.mutate({
      eventId: event.id,
      isInterested: !event.user_is_interested,
    });
  };

  const normalComponents =
    isMobile || isMobileDevice ? (
      <Box
        sx={{
          bgcolor: 'var(--color-background-tertiary, #f3f4f6)',
          maxWidth: 420,
          mx: 'auto',
        }}
      >
        <Box sx={{ position: 'relative' }}>
          <NormalNavigationModule
            event={event}
            isHost={isHost}
            isAuthenticated={isAuthenticated}
            isInterested={event.user_is_interested || false}
            onToggleInterest={handleToggleSave}
            disableInterestToggle={!capabilities.canSaveEvent}
            onBack={() => window.history.back()}
          />
          <NormalHeroModule event={event} />
        </Box>

        {capabilities.showHighlightsAtTop && capabilities.showHighlights && (
          <Box sx={{ bgcolor: 'var(--color-background-primary, #fff)', pt: 1.5 }}>
            <NormalHighlightsModule
              event={event}
              highlights={highlights}
              canUpload={capabilities.canUploadHighlights}
              showPublishedPlaceholder={capabilities.showPublishedHighlightsPlaceholder}
              onOpenComposer={viewModel.onOpenHighlightComposer}
              compact
            />
          </Box>
        )}

        <Box
          sx={{
            bgcolor: 'var(--color-background-primary, #fff)',
            borderRadius: '20px 20px 0 0',
            mt: -2.5,
            position: 'relative',
            zIndex: 2,
            pb: 2,
          }}
        >
          <NormalHostStripModule event={event} isHost={isHost} />

          <NormalDivider />

          <NormalDescriptionModule event={event} />

          <NormalChipsModule event={event} />
          <NormalAddonsModule event={event} />

          <NormalCalendarMapModule event={event} />
          <NormalDivider />
          <NormalStatusModule event={event} isHost={isHost} />

          <NormalGoersModule event={event} isEventOver={isEventOver} />


          <NormalSaveToggleModule
            event={event}
            isAuthenticated={isAuthenticated}
            isSaved={event.user_is_interested || false}
            onToggle={handleToggleSave}
            disabled={!capabilities.canSaveEvent}
          />

          <NormalDivider />

          <NormalTicketsModule />

          <NormalDivider />

          <NormalServicesModule
            event={event}
            displayNeeds={displayNeeds}
            isAuthenticated={isAuthenticated}
          />

          <NormalDivider />


          <NormalChatModule event={event} canAccessEventChat={canAccessEventChat} />

          <NormalDivider />

          {!capabilities.showHighlightsAtTop && capabilities.showHighlights && (
            <>
              <NormalHighlightsModule
                event={event}
                highlights={highlights}
                canUpload={capabilities.canUploadHighlights}
                showPublishedPlaceholder={
                  capabilities.showPublishedHighlightsPlaceholder
                }
                onOpenComposer={viewModel.onOpenHighlightComposer}
              />
              <NormalDivider />
            </>
          )}

          {capabilities.showReviews ? (
            <>
              <NormalReviewsModule
                event={event}
                reviews={reviews}
                canWriteReview={capabilities.canWriteReview}
                onOpenReviewComposer={viewModel.onOpenReviewComposer}
                currentUsername={viewModel.user?.username}
              />
              <NormalDivider />
            </>
          ) : null}

          <NormalBrowseModule event={event} />
          <NormalDivider />
          <NormalRecommendedModule currentEventId={event.id} />
        </Box>
      </Box>
    ) : (
      <Box sx={{ maxWidth: 800, mx: 'auto', p: 3 }}>
        <NormalNavigationModule
          event={event}
          isHost={isHost}
          isAuthenticated={isAuthenticated}
          isInterested={event.user_is_interested || false}
          onToggleInterest={handleToggleSave}
          disableInterestToggle={!capabilities.canSaveEvent}
          onBack={() => window.history.back()}
        />
        <NormalHeroModule event={event} />
        {capabilities.showHighlightsAtTop && capabilities.showHighlights && (
          <>
            <NormalHighlightsModule
              event={event}
              highlights={highlights}
              canUpload={capabilities.canUploadHighlights}
              showPublishedPlaceholder={capabilities.showPublishedHighlightsPlaceholder}
              onOpenComposer={viewModel.onOpenHighlightComposer}
              compact
            />
            <NormalDivider />
          </>
        )}
        <NormalHostStripModule event={event} isHost={isHost} />
        <NormalDivider />
        <NormalDescriptionModule event={event} />
        <NormalChipsModule event={event} />
        <NormalAddonsModule event={event} />
        <NormalCalendarMapModule event={event} />
        <NormalStatusModule event={event} isHost={isHost} />
        <NormalSaveToggleModule
          event={event}
          isAuthenticated={isAuthenticated}
          isSaved={event.user_is_interested || false}
          onToggle={handleToggleSave}
          disabled={!capabilities.canSaveEvent}
        />
        <NormalDivider />
        <NormalTicketsModule />
        <NormalDivider />
        <NormalServicesModule
          event={event}
          displayNeeds={displayNeeds}
          isAuthenticated={isAuthenticated}
        />
        <NormalDivider />
        <NormalGoersModule event={event} isEventOver={isEventOver} />
        <NormalDivider />
        <NormalChatModule event={event} canAccessEventChat={canAccessEventChat} />
        <NormalDivider />
        {!capabilities.showHighlightsAtTop && capabilities.showHighlights && (
          <>
            <NormalHighlightsModule
              event={event}
              highlights={highlights}
              canUpload={capabilities.canUploadHighlights}
              showPublishedPlaceholder={capabilities.showPublishedHighlightsPlaceholder}
              onOpenComposer={viewModel.onOpenHighlightComposer}
            />
            <NormalDivider />
          </>
        )}
        {capabilities.showReviews ? (
          <>
            <NormalReviewsModule
              event={event}
              reviews={reviews}
              canWriteReview={capabilities.canWriteReview}
              onOpenReviewComposer={viewModel.onOpenReviewComposer}
              currentUsername={viewModel.user?.username}
            />
            <NormalDivider />
          </>
        ) : null}
        <NormalBrowseModule event={event} />
        <NormalDivider />
        <NormalRecommendedModule currentEventId={event.id} />
      </Box>
    );


  return normalComponents;
}
