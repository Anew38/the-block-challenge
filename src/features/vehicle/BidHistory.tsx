import { History } from 'lucide-react';
import clsx from 'clsx';
import type { Bid } from '@/data/types';
import { formatCurrency, formatDuration } from '@/lib/format';
import { useNow } from '@/lib/useNow';
import { Panel } from './Panel';

interface BidHistoryProps {
  /** Most-recent-first list of bid events for this lot. */
  history: Bid[];
}

/** Chronological list of bid events, distinguishing your bids from rivals'. */
export function BidHistory({ history }: BidHistoryProps) {
  // Refresh "x ago" labels on the shared 1s tick.
  const now = useNow(1000);

  return (
    <Panel
      title="Bid history"
      icon={History}
      action={
        <span className="text-xs text-slate-500">
          {history.length} {history.length === 1 ? 'bid' : 'bids'}
        </span>
      }
    >
      {history.length === 0 ? (
        <p className="text-sm text-slate-400">
          No bids placed yet in this session. Be the first to bid.
        </p>
      ) : (
        <ol className="flex flex-col divide-y divide-slate-800/60">
          {history.map((bid) => {
            const mine = bid.source === 'you';
            return (
              <li
                key={bid.id}
                className="flex items-center justify-between gap-3 py-2.5 first:pt-0 last:pb-0"
              >
                <div className="flex items-center gap-2.5">
                  <span
                    className={clsx(
                      'rounded-full px-2 py-0.5 text-xs font-medium',
                      mine
                        ? 'bg-indigo-500/15 text-indigo-300 ring-1 ring-indigo-500/30'
                        : 'bg-slate-700/40 text-slate-300 ring-1 ring-slate-600/40'
                    )}
                  >
                    {mine ? 'You' : 'Rival'}
                  </span>
                  <span className="text-xs text-slate-500">
                    {formatDuration(now - bid.placedAt)} ago
                  </span>
                </div>
                <span className="font-medium text-slate-100">
                  {formatCurrency(bid.amount)}
                </span>
              </li>
            );
          })}
        </ol>
      )}
    </Panel>
  );
}
