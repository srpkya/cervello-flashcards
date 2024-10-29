import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: Date): string {
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
}

export function formatTimestamp(timestamp: number | null): string {
  if (!timestamp) return 'Not reviewed yet';
  return `Last reviewed ${formatDate(new Date(timestamp))}`;
}

export function formatStudyTime(minutes: number) {
  return {
    hours: Math.floor(minutes / 60),
    minutes: Math.floor(minutes % 60)
  };
}

export function formatTimeString(time: { hours: number; minutes: number }): string {
  return `${time.hours}h ${time.minutes}m`;
}

export function calculateDueDate(
  interval: number,
  easeFactor: number,
  lastReviewed: number | null = null
): number {
  if (!lastReviewed) return Date.now();
  
  const nextInterval = Math.round(interval * (easeFactor / 100));
  return lastReviewed + (nextInterval * 24 * 60 * 60 * 1000);
}

export function getDueStatus(nextReview: number | null): 'due' | 'today' | 'future' {
  if (!nextReview) return 'due';
  
  const now = Date.now();
  const tomorrow = now + (24 * 60 * 60 * 1000);
  
  if (nextReview <= now) return 'due';
  if (nextReview <= tomorrow) return 'today';
  return 'future';
}

export function formatDuration(ms: number): string {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  
  if (hours > 0) {
    return `${hours}h ${minutes % 60}m`;
  }
  if (minutes > 0) {
    return `${minutes}m ${seconds % 60}s`;
  }
  return `${seconds}s`;
}

export function shuffle<T>(array: T[]): T[] {
  const newArray = [...array];
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
  }
  return newArray;
}

export function calculateRetentionScore(
  stability: number,
  difficulty: number,
  elapsed: number
): number {
  // Using the FSRS retention score formula
  const retention = Math.exp(Math.log(0.9) * elapsed / stability);
  return Math.min(Math.max(retention * (1.0 - difficulty / 10.0), 0), 1);
}

export function getReviewIntervals(stability: number): {
  again: number;
  hard: number;
  good: number;
  easy: number;
} {
  // Calculate intervals based on FSRS algorithm
  const again = Math.max(1, Math.round(stability * 0.2));
  const hard = Math.max(1, Math.round(stability * 0.8));
  const good = Math.max(1, Math.round(stability * 1.0));
  const easy = Math.max(1, Math.round(stability * 1.3));

  return { again, hard, good, easy };
}

export function formatInterval(days: number): string {
  if (days === 0) return 'Same day';
  if (days === 1) return 'Tomorrow';
  
  const months = Math.floor(days / 30);
  const remainingDays = days % 30;
  
  if (months > 0) {
    if (remainingDays === 0) {
      return `${months} month${months > 1 ? 's' : ''}`;
    }
    return `${months} month${months > 1 ? 's' : ''} ${remainingDays} day${remainingDays > 1 ? 's' : ''}`;
  }
  
  return `${days} day${days > 1 ? 's' : ''}`;
}

export function getGradingButtonColors(grade: 'again' | 'hard' | 'good' | 'easy') {
  const colors = {
    again: {
      base: 'border-red-200 dark:border-red-500/20',
      hover: 'hover:border-red-300 dark:hover:border-red-500/30',
      text: 'text-red-600 dark:text-red-400',
    },
    hard: {
      base: 'border-yellow-200 dark:border-yellow-500/20',
      hover: 'hover:border-yellow-300 dark:hover:border-yellow-500/30',
      text: 'text-yellow-600 dark:text-yellow-400',
    },
    good: {
      base: 'border-green-200 dark:border-green-500/20',
      hover: 'hover:border-green-300 dark:hover:border-green-500/30',
      text: 'text-green-600 dark:text-green-400',
    },
    easy: {
      base: 'border-blue-200 dark:border-blue-500/20',
      hover: 'hover:border-blue-300 dark:hover:border-blue-500/30',
      text: 'text-blue-600 dark:text-blue-400',
    },
  };

  return colors[grade];
}

export function calculateStreak(studyDates: Date[]): number {
  if (!studyDates.length) return 0;

  const sortedDates = studyDates
    .map(date => new Date(date).setHours(0, 0, 0, 0))
    .sort((a, b) => b - a);

  let streak = 1;
  let currentDate = sortedDates[0];
  const oneDayMs = 24 * 60 * 60 * 1000;

  for (let i = 1; i < sortedDates.length; i++) {
    const prevDate = currentDate;
    currentDate = sortedDates[i];
    
    if (prevDate - currentDate === oneDayMs) {
      streak++;
    } else {
      break;
    }
  }

  return streak;
}

export function getStudyGoalProgress(
  cardsStudied: number,
  dailyGoal: number
): {
  progress: number;
  status: 'behind' | 'on-track' | 'ahead';
  remaining: number;
} {
  const progress = Math.min((cardsStudied / dailyGoal) * 100, 100);
  const remaining = Math.max(dailyGoal - cardsStudied, 0);
  
  let status: 'behind' | 'on-track' | 'ahead';
  if (progress >= 100) {
    status = 'ahead';
  } else if (progress >= 80) {
    status = 'on-track';
  } else {
    status = 'behind';
  }

  return { progress, status, remaining };
}

export function generateReviewSchedule(
  cards: Array<{ nextReview: number | null; difficulty: number }>
): Array<{ date: Date; count: number }> {
  const schedule: Map<number, number> = new Map();
  const now = Date.now();
  const thirtyDaysMs = 30 * 24 * 60 * 60 * 1000;

  cards.forEach(card => {
    if (!card.nextReview) return;
    
    const reviewDate = new Date(card.nextReview);
    const dateKey = reviewDate.setHours(0, 0, 0, 0);
    
    if (dateKey >= now && dateKey <= now + thirtyDaysMs) {
      schedule.set(dateKey, (schedule.get(dateKey) || 0) + 1);
    }
  });

  return Array.from(schedule.entries())
    .map(([date, count]) => ({
      date: new Date(date),
      count
    }))
    .sort((a, b) => a.date.getTime() - b.date.getTime());
}

export function sanitizeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;

  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };

    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;
  
  return function(...args: Parameters<T>) {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  }
}