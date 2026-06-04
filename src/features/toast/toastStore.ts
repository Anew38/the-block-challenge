/**
 * Lightweight, app-wide toast notifications. A tiny Zustand store holds the
 * active queue; `ToastViewport` renders it and owns auto-dismiss. Not persisted —
 * toasts are ephemeral, session-only feedback.
 */
import { create } from 'zustand';

export type ToastTone = 'success' | 'error' | 'info';

export interface Toast {
  id: string;
  tone: ToastTone;
  title: string;
  /** Optional supporting line under the title. */
  description?: string;
  /** Auto-dismiss delay in ms; `0` keeps it until dismissed manually. */
  duration: number;
}

/** Fields a caller supplies; the store fills in id/tone/duration defaults. */
export type ToastInput = Omit<Toast, 'id' | 'tone' | 'duration'> &
  Partial<Pick<Toast, 'tone' | 'duration'>>;

interface ToastStore {
  toasts: Toast[];
  /** Enqueue a toast and return its id (for manual dismissal). */
  addToast: (toast: ToastInput) => string;
  dismissToast: (id: string) => void;
}

const DEFAULT_DURATION = 4_000;

function createToastId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }
  return `toast_${Date.now().toString(36)}_${Math.random()
    .toString(36)
    .slice(2, 8)}`;
}

export const useToastStore = create<ToastStore>((set) => ({
  toasts: [],
  addToast: (toast) => {
    const id = createToastId();
    const next: Toast = {
      id,
      tone: toast.tone ?? 'info',
      title: toast.title,
      description: toast.description,
      duration: toast.duration ?? DEFAULT_DURATION,
    };
    set((s) => ({ toasts: [...s.toasts, next] }));
    return id;
  },
  dismissToast: (id) =>
    set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
}));

/** Convenience hook returning just the enqueue action. */
export function useToast(): (toast: ToastInput) => string {
  return useToastStore((s) => s.addToast);
}
