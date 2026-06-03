/**
 * Inventory filters store: the durable home for the buyer's search, filters, and
 * sort. Persisted to localStorage so the exact view survives both unmounts
 * (opening a lot and coming back) and full page reloads.
 *
 * It holds two related fields: `searchInput` is the raw, undebounced value bound
 * to the search box, while `filters.search` is the debounced term that actually
 * drives selection. The debounce timing lives in `useInventoryFilters`, which
 * commits `searchInput` into `filters.search` via `setSearch`.
 */
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { INVENTORY_FILTERS_STORAGE_KEY } from '@/lib/constants';
import { DEFAULT_FILTERS, type InventoryFilters } from './types';

interface InventoryFiltersStore {
  /** Applied filters (`filters.search` is the debounced query term). */
  filters: InventoryFilters;
  /** Raw, undebounced search box value for the controlled input. */
  searchInput: string;
  setSearchInput: (value: string) => void;
  /** Commit the debounced search term into `filters` (no-op if unchanged). */
  setSearch: (value: string) => void;
  /** Patch a single filter/sort field. */
  setFilter: <K extends keyof InventoryFilters>(
    key: K,
    value: InventoryFilters[K]
  ) => void;
  /** Reset search and every filter/sort back to defaults. */
  clearAll: () => void;
}

export const useInventoryFiltersStore = create<InventoryFiltersStore>()(
  persist(
    (set) => ({
      filters: DEFAULT_FILTERS,
      searchInput: '',
      setSearchInput: (value) => set({ searchInput: value }),
      setSearch: (value) =>
        set((s) =>
          s.filters.search === value
            ? s
            : { filters: { ...s.filters, search: value } }
        ),
      setFilter: (key, value) =>
        set((s) => ({ filters: { ...s.filters, [key]: value } })),
      clearAll: () => set({ filters: DEFAULT_FILTERS, searchInput: '' }),
    }),
    {
      name: INVENTORY_FILTERS_STORAGE_KEY,
      version: 1,
      storage: createJSONStorage(() =>
        typeof window !== 'undefined' ? window.localStorage : memoryStorage(),
      ),
      // Persist only the query state; actions are recreated on each load.
      partialize: (state) => ({
        filters: state.filters,
        searchInput: state.searchInput,
      }),
    },
  ),
);

/** In-memory Storage shim for non-browser environments (SSR, some test runs). */
function memoryStorage(): Storage {
  const map = new Map<string, string>();
  return {
    get length() {
      return map.size;
    },
    clear: () => map.clear(),
    getItem: (key) => map.get(key) ?? null,
    key: (index) => Array.from(map.keys())[index] ?? null,
    removeItem: (key) => void map.delete(key),
    setItem: (key, value) => void map.set(key, value),
  };
}
