import type { ChangeEvent, ReactNode } from 'react';
import { SlidersHorizontal, X } from 'lucide-react';
import type { AuctionStatus, BodyStyle, TitleStatus } from '@/data/types';
import type { InventoryFilters, SortKey } from './types';
import type { FilterOptions } from './useInventoryFilters';

const SELECT_CLASS =
  'rounded-lg border border-slate-800 bg-slate-900/60 px-3 py-2 text-sm text-slate-200 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500';

const TITLE_STATUSES: TitleStatus[] = ['clean', 'rebuilt', 'salvage'];
const AUCTION_STATUSES: AuctionStatus[] = ['live', 'scheduled', 'ended'];
const MIN_GRADES = [2, 2.5, 3, 3.5, 4, 4.5];

const SORT_LABELS: Record<SortKey, string> = {
  'ending-soon': 'Ending soonest',
  'price-asc': 'Price: low to high',
  'price-desc': 'Price: high to low',
  'year-desc': 'Year: newest',
  'year-asc': 'Year: oldest',
  'odometer-asc': 'Odometer: lowest',
  'condition-desc': 'Condition: best',
};

interface FieldProps {
  label: string;
  children: ReactNode;
}

function Field({ label, children }: FieldProps) {
  return (
    <label className="flex flex-col gap-1 text-xs font-medium text-slate-400">
      {label}
      {children}
    </label>
  );
}

interface FilterBarProps {
  filters: InventoryFilters;
  options: FilterOptions;
  setFilter: <K extends keyof InventoryFilters>(
    key: K,
    value: InventoryFilters[K]
  ) => void;
  hasActiveFilters: boolean;
  clearAll: () => void;
}

export function FilterBar({
  filters,
  options,
  setFilter,
  hasActiveFilters,
  clearAll,
}: FilterBarProps) {
  /** Parse a price field into a number, treating empty/invalid input as "no bound". */
  const parsePrice = (e: ChangeEvent<HTMLInputElement>): number | null => {
    const value = Number(e.target.value);
    return e.target.value === '' || Number.isNaN(value) ? null : value;
  };

  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/30 p-4">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm font-medium text-slate-300">
          <SlidersHorizontal className="h-4 w-4 text-slate-500" />
          Filters &amp; sort
        </div>
        {hasActiveFilters && (
          <button
            type="button"
            onClick={clearAll}
            className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-slate-400 hover:bg-slate-800 hover:text-slate-200"
          >
            <X className="h-3.5 w-3.5" />
            Clear all
          </button>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
        <Field label="Make">
          <select
            className={SELECT_CLASS}
            value={filters.make}
            onChange={(e) => setFilter('make', e.target.value)}
          >
            <option value="">All makes</option>
            {options.makes.map((make) => (
              <option key={make} value={make}>
                {make}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Body style">
          <select
            className={SELECT_CLASS}
            value={filters.bodyStyle}
            onChange={(e) =>
              setFilter('bodyStyle', e.target.value as BodyStyle | '')
            }
          >
            <option value="">All styles</option>
            {options.bodyStyles.map((style) => (
              <option key={style} value={style}>
                {style}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Province">
          <select
            className={SELECT_CLASS}
            value={filters.province}
            onChange={(e) => setFilter('province', e.target.value)}
          >
            <option value="">All provinces</option>
            {options.provinces.map((province) => (
              <option key={province} value={province}>
                {province}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Title status">
          <select
            className={SELECT_CLASS}
            value={filters.titleStatus}
            onChange={(e) =>
              setFilter('titleStatus', e.target.value as TitleStatus | '')
            }
          >
            <option value="">Any title</option>
            {TITLE_STATUSES.map((status) => (
              <option key={status} value={status} className="capitalize">
                {status}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Auction status">
          <select
            className={SELECT_CLASS}
            value={filters.status}
            onChange={(e) =>
              setFilter('status', e.target.value as AuctionStatus | '')
            }
          >
            <option value="">Any status</option>
            {AUCTION_STATUSES.map((status) => (
              <option key={status} value={status} className="capitalize">
                {status}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Min condition">
          <select
            className={SELECT_CLASS}
            value={filters.minGrade}
            onChange={(e) => setFilter('minGrade', Number(e.target.value))}
          >
            <option value={0}>Any grade</option>
            {MIN_GRADES.map((grade) => (
              <option key={grade} value={grade}>
                {grade.toFixed(1)}+
              </option>
            ))}
          </select>
        </Field>

        <Field label="Min price">
          <input
            type="number"
            inputMode="numeric"
            min={0}
            step={500}
            placeholder="No min"
            value={filters.minPrice ?? ''}
            onChange={(e) => setFilter('minPrice', parsePrice(e))}
            className={SELECT_CLASS}
          />
        </Field>

        <Field label="Max price">
          <input
            type="number"
            inputMode="numeric"
            min={0}
            step={500}
            placeholder="No max"
            value={filters.maxPrice ?? ''}
            onChange={(e) => setFilter('maxPrice', parsePrice(e))}
            className={SELECT_CLASS}
          />
        </Field>

        <Field label="Buy Now">
          <div className="flex min-h-[2.375rem] items-center gap-2 rounded-lg border border-slate-800 bg-slate-900/60 px-3 py-2">
            <input
              id="filter-buy-now-only"
              type="checkbox"
              checked={filters.buyNowOnly}
              onChange={(e) => setFilter('buyNowOnly', e.target.checked)}
              className="h-4 w-4 rounded border-slate-600 bg-slate-900 text-indigo-500 focus:ring-indigo-500 focus:ring-offset-slate-900"
            />
            <span className="text-sm text-slate-200">Has Buy Now price</span>
          </div>
        </Field>

        <Field label="Sort by">
          <select
            className={SELECT_CLASS}
            value={filters.sort}
            onChange={(e) => setFilter('sort', e.target.value as SortKey)}
          >
            {(Object.keys(SORT_LABELS) as SortKey[]).map((key) => (
              <option key={key} value={key}>
                {SORT_LABELS[key]}
              </option>
            ))}
          </select>
        </Field>
      </div>
    </div>
  );
}
