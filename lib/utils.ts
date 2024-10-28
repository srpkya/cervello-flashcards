import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface FormattedTime {
  hours: number;
  minutes: number;
}

export function formatStudyTime(minutes: number): FormattedTime {
  return {
    hours: Math.floor(minutes / 60),
    minutes: Math.floor(minutes % 60)
  };
}

export function formatTimeString(time: FormattedTime): string {
  return `${time.hours}h ${time.minutes}m`;
}