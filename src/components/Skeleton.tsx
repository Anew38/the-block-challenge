import clsx from 'clsx';

interface SkeletonProps {
  className?: string;
}

/** Pulsing placeholder block used while route chunks load. */
export function Skeleton({ className }: SkeletonProps) {
  return (
    <div
      className={clsx('animate-pulse rounded-md bg-slate-800/60', className)}
      aria-hidden="true"
    />
  );
}
