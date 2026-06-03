/**
 * Presentation helpers shared across features. Pure and dependency-free so they
 * stay cheap to call per render and trivial to reason about.
 */

const CURRENCY = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 0,
});

const ODOMETER = new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 });

/** Whole-dollar currency, e.g. `21000` → `$21,000`. */
export function formatCurrency(value: number): string {
  return CURRENCY.format(Math.round(value));
}

/** Odometer reading with unit, e.g. `24534` → `24,534 km`. */
export function formatOdometer(km: number): string {
  return `${ODOMETER.format(km)} km`;
}

/** Condition grade to one decimal, e.g. `4` → `4.0`, `2.7` → `2.7`. */
export function formatGrade(grade: number): string {
  return grade.toFixed(1);
}

const SECOND_MS = 1000;
const MINUTE_MS = 60 * SECOND_MS;
const HOUR_MS = 60 * MINUTE_MS;
const DAY_MS = 24 * HOUR_MS;

/**
 * Compact duration for countdowns, surfacing the two most significant units,
 * e.g. `1d 4h`, `3h 12m`, `8m 5s`, `42s`. Non-positive input renders `0s`.
 */
export function formatDuration(ms: number): string {
  if (ms <= 0) return '0s';

  const days = Math.floor(ms / DAY_MS);
  const hours = Math.floor((ms % DAY_MS) / HOUR_MS);
  const minutes = Math.floor((ms % HOUR_MS) / MINUTE_MS);
  const seconds = Math.floor((ms % MINUTE_MS) / SECOND_MS);

  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h ${minutes}m`;
  if (minutes > 0) return `${minutes}m ${seconds}s`;
  return `${seconds}s`;
}
