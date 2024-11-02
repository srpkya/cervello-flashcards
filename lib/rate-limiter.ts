import { getDb } from './db';
import { userRateLimit } from './schema';
import { eq, sql } from 'drizzle-orm';

interface RateLimitResponse {
  isLimited: boolean;
  remaining: number;
  resetIn?: number;
  message?: string;
}

export const RATE_LIMITS = {
  TRANSLATIONS_PER_HOUR: 30,      
  TRANSLATIONS_PER_DAY: 100,      
  TRANSLATIONS_PER_MONTH: 500,   
} as const;

const HOUR = 3600000;   
const DAY = 86400000;   
const MONTH = 2592000000; 

export class RateLimiter {
  private static async initializeUserData(userId: string) {
    const now = Date.now();
    const db = await getDb();

    const newRateLimit = {
      id: crypto.randomUUID(),
      userId,
      translationCount: 0,
      translationResetTime: now + HOUR,
      dailyCount: 0,
      dailyResetTime: now + DAY,
      monthlyCount: 0,
      monthlyResetTime: now + MONTH,
      lastUpdated: now
    };

    await db.insert(userRateLimit).values(newRateLimit);
    return newRateLimit;
  }

  private static async cleanupExpiredData(userId: string) {
    const db = await getDb();
    const now = Date.now();

    const data = await db
      .select()
      .from(userRateLimit)
      .where(eq(userRateLimit.userId, userId))
      .get();

    if (!data) return null;

    const updates: Partial<typeof data> = {
      lastUpdated: now
    };

    if (now >= data.translationResetTime) {
      updates.translationCount = 0;
      updates.translationResetTime = now + HOUR;
    }

    if (now >= data.dailyResetTime) {
      updates.dailyCount = 0;
      updates.dailyResetTime = now + DAY;
    }

    if (now >= data.monthlyResetTime) {
      updates.monthlyCount = 0;
      updates.monthlyResetTime = now + MONTH;
    }

    if (Object.keys(updates).length > 1) { 
      await db
        .update(userRateLimit)
        .set(updates)
        .where(eq(userRateLimit.userId, userId));

      return {
        ...data,
        ...updates
      };
    }

    return data;
  }

  static async getRemainingTranslations(userId: string): Promise<RateLimitResponse> {
    const db = await getDb();
    
    let data = await db
      .select()
      .from(userRateLimit)
      .where(eq(userRateLimit.userId, userId))
      .get();

    if (!data) {
      data = await this.initializeUserData(userId);
    } else {
      data = await this.cleanupExpiredData(userId) || data;
    }

    const now = Date.now();
    
    // Check limits and find the most restrictive one
    const hourlyRemaining = Math.max(0, RATE_LIMITS.TRANSLATIONS_PER_HOUR - data.translationCount);
    const dailyRemaining = Math.max(0, RATE_LIMITS.TRANSLATIONS_PER_DAY - data.dailyCount);
    const monthlyRemaining = Math.max(0, RATE_LIMITS.TRANSLATIONS_PER_MONTH - data.monthlyCount);
    
    const remaining = Math.min(hourlyRemaining, dailyRemaining, monthlyRemaining);
    
    if (remaining === 0) {
      const resetIn = Math.min(
        data.translationResetTime - now,
        data.dailyResetTime - now,
        data.monthlyResetTime - now
      );
      
      let message = 'Rate limit reached. ';
      if (resetIn <= HOUR) {
        message += `Resets in ${Math.ceil(resetIn / 60000)} minutes.`;
      } else if (resetIn <= DAY) {
        message += `Resets in ${Math.ceil(resetIn / HOUR)} hours.`;
      } else {
        message += `Resets in ${Math.ceil(resetIn / DAY)} days.`;
      }

      return {
        isLimited: true,
        remaining: 0,
        resetIn,
        message
      };
    }

    return {
      isLimited: false,
      remaining
    };
  }

  static async checkTranslationLimit(userId: string): Promise<RateLimitResponse> {
    const db = await getDb();
    
    const status = await this.getRemainingTranslations(userId);
    
    if (!status.isLimited) {
      await db
        .update(userRateLimit)
        .set({
          translationCount: sql`${userRateLimit.translationCount} + 1`,
          dailyCount: sql`${userRateLimit.dailyCount} + 1`,
          monthlyCount: sql`${userRateLimit.monthlyCount} + 1`,
          lastUpdated: Date.now()
        })
        .where(eq(userRateLimit.userId, userId));
    }

    return status;
  }
}