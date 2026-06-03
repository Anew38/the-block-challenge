import { useEffect, useMemo } from 'react';
import { catalog } from '@/data/loader';
import { useInventoryFiltersStore } from './inventoryFiltersStore';
import { distinct } from './inventorySelectors';
import { DEFAULT_FILTERS, type InventoryFilters } from './types';

const SEARCH_DEBOUNCE_MS = 250;

/** Option lists for the select-style filters, derived once from the catalog. */
export interface FilterOptions {
  makes: string[];
  provinces: string[];
  bodyStyles: string[];
}

export interface UseInventoryFilters {
  /** Applied filters (search is the debounced value used for querying). */
  filters: InventoryFilters;
  /** Raw, undebounced search box value for the controlled input. */
  searchInput: string;
  setSearchInput: (value: string) => void;
  /** Patch one or more non-search filter fields. */
  setFilter: <K extends keyof InventoryFilters>(
    key: K,
    value: InventoryFilters[K]
  ) => void;
  clearAll: () => void;
  /** True when any filter deviates from the defaults (search included). */
  hasActiveFilters: boolean;
  options: FilterOptions;
}

/**
 * Owns the inventory query state: debounced free-text search plus the structured
 * filters and sort. State lives in a persisted Zustand store, so the exact view
 * survives navigation and reloads; this hook only layers on the search debounce
 * and the derived option lists / active-filter flag.
 */
export function useInventoryFilters(): UseInventoryFilters {
  const filters = useInventoryFiltersStore((s) => s.filters);
  const searchInput = useInventoryFiltersStore((s) => s.searchInput);
  const setSearchInput = useInventoryFiltersStore((s) => s.setSearchInput);
  const setSearch = useInventoryFiltersStore((s) => s.setSearch);
  const setFilter = useInventoryFiltersStore((s) => s.setFilter);
  const clearAll = useInventoryFiltersStore((s) => s.clearAll);

  // Keep the raw input responsive while only committing the debounced term to
  // `filters.search`, which drives the (more expensive) selection.
  useEffect(() => {
    const id = setTimeout(() => setSearch(searchInput), SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(id);
  }, [searchInput, setSearch]);

  const options = useMemo<FilterOptions>(
    () => ({
      makes: distinct(catalog, 'make'),
      provinces: distinct(catalog, 'province'),
      bodyStyles: distinct(catalog, 'bodyStyle'),
    }),
    []
  );

  const hasActiveFilters = useMemo(() => {
    return (
      searchInput.trim() !== '' ||
      filters.make !== '' ||
      filters.bodyStyle !== '' ||
      filters.province !== '' ||
      filters.titleStatus !== '' ||
      filters.status !== '' ||
      filters.minGrade > 0 ||
      filters.minPrice !== null ||
      filters.maxPrice !== null ||
      filters.buyNowOnly ||
      filters.sort !== DEFAULT_FILTERS.sort
    );
  }, [filters, searchInput]);

  return {
    filters,
    searchInput,
    setSearchInput,
    setFilter,
    clearAll,
    hasActiveFilters,
    options,
  };
}
