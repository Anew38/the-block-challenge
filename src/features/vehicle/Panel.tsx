import type { ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';

interface PanelProps {
  title: string;
  icon?: LucideIcon;
  /** Optional content rendered on the right side of the header (e.g. a badge). */
  action?: ReactNode;
  children: ReactNode;
}

/** Titled card used to group each section of the vehicle detail page. */
export function Panel({ title, icon: Icon, action, children }: PanelProps) {
  return (
    <section className="rounded-xl border border-slate-800 bg-slate-900/30">
      <header className="flex items-center justify-between gap-3 border-b border-slate-800 px-4 py-3 sm:px-5">
        <h2 className="flex items-center gap-2 text-sm font-semibold tracking-tight text-slate-200">
          {Icon && <Icon className="h-4 w-4 text-slate-500" />}
          {title}
        </h2>
        {action}
      </header>
      <div className="px-4 py-4 sm:px-5">{children}</div>
    </section>
  );
}
