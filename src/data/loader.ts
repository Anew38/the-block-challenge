import rawVehicles from './vehicles.json';
import { normalizeVehicle } from './normalize';
import type { RawVehicle, Vehicle } from './types';

/**
 * The in-memory catalog: the dataset normalized once at module load and treated
 * as immutable. Bid mutations live in the store overlay, never here.
 */
export const catalog: readonly Vehicle[] = Object.freeze(
  (rawVehicles as RawVehicle[]).map(normalizeVehicle),
);

const byId = new Map<string, Vehicle>(catalog.map((v) => [v.id, v]));

/** O(1) lookup by vehicle id; `undefined` for unknown ids (e.g. bad URL). */
export function getVehicleById(id: string): Vehicle | undefined {
  return byId.get(id);
}

export const vehicleCount = catalog.length;

/**
 * Earliest/latest `auction_start` across the dataset, in epoch ms. The timing
 * helper uses these bounds to remap synthetic timestamps onto a window around
 * "now".
 */
export const datasetTimeBounds: { startMs: number; endMs: number } = (() => {
  let startMs = Number.POSITIVE_INFINITY;
  let endMs = Number.NEGATIVE_INFINITY;
  for (const v of catalog) {
    if (v.auctionStartMs < startMs) startMs = v.auctionStartMs;
    if (v.auctionStartMs > endMs) endMs = v.auctionStartMs;
  }
  return { startMs, endMs };
})();
