import {
  differenceInDays,
  differenceInHours,
  differenceInMonths,
  differenceInWeeks,
} from 'date-fns';

export function formatEventRelativeTime(dateString: string): string {
  const targetDate = new Date(dateString);
  const now = new Date();

  const isPast = targetDate < now;
  const diffHours = Math.abs(differenceInHours(targetDate, now));
  const diffDays = Math.abs(differenceInDays(targetDate, now));
  const diffWeeks = Math.abs(differenceInWeeks(targetDate, now));
  const diffMonths = Math.abs(differenceInMonths(targetDate, now));

  // if more than 1 month, count in weeks and show no days
  if (diffMonths >= 1 || diffWeeks >= 4) {
    if (isPast) {
      return `${diffWeeks} week${diffWeeks !== 1 ? 's' : ''} ago`;
    } else {
      return `in ${diffWeeks} week${diffWeeks !== 1 ? 's' : ''}`;
    }
  }

  // if less than 40 hours remaining, also show hours
  if (diffHours < 40) {
    const hoursPart = diffHours % 24;
    const daysPart = Math.floor(diffHours / 24);

    let timeStr = '';
    if (daysPart > 0) {
      timeStr += `${daysPart} day${daysPart !== 1 ? 's' : ''}`;
    }
    if (hoursPart > 0) {
      if (timeStr) timeStr += ', ';
      timeStr += `${hoursPart} hour${hoursPart !== 1 ? 's' : ''}`;
    }
    if (!timeStr) {
      timeStr = 'less than an hour';
    }

    if (isPast) {
      return `${timeStr} ago`;
    } else {
      return `in ${timeStr}`;
    }
  }

  // otherwise, between 40 hours and 1 month, show days
  if (isPast) {
    return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;
  } else {
    return `in ${diffDays} day${diffDays !== 1 ? 's' : ''}`;
  }
}
