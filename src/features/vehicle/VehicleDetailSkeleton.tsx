import { Skeleton } from '@/components';

/** Placeholder shown while the vehicle-detail route chunk loads. */
export function VehicleDetailSkeleton() {
  return (
    <section
      className="flex flex-col gap-5"
      aria-busy="true"
      aria-hidden="true"
    >
      <div className="flex flex-col gap-3">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-8 w-2/3" />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
        <div className="flex flex-col gap-6">
          <Skeleton className="aspect-[4/3] w-full rounded-xl" />
          <Skeleton className="h-52 w-full rounded-xl" />
          <Skeleton className="h-64 w-full rounded-xl" />
        </div>
        <div className="flex flex-col gap-6">
          <Skeleton className="h-56 w-full rounded-xl" />
          <Skeleton className="h-72 w-full rounded-xl" />
        </div>
      </div>
    </section>
  );
}
