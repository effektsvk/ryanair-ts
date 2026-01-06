import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { withRetry, setRetryTestMode, getRetryTestMode, DEFAULT_RETRY_CONFIG } from '../src/retry.js';
import { RetryError } from '../src/errors.js';

describe('retry', () => {
  beforeEach(() => {
    // Ensure test mode is enabled for fast tests
    setRetryTestMode(true);
  });

  afterEach(() => {
    setRetryTestMode(true);
  });

  describe('withRetry', () => {
    it('should return result on first success', async () => {
      const fn = vi.fn().mockResolvedValue('success');

      const result = await withRetry(fn);

      expect(result).toBe('success');
      expect(fn).toHaveBeenCalledTimes(1);
    });

    it('should retry on failure and succeed', async () => {
      const fn = vi
        .fn()
        .mockRejectedValueOnce(new Error('fail 1'))
        .mockRejectedValueOnce(new Error('fail 2'))
        .mockResolvedValue('success');

      const result = await withRetry(fn);

      expect(result).toBe('success');
      expect(fn).toHaveBeenCalledTimes(3);
    });

    it('should throw RetryError after max retries', async () => {
      const fn = vi.fn().mockRejectedValue(new Error('always fails'));

      await expect(withRetry(fn, { maxRetries: 3 })).rejects.toThrow(RetryError);
      expect(fn).toHaveBeenCalledTimes(3);
    });

    it('should include attempt count in RetryError', async () => {
      const fn = vi.fn().mockRejectedValue(new Error('test error'));

      try {
        await withRetry(fn, { maxRetries: 4 });
        expect.fail('Should have thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(RetryError);
        expect((error as RetryError).attempts).toBe(4);
        expect((error as RetryError).lastError.message).toBe('test error');
      }
    });

    it('should log warnings on retry', async () => {
      const fn = vi
        .fn()
        .mockRejectedValueOnce(new Error('fail'))
        .mockResolvedValue('success');

      const logger = {
        debug: vi.fn(),
        info: vi.fn(),
        warn: vi.fn(),
        error: vi.fn(),
      };

      await withRetry(fn, {}, logger);

      expect(logger.warn).toHaveBeenCalledTimes(1);
      expect(logger.warn).toHaveBeenCalledWith(
        expect.stringContaining('Attempt 1 failed')
      );
    });

    it('should log error on final failure', async () => {
      const fn = vi.fn().mockRejectedValue(new Error('always fails'));

      const logger = {
        debug: vi.fn(),
        info: vi.fn(),
        warn: vi.fn(),
        error: vi.fn(),
      };

      await expect(withRetry(fn, { maxRetries: 2 }, logger)).rejects.toThrow();

      expect(logger.error).toHaveBeenCalledTimes(1);
      expect(logger.error).toHaveBeenCalledWith(
        expect.stringContaining('Gave up retrying')
      );
    });

    it('should use default config values', () => {
      expect(DEFAULT_RETRY_CONFIG.maxRetries).toBe(5);
      expect(DEFAULT_RETRY_CONFIG.baseDelay).toBe(1000);
      expect(DEFAULT_RETRY_CONFIG.maxDelay).toBe(30000);
      expect(DEFAULT_RETRY_CONFIG.jitter).toBe(0.1);
    });
  });

  describe('test mode', () => {
    it('should track test mode state', () => {
      setRetryTestMode(true);
      expect(getRetryTestMode()).toBe(true);

      setRetryTestMode(false);
      expect(getRetryTestMode()).toBe(false);

      // Reset for other tests
      setRetryTestMode(true);
    });
  });
});
