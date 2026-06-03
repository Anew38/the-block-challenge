import type {
  AuctionStatus,
  AuctionTiming,
  BodyStyle,
  TitleStatus,
  Vehicle,
} from '@/data/types';

/** How the inventory grid is ordered. */
export type SortKey =
  | 'ending-soon'
  | 'price-asc'
  | 'price-desc'
  | 'year-desc'
  | 'year-asc'
  | 'odometer-asc'
  | 'condition-desc';

/**
 * The full inventory query. `''`/`null`/`0` consistently mean "no constraint",
 * so a default-constructed filter set matches every lot.
 */
export interface InventoryFilters {
  /** Debounced free-text across make/model/trim/year/VIN/lot. */
  search: string;
  make: string;
  bodyStyle: BodyStyle | '';
  province: string;
  titleStatus: TitleStatus | '';
  status: AuctionStatus | '';
  /** Minimum condition grade (0 = any). */
  minGrade: number;
  minPrice: number | null;
  maxPrice: number | null;
  sort: SortKey;
}

/**
 * A vehicle merged with its live bid overlay and timing — the view model the
 * grid renders. Built fresh per tick from the immutable catalog + store.
 */
export interface InventoryItem {
  vehicle: Vehicle;
  currentBid: number;
  bidCount: number;
  reserveMet: boolean;
  timing: AuctionTiming;
}

export const DEFAULT_FILTERS: InventoryFilters = {
  search: '',
  make: '',
  bodyStyle: '',
  province: '',
  titleStatus: '',
  status: '',
  minGrade: 0,
  minPrice: null,
  maxPrice: null,
  sort: 'ending-soon',
};
