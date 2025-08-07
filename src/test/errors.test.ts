import { describe, it, expect, vi } from 'vitest';
import { 
  BookmarkError, 
  getErrorMessage, 
  withRetry,
  safeAsync
} from '../utils';

describe('Error Utils', () => {
  describe('BookmarkError', () => {
    it('should create error with correct properties', () => {
      const error = new BookmarkError('TEST_CODE', 'Test message', 'high');
      expect(error.code).toBe('TEST_CODE');
      expect(error.message).toBe('Test message');
      expect(error.severity).toBe('high');
      expect(error.timestamp).toBeInstanceOf(Date);
    });

    it('should convert to AppError', () => {
      const error = new BookmarkError('TEST_CODE', 'Test message');
      const appError = error.toAppError();
      expect(appError.code).toBe('TEST_CODE');
      expect(appError.message).toBe('Test message');
      expect(appError.severity).toBe('medium');
    });
  });

  describe('getErrorMessage', () => {
    it('should handle BookmarkError', () => {
      const error = new BookmarkError('TEST_CODE', 'Test message');
      expect(getErrorMessage(error)).toBe('Test message');
    });

    it('should handle generic Error', () => {
      const error = new Error('Generic error');
      expect(getErrorMessage(error)).toBe('Generic error');
    });

    it('should handle string errors', () => {
      expect(getErrorMessage('String error')).toBe('String error');
    });

    it('should handle unknown errors', () => {
      expect(getErrorMessage(null)).toBe('An unexpected error occurred');
    });

    it('should map Supabase auth errors', () => {
      const error = new Error('Invalid login credentials');
      expect(getErrorMessage(error)).toBe('Invalid email or password');
    });
  });

  describe('safeAsync', () => {
    it('should return data on success', async () => {
      const result = await safeAsync(() => Promise.resolve('success'));
      expect(result.data).toBe('success');
      expect(result.error).toBeUndefined();
    });

    it('should return error on failure', async () => {
      const result = await safeAsync(() => Promise.reject(new Error('Failed')));
      expect(result.data).toBeUndefined();
      expect(result.error).toBeDefined();
      expect(result.error?.message).toBe('Failed');
    });

    it('should return fallback on error', async () => {
      const result = await safeAsync(() => Promise.reject(new Error('Failed')), 'fallback');
      expect(result.data).toBe('fallback');
      expect(result.error).toBeDefined();
    });
  });

  describe('withRetry', () => {
    it('should succeed on first try', async () => {
      const fn = vi.fn().mockResolvedValue('success');
      const result = await withRetry(fn, 3);
      expect(result).toBe('success');
      expect(fn).toHaveBeenCalledTimes(1);
    });

    it('should retry on failure and eventually succeed', async () => {
      const fn = vi.fn()
        .mockRejectedValueOnce(new Error('Fail 1'))
        .mockRejectedValueOnce(new Error('Fail 2'))
        .mockResolvedValue('success');
      
      const result = await withRetry(fn, 3, 1);
      expect(result).toBe('success');
      expect(fn).toHaveBeenCalledTimes(3);
    });

    it('should throw after max retries', async () => {
      const fn = vi.fn().mockRejectedValue(new Error('Always fails'));
      
      await expect(withRetry(fn, 2, 1)).rejects.toThrow('Always fails');
      expect(fn).toHaveBeenCalledTimes(2);
    });
  });
});
