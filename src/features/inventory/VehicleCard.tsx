import { Link } from 'react-router-dom';
import { Gauge, MapPin, Timer } from 'lucide-react';
import clsx from 'clsx';
import { StatusBadge } from '@/components';
import {
  formatCurrency,
  formatDuration,
  formatGrade,
  formatOdometer,
} from '@/lib/format';
import type { InventoryItem } from './types';

/** Live/scheduled lots show a countdown; ended lots show their close state. */
function timingLabel(item: InventoryItem): string {
  const { status, msRemaining, msToStart } = item.timing;
  if (status === 'live') return `Ends in ${formatDuration(msRemaining)}`;
  if (status === 'scheduled') return `Starts in ${formatDuration(msToStart)}`;
  return 'Auction ended';
}

interface VehicleCardProps {
  item: InventoryItem;
}

export function VehicleCard({ item }: VehicleCardProps) {
  const { vehicle, currentBid, bidCount, reserveMet, timing } = item;
  const title = `${vehicle.year} ${vehicle.make} ${vehicle.model}`;
  const hero = vehicle.images[0];
  const isEnded = timing.status === 'ended';

  return (
    <Link
      to={`/vehicles/${vehicle.id}`}
      className="group flex flex-col overflow-hidden rounded-xl border border-slate-800 bg-slate-900/40 transition hover:border-slate-700 hover:bg-slate-900/70 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-slate-800">
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
          <div className="grid h-full w-full place-items-center text-xs text-slate-600">
            No image
          </div>
        )}

        <StatusBadge status={timing.status} className="absolute left-3 top-3" />

        <span className="absolute right-3 top-3 rounded-full bg-slate-950/70 px-2.5 py-1 font-mono text-xs text-slate-300 backdrop-blur">
          {vehicle.lot}
        </span>
      </div>

      <div className="flex flex-1 flex-col gap-3 p-4">
        <div>
          <h3 className="font-semibold tracking-tight text-slate-100">
            {title}
          </h3>
          <p className="truncate text-sm text-slate-400">{vehicle.trim}</p>
        </div>

        <dl className="grid grid-cols-2 gap-x-3 gap-y-1.5 text-xs text-slate-400">
          <div className="flex items-center gap-1.5">
            <Gauge className="h-3.5 w-3.5 shrink-0 text-slate-500" />
            <span className="truncate">
              {formatOdometer(vehicle.odometerKm)}
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="grid h-3.5 w-3.5 shrink-0 place-items-center rounded bg-slate-700 text-[9px] font-semibold text-slate-200">
              G
            </span>
            <span>Grade {formatGrade(vehicle.conditionGrade)}</span>
          </div>
          <div className="col-span-2 flex items-center gap-1.5">
            <MapPin className="h-3.5 w-3.5 shrink-0 text-slate-500" />
            <span className="truncate">
              {vehicle.city}, {vehicle.province}
            </span>
          </div>
        </dl>

        <div className="mt-auto flex items-end justify-between border-t border-slate-800 pt-3">
          <div>
            <p className="text-[11px] uppercase tracking-wide text-slate-500">
              {isEnded ? 'Final bid' : 'Current bid'}
            </p>
            <p className="text-lg font-semibold text-slate-50">
              {formatCurrency(currentBid)}
            </p>
            <p className="text-[11px] text-slate-500">
              {bidCount} {bidCount === 1 ? 'bid' : 'bids'}
              {' · '}
              <span
                className={reserveMet ? 'text-emerald-400' : 'text-amber-400'}
              >
                {reserveMet ? 'Reserve met' : 'Reserve not met'}
              </span>
            </p>
          </div>

          <div
            className={clsx(
              'flex items-center gap-1.5 text-right text-xs font-medium',
              timing.status === 'live' && 'text-emerald-300',
              timing.status === 'scheduled' && 'text-sky-300',
              isEnded && 'text-slate-500'
            )}
          >
            {!isEnded && <Timer className="h-3.5 w-3.5 shrink-0" />}
            <span>{timingLabel(item)}</span>
          </div>
        </div>
      </div>
    </Link>
  );
}
