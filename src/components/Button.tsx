import { forwardRef, type ButtonHTMLAttributes } from 'react';
import clsx from 'clsx';
import { buttonClasses, type ButtonVariantOptions } from './buttonStyles';

interface ButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement>, ButtonVariantOptions {}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  function Button({ variant, size, className, type = 'button', ...props }, ref) {
    return (
      <button
        ref={ref}
        type={type}
        className={clsx(buttonClasses({ variant, size }), className)}
        {...props}
      />
    );
  }
);
