/**
 * Facebook Data Cache Service
 * Provides caching for frequently accessed Facebook API data
 */

import { 
  FacebookAdAccount, 
  FacebookCampaign, 
  FacebookInsights, 
  DateRange 
} from '@/types/facebook';

export interface CacheEntry<T> {
  data: T;
  timestamp: number;
  expiresAt: number;
  accessCount: number;
  lastAccessed: number;
}

export interface CacheOptions {
  ttl?: number; // Time to live in milliseconds
  maxSize?: number; // Maximum number of entries
  maxMemoryUsage?: number; // Maximum memory usage in bytes (approximate)
}

export interface CacheStats {
  size: number;
  hitRate: number;
  missRate: number;
  totalRequests: number;
  totalHits: number;
  totalMisses: number;
  memoryUsage: number; // Approximate memory usage in bytes
  oldestEntry?: number;
  newestEntry?: number;
}

export class FacebookDataCache {
  private cache = new Map<string, CacheEntry<any>>();
  private stats = {
    totalRequests: 0,
    totalHits: 0,
    totalMisses: 0,
  };
  
  private readonly defaultTTL = 5 * 60 * 1000; // 5 minutes
  private readonly maxSize = 1000; // Maximum cache entries
  private readonly maxMemoryUsage = 50 * 1024 * 1024; // 50MB
  private cleanupInterval: number | null = null;

  constructor(private options: CacheOptions = {}) {
    this.startCleanupInterval();
  }

  /**
   * Gets data from cache
   */
  get<T>(key: string): T | null {
    this.stats.totalRequests++;
    
    const entry = this.cache.get(key);
    if (!entry) {
      this.stats.totalMisses++;
      return null;
    }

    // Check if expired
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      this.stats.totalMisses++;
      return null;
    }

    // Update access statistics
    entry.accessCount++;
    entry.lastAccessed = Date.now();
    this.stats.totalHits++;

    return entry.data;
  }

  /**
   * Sets data in cache
   */
  set<T>(key: string, data: T, ttl?: number): void {
    const now = Date.now();
    const timeToLive = ttl || this.options.ttl || this.defaultTTL;
    
    const entry: CacheEntry<T> = {
      data,
      timestamp: now,
      expiresAt: now + timeToLive,
      accessCount: 0,
      lastAccessed: now,
    };

    // Check if we need to evict before adding
    if (this.shouldEvict()) {
      this.evictLeastRecentlyUsed();
    }

    this.cache.set(key, entry);
  }

  /**
   * Checks if key exists in cache and is not expired
   */
  has(key: string): boolean {
    const entry = this.cache.get(key);
    if (!entry) return false;
    
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return false;
    }
    
    return true;
  }

  /**
   * Removes entry from cache
   */
  delete(key: string): boolean {
    return this.cache.delete(key);
  }

  /**
   * Clears all cache entries
   */
  clear(): void {
    this.cache.clear();
    this.stats = {
      totalRequests: 0,
      totalHits: 0,
      totalMisses: 0,
    };
  }

  /**
   * Gets cache statistics
   */
  getStats(): CacheStats {
    const size = this.cache.size;
    const hitRate = this.stats.totalRequests > 0 
      ? (this.stats.totalHits / this.stats.totalRequests) * 100 
      : 0;
    const missRate = 100 - hitRate;

    let oldestEntry: number | undefined;
    let newestEntry: number | undefined;
    let memoryUsage = 0;

    for (const entry of this.cache.values()) {
      // Approximate memory usage calculation
      memoryUsage += this.estimateEntrySize(entry);
      
      if (!oldestEntry || entry.timestamp < oldestEntry) {
        oldestEntry = entry.timestamp;
      }
      if (!newestEntry || entry.timestamp > newestEntry) {
        newestEntry = entry.timestamp;
      }
    }

    return {
      size,
      hitRate: Math.round(hitRate * 100) / 100,
      missRate: Math.round(missRate * 100) / 100,
      totalRequests: this.stats.totalRequests,
      totalHits: this.stats.totalHits,
      totalMisses: this.stats.totalMisses,
      memoryUsage,
      oldestEntry,
      newestEntry,
    };
  }

  /**
   * Cache ad accounts with account-specific TTL
   */
  cacheAdAccounts(accounts: FacebookAdAccount[], ttl = 15 * 60 * 1000): void {
    this.set('ad_accounts', accounts, ttl);
  }

  /**
   * Get cached ad accounts
   */
  getCachedAdAccounts(): FacebookAdAccount[] | null {
    return this.get<FacebookAdAccount[]>('ad_accounts');
  }

  /**
   * Cache campaigns for specific account
   */
  cacheCampaigns(
    accountId: string, 
    campaigns: FacebookCampaign[], 
    dateRange?: DateRange,
    ttl = 10 * 60 * 1000
  ): void {
    const key = this.getCampaignsCacheKey(accountId, dateRange);
    this.set(key, campaigns, ttl);
  }

  /**
   * Get cached campaigns for specific account
   */
  getCachedCampaigns(accountId: string, dateRange?: DateRange): FacebookCampaign[] | null {
    const key = this.getCampaignsCacheKey(accountId, dateRange);
    return this.get<FacebookCampaign[]>(key);
  }

  /**
   * Cache insights data
   */
  cacheInsights(
    objectId: string,
    level: string,
    insights: FacebookInsights,
    dateRange?: DateRange,
    ttl = 5 * 60 * 1000
  ): void {
    const key = this.getInsightsCacheKey(objectId, level, dateRange);
    this.set(key, insights, ttl);
  }

  /**
   * Get cached insights data
   */
  getCachedInsights(
    objectId: string,
    level: string,
    dateRange?: DateRange
  ): FacebookInsights | null {
    const key = this.getInsightsCacheKey(objectId, level, dateRange);
    return this.get<FacebookInsights>(key);
  }

  /**
   * Cache paginated data with cursor information
   */
  cachePaginatedData<T>(
    baseKey: string,
    data: T[],
    cursor?: string,
    ttl = 5 * 60 * 1000
  ): void {
    const key = cursor ? `${baseKey}_page_${cursor}` : `${baseKey}_page_0`;
    this.set(key, data, ttl);
  }

  /**
   * Get cached paginated data
   */
  getCachedPaginatedData<T>(baseKey: string, cursor?: string): T[] | null {
    const key = cursor ? `${baseKey}_page_${cursor}` : `${baseKey}_page_0`;
    return this.get<T[]>(key);
  }

  /**
   * Invalidate cache entries by pattern
   */
  invalidateByPattern(pattern: string): number {
    let deletedCount = 0;
    const regex = new RegExp(pattern);
    
    for (const key of this.cache.keys()) {
      if (regex.test(key)) {
        this.cache.delete(key);
        deletedCount++;
      }
    }
    
    return deletedCount;
  }

  /**
   * Invalidate cache for specific account
   */
  invalidateAccount(accountId: string): number {
    return this.invalidateByPattern(`account_${accountId}`);
  }

  /**
   * Preload data into cache
   */
  preload<T>(key: string, dataLoader: () => Promise<T>, ttl?: number): Promise<T> {
    // Check if already cached
    const cached = this.get<T>(key);
    if (cached) {
      return Promise.resolve(cached);
    }

    // Load and cache data
    return dataLoader().then(data => {
      this.set(key, data, ttl);
      return data;
    });
  }

  /**
   * Batch get multiple keys
   */
  getBatch<T>(keys: string[]): Map<string, T | null> {
    const results = new Map<string, T | null>();
    
    for (const key of keys) {
      results.set(key, this.get<T>(key));
    }
    
    return results;
  }

  /**
   * Batch set multiple entries
   */
  setBatch<T>(entries: Array<{ key: string; data: T; ttl?: number }>): void {
    for (const entry of entries) {
      this.set(entry.key, entry.data, entry.ttl);
    }
  }

  /**
   * Generate cache key for campaigns
   */
  private getCampaignsCacheKey(accountId: string, dateRange?: DateRange): string {
    const dateKey = dateRange 
      ? `_${dateRange.since}_${dateRange.until}` 
      : '';
    return `account_${accountId}_campaigns${dateKey}`;
  }

  /**
   * Generate cache key for insights
   */
  private getInsightsCacheKey(
    objectId: string, 
    level: string, 
    dateRange?: DateRange
  ): string {
    const dateKey = dateRange 
      ? `_${dateRange.since}_${dateRange.until}` 
      : '';
    return `insights_${objectId}_${level}${dateKey}`;
  }

  /**
   * Estimate memory usage of cache entry
   */
  private estimateEntrySize(entry: CacheEntry<any>): number {
    try {
      // Rough estimation based on JSON string length
      const jsonString = JSON.stringify(entry);
      return jsonString.length * 2; // Approximate UTF-16 encoding
    } catch {
      return 1024; // Default estimate if serialization fails
    }
  }

  /**
   * Check if cache should evict entries
   */
  private shouldEvict(): boolean {
    const maxSize = this.options.maxSize || this.maxSize;
    
    // Check size limit first (more efficient)
    if (this.cache.size >= maxSize) {
      return true;
    }

    // Only check memory if we have a reasonable number of entries
    if (this.cache.size > 10) {
      const maxMemory = this.options.maxMemoryUsage || this.maxMemoryUsage;
      const stats = this.getStats();
      return stats.memoryUsage >= maxMemory;
    }

    return false;
  }

  /**
   * Evict least recently used entries
   */
  private evictLeastRecentlyUsed(): void {
    if (this.cache.size === 0) return;

    const entries = Array.from(this.cache.entries());
    
    // Sort by last accessed time (oldest first)
    entries.sort((a, b) => a[1].lastAccessed - b[1].lastAccessed);
    
    // Remove oldest 25% of entries, but at least 1
    const removeCount = Math.max(1, Math.ceil(entries.length * 0.25));
    
    for (let i = 0; i < removeCount && i < entries.length; i++) {
      this.cache.delete(entries[i][0]);
    }
  }

  /**
   * Clean up expired entries
   */
  private cleanupExpired(): void {
    const now = Date.now();
    const expiredKeys: string[] = [];
    
    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.expiresAt) {
        expiredKeys.push(key);
      }
    }
    
    for (const key of expiredKeys) {
      this.cache.delete(key);
    }
  }

  /**
   * Start periodic cleanup
   */
  private startCleanupInterval(): void {
    // Clean up expired entries every 2 minutes
    this.cleanupInterval = window.setInterval(() => {
      this.cleanupExpired();
    }, 2 * 60 * 1000);
  }

  /**
   * Stop periodic cleanup
   */
  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
    this.clear();
  }
}

/**
 * Singleton instance for global use
 */
let facebookDataCacheInstance: FacebookDataCache | null = null;

export function getFacebookDataCache(): FacebookDataCache {
  if (!facebookDataCacheInstance) {
    facebookDataCacheInstance = new FacebookDataCache({
      ttl: 5 * 60 * 1000, // 5 minutes default
      maxSize: 1000,
      maxMemoryUsage: 50 * 1024 * 1024, // 50MB
    });
  }
  return facebookDataCacheInstance;
}

/**
 * Create a new cache instance with custom options
 */
export function createFacebookDataCache(options: CacheOptions = {}): FacebookDataCache {
  return new FacebookDataCache(options);
}