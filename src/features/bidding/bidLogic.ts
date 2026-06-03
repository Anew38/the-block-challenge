/**
 * Pure bid logic — no React, no store, no side effects. This is the riskiest
 * part of the app (money + validation), so it lives apart from the store and is
 * exhaustively unit-testable. The store wires these helpers to persisted state.
 */
import {
  DEFAULT_MIN_INCREMENT,
  INCREMENT_TIERS,
} from '@/lib/constants';

/** Inputs needed to validate a proposed bid against a lot's current state. */
export interface BidValidationInput {
  /** The amount the user is attempting to bid, in dollars. */
  amount: number;
  /** Current highest bid for the lot (from the overlay). */
  currentBid: number;
  /** Dataset floor; the first bid must clear this plus an increment. */
  startingBid: number;
  /** Buy-now ceiling, or `null` when the lot has no buy-now price. */
  buyNowPrice: number | null;
}

/** Result of validating a bid; `minimumBid` is always returned for the UI. */
export interface BidValidationResult {
  ok: boolean;
  /** Human-readable reason when `ok` is false. */
  error?: string;
  /** Smallest acceptable bid given the current state — handy for input hints. */
  minimumBid: number;
}

/**
 * The current price a new bid must beat: the higher of the running bid and the
 * dataset's starting bid. Before anyone bids, `currentBid` is seeded to at least
 * `startingBid`, but taking the max keeps this correct regardless of caller.
 */
export function currentFloor(currentBid: number, startingBid: number): number {
  return Math.max(currentBid, startingBid);
}

/**
 * Minimum raise over a reference price, selected from the tiered table. Tiers
 * apply while `price` is strictly below their `upTo` bound.
 */
export function minIncrement(price: number): number {
  for (const tier of INCREMENT_TIERS) {
    if (price < tier.upTo) return tier.increment;
  }
  return DEFAULT_MIN_INCREMENT;
}

/**
 * Smallest acceptable next bid: current floor plus the increment for that floor.
 */
export function minNextBid(currentBid: number, startingBid: number): number {
  const floor = currentFloor(currentBid, startingBid);
  return floor + minIncrement(floor);
}

/** True when the reserve is satisfied; lots without a reserve are always met. */
export function isReserveMet(
  currentBid: number,
  reservePrice: number | null,
): boolean {
  return reservePrice === null || currentBid >= reservePrice;
}

/**
 * Validates a proposed bid against the lot's current state. Pure and total:
 * always returns a result (never throws), with `minimumBid` populated so the UI
 * can render guidance even on failure.
 *
 * Rules, in priority order:
 *  1. Amount must be a finite, positive number.
 *  2. Amount must be strictly below buy-now (use Buy Now to meet/exceed it).
 *  3. Amount must be at least `currentFloor + minIncrement`.
 */
export function validateBid({
  amount,
  currentBid,
  startingBid,
  buyNowPrice,
}: BidValidationInput): BidValidationResult {
  const minimumBid = minNextBid(currentBid, startingBid);

  if (!Number.isFinite(amount) || amount <= 0) {
    return { ok: false, error: 'Enter a valid bid amount.', minimumBid };
  }

  if (buyNowPrice !== null && amount >= buyNowPrice) {
    return {
      ok: false,
      error: `Bid must be below the Buy Now price of ${formatUsd(buyNowPrice)}. Use Buy Now to purchase outright.`,
      minimumBid,
    };
  }

  if (amount < minimumBid) {
    const increment = minIncrement(currentFloor(currentBid, startingBid));
    return {
      ok: false,
      error: `Minimum bid is ${formatUsd(minimumBid)} (current price + ${formatUsd(increment)} increment).`,
      minimumBid,
    };
  }

  return { ok: true, minimumBid };
}

/** Compact, dependency-free currency formatting for validation messages. */
function formatUsd(value: number): string {
  return `$${Math.round(value).toLocaleString('en-US')}`;
}
