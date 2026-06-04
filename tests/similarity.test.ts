import { describe, expect, it } from 'vitest';
import type { Vehicle } from '@/data/types';
import {
  findSimilarVehicles,
  PRICE_BAND,
  SIMILARITY_WEIGHTS,
} from '@/features/recommendations/similarity';
import { makeTestVehicle } from './fixtures';

/** Target lot: a ~$10k Honda Civic sedan (current bid above starting bid). */
function makeTarget(overrides: Partial<Vehicle> = {}): Vehicle {
  return makeTestVehicle({
    id: 'target',
    make: 'Honda',
    model: 'Civic',
    bodyStyle: 'sedan',
    startingBid: 8_000,
    currentBid: 10_000,
    ...overrides,
  });
}

describe('findSimilarVehicles', () => {
  it('excludes the target vehicle itself', () => {
    const target = makeTarget();
    const result = findSimilarVehicles(target, [target]);
    expect(result).toHaveLength(0);
  });

  it('omits lots with no shared attribute', () => {
    const target = makeTarget();
    const unrelated = makeTestVehicle({
      id: 'unrelated',
      make: 'Ferrari',
      model: 'F8',
      bodyStyle: 'coupe',
      startingBid: 250_000,
      currentBid: 300_000,
    });
    const result = findSimilarVehicles(target, [target, unrelated]);
    expect(result).toHaveLength(0);
  });

  it('honors the exclude predicate (e.g. ended auctions)', () => {
    const target = makeTarget();
    const ended = makeTestVehicle({ id: 'ended', model: 'Civic' });
    const result = findSimilarVehicles(target, [target, ended], {
      exclude: (v) => v.id === 'ended',
    });
    expect(result).toHaveLength(0);
  });

  it('ranks a same-model, comparably-priced lot above a body-style-only match', () => {
    const target = makeTarget();
    const strong = makeTestVehicle({
      id: 'strong',
      make: 'Honda',
      model: 'Civic',
      bodyStyle: 'sedan',
      startingBid: 9_500,
      currentBid: 10_200,
    });
    const weak = makeTestVehicle({
      id: 'weak',
      make: 'Toyota',
      model: 'Corolla',
      bodyStyle: 'sedan',
      startingBid: 40_000,
      currentBid: 45_000,
    });

    const result = findSimilarVehicles(target, [target, weak, strong]);
    expect(result.map((r) => r.vehicle.id)).toEqual(['strong', 'weak']);
    expect(result[0].score).toBe(
      SIMILARITY_WEIGHTS.make +
        SIMILARITY_WEIGHTS.model +
        SIMILARITY_WEIGHTS.bodyStyle +
        SIMILARITY_WEIGHTS.price
    );
  });

  it('awards the price weight only within ±20% of the target price', () => {
    const target = makeTarget(); // reference price = 10_000
    // Same make (a constant baseline), different model/body, so only the price
    // band determines whether the price weight is added.
    const justInside = makeTestVehicle({
      id: 'inside',
      make: 'Honda',
      model: 'Accord',
      bodyStyle: 'coupe',
      startingBid: 10_000 * (1 + PRICE_BAND),
      currentBid: 0,
    });
    const justOutside = makeTestVehicle({
      id: 'outside',
      make: 'Honda',
      model: 'Accord',
      bodyStyle: 'coupe',
      startingBid: 10_000 * (1 + PRICE_BAND) + 1,
      currentBid: 0,
    });

    const [inside] = findSimilarVehicles(target, [target, justInside]);
    const [outside] = findSimilarVehicles(target, [target, justOutside]);
    expect(inside.score).toBe(
      SIMILARITY_WEIGHTS.make + SIMILARITY_WEIGHTS.price
    );
    expect(outside.score).toBe(SIMILARITY_WEIGHTS.make);
  });

  it('caps the result count at the requested limit', () => {
    const target = makeTarget();
    const peers = Array.from({ length: 10 }, (_, i) =>
      makeTestVehicle({ id: `peer-${i}`, make: 'Honda', model: 'Civic' })
    );
    const result = findSimilarVehicles(target, [target, ...peers], {
      limit: 4,
    });
    expect(result).toHaveLength(4);
  });
});
