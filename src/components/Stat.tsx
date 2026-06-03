import type { ReactNode } from 'react';
import clsx from 'clsx';

interface StatProps {
  label: string;
  value: ReactNode;
  /** Render the value in a monospace face (e.g. VINs, lot numbers). */
  mono?: boolean;
}

/** Label/value row used by the spec sheet and auction-pricing lists. */
export function Stat({ label, value, mono }: StatProps) {
  return (
    <div className="flex items-baseline justify-between gap-3 border-b border-slate-800/60 pb-2 light:border-slate-200">
      <dt className="text-xs uppercase tracking-wide text-slate-500">
        {label}
      </dt>
      <dd
        className={clsx(
          'text-right text-sm font-medium text-slate-200 light:text-slate-800',
          mono && 'font-mono'
        )}
      >
        {value}
      </dd>
    </div>
  );
}
