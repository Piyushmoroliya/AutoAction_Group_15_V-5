import { forwardRef } from 'react';
import type { HTMLAttributes } from 'react';
import { cn } from '../../utils/cn';

interface BadgeProps extends HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'success' | 'warning' | 'error' | 'info';
}

const Badge = forwardRef<HTMLDivElement, BadgeProps>(
  ({ className, variant = 'default', children, ...props }, ref) => {
    const variants = {
      default: 'bg-navy-200 text-navy-900 dark:bg-navy-700 dark:text-navy-100 font-semibold',
      success: 'bg-success-500 text-white dark:bg-success-600 dark:text-white font-semibold shadow-sm',
      warning: 'bg-warning-500 text-white dark:bg-warning-600 dark:text-white font-semibold shadow-sm',
      error: 'bg-error-500 text-white dark:bg-error-600 dark:text-white font-semibold shadow-sm',
      info: 'bg-primary-500 text-white dark:bg-primary-600 dark:text-white font-semibold shadow-sm',
    };

    return (
      <div
        ref={ref}
        className={cn(
          'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
          variants[variant],
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);

Badge.displayName = 'Badge';

export default Badge;
