/**
 * Bid increment tiers, modeled on how physical auctions scale the minimum raise
 * with price: small steps on cheap lots, larger steps as the money grows. Each
 * tier applies while the reference price is strictly below `upTo`; the final
 * tier (`upTo: Infinity`) is the catch-all for high-value lots.
 *
 * Tiers are sorted ascending and consumed by `minIncrement` in `bidLogic.ts`.
 */
export interface IncrementTier {
  /** Exclusive upper bound (in dollars) for which this increment applies. */
  upTo: number;
  /** Minimum raise (in dollars) over the current price within this band. */
  increment: number;
}

export const INCREMENT_TIERS: readonly IncrementTier[] = [
  { upTo: 1_000, increment: 25 },
  { upTo: 5_000, increment: 50 },
  { upTo: 10_000, increment: 100 },
  { upTo: 25_000, increment: 250 },
  { upTo: 50_000, increment: 500 },
  { upTo: Number.POSITIVE_INFINITY, increment: 1_000 },
];

/** Fallback increment if the tier table is ever empty. */
export const DEFAULT_MIN_INCREMENT = 100;

/** localStorage key for the persisted bid overlay. */
export const BID_STORAGE_KEY = 'the-block:bids:v1';

/** localStorage key for the persisted theme preference. */
export const THEME_STORAGE_KEY = 'the-block:theme:v1';

/** localStorage key for the persisted accessibility preferences. */
export const A11Y_STORAGE_KEY = 'the-block:a11y:v1';

/** localStorage key for the persisted inventory search/filter/sort state. */
export const INVENTORY_FILTERS_STORAGE_KEY = 'the-block:inventory-filters:v1';

/** localStorage key for the persisted recently-viewed vehicle ids. */
export const RECENTLY_VIEWED_STORAGE_KEY = 'the-block:recently-viewed:v1';

/** Most-recent vehicle ids retained for the "Recently viewed" strip. */
export const RECENTLY_VIEWED_LIMIT = 8;
