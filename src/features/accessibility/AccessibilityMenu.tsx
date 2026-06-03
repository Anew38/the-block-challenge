import { useEffect, useId, useRef } from 'react';
import clsx from 'clsx';
import { RotateCcw, X } from 'lucide-react';
import { A11Y_TOGGLES, useAccessibilityStore } from './accessibilityStore';

interface AccessibilityMenuProps {
  /** Whether the popover is currently shown. */
  open: boolean;
  /** Request close (Esc, outside click, or the close button). */
  onClose: () => void;
  /** id of the launcher button, so the dialog can point back at it / restore focus. */
  triggerId: string;
}

/** Selector for elements we can move focus to inside the popover. */
const FOCUSABLE =
  'button:not([disabled]), [href], input:not([disabled]), [tabindex]:not([tabindex="-1"])';

/**
 * Keyboard-accessible accessibility settings popover.
 *
 * Behaves like a lightweight non-modal dialog: focus moves inside on open and
 * is trapped with Tab/Shift+Tab, Esc closes it, and a click outside dismisses
 * it. The toggles are real, persisted switches — they just don't apply visual
 * effects yet (intentional scaffold).
 */
export function AccessibilityMenu({
  open,
  onClose,
  triggerId,
}: AccessibilityMenuProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const titleId = useId();
  const descId = useId();
  const preferences = useAccessibilityStore((s) => s.preferences);
  const toggle = useAccessibilityStore((s) => s.toggle);
  const reset = useAccessibilityStore((s) => s.reset);

  // Move focus into the popover when it opens.
  useEffect(() => {
    if (!open) return;
    const node = containerRef.current;
    if (!node) return;
    const first = node.querySelector<HTMLElement>(FOCUSABLE);
    first?.focus();
  }, [open]);

  // Esc to close + close when focus/click leaves the popover (and its trigger).
  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.stopPropagation();
        onClose();
        return;
      }
      if (event.key !== 'Tab') return;

      // Trap focus within the popover.
      const node = containerRef.current;
      if (!node) return;
      const focusable = Array.from(
        node.querySelectorAll<HTMLElement>(FOCUSABLE),
      );
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      const active = document.activeElement;

      if (event.shiftKey && active === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && active === last) {
        event.preventDefault();
        first.focus();
      }
    };

    const handlePointerDown = (event: MouseEvent) => {
      const node = containerRef.current;
      const trigger = document.getElementById(triggerId);
      const target = event.target as Node;
      if (node?.contains(target) || trigger?.contains(target)) return;
      onClose();
    };

    document.addEventListener('keydown', handleKeyDown, true);
    document.addEventListener('mousedown', handlePointerDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown, true);
      document.removeEventListener('mousedown', handlePointerDown);
    };
  }, [open, onClose, triggerId]);

  if (!open) return null;

  return (
    <div
      ref={containerRef}
      role="dialog"
      aria-labelledby={titleId}
      aria-describedby={descId}
      className="fixed bottom-20 left-4 z-40 w-[min(20rem,calc(100vw-2rem))] rounded-xl border border-slate-700 bg-slate-900/95 p-4 shadow-xl shadow-slate-950/50 backdrop-blur light:border-slate-200 light:bg-white/95 light:shadow-slate-300/50 sm:bottom-24 sm:left-6"
    >
      <div className="mb-3 flex items-start justify-between gap-3">
        <div>
          <h2
            id={titleId}
            className="text-sm font-semibold tracking-tight text-slate-100 light:text-slate-900"
          >
            Accessibility
          </h2>
          <p id={descId} className="mt-0.5 text-xs text-slate-400 light:text-slate-500">
            Adjust how the app looks and behaves.
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close accessibility menu"
          className="-mr-1 -mt-1 inline-flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-800 hover:text-slate-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 light:text-slate-500 light:hover:bg-slate-100 light:hover:text-slate-900"
        >
          <X className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>

      <ul className="space-y-1">
        {A11Y_TOGGLES.map((item) => (
          <li key={item.key}>
            <ToggleRow
              checked={preferences[item.key]}
              label={item.label}
              description={item.description}
              onToggle={() => toggle(item.key)}
            />
          </li>
        ))}
      </ul>

      <div className="mt-3 border-t border-slate-800 pt-3 light:border-slate-200">
        <button
          type="button"
          onClick={reset}
          className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1 text-xs font-medium text-slate-400 transition hover:bg-slate-800 hover:text-slate-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 light:text-slate-500 light:hover:bg-slate-100 light:hover:text-slate-900"
        >
          <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
          Reset to defaults
        </button>
      </div>
    </div>
  );
}

interface ToggleRowProps {
  checked: boolean;
  label: string;
  description: string;
  onToggle: () => void;
}

/** A single labeled switch row, implemented with the ARIA `switch` pattern. */
function ToggleRow({ checked, label, description, onToggle }: ToggleRowProps) {
  const labelId = useId();
  const descId = useId();

  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-labelledby={labelId}
      aria-describedby={descId}
      onClick={onToggle}
      className="flex w-full items-center justify-between gap-3 rounded-lg px-2 py-2 text-left transition hover:bg-slate-800/70 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 light:hover:bg-slate-100"
    >
      <span className="min-w-0">
        <span
          id={labelId}
          className="block text-sm font-medium text-slate-200 light:text-slate-800"
        >
          {label}
        </span>
        <span
          id={descId}
          className="block text-xs text-slate-400 light:text-slate-500"
        >
          {description}
        </span>
      </span>
      <span
        aria-hidden="true"
        className={clsx(
          'relative inline-flex h-5 w-9 flex-shrink-0 items-center rounded-full transition-colors',
          checked
            ? 'bg-indigo-500 light:bg-indigo-600'
            : 'bg-slate-700 light:bg-slate-300',
        )}
      >
        <span
          className={clsx(
            'inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform',
            checked ? 'translate-x-4' : 'translate-x-0.5',
          )}
        />
      </span>
    </button>
  );
}
