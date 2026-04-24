import * as React from 'react';
import { cn } from '@/lib/utils';

function Badge({ className, variant = 'default', ...props }) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium transition-colors',
        {
          default: 'border border-white/10 bg-white/8 text-white/60',
          accent: 'border border-blue-500/30 bg-blue-500/15 text-blue-300',
          success: 'border border-emerald-500/30 bg-emerald-500/15 text-emerald-300',
        }[variant],
        className,
      )}
      {...props}
    />
  );
}

export { Badge };
