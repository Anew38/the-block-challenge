import type { ButtonHTMLAttributes } from 'react';
import clsx from 'clsx';
import { buttonClasses, type ButtonVariantOptions } from './buttonStyles';

interface ButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement>, ButtonVariantOptions {}

export function Button({
  variant,
  size,
  className,
  type = 'button',
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={clsx(buttonClasses({ variant, size }), className)}
      {...props}
    />
  );
}
