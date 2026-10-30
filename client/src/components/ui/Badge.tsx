import React from 'react';
import { cn } from '../../lib/utils';
import { TaskStatus, TaskPriority, GapSeverity, GapStatus } from '../../types/shared';

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?:
    | 'default'
    | 'neutral'
    | 'primary'
    | 'success'
    | 'warning'
    | 'danger'
    | 'info'
    | 'critical';
  size?: 'sm' | 'md';
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  className,
  variant = 'default',
  size = 'md',
  ...props
}) => {
  const variantStyles = {
    default: 'bg-slate-100 text-slate-700 border-slate-200',
    neutral: 'bg-slate-100 text-slate-600 border-slate-200',
    primary: 'bg-blue-50 text-blue-700 border-blue-200',
    success: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    warning: 'bg-amber-50 text-amber-700 border-amber-200',
    danger: 'bg-rose-50 text-rose-700 border-rose-200',
    info: 'bg-sky-50 text-sky-700 border-sky-200',
    critical: 'bg-red-100 text-red-800 border-red-300 font-semibold'
  };

  const sizeStyles = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-xs px-2.5 py-1'
  };

  return (
    <span
      className={cn(
        'inline-flex items-center font-medium rounded-full border transition-colors',
        variantStyles[variant],
        sizeStyles[size],
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
};

export const TaskStatusBadge: React.FC<{ status: TaskStatus }> = ({ status }) => {
  const map: Record<TaskStatus, { variant: 'default' | 'info' | 'danger' | 'success' | 'neutral'; label: string }> = {
    Open: { variant: 'info', label: 'Open' },
    'In Progress': { variant: 'info', label: 'In Progress' },
    Blocked: { variant: 'danger', label: 'Blocked' },
    Completed: { variant: 'success', label: 'Completed' },
    Cancelled: { variant: 'neutral', label: 'Cancelled' }
  };
  const config = map[status] || { variant: 'default', label: status };
  return <Badge variant={config.variant}>{config.label}</Badge>;
};

export const PriorityBadge: React.FC<{ priority: TaskPriority }> = ({ priority }) => {
  const map: Record<TaskPriority, { variant: 'neutral' | 'info' | 'warning' | 'critical'; label: string }> = {
    Low: { variant: 'neutral', label: 'Low' },
    Medium: { variant: 'info', label: 'Medium' },
    High: { variant: 'warning', label: 'High' },
    Critical: { variant: 'critical', label: 'Critical' }
  };
  const config = map[priority] || { variant: 'info', label: priority };
  return <Badge variant={config.variant}>{config.label}</Badge>;
};

export const SeverityBadge: React.FC<{ severity: GapSeverity }> = ({ severity }) => {
  const map: Record<GapSeverity, { variant: 'neutral' | 'info' | 'warning' | 'critical'; label: string }> = {
    Low: { variant: 'neutral', label: 'Low Severity' },
    Medium: { variant: 'info', label: 'Medium' },
    High: { variant: 'warning', label: 'High Severity' },
    Critical: { variant: 'critical', label: 'Critical' }
  };
  const config = map[severity] || { variant: 'info', label: severity };
  return <Badge variant={config.variant}>{config.label}</Badge>;
};

export const GapStatusBadge: React.FC<{ status: GapStatus }> = ({ status }) => {
  const map: Record<GapStatus, { variant: 'danger' | 'warning' | 'success' | 'neutral'; label: string }> = {
    Open: { variant: 'danger', label: 'Open Gap' },
    Acknowledged: { variant: 'warning', label: 'Acknowledged' },
    Resolved: { variant: 'success', label: 'Resolved' },
    Dismissed: { variant: 'neutral', label: 'Dismissed' }
  };
  const config = map[status] || { variant: 'neutral', label: status };
  return <Badge variant={config.variant}>{config.label}</Badge>;
};
