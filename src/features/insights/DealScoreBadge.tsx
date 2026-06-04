import { Gem } from 'lucide-react';
import clsx from 'clsx';

/** Tone thresholds: a strong deal, a fair one, or a pricey lot. */
function toneFor(score: number): 'positive' | 'neutral' | 'caution' {
  if (score >= 7.5) return 'positive';
  if (score >= 5) return 'neutral';
  return 'caution';
}

const TONE_CLASSES: Record<
  ReturnType<typeof toneFor>,
  string
> = {
  positive:
    'bg-emerald-500/15 text-emerald-300 ring-emerald-500/30 light:text-emerald-700 light:ring-emerald-600/30',
  neutral:
    'bg-sky-500/15 text-sky-300 ring-sky-500/30 light:text-sky-700 light:ring-sky-600/30',
  caution:
    'bg-amber-500/15 text-amber-300 ring-amber-500/30 light:text-amber-700 light:ring-amber-600/30',
};

interface DealScoreBadgeProps {
  /** Deal Score on the 0–10 scale. */
  score: number;
  /** `full` shows the "Deal Score" label; `compact` is icon + number only. */
  variant?: 'full' | 'compact';
  className?: string;
}

/** Renders a tinted "Deal Score: X.X/10" chip, color-coded by attractiveness. */
export function DealScoreBadge({
  score,
  variant = 'full',
  className,
}: DealScoreBadgeProps) {
  const tone = toneFor(score);
  const value = score.toFixed(1);

  return (
    <span
      className={clsx(
        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ring-1',
        TONE_CLASSES[tone],
        className
      )}
      title={`Deal Score: ${value} out of 10 — a rule-based, AI-inspired estimate`}
    >
      <Gem className="h-3.5 w-3.5 shrink-0" />
      {variant === 'full' ? (
        <span>
          Deal Score: {value}
          <span className="text-[0.85em] font-medium opacity-80">/10</span>
        </span>
      ) : (
        <span>{value}</span>
      )}
    </span>
  );
}
