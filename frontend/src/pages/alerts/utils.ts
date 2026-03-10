import { EventDetail } from '@/types/events';

export interface EventOverviewRow {
  event_id: number;
  event_created_date: string;
  event_lifecycle_state: string;
  event_capacity: number | null;
  host_user_id: number;

  number_of_total_needs: number;
  number_of_needs_filled: number;
  number_of_needs_override_filled: number;

  need_id: number | null;
  need_application_requested_by_host_vendor_user_id: number | null;
  need_applied_to_user_id: number | null;
  need_assigned_user_id: number | null;

  need_application_id: number | null;
  need_application_status: string | null;
  need_application_created_date: string | null;
  need_status: string | null;

  number_of_tickets_purchased_not_cancelled: number;
  number_of_tickets_used: number;

  attendee_user_id: number | null;
  ticket_created_date: string | null;
  ticket_status: string | null;

  event_details: EventDetail;
}

export function getEventStep(
  role: 'host' | 'vendor' | 'attendee',
  row: EventOverviewRow,
  userId: number,
): { currentStep: number; totalSteps: number } {
  const state = row.event_lifecycle_state;

  if (role === 'host') {
    let currentStep = 1;
    if (state === 'completed') currentStep = 5;
    else if (state === 'live') currentStep = 4;
    else if (state === 'ready') currentStep = 3;
    else if (state === 'published') currentStep = 2; // draft is 1
    return { currentStep, totalSteps: 5 };
  }

  if (role === 'vendor') {
    let currentStep = 1;
    if (row.need_assigned_user_id === userId) {
      if (state === 'completed') currentStep = 4;
      else if (state === 'live') currentStep = 3;
      else currentStep = 2; // assigned && (ready or published) -> 2
    }
    return { currentStep, totalSteps: 4 };
  }

  if (role === 'attendee') {
    let currentStep = 1;
    if (state === 'completed') currentStep = 4;
    else if (state === 'live') currentStep = 3;
    else if (state === 'ready') currentStep = 2; // wait for checkin/arriving
    return { currentStep, totalSteps: 4 };
  }

  return { currentStep: 1, totalSteps: 4 };
}

export function getEventTimeLabel(startDateStr: string | undefined | null): string {
  if (!startDateStr) return '';
  const targetDate = new Date(startDateStr);
  const now = new Date();

  // Set times to midnight to calculate pure day differences
  const targetDay = new Date(
    targetDate.getFullYear(),
    targetDate.getMonth(),
    targetDate.getDate(),
  );
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  const diffTime = targetDay.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Tomorrow';
  if (diffDays === -1) return 'Yesterday';
  if (diffDays > 0) return `In ${diffDays} days`;
  return `${Math.abs(diffDays)} days ago`;
}

export function getStepStatusLabel(
  role: 'host' | 'vendor' | 'attendee',
  row: EventOverviewRow,
  userId: number,
): string {
  const state = row.event_lifecycle_state;

  if (role === 'host') {
    if (state === 'draft') return 'Draft';
    if (state === 'published') return 'Published';
    if (state === 'ready') return 'Ready / Preparing';
    if (state === 'live') return 'Live';
    if (state === 'completed') return 'Completed';
    return state;
  }

  if (role === 'vendor') {
    if (row.need_assigned_user_id === userId) {
      if (state === 'live') return 'Service Live';
      if (state === 'completed') return 'Completed';
      return 'Prepare to Service';
    }
    return row.need_application_status === 'pending'
      ? 'Application Pending'
      : 'Invited to Apply';
  }

  if (role === 'attendee') {
    if (state === 'live') return 'Attending Live';
    if (state === 'completed') return 'Completed';
    if (state === 'ready') return 'Prepare to Arrive';
    return 'Waiting for check-in info';
  }

  return '';
}

export function getConfirmDateLabel(
  role: 'host' | 'vendor' | 'attendee',
  row: EventOverviewRow,
): string {
  const getOrdinalNum = (n: number) => {
    return (
      n +
      (n > 0
        ? ['th', 'st', 'nd', 'rd'][(n > 3 && n < 21) || n % 10 > 3 ? 0 : n % 10]
        : '')
    );
  };

  const formatDate = (dateStr: string | null | undefined, prefix: string) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    const dateFormatted = getOrdinalNum(d.getDate());
    const monthFormatted = d.toLocaleString('default', { month: 'short' });
    const yearFormatted = d.getFullYear().toString().slice(-2);
    return `${prefix} ${dateFormatted} ${monthFormatted} '${yearFormatted}`;
  };

  if (role === 'host') {
    return formatDate(row.event_created_date, 'Created on');
  }

  if (role === 'vendor') {
    return formatDate(row.need_application_created_date, 'Applied on');
  }

  if (role === 'attendee') {
    return formatDate(row.ticket_created_date, 'Purchased on');
  }

  return '';
}
