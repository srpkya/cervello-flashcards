interface RateLimitData {
    count: number;
    resetTime: number;
  }
  
  const ipLimits = new Map<string, RateLimitData>();
  const MAX_REQUESTS_PER_WINDOW = 100;
  const WINDOW_SIZE_IN_SECONDS = 3600; 
  
  export class RateLimiter {
    static clean() {
      const now = Date.now();
      for (const [ip, data] of ipLimits.entries()) {
        if (now > data.resetTime) {
          ipLimits.delete(ip);
        }
      }
    }
  
    static isRateLimited(ip: string): boolean {
      this.clean();
      const now = Date.now();
      const limit = ipLimits.get(ip);
  
      if (!limit) {
        ipLimits.set(ip, {
          count: 1,
          resetTime: now + (WINDOW_SIZE_IN_SECONDS * 1000)
        });
        return false;
      }
  
      if (now > limit.resetTime) {
        ipLimits.set(ip, {
          count: 1,
          resetTime: now + (WINDOW_SIZE_IN_SECONDS * 1000)
        });
        return false;
      }
  
      if (limit.count >= MAX_REQUESTS_PER_WINDOW) {
        return true;
      }
  
      limit.count += 1;
      return false;
    }
  
    static getRemainingRequests(ip: string): number {
      const limit = ipLimits.get(ip);
      if (!limit) return MAX_REQUESTS_PER_WINDOW;
      return Math.max(0, MAX_REQUESTS_PER_WINDOW - limit.count);
    }
  
    static getResetTime(ip: string): number | null {
      const limit = ipLimits.get(ip);
      if (!limit) return null;
      return limit.resetTime;
    }
  }