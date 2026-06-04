import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowLeft,
  CheckCircle2,
  Gavel,
  Lock,
  ShieldCheck,
  ShieldAlert,
  Zap,
} from 'lucide-react';
import clsx from 'clsx';
import type { AuctionTiming, Vehicle } from '@/data/types';
import { Badge, Button } from '@/components';
import { formatCurrency } from '@/lib/format';
import { useToast } from '@/features/toast/toastStore';
import { useAuctionStore, useBidState } from '@/features/bidding/auctionStore';
import {
  currentFloor,
  minIncrement,
  minNextBid,
  validateBid,
} from '@/features/bidding/bidLogic';

/** A pending action awaiting in-panel confirmation. */
type PendingAction =
  | { kind: 'bid'; amount: number }
  | { kind: 'buyNow' };

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
  const addToast = useToast();
  const lotTitle = `${vehicle.year} ${vehicle.make} ${vehicle.model}`;

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
  const [freshSuccess, setFreshSuccess] = useState<string | null>(null);
  // The action staged in the confirmation dialog; null when the dialog is shut.
  const [pending, setPending] = useState<PendingAction | null>(null);

  const isHighBidder =
    bid.history.length > 0 && bid.history[0].source === 'you';

  const success =
    freshSuccess ?? (isHighBidder ? 'You\u2019re the high bidder.' : null);

  // Keep the input at or above the live minimum as rival/own bids raise it.
  useEffect(() => {
    setAmount((prev) => {
      const numeric = Number(prev);
      return prev === '' || Number.isNaN(numeric) || numeric < minimum
        ? String(minimum)
        : prev;
    });
  }, [minimum]);

  // Clear the transient success when a rival outbids (derived state takes over).
  useEffect(() => {
    if (!isHighBidder) setFreshSuccess(null);
  }, [isHighBidder]);

  // Move focus to the confirm button when the inline step appears, and let Esc
  // back out of it — so the step is fully keyboard-operable without a modal.
  const confirmRef = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    if (!pending) return;
    confirmRef.current?.focus();
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setPending(null);
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [pending]);

  const isLive = timing.status === 'live';
  const buyNowAvailable =
    vehicle.buyNowPrice !== null && bid.currentBid < vehicle.buyNowPrice;

  // Step 1: validate up front, then stage the bid for confirmation rather than
  // committing it immediately.
  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    const numeric = Number(amount);
    const result = validateBid({
      amount: numeric,
      currentBid: bid.currentBid,
      startingBid: vehicle.startingBid,
      buyNowPrice: vehicle.buyNowPrice,
    });
    if (!result.ok) {
      setFreshSuccess(null);
      setError(result.error ?? 'Unable to place bid.');
      return;
    }
    setError(null);
    setPending({ kind: 'bid', amount: numeric });
  };

  // Step 1 for Buy Now: stage it; the actual purchase runs on confirm.
  const handleBuyNow = () => {
    setError(null);
    setPending({ kind: 'buyNow' });
  };

  // Step 2: the user confirmed — commit the staged action and toast the result.
  const confirmPending = () => {
    if (!pending) return;

    if (pending.kind === 'bid') {
      const result = placeBid(vehicle.id, pending.amount);
      if (result.ok) {
        setError(null);
        setFreshSuccess('Bid placed \u2014 you\u2019re the high bidder.');
        addToast({
          tone: 'success',
          title: 'Bid placed',
          description: `Your bid of ${formatCurrency(pending.amount)} on the ${lotTitle} is in \u2014 you\u2019re the high bidder.`,
        });
      } else {
        setFreshSuccess(null);
        setError(result.error ?? 'Unable to place bid.');
        addToast({
          tone: 'error',
          title: 'Bid not placed',
          description: result.error ?? 'Unable to place bid.',
        });
      }
    } else {
      const result = buyNow(vehicle.id);
      if (result.ok) {
        setError(null);
        setFreshSuccess('Purchased at the Buy Now price.');
        addToast({
          tone: 'success',
          title: 'Purchase complete',
          description: `You bought the ${lotTitle} at ${formatCurrency(vehicle.buyNowPrice as number)}.`,
        });
      } else {
        setFreshSuccess(null);
        setError(result.error ?? 'Unable to buy now.');
        addToast({
          tone: 'error',
          title: 'Purchase failed',
          description: result.error ?? 'Unable to buy now.',
        });
      }
    }

    setPending(null);
  };

  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-4 sm:p-5 light:border-slate-200 light:bg-white light:shadow-sm light:shadow-slate-200/50">
      <div className="flex items-end justify-between gap-3">
        <div>
          <p className="text-[11px] uppercase tracking-wide text-slate-500">
            {timing.status === 'ended' ? 'Final bid' : 'Current bid'}
          </p>
          <p className="text-3xl font-semibold text-slate-50 light:text-slate-900">
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
        <div className="mt-4 flex items-center gap-2 rounded-lg border border-slate-800 bg-slate-800/30 px-3 py-3 text-sm text-slate-400 light:border-slate-200 light:bg-slate-100 light:text-slate-600">
          <Lock className="h-4 w-4 shrink-0" />
          <span>
            {timing.status === 'scheduled'
              ? 'Bidding opens when this auction goes live.'
              : 'This auction has ended. Bidding is closed.'}
          </span>
        </div>
      ) : pending ? (
        <div
          key={pending.kind}
          className="animate-confirm-in mt-4 flex flex-col gap-3 rounded-lg border border-indigo-500/30 bg-indigo-500/[0.06] p-3.5 light:border-indigo-500/40 light:bg-indigo-50/80"
        >
          <div className="flex items-start gap-2.5">
            <span
              className={clsx(
                'mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full',
                pending.kind === 'buyNow'
                  ? 'bg-emerald-500/15 text-emerald-300 light:text-emerald-700'
                  : 'bg-indigo-500/15 text-indigo-300 light:text-indigo-700'
              )}
            >
              {pending.kind === 'buyNow' ? (
                <Zap className="h-4 w-4" />
              ) : (
                <Gavel className="h-4 w-4" />
              )}
            </span>
            <div className="min-w-0">
              <p className="text-sm font-medium text-slate-100 light:text-slate-900">
                {pending.kind === 'buyNow'
                  ? 'Confirm Buy Now'
                  : 'Confirm your bid'}
              </p>
              <p className="mt-0.5 text-sm leading-relaxed text-slate-400 light:text-slate-600">
                {pending.kind === 'buyNow' ? (
                  <>
                    Buy the {lotTitle} outright for{' '}
                    <span className="font-semibold text-slate-100 light:text-slate-900">
                      {formatCurrency(vehicle.buyNowPrice as number)}
                    </span>
                    ? This wins the lot and closes bidding for you.
                  </>
                ) : (
                  <>
                    Place a bid of{' '}
                    <span className="font-semibold text-slate-100 light:text-slate-900">
                      {formatCurrency(pending.amount)}
                    </span>
                    ? The current bid is {formatCurrency(bid.currentBid)}.
                  </>
                )}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setPending(null)}
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>
            <Button
              ref={confirmRef}
              type="button"
              variant={pending.kind === 'buyNow' ? 'success' : 'primary'}
              size="sm"
              className="flex-1"
              onClick={confirmPending}
            >
              {pending.kind === 'buyNow' ? (
                <>
                  <Zap className="h-4 w-4" />
                  Confirm purchase
                </>
              ) : (
                <>
                  <Gavel className="h-4 w-4" />
                  Confirm bid
                </>
              )}
            </Button>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="mt-4 flex flex-col gap-3">
          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-medium text-slate-400 light:text-slate-600">
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
                    setFreshSuccess(null);
                  }}
                  aria-label="Bid amount in dollars"
                  className="w-full rounded-lg border border-slate-700 bg-slate-950/60 py-2.5 pl-7 pr-3 text-sm font-medium text-slate-100 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 light:border-slate-300 light:bg-white light:text-slate-900"
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
          className="mt-3 rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-sm text-rose-300 light:border-rose-600/40 light:text-rose-700"
        >
          {error}
        </p>
      )}
      {success && (
        <p
          role="status"
          className="mt-3 flex items-center gap-2 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-300 light:border-emerald-600/40 light:text-emerald-700"
        >
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          {success}
        </p>
      )}
    </div>
  );
}
