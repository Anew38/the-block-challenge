import { describe, expect, it } from 'vitest';
import type { AuctionTiming, Bid, BidState, Vehicle } from '@/data/types';
import { deriveInsights, type Insight } from '@/features/vehicle/insightLogic';
import { makeLiveTiming, makeTestVehicle } from './fixtures';

function makeBidState(overrides: Partial<BidState> = {}): BidState {
  return {
    currentBid: 5_200,
    bidCount: 3,
    history: [],
    reserveMet: false,
    ...overrides,
  };
}

/** A handful of comparable sedans so cohort-based rules have a median to use. */
function makeCohort(odometerKm: number, count = 5): Vehicle[] {
  return Array.from({ length: count }, (_, i) =>
    makeTestVehicle({
      id: `peer-${i}`,
      odometerKm,
      currentBid: 12_000,
      startingBid: 11_000,
      conditionGrade: 3.5,
      bidCount: 4,
    }),
  );
}

const ENDED: AuctionTiming = {
  status: 'ended',
  startsAt: Date.now() - 86_400_000,
  endsAt: Date.now() - 1_000,
  msToStart: 0,
  msRemaining: 0,
};

function ids(insights: Insight[]): string[] {
  return insights.map((i) => i.id);
}

describe('deriveInsights — reserve gap analysis', () => {
  it('flags the gap when bidding is below the reserve', () => {
    const vehicle = makeTestVehicle({ reservePrice: 8_000 });
    const bid = makeBidState({ currentBid: 5_200, reserveMet: false });

    const insights = deriveInsights({
      vehicle,
      bid,
      timing: ENDED,
      catalog: [vehicle],
      now: Date.now(),
    });

    const reserve = insights.find((i) => i.kind === 'reserve');
    expect(reserve?.id).toBe('reserve-gap');
    expect(reserve?.tone).toBe('caution');
    // $2,800 short, ~54% over the current bid.
    expect(reserve?.detail).toMatch(/\$2,800/);
    expect(reserve?.detail).toMatch(/54%/);
  });

  it('reports when the reserve has been met', () => {
    const vehicle = makeTestVehicle({ reservePrice: 8_000 });
    const bid = makeBidState({ currentBid: 9_000, reserveMet: true });

    const insights = deriveInsights({
      vehicle,
      bid,
      timing: ENDED,
      catalog: [vehicle],
      now: Date.now(),
    });

    const reserve = insights.find((i) => i.kind === 'reserve');
    expect(reserve?.id).toBe('reserve-met');
    expect(reserve?.tone).toBe('positive');
  });

  it('notes no-reserve lots', () => {
    const vehicle = makeTestVehicle({ reservePrice: null });
    const insights = deriveInsights({
      vehicle,
      bid: makeBidState(),
      timing: ENDED,
      catalog: [vehicle],
      now: Date.now(),
    });

    expect(ids(insights)).toContain('reserve-none');
  });
});

describe('deriveInsights — wholesale spread', () => {
  it('flags a wide gap below Buy Now', () => {
    const vehicle = makeTestVehicle({ buyNowPrice: 15_000 });
    const bid = makeBidState({ currentBid: 5_200 });

    const insights = deriveInsights({
      vehicle,
      bid,
      timing: ENDED,
      catalog: [vehicle],
      now: Date.now(),
    });

    expect(ids(insights)).toContain('buy-now-headroom');
  });

  it('stays quiet when the bid is near Buy Now', () => {
    const vehicle = makeTestVehicle({ buyNowPrice: 15_000 });
    const bid = makeBidState({ currentBid: 14_000 });

    const insights = deriveInsights({
      vehicle,
      bid,
      timing: ENDED,
      catalog: [vehicle],
      now: Date.now(),
    });

    expect(ids(insights)).not.toContain('buy-now-headroom');
  });
});

describe('deriveInsights — mileage vs. peers', () => {
  it('flags below-average mileage against the cohort median', () => {
    const vehicle = makeTestVehicle({ odometerKm: 30_000 });
    const catalog = [vehicle, ...makeCohort(60_000)];

    const insights = deriveInsights({
      vehicle,
      bid: makeBidState(),
      timing: ENDED,
      catalog,
      now: Date.now(),
    });

    const mileage = insights.find((i) => i.kind === 'mileage');
    expect(mileage?.id).toBe('mileage-low');
    expect(mileage?.tone).toBe('positive');
    expect(mileage?.detail).toMatch(/50%/);
  });

  it('flags above-average mileage against the cohort median', () => {
    const vehicle = makeTestVehicle({ odometerKm: 90_000 });
    const catalog = [vehicle, ...makeCohort(60_000)];

    const insights = deriveInsights({
      vehicle,
      bid: makeBidState(),
      timing: ENDED,
      catalog,
      now: Date.now(),
    });

    const mileage = insights.find((i) => i.kind === 'mileage');
    expect(mileage?.id).toBe('mileage-high');
    expect(mileage?.tone).toBe('caution');
  });
});

describe('deriveInsights — bid velocity', () => {
  it('detects a recent flurry on live lots', () => {
    const now = Date.now();
    const recent: Bid[] = Array.from({ length: 3 }, (_, i) => ({
      id: `b-${i}`,
      vehicleId: 'test-vehicle-1',
      amount: 5_000 + i * 100,
      placedAt: now - i * 60_000,
      source: i % 2 === 0 ? 'rival' : 'you',
    }));
    const vehicle = makeTestVehicle();
    const bid = makeBidState({ history: recent });

    const insights = deriveInsights({
      vehicle,
      bid,
      timing: makeLiveTiming(),
      catalog: [vehicle],
      now,
    });

    expect(ids(insights)).toContain('velocity-hot');
  });

  it('does not surface velocity on ended lots', () => {
    const now = Date.now();
    const recent: Bid[] = Array.from({ length: 4 }, (_, i) => ({
      id: `b-${i}`,
      vehicleId: 'test-vehicle-1',
      amount: 5_000 + i * 100,
      placedAt: now - i * 60_000,
      source: 'rival',
    }));
    const vehicle = makeTestVehicle();

    const insights = deriveInsights({
      vehicle,
      bid: makeBidState({ history: recent }),
      timing: ENDED,
      catalog: [vehicle],
      now,
    });

    expect(ids(insights)).not.toContain('velocity-hot');
  });
});

describe('deriveInsights — title status', () => {
  it('cautions on a branded title', () => {
    const vehicle = makeTestVehicle({ titleStatus: 'rebuilt' });
    const insights = deriveInsights({
      vehicle,
      bid: makeBidState(),
      timing: ENDED,
      catalog: [vehicle],
      now: Date.now(),
    });

    const title = insights.find((i) => i.kind === 'title');
    expect(title?.id).toBe('title-branded');
    expect(title?.title).toMatch(/Rebuilt/);
  });

  it('stays quiet on a clean title', () => {
    const vehicle = makeTestVehicle({ titleStatus: 'clean' });
    const insights = deriveInsights({
      vehicle,
      bid: makeBidState(),
      timing: ENDED,
      catalog: [vehicle],
      now: Date.now(),
    });

    expect(ids(insights)).not.toContain('title-branded');
  });
});

describe('deriveInsights — ranking', () => {
  it('caps the list at five and sorts by priority', () => {
    const vehicle = makeTestVehicle({
      reservePrice: 8_000,
      buyNowPrice: 15_000,
      odometerKm: 30_000,
      titleStatus: 'rebuilt',
      conditionGrade: 4.8,
    });
    const now = Date.now();
    const recent: Bid[] = Array.from({ length: 3 }, (_, i) => ({
      id: `b-${i}`,
      vehicleId: 'test-vehicle-1',
      amount: 5_000 + i * 100,
      placedAt: now - i * 60_000,
      source: 'rival',
    }));
    const catalog = [vehicle, ...makeCohort(60_000)];

    const insights = deriveInsights({
      vehicle,
      bid: makeBidState({ currentBid: 5_200, history: recent }),
      timing: makeLiveTiming(),
      catalog,
      now,
    });

    expect(insights.length).toBeLessThanOrEqual(5);
    const priorities = insights.map((i) => i.priority);
    expect(priorities).toEqual([...priorities].sort((a, b) => b - a));
  });

  it('always returns at least the reserve insight', () => {
    const vehicle = makeTestVehicle({
      reservePrice: null,
      buyNowPrice: null,
      titleStatus: 'clean',
      odometerKm: 45_000,
    });
    const insights = deriveInsights({
      vehicle,
      bid: makeBidState(),
      timing: ENDED,
      catalog: [vehicle],
      now: Date.now(),
    });

    expect(insights.length).toBeGreaterThanOrEqual(1);
    expect(insights.some((i) => i.kind === 'reserve')).toBe(true);
  });
});
