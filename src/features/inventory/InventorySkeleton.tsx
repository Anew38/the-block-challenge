import { Skeleton } from '@/components';

/** Placeholder shown while the inventory route chunk loads. */
export function InventorySkeleton() {
  return (
    <section
      className="flex flex-col gap-5"
      aria-busy="true"
      aria-hidden="true"
    >
      <div className="flex flex-col gap-2">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-4 w-72" />
      </div>

      <Skeleton className="h-11 w-full" />
      <Skeleton className="h-36 w-full rounded-xl" />

      <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <li key={i}>
            <div className="flex flex-col overflow-hidden rounded-xl border border-slate-800 bg-slate-900/40">
              <Skeleton className="aspect-[4/3] w-full rounded-none" />
              <div className="flex flex-col gap-3 p-4">
                <Skeleton className="h-5 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
                <div className="mt-2 flex items-end justify-between border-t border-slate-800 pt-3">
                  <Skeleton className="h-8 w-24" />
                  <Skeleton className="h-4 w-16" />
                </div>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
