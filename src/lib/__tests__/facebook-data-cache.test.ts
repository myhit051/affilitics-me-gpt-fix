/**
 * Facebook Data Cache Tests
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { FacebookDataCache, createFacebookDataCache } from '../facebook-data-cache';
import { FacebookAdAccount, FacebookCampaign } from '@/types/facebook';

// Mock setTimeout and clearInterval
vi.useFakeTimers();

describe('FacebookDataCache', () => {
  let cache: FacebookDataCache;

  beforeEach(() => {
    cache = createFacebookDataCache({
      ttl: 5000, // 5 seconds for testing
      maxSize: 10,
      maxMemoryUsage: 1024 * 1024, // 1MB
    });
  });

  afterEach(() => {
    cache.destroy();
    vi.clearAllTimers();
  });

  describe('basic cache operations', () => {
    it('should store and retrieve data', () => {
      const testData = { id: '1', name: 'Test Account' };
      
      cache.set('test-key', testData);
      const retrieved = cache.get('test-key');
      
      expect(retrieved).toEqual(testData);
    });

    it('should return null for non-existent keys', () => {
      const result = cache.get('non-existent');
      expect(result).toBeNull();
    });

    it('should check if key exists', () => {
      cache.set('test-key', 'test-value');
      
      expect(cache.has('test-key')).toBe(true);
      expect(cache.has('non-existent')).toBe(false);
    });

    it('should delete entries', () => {
      cache.set('test-key', 'test-value');
      expect(cache.has('test-key')).toBe(true);
      
      const deleted = cache.delete('test-key');
      expect(deleted).toBe(true);
      expect(cache.has('test-key')).toBe(false);
    });

    it('should clear all entries', () => {
      cache.set('key1', 'value1');
      cache.set('key2', 'value2');
      
      cache.clear();
      
      expect(cache.has('key1')).toBe(false);
      expect(cache.has('key2')).toBe(false);
    });
  });

  describe('TTL and expiration', () => {
    it('should expire entries after TTL', () => {
      cache.set('test-key', 'test-value', 1000); // 1 second TTL
      
      expect(cache.has('test-key')).toBe(true);
      
      // Fast forward time
      vi.advanceTimersByTime(1001);
      
      expect(cache.has('test-key')).toBe(false);
      expect(cache.get('test-key')).toBeNull();
    });

    it('should use custom TTL when provided', () => {
      cache.set('short-ttl', 'value', 500);
      cache.set('long-ttl', 'value', 2000);
      
      vi.advanceTimersByTime(600);
      
      expect(cache.has('short-ttl')).toBe(false);
      expect(cache.has('long-ttl')).toBe(true);
    });

    it('should clean up expired entries automatically', () => {
      cache.set('key1', 'value1', 1000);
      cache.set('key2', 'value2', 3000);
      
      // Fast forward to trigger cleanup
      vi.advanceTimersByTime(2 * 60 * 1000 + 1); // 2 minutes + 1ms
      
      expect(cache.has('key1')).toBe(false);
      expect(cache.has('key2')).toBe(true);
    });
  });

  describe('cache statistics', () => {
    it('should track hit and miss rates', () => {
      cache.set('key1', 'value1');
      
      // Generate hits and misses
      cache.get('key1'); // hit
      cache.get('key1'); // hit
      cache.get('non-existent'); // miss
      cache.get('also-non-existent'); // miss
      
      const stats = cache.getStats();
      
      expect(stats.totalRequests).toBe(4);
      expect(stats.totalHits).toBe(2);
      expect(stats.totalMisses).toBe(2);
      expect(stats.hitRate).toBe(50);
      expect(stats.missRate).toBe(50);
    });

    it('should track cache size', () => {
      cache.set('key1', 'value1');
      cache.set('key2', 'value2');
      
      const stats = cache.getStats();
      expect(stats.size).toBe(2);
    });

    it('should estimate memory usage', () => {
      cache.set('key1', { large: 'data'.repeat(100) });
      
      const stats = cache.getStats();
      expect(stats.memoryUsage).toBeGreaterThan(0);
    });
  });

  describe('Facebook-specific caching', () => {
    it('should cache and retrieve ad accounts', () => {
      const accounts: FacebookAdAccount[] = [
        {
          id: '1',
          name: 'Test Account',
          currency: 'USD',
          timezone: 'UTC',
          accountStatus: 'ACTIVE',
        },
      ];
      
      cache.cacheAdAccounts(accounts);
      const retrieved = cache.getCachedAdAccounts();
      
      expect(retrieved).toEqual(accounts);
    });

    it('should cache campaigns with date range', () => {
      const campaigns: FacebookCampaign[] = [
        {
          id: '1',
          name: 'Test Campaign',
          status: 'ACTIVE',
          objective: 'CONVERSIONS',
          created_time: '2023-01-01',
          updated_time: '2023-01-02',
          account_id: 'act_123',
        },
      ];
      
      const dateRange = { since: '2023-01-01', until: '2023-01-31' };
      
      cache.cacheCampaigns('act_123', campaigns, dateRange);
      const retrieved = cache.getCachedCampaigns('act_123', dateRange);
      
      expect(retrieved).toEqual(campaigns);
    });

    it('should handle different date ranges separately', () => {
      const campaigns1: FacebookCampaign[] = [{ 
        id: '1', 
        name: 'Campaign 1',
        status: 'ACTIVE',
        objective: 'CONVERSIONS',
        created_time: '2023-01-01',
        updated_time: '2023-01-02',
        account_id: 'act_123',
      }];
      
      const campaigns2: FacebookCampaign[] = [{ 
        id: '2', 
        name: 'Campaign 2',
        status: 'ACTIVE',
        objective: 'CONVERSIONS',
        created_time: '2023-02-01',
        updated_time: '2023-02-02',
        account_id: 'act_123',
      }];
      
      const dateRange1 = { since: '2023-01-01', until: '2023-01-31' };
      const dateRange2 = { since: '2023-02-01', until: '2023-02-28' };
      
      cache.cacheCampaigns('act_123', campaigns1, dateRange1);
      cache.cacheCampaigns('act_123', campaigns2, dateRange2);
      
      expect(cache.getCachedCampaigns('act_123', dateRange1)).toEqual(campaigns1);
      expect(cache.getCachedCampaigns('act_123', dateRange2)).toEqual(campaigns2);
    });
  });

  describe('cache invalidation', () => {
    it('should invalidate entries by pattern', () => {
      cache.set('account_123_campaigns', 'data1');
      cache.set('account_123_insights', 'data2');
      cache.set('account_456_campaigns', 'data3');
      
      const deletedCount = cache.invalidateByPattern('account_123');
      
      expect(deletedCount).toBe(2);
      expect(cache.has('account_123_campaigns')).toBe(false);
      expect(cache.has('account_123_insights')).toBe(false);
      expect(cache.has('account_456_campaigns')).toBe(true);
    });

    it('should invalidate account-specific data', () => {
      cache.set('account_123_campaigns', 'data1');
      cache.set('account_123_insights', 'data2');
      cache.set('account_456_campaigns', 'data3');
      
      const deletedCount = cache.invalidateAccount('123');
      
      expect(deletedCount).toBe(2);
      expect(cache.has('account_456_campaigns')).toBe(true);
    });
  });

  describe('batch operations', () => {
    it('should get multiple keys at once', () => {
      cache.set('key1', 'value1');
      cache.set('key2', 'value2');
      cache.set('key3', 'value3');
      
      const results = cache.getBatch(['key1', 'key2', 'non-existent']);
      
      expect(results.get('key1')).toBe('value1');
      expect(results.get('key2')).toBe('value2');
      expect(results.get('non-existent')).toBeNull();
    });

    it('should set multiple entries at once', () => {
      const entries = [
        { key: 'key1', data: 'value1' },
        { key: 'key2', data: 'value2', ttl: 1000 },
      ];
      
      cache.setBatch(entries);
      
      expect(cache.get('key1')).toBe('value1');
      expect(cache.get('key2')).toBe('value2');
    });
  });

  describe('memory management', () => {
    it('should evict entries when max size is reached', () => {
      const smallCache = createFacebookDataCache({ maxSize: 3 });
      
      // Fill cache to capacity
      smallCache.set('key1', 'value1');
      smallCache.set('key2', 'value2');
      smallCache.set('key3', 'value3');
      
      // Access key1 to make it more recently used
      smallCache.get('key1');
      
      // Add another entry, should trigger eviction
      smallCache.set('key4', 'value4');
      
      // key2 should be evicted (least recently used)
      expect(smallCache.has('key1')).toBe(true);
      expect(smallCache.has('key3')).toBe(true);
      expect(smallCache.has('key4')).toBe(true);
      
      smallCache.destroy();
    });
  });

  describe('preloading', () => {
    it('should preload data using loader function', async () => {
      const loader = vi.fn().mockResolvedValue('loaded-data');
      
      const result = await cache.preload('test-key', loader);
      
      expect(result).toBe('loaded-data');
      expect(loader).toHaveBeenCalledOnce();
      expect(cache.get('test-key')).toBe('loaded-data');
    });

    it('should return cached data without calling loader', async () => {
      cache.set('test-key', 'cached-data');
      const loader = vi.fn().mockResolvedValue('loaded-data');
      
      const result = await cache.preload('test-key', loader);
      
      expect(result).toBe('cached-data');
      expect(loader).not.toHaveBeenCalled();
    });
  });

  describe('paginated data caching', () => {
    it('should cache paginated data with cursors', () => {
      const pageData = [{ id: '1', name: 'Item 1' }];
      
      cache.cachePaginatedData('campaigns', pageData, 'cursor123');
      const retrieved = cache.getCachedPaginatedData('campaigns', 'cursor123');
      
      expect(retrieved).toEqual(pageData);
    });

    it('should handle first page without cursor', () => {
      const pageData = [{ id: '1', name: 'Item 1' }];
      
      cache.cachePaginatedData('campaigns', pageData);
      const retrieved = cache.getCachedPaginatedData('campaigns');
      
      expect(retrieved).toEqual(pageData);
    });
  });

  describe('performance', () => {
    it('should handle large datasets efficiently', () => {
      const startTime = performance.now();
      
      // Add many entries
      for (let i = 0; i < 1000; i++) {
        cache.set(`key${i}`, `value${i}`);
      }
      
      // Retrieve many entries
      for (let i = 0; i < 1000; i++) {
        cache.get(`key${i}`);
      }
      
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      // Should complete within reasonable time (adjust threshold as needed)
      expect(duration).toBeLessThan(100); // 100ms
    });

    it('should maintain good performance with frequent access', () => {
      // Pre-populate cache
      for (let i = 0; i < 100; i++) {
        cache.set(`key${i}`, `value${i}`);
      }
      
      const startTime = performance.now();
      
      // Simulate frequent random access
      for (let i = 0; i < 1000; i++) {
        const randomKey = `key${Math.floor(Math.random() * 100)}`;
        cache.get(randomKey);
      }
      
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      expect(duration).toBeLessThan(50); // 50ms
    });
  });
});