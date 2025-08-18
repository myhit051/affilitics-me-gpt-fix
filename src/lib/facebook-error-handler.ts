/**
 * Facebook API Error Handler
 * Comprehensive error handling system for Facebook API integration
 */

import { 
  FacebookAPIError, 
  APIError, 
  AuthError, 
  DataError 
} from '@/types/facebook';
import { FACEBOOK_ERROR_CODES } from './facebook-constants';

// Error categories for different handling strategies
export enum ErrorCategory {
  AUTHENTICATION = 'authentication',
  RATE_LIMITING = 'rate_limiting',
  PERMISSIONS = 'permissions',
  NETWORK = 'network',
  DATA_VALIDATION = 'data_validation',
  TEMPORARY = 'temporary',
  PERMANENT = 'permanent',
  UNKNOWN = 'unknown'
}

// Error severity levels
export enum ErrorSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

// Error recovery strategies
export enum RecoveryStrategy {
  RETRY = 'retry',
  REFRESH_TOKEN = 'refresh_token',
  RE_AUTHENTICATE = 're_authenticate',
  FALLBACK = 'fallback',
  ABORT = 'abort',
  IGNORE = 'ignore'
}

// Enhanced error information
export interface ErrorInfo {
  category: ErrorCategory;
  severity: ErrorSeverity;
  recoveryStrategy: RecoveryStrategy;
  userMessage: string;
  technicalMessage: string;
  retryable: boolean;
  retryDelay?: number;
  maxRetries?: number;
  context?: Record<string, any>;
}

// Error context for logging
export interface ErrorContext {
  operation: string;
  endpoint?: string;
  accountId?: string;
  campaignId?: string;
  timestamp: Date;
  userAgent?: string;
  requestId?: string;
  additionalData?: Record<string, any>;
}

// Error log entry
export interface ErrorLogEntry {
  id: string;
  timestamp: Date;
  error: Error;
  errorInfo: ErrorInfo;
  context: ErrorContext;
  stackTrace?: string;
  resolved: boolean;
  resolutionTimestamp?: Date;
  resolutionMethod?: string;
}

// User-friendly error messages mapping
const ERROR_MESSAGES: Record<number, { user: string; technical: string }> = {
  // Authentication errors
  [FACEBOOK_ERROR_CODES.INVALID_ACCESS_TOKEN]: {
    user: 'Your Facebook session has expired. Please reconnect your account.',
    technical: 'Access token is invalid or malformed'
  },
  [FACEBOOK_ERROR_CODES.ACCESS_TOKEN_EXPIRED]: {
    user: 'Your Facebook session has expired. Please reconnect your account.',
    technical: 'Access token has expired and needs to be refreshed'
  },
  [FACEBOOK_ERROR_CODES.INSUFFICIENT_PERMISSIONS]: {
    user: 'Your Facebook account doesn\'t have the required permissions. Please reconnect and grant all requested permissions.',
    technical: 'Insufficient permissions for the requested operation'
  },

  // Rate limiting errors
  [FACEBOOK_ERROR_CODES.RATE_LIMIT_EXCEEDED]: {
    user: 'Too many requests to Facebook. Please wait a few minutes before trying again.',
    technical: 'API rate limit exceeded'
  },
  [FACEBOOK_ERROR_CODES.USER_REQUEST_LIMIT_REACHED]: {
    user: 'Facebook usage limit reached. Please try again later.',
    technical: 'User request limit reached'
  },

  // API errors
  [FACEBOOK_ERROR_CODES.INVALID_PARAMETER]: {
    user: 'Invalid request parameters. Please try again.',
    technical: 'One or more request parameters are invalid'
  },
  [FACEBOOK_ERROR_CODES.MISSING_PARAMETER]: {
    user: 'Missing required information. Please try again.',
    technical: 'Required parameter is missing from the request'
  },
  [FACEBOOK_ERROR_CODES.TEMPORARILY_UNAVAILABLE]: {
    user: 'Facebook services are temporarily unavailable. Please try again in a few minutes.',
    technical: 'Facebook API is temporarily unavailable'
  },

  // Account errors
  [FACEBOOK_ERROR_CODES.ACCOUNT_DISABLED]: {
    user: 'Your Facebook ad account is disabled. Please contact Facebook support.',
    technical: 'Ad account is disabled'
  },
  [FACEBOOK_ERROR_CODES.ACCOUNT_RESTRICTED]: {
    user: 'Your Facebook ad account has restrictions. Please check your account status.',
    technical: 'Ad account has restrictions'
  },

  // Generic error
  [FACEBOOK_ERROR_CODES.UNKNOWN_ERROR]: {
    user: 'An unexpected error occurred. Please try again.',
    technical: 'Unknown Facebook API error'
  }
};

export class FacebookErrorHandler {
  private errorLog: ErrorLogEntry[] = [];
  private readonly maxLogEntries = 1000;

  /**
   * Analyzes an error and returns comprehensive error information
   */
  analyzeError(error: any, context: ErrorContext): ErrorInfo {
    // Handle Facebook API errors
    if (this.isFacebookAPIError(error)) {
      return this.analyzeFacebookAPIError(error, context);
    }

    // Handle authentication errors
    if (this.isAuthError(error)) {
      return this.analyzeAuthError(error, context);
    }

    // Handle network errors
    if (this.isNetworkError(error)) {
      return this.analyzeNetworkError(error, context);
    }

    // Handle data validation errors
    if (this.isDataError(error)) {
      return this.analyzeDataError(error, context);
    }

    // Handle generic errors
    return this.analyzeGenericError(error, context);
  }

  /**
   * Handles an error with appropriate recovery strategy
   */
  async handleError(error: any, context: ErrorContext): Promise<ErrorInfo> {
    const errorInfo = this.analyzeError(error, context);
    
    // Log the error
    this.logError(error, errorInfo, context);

    // Execute recovery strategy if applicable
    await this.executeRecoveryStrategy(error, errorInfo, context);

    return errorInfo;
  }

  /**
   * Checks if an error is retryable
   */
  isRetryable(error: any): boolean {
    const errorInfo = this.analyzeError(error, { operation: 'retry_check', timestamp: new Date() });
    return errorInfo.retryable;
  }

  /**
   * Calculates retry delay with exponential backoff
   */
  calculateRetryDelay(attempt: number, baseDelay = 1000): number {
    const exponentialDelay = baseDelay * Math.pow(2, attempt - 1);
    const jitter = Math.random() * 1000; // Add jitter to prevent thundering herd
    const maxDelay = 30000; // Cap at 30 seconds
    
    return Math.min(exponentialDelay + jitter, maxDelay);
  }

  /**
   * Gets user-friendly error message
   */
  getUserMessage(error: any): string {
    if (this.isFacebookAPIError(error)) {
      const code = error.error?.code;
      return ERROR_MESSAGES[code]?.user || 'An error occurred with Facebook. Please try again.';
    }

    if (this.isAuthError(error)) {
      return 'Authentication failed. Please reconnect your Facebook account.';
    }

    if (this.isNetworkError(error)) {
      return 'Network connection error. Please check your internet connection and try again.';
    }

    return 'An unexpected error occurred. Please try again.';
  }

  /**
   * Gets technical error message for logging
   */
  getTechnicalMessage(error: any): string {
    if (this.isFacebookAPIError(error)) {
      const code = error.error?.code;
      const message = ERROR_MESSAGES[code]?.technical || error.error?.message;
      return `Facebook API Error ${code}: ${message}`;
    }

    if (error instanceof Error) {
      return error.message;
    }

    return String(error);
  }

  /**
   * Gets error recovery suggestions for users
   */
  getRecoverySuggestions(error: any): string[] {
    const errorInfo = this.analyzeError(error, { operation: 'recovery_suggestions', timestamp: new Date() });
    
    switch (errorInfo.recoveryStrategy) {
      case RecoveryStrategy.RE_AUTHENTICATE:
        return [
          'Disconnect and reconnect your Facebook account',
          'Make sure to grant all requested permissions',
          'Check that your Facebook account is active'
        ];
      
      case RecoveryStrategy.RETRY:
        return [
          'Wait a few minutes and try again',
          'Check your internet connection',
          'Refresh the page if the problem persists'
        ];
      
      case RecoveryStrategy.FALLBACK:
        return [
          'Try importing your data using file upload instead',
          'Contact support if the problem continues',
          'Check Facebook\'s status page for service issues'
        ];
      
      default:
        return [
          'Refresh the page and try again',
          'Check your internet connection',
          'Contact support if the problem persists'
        ];
    }
  }

  /**
   * Gets error logs for debugging
   */
  getErrorLogs(limit = 50): ErrorLogEntry[] {
    return this.errorLog
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, limit);
  }

  /**
   * Clears error logs
   */
  clearErrorLogs(): void {
    this.errorLog = [];
  }

  /**
   * Gets error statistics
   */
  getErrorStats(): {
    total: number;
    byCategory: Record<ErrorCategory, number>;
    bySeverity: Record<ErrorSeverity, number>;
    resolved: number;
    unresolved: number;
  } {
    const stats = {
      total: this.errorLog.length,
      byCategory: {} as Record<ErrorCategory, number>,
      bySeverity: {} as Record<ErrorSeverity, number>,
      resolved: 0,
      unresolved: 0
    };

    // Initialize counters
    Object.values(ErrorCategory).forEach(category => {
      stats.byCategory[category] = 0;
    });
    Object.values(ErrorSeverity).forEach(severity => {
      stats.bySeverity[severity] = 0;
    });

    // Count errors
    this.errorLog.forEach(entry => {
      stats.byCategory[entry.errorInfo.category]++;
      stats.bySeverity[entry.errorInfo.severity]++;
      
      if (entry.resolved) {
        stats.resolved++;
      } else {
        stats.unresolved++;
      }
    });

    return stats;
  }

  /**
   * Marks an error as resolved
   */
  markErrorResolved(errorId: string, resolutionMethod: string): void {
    const entry = this.errorLog.find(e => e.id === errorId);
    if (entry) {
      entry.resolved = true;
      entry.resolutionTimestamp = new Date();
      entry.resolutionMethod = resolutionMethod;
    }
  }

  // Private helper methods

  private isFacebookAPIError(error: any): error is FacebookAPIError {
    return error && typeof error === 'object' && error.error && typeof error.error.code === 'number';
  }

  private isAuthError(error: any): error is AuthError {
    return error && error.type === 'auth_error';
  }

  private isNetworkError(error: any): boolean {
    return error && (
      error.name === 'NetworkError' ||
      error.name === 'TypeError' && error.message?.includes('fetch') ||
      error.code === 'NETWORK_ERROR' ||
      error.message?.includes('network') ||
      error.message?.includes('connection')
    );
  }

  private isDataError(error: any): error is DataError {
    return error && error.type === 'data_error';
  }

  private analyzeFacebookAPIError(error: FacebookAPIError, context: ErrorContext): ErrorInfo {
    const code = error.error.code;
    const message = error.error.message;

    // Authentication errors
    if ([
      FACEBOOK_ERROR_CODES.INVALID_ACCESS_TOKEN,
      FACEBOOK_ERROR_CODES.ACCESS_TOKEN_EXPIRED
    ].includes(code)) {
      return {
        category: ErrorCategory.AUTHENTICATION,
        severity: ErrorSeverity.HIGH,
        recoveryStrategy: code === FACEBOOK_ERROR_CODES.ACCESS_TOKEN_EXPIRED ? RecoveryStrategy.REFRESH_TOKEN : RecoveryStrategy.RE_AUTHENTICATE,
        userMessage: ERROR_MESSAGES[code]?.user || 'Authentication error',
        technicalMessage: ERROR_MESSAGES[code]?.technical || message,
        retryable: false,
        context: { code, fbtrace_id: error.error.fbtrace_id }
      };
    }

    // Permission errors
    if (code === FACEBOOK_ERROR_CODES.INSUFFICIENT_PERMISSIONS) {
      return {
        category: ErrorCategory.PERMISSIONS,
        severity: ErrorSeverity.HIGH,
        recoveryStrategy: RecoveryStrategy.RE_AUTHENTICATE,
        userMessage: ERROR_MESSAGES[code]?.user || 'Permission error',
        technicalMessage: ERROR_MESSAGES[code]?.technical || message,
        retryable: false,
        context: { code, fbtrace_id: error.error.fbtrace_id }
      };
    }

    // Rate limiting errors
    if ([
      FACEBOOK_ERROR_CODES.RATE_LIMIT_EXCEEDED,
      FACEBOOK_ERROR_CODES.USER_REQUEST_LIMIT_REACHED
    ].includes(code)) {
      return {
        category: ErrorCategory.RATE_LIMITING,
        severity: ErrorSeverity.MEDIUM,
        recoveryStrategy: RecoveryStrategy.RETRY,
        userMessage: ERROR_MESSAGES[code]?.user || 'Rate limit error',
        technicalMessage: ERROR_MESSAGES[code]?.technical || message,
        retryable: true,
        retryDelay: 300000, // 5 minutes
        maxRetries: 3,
        context: { code, fbtrace_id: error.error.fbtrace_id }
      };
    }

    // Temporary errors
    if ([
      FACEBOOK_ERROR_CODES.TEMPORARILY_UNAVAILABLE,
      FACEBOOK_ERROR_CODES.UNKNOWN_ERROR
    ].includes(code)) {
      return {
        category: ErrorCategory.TEMPORARY,
        severity: ErrorSeverity.MEDIUM,
        recoveryStrategy: RecoveryStrategy.RETRY,
        userMessage: ERROR_MESSAGES[code]?.user || 'Temporary error',
        technicalMessage: ERROR_MESSAGES[code]?.technical || message,
        retryable: true,
        retryDelay: 5000,
        maxRetries: 3,
        context: { code, fbtrace_id: error.error.fbtrace_id }
      };
    }

    // Account errors
    if ([
      FACEBOOK_ERROR_CODES.ACCOUNT_DISABLED,
      FACEBOOK_ERROR_CODES.ACCOUNT_RESTRICTED
    ].includes(code)) {
      return {
        category: ErrorCategory.PERMANENT,
        severity: ErrorSeverity.CRITICAL,
        recoveryStrategy: RecoveryStrategy.ABORT,
        userMessage: ERROR_MESSAGES[code]?.user || 'Account error',
        technicalMessage: ERROR_MESSAGES[code]?.technical || message,
        retryable: false,
        context: { code, fbtrace_id: error.error.fbtrace_id }
      };
    }

    // Generic Facebook API error
    return {
      category: ErrorCategory.UNKNOWN,
      severity: ErrorSeverity.MEDIUM,
      recoveryStrategy: RecoveryStrategy.RETRY,
      userMessage: ERROR_MESSAGES[code]?.user || 'Facebook API error',
      technicalMessage: ERROR_MESSAGES[code]?.technical || message,
      retryable: true,
      retryDelay: 5000,
      maxRetries: 2,
      context: { code, fbtrace_id: error.error.fbtrace_id }
    };
  }

  private analyzeAuthError(error: AuthError, context: ErrorContext): ErrorInfo {
    return {
      category: ErrorCategory.AUTHENTICATION,
      severity: ErrorSeverity.HIGH,
      recoveryStrategy: RecoveryStrategy.RE_AUTHENTICATE,
      userMessage: 'Authentication failed. Please reconnect your Facebook account.',
      technicalMessage: error.message,
      retryable: false,
      context: { code: error.code }
    };
  }

  private analyzeNetworkError(error: any, context: ErrorContext): ErrorInfo {
    return {
      category: ErrorCategory.NETWORK,
      severity: ErrorSeverity.MEDIUM,
      recoveryStrategy: RecoveryStrategy.RETRY,
      userMessage: 'Network connection error. Please check your internet connection and try again.',
      technicalMessage: error.message || 'Network error',
      retryable: true,
      retryDelay: 2000,
      maxRetries: 3,
      context: { errorName: error.name }
    };
  }

  private analyzeDataError(error: DataError, context: ErrorContext): ErrorInfo {
    return {
      category: ErrorCategory.DATA_VALIDATION,
      severity: ErrorSeverity.LOW,
      recoveryStrategy: RecoveryStrategy.IGNORE,
      userMessage: 'Data validation error. Some data may be incomplete.',
      technicalMessage: error.message,
      retryable: false,
      context: { field: error.field }
    };
  }

  private analyzeGenericError(error: any, context: ErrorContext): ErrorInfo {
    return {
      category: ErrorCategory.UNKNOWN,
      severity: ErrorSeverity.MEDIUM,
      recoveryStrategy: RecoveryStrategy.RETRY,
      userMessage: 'An unexpected error occurred. Please try again.',
      technicalMessage: error instanceof Error ? error.message : String(error),
      retryable: true,
      retryDelay: 5000,
      maxRetries: 2,
      context: { errorType: typeof error }
    };
  }

  private logError(error: any, errorInfo: ErrorInfo, context: ErrorContext): void {
    const logEntry: ErrorLogEntry = {
      id: this.generateErrorId(),
      timestamp: new Date(),
      error,
      errorInfo,
      context,
      stackTrace: error instanceof Error ? error.stack : undefined,
      resolved: false
    };

    this.errorLog.push(logEntry);

    // Limit log size
    if (this.errorLog.length > this.maxLogEntries) {
      this.errorLog = this.errorLog.slice(-this.maxLogEntries);
    }

    // Log to console based on severity
    this.logToConsole(logEntry);
  }

  private logToConsole(entry: ErrorLogEntry): void {
    const { error, errorInfo, context } = entry;
    
    const logData = {
      id: entry.id,
      timestamp: entry.timestamp.toISOString(),
      category: errorInfo.category,
      severity: errorInfo.severity,
      operation: context.operation,
      userMessage: errorInfo.userMessage,
      technicalMessage: errorInfo.technicalMessage,
      context: errorInfo.context
    };

    switch (errorInfo.severity) {
      case ErrorSeverity.CRITICAL:
        console.error('🚨 CRITICAL Facebook API Error:', logData);
        break;
      case ErrorSeverity.HIGH:
        console.error('❌ Facebook API Error:', logData);
        break;
      case ErrorSeverity.MEDIUM:
        console.warn('⚠️ Facebook API Warning:', logData);
        break;
      case ErrorSeverity.LOW:
        console.info('ℹ️ Facebook API Info:', logData);
        break;
    }

    // Log stack trace for development
    if (import.meta.env.DEV && entry.stackTrace) {
      console.error('Stack trace:', entry.stackTrace);
    }
  }

  private async executeRecoveryStrategy(error: any, errorInfo: ErrorInfo, context: ErrorContext): Promise<void> {
    switch (errorInfo.recoveryStrategy) {
      case RecoveryStrategy.REFRESH_TOKEN:
        // Token refresh will be handled by the OAuth service
        console.info('Token refresh required for error recovery');
        break;
      
      case RecoveryStrategy.RE_AUTHENTICATE:
        // Re-authentication will be handled by the UI
        console.info('Re-authentication required for error recovery');
        break;
      
      case RecoveryStrategy.FALLBACK:
        // Fallback to file import will be handled by the UI
        console.info('Fallback to alternative method recommended');
        break;
      
      case RecoveryStrategy.RETRY:
        // Retry logic will be handled by the calling code
        console.info(`Retry recommended with delay: ${errorInfo.retryDelay}ms`);
        break;
      
      case RecoveryStrategy.ABORT:
        console.error('Operation aborted due to unrecoverable error');
        break;
      
      case RecoveryStrategy.IGNORE:
        console.info('Error can be safely ignored');
        break;
    }
  }

  private generateErrorId(): string {
    return `fb_error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

// Singleton instance
let errorHandlerInstance: FacebookErrorHandler | null = null;

/**
 * Gets the singleton Facebook error handler instance
 */
export function getFacebookErrorHandler(): FacebookErrorHandler {
  if (!errorHandlerInstance) {
    errorHandlerInstance = new FacebookErrorHandler();
  }
  return errorHandlerInstance;
}

/**
 * Resets the singleton instance (useful for testing)
 */
export function resetFacebookErrorHandler(): void {
  errorHandlerInstance = null;
}

/**
 * Convenience function to handle errors
 */
export async function handleFacebookError(error: any, context: ErrorContext): Promise<ErrorInfo> {
  const handler = getFacebookErrorHandler();
  return handler.handleError(error, context);
}

/**
 * Convenience function to get user-friendly error message
 */
export function getFacebookErrorMessage(error: any): string {
  const handler = getFacebookErrorHandler();
  return handler.getUserMessage(error);
}

/**
 * Convenience function to check if error is retryable
 */
export function isFacebookErrorRetryable(error: any): boolean {
  const handler = getFacebookErrorHandler();
  return handler.isRetryable(error);
}