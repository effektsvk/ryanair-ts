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
  http.get('https://www.ryanair.com/ie/en/trip/flights/select', () => {
    return HttpResponse.html(
      '<html><script src="/flightselect_dist/desktop/main.test.js"></script></html>'
    );
  }),
  http.get('https://www.ryanair.com/flightselect_dist/desktop/main.test.js', () => {
    return new HttpResponse('const version="3.250.0";', {
      headers: {
        'Content-Type': 'application/javascript',
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
