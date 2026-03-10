/**
 * Shared utils for scrapbook event cards (portrait + landscape).
 */

export type EventCardAuth = {
  user: { username: string } | null;
  isAuthenticated: boolean;
};

export type EventForRoles = {
  host?: { username: string } | null;
  user_is_vendor?: boolean;
  user_applications?: unknown[] | null;
};

/**
 * Whether the current user is the event host or a vendor.
 */
export function getEventCardRoles(
  event: EventForRoles,
  auth: EventCardAuth
): { isHost: boolean; isVendor: boolean } {
  const isHost =
    auth.isAuthenticated &&
    !!auth.user &&
    !!event.host &&
    auth.user.username === event.host.username;
  const isVendor =
    auth.isAuthenticated &&
    !!auth.user &&
    (!!event.user_is_vendor ||
      (Array.isArray(event.user_applications) && event.user_applications.length > 0));
  return { isHost, isVendor };
}

/**
 * Format standard ticket price for display (e.g. "$20" or "Free").
 */
export function formatEventPrice(ticketPriceStandard: string | null): string {
  return ticketPriceStandard
    ? `$${parseFloat(ticketPriceStandard).toFixed(0)}`
    : 'Free';
}
