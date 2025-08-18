/**
 * Tests for Facebook Rate Limiter
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { 
  FacebookRateLimiter,
  RateLimitType,
  WindowType,
  getFacebookRateLimiter,
  resetFacebookRateLimiter
} from '../facebook-rate-limiter';
import { FACEBOOK_ERROR_CODES } from '../facebook-constants';

// Mock the error handler
vi.mock('../facebook-error-handler', () => ({
  getFacebookErrorHandler: () => ({
    handleError: vi.fn().mockResolvedValue({})
  })
}));

describe('FacebookRateLimiter', () => {
  let rateLimiter: FacebookRateLimiter;

  beforeEach(() => {
    resetFacebookRateLimiter();
    rateLimiter = new FacebookRateLimiter();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllTimers();
  });

  describe('initialization', () => {
    it('should initialize with default configurations', () => {
      const status = rateLimiter.getRateLimitStatus(RateLimitType.APP_LEVEL);
      expect(status.total).toBe(200); // Default app-level limit
      expect(status.remaining).toBe(200);
    });

    it('should allow updating configurations', () => {
      rateLimiter.updateConfig(RateLimitType.APP_LEVEL, {
        maxRequests: 100,
        windowMs: 1800000 // 30 minutes
      });

      const status = rateLimiter.getRateLimitStatus(RateLimitType.APP_LEVEL);
      expect(status.total).toBe(100);
    });
  });

  describe('rate limiting', () => {
    it('should allow requests within limits', () => {
      expect(rateLimiter.canMakeRequest(RateLimitType.APP_LEVEL)).toBe(true);
      
      rateLimiter.recordRequest(RateLimitType.APP_LEVEL);
      expect(rateLimiter.canMakeRequest(RateLimitType.APP_LEVEL)).toBe(true);
    });

    it('should block requests when limit is exceeded', () => {
      // Set a very low limit for testing
      rateLimiter.updateConfig(RateLimitType.APP_LEVEL, {
        maxRequests: 2,
        windowMs: 60000 // 1 minute
      });

      // Make requests up to the limit
      expect(rateLimiter.canMakeRequest(RateLimitType.APP_LEVEL)).toBe(true);
      rateLimiter.recordRequest(RateLimitType.APP_LEVEL);

      expect(rateLimiter.canMakeRequest(RateLimitType.APP_LEVEL)).toBe(true);
      rateLimiter.recordRequest(RateLimitType.APP_LEVEL);

      // Should be blocked now
      expect(rateLimiter.canMakeRequest(RateLimitType.APP_LEVEL)).toBe(false);
    });

    it('should track different rate limit types separately', () => {
      rateLimiter.updateConfig(RateLimitType.APP_LEVEL, { maxRequests: 1, windowMs: 60000 });
      rateLimiter.updateConfig(RateLimitType.USER_LEVEL, { maxRequests: 2, windowMs: 60000 });

      // Exhaust app-level limit
      rateLimiter.recordRequest(RateLimitType.APP_LEVEL);
      expect(rateLimiter.canMakeRequest(RateLimitType.APP_LEVEL)).toBe(false);

      // User-level should still be available
      expect(rateLimiter.canMakeRequest(RateLimitType.USER_LEVEL)).toBe(true);
    });

    it('should track different identifiers separately', () => {
      rateLimiter.updateConfig(RateLimitType.AD_ACCOUNT_LEVEL, { maxRequests: 1, windowMs: 60000 });

      // Exhaust limit for account1
      rateLimiter.recordRequest(RateLimitType.AD_ACCOUNT_LEVEL, 'account1');
      expect(rateLimiter.canMakeRequest(RateLimitType.AD_ACCOUNT_LEVEL, 'account1')).toBe(false);

      // account2 should still be available
      expect(rateLimiter.canMakeRequest(RateLimitType.AD_ACCOUNT_LEVEL, 'account2')).toBe(true);
    });
  });

  describe('rate limit status', () => {
    it('should return correct status information', () => {
      rateLimiter.updateConfig(RateLimitType.APP_LEVEL, { maxRequests: 10, windowMs: 60000 });

      // Initial status
      let status = rateLimiter.getRateLimitStatus(RateLimitType.APP_LEVEL);
      expect(status.remaining).toBe(10);
      expect(status.total).toBe(10);
      expect(status.percentage).toBe(0);
      expect(status.retryAfter).toBe(0);

      // After making some requests
      rateLimiter.recordRequest(RateLimitType.APP_LEVEL);
      rateLimiter.recordRequest(RateLimitType.APP_LEVEL);
      rateLimiter.recordRequest(RateLimitType.APP_LEVEL);

      status = rateLimiter.getRateLimitStatus(RateLimitType.APP_LEVEL);
      expect(status.remaining).toBe(7);
      expect(status.percentage).toBe(30);
    });

    it('should calculate retry after when limit is exceeded', () => {
      rateLimiter.updateConfig(RateLimitType.APP_LEVEL, { maxRequests: 1, windowMs: 60000 });

      rateLimiter.recordRequest(RateLimitType.APP_LEVEL);
      const status = rateLimiter.getRateLimitStatus(RateLimitType.APP_LEVEL);
      
      expect(status.remaining).toBe(0);
      expect(status.retryAfter).toBeGreaterThan(0);
    });
  });

  describe('request queuing', () => {
    it('should queue requests when rate limited', async () => {
      rateLimiter.updateConfig(RateLimitType.APP_LEVEL, { maxRequests: 1, windowMs: 60000 });

      // First request should execute immediately
      const mockExecute1 = vi.fn().mockResolvedValue('result1');
      const result1 = await rateLimiter.queueRequest(RateLimitType.APP_LEVEL, mockExecute1);
      expect(result1).toBe('result1');
      expect(mockExecute1).toHaveBeenCalledTimes(1);

      // Second request should be queued
      const mockExecute2 = vi.fn().mockResolvedValue('result2');
      const promise2 = rateLimiter.queueRequest(RateLimitType.APP_LEVEL, mockExecute2);

      // Should not execute immediately
      expect(mockExecute2).not.toHaveBeenCalled();

      // Check queue status
      const queueStatus = rateLimiter.getQueueStatus();
      expect(queueStatus.size).toBe(1);
      expect(queueStatus.isProcessing).toBe(false);

      // Wait for queue processing (mocked)
      await new Promise(resolve => setTimeout(resolve, 100));
    });

    it('should respect priority in queue', async () => {
      rateLimiter.updateConfig(RateLimitType.APP_LEVEL, { maxRequests: 0, windowMs: 60000 });

      const results: string[] = [];
      const mockExecute1 = vi.fn().mockImplementation(async () => {
        results.push('low-priority');
        return 'low-priority';
      });
      const mockExecute2 = vi.fn().mockImplementation(async () => {
        results.push('high-priority');
        return 'high-priority';
      });

      // Queue low priority first
      rateLimiter.queueRequest(RateLimitType.APP_LEVEL, mockExecute1, 1);
      // Queue high priority second
      rateLimiter.queueRequest(RateLimitType.APP_LEVEL, mockExecute2, 10);

      const queueStatus = rateLimiter.getQueueStatus();
      expect(queueStatus.size).toBe(2);
    });

    it('should reject requests when queue is full', async () => {
      const smallQueueLimiter = new FacebookRateLimiter(2); // Max 2 items in queue
      smallQueueLimiter.updateConfig(RateLimitType.APP_LEVEL, { maxRequests: 0, windowMs: 60000 });

      // Fill the queue
      const mockExecute = vi.fn().mockResolvedValue('result');
      smallQueueLimiter.queueRequest(RateLimitType.APP_LEVEL, mockExecute);
      smallQueueLimiter.queueRequest(RateLimitType.APP_LEVEL, mockExecute);

      // Third request should be rejected
      await expect(
        smallQueueLimiter.queueRequest(RateLimitType.APP_LEVEL, mockExecute)
      ).rejects.toThrow('Request queue is full');
    });
  });

  describe('quota usage tracking', () => {
    it('should parse and store quota usage from headers', () => {
      const headers = new Headers();
      headers.set('x-app-usage', JSON.stringify({
        call_count: 25,
        total_cputime: 15,
        total_time: 30
      }));

      rateLimiter.updateQuotaUsage(headers, RateLimitType.APP_LEVEL);
      const usage = rateLimiter.getQuotaUsage(RateLimitType.APP_LEVEL);

      expect(usage).toEqual({
        callCount: 25,
        totalCpuTime: 15,
        totalTime: 30,
        type: 'app_usage'
      });
    });

    it('should parse business use case usage headers', () => {
      const headers = new Headers();
      headers.set('x-business-use-case-usage', JSON.stringify({
        'business_id_123': {
          call_count: 50,
          total_cputime: 25,
          total_time: 60,
          estimated_time_to_regain_access: 300
        }
      }));

      rateLimiter.updateQuotaUsage(headers, RateLimitType.USER_LEVEL);
      const usage = rateLimiter.getQuotaUsage(RateLimitType.USER_LEVEL);

      expect(usage).toEqual({
        callCount: 50,
        totalCpuTime: 25,
        totalTime: 60,
        type: 'business_use_case',
        estimatedTimeToRegainAccess: 300
      });
    });

    it('should handle malformed usage headers gracefully', () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      
      const headers = new Headers();
      headers.set('x-app-usage', 'invalid-json');

      rateLimiter.updateQuotaUsage(headers, RateLimitType.APP_LEVEL);
      const usage = rateLimiter.getQuotaUsage(RateLimitType.APP_LEVEL);

      expect(usage).toBeNull();
      expect(consoleSpy).toHaveBeenCalledWith(
        'Failed to parse Facebook usage headers:',
        expect.any(Error)
      );

      consoleSpy.mockRestore();
    });
  });

  describe('rate limit error handling', () => {
    it('should handle rate limit exceeded errors', async () => {
      const error = {
        code: FACEBOOK_ERROR_CODES.RATE_LIMIT_EXCEEDED,
        message: 'Rate limit exceeded, retry after 300 seconds'
      };

      await rateLimiter.handleRateLimitError(error, RateLimitType.APP_LEVEL);

      // Should mark as rate limited
      expect(rateLimiter.canMakeRequest(RateLimitType.APP_LEVEL)).toBe(false);
    });

    it('should extract retry-after from error messages', async () => {
      const error = {
        code: FACEBOOK_ERROR_CODES.RATE_LIMIT_EXCEEDED,
        message: 'Rate limit exceeded, retry after 120 seconds'
      };

      await rateLimiter.handleRateLimitError(error, RateLimitType.APP_LEVEL);
      
      // The rate limiter should respect the retry-after value
      const status = rateLimiter.getRateLimitStatus(RateLimitType.APP_LEVEL);
      expect(status.retryAfter).toBeGreaterThan(0);
    });
  });

  describe('token bucket algorithm', () => {
    it('should allow burst requests up to burst limit', () => {
      rateLimiter.updateConfig(RateLimitType.APP_LEVEL, {
        maxRequests: 100,
        windowMs: 60000,
        burstLimit: 5
      });

      // Should allow burst requests
      for (let i = 0; i < 5; i++) {
        expect(rateLimiter.canMakeRequest(RateLimitType.APP_LEVEL)).toBe(true);
        rateLimiter.recordRequest(RateLimitType.APP_LEVEL);
      }

      // Should block after burst limit
      expect(rateLimiter.canMakeRequest(RateLimitType.APP_LEVEL)).toBe(false);
    });

    it('should refill tokens over time', async () => {
      vi.useFakeTimers();
      
      rateLimiter.updateConfig(RateLimitType.APP_LEVEL, {
        maxRequests: 100,
        windowMs: 60000,
        burstLimit: 2
      });

      // Exhaust burst limit
      rateLimiter.recordRequest(RateLimitType.APP_LEVEL);
      rateLimiter.recordRequest(RateLimitType.APP_LEVEL);
      expect(rateLimiter.canMakeRequest(RateLimitType.APP_LEVEL)).toBe(false);

      // Advance time to allow token refill
      vi.advanceTimersByTime(30000); // 30 seconds

      // Should have some tokens available now
      expect(rateLimiter.canMakeRequest(RateLimitType.APP_LEVEL)).toBe(true);

      vi.useRealTimers();
    });
  });

  describe('comprehensive status', () => {
    it('should return comprehensive status information', () => {
      rateLimiter.recordRequest(RateLimitType.APP_LEVEL);
      rateLimiter.recordRequest(RateLimitType.USER_LEVEL);

      const headers = new Headers();
      headers.set('x-app-usage', JSON.stringify({
        call_count: 10,
        total_cputime: 5,
        total_time: 15
      }));
      rateLimiter.updateQuotaUsage(headers, RateLimitType.APP_LEVEL);

      const status = rateLimiter.getStatus();

      expect(status.rateLimits).toHaveProperty(RateLimitType.APP_LEVEL);
      expect(status.rateLimits).toHaveProperty(RateLimitType.USER_LEVEL);
      expect(status.quotas).toHaveProperty(`${RateLimitType.APP_LEVEL}:default`);
      expect(status.queue).toHaveProperty('size');
      expect(status.queue).toHaveProperty('maxSize');
    });
  });

  describe('reset functionality', () => {
    it('should reset all rate limiting data', () => {
      // Make some requests and set up state
      rateLimiter.recordRequest(RateLimitType.APP_LEVEL);
      rateLimiter.recordRequest(RateLimitType.USER_LEVEL);

      const headers = new Headers();
      headers.set('x-app-usage', JSON.stringify({ call_count: 10 }));
      rateLimiter.updateQuotaUsage(headers, RateLimitType.APP_LEVEL);

      // Reset
      rateLimiter.reset();

      // Check that everything is cleared
      const status = rateLimiter.getRateLimitStatus(RateLimitType.APP_LEVEL);
      expect(status.remaining).toBe(status.total);

      const usage = rateLimiter.getQuotaUsage(RateLimitType.APP_LEVEL);
      expect(usage).toBeNull();

      const queueStatus = rateLimiter.getQueueStatus();
      expect(queueStatus.size).toBe(0);
    });
  });

  describe('singleton functionality', () => {
    it('should return the same instance', () => {
      const instance1 = getFacebookRateLimiter();
      const instance2 = getFacebookRateLimiter();
      expect(instance1).toBe(instance2);
    });

    it('should reset singleton instance', () => {
      const instance1 = getFacebookRateLimiter();
      resetFacebookRateLimiter();
      const instance2 = getFacebookRateLimiter();
      expect(instance1).not.toBe(instance2);
    });
  });

  describe('edge cases', () => {
    it('should handle requests for unknown rate limit types', () => {
      // Should not throw and should allow request
      expect(rateLimiter.canMakeRequest('unknown_type' as RateLimitType)).toBe(true);
      
      const status = rateLimiter.getRateLimitStatus('unknown_type' as RateLimitType);
      expect(status.remaining).toBe(Infinity);
    });

    it('should handle empty headers gracefully', () => {
      const headers = new Headers();
      rateLimiter.updateQuotaUsage(headers, RateLimitType.APP_LEVEL);
      
      const usage = rateLimiter.getQuotaUsage(RateLimitType.APP_LEVEL);
      expect(usage).toBeNull();
    });

    it('should handle queue processing errors gracefully', async () => {
      rateLimiter.updateConfig(RateLimitType.APP_LEVEL, { maxRequests: 0, windowMs: 60000 });

      const mockExecute = vi.fn().mockRejectedValue(new Error('Execution failed'));
      
      await expect(
        rateLimiter.queueRequest(RateLimitType.APP_LEVEL, mockExecute)
      ).rejects.toThrow('Execution failed');
    });

    it('should expire old queued requests', async () => {
      vi.useFakeTimers();
      
      rateLimiter.updateConfig(RateLimitType.APP_LEVEL, { maxRequests: 0, windowMs: 60000 });

      const mockExecute = vi.fn().mockResolvedValue('result');
      const promise = rateLimiter.queueRequest(RateLimitType.APP_LEVEL, mockExecute);

      // Advance time beyond expiration (5 minutes)
      vi.advanceTimersByTime(300001);

      await expect(promise).rejects.toThrow('Request timeout - expired in queue');

      vi.useRealTimers();
    });
  });
});