export function parseMoney(value?: string | number | null): number {
  if (typeof value === 'number') return Number.isFinite(value) ? value : 0;
  if (!value) return 0;
  const normalized = String(value).replace(/[^0-9.-]/g, '');
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : 0;
}

export function formatMoney(value?: string | number | null): string {
  const numeric = parseMoney(value);
  return `₹${numeric.toLocaleString('en-IN')}`;
}
