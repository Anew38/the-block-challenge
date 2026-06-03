import { useEffect, useMemo, useState } from 'react';
import {
  AlarmClock,
  ChevronDown,
  FileWarning,
  Gauge,
  PiggyBank,
  ShieldCheck,
  Sparkles,
  Target,
  TrendingUp,
  type LucideIcon,
} from 'lucide-react';
import clsx from 'clsx';
import type { AuctionTiming, BidState, Vehicle } from '@/data/types';
import { catalog } from '@/data/loader';
import {
  deriveInsights,
  type InsightKind,
  type InsightTone,
} from './insightLogic';
import { Panel } from './Panel';

const KIND_ICON: Record<InsightKind, LucideIcon> = {
  mileage: Gauge,
  value: PiggyBank,
  condition: ShieldCheck,
  reserve: Target,
  velocity: TrendingUp,
  timing: AlarmClock,
  title: FileWarning,
};

/** Tinted icon chip per tone, matching the badge palette used elsewhere. */
const TONE_CHIP: Record<InsightTone, string> = {
  positive: 'bg-emerald-500/15 text-emerald-300 ring-1 ring-emerald-500/30',
  neutral: 'bg-sky-500/15 text-sky-300 ring-1 ring-sky-500/30',
  caution: 'bg-amber-500/15 text-amber-300 ring-1 ring-amber-500/30',
};

const EXPANDED_STORAGE_KEY = 'block:insights-panel-expanded';

function readExpandedPreference(): boolean {
  try {
    const stored = localStorage.getItem(EXPANDED_STORAGE_KEY);
    if (stored === '0') return false;
    if (stored === '1') return true;
  } catch {
    /* private mode or blocked storage */
  }
  return true;
}

interface InsightPanelProps {
  vehicle: Vehicle;
  bid: BidState;
  timing: AuctionTiming;
  /** Shared 1s tick, so timing/velocity insights stay live with the countdown. */
  now: number;
}

/**
 * Rules-based "AI" insights for a lot: mileage vs. peers, wholesale spread,
 * condition-to-price, reserve gap, and bid velocity. All derived on the client
 * from data we already have — no model call — and recomputed on the live tick.
 */
export function InsightPanel({ vehicle, bid, timing, now }: InsightPanelProps) {
  const [expanded, setExpanded] = useState(readExpandedPreference);
  const insights = useMemo(
    () => deriveInsights({ vehicle, bid, timing, catalog, now }),
    [vehicle, bid, timing, now]
  );

  useEffect(() => {
    try {
      localStorage.setItem(EXPANDED_STORAGE_KEY, expanded ? '1' : '0');
    } catch {
      /* ignore */
    }
  }, [expanded]);

  return (
    <Panel
      title="AI insights"
      icon={Sparkles}
      expanded={expanded}
      action={
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500">
            {expanded
              ? 'Rules-based · live'
              : insights.length > 0
                ? `${insights.length} insight${insights.length === 1 ? '' : 's'}`
                : 'Collapsed'}
          </span>
          <button
            type="button"
            onClick={() => setExpanded((open) => !open)}
            className="rounded-md p-1 text-slate-500 transition hover:bg-slate-800 hover:text-slate-300"
            aria-expanded={expanded}
            aria-label={expanded ? 'Hide AI insights' : 'Show AI insights'}
          >
            <ChevronDown
              className={clsx(
                'h-4 w-4 transition-transform',
                !expanded && '-rotate-90'
              )}
            />
          </button>
        </div>
      }
    >
      {insights.length === 0 ? (
        <p className="text-sm text-slate-400">
          No standout signals for this lot right now.
        </p>
      ) : (
        <ul className="flex flex-col gap-3.5">
          {insights.map((insight) => {
            const Icon = KIND_ICON[insight.kind];
            return (
              <li key={insight.id} className="flex items-start gap-3">
                <span
                  className={clsx(
                    'mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full',
                    TONE_CHIP[insight.tone]
                  )}
                >
                  <Icon className="h-4 w-4" />
                </span>
                <div className="flex flex-col gap-0.5">
                  <span className="text-sm font-medium text-slate-100">
                    {insight.title}
                  </span>
                  <span className="text-sm leading-relaxed text-slate-400">
                    {insight.detail}
                  </span>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      <p className="mt-4 border-t border-slate-800 pt-3 text-xs text-slate-500">
        Generated from this lot's specs, live bids, and comparable sale data.
      </p>
    </Panel>
  );
}
