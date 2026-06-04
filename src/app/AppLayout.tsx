import { useEffect } from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import { Gavel } from 'lucide-react';
import { AccessibilityButton } from '@/features/accessibility/AccessibilityButton';
import { ThemeToggle } from '@/features/theme/ThemeToggle';
import { useThemeSync } from '@/features/theme/themeStore';
import { ToastViewport } from '@/features/toast/ToastViewport';

export function AppLayout() {
  // Mirror the persisted theme onto <html> and listen for OS changes.
  useThemeSync();

  // Reset scroll to the top on every route change, so opening a lot (or going
  // back to inventory) starts at the top rather than the previous scroll spot.
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return (
    <div className="flex min-h-full flex-col">
      <header className="sticky top-0 z-20 border-b border-slate-800/80 bg-slate-950/80 backdrop-blur light:border-slate-200 light:bg-white/80">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6">
          <Link
            to="/"
            className="group flex items-center gap-2.5 rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400"
          >
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-indigo-500/25 to-indigo-500/5 text-indigo-300 ring-1 ring-indigo-500/25 transition group-hover:ring-indigo-400/50 light:from-indigo-500/15 light:to-indigo-500/0 light:text-indigo-600 light:ring-indigo-500/20">
              <Gavel className="h-5 w-5" />
            </span>
            <span className="flex flex-col leading-none">
              <span className="bg-gradient-to-r from-indigo-200 via-slate-50 to-indigo-200 bg-clip-text text-lg font-bold tracking-tight text-transparent light:from-indigo-600 light:via-slate-900 light:to-indigo-600">
                The Chopping Block
              </span>
              <span className="mt-1 text-[10px] font-medium uppercase tracking-[0.22em] text-slate-500 light:text-slate-500">
                Car Auction Site
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
      <ToastViewport />
    </div>
  );
}
