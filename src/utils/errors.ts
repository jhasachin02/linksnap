/**
 * Enhanced error handling utilities
 * Provides consistent error handling and user-friendly error messages
 */

export interface AppError {
  code: string;
  message: string;
  details?: string;
  timestamp: Date;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

export class BookmarkError extends Error {
  public readonly code: string;
  public readonly severity: 'low' | 'medium' | 'high' | 'critical';
  public readonly timestamp: Date;

  constructor(code: string, message: string, severity: 'low' | 'medium' | 'high' | 'critical' = 'medium') {
    super(message);
    this.name = 'BookmarkError';
    this.code = code;
    this.severity = severity;
    this.timestamp = new Date();
  }

  toAppError(): AppError {
    return {
      code: this.code,
      message: this.message,
      timestamp: this.timestamp,
      severity: this.severity
    };
  }
}

/**
 * Error codes and their user-friendly messages
 */
export const ERROR_CODES = {
  AUTH_INVALID_CREDENTIALS: 'Invalid email or password',
  AUTH_USER_NOT_FOUND: 'No account found with this email',
  AUTH_EMAIL_IN_USE: 'An account with this email already exists',
  AUTH_WEAK_PASSWORD: 'Password is too weak',
  AUTH_SESSION_EXPIRED: 'Your session has expired. Please sign in again',
  AUTH_RATE_LIMITED: 'Too many attempts. Please try again later',

  BOOKMARK_INVALID_URL: 'Please enter a valid URL',
  BOOKMARK_DUPLICATE_URL: 'This URL has already been bookmarked',
  BOOKMARK_NOT_FOUND: 'Bookmark not found',
  BOOKMARK_PERMISSION_DENIED: 'You do not have permission to access this bookmark',
  BOOKMARK_SAVE_FAILED: 'Failed to save bookmark',
  BOOKMARK_DELETE_FAILED: 'Failed to delete bookmark',

  SUMMARY_GENERATION_FAILED: 'Unable to generate summary for this URL',
  SUMMARY_CONTENT_NOT_FOUND: 'No content found to summarize',
  SUMMARY_SERVICE_UNAVAILABLE: 'Summary service is temporarily unavailable',

  NETWORK_ERROR: 'Network error. Please check your connection',
  SERVER_ERROR: 'Server error. Please try again later',
  TIMEOUT_ERROR: 'Request timed out. Please try again',

  VALIDATION_REQUIRED_FIELD: 'This field is required',
  VALIDATION_INVALID_FORMAT: 'Invalid format',
  VALIDATION_TOO_LONG: 'Input is too long',
  VALIDATION_TOO_SHORT: 'Input is too short',

  UNKNOWN_ERROR: 'An unexpected error occurred'
} as const;

export const getErrorMessage = (error: unknown): string => {
  if (error instanceof BookmarkError) {
    return error.message;
  }

  if (error instanceof Error) {
    if (error.message.includes('Invalid login credentials')) {
      return ERROR_CODES.AUTH_INVALID_CREDENTIALS;
    }
    if (error.message.includes('User already registered')) {
      return ERROR_CODES.AUTH_EMAIL_IN_USE;
    }
    if (error.message.includes('Password should be at least')) {
      return ERROR_CODES.AUTH_WEAK_PASSWORD;
    }
    if (error.message.includes('JWT expired')) {
      return ERROR_CODES.AUTH_SESSION_EXPIRED;
    }

    if (error.message.includes('fetch')) {
      return ERROR_CODES.NETWORK_ERROR;
    }
    if (error.message.includes('timeout')) {
      return ERROR_CODES.TIMEOUT_ERROR;
    }

    return error.message;
  }

  if (typeof error === 'string') {
    return error;
  }

  return ERROR_CODES.UNKNOWN_ERROR;
};

export const safeAsync = async <T>(
  fn: () => Promise<T>,
  fallback?: T
): Promise<{ data?: T; error?: AppError }> => {
  try {
    const data = await fn();
    return { data };
  } catch (error) {
    const appError: AppError = {
      code: error instanceof BookmarkError ? error.code : 'UNKNOWN_ERROR',
      message: getErrorMessage(error),
      timestamp: new Date(),
      severity: error instanceof BookmarkError ? error.severity : 'medium'
    };
    
    return { error: appError, data: fallback };
  }
};

/**
 * Logs errors for debugging (can be extended to send to external service)
 */
export const logError = (error: AppError | Error, context?: Record<string, unknown>): void => {
  const errorInfo = {
    message: error.message,
    timestamp: new Date().toISOString(),
    context,
    ...(error instanceof BookmarkError && {
      code: error.code,
      severity: error.severity
    })
  };

  console.error('Application Error:', errorInfo);
};

export const withRetry = async <T>(
  fn: () => Promise<T>,
  maxRetries = 3,
  delay = 1000
): Promise<T> => {
  let lastError: Error | undefined;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;
      
      if (attempt === maxRetries) {
        throw lastError;
      }

      await new Promise(resolve => setTimeout(resolve, delay * Math.pow(2, attempt - 1)));
    }
  }

  throw lastError;
};
