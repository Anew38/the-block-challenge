import { createInitialBidState } from '@/data/normalize';
import { computeTiming } from '@/data/timing';
import type { AuctionStatus, BidState, Vehicle } from '@/data/types';
import type { InventoryFilters, InventoryItem, SortKey } from './types';

/** Map of vehicle id → persisted bid overlay (absent ⇒ untouched lot). */
export type BidOverlay = Record<string, BidState>;

/** Merge a vehicle with its overlay (or dataset seed) and timing at `now`. */
function toItem(
  vehicle: Vehicle,
  overlay: BidOverlay,
  now: number
): InventoryItem {
  const bid = overlay[vehicle.id] ?? createInitialBidState(vehicle);
  return {
    vehicle,
    currentBid: bid.currentBid,
    bidCount: bid.bidCount,
    reserveMet: bid.reserveMet,
    timing: computeTiming(vehicle, now),
  };
}

/** Build a searchable haystack once per item; lowercased for cheap matching. */
function searchHaystack(v: Vehicle): string {
  return [v.year, v.make, v.model, v.trim, v.vin, v.lot]
    .join(' ')
    .toLowerCase();
}

function matches(item: InventoryItem, filters: InventoryFilters): boolean {
  const { vehicle } = item;

  if (filters.search) {
    const needle = filters.search.trim().toLowerCase();
    if (needle && !searchHaystack(vehicle).includes(needle)) return false;
  }
  if (filters.make && vehicle.make !== filters.make) return false;
  if (filters.bodyStyle && vehicle.bodyStyle !== filters.bodyStyle)
    return false;
  if (filters.province && vehicle.province !== filters.province) return false;
  if (filters.titleStatus && vehicle.titleStatus !== filters.titleStatus) {
    return false;
  }
  if (filters.status && item.timing.status !== filters.status) return false;
  if (filters.minGrade > 0 && vehicle.conditionGrade < filters.minGrade) {
    return false;
  }
  if (filters.minPrice !== null && item.currentBid < filters.minPrice) {
    return false;
  }
  if (filters.maxPrice !== null && item.currentBid > filters.maxPrice) {
    return false;
  }
  if (filters.buyNowOnly && vehicle.buyNowPrice === null) return false;
  return true;
}

/** Rank used to group lots in the "ending soon" view: live, then scheduled, then ended. */
const STATUS_RANK: Record<AuctionStatus, number> = {
  live: 0,
  scheduled: 1,
  ended: 2,
};

function compare(a: InventoryItem, b: InventoryItem, sort: SortKey): number {
  switch (sort) {
    case 'price-asc':
      return a.currentBid - b.currentBid;
    case 'price-desc':
      return b.currentBid - a.currentBid;
    case 'year-desc':
      return b.vehicle.year - a.vehicle.year;
    case 'year-asc':
      return a.vehicle.year - b.vehicle.year;
    case 'odometer-asc':
      return a.vehicle.odometerKm - b.vehicle.odometerKm;
    case 'condition-desc':
      return b.vehicle.conditionGrade - a.vehicle.conditionGrade;
    case 'ending-soon':
    default: {
      const rankDelta =
        STATUS_RANK[a.timing.status] - STATUS_RANK[b.timing.status];
      if (rankDelta !== 0) return rankDelta;
      // Within a group: live/scheduled sort by soonest event; ended shows the
      // most recently closed lot first.
      if (a.timing.status === 'ended') return b.timing.endsAt - a.timing.endsAt;
      if (a.timing.status === 'scheduled') {
        return a.timing.msToStart - b.timing.msToStart;
      }
      return a.timing.msRemaining - b.timing.msRemaining;
    }
  }
}

/**
 * Pure pipeline: merge overlay + timing, filter, then sort. Recomputed per tick
 * by the page so countdowns and "ending soon" ordering stay live.
 */
export function selectInventory(
  catalog: readonly Vehicle[],
  overlay: BidOverlay,
  filters: InventoryFilters,
  now: number
): InventoryItem[] {
  const items: InventoryItem[] = [];
  for (const vehicle of catalog) {
    const item = toItem(vehicle, overlay, now);
    if (matches(item, filters)) items.push(item);
  }
  items.sort((a, b) => compare(a, b, filters.sort));
  return items;
}

/** Distinct, sorted values for a select-style filter, derived from the catalog. */
export function distinct<K extends keyof Vehicle>(
  catalog: readonly Vehicle[],
  key: K
): string[] {
  const set = new Set<string>();
  for (const v of catalog) set.add(String(v[key]));
  return Array.from(set).sort((a, b) => a.localeCompare(b));
}
