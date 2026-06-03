/**
 * Domain types for the auction app.
 *
 * The dataset in `vehicles.json` is snake_case; `normalize.ts` maps it to the
 * camelCase domain model below. Components only ever consume the domain types.
 */

export type TitleStatus = 'clean' | 'rebuilt' | 'salvage';
export type BodyStyle = 'SUV' | 'sedan' | 'coupe' | 'hatchback' | 'truck';
export type Transmission = 'automatic' | 'manual' | 'CVT' | 'single-speed';
export type FuelType = 'gasoline' | 'hybrid' | 'electric' | 'diesel';
export type Drivetrain = 'FWD' | 'RWD' | 'AWD' | '4WD';

/** Shape of a single record in `data/vehicles.json` (snake_case, as authored). */
export interface RawVehicle {
  id: string;
  vin: string;
  year: number;
  make: string;
  model: string;
  trim: string;
  body_style: string;
  exterior_color: string;
  interior_color: string;
  engine: string;
  transmission: string;
  drivetrain: string;
  odometer_km: number;
  fuel_type: string;
  condition_grade: number;
  condition_report: string;
  damage_notes: string[];
  title_status: string;
  province: string;
  city: string;
  auction_start: string;
  starting_bid: number;
  reserve_price: number | null;
  buy_now_price: number | null;
  images: string[];
  selling_dealership: string;
  lot: string;
  current_bid: number;
  bid_count: number;
}

/**
 * Normalized, immutable domain vehicle. `currentBid`/`bidCount` are the dataset
 * seed (the market state at import time); the live overlay lives in the store.
 * `auctionStartMs` is the parsed timestamp consumed by the timing helper.
 */
export interface Vehicle {
  id: string;
  vin: string;
  lot: string;
  year: number;
  make: string;
  model: string;
  trim: string;
  bodyStyle: BodyStyle;
  exteriorColor: string;
  interiorColor: string;
  engine: string;
  transmission: Transmission;
  drivetrain: Drivetrain;
  odometerKm: number;
  fuelType: FuelType;
  conditionGrade: number;
  conditionReport: string;
  damageNotes: string[];
  titleStatus: TitleStatus;
  city: string;
  province: string;
  sellingDealership: string;
  images: string[];
  startingBid: number;
  reservePrice: number | null;
  buyNowPrice: number | null;
  /** Raw ISO string from the dataset; remapped relative to "now" at runtime. */
  auctionStart: string;
  /** Parsed `auctionStart` in epoch ms, precomputed for the timing helper. */
  auctionStartMs: number;
  /** Seed values from the dataset; the persisted overlay supersedes these. */
  currentBid: number;
  bidCount: number;
}

export type AuctionStatus = 'scheduled' | 'live' | 'ended';

/** Auction timing derived relative to a given `now`. */
export interface AuctionTiming {
  status: AuctionStatus;
  /** Epoch ms when the (remapped) auction opens. */
  startsAt: number;
  /** Epoch ms when the (remapped) auction closes. */
  endsAt: number;
  /** Ms until the auction opens; 0 once live or ended. */
  msToStart: number;
  /** Ms until the auction closes; 0 once ended. */
  msRemaining: number;
}

/** A single bid event, persisted as part of the overlay. */
export interface Bid {
  id: string;
  vehicleId: string;
  amount: number;
  placedAt: number;
  source: 'you' | 'rival';
}

/** Per-vehicle live bid state — the persisted overlay on top of base data. */
export interface BidState {
  currentBid: number;
  bidCount: number;
  history: Bid[];
  reserveMet: boolean;
}

/** Base vehicle + live bid overlay + timing, as consumed by the UI. */
export interface VehicleViewModel extends Vehicle {
  bid: BidState;
  timing: AuctionTiming;
}
