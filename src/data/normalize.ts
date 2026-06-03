import type {
  BidState,
  BodyStyle,
  Drivetrain,
  FuelType,
  RawVehicle,
  TitleStatus,
  Transmission,
  Vehicle,
} from './types';

const TITLE_STATUSES: readonly TitleStatus[] = ['clean', 'rebuilt', 'salvage'];
const BODY_STYLES: readonly BodyStyle[] = [
  'SUV',
  'sedan',
  'coupe',
  'hatchback',
  'truck',
];
const TRANSMISSIONS: readonly Transmission[] = [
  'automatic',
  'manual',
  'CVT',
  'single-speed',
];
const FUEL_TYPES: readonly FuelType[] = [
  'gasoline',
  'hybrid',
  'electric',
  'diesel',
];
const DRIVETRAINS: readonly Drivetrain[] = ['FWD', 'RWD', 'AWD', '4WD'];

/**
 * Narrows a free-form string to a known union, falling back to the first member
 * when the dataset contains an unexpected value. Keeps the UI total over the
 * union without throwing on dirty data.
 */
function asMember<T extends string>(
  value: string,
  members: readonly T[],
  fallback: T,
): T {
  return (members as readonly string[]).includes(value) ? (value as T) : fallback;
}

/** Maps one snake_case dataset record into the immutable camelCase domain model. */
export function normalizeVehicle(raw: RawVehicle): Vehicle {
  return {
    id: raw.id,
    vin: raw.vin,
    lot: raw.lot,
    year: raw.year,
    make: raw.make,
    model: raw.model,
    trim: raw.trim,
    bodyStyle: asMember(raw.body_style, BODY_STYLES, 'sedan'),
    exteriorColor: raw.exterior_color,
    interiorColor: raw.interior_color,
    engine: raw.engine,
    transmission: asMember(raw.transmission, TRANSMISSIONS, 'automatic'),
    drivetrain: asMember(raw.drivetrain, DRIVETRAINS, 'FWD'),
    odometerKm: raw.odometer_km,
    fuelType: asMember(raw.fuel_type, FUEL_TYPES, 'gasoline'),
    conditionGrade: raw.condition_grade,
    conditionReport: raw.condition_report,
    damageNotes: raw.damage_notes ?? [],
    titleStatus: asMember(raw.title_status, TITLE_STATUSES, 'clean'),
    city: raw.city,
    province: raw.province,
    sellingDealership: raw.selling_dealership,
    images: raw.images ?? [],
    startingBid: raw.starting_bid,
    reservePrice: raw.reserve_price,
    buyNowPrice: raw.buy_now_price,
    auctionStart: raw.auction_start,
    auctionStartMs: Date.parse(raw.auction_start),
    currentBid: raw.current_bid,
    bidCount: raw.bid_count,
  };
}

/**
 * Builds the initial persisted overlay for a vehicle from its dataset seed.
 * The store uses this when a vehicle has no stored bids yet, keeping the base
 * dataset re-seedable and `localStorage` lean.
 */
export function createInitialBidState(vehicle: Vehicle): BidState {
  const currentBid = Math.max(vehicle.currentBid, vehicle.startingBid);
  return {
    currentBid,
    bidCount: vehicle.bidCount,
    history: [],
    reserveMet: vehicle.reservePrice === null || currentBid >= vehicle.reservePrice,
  };
}
