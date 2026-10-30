import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { format, formatDistanceToNow, parseISO } from 'date-fns';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(dateString?: string | null): string {
  if (!dateString) return 'Not set';
  try {
    const d = parseISO(dateString);
    return format(d, 'MMM d, yyyy');
  } catch {
    return dateString;
  }
}

export function formatDateTime(dateString?: string | null): string {
  if (!dateString) return 'Not set';
  try {
    const d = parseISO(dateString);
    return format(d, 'MMM d, yyyy, h:mm a');
  } catch {
    return dateString;
  }
}

export function timeAgo(dateString?: string | null): string {
  if (!dateString) return 'Unknown';
  try {
    const d = parseISO(dateString);
    return formatDistanceToNow(d, { addSuffix: true });
  } catch {
    return dateString;
  }
}
