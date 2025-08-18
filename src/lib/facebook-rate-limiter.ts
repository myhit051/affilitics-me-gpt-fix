/**
 * Advanced Facebook API Rate Limiting and Quota Management
 * Implements sophisticated rate limiting with quota tracking, request queuing, and graceful degradation
 */

import { RATE_LIMITING, FACEBOOK_ERROR_CODES } from './facebook-constants';
import { getFacebookErrorHandler } from './facebook-error-handler';

// Rate limit types
export enum RateLimitType {
  APP_LEVEL = 'app_level',
  USER_LEVEL = 'user_level',
  AD_ACCOUNT_LEVEL = 'ad_account_level',
  PAGE_LEVEL = 'page_level'
}

// Rate limit window types
export enum WindowType {
  SLIDING = 'sliding',
  FIXED = 'fixed'
}

// Rate limit configuration
export interface RateLimitConfig {
  maxRequests: number;
  windowMs: number;
  windowType: WindowType;
  burstLimit?: number;
  queueSize?: number;
}

// Rate limit status
export interface RateLimitStatus {
  remaining: number;
  total: number;
  resetTime: number;
  retryAfter: number;
  percentage: number;
}

// Quota usage information
export interface QuotaUsage {
  callCount: number;
  totalCpuTime: number;
  totalTime: number;
  type: string;
  estimatedTimeToRegainAccess?: number;
}

// Request queue item
interface QueuedRequest {
  id: string;
  timestamp: number;
  priority: number;
  resolve: (value: any) => void;
  reject: (error: any) => void;
  execute: () => Promise<any>;
}

// Rate limit bucket for token bucket algorithm
interface RateLimitBucket {
  tokens: number;
  lastRefill: number;
  capacity: number;
  refillRate: number;
}

// Advanced rate limiter with multiple algorithms
export class FacebookRateLimiter {
  private buckets = new Map<string, RateLimitBucket>();
  private requestHistory = new Map<string, number[]>();
  private quotaUsage = new Map<string, QuotaUsage>();
  private requestQueue: QueuedRequest[] = [];
  private isProcessingQueue = false;
  private readonly configs = new Map<RateLimitType, RateLimitConfig>();
  private readonly maxQueueSize: number;
  private readonly errorHandler = getFacebookErrorHandler();

  constructor(maxQueueSize = 1000) {
    this.maxQueueSize = maxQueueSize;
    this.initializeConfigs();
    this.startQueueProcessor();
  }

  /**
   * Initialize default rate limit configurations
   */
  private initializeConfigs(): void {
    // App-level rate limits (most restrictive)
    this.configs.set(RateLimitType.APP_LEVEL, {
      maxRequests: 200,
      windowMs: 3600000, // 1 hour
      windowType: WindowType.SLIDING,
      burstLimit: 50,
      queueSize: 100
    });

    // User-level rate limits
    this.configs.set(RateLimitType.USER_LEVEL, {
      maxRequests: 600,
      windowMs: 3600000, // 1 hour
      windowType: WindowType.SLIDING,
      burstLimit: 100,
      queueSize: 200
    });

    // Ad account level rate limits
    this.configs.set(RateLimitType.AD_ACCOUNT_LEVEL, {
      maxRequests: 1000,
      windowMs: 3600000, // 1 hour
      windowType: WindowType.SLIDING,
      burstLimit: 200,
      queueSize: 300
    });

    // Page-level rate limits
    this.configs.set(RateLimitType.PAGE_LEVEL, {
      maxRequests: 4800,
      windowMs: 3600000, // 1 hour
      windowType: WindowType.SLIDING,
      burstLimit: 400,
      queueSize: 500
    });
  }

  /**
   * Update rate limit configuration
   */
  updateConfig(type: RateLimitType, config: Partial<RateLimitConfig>): void {
    const currentConfig = this.configs.get(type);
    if (currentConfig) {
      this.configs.set(type, { ...currentConfig, ...config });
    }
  }

  /**
   * Check if a request can be made immediately
   */
  canMakeRequest(type: RateLimitType, identifier = 'default'): boolean {
    const key = `${type}:${identifier}`;
    const config = this.configs.get(type);
    
    if (!config) {
      return true;
    }

    // Check token bucket (for burst control)
    if (config.burstLimit && !this.checkTokenBucket(key, config)) {
      return false;
    }

    // Check sliding window
    if (config.windowType === WindowType.SLIDING) {
      return this.checkSlidingWindow(key, config);
    }

    // Check fixed window
    return this.checkFixedWindow(key, config);
  }

  /**
   * Record a request for rate limiting
   */
  recordRequest(type: RateLimitType, identifier = 'default'): void {
    const key = `${type}:${identifier}`;
    const config = this.configs.get(type);
    
    if (!config) {
      return;
    }

    // Update token bucket
    if (config.burstLimit) {
      this.consumeToken(key, config);
    }

    // Record in history
    const history = this.requestHistory.get(key) || [];
    history.push(Date.now());
    this.requestHistory.set(key, history);

    // Clean up old entries
    this.cleanupHistory(key, config);
  }

  /**
   * Get rate limit status
   */
  getRateLimitStatus(type: RateLimitType, identifier = 'default'): RateLimitStatus {
    const key = `${type}:${identifier}`;
    const config = this.configs.get(type);
    
    if (!config) {
      return {
        remaining: Infinity,
        total: Infinity,
        resetTime: 0,
        retryAfter: 0,
        percentage: 0
      };
    }

    const history = this.requestHistory.get(key) || [];
    const now = Date.now();
    const windowStart = now - config.windowMs;
    const recentRequests = history.filter(timestamp => timestamp > windowStart);
    
    const remaining = Math.max(0, config.maxRequests - recentRequests.length);
    const resetTime = recentRequests.length > 0 ? 
      Math.min(...recentRequests) + config.windowMs : now;
    
    const retryAfter = remaining === 0 ? 
      Math.ceil((resetTime - now) / 1000) : 0;
    
    const percentage = (recentRequests.length / config.maxRequests) * 100;

    return {
      remaining,
      total: config.maxRequests,
      resetTime,
      retryAfter,
      percentage
    };
  }

  /**
   * Queue a request for later execution
   */
  async queueRequest<T>(
    type: RateLimitType,
    execute: () => Promise<T>,
    priority = 0,
    identifier = 'default'
  ): Promise<T> {
    // Check if we can execute immediately
    if (this.canMakeRequest(type, identifier)) {
      this.recordRequest(type, identifier);
      return execute();
    }

    // Check queue size
    if (this.requestQueue.length >= this.maxQueueSize) {
      throw new Error('Request queue is full. Please try again later.');
    }

    // Create queued request
    return new Promise<T>((resolve, reject) => {
      const queuedRequest: QueuedRequest = {
        id: this.generateRequestId(),
        timestamp: Date.now(),
        priority,
        resolve,
        reject,
        execute: async () => {
          this.recordRequest(type, identifier);
          return execute();
        }
      };

      // Insert in priority order
      this.insertInQueue(queuedRequest);
    });
  }

  /**
   * Update quota usage from Facebook API response headers
   */
  updateQuotaUsage(headers: Headers, type: RateLimitType, identifier = 'default'): void {
    const key = `${type}:${identifier}`;
    
    // Parse Facebook's usage headers
    const usage = this.parseUsageHeaders(headers);
    if (usage) {
      this.quotaUsage.set(key, usage);
      
      // Log quota warnings
      if (usage.callCount > 0) {
        const percentage = (usage.callCount / 100) * 100; // Assuming 100 is the limit
        
        if (percentage > 80) {
          console.warn(`High quota usage detected: ${percentage}% for ${key}`);
        }
      }
    }
  }

  /**
   * Get quota usage information
   */
  getQuotaUsage(type: RateLimitType, identifier = 'default'): QuotaUsage | null {
    const key = `${type}:${identifier}`;
    return this.quotaUsage.get(key) || null;
  }

  /**
   * Handle rate limit exceeded error
   */
  async handleRateLimitError(error: any, type: RateLimitType, identifier = 'default'): Promise<void> {
    const key = `${type}:${identifier}`;
    
    // Extract retry-after from error
    let retryAfter = RATE_LIMITING.RETRY_AFTER_DEFAULT;
    
    if (error.code === FACEBOOK_ERROR_CODES.RATE_LIMIT_EXCEEDED) {
      // Facebook usually provides retry-after in the error
      retryAfter = this.extractRetryAfter(error) || retryAfter;
    }

    // Log the rate limit error
    await this.errorHandler.handleError(error, {
      operation: 'rate_limit_handling',
      endpoint: key,
      timestamp: new Date()
    });

    // Update internal state to reflect rate limit
    this.markRateLimited(key, retryAfter);
  }

  /**
   * Get queue status
   */
  getQueueStatus(): {
    size: number;
    maxSize: number;
    isProcessing: boolean;
    oldestRequest?: number;
  } {
    return {
      size: this.requestQueue.length,
      maxSize: this.maxQueueSize,
      isProcessing: this.isProcessingQueue,
      oldestRequest: this.requestQueue.length > 0 ? 
        Math.min(...this.requestQueue.map(r => r.timestamp)) : undefined
    };
  }

  /**
   * Clear all rate limiting data
   */
  reset(): void {
    this.buckets.clear();
    this.requestHistory.clear();
    this.quotaUsage.clear();
    this.requestQueue.forEach(req => req.reject(new Error('Rate limiter reset')));
    this.requestQueue = [];
  }

  /**
   * Get comprehensive status
   */
  getStatus(): {
    rateLimits: Record<string, RateLimitStatus>;
    quotas: Record<string, QuotaUsage>;
    queue: ReturnType<typeof this.getQueueStatus>;
  } {
    const rateLimits: Record<string, RateLimitStatus> = {};
    const quotas: Record<string, QuotaUsage> = {};

    // Get all rate limit statuses
    for (const [type] of this.configs) {
      const status = this.getRateLimitStatus(type);
      rateLimits[type] = status;
    }

    // Get all quota usages
    for (const [key, usage] of this.quotaUsage) {
      quotas[key] = usage;
    }

    return {
      rateLimits,
      quotas,
      queue: this.getQueueStatus()
    };
  }

  // Private helper methods

  private checkTokenBucket(key: string, config: RateLimitConfig): boolean {
    if (!config.burstLimit) return true;

    const bucket = this.getOrCreateBucket(key, config);
    this.refillBucket(bucket, config);
    
    return bucket.tokens >= 1;
  }

  private consumeToken(key: string, config: RateLimitConfig): void {
    if (!config.burstLimit) return;

    const bucket = this.getOrCreateBucket(key, config);
    this.refillBucket(bucket, config);
    
    if (bucket.tokens >= 1) {
      bucket.tokens -= 1;
    }
  }

  private getOrCreateBucket(key: string, config: RateLimitConfig): RateLimitBucket {
    if (!this.buckets.has(key)) {
      this.buckets.set(key, {
        tokens: config.burstLimit || config.maxRequests,
        lastRefill: Date.now(),
        capacity: config.burstLimit || config.maxRequests,
        refillRate: (config.burstLimit || config.maxRequests) / (config.windowMs / 1000)
      });
    }
    
    return this.buckets.get(key)!;
  }

  private refillBucket(bucket: RateLimitBucket, config: RateLimitConfig): void {
    const now = Date.now();
    const timePassed = (now - bucket.lastRefill) / 1000;
    const tokensToAdd = timePassed * bucket.refillRate;
    
    bucket.tokens = Math.min(bucket.capacity, bucket.tokens + tokensToAdd);
    bucket.lastRefill = now;
  }

  private checkSlidingWindow(key: string, config: RateLimitConfig): boolean {
    const history = this.requestHistory.get(key) || [];
    const now = Date.now();
    const windowStart = now - config.windowMs;
    const recentRequests = history.filter(timestamp => timestamp > windowStart);
    
    return recentRequests.length < config.maxRequests;
  }

  private checkFixedWindow(key: string, config: RateLimitConfig): boolean {
    const history = this.requestHistory.get(key) || [];
    const now = Date.now();
    const windowStart = Math.floor(now / config.windowMs) * config.windowMs;
    const windowRequests = history.filter(timestamp => timestamp >= windowStart);
    
    return windowRequests.length < config.maxRequests;
  }

  private cleanupHistory(key: string, config: RateLimitConfig): void {
    const history = this.requestHistory.get(key) || [];
    const now = Date.now();
    const cutoff = now - config.windowMs;
    const cleanHistory = history.filter(timestamp => timestamp > cutoff);
    
    this.requestHistory.set(key, cleanHistory);
  }

  private parseUsageHeaders(headers: Headers): QuotaUsage | null {
    try {
      // Handle case where headers might be undefined or not a Headers object
      if (!headers || typeof headers.get !== 'function') {
        return null;
      }

      const usage = headers.get('x-business-use-case-usage');
      const appUsage = headers.get('x-app-usage');
      const adAccountUsage = headers.get('x-ad-account-usage');
      
      if (usage) {
        const parsed = JSON.parse(usage);
        const firstKey = Object.keys(parsed)[0];
        if (firstKey && parsed[firstKey]) {
          return {
            callCount: parsed[firstKey].call_count || 0,
            totalCpuTime: parsed[firstKey].total_cputime || 0,
            totalTime: parsed[firstKey].total_time || 0,
            type: 'business_use_case',
            estimatedTimeToRegainAccess: parsed[firstKey].estimated_time_to_regain_access
          };
        }
      }
      
      if (appUsage) {
        const parsed = JSON.parse(appUsage);
        return {
          callCount: parsed.call_count || 0,
          totalCpuTime: parsed.total_cputime || 0,
          totalTime: parsed.total_time || 0,
          type: 'app_usage'
        };
      }
      
      if (adAccountUsage) {
        const parsed = JSON.parse(adAccountUsage);
        return {
          callCount: parsed.call_count || 0,
          totalCpuTime: parsed.total_cputime || 0,
          totalTime: parsed.total_time || 0,
          type: 'ad_account_usage'
        };
      }
      
      return null;
    } catch (error) {
      console.warn('Failed to parse Facebook usage headers:', error);
      return null;
    }
  }

  private extractRetryAfter(error: any): number | null {
    // Try to extract retry-after from error message or headers
    if (error.message && error.message.includes('retry after')) {
      const match = error.message.match(/retry after (\d+)/i);
      if (match) {
        return parseInt(match[1], 10);
      }
    }
    
    return null;
  }

  private markRateLimited(key: string, retryAfter: number): void {
    // Clear tokens to prevent immediate requests
    const bucket = this.buckets.get(key);
    if (bucket) {
      bucket.tokens = 0;
      bucket.lastRefill = Date.now() + (retryAfter * 1000);
    }

    // Also add entries to request history to block sliding window checks
    const history = this.requestHistory.get(key) || [];
    const now = Date.now();
    
    // Find the config for this key to get the rate limit
    const [typeStr] = key.split(':');
    const type = typeStr as RateLimitType;
    const config = this.configs.get(type);
    
    if (config) {
      // Fill the history to the max to block requests
      const fakeRequests = Array(config.maxRequests).fill(now);
      this.requestHistory.set(key, fakeRequests);
    }
  }

  private generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private insertInQueue(request: QueuedRequest): void {
    // Insert in priority order (higher priority first)
    let insertIndex = this.requestQueue.length;
    
    for (let i = 0; i < this.requestQueue.length; i++) {
      if (this.requestQueue[i].priority < request.priority) {
        insertIndex = i;
        break;
      }
    }
    
    this.requestQueue.splice(insertIndex, 0, request);
  }

  private startQueueProcessor(): void {
    setInterval(() => {
      this.processQueue();
    }, 1000); // Process queue every second
  }

  private async processQueue(): Promise<void> {
    if (this.isProcessingQueue || this.requestQueue.length === 0) {
      return;
    }

    this.isProcessingQueue = true;

    try {
      const processedRequests: string[] = [];
      
      for (let i = 0; i < this.requestQueue.length; i++) {
        const request = this.requestQueue[i];
        
        // Check if request has expired (older than 5 minutes)
        if (Date.now() - request.timestamp > 300000) {
          request.reject(new Error('Request timeout - expired in queue'));
          processedRequests.push(request.id);
          continue;
        }

        try {
          const result = await request.execute();
          request.resolve(result);
          processedRequests.push(request.id);
        } catch (error) {
          request.reject(error);
          processedRequests.push(request.id);
        }

        // Process only a few requests per cycle to avoid blocking
        if (processedRequests.length >= 5) {
          break;
        }
      }

      // Remove processed requests
      this.requestQueue = this.requestQueue.filter(
        req => !processedRequests.includes(req.id)
      );

    } finally {
      this.isProcessingQueue = false;
    }
  }
}

// Singleton instance
let rateLimiterInstance: FacebookRateLimiter | null = null;

/**
 * Get the singleton Facebook rate limiter instance
 */
export function getFacebookRateLimiter(): FacebookRateLimiter {
  if (!rateLimiterInstance) {
    rateLimiterInstance = new FacebookRateLimiter();
  }
  return rateLimiterInstance;
}

/**
 * Reset the singleton instance (useful for testing)
 */
export function resetFacebookRateLimiter(): void {
  if (rateLimiterInstance) {
    rateLimiterInstance.reset();
  }
  rateLimiterInstance = null;
}