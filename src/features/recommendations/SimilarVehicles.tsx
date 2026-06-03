import { useMemo } from 'react';
import { Sparkles } from 'lucide-react';
import { catalog } from '@/data/loader';
import { computeTiming } from '@/data/timing';
import type { Vehicle } from '@/data/types';
import { CompactVehicleCard } from '@/features/inventory/CompactVehicleCard';
import { findSimilarVehicles } from './similarity';

interface SimilarVehiclesProps {
  vehicle: Vehicle;
  /** Shared tick from the detail page, threaded to the compact card countdowns. */
  now: number;
}

/**
 * "Smart recommendations" row at the foot of the detail page. Ranks comparable
 * *live/scheduled* lots via the rule-based scorer in `similarity.ts` and renders
 * the top matches as compact cards. Honestly framed as "AI-inspired" — there is
 * no model call, just transparent weighted matching.
 */
export function SimilarVehicles({ vehicle, now }: SimilarVehiclesProps) {
  // Exclude ended auctions: recommendations should point at lots a buyer can act
  // on. Recomputed only when the lot changes, so the set stays stable per visit.
  const matches = useMemo(
    () =>
      findSimilarVehicles(vehicle, catalog, {
        limit: 4,
        exclude: (candidate) => computeTiming(candidate).status === 'ended',
      }),
    [vehicle]
  );

  if (matches.length === 0) return null;

  return (
    <section className="flex flex-col gap-3">
      <div className="flex flex-col gap-1">
        <h2 className="flex flex-wrap items-center gap-2 text-sm font-semibold tracking-tight text-slate-200 light:text-slate-800">
          <Sparkles className="h-4 w-4 text-indigo-400" />
          Smart recommendations
          <span className="rounded-full bg-indigo-500/15 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-indigo-300 ring-1 ring-indigo-500/30 light:text-indigo-700 light:ring-indigo-600/30">
            AI-inspired
          </span>
        </h2>
        <p className="text-xs text-slate-500">
          Comparable open lots, ranked by make, model, body style, and price — a
          transparent rules-based match, not a model call.
        </p>
      </div>

      <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {matches.map(({ vehicle: match }) => (
          <li key={match.id}>
            <CompactVehicleCard vehicle={match} now={now} />
          </li>
        ))}
      </ul>
    </section>
  );
}
