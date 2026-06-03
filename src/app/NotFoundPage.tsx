import { Link } from 'react-router-dom';
import clsx from 'clsx';
import { buttonClasses } from '@/components';

export function NotFoundPage() {
  return (
    <div className="grid place-items-center py-24 text-center">
      <div>
        <p className="text-5xl font-semibold text-slate-100 light:text-slate-900">
          404
        </p>
        <p className="mt-2 text-slate-400 light:text-slate-600">
          We couldn&apos;t find that page.
        </p>
        <Link
          to="/"
          className={clsx('mt-6', buttonClasses({ variant: 'primary' }))}
        >
          Back to inventory
        </Link>
      </div>
    </div>
  );
}
