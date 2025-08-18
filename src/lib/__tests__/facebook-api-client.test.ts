// Facebook API Client Unit Tests

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { FacebookAPIClient, getFacebookAPIClient, resetFacebookAPIClient } from '../facebook-api-client';
import { FACEBOOK_ERROR_CODES, HTTP_CONFIG } from '../facebook-constants';
import * as facebookConfig from '@/config/facebook';

// Mock the config module
vi.mock('@/config/facebook', () => ({
  getFacebookConfig: vi.fn(() => ({
    FACEBOOK_APP_ID: 'test-app-id',
    FACEBOOK_API_VERSION: 'v19.0',
    FACEBOOK_REDIRECT_URI: 'http://localhost:3000/auth/callback',
    FACEBOOK_SCOPES: ['ads_read', 'ads_management'],
  })),
}));

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch;

// Mock AbortSignal.timeout
global.AbortSignal.timeout = vi.fn(() => ({
  aborted: false,
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
  dispatchEvent: vi.fn(),
}));

describe('FacebookAPIClient', () => {
  let client: FacebookAPIClient;

  beforeEach(() => {
    client = new FacebookAPIClient();
    mockFetch.mockClear();
    vi.clearAllTimers();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    resetFacebookAPIClient();
  });

  describe('constructor', () => {
    it('should create client with default API version', () => {
      const defaultClient = new FacebookAPIClient();
      expect(defaultClient).toBeInstanceOf(FacebookAPIClient);
    });

    it('should create client with custom API version', () => {
      const customClient = new FacebookAPIClient('v18.0');
      expect(customClient).toBeInstanceOf(FacebookAPIClient);
    });
  });

  describe('authentication', () => {
    it('should set and get access token', () => {
      const token = 'test-access-token';
      client.setAccessToken(token);
      
      expect(client.getAccessToken()).toBe(token);
      expect(client.isAuthenticated()).toBe(true);
    });

    it('should clear access token', () => {
      client.setAccessToken('test-token');
      client.clearAccessToken();
      
      expect(client.getAccessToken()).toBeNull();
      expect(client.isAuthenticated()).toBe(false);
    });

    it('should return false for isAuthenticated when no token', () => {
      expect(client.isAuthenticated()).toBe(false);
    });
  });

  describe('HTTP requests', () => {
    beforeEach(() => {
      client.setAccessToken('test-token');
    });

    it('should make successful GET request', async () => {
      const mockResponse = {
        data: { id: '123', name: 'Test Campaign' },
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      const result = await client.get('/campaigns', { fields: 'id,name' });

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/v19.0/campaigns?fields=id%2Cname'),
        expect.objectContaining({
          method: 'GET',
          headers: expect.objectContaining({
            'Authorization': 'Bearer test-token',
            'Content-Type': 'application/json',
          }),
        })
      );

      expect(result).toEqual(mockResponse);
    });

    it('should make successful POST request', async () => {
      const mockResponse = { data: { success: true } };
      const requestBody = { name: 'New Campaign' };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      const result = await client.post('/campaigns', requestBody);

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/v19.0/campaigns'),
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify(requestBody),
          headers: expect.objectContaining({
            'Authorization': 'Bearer test-token',
          }),
        })
      );

      expect(result).toEqual(mockResponse);
    });

    it('should handle API errors correctly', async () => {
      const errorResponse = {
        error: {
          message: 'Invalid access token',
          type: 'OAuthException',
          code: FACEBOOK_ERROR_CODES.INVALID_ACCESS_TOKEN,
          fbtrace_id: 'test-trace-id',
        },
      };

      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: () => Promise.resolve(errorResponse),
      });

      await expect(client.get('/me')).rejects.toThrow('Invalid access token');
    });

    it('should handle HTTP errors correctly', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
        json: () => Promise.resolve({}),
      });

      const promise = client.get('/me');
      await vi.runAllTimersAsync();
      
      await expect(promise).rejects.toThrow('HTTP 500: Internal Server Error');
    }, 15000);
  });

  describe('retry logic', () => {
    beforeEach(() => {
      client.setAccessToken('test-token');
    });

    it('should retry on retryable errors', async () => {
      const errorResponse = {
        error: {
          message: 'Rate limit exceeded',
          code: FACEBOOK_ERROR_CODES.RATE_LIMIT_EXCEEDED,
        },
      };

      const successResponse = {
        data: { id: '123' },
      };

      // First call fails, second succeeds
      mockFetch
        .mockResolvedValueOnce({
          ok: false,
          status: 429,
          json: () => Promise.resolve(errorResponse),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(successResponse),
        });

      // Fast forward timers to skip retry delays
      const promise = client.get('/me');
      await vi.runAllTimersAsync();
      const result = await promise;

      expect(mockFetch).toHaveBeenCalledTimes(2);
      expect(result).toEqual(successResponse);
    }, 10000);

    it('should not retry on non-retryable errors', async () => {
      const errorResponse = {
        error: {
          message: 'Invalid access token',
          code: FACEBOOK_ERROR_CODES.INVALID_ACCESS_TOKEN,
        },
      };

      mockFetch.mockResolvedValue({
        ok: false,
        status: 401,
        json: () => Promise.resolve(errorResponse),
      });

      await expect(client.get('/me')).rejects.toThrow('Invalid access token');
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });

    it('should respect maximum retry attempts', async () => {
      const errorResponse = {
        error: {
          message: 'Temporarily unavailable',
          code: FACEBOOK_ERROR_CODES.TEMPORARILY_UNAVAILABLE,
        },
      };

      mockFetch.mockResolvedValue({
        ok: false,
        status: 503,
        json: () => Promise.resolve(errorResponse),
      });

      const promise = client.get('/me');
      await vi.runAllTimersAsync();
      
      await expect(promise).rejects.toThrow('Temporarily unavailable');
      expect(mockFetch).toHaveBeenCalledTimes(HTTP_CONFIG.MAX_RETRIES + 1);
    }, 10000);
  });

  describe('rate limiting', () => {
    beforeEach(() => {
      client.setAccessToken('test-token');
    });

    it('should track rate limiter status', () => {
      const status = client.getRateLimiterStatus();
      expect(status).toHaveProperty('canMakeRequest');
      expect(status).toHaveProperty('retryAfter');
      expect(typeof status.canMakeRequest).toBe('boolean');
      expect(typeof status.retryAfter).toBe('number');
    });

    it('should reset rate limiter', () => {
      client.resetRateLimiter();
      const status = client.getRateLimiterStatus();
      expect(status.canMakeRequest).toBe(true);
      expect(status.retryAfter).toBe(0);
    });
  });

  describe('circuit breaker', () => {
    beforeEach(() => {
      client.setAccessToken('test-token');
    });

    it('should track circuit breaker status', () => {
      const status = client.getCircuitBreakerStatus();
      expect(status).toHaveProperty('state');
      expect(status).toHaveProperty('canExecute');
      expect(typeof status.canExecute).toBe('boolean');
      expect(['CLOSED', 'OPEN', 'HALF_OPEN']).toContain(status.state);
    });

    it('should reset circuit breaker', () => {
      client.resetCircuitBreaker();
      const status = client.getCircuitBreakerStatus();
      expect(status.canExecute).toBe(true);
      expect(status.state).toBe('CLOSED');
    });

    it('should open circuit breaker after multiple failures', async () => {
      const errorResponse = {
        error: {
          message: 'Server error',
          code: 500,
        },
      };

      mockFetch.mockResolvedValue({
        ok: false,
        status: 500,
        json: () => Promise.resolve(errorResponse),
      });

      // Make multiple failing requests to trigger circuit breaker
      const promises = [];
      for (let i = 0; i < HTTP_CONFIG.CIRCUIT_BREAKER_THRESHOLD; i++) {
        promises.push(
          client.get('/me').catch(() => {
            // Expected to fail
          })
        );
      }

      await vi.runAllTimersAsync();
      await Promise.all(promises);

      // Circuit breaker should now be open
      await expect(client.get('/me')).rejects.toThrow('Circuit breaker is open');
    }, 15000);
  });

  describe('batch requests', () => {
    beforeEach(() => {
      client.setAccessToken('test-token');
    });

    it('should make batch requests', async () => {
      const batchRequests = [
        { method: 'GET', relative_url: 'me' },
        { method: 'GET', relative_url: 'me/adaccounts' },
      ];

      const mockResponse = {
        data: [
          { code: 200, body: '{"id":"123"}' },
          { code: 200, body: '{"data":[]}' },
        ],
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      const result = await client.batch(batchRequests);

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/v19.0/'),
        expect.objectContaining({
          method: 'POST',
          body: expect.stringContaining('"batch"'),
        })
      );

      expect(result).toEqual(mockResponse);
    });

    it('should reject batch requests exceeding size limit', async () => {
      const largeBatch = Array(60).fill({ method: 'GET', relative_url: 'me' });

      await expect(client.batch(largeBatch)).rejects.toThrow('Batch size cannot exceed');
    });
  });

  describe('health check', () => {
    it('should return false when not authenticated', async () => {
      const result = await client.healthCheck();
      expect(result).toBe(false);
    });

    it('should return true when authenticated and API responds', async () => {
      client.setAccessToken('test-token');

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ data: { id: '123' } }),
      });

      const result = await client.healthCheck();
      expect(result).toBe(true);
    });

    it('should return false when API request fails', async () => {
      client.setAccessToken('test-token');

      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      const result = await client.healthCheck();
      expect(result).toBe(false);
    });
  });

  describe('URL building', () => {
    beforeEach(() => {
      client.setAccessToken('test-token');
    });

    it('should build correct URLs with parameters', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ data: {} }),
      });

      await client.get('/campaigns', { 
        fields: 'id,name',
        limit: 25,
        status: ['ACTIVE', 'PAUSED']
      });

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringMatching(/\/v19\.0\/campaigns\?.*fields=id%2Cname.*limit=25.*status=ACTIVE%2CPAUSED/),
        expect.any(Object)
      );
    });

    it('should handle endpoints with leading slash', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ data: {} }),
      });

      await client.get('/me');

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/v19.0/me'),
        expect.any(Object)
      );
    });

    it('should handle endpoints without leading slash', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ data: {} }),
      });

      await client.get('me');

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/v19.0/me'),
        expect.any(Object)
      );
    });
  });
});

describe('getFacebookAPIClient', () => {
  afterEach(() => {
    resetFacebookAPIClient();
  });

  it('should return singleton instance', () => {
    const client1 = getFacebookAPIClient();
    const client2 = getFacebookAPIClient();
    
    expect(client1).toBe(client2);
    expect(client1).toBeInstanceOf(FacebookAPIClient);
  });

  it('should use configuration from getFacebookConfig', () => {
    const mockConfig = {
      FACEBOOK_APP_ID: 'test-app-id',
      FACEBOOK_API_VERSION: 'v18.0',
      FACEBOOK_REDIRECT_URI: 'http://test.com/callback',
      FACEBOOK_SCOPES: ['ads_read'],
    };

    vi.mocked(facebookConfig.getFacebookConfig).mockReturnValue(mockConfig);

    const client = getFacebookAPIClient();
    expect(client).toBeInstanceOf(FacebookAPIClient);
  });
});

describe('resetFacebookAPIClient', () => {
  it('should reset singleton instance', () => {
    const client1 = getFacebookAPIClient();
    resetFacebookAPIClient();
    const client2 = getFacebookAPIClient();
    
    expect(client1).not.toBe(client2);
  });
});