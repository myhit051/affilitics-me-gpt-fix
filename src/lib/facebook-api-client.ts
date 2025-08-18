// Facebook Marketing API Client
// Core HTTP client with authentication, rate limiting, retry logic, and circuit breaker pattern

import { 
  FACEBOOK_GRAPH_API_BASE_URL, 
  API_VERSIONS, 
  RATE_LIMITING, 
  HTTP_CONFIG,
  REQUEST_CONFIG,
  FACEBOOK_ERROR_CODES 
} from './facebook-constants';
import { FacebookAPIError, APIError } from '@/types/facebook';
import { getFacebookConfig } from '@/config/facebook';
import { getFacebookRateLimiter, RateLimitType } from './facebook-rate-limiter';

// Request configuration interface
export interface APIRequestConfig {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  headers?: Record<string, string>;
  params?: Record<string, any>;
  body?: any;
  timeout?: number;
  retries?: number;
}

// Response interface
export interface APIResponse<T = any> {
  data: T;
  paging?: {
    cursors?: {
      before?: string;
      after?: string;
    };
    next?: string;
    previous?: string;
  };
  error?: FacebookAPIError;
}

// Rate limiter interface
interface RateLimiter {
  canMakeRequest(): boolean;
  recordRequest(): void;
  getRetryAfter(): number;
  reset(): void;
}

// Circuit breaker states
enum CircuitBreakerState {
  CLOSED = 'CLOSED',
  OPEN = 'OPEN',
  HALF_OPEN = 'HALF_OPEN'
}

// Circuit breaker interface
interface CircuitBreaker {
  canExecute(): boolean;
  recordSuccess(): void;
  recordFailure(): void;
  getState(): CircuitBreakerState;
  reset(): void;
}

// Simple rate limiter implementation
class SimpleRateLimiter implements RateLimiter {
  private requests: number[] = [];
  private readonly maxRequests: number;
  private readonly windowMs: number;

  constructor(maxRequests = RATE_LIMITING.DEFAULT_REQUESTS_PER_HOUR, windowMs = 3600000) {
    this.maxRequests = maxRequests;
    this.windowMs = windowMs;
  }

  canMakeRequest(): boolean {
    this.cleanupOldRequests();
    return this.requests.length < this.maxRequests;
  }

  recordRequest(): void {
    this.requests.push(Date.now());
  }

  getRetryAfter(): number {
    if (this.requests.length === 0) return 0;
    
    const oldestRequest = Math.min(...this.requests);
    const retryAfter = Math.max(0, this.windowMs - (Date.now() - oldestRequest));
    return Math.ceil(retryAfter / 1000); // Convert to seconds
  }

  reset(): void {
    this.requests = [];
  }

  private cleanupOldRequests(): void {
    const now = Date.now();
    this.requests = this.requests.filter(timestamp => now - timestamp < this.windowMs);
  }
}

// Simple circuit breaker implementation
class SimpleCircuitBreaker implements CircuitBreaker {
  private state: CircuitBreakerState = CircuitBreakerState.CLOSED;
  private failureCount = 0;
  private lastFailureTime = 0;
  private readonly threshold: number;
  private readonly timeout: number;

  constructor(threshold = HTTP_CONFIG.CIRCUIT_BREAKER_THRESHOLD, timeout = HTTP_CONFIG.CIRCUIT_BREAKER_TIMEOUT) {
    this.threshold = threshold;
    this.timeout = timeout;
  }

  canExecute(): boolean {
    if (this.state === CircuitBreakerState.CLOSED) {
      return true;
    }

    if (this.state === CircuitBreakerState.OPEN) {
      if (Date.now() - this.lastFailureTime >= this.timeout) {
        this.state = CircuitBreakerState.HALF_OPEN;
        return true;
      }
      return false;
    }

    // HALF_OPEN state - allow one request to test
    return true;
  }

  recordSuccess(): void {
    this.failureCount = 0;
    this.state = CircuitBreakerState.CLOSED;
  }

  recordFailure(): void {
    this.failureCount++;
    this.lastFailureTime = Date.now();

    if (this.failureCount >= this.threshold) {
      this.state = CircuitBreakerState.OPEN;
    }
  }

  getState(): CircuitBreakerState {
    return this.state;
  }

  reset(): void {
    this.failureCount = 0;
    this.lastFailureTime = 0;
    this.state = CircuitBreakerState.CLOSED;
  }
}

// Main Facebook API Client class
export class FacebookAPIClient {
  private readonly baseUrl: string;
  private readonly apiVersion: string;
  private accessToken: string | null = null;
  private rateLimiter: RateLimiter;
  private circuitBreaker: CircuitBreaker;
  private advancedRateLimiter = getFacebookRateLimiter();

  constructor(apiVersion = API_VERSIONS.CURRENT) {
    this.baseUrl = FACEBOOK_GRAPH_API_BASE_URL;
    this.apiVersion = apiVersion;
    this.rateLimiter = new SimpleRateLimiter();
    this.circuitBreaker = new SimpleCircuitBreaker();
  }

  // Set access token for authenticated requests
  setAccessToken(token: string): void {
    this.accessToken = token;
  }

  // Get access token
  getAccessToken(): string | null {
    return this.accessToken;
  }

  // Clear access token
  clearAccessToken(): void {
    this.accessToken = null;
  }

  // Check if client is authenticated
  isAuthenticated(): boolean {
    return !!this.accessToken;
  }

  // Build full URL for API endpoint
  private buildUrl(endpoint: string): string {
    const cleanEndpoint = endpoint.startsWith('/') ? endpoint.slice(1) : endpoint;
    return `${this.baseUrl}/${this.apiVersion}/${cleanEndpoint}`;
  }

  // Build query string from parameters
  private buildQueryString(params: Record<string, any>): string {
    const searchParams = new URLSearchParams();
    
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        if (Array.isArray(value)) {
          searchParams.append(key, value.join(','));
        } else {
          searchParams.append(key, String(value));
        }
      }
    });

    return searchParams.toString();
  }

  // Create request headers
  private createHeaders(customHeaders: Record<string, string> = {}): Record<string, string> {
    const headers = {
      ...REQUEST_CONFIG.DEFAULT_HEADERS,
      ...customHeaders,
    };

    console.log('Facebook API Client - Creating headers...');
    console.log('Facebook API Client - Has access token:', !!this.accessToken);
    if (this.accessToken) {
      console.log('Facebook API Client - Access token length:', this.accessToken.length);
      console.log('Facebook API Client - Access token preview:', this.accessToken.substring(0, 20) + '...');
      headers['Authorization'] = `Bearer ${this.accessToken}`;
    } else {
      console.warn('Facebook API Client - No access token available!');
    }

    console.log('Facebook API Client - Final headers:', Object.keys(headers));
    return headers;
  }

  // Handle API errors
  private handleAPIError(response: Response, data: any): never {
    const error = data?.error;
    
    if (error) {
      const apiError = new Error(error.message) as APIError;
      apiError.name = 'FacebookAPIError';
      apiError.type = 'api_error';
      apiError.code = error.code;
      apiError.subcode = error.error_subcode;
      apiError.fbtrace_id = error.fbtrace_id;
      
      throw apiError;
    }

    // Generic HTTP error
    const httpError = new Error(`HTTP ${response.status}: ${response.statusText}`) as APIError;
    httpError.name = 'HTTPError';
    httpError.type = 'api_error';
    httpError.code = response.status;
    
    throw httpError;
  }

  // Check if error is retryable
  private isRetryableError(error: any): boolean {
    // Check Facebook API error codes
    if (error.type === 'api_error' && error.code) {
      // Don't retry authentication errors
      if ([
        FACEBOOK_ERROR_CODES.INVALID_ACCESS_TOKEN,
        FACEBOOK_ERROR_CODES.ACCESS_TOKEN_EXPIRED,
        FACEBOOK_ERROR_CODES.INSUFFICIENT_PERMISSIONS
      ].includes(error.code)) {
        return false;
      }

      // Retry rate limiting and temporary errors
      if ([
        FACEBOOK_ERROR_CODES.RATE_LIMIT_EXCEEDED,
        FACEBOOK_ERROR_CODES.USER_REQUEST_LIMIT_REACHED,
        FACEBOOK_ERROR_CODES.TEMPORARILY_UNAVAILABLE
      ].includes(error.code)) {
        return true;
      }
    }

    // Retry HTTP 5xx errors and 429 (rate limit)
    if (error.type === 'api_error' && HTTP_CONFIG.RETRY_STATUS_CODES.includes(error.code)) {
      return true;
    }

    return false;
  }

  // Check if error is a rate limiting error
  private isRateLimitError(error: any): boolean {
    if (error.type === 'api_error' && error.code) {
      return [
        FACEBOOK_ERROR_CODES.RATE_LIMIT_EXCEEDED,
        FACEBOOK_ERROR_CODES.USER_REQUEST_LIMIT_REACHED
      ].includes(error.code);
    }
    
    return error.type === 'api_error' && error.code === 429;
  }

  // Calculate retry delay with exponential backoff
  private calculateRetryDelay(attempt: number): number {
    const baseDelay = HTTP_CONFIG.RETRY_TIMEOUT;
    const exponentialDelay = baseDelay * Math.pow(2, attempt - 1);
    const jitter = Math.random() * 1000; // Add jitter to prevent thundering herd
    
    return Math.min(exponentialDelay + jitter, 30000); // Cap at 30 seconds
  }

  // Sleep utility for delays
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Make HTTP request with retry logic and advanced rate limiting
  private async makeRequest<T>(
    endpoint: string,
    config: APIRequestConfig = {},
    rateLimitType: RateLimitType = RateLimitType.APP_LEVEL,
    rateLimitIdentifier = 'default'
  ): Promise<APIResponse<T>> {
    const {
      method = 'GET',
      headers = {},
      params = {},
      body,
      timeout = HTTP_CONFIG.DEFAULT_TIMEOUT,
      retries = HTTP_CONFIG.MAX_RETRIES
    } = config;

    // Check circuit breaker
    if (!this.circuitBreaker.canExecute()) {
      throw new Error('Circuit breaker is open - too many failures');
    }

    // Use advanced rate limiter with queuing
    return this.advancedRateLimiter.queueRequest(
      rateLimitType,
      async () => {
        let lastError: Error;
        
        for (let attempt = 1; attempt <= retries + 1; attempt++) {
          try {
            // Build URL
            let url = this.buildUrl(endpoint);
            console.log('Facebook API Client - Making request to:', url);
            
            // Add query parameters for GET requests
            if (method === 'GET' && Object.keys(params).length > 0) {
              const queryString = this.buildQueryString(params);
              url += `?${queryString}`;
              console.log('Facebook API Client - Full URL with params:', url);
            }

            // Create request options
            const requestOptions: RequestInit = {
              method,
              headers: this.createHeaders(headers),
            };

            // Add timeout if AbortSignal.timeout is available
            if (typeof AbortSignal !== 'undefined' && AbortSignal.timeout) {
              requestOptions.signal = AbortSignal.timeout(timeout);
            }

            // Add body for non-GET requests
            if (method !== 'GET' && body) {
              if (typeof body === 'object') {
                requestOptions.body = JSON.stringify(body);
              } else {
                requestOptions.body = body;
              }
            }

            // Make the request
            console.log('Facebook API Client - Making fetch request...');
            console.log('Facebook API Client - Request options:', {
              method,
              headers: Object.keys(requestOptions.headers || {}),
              hasBody: !!requestOptions.body
            });
            
            const response = await fetch(url, requestOptions);
            console.log('Facebook API Client - Response status:', response.status);
            console.log('Facebook API Client - Response headers:', Object.fromEntries(response.headers.entries()));
            
            const data = await response.json();
            console.log('Facebook API Client - Response data:', data);

            // Update quota usage from response headers
            this.advancedRateLimiter.updateQuotaUsage(response.headers, rateLimitType, rateLimitIdentifier);

            // Handle successful response
            if (response.ok) {
              this.circuitBreaker.recordSuccess();
              console.log('Facebook API Client - Request successful');
              return data as APIResponse<T>;
            }

            // Handle API errors
            console.log('Facebook API Client - API error, handling...');
            this.handleAPIError(response, data);

          } catch (error: any) {
            lastError = error;

            // Record failure for circuit breaker
            this.circuitBreaker.recordFailure();

            // Handle rate limiting errors
            if (this.isRateLimitError(error)) {
              await this.advancedRateLimiter.handleRateLimitError(error, rateLimitType, rateLimitIdentifier);
            }

            // Don't retry if it's the last attempt or error is not retryable
            if (attempt > retries || !this.isRetryableError(error)) {
              break;
            }

            // Calculate and wait for retry delay
            const delay = this.calculateRetryDelay(attempt);
            await this.sleep(delay);
          }
        }

        throw lastError!;
      },
      0, // Default priority
      rateLimitIdentifier
    );
  }

  // Public method to make GET requests
  async get<T>(
    endpoint: string, 
    params?: Record<string, any>, 
    config?: Omit<APIRequestConfig, 'method' | 'params'>,
    rateLimitType: RateLimitType = RateLimitType.APP_LEVEL,
    rateLimitIdentifier = 'default'
  ): Promise<APIResponse<T>> {
    return this.makeRequest<T>(endpoint, {
      ...config,
      method: 'GET',
      params,
    }, rateLimitType, rateLimitIdentifier);
  }

  // Public method to make POST requests
  async post<T>(
    endpoint: string, 
    body?: any, 
    config?: Omit<APIRequestConfig, 'method' | 'body'>,
    rateLimitType: RateLimitType = RateLimitType.APP_LEVEL,
    rateLimitIdentifier = 'default'
  ): Promise<APIResponse<T>> {
    return this.makeRequest<T>(endpoint, {
      ...config,
      method: 'POST',
      body,
    }, rateLimitType, rateLimitIdentifier);
  }

  // Public method to make PUT requests
  async put<T>(
    endpoint: string, 
    body?: any, 
    config?: Omit<APIRequestConfig, 'method' | 'body'>,
    rateLimitType: RateLimitType = RateLimitType.APP_LEVEL,
    rateLimitIdentifier = 'default'
  ): Promise<APIResponse<T>> {
    return this.makeRequest<T>(endpoint, {
      ...config,
      method: 'PUT',
      body,
    }, rateLimitType, rateLimitIdentifier);
  }

  // Public method to make DELETE requests
  async delete<T>(
    endpoint: string, 
    config?: Omit<APIRequestConfig, 'method'>,
    rateLimitType: RateLimitType = RateLimitType.APP_LEVEL,
    rateLimitIdentifier = 'default'
  ): Promise<APIResponse<T>> {
    return this.makeRequest<T>(endpoint, {
      ...config,
      method: 'DELETE',
    }, rateLimitType, rateLimitIdentifier);
  }

  // Batch request functionality
  async batch<T>(requests: Array<{
    method: string;
    relative_url: string;
    body?: any;
  }>): Promise<APIResponse<T[]>> {
    if (requests.length > RATE_LIMITING.BATCH_SIZE_LIMIT) {
      throw new Error(`Batch size cannot exceed ${RATE_LIMITING.BATCH_SIZE_LIMIT} requests`);
    }

    const batchData = {
      batch: JSON.stringify(requests),
    };

    return this.post<T[]>('/', batchData);
  }

  // Get rate limiter status (legacy)
  getRateLimiterStatus(): { canMakeRequest: boolean; retryAfter: number } {
    return {
      canMakeRequest: this.rateLimiter.canMakeRequest(),
      retryAfter: this.rateLimiter.getRetryAfter(),
    };
  }

  // Get advanced rate limiter status
  getAdvancedRateLimiterStatus(type: RateLimitType = RateLimitType.APP_LEVEL, identifier = 'default') {
    return this.advancedRateLimiter.getRateLimitStatus(type, identifier);
  }

  // Get quota usage
  getQuotaUsage(type: RateLimitType = RateLimitType.APP_LEVEL, identifier = 'default') {
    return this.advancedRateLimiter.getQuotaUsage(type, identifier);
  }

  // Get comprehensive rate limiting status
  getComprehensiveStatus() {
    return this.advancedRateLimiter.getStatus();
  }

  // Get circuit breaker status
  getCircuitBreakerStatus(): { state: CircuitBreakerState; canExecute: boolean } {
    return {
      state: this.circuitBreaker.getState(),
      canExecute: this.circuitBreaker.canExecute(),
    };
  }

  // Reset rate limiter
  resetRateLimiter(): void {
    this.rateLimiter.reset();
    this.advancedRateLimiter.reset();
  }

  // Reset circuit breaker
  resetCircuitBreaker(): void {
    this.circuitBreaker.reset();
  }

  // Health check method
  async healthCheck(): Promise<boolean> {
    try {
      if (!this.isAuthenticated()) {
        return false;
      }

      await this.get('/me', { fields: 'id' });
      return true;
    } catch (error) {
      return false;
    }
  }
}

// Create singleton instance
let apiClientInstance: FacebookAPIClient | null = null;

// Factory function to get API client instance
export function getFacebookAPIClient(): FacebookAPIClient {
  if (!apiClientInstance) {
    const config = getFacebookConfig();
    apiClientInstance = new FacebookAPIClient(config.FACEBOOK_API_VERSION as string);
  }
  
  return apiClientInstance;
}

// Reset singleton instance (useful for testing)
export function resetFacebookAPIClient(): void {
  apiClientInstance = null;
}