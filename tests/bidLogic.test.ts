import { describe, expect, it } from 'vitest';
import {
  currentFloor,
  isReserveMet,
  minIncrement,
  minNextBid,
  validateBid,
} from '@/features/bidding/bidLogic';

describe('currentFloor', () => {
  it('uses the higher of current bid and starting bid', () => {
    expect(currentFloor(12_000, 8_000)).toBe(12_000);
    expect(currentFloor(5_000, 9_500)).toBe(9_500);
    expect(currentFloor(10_000, 10_000)).toBe(10_000);
  });
});

describe('minIncrement', () => {
  it('applies tiered increments by price band', () => {
    expect(minIncrement(500)).toBe(25);
    expect(minIncrement(999)).toBe(25);
    expect(minIncrement(1_000)).toBe(50);
    expect(minIncrement(4_999)).toBe(50);
    expect(minIncrement(5_000)).toBe(100);
    expect(minIncrement(24_999)).toBe(250);
    expect(minIncrement(50_000)).toBe(1_000);
    expect(minIncrement(200_000)).toBe(1_000);
  });
});

describe('minNextBid', () => {
  it('adds the increment for the current floor', () => {
    expect(minNextBid(5_000, 4_000)).toBe(5_100);
    expect(minNextBid(800, 800)).toBe(825);
    expect(minNextBid(0, 12_000)).toBe(12_250);
  });
});

describe('isReserveMet', () => {
  it('is always met when there is no reserve', () => {
    expect(isReserveMet(1, null)).toBe(true);
  });

  it('compares current bid to reserve when present', () => {
    expect(isReserveMet(9_999, 10_000)).toBe(false);
    expect(isReserveMet(10_000, 10_000)).toBe(true);
    expect(isReserveMet(15_000, 10_000)).toBe(true);
  });
});

describe('validateBid', () => {
  const base = {
    currentBid: 5_000,
    startingBid: 4_000,
    buyNowPrice: 25_000 as number | null,
  };

  it('accepts a bid at the minimum next amount', () => {
    const result = validateBid({ ...base, amount: 5_100 });
    expect(result).toEqual({ ok: true, minimumBid: 5_100 });
  });

  it('accepts bids above the minimum', () => {
    const result = validateBid({ ...base, amount: 6_500 });
    expect(result.ok).toBe(true);
    expect(result.minimumBid).toBe(5_100);
  });

  it('rejects non-finite or non-positive amounts', () => {
    expect(validateBid({ ...base, amount: 0 }).ok).toBe(false);
    expect(validateBid({ ...base, amount: -100 }).ok).toBe(false);
    expect(validateBid({ ...base, amount: Number.NaN }).ok).toBe(false);
    expect(validateBid({ ...base, amount: Number.POSITIVE_INFINITY }).ok).toBe(
      false,
    );
    expect(validateBid({ ...base, amount: 0 }).error).toMatch(/valid bid/i);
  });

  it('rejects bids below the minimum increment', () => {
    const result = validateBid({ ...base, amount: 5_050 });
    expect(result.ok).toBe(false);
    expect(result.error).toMatch(/Minimum bid is \$5,100/);
    expect(result.minimumBid).toBe(5_100);
  });

  it('rejects bids at or above buy-now when buy-now is set', () => {
    const atBuyNow = validateBid({ ...base, amount: 25_000 });
    expect(atBuyNow.ok).toBe(false);
    expect(atBuyNow.error).toMatch(/Buy Now/i);

    const aboveBuyNow = validateBid({ ...base, amount: 30_000 });
    expect(aboveBuyNow.ok).toBe(false);
  });

  it('allows bids up to just below buy-now', () => {
    const result = validateBid({ ...base, amount: 24_999 });
    expect(result.ok).toBe(true);
  });

  it('skips buy-now ceiling when buy-now is null', () => {
    const result = validateBid({
      currentBid: 50_000,
      startingBid: 40_000,
      buyNowPrice: null,
      amount: 100_000,
    });
    expect(result.ok).toBe(true);
  });

  it('uses starting bid when current bid is lower', () => {
    const result = validateBid({
      currentBid: 3_000,
      startingBid: 8_000,
      buyNowPrice: null,
      amount: 8_050,
    });
    expect(result.ok).toBe(false);
    expect(result.minimumBid).toBe(8_100);

    const valid = validateBid({
      currentBid: 3_000,
      startingBid: 8_000,
      buyNowPrice: null,
      amount: 8_100,
    });
    expect(valid.ok).toBe(true);
  });
});
