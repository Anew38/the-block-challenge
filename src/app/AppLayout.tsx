import { Link, Outlet } from 'react-router-dom';
import { Gavel } from 'lucide-react';
import { AccessibilityButton } from '@/features/accessibility/AccessibilityButton';
import { ThemeToggle } from '@/features/theme/ThemeToggle';
import { useThemeSync } from '@/features/theme/themeStore';

export function AppLayout() {
  // Mirror the persisted theme onto <html> and listen for OS changes.
  useThemeSync();

  return (
    <div className="flex min-h-full flex-col">
      <header className="sticky top-0 z-20 border-b border-slate-800/80 bg-slate-950/80 backdrop-blur light:border-slate-200 light:bg-white/80">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6">
          <Link
            to="/"
            className="flex items-center gap-2 text-lg font-semibold tracking-tight"
          >
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-indigo-500/15 text-indigo-400 light:bg-indigo-500/10 light:text-indigo-600">
              <Gavel className="h-5 w-5" />
            </span>
            <span>
              The Block
              <span className="ml-2 text-sm font-normal text-slate-400 light:text-slate-500">
                Auction
              </span>
            </span>
          </Link>

          <ThemeToggle />
        </div>
      </header>

      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 sm:px-6">
        <Outlet />
      </main>

      <footer className="border-t border-slate-800/80 px-4 py-4 text-center text-xs text-slate-500 light:border-slate-200 light:text-slate-500">
        Prototype for the OPENLANE challenge. Bids are simulated and stored
        locally.
      </footer>

      <AccessibilityButton />
    </div>
  );
}
