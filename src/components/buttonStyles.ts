import clsx from 'clsx';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'success';
export type ButtonSize = 'sm' | 'md';

const BASE =
  'inline-flex items-center justify-center gap-1.5 rounded-lg font-medium transition focus:outline-none focus-visible:ring-2 disabled:cursor-not-allowed disabled:opacity-50';

const VARIANTS: Record<ButtonVariant, string> = {
  primary:
    'bg-indigo-500 text-white hover:bg-indigo-400 focus-visible:ring-indigo-300 light:bg-indigo-600 light:hover:bg-indigo-500 light:focus-visible:ring-indigo-400',
  secondary:
    'border border-slate-700 text-slate-200 hover:bg-slate-800 focus-visible:ring-slate-500 light:border-slate-300 light:text-slate-700 light:hover:bg-slate-100 light:focus-visible:ring-slate-400',
  ghost:
    'text-slate-400 hover:bg-slate-800 hover:text-slate-200 focus-visible:ring-slate-500 light:text-slate-600 light:hover:bg-slate-100 light:hover:text-slate-900 light:focus-visible:ring-slate-400',
  success:
    'border border-emerald-500/40 bg-emerald-500/10 text-emerald-300 hover:bg-emerald-500/20 focus-visible:ring-emerald-300 light:border-emerald-600/50 light:bg-emerald-500/10 light:text-emerald-700 light:hover:bg-emerald-500/20 light:focus-visible:ring-emerald-500',
};

const SIZES: Record<ButtonSize, string> = {
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-4 py-2.5 text-sm',
};

export interface ButtonVariantOptions {
  variant?: ButtonVariant;
  size?: ButtonSize;
}

/**
 * Shared button class string, kept in its own module so anchors and React
 * Router `Link`s can adopt the same styling without rendering a real button.
 */
export function buttonClasses({
  variant = 'secondary',
  size = 'md',
}: ButtonVariantOptions = {}): string {
  return clsx(BASE, VARIANTS[variant], SIZES[size]);
}
