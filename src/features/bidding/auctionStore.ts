/**
 * Auction store: the single source of truth for live bid state, persisted to
 * localStorage. It holds only the *overlay* on top of the immutable dataset
 * (keyed by vehicle id), so storage stays lean and the catalog re-seedable.
 *
 * All money rules live in `bidLogic.ts`; this store wires those pure helpers to
 * persisted state and exposes the actions the UI and live simulation call.
 */
import { useMemo } from 'react';
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { getVehicleById } from '@/data/loader';
import { createInitialBidState } from '@/data/normalize';
import type { Bid, BidState, Vehicle } from '@/data/types';
import { BID_STORAGE_KEY } from '@/lib/constants';
import { isReserveMet, validateBid } from './bidLogic';

/** Outcome of a user-initiated action; `error` is set only on failure. */
export interface BidActionResult {
  ok: boolean;
  error?: string;
}

interface AuctionStore {
  /** Persisted bid overlay, keyed by vehicle id. Absent ⇒ untouched lot. */
  bids: Record<string, BidState>;
  /** Validate and place a user bid. Returns `{ ok }` or `{ ok: false, error }`. */
  placeBid: (vehicleId: string, amount: number) => BidActionResult;
  /** Purchase outright at the lot's buy-now price, if one exists. */
  buyNow: (vehicleId: string) => BidActionResult;
  /** Raise the current bid as a simulated rival; ignored if it can't apply. */
  applyRivalBid: (vehicleId: string, amount: number) => void;
  /** Read the overlay for a vehicle, falling back to its dataset seed. */
  getBidState: (vehicle: Vehicle) => BidState;
  /** Clear a single lot back to its dataset seed (drops stored bids). */
  resetVehicle: (vehicleId: string) => void;
  /** Clear every overlay — useful for demos and tests. */
  resetAll: () => void;
}

/** Best-effort unique id for a bid event. */
function createBidId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }
  return `bid_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

/** Pure overlay transition: apply `bid` on top of the previous bid state. */
function applyBid(prev: BidState, vehicle: Vehicle, bid: Bid): BidState {
  return {
    currentBid: bid.amount,
    bidCount: prev.bidCount + 1,
    history: [bid, ...prev.history],
    reserveMet: isReserveMet(bid.amount, vehicle.reservePrice),
  };
}

export const useAuctionStore = create<AuctionStore>()(
  persist(
    (set, get) => ({
      bids: {},

      placeBid: (vehicleId, amount) => {
        const vehicle = getVehicleById(vehicleId);
        if (!vehicle) return { ok: false, error: 'Vehicle not found.' };

        const state = get().bids[vehicleId] ?? createInitialBidState(vehicle);
        const result = validateBid({
          amount,
          currentBid: state.currentBid,
          startingBid: vehicle.startingBid,
          buyNowPrice: vehicle.buyNowPrice,
        });
        if (!result.ok) return { ok: false, error: result.error };

        const bid: Bid = {
          id: createBidId(),
          vehicleId,
          amount,
          placedAt: Date.now(),
          source: 'you',
        };
        set((s) => ({
          bids: { ...s.bids, [vehicleId]: applyBid(state, vehicle, bid) },
        }));
        return { ok: true };
      },

      buyNow: (vehicleId) => {
        const vehicle = getVehicleById(vehicleId);
        if (!vehicle) return { ok: false, error: 'Vehicle not found.' };
        if (vehicle.buyNowPrice === null) {
          return { ok: false, error: 'This lot has no Buy Now price.' };
        }

        const state = get().bids[vehicleId] ?? createInitialBidState(vehicle);
        if (state.currentBid >= vehicle.buyNowPrice) {
          return {
            ok: false,
            error: 'The current bid already meets the Buy Now price.',
          };
        }

        const bid: Bid = {
          id: createBidId(),
          vehicleId,
          amount: vehicle.buyNowPrice,
          placedAt: Date.now(),
          source: 'you',
        };
        set((s) => ({
          bids: { ...s.bids, [vehicleId]: applyBid(state, vehicle, bid) },
        }));
        return { ok: true };
      },

      applyRivalBid: (vehicleId, amount) => {
        const vehicle = getVehicleById(vehicleId);
        if (!vehicle) return;

        const state = get().bids[vehicleId] ?? createInitialBidState(vehicle);
        // Rivals must raise the price, and never reach/clear buy-now (which
        // would end the lot). Silently ignore anything that can't apply.
        if (!Number.isFinite(amount) || amount <= state.currentBid) return;
        if (vehicle.buyNowPrice !== null && amount >= vehicle.buyNowPrice) return;

        const bid: Bid = {
          id: createBidId(),
          vehicleId,
          amount,
          placedAt: Date.now(),
          source: 'rival',
        };
        set((s) => ({
          bids: { ...s.bids, [vehicleId]: applyBid(state, vehicle, bid) },
        }));
      },

      getBidState: (vehicle) =>
        get().bids[vehicle.id] ?? createInitialBidState(vehicle),

      resetVehicle: (vehicleId) =>
        set((s) => {
          if (!(vehicleId in s.bids)) return s;
          const next = { ...s.bids };
          delete next[vehicleId];
          return { bids: next };
        }),

      resetAll: () => set({ bids: {} }),
    }),
    {
      name: BID_STORAGE_KEY,
      version: 1,
      storage: createJSONStorage(() =>
        typeof window !== 'undefined' ? window.localStorage : memoryStorage(),
      ),
      // Only the overlay is durable; actions are recreated on each load.
      partialize: (state) => ({ bids: state.bids }),
    },
  ),
);

/**
 * Reactive read of a vehicle's bid state. Subscribes to the stored overlay and
 * falls back to a memoized dataset seed when the lot is still untouched, so the
 * reference stays stable across renders (no update loops).
 */
export function useBidState(vehicle: Vehicle): BidState {
  const stored = useAuctionStore((s) => s.bids[vehicle.id]);
  const seed = useMemo(() => createInitialBidState(vehicle), [vehicle]);
  return stored ?? seed;
}

/** In-memory Storage shim for non-browser environments (SSR, some test runs). */
function memoryStorage(): Storage {
  const map = new Map<string, string>();
  return {
    get length() {
      return map.size;
    },
    clear: () => map.clear(),
    getItem: (key) => map.get(key) ?? null,
    key: (index) => Array.from(map.keys())[index] ?? null,
    removeItem: (key) => void map.delete(key),
    setItem: (key, value) => void map.set(key, value),
  };
}
