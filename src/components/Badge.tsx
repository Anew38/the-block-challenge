import type { ReactNode } from 'react';
import clsx from 'clsx';

/** Semantic color tones shared across status, reserve, and title badges. */
export type BadgeTone =
  | 'emerald'
  | 'sky'
  | 'amber'
  | 'rose'
  | 'indigo'
  | 'slate';

const TONE_STYLES: Record<BadgeTone, string> = {
  emerald: 'bg-emerald-500/15 text-emerald-300 ring-1 ring-emerald-500/30',
  sky: 'bg-sky-500/15 text-sky-300 ring-1 ring-sky-500/30',
  amber: 'bg-amber-500/15 text-amber-300 ring-1 ring-amber-500/30',
  rose: 'bg-rose-500/15 text-rose-300 ring-1 ring-rose-500/30',
  indigo: 'bg-indigo-500/15 text-indigo-300 ring-1 ring-indigo-500/30',
  slate: 'bg-slate-700/40 text-slate-300 ring-1 ring-slate-600/40',
};

interface BadgeProps {
  tone?: BadgeTone;
  className?: string;
  children: ReactNode;
}

/** Small pill used for statuses and tags; tone drives the color scheme. */
export function Badge({ tone = 'slate', className, children }: BadgeProps) {
  return (
    <span
      className={clsx(
        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium',
        TONE_STYLES[tone],
        className
      )}
    >
      {children}
    </span>
  );
}
