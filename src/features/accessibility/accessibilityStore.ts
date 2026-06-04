/**
 * Accessibility preferences store: a small set of buyer-facing display toggles
 * (larger text, high contrast, reduced motion, etc.) persisted to localStorage.
 *
 * Scope note: this is intentionally a UI scaffold. The store and the menu that
 * drives it are fully wired and persisted, but the toggles do not yet apply any
 * visual/behavioral effects — that styling work can land incrementally without
 * touching this contract.
 */
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { A11Y_STORAGE_KEY } from '@/lib/constants';

/** The individual preferences a buyer can toggle, keyed for stable persistence. */
export type A11yToggleKey =
  | 'largerText'
  | 'highContrast'
  | 'reduceMotion'
  | 'underlineLinks'
  | 'dyslexiaFont'
  | 'screenReaderHints';

export type A11yPreferences = Record<A11yToggleKey, boolean>;

/** Display metadata for each toggle, used to render the menu rows. */
export interface A11yToggleMeta {
  key: A11yToggleKey;
  label: string;
  description: string;
}

/**
 * Ordered list driving the menu UI. Kept alongside the store so the toggle set
 * stays in one place; the menu maps over this rather than hardcoding rows.
 */
export const A11Y_TOGGLES: readonly A11yToggleMeta[] = [
  {
    key: 'largerText',
    label: 'Larger text',
    description: 'Increase the base font size across the app.',
  },
  {
    key: 'highContrast',
    label: 'High contrast',
    description: 'Boost color contrast for easier reading.',
  },
  {
    key: 'reduceMotion',
    label: 'Reduce motion',
    description: 'Minimize animations and transitions.',
  },
  {
    key: 'underlineLinks',
    label: 'Underline links',
    description: 'Always underline links, not just on hover.',
  },
  {
    key: 'dyslexiaFont',
    label: 'Dyslexia-friendly font',
    description: 'Switch to a typeface tuned for readability.',
  },
  {
    key: 'screenReaderHints',
    label: 'Screen-reader hints',
    description: 'Add extra descriptive cues for assistive tech.',
  },
];

const DEFAULT_PREFERENCES: A11yPreferences = {
  largerText: false,
  highContrast: false,
  reduceMotion: false,
  underlineLinks: false,
  dyslexiaFont: false,
  screenReaderHints: false,
};

interface AccessibilityStore {
  /** Current on/off state for every toggle. */
  preferences: A11yPreferences;
  /** Flip a single preference. */
  toggle: (key: A11yToggleKey) => void;
  /** Reset every preference back to its default (off). */
  reset: () => void;
}

export const useAccessibilityStore = create<AccessibilityStore>()(
  persist(
    (set) => ({
      preferences: { ...DEFAULT_PREFERENCES },
      toggle: (key) =>
        set((state) => ({
          preferences: {
            ...state.preferences,
            [key]: !state.preferences[key],
          },
        })),
      reset: () => set({ preferences: { ...DEFAULT_PREFERENCES } }),
    }),
    {
      name: A11Y_STORAGE_KEY,
      version: 1,
      storage: createJSONStorage(() =>
        typeof window !== 'undefined' ? window.localStorage : memoryStorage(),
      ),
      partialize: (state) => ({ preferences: state.preferences }),
      // Tolerate older/partial persisted shapes by filling any missing keys.
      merge: (persisted, current) => {
        const saved = (persisted as Partial<AccessibilityStore> | undefined)
          ?.preferences;
        return {
          ...current,
          preferences: { ...DEFAULT_PREFERENCES, ...saved },
        };
      },
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
