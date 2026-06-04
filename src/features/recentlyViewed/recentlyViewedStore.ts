/**
 * Recently-viewed store: a tiny, persisted ring of the vehicle ids the buyer has
 * opened, most-recent-first and de-duplicated. Only ids are stored (the catalog
 * stays the source of truth), so storage is lean and resilient to dataset edits.
 */
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import {
  RECENTLY_VIEWED_LIMIT,
  RECENTLY_VIEWED_STORAGE_KEY,
} from '@/lib/constants';

interface RecentlyViewedStore {
  /** Vehicle ids, most-recent-first, de-duplicated, capped at the limit. */
  ids: string[];
  /** Record a viewed vehicle: hoist it to the front and trim to the limit. */
  addRecent: (id: string) => void;
  /** Clear the entire history. */
  clear: () => void;
}

export const useRecentlyViewedStore = create<RecentlyViewedStore>()(
  persist(
    (set) => ({
      ids: [],
      addRecent: (id) =>
        set((s) => {
          if (s.ids[0] === id) return s;
          const next = [id, ...s.ids.filter((existing) => existing !== id)];
          return { ids: next.slice(0, RECENTLY_VIEWED_LIMIT) };
        }),
      clear: () => set({ ids: [] }),
    }),
    {
      name: RECENTLY_VIEWED_STORAGE_KEY,
      version: 1,
      storage: createJSONStorage(() =>
        typeof window !== 'undefined' ? window.localStorage : memoryStorage()
      ),
      partialize: (state) => ({ ids: state.ids }),
    }
  )
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
