export type LifecycleState =
  | 'draft'
  | 'published'
  | 'event_ready'
  | 'live'
  | 'completed'
  | 'at_risk'
  | 'closed'
  | 'cancelled';

export const LIFECYCLE_LABELS: Record<LifecycleState, string> = {
  draft: 'DRAFT',
  published: 'UPCOMING',
  event_ready: 'READY',
  live: 'LIVE NOW',
  completed: 'PAST EVENT',
  at_risk: 'AT RISK',
  closed: 'CLOSED',
  cancelled: 'CANCELLED',
};
