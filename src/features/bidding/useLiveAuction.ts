/**
 * Live-auction simulation. The dataset is static, so to convey a sense of a
 * running marketplace we periodically post synthetic *rival* bids on lots that
 * are currently `live`. All money rules (raise-only, below buy-now, reserve)
 * are enforced by the store's `applyRivalBid`; this hook only decides *when* and
 * *how much* to nudge, then defers to that single source of truth.
 *
 * Two entry points share the same cadence helpers:
 *  - `useLiveAuction(vehicle)` drives a single lot (the detail page).
 *  - `useLiveInventorySim(vehicles)` nudges one random live lot per tick across
 *    a catalog (the inventory grid), so cards feel alive without hammering all.
 */
import { useEffect } from 'react';
import { computeTiming } from '@/data/timing';
import type { Vehicle } from '@/data/types';
import { useAuctionStore } from './auctionStore';
import { minIncrement } from './bidLogic';

/** How often we consider posting a rival bid. */
const DEFAULT_TICK_MS = 5_000;
/** Per-tick chance that a live lot actually draws a rival bid. */
const DEFAULT_BID_PROBABILITY = 0.35;
/** Rivals raise by 1..MAX minimum increments, so jumps feel organic. */
const MAX_INCREMENT_STEPS = 3;

export interface LiveAuctionOptions {
  /** Disable the simulation (e.g. for reduced-motion or tests). Default: on. */
  enabled?: boolean;
  /** Interval between simulation ticks, in ms. */
  tickMs?: number;
  /** Probability in [0, 1] that a live lot draws a bid on a given tick. */
  bidProbability?: number;
}

/**
 * Picks a plausible rival bid for `vehicle` given its current overlay state, or
 * `null` when no valid raise exists (e.g. the next step would reach buy-now, so
 * the lot naturally cools off there). Reads the store imperatively so callers
 * don't re-render on every tick.
 */
function nextRivalBid(vehicle: Vehicle): number | null {
  const state = useAuctionStore.getState().getBidState(vehicle);
  const floor = Math.max(state.currentBid, vehicle.startingBid);
  const increment = minIncrement(floor);
  const steps = 1 + Math.floor(Math.random() * MAX_INCREMENT_STEPS);
  const amount = floor + increment * steps;

  // Rivals never reach buy-now (that would end the lot); hold below it instead.
  if (vehicle.buyNowPrice !== null && amount >= vehicle.buyNowPrice) return null;
  return amount;
}

/**
 * Simulates rival bidding on a single lot while it is live. Recomputes timing on
 * each tick (rather than trusting a prop) so liveness tracks the wall clock even
 * as a lot opens or closes mid-session.
 */
export function useLiveAuction(
  vehicle: Vehicle,
  options: LiveAuctionOptions = {},
): void {
  const {
    enabled = true,
    tickMs = DEFAULT_TICK_MS,
    bidProbability = DEFAULT_BID_PROBABILITY,
  } = options;
  const applyRivalBid = useAuctionStore((s) => s.applyRivalBid);

  useEffect(() => {
    if (!enabled) return;

    const id = setInterval(() => {
      if (computeTiming(vehicle, Date.now()).status !== 'live') return;
      if (Math.random() > bidProbability) return;

      const amount = nextRivalBid(vehicle);
      if (amount !== null) applyRivalBid(vehicle.id, amount);
    }, tickMs);

    return () => clearInterval(id);
  }, [vehicle, enabled, tickMs, bidProbability, applyRivalBid]);
}

/**
 * Catalog-wide variant: on each tick, picks one random live lot and (subject to
 * `bidProbability`) posts a rival bid on it. Touching a single lot per tick keeps
 * the grid feeling active without a thundering herd of simultaneous updates.
 */
export function useLiveInventorySim(
  vehicles: readonly Vehicle[],
  options: LiveAuctionOptions = {},
): void {
  const {
    enabled = true,
    tickMs = DEFAULT_TICK_MS,
    bidProbability = DEFAULT_BID_PROBABILITY,
  } = options;
  const applyRivalBid = useAuctionStore((s) => s.applyRivalBid);

  useEffect(() => {
    if (!enabled || vehicles.length === 0) return;

    const id = setInterval(() => {
      if (Math.random() > bidProbability) return;

      const now = Date.now();
      const live = vehicles.filter(
        (v) => computeTiming(v, now).status === 'live',
      );
      if (live.length === 0) return;

      const vehicle = live[Math.floor(Math.random() * live.length)];
      const amount = nextRivalBid(vehicle);
      if (amount !== null) applyRivalBid(vehicle.id, amount);
    }, tickMs);

    return () => clearInterval(id);
  }, [vehicles, enabled, tickMs, bidProbability, applyRivalBid]);
}
