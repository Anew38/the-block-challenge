import { useEffect, useMemo, useState } from 'react';
import {
  CheckCircle2,
  Gavel,
  Lock,
  ShieldCheck,
  ShieldAlert,
  Zap,
} from 'lucide-react';
import type { AuctionTiming, Vehicle } from '@/data/types';
import { Badge, Button } from '@/components';
import { formatCurrency } from '@/lib/format';
import { useAuctionStore, useBidState } from '@/features/bidding/auctionStore';
import {
  currentFloor,
  minIncrement,
  minNextBid,
} from '@/features/bidding/bidLogic';

interface BidPanelProps {
  vehicle: Vehicle;
  timing: AuctionTiming;
}

/**
 * The core bidding surface: shows the live price, reserve state, and a validated
 * bid form wired to the auction store. Bidding is only enabled while the lot is
 * live; scheduled and ended lots render an explanatory, disabled state instead.
 */
export function BidPanel({ vehicle, timing }: BidPanelProps) {
  const bid = useBidState(vehicle);
  const placeBid = useAuctionStore((s) => s.placeBid);
  const buyNow = useAuctionStore((s) => s.buyNow);

  const minimum = useMemo(
    () => minNextBid(bid.currentBid, vehicle.startingBid),
    [bid.currentBid, vehicle.startingBid]
  );
  const increment = useMemo(
    () => minIncrement(currentFloor(bid.currentBid, vehicle.startingBid)),
    [bid.currentBid, vehicle.startingBid]
  );

  const [amount, setAmount] = useState(() => String(minimum));
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Keep the input at or above the live minimum as rival/own bids raise it.
  useEffect(() => {
    setAmount((prev) => {
      const numeric = Number(prev);
      return prev === '' || Number.isNaN(numeric) || numeric < minimum
        ? String(minimum)
        : prev;
    });
  }, [minimum]);

  const isLive = timing.status === 'live';
  const buyNowAvailable =
    vehicle.buyNowPrice !== null && bid.currentBid < vehicle.buyNowPrice;

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    const result = placeBid(vehicle.id, Number(amount));
    if (result.ok) {
      setError(null);
      setSuccess('Bid placed — you’re the high bidder.');
    } else {
      setSuccess(null);
      setError(result.error ?? 'Unable to place bid.');
    }
  };

  const handleBuyNow = () => {
    const result = buyNow(vehicle.id);
    if (result.ok) {
      setError(null);
      setSuccess('Purchased at the Buy Now price.');
    } else {
      setSuccess(null);
      setError(result.error ?? 'Unable to buy now.');
    }
  };

  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-4 sm:p-5">
      <div className="flex items-end justify-between gap-3">
        <div>
          <p className="text-[11px] uppercase tracking-wide text-slate-500">
            {timing.status === 'ended' ? 'Final bid' : 'Current bid'}
          </p>
          <p className="text-3xl font-semibold text-slate-50">
            {formatCurrency(bid.currentBid)}
          </p>
          <p className="mt-0.5 text-xs text-slate-500">
            {bid.bidCount} {bid.bidCount === 1 ? 'bid' : 'bids'}
          </p>
        </div>

        <Badge tone={bid.reserveMet ? 'emerald' : 'amber'}>
          {bid.reserveMet ? (
            <ShieldCheck className="h-3.5 w-3.5" />
          ) : (
            <ShieldAlert className="h-3.5 w-3.5" />
          )}
          {vehicle.reservePrice === null
            ? 'No reserve'
            : bid.reserveMet
              ? 'Reserve met'
              : 'Reserve not met'}
        </Badge>
      </div>

      {!isLive ? (
        <div className="mt-4 flex items-center gap-2 rounded-lg border border-slate-800 bg-slate-800/30 px-3 py-3 text-sm text-slate-400">
          <Lock className="h-4 w-4 shrink-0" />
          <span>
            {timing.status === 'scheduled'
              ? 'Bidding opens when this auction goes live.'
              : 'This auction has ended. Bidding is closed.'}
          </span>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="mt-4 flex flex-col gap-3">
          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-medium text-slate-400">
              Your bid (min {formatCurrency(minimum)})
            </span>
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">
                  $
                </span>
                <input
                  type="number"
                  inputMode="numeric"
                  min={minimum}
                  step={increment}
                  value={amount}
                  onChange={(e) => {
                    setAmount(e.target.value);
                    setError(null);
                    setSuccess(null);
                  }}
                  aria-label="Bid amount in dollars"
                  className="w-full rounded-lg border border-slate-700 bg-slate-950/60 py-2.5 pl-7 pr-3 text-sm font-medium text-slate-100 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>
              <Button type="submit" variant="primary">
                <Gavel className="h-4 w-4" />
                Place bid
              </Button>
            </div>
          </label>

          <p className="text-xs text-slate-500">
            Minimum increment at this price is {formatCurrency(increment)}.
          </p>

          {buyNowAvailable && (
            <Button type="button" variant="success" onClick={handleBuyNow}>
              <Zap className="h-4 w-4" />
              Buy Now for {formatCurrency(vehicle.buyNowPrice as number)}
            </Button>
          )}
        </form>
      )}

      {error && (
        <p
          role="alert"
          className="mt-3 rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-sm text-rose-300"
        >
          {error}
        </p>
      )}
      {success && (
        <p
          role="status"
          className="mt-3 flex items-center gap-2 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-300"
        >
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          {success}
        </p>
      )}
    </div>
  );
}
