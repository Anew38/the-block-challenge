import type { AuctionStatus } from '@/data/types';
import { Badge, type BadgeTone } from './Badge';

const STATUS: Record<AuctionStatus, { tone: BadgeTone; label: string }> = {
  live: { tone: 'emerald', label: 'Live' },
  scheduled: { tone: 'sky', label: 'Scheduled' },
  ended: { tone: 'slate', label: 'Ended' },
};

interface StatusBadgeProps {
  status: AuctionStatus;
  className?: string;
}

/**
 * Auction status pill. Live lots get a pulsing dot to reinforce that the
 * countdown and prices are moving in real time.
 */
export function StatusBadge({ status, className }: StatusBadgeProps) {
  const { tone, label } = STATUS[status];
  return (
    <Badge tone={tone} className={className}>
      {status === 'live' && (
        <span className="relative flex h-1.5 w-1.5" aria-hidden="true">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
          <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-400" />
        </span>
      )}
      {label}
    </Badge>
  );
}
