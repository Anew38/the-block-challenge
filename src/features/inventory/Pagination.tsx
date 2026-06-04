import { ChevronLeft, ChevronRight } from 'lucide-react';
import clsx from 'clsx';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

/**
 * Builds a compact page list with leading/trailing ellipses for long ranges,
 * always keeping the first, last, and the window around the current page.
 */
function pageItems(current: number, total: number): Array<number | 'gap'> {
  if (total <= 7) {
    return Array.from({ length: total }, (_, i) => i + 1);
  }

  const items: Array<number | 'gap'> = [1];
  if (current > 3) items.push('gap');

  const start = Math.max(2, current - 1);
  const end = Math.min(total - 1, current + 1);
  for (let page = start; page <= end; page += 1) items.push(page);

  if (current < total - 2) items.push('gap');
  items.push(total);
  return items;
}

const ARROW_CLASSES =
  'flex h-9 w-9 items-center justify-center rounded-lg border border-slate-800 text-slate-400 transition hover:border-slate-700 hover:text-slate-200 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:border-slate-800 disabled:hover:text-slate-400 light:border-slate-200 light:text-slate-600 light:hover:border-slate-300 light:hover:text-slate-900 light:disabled:hover:border-slate-200';

/** Numbered page controls with prev/next arrows for the inventory grid. */
export function Pagination({
  currentPage,
  totalPages,
  onPageChange,
}: PaginationProps) {
  if (totalPages <= 1) return null;

  return (
    <nav
      className="flex items-center justify-center gap-1.5"
      aria-label="Inventory pagination"
    >
      <button
        type="button"
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage <= 1}
        className={ARROW_CLASSES}
        aria-label="Previous page"
      >
        <ChevronLeft className="h-4 w-4" />
      </button>

      {pageItems(currentPage, totalPages).map((item, index) =>
        item === 'gap' ? (
          <span
            key={`gap-${index}`}
            className="px-1 text-sm text-slate-600 light:text-slate-400"
            aria-hidden="true"
          >
            …
          </span>
        ) : (
          <button
            key={item}
            type="button"
            onClick={() => onPageChange(item)}
            aria-current={item === currentPage ? 'page' : undefined}
            className={clsx(
              'h-9 min-w-9 rounded-lg border px-3 text-sm font-medium transition',
              item === currentPage
                ? 'border-indigo-500 bg-indigo-500/15 text-indigo-200 light:border-indigo-500 light:bg-indigo-50 light:text-indigo-700'
                : 'border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200 light:border-slate-200 light:text-slate-600 light:hover:border-slate-300 light:hover:text-slate-900'
            )}
          >
            {item}
          </button>
        )
      )}

      <button
        type="button"
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage >= totalPages}
        className={ARROW_CLASSES}
        aria-label="Next page"
      >
        <ChevronRight className="h-4 w-4" />
      </button>
    </nav>
  );
}
