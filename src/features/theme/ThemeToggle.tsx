import { Moon, Sun } from 'lucide-react';
import { resolveMode, useThemeStore } from './themeStore';

/**
 * Top-right header control that flips the page between light and dark mode.
 * Renders the icon for the *target* theme so the affordance reads as
 * "switch to X" rather than "currently X".
 */
export function ThemeToggle() {
  const mode = useThemeStore((s) => s.mode);
  const toggle = useThemeStore((s) => s.toggle);
  const resolved = resolveMode(mode);
  const nextLabel = resolved === 'dark' ? 'Switch to light mode' : 'Switch to dark mode';
  const Icon = resolved === 'dark' ? Sun : Moon;

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={nextLabel}
      title={nextLabel}
      className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-800 bg-slate-900/60 text-slate-300 transition hover:border-slate-700 hover:bg-slate-800 hover:text-slate-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 light:border-slate-200 light:bg-white light:text-slate-700 light:hover:border-slate-300 light:hover:bg-slate-100 light:hover:text-slate-900"
    >
      <Icon className="h-4 w-4" aria-hidden="true" />
      <span className="sr-only">{nextLabel}</span>
    </button>
  );
}
