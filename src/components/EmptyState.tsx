import type { ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';
import clsx from 'clsx';

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  /** Optional call-to-action (e.g. a clear-filters button or back link). */
  action?: ReactNode;
  className?: string;
}

/** Dashed-border placeholder for empty results and not-found states. */
export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={clsx(
        'grid place-items-center gap-3 rounded-xl border border-dashed border-slate-800 px-6 py-16 text-center light:border-slate-300',
        className
      )}
    >
      {Icon && <Icon className="h-8 w-8 text-slate-600 light:text-slate-400" />}
      <div>
        <p className="font-medium text-slate-300 light:text-slate-700">
          {title}
        </p>
        {description && (
          <p className="mx-auto mt-1 max-w-sm text-sm text-slate-500">
            {description}
          </p>
        )}
      </div>
      {action}
    </div>
  );
}
