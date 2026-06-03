import { datasetTimeBounds } from './loader';
import type { AuctionStatus, AuctionTiming, Vehicle } from './types';

const HOUR_MS = 60 * 60 * 1000;

/**
 * The dataset's `auction_start` values all sit in a fixed historical window, so
 * we remap them onto a rolling window around "now". Auctions are distributed
 * from `WINDOW_BEFORE_MS` in the past to `WINDOW_AFTER_MS` in the future, which
 * yields a realistic live/scheduled/ended mix on every load. Relative ordering
 * from the dataset is preserved so "ending soon" stays meaningful.
 */
const WINDOW_BEFORE_MS = 48 * HOUR_MS;
const WINDOW_AFTER_MS = 24 * HOUR_MS;

/** Each lot runs for a deterministic duration in this band (derived from its id). */
const MIN_DURATION_MS = 4 * HOUR_MS;
const MAX_DURATION_MS = 20 * HOUR_MS;

const clamp01 = (n: number): number => (n < 0 ? 0 : n > 1 ? 1 : n);

/** Stable FNV-1a hash → [0, 1), used to assign a repeatable per-lot duration. */
function hashUnit(seed: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < seed.length; i += 1) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return ((h >>> 0) % 100000) / 100000;
}

function deriveStatus(now: number, startsAt: number, endsAt: number): AuctionStatus {
  if (now < startsAt) return 'scheduled';
  if (now < endsAt) return 'live';
  return 'ended';
}

/**
 * Computes auction timing for a vehicle relative to `now`. Pure and cheap, so
 * callers re-invoke it per render/tick to drive live countdowns.
 */
export function computeTiming(
  vehicle: Vehicle,
  now: number = Date.now(),
  bounds: { startMs: number; endMs: number } = datasetTimeBounds,
): AuctionTiming {
  const span = bounds.endMs - bounds.startMs;
  const fraction =
    span > 0 ? clamp01((vehicle.auctionStartMs - bounds.startMs) / span) : 0;

  const startsAt =
    now - WINDOW_BEFORE_MS + fraction * (WINDOW_BEFORE_MS + WINDOW_AFTER_MS);
  const duration =
    MIN_DURATION_MS + hashUnit(vehicle.id) * (MAX_DURATION_MS - MIN_DURATION_MS);
  const endsAt = startsAt + duration;

  return {
    status: deriveStatus(now, startsAt, endsAt),
    startsAt,
    endsAt,
    msToStart: Math.max(0, startsAt - now),
    msRemaining: Math.max(0, endsAt - now),
  };
}
