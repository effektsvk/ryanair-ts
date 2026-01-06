/**
 * Base error class for Ryanair API errors
 */
export class RyanairError extends Error {
  constructor(message: string) {
    super(`Ryanair API: ${message}`);
    this.name = 'RyanairError';
    // Maintains proper stack trace for where the error was thrown (V8 only)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, RyanairError);
    }
  }
}

/**
 * HTTP error from API requests
 */
export class HttpError extends RyanairError {
  constructor(
    public readonly status: number,
    public readonly statusText: string,
    public readonly body?: string
  ) {
    super(`HTTP ${status}: ${statusText}`);
    this.name = 'HttpError';
  }
}

/**
 * Error thrown when retry attempts are exhausted
 */
export class RetryError extends RyanairError {
  constructor(
    message: string,
    public readonly attempts: number,
    public readonly lastError: Error
  ) {
    super(message);
    this.name = 'RetryError';
  }
}
