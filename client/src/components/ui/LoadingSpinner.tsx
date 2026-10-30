import React from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '../../lib/utils';

export const LoadingSpinner: React.FC<{
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  label?: string;
}> = ({ size = 'md', className, label }) => {
  const sizeMap = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8'
  };

  return (
    <div className={cn('flex flex-col items-center justify-center p-6 gap-2 text-slate-400', className)}>
      <Loader2 className={cn('animate-spin text-brand-600', sizeMap[size])} />
      {label && <span className="text-xs text-slate-500 font-medium">{label}</span>}
    </div>
  );
};
