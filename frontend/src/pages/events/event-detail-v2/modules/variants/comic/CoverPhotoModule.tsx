import { CoverPhotoModule } from '@/pages/events/components/DetailsSection';

interface ComicCoverPhotoModuleProps {
  event: any;
}

export function ComicCoverPhotoModule({ event }: ComicCoverPhotoModuleProps) {
  return <CoverPhotoModule event={event} />;
}
