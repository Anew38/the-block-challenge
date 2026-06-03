/**
 * Theme store: tracks the buyer's light/dark preference and keeps the
 * `<html>` element's class attribute in sync. Persisted to localStorage
 * so the choice survives reloads and page navigations.
 *
 * `system` falls back to `prefers-color-scheme` and re-evaluates whenever
 * the OS-level preference changes — but only while the buyer hasn't picked
 * an explicit theme.
 */
import { useEffect } from 'react';
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { THEME_STORAGE_KEY } from '@/lib/constants';

export type ThemeMode = 'light' | 'dark' | 'system';
type ResolvedTheme = 'light' | 'dark';

interface ThemeStore {
  /** The buyer's stated preference; `system` defers to the OS. */
  mode: ThemeMode;
  setMode: (mode: ThemeMode) => void;
  /** Toggle between light and dark; jumps off `system` to a concrete value. */
  toggle: () => void;
}

export const useThemeStore = create<ThemeStore>()(
  persist(
    (set, get) => ({
      mode: 'system',
      setMode: (mode) => set({ mode }),
      toggle: () =>
        set({ mode: resolveMode(get().mode) === 'dark' ? 'light' : 'dark' }),
    }),
    {
      name: THEME_STORAGE_KEY,
      version: 1,
      storage: createJSONStorage(() =>
        typeof window !== 'undefined' ? window.localStorage : memoryStorage(),
      ),
      partialize: (state) => ({ mode: state.mode }),
    },
  ),
);

/** Resolve `mode` to a concrete light/dark value, consulting the OS for `system`. */
export function resolveMode(mode: ThemeMode): ResolvedTheme {
  if (mode === 'system') {
    if (typeof window === 'undefined') return 'dark';
    return window.matchMedia('(prefers-color-scheme: light)').matches
      ? 'light'
      : 'dark';
  }
  return mode;
}

/**
 * Apply the resolved theme to `<html>` by toggling a `light` class. Dark stays
 * the default (no class) so existing slate styles continue to apply unchanged.
 */
function applyTheme(resolved: ResolvedTheme): void {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  root.classList.toggle('light', resolved === 'light');
}

/**
 * Mount-once effect that wires the store to the DOM and to the OS-level
 * `prefers-color-scheme` listener. Call from the app shell.
 */
export function useThemeSync(): void {
  const mode = useThemeStore((s) => s.mode);

  useEffect(() => {
    applyTheme(resolveMode(mode));
  }, [mode]);

  useEffect(() => {
    if (mode !== 'system' || typeof window === 'undefined') return;
    const media = window.matchMedia('(prefers-color-scheme: light)');
    const handler = () => applyTheme(resolveMode('system'));
    media.addEventListener('change', handler);
    return () => media.removeEventListener('change', handler);
  }, [mode]);
}

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
