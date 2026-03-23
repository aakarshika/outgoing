export type EventLifecycleState =
  | 'draft'
  | 'published'
  | 'at_risk'
  | 'postponed'
  | 'event_ready'
  | 'live'
  | 'cancelled'
  | 'completed';

export interface EventAccessContext {
  lifecycleState: EventLifecycleState;
  isHost: boolean;
  hasTicket: boolean;
  isAcceptedVendor: boolean;
}

export interface EventDetailCapabilities {
  canViewDraftPage: boolean;
  canSaveEvent: boolean;
  canBuyTickets: boolean;
  showTicketPurchase: boolean;
  canManageServices: boolean;
  showServiceShoutoutOnly: boolean;
  canAccessEventChat: boolean;
  showReviews: boolean;
  canWriteReview: boolean;
  showHighlights: boolean;
  canUploadHighlights: boolean;
  showHighlightsAtTop: boolean;
  showPublishedHighlightsPlaceholder: boolean;
}

const TICKET_OPEN_STATES: EventLifecycleState[] = ['published', 'event_ready', 'live'];
const REVIEW_OPEN_STATES: EventLifecycleState[] = ['event_ready', 'live', 'completed'];
const HIGHLIGHTS_TOP_STATES: EventLifecycleState[] = [
  'live',
  'completed',
];

export function buildEventDetailCapabilities(
  context: EventAccessContext,
): EventDetailCapabilities {
  const { lifecycleState, isHost, hasTicket, isAcceptedVendor } = context;
  const isDraft = lifecycleState === 'draft';
  const isPublished = lifecycleState === 'published';
  const isCompleted = lifecycleState === 'completed';

  const canAccessEventChat = !isDraft && (isHost || hasTicket || isAcceptedVendor);

  const canUploadHighlights =
    HIGHLIGHTS_TOP_STATES.includes(lifecycleState) && ((isHost || hasTicket || isAcceptedVendor));

  return {
    canViewDraftPage: !isDraft || isHost,
    canSaveEvent: !isDraft,
    canBuyTickets: TICKET_OPEN_STATES.includes(lifecycleState),
    showTicketPurchase: TICKET_OPEN_STATES.includes(lifecycleState),
    canManageServices: !isDraft && !isCompleted,
    showServiceShoutoutOnly: isCompleted,
    canAccessEventChat,
    showReviews: REVIEW_OPEN_STATES.includes(lifecycleState),
    canWriteReview: REVIEW_OPEN_STATES.includes(lifecycleState),
    showHighlights: true,
    canUploadHighlights,
    showHighlightsAtTop: HIGHLIGHTS_TOP_STATES.includes(lifecycleState),
    showPublishedHighlightsPlaceholder: isPublished && !isHost,
  };
}
