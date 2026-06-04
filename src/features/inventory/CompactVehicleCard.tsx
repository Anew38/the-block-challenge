import { Link } from 'react-router-dom';
import { Timer } from 'lucide-react';
import clsx from 'clsx';
import { StatusBadge } from '@/components';
import { computeTiming } from '@/data/timing';
import type { Vehicle } from '@/data/types';
import { useBidState } from '@/features/bidding/auctionStore';
import { formatCurrency, formatDuration } from '@/lib/format';

interface CompactVehicleCardProps {
  vehicle: Vehicle;
  /** Shared tick so the countdown/status stay live without each card owning a timer. */
  now: number;
}

/**
 * Slim VehicleCard variant for side rails (recently viewed, recommendations).
 * Fills its container, so the parent decides the width — a fixed-width slot in a
 * scroll strip, or a grid cell in a recommendation row.
 */
export function CompactVehicleCard({ vehicle, now }: CompactVehicleCardProps) {
  const bid = useBidState(vehicle);
  const timing = computeTiming(vehicle, now);
  const title = `${vehicle.year} ${vehicle.make} ${vehicle.model}`;
  const hero = vehicle.images[0];
  const isEnded = timing.status === 'ended';

  const timingLabel =
    timing.status === 'live'
      ? `Ends in ${formatDuration(timing.msRemaining)}`
      : timing.status === 'scheduled'
        ? `Starts in ${formatDuration(timing.msToStart)}`
        : 'Auction ended';

  return (
    <Link
      to={`/vehicles/${vehicle.id}`}
      className="group flex h-full w-full flex-col overflow-hidden rounded-xl border border-slate-800 bg-slate-900/40 transition hover:border-slate-700 hover:bg-slate-900/70 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 light:border-slate-200 light:bg-white light:shadow-sm light:shadow-slate-200/40 light:hover:border-slate-300 light:hover:bg-slate-50"
    >
      <div className="relative aspect-[16/10] overflow-hidden bg-slate-800 light:bg-slate-100">
        {hero ? (
          <img
            src={hero}
            alt={`${title} ${vehicle.trim}`.trim()}
            loading="lazy"
            className={clsx(
              'h-full w-full object-cover transition duration-300 group-hover:scale-[1.03]',
              isEnded && 'opacity-60'
            )}
          />
        ) : (
          <div className="grid h-full w-full place-items-center text-xs text-slate-600 light:text-slate-400">
            No image
          </div>
        )}

        <StatusBadge status={timing.status} className="absolute left-2 top-2" />
      </div>

      <div className="flex flex-1 flex-col gap-2 p-3">
        <div>
          <h3 className="truncate text-sm font-semibold tracking-tight text-slate-100 light:text-slate-900">
            {title}
          </h3>
          <p className="truncate text-xs text-slate-400 light:text-slate-600">
            {vehicle.trim}
          </p>
        </div>

        <div className="mt-auto flex items-end justify-between gap-2 border-t border-slate-800 pt-2 light:border-slate-200">
          <div>
            <p className="text-[10px] uppercase tracking-wide text-slate-500">
              {isEnded ? 'Final bid' : 'Current bid'}
            </p>
            <p className="text-sm font-semibold text-slate-50 light:text-slate-900">
              {formatCurrency(bid.currentBid)}
            </p>
          </div>

          <div
            className={clsx(
              'flex items-center gap-1 text-right text-[11px] font-medium',
              timing.status === 'live' &&
                'text-emerald-300 light:text-emerald-700',
              timing.status === 'scheduled' &&
                'text-sky-300 light:text-sky-700',
              isEnded && 'text-slate-500'
            )}
          >
            {!isEnded && <Timer className="h-3 w-3 shrink-0" />}
            <span className="truncate">{timingLabel}</span>
          </div>
        </div>
      </div>
    </Link>
  );
}
