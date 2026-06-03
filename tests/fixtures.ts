import type { AuctionTiming, Vehicle } from '@/data/types';
import type { InventoryItem } from '@/features/inventory/types';

/** Minimal vehicle for component tests — only fields the UI reads. */
export function makeTestVehicle(overrides: Partial<Vehicle> = {}): Vehicle {
  return {
    id: 'test-vehicle-1',
    vin: '1HGCM82633A123456',
    lot: 'LOT-42',
    year: 2020,
    make: 'Honda',
    model: 'Civic',
    trim: 'EX',
    bodyStyle: 'sedan',
    exteriorColor: 'Silver',
    interiorColor: 'Black',
    engine: '2.0L I4',
    transmission: 'automatic',
    drivetrain: 'FWD',
    odometerKm: 45_000,
    fuelType: 'gasoline',
    conditionGrade: 4.2,
    conditionReport: 'Good overall condition.',
    damageNotes: [],
    titleStatus: 'clean',
    city: 'Toronto',
    province: 'ON',
    sellingDealership: 'Test Motors',
    images: ['https://example.com/civic.jpg'],
    startingBid: 4_000,
    reservePrice: 8_000,
    buyNowPrice: 15_000,
    auctionStart: '2024-01-01T12:00:00.000Z',
    auctionStartMs: Date.parse('2024-01-01T12:00:00.000Z'),
    currentBid: 5_200,
    bidCount: 3,
    ...overrides,
  };
}

export function makeLiveTiming(msRemaining = 3_600_000): AuctionTiming {
  const now = Date.now();
  return {
    status: 'live',
    startsAt: now - 60_000,
    endsAt: now + msRemaining,
    msToStart: 0,
    msRemaining,
  };
}

export function makeInventoryItem(
  overrides: Partial<InventoryItem> = {},
): InventoryItem {
  const vehicle = overrides.vehicle ?? makeTestVehicle();
  return {
    vehicle,
    currentBid: overrides.currentBid ?? vehicle.currentBid,
    bidCount: overrides.bidCount ?? vehicle.bidCount,
    reserveMet: overrides.reserveMet ?? false,
    timing: overrides.timing ?? makeLiveTiming(),
    ...overrides,
  };
}
