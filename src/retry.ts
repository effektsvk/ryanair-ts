import type { Logger, RetryConfig } from './types.js';
import { RetryError } from './errors.js';

/**
 * Default retry configuration
 */
export const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxRetries: 5,
  baseDelay: 1000,
  maxDelay: 30000,
  jitter: 0.1,
};

/**
 * Global test mode flag - when true, retries happen instantly without delays
 */
let testMode = false;

/**
 * Enable or disable test mode for retry logic.
 * In test mode, retries happen instantly without delays.
 * @param enabled - Whether to enable test mode
 */
export function setRetryTestMode(enabled: boolean): void {
  testMode = enabled;
}

/**
 * Get the current test mode state
 */
export function getRetryTestMode(): boolean {
  return testMode;
}

/**
 * Sleep for a specified duration
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Calculate delay with exponential backoff and optional jitter
 */
function calculateDelay(attempt: number, config: RetryConfig): number {
  if (testMode) {
    return 0;
  }

  // Exponential backoff: baseDelay * 2^(attempt-1)
  const exponentialDelay = config.baseDelay * Math.pow(2, attempt - 1);
  const cappedDelay = Math.min(exponentialDelay, config.maxDelay);

  // Add jitter to prevent thundering herd
  const jitterRange = cappedDelay * config.jitter;
  const jitter = (Math.random() - 0.5) * 2 * jitterRange;

  return Math.max(0, Math.round(cappedDelay + jitter));
}

/**
 * Execute a function with retry logic using exponential backoff.
 *
 * @param fn - The async function to execute
 * @param config - Retry configuration (uses defaults if not provided)
 * @param logger - Optional logger for retry messages
 * @returns The result of the function
 * @throws RetryError if all retry attempts are exhausted
 *
 * @example
 * ```ts
 * const result = await withRetry(
 *   () => fetch('https://api.example.com/data'),
 *   { maxRetries: 3 }
 * );
 * ```
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  config: Partial<RetryConfig> = {},
  logger?: Logger
): Promise<T> {
  const effectiveConfig: RetryConfig = {
    ...DEFAULT_RETRY_CONFIG,
    ...config,
  };

  let lastError: Error | undefined;

  for (let attempt = 1; attempt <= effectiveConfig.maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      if (attempt === effectiveConfig.maxRetries) {
        logger?.error(`Gave up retrying after ${attempt} attempts, last exception was ${lastError.message}`);
        throw new RetryError(
          `Failed after ${attempt} attempts: ${lastError.message}`,
          attempt,
          lastError
        );
      }

      const delay = calculateDelay(attempt, effectiveConfig);
      logger?.warn(`Attempt ${attempt} failed, retrying in ${delay}ms: ${lastError.message}`);

      await sleep(delay);
    }
  }

  // This should be unreachable, but TypeScript needs it for type safety
  throw new RetryError(
    `Failed after ${effectiveConfig.maxRetries} attempts`,
    effectiveConfig.maxRetries,
    lastError ?? new Error('Unknown error')
  );
}
