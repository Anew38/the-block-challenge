import { useState } from 'react';
import { ChevronDown, ChevronUp, History } from 'lucide-react';
import clsx from 'clsx';
import type { Bid } from '@/data/types';
import { formatCurrency, formatDuration } from '@/lib/format';
import { useNow } from '@/lib/useNow';
import { Panel } from './Panel';

/** How many bids show initially, and how many each "Show more" reveals. */
const INITIAL_VISIBLE = 5;
const EXPAND_STEP = 10;

interface BidHistoryProps {
  /** Most-recent-first list of bid events for this lot. */
  history: Bid[];
}

/** Chronological list of bid events, distinguishing your bids from rivals'. */
export function BidHistory({ history }: BidHistoryProps) {
  // Refresh "x ago" labels on the shared 1s tick.
  const now = useNow(1000);
  // Page the (most-recent-first) list so long histories stay scannable.
  const [visibleCount, setVisibleCount] = useState(INITIAL_VISIBLE);

  const visible = history.slice(0, visibleCount);
  const remaining = history.length - visible.length;
  const expanded = visibleCount > INITIAL_VISIBLE;
  const showMore = () =>
    setVisibleCount((count) => Math.min(count + EXPAND_STEP, history.length));
  const collapse = () => setVisibleCount(INITIAL_VISIBLE);

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
        <p className="text-sm text-slate-400 light:text-slate-600">
          No bids placed yet in this session. Be the first to bid.
        </p>
      ) : (
        <ol className="flex flex-col divide-y divide-slate-800/60 light:divide-slate-200">
          {visible.map((bid) => {
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
                        ? 'bg-indigo-500/15 text-indigo-300 ring-1 ring-indigo-500/30 light:text-indigo-700 light:ring-indigo-600/30'
                        : 'bg-slate-700/40 text-slate-300 ring-1 ring-slate-600/40 light:bg-slate-200 light:text-slate-700 light:ring-slate-300'
                    )}
                  >
                    {mine ? 'You' : 'Rival'}
                  </span>
                  <span className="text-xs text-slate-500">
                    {formatDuration(now - bid.placedAt)} ago
                  </span>
                </div>
                <span className="font-medium text-slate-100 light:text-slate-900">
                  {formatCurrency(bid.amount)}
                </span>
              </li>
            );
          })}
        </ol>
      )}

      {(remaining > 0 || expanded) && (
        <div className="mt-3 flex items-center gap-2">
          {remaining > 0 && (
            <button
              type="button"
              onClick={showMore}
              className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-slate-800 py-2 text-xs font-medium text-slate-400 transition hover:border-slate-700 hover:text-slate-200 light:border-slate-200 light:text-slate-600 light:hover:border-slate-300 light:hover:text-slate-900"
            >
              <ChevronDown className="h-3.5 w-3.5" />
              Show {Math.min(EXPAND_STEP, remaining)} more
              <span className="text-slate-500">({remaining} older)</span>
            </button>
          )}
          {expanded && (
            <button
              type="button"
              onClick={collapse}
              className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-slate-800 py-2 text-xs font-medium text-slate-400 transition hover:border-slate-700 hover:text-slate-200 light:border-slate-200 light:text-slate-600 light:hover:border-slate-300 light:hover:text-slate-900"
            >
              <ChevronUp className="h-3.5 w-3.5" />
              Collapse
            </button>
          )}
        </div>
      )}
    </Panel>
  );
}
