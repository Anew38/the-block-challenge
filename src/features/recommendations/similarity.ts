/**
 * "Smart recommendations" — a small, rule-based similarity ranker. Deliberately
 * pure and dependency-light (no model call): it scores catalog lots against a
 * target by weighted matches on make, model, body style, and price band, so the
 * result is deterministic, testable, and honestly labelled as "AI-inspired".
 */
import type { Vehicle } from '@/data/types';

/** A catalog lot paired with its similarity score against the target. */
export interface ScoredVehicle {
  vehicle: Vehicle;
  score: number;
}

/**
 * Relative weights per matched attribute. Model is the strongest signal (a buyer
 * eyeing a specific model wants alternatives of it), then make, then price band,
 * then the broader body style.
 */
export const SIMILARITY_WEIGHTS = {
  make: 3,
  model: 4,
  bodyStyle: 2,
  price: 3,
} as const;

/** A lot counts as "comparably priced" within ±20% of the target's price. */
export const PRICE_BAND = 0.2;

export interface SimilarityOptions {
  /** Max results to return (defaults to 4). */
  limit?: number;
  /** Optional predicate to drop candidates (e.g. ended auctions). */
  exclude?: (vehicle: Vehicle) => boolean;
}

/**
 * Reference price for similarity: the live current bid where it has moved above
 * the floor, otherwise the starting bid. Uses dataset seed values so the ranking
 * is stable and doesn't churn as rival bids tick during a session.
 */
function referencePrice(vehicle: Vehicle): number {
  return Math.max(vehicle.currentBid, vehicle.startingBid);
}

/**
 * Ranks catalog lots by similarity to `target`, excluding the target itself and
 * anything the caller filters out, and returns the top `limit` matches. Only
 * lots with at least one shared attribute are considered.
 */
export function findSimilarVehicles(
  target: Vehicle,
  catalog: readonly Vehicle[],
  options: SimilarityOptions = {}
): ScoredVehicle[] {
  const { limit = 4, exclude } = options;
  const targetPrice = referencePrice(target);
  const lower = targetPrice * (1 - PRICE_BAND);
  const upper = targetPrice * (1 + PRICE_BAND);

  const scored: ScoredVehicle[] = [];
  for (const vehicle of catalog) {
    if (vehicle.id === target.id) continue;
    if (exclude?.(vehicle)) continue;

    let score = 0;
    if (vehicle.make === target.make) score += SIMILARITY_WEIGHTS.make;
    if (vehicle.model === target.model) score += SIMILARITY_WEIGHTS.model;
    if (vehicle.bodyStyle === target.bodyStyle) {
      score += SIMILARITY_WEIGHTS.bodyStyle;
    }

    const price = referencePrice(vehicle);
    if (price >= lower && price <= upper) score += SIMILARITY_WEIGHTS.price;

    if (score > 0) scored.push({ vehicle, score });
  }

  // Sort by score desc; break ties by closer price, then id for stability.
  scored.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    const priceDelta =
      Math.abs(referencePrice(a.vehicle) - targetPrice) -
      Math.abs(referencePrice(b.vehicle) - targetPrice);
    if (priceDelta !== 0) return priceDelta;
    return a.vehicle.id.localeCompare(b.vehicle.id);
  });

  return scored.slice(0, limit);
}
