/**
 * "Deal Score" — a single 0–10 number summarising how attractive a lot looks at
 * its current price. Like `insightLogic.ts` and `similarity.ts`, this is pure,
 * rule-based, and dependency-free: there is no model behind the "AI-inspired"
 * framing, just three weighted sub-scores blended into one rounded figure.
 *
 * The sub-scores are:
 *  - mileage: lower is better, normalized against the catalog median for the
 *    model year (with an age-expected-use fallback for thin cohorts);
 *  - year:    newer is better, normalized across the catalog's year range;
 *  - value:   the live bid relative to the lot's price ceiling (Buy Now, else a
 *    reserve/starting-bid proxy) — the more headroom, the better the deal.
 */
import type { Vehicle } from '@/data/types';

/** Relative weights for the three sub-scores; kept exported for testability. */
export const DEAL_SCORE_WEIGHTS = {
  mileage: 0.4,
  year: 0.25,
  value: 0.35,
} as const;

/** Industry rule-of-thumb annual mileage; mileage benchmark fallback. */
const ASSUMED_ANNUAL_KM = 18_000;
/** Smallest same-model-year cohort we trust for a median comparison. */
const MIN_COHORT = 3;

/**
 * Linear map from the blended 0–1 quality onto the 0–10 scale. Calibrated so a
 * middling car (blend ≈ 0.5) lands near 7.5 and an above-average "good deal"
 * (blend ≳ 0.55) sits comfortably above 8, with stronger deals topping out at 10
 * and weaker ones dropping toward the middle. Anchors: 0.5 → 7.5 and 0.6 → 8.5.
 */
const SCORE_SLOPE = 10;
const SCORE_INTERCEPT = 2.5;

export interface DealScore {
  /** Blended score on a 0–10 scale, rounded to one decimal. */
  score: number;
  /** The underlying 0–1 sub-scores, exposed for display and testing. */
  components: { mileage: number; year: number; value: number };
}

export interface DealScoreInput {
  vehicle: Vehicle;
  /** Live current bid (from the overlay); falls back to the seed if omitted. */
  currentBid?: number;
  /** Full catalog used to derive median/range benchmarks. */
  catalog: readonly Vehicle[];
  /** Current epoch ms; only used for the mileage age fallback. */
  now?: number;
}

/** Clamp a number into the inclusive `[min, max]` range. */
function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

/** Median of a numeric list; `NaN` for an empty list. */
function median(values: number[]): number {
  if (values.length === 0) return Number.NaN;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0
    ? (sorted[mid - 1] + sorted[mid]) / 2
    : sorted[mid];
}

/**
 * Mileage sub-score (0–1): odometer vs. the same-model-year median (or, for thin
 * cohorts, age-expected use). A ratio of 1.0 maps to 0.5; lower mileage scores
 * higher, capped at the band [0, 1].
 */
function mileageScore(
  vehicle: Vehicle,
  catalog: readonly Vehicle[],
  now: number
): number {
  const peers = catalog
    .filter((v) => v.id !== vehicle.id && v.year === vehicle.year)
    .map((v) => v.odometerKm)
    .filter((n) => Number.isFinite(n) && n > 0);

  let benchmark: number;
  if (peers.length >= MIN_COHORT) {
    benchmark = median(peers);
  } else {
    const age = Math.max(1, new Date(now).getFullYear() - vehicle.year);
    benchmark = age * ASSUMED_ANNUAL_KM;
  }

  if (!Number.isFinite(benchmark) || benchmark <= 0) return 0.5;

  const ratio = vehicle.odometerKm / benchmark;
  // ratio 0.5 → 1.0, ratio 1.0 → 0.5, ratio 1.5 → 0.0.
  return clamp(1.5 - ratio, 0, 1);
}

/**
 * Year sub-score (0–1): the model year normalized across the catalog's range, so
 * the newest lots approach 1 and the oldest approach 0. A single-year catalog
 * (or unknown range) scores a neutral 0.5.
 */
function yearScore(vehicle: Vehicle, catalog: readonly Vehicle[]): number {
  const years = catalog
    .map((v) => v.year)
    .filter((n) => Number.isFinite(n));
  if (years.length === 0) return 0.5;

  const min = Math.min(...years);
  const max = Math.max(...years);
  if (max === min) return 0.5;

  return clamp((vehicle.year - min) / (max - min), 0, 1);
}

/**
 * Value sub-score (0–1): how much room is left under the lot's price ceiling.
 * Prefers Buy Now; otherwise a reserve-derived or starting-bid proxy stands in.
 * A bid at the floor scores near 1; one pressed up against the ceiling nears 0.
 */
function valueScore(vehicle: Vehicle, currentBid: number): number {
  const price = Math.max(currentBid, vehicle.startingBid);

  let ceiling: number;
  if (vehicle.buyNowPrice && vehicle.buyNowPrice > 0) {
    ceiling = vehicle.buyNowPrice;
  } else if (vehicle.reservePrice && vehicle.reservePrice > 0) {
    ceiling = vehicle.reservePrice * 1.25;
  } else {
    ceiling = vehicle.startingBid * 2;
  }

  if (!Number.isFinite(ceiling) || ceiling <= 0) return 0.5;

  const ratio = clamp(price / ceiling, 0, 1);
  return clamp(1 - ratio, 0, 1);
}

/**
 * Blends the three weighted sub-scores into a single 0–10 Deal Score, rounded to
 * one decimal. Pure and total: always returns a value, even for a one-lot
 * catalog or missing optional fields.
 */
export function computeDealScore({
  vehicle,
  currentBid,
  catalog,
  now = Date.now(),
}: DealScoreInput): DealScore {
  const bid = currentBid ?? vehicle.currentBid;

  const components = {
    mileage: mileageScore(vehicle, catalog, now),
    year: yearScore(vehicle, catalog),
    value: valueScore(vehicle, bid),
  };

  const blended =
    components.mileage * DEAL_SCORE_WEIGHTS.mileage +
    components.year * DEAL_SCORE_WEIGHTS.year +
    components.value * DEAL_SCORE_WEIGHTS.value;

  // Recenter the blend so average cars sit mid-scale and good deals clear 7.
  const scaled = clamp(SCORE_INTERCEPT + SCORE_SLOPE * blended, 0, 10);

  return {
    score: Math.round(scaled * 10) / 10,
    components,
  };
}
