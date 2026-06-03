/**
 * Insight logic — pure, no React, no store. Turns a lot's specs, its live bid
 * state, auction timing, and the surrounding catalog into a small set of
 * ranked, human-readable "AI" insights.
 *
 * Despite the framing, there is no model here: every insight is a deterministic
 * business rule over data we already have. Keeping it pure makes the heuristics
 * cheap to call per render and exhaustively unit-testable, mirroring how
 * `bidLogic.ts` isolates the money rules from the store.
 */
import type { AuctionTiming, BidState, Vehicle } from '@/data/types';
import {
  formatCurrency,
  formatDuration,
  formatGrade,
  formatOdometer,
} from '@/lib/format';

/** Drives the accent color: good news, neutral context, or a caution. */
export type InsightTone = 'positive' | 'neutral' | 'caution';

/** Category of an insight; the panel maps this to an icon. */
export type InsightKind =
  | 'mileage'
  | 'value'
  | 'condition'
  | 'reserve'
  | 'velocity'
  | 'timing'
  | 'title';

export interface Insight {
  id: string;
  kind: InsightKind;
  tone: InsightTone;
  /** Short headline, e.g. "Below-average mileage". */
  title: string;
  /** One-sentence explanation with the supporting numbers. */
  detail: string;
  /** Higher = more decision-relevant; used to rank and cap the list. */
  priority: number;
}

export interface InsightInput {
  vehicle: Vehicle;
  bid: BidState;
  timing: AuctionTiming;
  /** Full catalog (including the subject) used to derive peer benchmarks. */
  catalog: readonly Vehicle[];
  /** Current epoch ms; injected so timing/velocity rules stay deterministic. */
  now: number;
}

const MINUTE_MS = 60_000;
const RECENT_WINDOW_MS = 10 * MINUTE_MS;
const CLOSING_SOON_MS = 15 * MINUTE_MS;
/** Industry rule-of-thumb for "average" annual use; mileage benchmark fallback. */
const ASSUMED_ANNUAL_KM = 18_000;
/** Smallest peer group we trust for a median comparison. */
const MIN_COHORT = 4;
/** Cap on rendered insights, so the panel stays scannable. */
const MAX_INSIGHTS = 5;

/** Median of a numeric list; `NaN` for an empty list. */
function median(values: number[]): number {
  if (values.length === 0) return Number.NaN;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0
    ? (sorted[mid - 1] + sorted[mid]) / 2
    : sorted[mid];
}

/** Format a ratio as a rounded whole-number percentage, e.g. `0.234` → `23%`. */
function formatPercent(ratio: number): string {
  return `${Math.round(Math.abs(ratio) * 100)}%`;
}

interface Cohort {
  peers: Vehicle[];
  label: string;
}

/**
 * Picks the most specific peer group with enough members to compare against:
 * comparable body style within ±2 model years, then any same-body-style lot,
 * then the rest of the sale. The label feeds into the insight copy.
 */
function selectCohort(vehicle: Vehicle, catalog: readonly Vehicle[]): Cohort {
  const others = catalog.filter((v) => v.id !== vehicle.id);

  const sameClassYear = others.filter(
    (v) =>
      v.bodyStyle === vehicle.bodyStyle && Math.abs(v.year - vehicle.year) <= 2
  );
  if (sameClassYear.length >= MIN_COHORT) {
    return { peers: sameClassYear, label: `comparable ${vehicle.bodyStyle}s` };
  }

  const sameClass = others.filter((v) => v.bodyStyle === vehicle.bodyStyle);
  if (sameClass.length >= MIN_COHORT) {
    return { peers: sameClass, label: `${vehicle.bodyStyle} lots` };
  }

  return { peers: others, label: 'lots in this sale' };
}

/** Below/above-average mileage vs. comparable lots (or age-expected use). */
function mileageInsight(
  vehicle: Vehicle,
  cohort: Cohort,
  now: number
): Insight | null {
  const peerOdos = cohort.peers
    .map((p) => p.odometerKm)
    .filter((n) => Number.isFinite(n) && n > 0);

  let benchmark: number;
  let benchLabel: string;
  if (peerOdos.length >= MIN_COHORT) {
    benchmark = median(peerOdos);
    benchLabel = `the ${cohort.label} median`;
  } else {
    const age = Math.max(1, new Date(now).getFullYear() - vehicle.year);
    benchmark = age * ASSUMED_ANNUAL_KM;
    benchLabel = `${age}-year expected use`;
  }

  if (!Number.isFinite(benchmark) || benchmark <= 0) return null;
  const ratio = vehicle.odometerKm / benchmark;

  if (ratio <= 0.85) {
    return {
      id: 'mileage-low',
      kind: 'mileage',
      tone: 'positive',
      priority: 60,
      title: 'Below-average mileage',
      detail: `${formatOdometer(vehicle.odometerKm)} is ~${formatPercent(
        1 - ratio
      )} under ${benchLabel} (${formatOdometer(
        Math.round(benchmark)
      )}). Lower wear supports resale value.`,
    };
  }

  if (ratio >= 1.2) {
    return {
      id: 'mileage-high',
      kind: 'mileage',
      tone: 'caution',
      priority: 44,
      title: 'Higher mileage than peers',
      detail: `${formatOdometer(vehicle.odometerKm)} is ~${formatPercent(
        ratio - 1
      )} above ${benchLabel} (${formatOdometer(
        Math.round(benchmark)
      )}). Expect added wear and price accordingly.`,
    };
  }

  return null;
}

/** Spread between the live bid and the Buy Now ceiling — a wholesale signal. */
function buyNowInsight(vehicle: Vehicle, bid: BidState): Insight | null {
  if (vehicle.buyNowPrice === null || vehicle.buyNowPrice <= 0) return null;

  const headroom = (vehicle.buyNowPrice - bid.currentBid) / vehicle.buyNowPrice;
  if (headroom >= 0.25) {
    return {
      id: 'buy-now-headroom',
      kind: 'value',
      tone: 'positive',
      priority: 70,
      title: 'Strong wholesale spread',
      detail: `The bid sits ~${formatPercent(
        headroom
      )} below the ${formatCurrency(
        vehicle.buyNowPrice
      )} Buy Now — healthy margin if it sells near today's price.`,
    };
  }

  return null;
}

/** High condition grade paired with a price that trails comparable lots. */
function conditionValueInsight(
  vehicle: Vehicle,
  bid: BidState,
  cohort: Cohort
): Insight | null {
  if (cohort.peers.length < MIN_COHORT) return null;

  const prices = cohort.peers
    .map((p) => Math.max(p.currentBid, p.startingBid))
    .filter((n) => Number.isFinite(n) && n > 0);
  const grades = cohort.peers
    .map((p) => p.conditionGrade)
    .filter((n) => Number.isFinite(n));

  const medPrice = median(prices);
  const medGrade = median(grades);
  if (!Number.isFinite(medPrice) || !Number.isFinite(medGrade)) return null;

  if (vehicle.conditionGrade >= medGrade + 0.3 && bid.currentBid <= medPrice) {
    return {
      id: 'condition-value',
      kind: 'condition',
      tone: 'positive',
      priority: 55,
      title: 'Condition outruns the price',
      detail: `Grade ${formatGrade(
        vehicle.conditionGrade
      )} tops the ${cohort.label} median of ${formatGrade(
        medGrade
      )}, yet the bid (${formatCurrency(
        bid.currentBid
      )}) still trails the median price (${formatCurrency(medPrice)}).`,
    };
  }

  return null;
}

/** Reserve gap analysis: none, met, or how far short the bidding is. */
function reserveInsight(vehicle: Vehicle, bid: BidState): Insight {
  if (vehicle.reservePrice === null) {
    return {
      id: 'reserve-none',
      kind: 'reserve',
      tone: 'positive',
      priority: 40,
      title: 'No reserve',
      detail:
        'This lot sells to the highest bidder — there is no reserve to clear.',
    };
  }

  if (bid.reserveMet || bid.currentBid >= vehicle.reservePrice) {
    return {
      id: 'reserve-met',
      kind: 'reserve',
      tone: 'positive',
      priority: 64,
      title: 'Reserve met',
      detail: `Bidding has cleared the ${formatCurrency(
        vehicle.reservePrice
      )} reserve, so this lot is on the block to sell.`,
    };
  }

  const gap = vehicle.reservePrice - bid.currentBid;
  const gapCopy =
    bid.currentBid > 0
      ? `${formatCurrency(gap)} (~${formatPercent(gap / bid.currentBid)})`
      : formatCurrency(gap);
  return {
    id: 'reserve-gap',
    kind: 'reserve',
    tone: 'caution',
    priority: 74,
    title: 'Reserve not met',
    detail: `${gapCopy} more is needed to clear the ${formatCurrency(
      vehicle.reservePrice
    )} reserve before it can sell.`,
  };
}

/** Bid velocity on live lots: recent flurry, or sustained above-average interest. */
function velocityInsight(
  bid: BidState,
  timing: AuctionTiming,
  now: number,
  busyThreshold: number
): Insight | null {
  if (timing.status !== 'live') return null;

  const recent = bid.history.filter(
    (b) => now - b.placedAt <= RECENT_WINDOW_MS
  ).length;
  if (recent >= 3) {
    return {
      id: 'velocity-hot',
      kind: 'velocity',
      tone: 'caution',
      priority: 58,
      title: 'Bidding is heating up',
      detail: `${recent} bids in the last 10 minutes. Momentum like this tends to push the final price higher.`,
    };
  }

  if (bid.bidCount >= busyThreshold) {
    return {
      id: 'velocity-active',
      kind: 'velocity',
      tone: 'neutral',
      priority: 34,
      title: 'Above-average interest',
      detail: `${bid.bidCount} bids placed so far — well ahead of the typical lot in this sale.`,
    };
  }

  return null;
}

/** Urgency when a live lot is closing, or a heads-up before it opens. */
function timingInsight(timing: AuctionTiming): Insight | null {
  if (timing.status === 'live' && timing.msRemaining <= CLOSING_SOON_MS) {
    return {
      id: 'closing-soon',
      kind: 'timing',
      tone: 'caution',
      priority: 80,
      title: 'Closing soon',
      detail: `Under ${formatDuration(
        timing.msRemaining
      )} left with bidding live — set your max now to stay in front.`,
    };
  }

  if (timing.status === 'scheduled') {
    return {
      id: 'opens-soon',
      kind: 'timing',
      tone: 'neutral',
      priority: 30,
      title: 'Not open yet',
      detail: `Bidding opens in ${formatDuration(
        timing.msToStart
      )}. Line up your number before the lot goes live.`,
    };
  }

  return null;
}

/** Branded titles materially affect resale; surface as a caution. */
function titleInsight(vehicle: Vehicle): Insight | null {
  if (vehicle.titleStatus === 'clean') return null;

  const label = vehicle.titleStatus === 'rebuilt' ? 'Rebuilt' : 'Salvage';
  return {
    id: 'title-branded',
    kind: 'title',
    tone: 'caution',
    priority: 50,
    title: `${label} title`,
    detail: `A ${vehicle.titleStatus} title typically discounts resale 20–40%. Factor reconditioning and buyer hesitancy into your max bid.`,
  };
}

/**
 * Derives the ranked insight list for a lot. Pure and total: always returns at
 * least the reserve insight, sorted by decision-relevance and capped so the
 * panel stays scannable.
 */
export function deriveInsights({
  vehicle,
  bid,
  timing,
  catalog,
  now,
}: InsightInput): Insight[] {
  const cohort = selectCohort(vehicle, catalog);

  // "Above-average interest" is relative to the sale, not a fixed number.
  const bidCounts = catalog
    .map((v) => v.bidCount)
    .filter((n) => Number.isFinite(n));
  const busyThreshold = Math.max(8, Math.round(median(bidCounts) * 1.5));

  const candidates: Array<Insight | null> = [
    timingInsight(timing),
    reserveInsight(vehicle, bid),
    buyNowInsight(vehicle, bid),
    mileageInsight(vehicle, cohort, now),
    conditionValueInsight(vehicle, bid, cohort),
    velocityInsight(bid, timing, now, busyThreshold),
    titleInsight(vehicle),
  ];

  return candidates
    .filter((i): i is Insight => i !== null)
    .sort((a, b) => b.priority - a.priority)
    .slice(0, MAX_INSIGHTS);
}
