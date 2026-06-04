import { describe, expect, it } from 'vitest';
import type { Vehicle } from '@/data/types';
import {
  computeDealScore,
  DEAL_SCORE_WEIGHTS,
} from '@/features/insights/dealScore';
import { makeTestVehicle } from './fixtures';

/** Same-model-year peers so the mileage benchmark has a median to use. */
function makePeers(odometerKm: number, count = 4): Vehicle[] {
  return Array.from({ length: count }, (_, i) =>
    makeTestVehicle({ id: `peer-${i}`, odometerKm }),
  );
}

describe('computeDealScore — output shape', () => {
  it('returns a 0–10 score rounded to one decimal', () => {
    const vehicle = makeTestVehicle();
    const { score } = computeDealScore({ vehicle, catalog: [vehicle] });

    expect(score).toBeGreaterThanOrEqual(0);
    expect(score).toBeLessThanOrEqual(10);
    // One-decimal rounding: x10 should be an integer.
    expect(Number.isInteger(Math.round(score * 10))).toBe(true);
    expect(score).toBe(Math.round(score * 10) / 10);
  });

  it('weights sum to 1 so the blend stays on the 0–10 scale', () => {
    const sum =
      DEAL_SCORE_WEIGHTS.mileage +
      DEAL_SCORE_WEIGHTS.year +
      DEAL_SCORE_WEIGHTS.value;
    expect(sum).toBeCloseTo(1, 10);
  });
});

describe('computeDealScore — calibration', () => {
  it('lands a thoroughly average car in the 6–7.9 medium band', () => {
    // Average across all three factors: mileage at the same-year median (ratio
    // 1.0 → 0.5), mid year within the catalog range (→ 0.5), and a bid at half
    // the Buy Now ceiling (→ 0.5).
    const subject = makeTestVehicle({
      id: 'subject',
      year: 2020,
      odometerKm: 60_000,
      buyNowPrice: 20_000,
    });
    const peers = Array.from({ length: 3 }, (_, i) =>
      makeTestVehicle({ id: `peer-${i}`, year: 2020, odometerKm: 60_000 }),
    );
    const range = [
      makeTestVehicle({ id: 'oldest', year: 2015 }),
      makeTestVehicle({ id: 'newest', year: 2025 }),
    ];
    const catalog = [subject, ...peers, ...range];

    const { score } = computeDealScore({
      vehicle: subject,
      currentBid: 10_000,
      catalog,
    });

    expect(score).toBeGreaterThanOrEqual(6);
    expect(score).toBeLessThanOrEqual(7.9);
  });

  it('scores a good-deal find at 7.0 or higher', () => {
    // Average mileage and year, but a standout price: the bid sits at a fifth of
    // the Buy Now ceiling, which should be enough to read as a good deal.
    const subject = makeTestVehicle({
      id: 'subject',
      year: 2020,
      odometerKm: 60_000,
      buyNowPrice: 20_000,
    });
    const peers = Array.from({ length: 3 }, (_, i) =>
      makeTestVehicle({ id: `peer-${i}`, year: 2020, odometerKm: 60_000 }),
    );
    const range = [
      makeTestVehicle({ id: 'oldest', year: 2015 }),
      makeTestVehicle({ id: 'newest', year: 2025 }),
    ];
    const catalog = [subject, ...peers, ...range];

    const { score } = computeDealScore({
      vehicle: subject,
      currentBid: 4_000,
      catalog,
    });

    expect(score).toBeGreaterThanOrEqual(7);
  });
});

describe('computeDealScore — mileage sub-score', () => {
  it('rewards below-median mileage for the model year', () => {
    const low = makeTestVehicle({ odometerKm: 30_000 });
    const high = makeTestVehicle({ odometerKm: 120_000 });
    const catalog = [low, high, ...makePeers(90_000)];

    const lowScore = computeDealScore({ vehicle: low, catalog });
    const highScore = computeDealScore({ vehicle: high, catalog });

    expect(lowScore.components.mileage).toBeGreaterThan(
      highScore.components.mileage,
    );
    expect(lowScore.score).toBeGreaterThan(highScore.score);
  });
});

describe('computeDealScore — year sub-score', () => {
  it('rewards newer model years within the catalog range', () => {
    const newer = makeTestVehicle({ id: 'newer', year: 2024 });
    const older = makeTestVehicle({ id: 'older', year: 2014 });
    const catalog = [newer, older];

    const newerScore = computeDealScore({ vehicle: newer, catalog });
    const olderScore = computeDealScore({ vehicle: older, catalog });

    expect(newerScore.components.year).toBeGreaterThan(
      olderScore.components.year,
    );
  });

  it('falls back to a neutral 0.5 for a single-year catalog', () => {
    const vehicle = makeTestVehicle();
    const { components } = computeDealScore({ vehicle, catalog: [vehicle] });
    expect(components.year).toBe(0.5);
  });
});

describe('computeDealScore — value sub-score', () => {
  it('rates more headroom under Buy Now as a better deal', () => {
    const vehicle = makeTestVehicle({ buyNowPrice: 20_000 });

    const cheap = computeDealScore({ vehicle, currentBid: 6_000, catalog: [vehicle] });
    const pricey = computeDealScore({
      vehicle,
      currentBid: 19_000,
      catalog: [vehicle],
    });

    expect(cheap.components.value).toBeGreaterThan(pricey.components.value);
    expect(cheap.score).toBeGreaterThan(pricey.score);
  });

  it('uses the live current bid over the dataset seed', () => {
    const vehicle = makeTestVehicle({ buyNowPrice: 20_000, currentBid: 6_000 });

    const seed = computeDealScore({ vehicle, catalog: [vehicle] });
    const live = computeDealScore({
      vehicle,
      currentBid: 19_000,
      catalog: [vehicle],
    });

    expect(live.components.value).toBeLessThan(seed.components.value);
  });
});
