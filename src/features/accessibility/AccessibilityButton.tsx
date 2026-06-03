import { useCallback, useId, useRef, useState } from 'react';
import { Accessibility } from 'lucide-react';
import { AccessibilityMenu } from './AccessibilityMenu';

/**
 * Bottom-left floating accessibility entry point. Opens a keyboard-accessible
 * popover of display preferences (larger text, high contrast, reduce motion,
 * etc.). The toggles persist but are a UI scaffold — they don't apply visual
 * effects yet; this slot owns the launcher + open/close state and hands focus
 * back to the button when the popover closes.
 */
export function AccessibilityButton() {
  const [open, setOpen] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const buttonId = useId();

  const handleClose = useCallback(() => {
    setOpen(false);
    // Return focus to the launcher so keyboard users aren't stranded.
    buttonRef.current?.focus();
  }, []);

  return (
    <>
      <button
        ref={buttonRef}
        id={buttonId}
        type="button"
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-label="Accessibility options"
        title="Accessibility options"
        onClick={() => setOpen((prev) => !prev)}
        className="fixed bottom-4 left-4 z-30 inline-flex h-12 w-12 items-center justify-center rounded-full border border-slate-700 bg-slate-900/90 text-slate-200 shadow-lg shadow-slate-950/40 backdrop-blur transition hover:border-indigo-500/60 hover:bg-slate-800 hover:text-indigo-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 light:border-slate-300 light:bg-white/90 light:text-slate-700 light:shadow-slate-300/40 light:hover:border-indigo-400 light:hover:bg-white light:hover:text-indigo-600 sm:bottom-6 sm:left-6"
      >
        <Accessibility className="h-6 w-6" aria-hidden="true" />
        <span className="sr-only">Accessibility options</span>
      </button>

      <AccessibilityMenu open={open} onClose={handleClose} triggerId={buttonId} />
    </>
  );
}
