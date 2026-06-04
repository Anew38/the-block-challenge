import { useMemo } from 'react';
import { History } from 'lucide-react';
import { getVehicleById } from '@/data/loader';
import type { Vehicle } from '@/data/types';
import { useNow } from '@/lib/useNow';
import { CompactVehicleCard } from '@/features/inventory/CompactVehicleCard';
import { useRecentlyViewedStore } from './recentlyViewedStore';

/**
 * Horizontal "jump back in" rail above the inventory grid. Resolves the persisted
 * ids against the live catalog, dropping any that no longer exist, and renders
 * nothing until the buyer has opened at least one lot.
 */
export function RecentlyViewedStrip() {
  const ids = useRecentlyViewedStore((s) => s.ids);
  const clear = useRecentlyViewedStore((s) => s.clear);
  const now = useNow(1000);

  const vehicles = useMemo(
    () => ids.map(getVehicleById).filter((v): v is Vehicle => v !== undefined),
    [ids]
  );

  if (vehicles.length === 0) return null;

  return (
    <section className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <h2 className="flex items-center gap-2 text-sm font-semibold tracking-tight text-slate-200 light:text-slate-800">
          <History className="h-4 w-4 text-slate-500" />
          Recently viewed
        </h2>
        <button
          type="button"
          onClick={clear}
          className="rounded-md px-1.5 py-0.5 text-xs text-slate-500 transition hover:text-slate-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 light:hover:text-slate-700"
        >
          Clear
        </button>
      </div>

      <ul className="-mx-1 flex gap-3 overflow-x-auto px-1 pb-1">
        {vehicles.map((vehicle) => (
          <li key={vehicle.id} className="w-52 shrink-0 sm:w-56">
            <CompactVehicleCard vehicle={vehicle} now={now} />
          </li>
        ))}
      </ul>
    </section>
  );
}
