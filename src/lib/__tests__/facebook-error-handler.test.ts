/**
 * Tests for Facebook Error Handler
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { 
  FacebookErrorHandler, 
  ErrorCategory, 
  ErrorSeverity, 
  RecoveryStrategy,
  getFacebookErrorHandler,
  resetFacebookErrorHandler,
  handleFacebookError,
  getFacebookErrorMessage,
  isFacebookErrorRetryable
} from '../facebook-error-handler';
import { FACEBOOK_ERROR_CODES } from '../facebook-constants';
import { FacebookAPIError, AuthError, DataError } from '@/types/facebook';

describe('FacebookErrorHandler', () => {
  let errorHandler: FacebookErrorHandler;

  beforeEach(() => {
    resetFacebookErrorHandler();
    errorHandler = new FacebookErrorHandler();
    vi.clearAllMocks();
  });

  describe('analyzeError', () => {
    it('should analyze Facebook API authentication errors correctly', () => {
      const error: FacebookAPIError = {
        error: {
          message: 'Invalid OAuth access token.',
          type: 'OAuthException',
          code: FACEBOOK_ERROR_CODES.INVALID_ACCESS_TOKEN,
          fbtrace_id: 'test-trace-id'
        }
      };

      const context = {
        operation: 'getCampaigns',
        timestamp: new Date()
      };

      const result = errorHandler.analyzeError(error, context);

      expect(result.category).toBe(ErrorCategory.AUTHENTICATION);
      expect(result.severity).toBe(ErrorSeverity.HIGH);
      expect(result.recoveryStrategy).toBe(RecoveryStrategy.RE_AUTHENTICATE);
      expect(result.retryable).toBe(false);
      expect(result.userMessage).toContain('session has expired');
      expect(result.context).toEqual({
        code: FACEBOOK_ERROR_CODES.INVALID_ACCESS_TOKEN,
        fbtrace_id: 'test-trace-id'
      });
    });

    it('should analyze Facebook API rate limiting errors correctly', () => {
      const error: FacebookAPIError = {
        error: {
          message: 'Application request limit reached',
          type: 'OAuthException',
          code: FACEBOOK_ERROR_CODES.RATE_LIMIT_EXCEEDED,
          fbtrace_id: 'test-trace-id'
        }
      };

      const context = {
        operation: 'getCampaigns',
        timestamp: new Date()
      };

      const result = errorHandler.analyzeError(error, context);

      expect(result.category).toBe(ErrorCategory.RATE_LIMITING);
      expect(result.severity).toBe(ErrorSeverity.MEDIUM);
      expect(result.recoveryStrategy).toBe(RecoveryStrategy.RETRY);
      expect(result.retryable).toBe(true);
      expect(result.retryDelay).toBe(300000); // 5 minutes
      expect(result.maxRetries).toBe(3);
    });

    it('should analyze Facebook API permission errors correctly', () => {
      const error: FacebookAPIError = {
        error: {
          message: 'Insufficient permissions',
          type: 'OAuthException',
          code: FACEBOOK_ERROR_CODES.INSUFFICIENT_PERMISSIONS
        }
      };

      const context = {
        operation: 'getCampaigns',
        timestamp: new Date()
      };

      const result = errorHandler.analyzeError(error, context);

      expect(result.category).toBe(ErrorCategory.PERMISSIONS);
      expect(result.severity).toBe(ErrorSeverity.HIGH);
      expect(result.recoveryStrategy).toBe(RecoveryStrategy.RE_AUTHENTICATE);
      expect(result.retryable).toBe(false);
    });

    it('should analyze Facebook API account errors correctly', () => {
      const error: FacebookAPIError = {
        error: {
          message: 'Account disabled',
          type: 'OAuthException',
          code: FACEBOOK_ERROR_CODES.ACCOUNT_DISABLED
        }
      };

      const context = {
        operation: 'getCampaigns',
        timestamp: new Date()
      };

      const result = errorHandler.analyzeError(error, context);

      expect(result.category).toBe(ErrorCategory.PERMANENT);
      expect(result.severity).toBe(ErrorSeverity.CRITICAL);
      expect(result.recoveryStrategy).toBe(RecoveryStrategy.ABORT);
      expect(result.retryable).toBe(false);
    });

    it('should analyze authentication errors correctly', () => {
      const error: AuthError = new Error('OAuth failed') as AuthError;
      error.code = 'AUTH_ERROR';
      error.type = 'auth_error';

      const context = {
        operation: 'initiateAuth',
        timestamp: new Date()
      };

      const result = errorHandler.analyzeError(error, context);

      expect(result.category).toBe(ErrorCategory.AUTHENTICATION);
      expect(result.severity).toBe(ErrorSeverity.HIGH);
      expect(result.recoveryStrategy).toBe(RecoveryStrategy.RE_AUTHENTICATE);
      expect(result.retryable).toBe(false);
    });

    it('should analyze network errors correctly', () => {
      const error = new Error('fetch failed');
      error.name = 'NetworkError';

      const context = {
        operation: 'getCampaigns',
        timestamp: new Date()
      };

      const result = errorHandler.analyzeError(error, context);

      expect(result.category).toBe(ErrorCategory.NETWORK);
      expect(result.severity).toBe(ErrorSeverity.MEDIUM);
      expect(result.recoveryStrategy).toBe(RecoveryStrategy.RETRY);
      expect(result.retryable).toBe(true);
      expect(result.retryDelay).toBe(2000);
      expect(result.maxRetries).toBe(3);
    });

    it('should analyze data validation errors correctly', () => {
      const error: DataError = new Error('Invalid data format') as DataError;
      error.type = 'data_error';
      error.field = 'campaign.name';

      const context = {
        operation: 'transformData',
        timestamp: new Date()
      };

      const result = errorHandler.analyzeError(error, context);

      expect(result.category).toBe(ErrorCategory.DATA_VALIDATION);
      expect(result.severity).toBe(ErrorSeverity.LOW);
      expect(result.recoveryStrategy).toBe(RecoveryStrategy.IGNORE);
      expect(result.retryable).toBe(false);
      expect(result.context).toEqual({ field: 'campaign.name' });
    });

    it('should analyze generic errors correctly', () => {
      const error = new Error('Something went wrong');

      const context = {
        operation: 'genericOperation',
        timestamp: new Date()
      };

      const result = errorHandler.analyzeError(error, context);

      expect(result.category).toBe(ErrorCategory.UNKNOWN);
      expect(result.severity).toBe(ErrorSeverity.MEDIUM);
      expect(result.recoveryStrategy).toBe(RecoveryStrategy.RETRY);
      expect(result.retryable).toBe(true);
      expect(result.retryDelay).toBe(5000);
      expect(result.maxRetries).toBe(2);
    });
  });

  describe('handleError', () => {
    it('should handle error and return error info', async () => {
      const error: FacebookAPIError = {
        error: {
          message: 'Invalid OAuth access token.',
          type: 'OAuthException',
          code: FACEBOOK_ERROR_CODES.INVALID_ACCESS_TOKEN
        }
      };

      const context = {
        operation: 'getCampaigns',
        timestamp: new Date()
      };

      const result = await errorHandler.handleError(error, context);

      expect(result.category).toBe(ErrorCategory.AUTHENTICATION);
      expect(result.severity).toBe(ErrorSeverity.HIGH);

      // Check that error was logged
      const logs = errorHandler.getErrorLogs();
      expect(logs).toHaveLength(1);
      expect(logs[0].error).toBe(error);
      expect(logs[0].context).toBe(context);
    });

    it('should log errors with proper structure', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      
      const error: FacebookAPIError = {
        error: {
          message: 'Account disabled',
          type: 'OAuthException',
          code: FACEBOOK_ERROR_CODES.ACCOUNT_DISABLED
        }
      };

      const context = {
        operation: 'getCampaigns',
        timestamp: new Date()
      };

      await errorHandler.handleError(error, context);

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('CRITICAL Facebook API Error:'),
        expect.objectContaining({
          category: ErrorCategory.PERMANENT,
          severity: ErrorSeverity.CRITICAL
        })
      );

      consoleSpy.mockRestore();
    });
  });

  describe('isRetryable', () => {
    it('should return true for retryable errors', () => {
      const error: FacebookAPIError = {
        error: {
          message: 'Rate limit exceeded',
          type: 'OAuthException',
          code: FACEBOOK_ERROR_CODES.RATE_LIMIT_EXCEEDED
        }
      };

      expect(errorHandler.isRetryable(error)).toBe(true);
    });

    it('should return false for non-retryable errors', () => {
      const error: FacebookAPIError = {
        error: {
          message: 'Invalid access token',
          type: 'OAuthException',
          code: FACEBOOK_ERROR_CODES.INVALID_ACCESS_TOKEN
        }
      };

      expect(errorHandler.isRetryable(error)).toBe(false);
    });
  });

  describe('calculateRetryDelay', () => {
    it('should calculate exponential backoff with jitter', () => {
      const delay1 = errorHandler.calculateRetryDelay(1, 1000);
      const delay2 = errorHandler.calculateRetryDelay(2, 1000);
      const delay3 = errorHandler.calculateRetryDelay(3, 1000);

      // First attempt should be around base delay (1000ms) + jitter
      expect(delay1).toBeGreaterThanOrEqual(1000);
      expect(delay1).toBeLessThan(3000);

      // Second attempt should be around 2x base delay + jitter
      expect(delay2).toBeGreaterThanOrEqual(2000);
      expect(delay2).toBeLessThan(5000);

      // Third attempt should be around 4x base delay + jitter
      expect(delay3).toBeGreaterThanOrEqual(4000);
      expect(delay3).toBeLessThan(9000);
    });

    it('should cap delay at maximum value', () => {
      const delay = errorHandler.calculateRetryDelay(10, 1000);
      expect(delay).toBeLessThanOrEqual(30000); // Max 30 seconds
    });
  });

  describe('getUserMessage', () => {
    it('should return user-friendly message for Facebook API errors', () => {
      const error: FacebookAPIError = {
        error: {
          message: 'Invalid OAuth access token.',
          type: 'OAuthException',
          code: FACEBOOK_ERROR_CODES.INVALID_ACCESS_TOKEN
        }
      };

      const message = errorHandler.getUserMessage(error);
      expect(message).toContain('session has expired');
      expect(message).toContain('reconnect');
    });

    it('should return generic message for unknown Facebook API errors', () => {
      const error: FacebookAPIError = {
        error: {
          message: 'Unknown error',
          type: 'OAuthException',
          code: 99999 // Unknown code
        }
      };

      const message = errorHandler.getUserMessage(error);
      expect(message).toBe('An error occurred with Facebook. Please try again.');
    });

    it('should return appropriate message for auth errors', () => {
      const error: AuthError = new Error('OAuth failed') as AuthError;
      error.type = 'auth_error';

      const message = errorHandler.getUserMessage(error);
      expect(message).toContain('Authentication failed');
    });

    it('should return appropriate message for network errors', () => {
      const error = new Error('fetch failed');
      error.name = 'NetworkError';

      const message = errorHandler.getUserMessage(error);
      expect(message).toContain('Network connection error');
    });
  });

  describe('getTechnicalMessage', () => {
    it('should return technical message for Facebook API errors', () => {
      const error: FacebookAPIError = {
        error: {
          message: 'Invalid OAuth access token.',
          type: 'OAuthException',
          code: FACEBOOK_ERROR_CODES.INVALID_ACCESS_TOKEN
        }
      };

      const message = errorHandler.getTechnicalMessage(error);
      expect(message).toContain('Facebook API Error 190');
      expect(message).toContain('Access token is invalid');
    });

    it('should return error message for generic errors', () => {
      const error = new Error('Something went wrong');
      const message = errorHandler.getTechnicalMessage(error);
      expect(message).toBe('Something went wrong');
    });
  });

  describe('getRecoverySuggestions', () => {
    it('should return appropriate suggestions for authentication errors', () => {
      const error: FacebookAPIError = {
        error: {
          message: 'Invalid access token',
          type: 'OAuthException',
          code: FACEBOOK_ERROR_CODES.INVALID_ACCESS_TOKEN
        }
      };

      const suggestions = errorHandler.getRecoverySuggestions(error);
      expect(suggestions).toContain('Disconnect and reconnect your Facebook account');
      expect(suggestions).toContain('Make sure to grant all requested permissions');
    });

    it('should return appropriate suggestions for rate limiting errors', () => {
      const error: FacebookAPIError = {
        error: {
          message: 'Rate limit exceeded',
          type: 'OAuthException',
          code: FACEBOOK_ERROR_CODES.RATE_LIMIT_EXCEEDED
        }
      };

      const suggestions = errorHandler.getRecoverySuggestions(error);
      expect(suggestions).toContain('Wait a few minutes and try again');
      expect(suggestions).toContain('Check your internet connection');
    });
  });

  describe('error logging', () => {
    it('should log errors and maintain log history', async () => {
      const error1: FacebookAPIError = {
        error: {
          message: 'Error 1',
          type: 'OAuthException',
          code: FACEBOOK_ERROR_CODES.INVALID_ACCESS_TOKEN
        }
      };

      const error2: FacebookAPIError = {
        error: {
          message: 'Error 2',
          type: 'OAuthException',
          code: FACEBOOK_ERROR_CODES.RATE_LIMIT_EXCEEDED
        }
      };

      const context1 = { operation: 'test', timestamp: new Date() };
      const context2 = { operation: 'test', timestamp: new Date(Date.now() + 1) }; // Ensure different timestamp

      await errorHandler.handleError(error1, context1);
      await errorHandler.handleError(error2, context2);

      const logs = errorHandler.getErrorLogs();
      expect(logs).toHaveLength(2);
      // Check that we have both errors (order may vary due to timing)
      const errorMessages = logs.map(log => log.error.error.message);
      expect(errorMessages).toContain('Error 1');
      expect(errorMessages).toContain('Error 2');
    });

    it('should limit log size', async () => {
      const context = { operation: 'test', timestamp: new Date() };
      
      // Create more errors than the max log entries (1000)
      for (let i = 0; i < 1005; i++) {
        const error = new Error(`Error ${i}`);
        await errorHandler.handleError(error, context);
      }

      const logs = errorHandler.getErrorLogs();
      expect(logs.length).toBeLessThanOrEqual(1000);
    });

    it('should clear error logs', async () => {
      const error = new Error('Test error');
      const context = { operation: 'test', timestamp: new Date() };

      await errorHandler.handleError(error, context);
      expect(errorHandler.getErrorLogs()).toHaveLength(1);

      errorHandler.clearErrorLogs();
      expect(errorHandler.getErrorLogs()).toHaveLength(0);
    });

    it('should mark errors as resolved', async () => {
      const error = new Error('Test error');
      const context = { operation: 'test', timestamp: new Date() };

      await errorHandler.handleError(error, context);
      const logs = errorHandler.getErrorLogs();
      const errorId = logs[0].id;

      expect(logs[0].resolved).toBe(false);

      errorHandler.markErrorResolved(errorId, 'manual_fix');
      const updatedLogs = errorHandler.getErrorLogs();
      expect(updatedLogs[0].resolved).toBe(true);
      expect(updatedLogs[0].resolutionMethod).toBe('manual_fix');
      expect(updatedLogs[0].resolutionTimestamp).toBeInstanceOf(Date);
    });
  });

  describe('error statistics', () => {
    it('should provide error statistics', async () => {
      const context = { operation: 'test', timestamp: new Date() };

      // Add different types of errors
      const authError: FacebookAPIError = {
        error: {
          message: 'Auth error',
          type: 'OAuthException',
          code: FACEBOOK_ERROR_CODES.INVALID_ACCESS_TOKEN
        }
      };

      const rateLimitError: FacebookAPIError = {
        error: {
          message: 'Rate limit',
          type: 'OAuthException',
          code: FACEBOOK_ERROR_CODES.RATE_LIMIT_EXCEEDED
        }
      };

      const networkError = new Error('Network error');
      networkError.name = 'NetworkError';

      await errorHandler.handleError(authError, context);
      await errorHandler.handleError(rateLimitError, context);
      await errorHandler.handleError(networkError, context);

      // Mark one as resolved
      const logs = errorHandler.getErrorLogs();
      errorHandler.markErrorResolved(logs[0].id, 'auto_retry');

      const stats = errorHandler.getErrorStats();

      expect(stats.total).toBe(3);
      expect(stats.byCategory[ErrorCategory.AUTHENTICATION]).toBe(1);
      expect(stats.byCategory[ErrorCategory.RATE_LIMITING]).toBe(1);
      expect(stats.byCategory[ErrorCategory.NETWORK]).toBe(1);
      expect(stats.bySeverity[ErrorSeverity.HIGH]).toBe(1);
      expect(stats.bySeverity[ErrorSeverity.MEDIUM]).toBe(2);
      expect(stats.resolved).toBe(1);
      expect(stats.unresolved).toBe(2);
    });
  });

  describe('singleton and utility functions', () => {
    it('should return singleton instance', () => {
      const handler1 = getFacebookErrorHandler();
      const handler2 = getFacebookErrorHandler();
      expect(handler1).toBe(handler2);
    });

    it('should reset singleton instance', () => {
      const handler1 = getFacebookErrorHandler();
      resetFacebookErrorHandler();
      const handler2 = getFacebookErrorHandler();
      expect(handler1).not.toBe(handler2);
    });

    it('should handle error using utility function', async () => {
      const error = new Error('Test error');
      const context = { operation: 'test', timestamp: new Date() };

      const result = await handleFacebookError(error, context);
      expect(result.category).toBe(ErrorCategory.UNKNOWN);
    });

    it('should get error message using utility function', () => {
      const error: FacebookAPIError = {
        error: {
          message: 'Invalid access token',
          type: 'OAuthException',
          code: FACEBOOK_ERROR_CODES.INVALID_ACCESS_TOKEN
        }
      };

      const message = getFacebookErrorMessage(error);
      expect(message).toContain('session has expired');
    });

    it('should check if error is retryable using utility function', () => {
      const retryableError: FacebookAPIError = {
        error: {
          message: 'Rate limit exceeded',
          type: 'OAuthException',
          code: FACEBOOK_ERROR_CODES.RATE_LIMIT_EXCEEDED
        }
      };

      const nonRetryableError: FacebookAPIError = {
        error: {
          message: 'Invalid access token',
          type: 'OAuthException',
          code: FACEBOOK_ERROR_CODES.INVALID_ACCESS_TOKEN
        }
      };

      expect(isFacebookErrorRetryable(retryableError)).toBe(true);
      expect(isFacebookErrorRetryable(nonRetryableError)).toBe(false);
    });
  });

  describe('edge cases', () => {
    it('should handle null/undefined errors gracefully', () => {
      const context = { operation: 'test', timestamp: new Date() };

      const nullResult = errorHandler.analyzeError(null, context);
      expect(nullResult.category).toBe(ErrorCategory.UNKNOWN);

      const undefinedResult = errorHandler.analyzeError(undefined, context);
      expect(undefinedResult.category).toBe(ErrorCategory.UNKNOWN);
    });

    it('should handle malformed Facebook API errors', () => {
      const malformedError = {
        error: {
          // Missing required fields
          message: 'Some error'
        }
      };

      const context = { operation: 'test', timestamp: new Date() };
      const result = errorHandler.analyzeError(malformedError, context);
      expect(result.category).toBe(ErrorCategory.UNKNOWN);
    });

    it('should handle errors without stack traces', async () => {
      const errorWithoutStack = { message: 'Error without stack' };
      const context = { operation: 'test', timestamp: new Date() };

      await errorHandler.handleError(errorWithoutStack, context);
      const logs = errorHandler.getErrorLogs();
      expect(logs[0].stackTrace).toBeUndefined();
    });
  });
});