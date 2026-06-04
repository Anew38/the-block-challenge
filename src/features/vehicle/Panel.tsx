import type { ReactNode } from 'react';
import clsx from 'clsx';
import type { LucideIcon } from 'lucide-react';

interface PanelProps {
  title: string;
  icon?: LucideIcon;
  /** Optional content rendered on the right side of the header (e.g. a badge). */
  action?: ReactNode;
  children: ReactNode;
  /** When false, only the header is shown. Omit to always show the body. */
  expanded?: boolean;
}

/** Titled card used to group each section of the vehicle detail page. */
export function Panel({
  title,
  icon: Icon,
  action,
  children,
  expanded,
}: PanelProps) {
  const showBody = expanded !== false;

  return (
    <section className="rounded-xl border border-slate-800 bg-slate-900/30 light:border-slate-200 light:bg-white">
      <header
        className={clsx(
          'flex items-center justify-between gap-3 px-4 py-3 sm:px-5',
          showBody && 'border-b border-slate-800 light:border-slate-200'
        )}
      >
        <h2 className="flex items-center gap-2 text-sm font-semibold tracking-tight text-slate-200 light:text-slate-800">
          {Icon && <Icon className="h-4 w-4 text-slate-500" />}
          {title}
        </h2>
        {action}
      </header>
      {showBody && <div className="px-4 py-4 sm:px-5">{children}</div>}
    </section>
  );
}
