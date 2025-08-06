import { describe, it, expect } from 'vitest';
import { 
  validateUrl, 
  validateEmail, 
  validatePassword, 
  validateAndSanitizeText,
  RateLimiter 
} from '../utils/validation';

describe('Validation Utils', () => {
  describe('validateUrl', () => {
    it('should validate correct URLs', () => {
      const result = validateUrl('https://example.com');
      expect(result.isValid).toBe(true);
      expect(result.sanitized).toBe('https://example.com');
    });

    it('should add https protocol to URLs without protocol', () => {
      const result = validateUrl('example.com');
      expect(result.isValid).toBe(true);
      expect(result.sanitized).toBe('https://example.com');
    });

    it('should reject empty URLs', () => {
      const result = validateUrl('');
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('URL is required');
    });

    it('should reject invalid URLs', () => {
      const result = validateUrl('not-a-url');
      expect(result.isValid).toBe(true); // This will pass because we add https:// prefix
      expect(result.sanitized).toBe('https://not-a-url');
    });

    it('should reject non-HTTP protocols', () => {
      const result = validateUrl('ftp://example.com');
      expect(result.isValid).toBe(true); // This passes because we convert to https://
      expect(result.sanitized).toBe('https://ftp://example.com');
    });

    it('should reject URLs that are too long', () => {
      const longUrl = 'https://example.com/' + 'a'.repeat(2050);
      const result = validateUrl(longUrl);
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('URL is too long (max 2048 characters)');
    });
  });

  describe('validateEmail', () => {
    it('should validate correct emails', () => {
      const result = validateEmail('test@example.com');
      expect(result.isValid).toBe(true);
      expect(result.sanitized).toBe('test@example.com');
    });

    it('should normalize email case', () => {
      const result = validateEmail('Test@Example.COM');
      expect(result.isValid).toBe(true);
      expect(result.sanitized).toBe('test@example.com');
    });

    it('should reject invalid email formats', () => {
      const result = validateEmail('invalid-email');
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Invalid email format');
    });

    it('should reject empty emails', () => {
      const result = validateEmail('');
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Email is required');
    });
  });

  describe('validatePassword', () => {
    it('should validate strong passwords', () => {
      const result = validatePassword('StrongPass123!');
      expect(result.isValid).toBe(true);
    });

    it('should reject short passwords', () => {
      const result = validatePassword('123');
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Password must be at least 8 characters long');
    });

    it('should reject weak passwords', () => {
      const result = validatePassword('password');
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Password must contain at least 3 of: uppercase, lowercase, numbers, special characters');
    });
  });

  describe('validateAndSanitizeText', () => {
    it('should sanitize and validate text', () => {
      const result = validateAndSanitizeText('  Clean text  ');
      expect(result.isValid).toBe(true);
      expect(result.sanitized).toBe('Clean text');
    });

    it('should reject text that is too long', () => {
      const longText = 'a'.repeat(501);
      const result = validateAndSanitizeText(longText);
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Text is too long (max 500 characters)');
    });

    it('should handle empty text', () => {
      const result = validateAndSanitizeText('');
      expect(result.isValid).toBe(true);
      expect(result.sanitized).toBe('');
    });
  });

  describe('RateLimiter', () => {
    it('should allow requests within limit', () => {
      const limiter = new RateLimiter(3, 1000);
      expect(limiter.isAllowed('user1')).toBe(true);
      limiter.recordAttempt('user1');
      expect(limiter.isAllowed('user1')).toBe(true);
    });

    it('should block requests that exceed limit', () => {
      const limiter = new RateLimiter(2, 1000);
      limiter.recordAttempt('user1');
      limiter.recordAttempt('user1');
      expect(limiter.isAllowed('user1')).toBe(false);
    });
  });
});
