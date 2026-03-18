import { HeroSection } from '@/pages/events/components/HeroSection';

interface ComicHeroModuleProps {
  event: any;
  isHost: boolean;
  highlights: any[];
  occurrences: any[];
  displayNeedsCount: number;
  displayNeeds: any[];
}

export function ComicHeroModule({
  event,
  isHost,
  highlights,
  occurrences,
  displayNeedsCount,
  displayNeeds,
}: ComicHeroModuleProps) {
  return (
    <HeroSection
      event={event}
      isHost={isHost}
      highlights={highlights}
      occurrences={occurrences}
      displayNeedsCount={displayNeedsCount}
      displayNeeds={displayNeeds}
    />
  );
}
