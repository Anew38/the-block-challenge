import { useCallback, useEffect, useMemo, useState } from 'react';
import { catalog } from '@/data/loader';
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
 * filters and sort. Keeps the raw input responsive while only committing the
 * debounced term to `filters`, which drives the (more expensive) selection.
 */
export function useInventoryFilters(): UseInventoryFilters {
  const [filters, setFilters] = useState<InventoryFilters>(DEFAULT_FILTERS);
  const [searchInput, setSearchInput] = useState('');

  useEffect(() => {
    const id = setTimeout(() => {
      setFilters((prev) =>
        prev.search === searchInput ? prev : { ...prev, search: searchInput }
      );
    }, SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(id);
  }, [searchInput]);

  const setFilter = useCallback(
    <K extends keyof InventoryFilters>(key: K, value: InventoryFilters[K]) => {
      setFilters((prev) => ({ ...prev, [key]: value }));
    },
    []
  );

  const clearAll = useCallback(() => {
    setSearchInput('');
    setFilters(DEFAULT_FILTERS);
  }, []);

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
