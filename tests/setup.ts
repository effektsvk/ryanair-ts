import { beforeAll, afterAll, afterEach } from 'vitest';
import { setupServer } from 'msw/node';
import { http, HttpResponse } from 'msw';
import { setRetryTestMode } from '../src/retry.js';

// Default handlers (can be overridden in individual tests)
export const handlers = [
  // Session initialization handler
  http.get('https://www.ryanair.com/ie/en', () => {
    return new HttpResponse(null, {
      status: 200,
      headers: {
        'Set-Cookie': 'rid=test-session-id; Path=/',
      },
    });
  }),
];

export const server = setupServer(...handlers);

beforeAll(() => {
  // Start MSW server
  server.listen({ onUnhandledRequest: 'error' });
  // Enable test mode for retry (instant retries)
  setRetryTestMode(true);
});

afterEach(() => {
  // Reset handlers after each test
  server.resetHandlers();
});

afterAll(() => {
  // Clean up
  server.close();
  setRetryTestMode(false);
});
