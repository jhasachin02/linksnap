/**
 * URL and input validation utilities
 * Provides security checks and validation for user inputs
 */

import DOMPurify from 'isomorphic-dompurify';

export interface ValidationResult {
  isValid: boolean;
  error?: string;
  sanitized?: string;
}

/**
 * Validates and sanitizes URLs to prevent XSS and ensure proper format
 */
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
      'localhost',
      '127.0.0.1',
      '::1',
      /^192\.168\./,
      /^10\./,
      /^172\.(1[6-9]|2[0-9]|3[0-1])\./
    ];

    const isPrivate = privatePatterns.some(pattern => {
      if (typeof pattern === 'string') {
        return hostname === pattern;
      }
      return pattern.test(hostname);
    });

    if (isPrivate && process.env.NODE_ENV === 'production') {
      return { isValid: false, error: 'Private/local URLs are not allowed' };
    }

    return { 
      isValid: true, 
      sanitized: normalizedUrl 
    };

  } catch (error) {
    return { isValid: false, error: 'Invalid URL format' };
  }
};

/**
 * Validates and sanitizes text input to prevent XSS
 */
export const validateAndSanitizeText = (text: string, maxLength = 500): ValidationResult => {
  if (!text || typeof text !== 'string') {
    return { isValid: true, sanitized: '' };
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

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(trimmedEmail)) {
    return { isValid: false, error: 'Invalid email format' };
  }

  if (trimmedEmail.length > 254) {
    return { isValid: false, error: 'Email is too long' };
  }

  return { isValid: true, sanitized: trimmedEmail };
};

/**
 * Validates password strength
 */
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

export class RateLimiter {
  private attempts: Map<string, number[]> = new Map();
  private readonly maxAttempts: number;
  private readonly windowMs: number;

  constructor(maxAttempts = 5, windowMs = 60000) {
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
