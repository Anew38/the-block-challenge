import { useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, SearchX } from 'lucide-react';
import { buttonClasses, EmptyState } from '@/components';
import { getVehicleById } from '@/data/loader';
import { computeTiming } from '@/data/timing';
import type { Vehicle } from '@/data/types';
import { useNow } from '@/lib/useNow';
import { useBidState } from '@/features/bidding/auctionStore';
import { useLiveAuction } from '@/features/bidding/useLiveAuction';
import { useRecentlyViewedStore } from '@/features/recentlyViewed/recentlyViewedStore';
import { SimilarVehicles } from '@/features/recommendations/SimilarVehicles';
import { AuctionDetails } from './AuctionDetails';
import { BidHistory } from './BidHistory';
import { BidPanel } from './BidPanel';
import { ConditionPanel } from './ConditionPanel';
import { ImageGallery } from './ImageGallery';
import { InsightPanel } from './InsightPanel';
import { SpecSheet } from './SpecSheet';

export function VehicleDetailPage() {
  const { vehicleId } = useParams();
  const vehicle = vehicleId ? getVehicleById(vehicleId) : undefined;

  if (!vehicle) {
    return (
      <EmptyState
        icon={SearchX}
        title="Lot not found"
        description="This lot may have been removed or the link is incorrect."
        action={
          <Link to="/" className={buttonClasses({ size: 'sm' })}>
            <ArrowLeft className="h-4 w-4" />
            Back to inventory
          </Link>
        }
      />
    );
  }

  return <VehicleDetail vehicle={vehicle} />;
}

/** Inner view for a resolved lot, so the live hooks run unconditionally. */
function VehicleDetail({ vehicle }: { vehicle: Vehicle }) {
  // A shared 1s tick keeps the status, countdown, and bid form minimum live.
  const now = useNow(1000);
  // Subscribe to the bid overlay so history reflects live/own bids instantly.
  const bid = useBidState(vehicle);
  // Simulate rival bidding while this lot is live, so the price moves on its own.
  useLiveAuction(vehicle);

  // Record the visit so the inventory "Recently viewed" rail can surface it.
  const addRecent = useRecentlyViewedStore((s) => s.addRecent);
  useEffect(() => {
    addRecent(vehicle.id);
  }, [vehicle.id, addRecent]);

  const timing = computeTiming(vehicle, now);
  const title = `${vehicle.year} ${vehicle.make} ${vehicle.model}`;

  return (
    <section className="flex flex-col gap-5">
      <div className="flex flex-col gap-3">
        <Link
          to="/"
          className="inline-flex w-fit items-center gap-1.5 text-sm text-slate-400 transition hover:text-slate-200 light:text-slate-600 light:hover:text-slate-900"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to inventory
        </Link>
        <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
          <h1 className="text-2xl font-semibold tracking-tight text-slate-50 light:text-slate-900">
            {title}
          </h1>
          <span className="text-lg text-slate-400 light:text-slate-600">
            {vehicle.trim}
          </span>
          <span className="ml-auto font-mono text-sm text-slate-500">
            Lot {vehicle.lot}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
        <div className="flex flex-col gap-6">
          <ImageGallery
            images={vehicle.images}
            title={`${title} ${vehicle.trim}`}
          />
          <SpecSheet vehicle={vehicle} />
          <ConditionPanel vehicle={vehicle} />
        </div>

        <div className="flex flex-col gap-6 lg:sticky lg:top-20 lg:self-start">
          <BidPanel vehicle={vehicle} timing={timing} />
          <InsightPanel vehicle={vehicle} bid={bid} timing={timing} now={now} />
          <AuctionDetails vehicle={vehicle} timing={timing} />
          <BidHistory history={bid.history} />
        </div>
      </div>

      <SimilarVehicles vehicle={vehicle} now={now} />
    </section>
  );
}
