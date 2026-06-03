import { AlertTriangle, ClipboardCheck } from 'lucide-react';
import clsx from 'clsx';
import type { TitleStatus, Vehicle } from '@/data/types';
import { Badge, type BadgeTone } from '@/components';
import { formatGrade } from '@/lib/format';
import { Panel } from './Panel';

/** Grades are reported on a 5-point scale across the dataset. */
const GRADE_MAX = 5;

const TITLE_TONE: Record<TitleStatus, BadgeTone> = {
  clean: 'emerald',
  rebuilt: 'amber',
  salvage: 'rose',
};

/** Greens for strong grades, amber mid-range, rose for rough lots. */
function gradeTone(grade: number): string {
  if (grade >= 4) return 'text-emerald-300';
  if (grade >= 3) return 'text-amber-300';
  return 'text-rose-300';
}

interface ConditionPanelProps {
  vehicle: Vehicle;
}

/** Condition grade, inspector report, damage notes, and title status. */
export function ConditionPanel({ vehicle }: ConditionPanelProps) {
  const { conditionGrade, conditionReport, damageNotes, titleStatus } = vehicle;

  return (
    <Panel
      title="Condition"
      icon={ClipboardCheck}
      action={
        <Badge tone={TITLE_TONE[titleStatus]} className="capitalize">
          {titleStatus} title
        </Badge>
      }
    >
      <div className="flex flex-col gap-4">
        <div className="flex items-end gap-3">
          <span
            className={clsx(
              'text-3xl font-semibold',
              gradeTone(conditionGrade)
            )}
          >
            {formatGrade(conditionGrade)}
          </span>
          <span className="pb-1 text-sm text-slate-500">
            / {GRADE_MAX.toFixed(1)} condition grade
          </span>
        </div>

        <p className="text-sm leading-relaxed text-slate-300">
          {conditionReport}
        </p>

        <div>
          <h3 className="mb-2 text-xs uppercase tracking-wide text-slate-500">
            Damage notes
          </h3>
          {damageNotes.length === 0 ? (
            <p className="text-sm text-slate-400">
              No damage reported by the inspector.
            </p>
          ) : (
            <ul className="flex flex-col gap-2">
              {damageNotes.map((note) => (
                <li
                  key={note}
                  className="flex items-start gap-2 text-sm text-slate-300"
                >
                  <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-400" />
                  <span>{note}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </Panel>
  );
}
