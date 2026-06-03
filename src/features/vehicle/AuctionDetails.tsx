import { Building2, MapPin, Tag, Timer } from 'lucide-react';
import clsx from 'clsx';
import type { AuctionTiming, Vehicle } from '@/data/types';
import { Stat, StatusBadge } from '@/components';
import { formatCurrency, formatDuration } from '@/lib/format';
import { Panel } from './Panel';

function timingLabel(timing: AuctionTiming): string {
  if (timing.status === 'live')
    return `Ends in ${formatDuration(timing.msRemaining)}`;
  if (timing.status === 'scheduled')
    return `Starts in ${formatDuration(timing.msToStart)}`;
  return 'Auction ended';
}

interface AuctionDetailsProps {
  vehicle: Vehicle;
  timing: AuctionTiming;
}

/** Auction parameters: status + live countdown, pricing terms, lot logistics. */
export function AuctionDetails({ vehicle, timing }: AuctionDetailsProps) {
  return (
    <Panel
      title="Auction details"
      icon={Tag}
      action={<StatusBadge status={timing.status} />}
    >
      <div className="flex flex-col gap-4">
        <div
          className={clsx(
            'flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium',
            timing.status === 'live' &&
              'border-emerald-500/30 bg-emerald-500/10 text-emerald-300',
            timing.status === 'scheduled' &&
              'border-sky-500/30 bg-sky-500/10 text-sky-300',
            timing.status === 'ended' &&
              'border-slate-700 bg-slate-800/40 text-slate-400'
          )}
        >
          <Timer className="h-4 w-4 shrink-0" />
          <span>{timingLabel(timing)}</span>
        </div>

        <dl className="grid grid-cols-1 gap-x-6 gap-y-3 sm:grid-cols-2">
          <Stat
            label="Starting bid"
            value={formatCurrency(vehicle.startingBid)}
          />
          <Stat
            label="Reserve price"
            value={
              vehicle.reservePrice === null
                ? 'No reserve'
                : formatCurrency(vehicle.reservePrice)
            }
          />
          <Stat
            label="Buy Now"
            value={
              vehicle.buyNowPrice === null
                ? 'Not offered'
                : formatCurrency(vehicle.buyNowPrice)
            }
          />
          <Stat label="Lot" value={vehicle.lot} mono />
        </dl>

        <div className="flex flex-col gap-2 border-t border-slate-800 pt-3 text-sm text-slate-300">
          <p className="flex items-center gap-2">
            <Building2 className="h-4 w-4 shrink-0 text-slate-500" />
            {vehicle.sellingDealership}
          </p>
          <p className="flex items-center gap-2">
            <MapPin className="h-4 w-4 shrink-0 text-slate-500" />
            {vehicle.city}, {vehicle.province}
          </p>
        </div>
      </div>
    </Panel>
  );
}
