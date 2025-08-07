import React from 'react';
import DOMPurify from 'isomorphic-dompurify';

export interface ValidationResult {
  isValid: boolean;
  error?: string;
  sanitized?: string;
}

export interface AppError {
  code: string;
  message: string;
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

export const validateUrl = (url: string): ValidationResult => {
  if (!url || typeof url !== 'string') {
    return { isValid: false, error: 'URL is required' };
  }

  const trimmedUrl = url.trim();
  
  if (trimmedUrl.length === 0) {
    return { isValid: false, error: 'URL cannot be empty' };
  }

  if (trimmedUrl.length > 2048) {
    return { isValid: false, error: 'URL is too long (max 2048 characters)' };
  }

  let normalizedUrl = trimmedUrl;
  if (!normalizedUrl.match(/^https?:\/\//i)) {
    normalizedUrl = `https://${normalizedUrl}`;
  }

  try {
    const urlObject = new URL(normalizedUrl);
    
    if (!['http:', 'https:'].includes(urlObject.protocol)) {
      return { isValid: false, error: 'Only HTTP and HTTPS URLs are allowed' };
    }

    const hostname = urlObject.hostname.toLowerCase();
    const privatePatterns = [
      'localhost', '127.0.0.1', '::1',
      /^192\.168\./, /^10\./, /^172\.(1[6-9]|2[0-9]|3[0-1])\./
    ];

    const isPrivate = privatePatterns.some(pattern => 
      typeof pattern === 'string' ? hostname === pattern : pattern.test(hostname)
    );

    if (isPrivate && process.env.NODE_ENV === 'production') {
      return { isValid: false, error: 'Private/local URLs are not allowed' };
    }

    return { isValid: true, sanitized: normalizedUrl };
  } catch (error) {
    return { isValid: false, error: 'Invalid URL format' };
  }
};

export const validateAndSanitizeText = (text: string, maxLength: number = 500): ValidationResult => {
  if (!text || typeof text !== 'string') {
    return { isValid: false, error: 'Text is required' };
  }

  if (text.trim().length === 0) {
    return { isValid: false, error: 'Text cannot be empty' };
  }

  if (text.length > maxLength) {
    return { 
      isValid: false, 
      error: `Text is too long (max ${maxLength} characters)` 
    };
  }

  const sanitized = DOMPurify.sanitize(text.trim(), { 
    ALLOWED_TAGS: [],
    ALLOWED_ATTR: []
  });

  return { isValid: true, sanitized };
};

export const validateEmail = (email: string): ValidationResult => {
  if (!email || typeof email !== 'string') {
    return { isValid: false, error: 'Email is required' };
  }

  const trimmedEmail = email.trim().toLowerCase();
  
  if (trimmedEmail.length === 0) {
    return { isValid: false, error: 'Email cannot be empty' };
  }

  if (trimmedEmail.length > 320) {
    return { isValid: false, error: 'Email is too long' };
  }

  const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
  
  if (!emailRegex.test(trimmedEmail)) {
    return { isValid: false, error: 'Invalid email format' };
  }

  return { isValid: true, sanitized: trimmedEmail };
};

export const validatePassword = (password: string): ValidationResult => {
  if (!password || typeof password !== 'string') {
    return { isValid: false, error: 'Password is required' };
  }

  if (password.length < 8) {
    return { isValid: false, error: 'Password must be at least 8 characters long' };
  }

  if (password.length > 128) {
    return { isValid: false, error: 'Password is too long (max 128 characters)' };
  }

  const hasUpperCase = /[A-Z]/.test(password);
  const hasLowerCase = /[a-z]/.test(password);
  const hasNumbers = /\d/.test(password);
  const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

  const strengthChecks = [hasUpperCase, hasLowerCase, hasNumbers, hasSpecialChar];
  const strengthScore = strengthChecks.filter(Boolean).length;

  if (strengthScore < 3) {
    return { 
      isValid: false, 
      error: 'Password must contain at least 3 of: uppercase, lowercase, numbers, special characters' 
    };
  }

  return { isValid: true, sanitized: password };
};

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

export const logError = (error: Error, context?: Record<string, any>): void => {
  const errorInfo = {
    message: error.message,
    stack: error.stack,
    context,
    timestamp: new Date().toISOString(),
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

export const debounce = <T extends (...args: any[]) => void>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void => {
  let timeout: NodeJS.Timeout;

  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(null, args), wait);
  };
};

export class TTLCache<T> {
  private cache = new Map<string, { data: T; expiry: number }>();
  private readonly ttl: number;

  constructor(ttlMs: number = 5 * 60 * 1000) {
    this.ttl = ttlMs;
  }

  set(key: string, value: T): void {
    this.cache.set(key, {
      data: value,
      expiry: Date.now() + this.ttl,
    });
  }

  get(key: string): T | undefined {
    const item = this.cache.get(key);
    
    if (!item) {
      return undefined;
    }

    if (Date.now() > item.expiry) {
      this.cache.delete(key);
      return undefined;
    }

    return item.data;
  }

  delete(key: string): boolean {
    return this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }

  size(): number {
    const now = Date.now();
    for (const [key, item] of this.cache.entries()) {
      if (now > item.expiry) {
        this.cache.delete(key);
      }
    }
    
    return this.cache.size;
  }
}

export class RateLimiter {
  private attempts: Map<string, number[]> = new Map();
  private maxAttempts: number;
  private windowMs: number;

  constructor(maxAttempts: number = 5, windowMs: number = 60000) {
    this.maxAttempts = maxAttempts;
    this.windowMs = windowMs;
  }

  isAllowed(key: string): boolean {
    const now = Date.now();
    const attempts = this.attempts.get(key) || [];
    
    const validAttempts = attempts.filter(time => now - time < this.windowMs);
    this.attempts.set(key, validAttempts);

    return validAttempts.length < this.maxAttempts;
  }

  recordAttempt(key: string): void {
    const now = Date.now();
    const attempts = this.attempts.get(key) || [];
    attempts.push(now);
    this.attempts.set(key, attempts);
  }
}

export const createLazyComponent = (
  loader: () => Promise<{ default: React.ComponentType<any> }>
) => {
  return React.lazy(loader);
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
      code: 'UNKNOWN_ERROR',
      message: getErrorMessage(error),
      timestamp: new Date(),
      severity: 'medium'
    };
    return { error: appError, data: fallback };
  }
};
