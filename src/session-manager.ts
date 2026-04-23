import { HttpError } from './errors.js';

/**
 * Base URL for establishing session cookies
 */
const BASE_SITE_FOR_SESSION_URL = 'https://www.ryanair.com/ie/en';

/**
 * Ryanair's booking APIs currently require the same client hints used by
 * their web frontend, in addition to a fresh site cookie.
 */
const RYANAIR_WEB_USER_AGENT =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 ' +
  '(KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36';

const RYANAIR_WEB_CLIENT_VERSION = '3.194.0';

/**
 * Parse Set-Cookie header(s) and extract cookie name-value pairs
 */
function parseCookies(setCookieHeader: string | null): Map<string, string> {
  const cookies = new Map<string, string>();

  if (!setCookieHeader) {
    return cookies;
  }

  // Split by comma, but be careful of dates which also contain commas
  // Set-Cookie headers are typically joined by newlines in Node.js
  const parts = setCookieHeader.split(/,(?=[^,]*=)/);

  for (const part of parts) {
    const trimmed = part.trim();
    if (!trimmed) continue;

    // Get just the name=value part (before any ;)
    const cookiePart = trimmed.split(';')[0];
    if (!cookiePart) continue;

    const eqIndex = cookiePart.indexOf('=');
    if (eqIndex > 0) {
      const name = cookiePart.substring(0, eqIndex).trim();
      const value = cookiePart.substring(eqIndex + 1).trim();
      cookies.set(name, value);
    }
  }

  return cookies;
}

/**
 * Manages HTTP sessions with Ryanair API, handling cookies automatically.
 */
export class SessionManager {
  private cookies: Map<string, string> = new Map();
  private initialized = false;

  /**
   * Initialize the session by visiting the Ryanair website to obtain cookies.
   * This is called automatically on the first request if not already done.
   */
  async initialize(): Promise<void> {
    if (this.initialized) {
      return;
    }

    const response = await fetch(BASE_SITE_FOR_SESSION_URL, {
      method: 'GET',
      redirect: 'follow',
      headers: {
        Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'User-Agent': RYANAIR_WEB_USER_AGENT,
      },
    });

    // Extract cookies from response
    const setCookie = response.headers.get('set-cookie');
    const newCookies = parseCookies(setCookie);
    for (const [name, value] of newCookies) {
      this.cookies.set(name, value);
    }

    this.initialized = true;
  }

  /**
   * Format cookies for the Cookie header
   */
  private formatCookieHeader(): string {
    return Array.from(this.cookies.entries())
      .map(([name, value]) => `${name}=${value}`)
      .join('; ');
  }

  /**
   * Build URL with query parameters
   */
  private buildUrl(base: string, params?: Record<string, string | number | undefined>): string {
    if (!params) {
      return base;
    }

    const url = new URL(base);
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined) {
        url.searchParams.set(key, String(value));
      }
    }
    return url.toString();
  }

  /**
   * Build headers for Ryanair web API calls.
   */
  private buildHeaders(
    baseUrl: string,
    params?: Record<string, string | number | undefined>
  ): Record<string, string> {
    const headers: Record<string, string> = {
      Cookie: this.formatCookieHeader(),
      Accept: 'application/json',
      'User-Agent': 'ryanair-ts/1.0.0',
    };

    const requestUrl = new URL(baseUrl);
    if (requestUrl.hostname !== 'www.ryanair.com') {
      return headers;
    }

    headers.Accept = 'application/json, text/plain, */*';
    headers['User-Agent'] = RYANAIR_WEB_USER_AGENT;

    if (requestUrl.pathname.includes('/api/booking/')) {
      headers.client = 'desktop';
      headers['client-version'] = RYANAIR_WEB_CLIENT_VERSION;

      const origin = params?.Origin;
      const destination = params?.Destination;
      const dateOut = params?.DateOut;

      if (origin && destination && dateOut) {
        const referer = new URL(`${BASE_SITE_FOR_SESSION_URL}/trip/flights/select`);
        referer.searchParams.set('adults', String(params.ADT ?? 1));
        referer.searchParams.set('teens', String(params.TEEN ?? 0));
        referer.searchParams.set('children', String(params.CHD ?? 0));
        referer.searchParams.set('infants', String(params.INF ?? 0));
        referer.searchParams.set('dateOut', String(dateOut));
        referer.searchParams.set('dateIn', String(params.DateIn ?? ''));
        referer.searchParams.set('originIata', String(origin));
        referer.searchParams.set('destinationIata', String(destination));
        referer.searchParams.set('isConnectedFlight', String(params.IncludeConnectingFlights ?? false));
        referer.searchParams.set('isReturn', String(params.RoundTrip ?? false));
        referer.searchParams.set('discount', String(params.Disc ?? 0));
        referer.searchParams.set('promoCode', String(params.promoCode ?? ''));
        headers.Referer = referer.toString();
      } else {
        headers.Referer = BASE_SITE_FOR_SESSION_URL;
      }
    }

    return headers;
  }

  /**
   * Make a GET request with session cookies
   * @param url - The URL to request
   * @param params - Optional query parameters
   * @returns Parsed JSON response
   */
  async get<T>(url: string, params?: Record<string, string | number | undefined>): Promise<T> {
    // Ensure session is initialized
    await this.initialize();

    const fullUrl = this.buildUrl(url, params);

    const response = await fetch(fullUrl, {
      method: 'GET',
      headers: this.buildHeaders(url, params),
    });

    // Update cookies from response
    const setCookie = response.headers.get('set-cookie');
    if (setCookie) {
      const newCookies = parseCookies(setCookie);
      for (const [name, value] of newCookies) {
        this.cookies.set(name, value);
      }
    }

    if (!response.ok) {
      const body = await response.text().catch(() => undefined);
      throw new HttpError(response.status, response.statusText, body);
    }

    return (await response.json()) as T;
  }

  /**
   * Reset the session, clearing all cookies
   */
  reset(): void {
    this.cookies.clear();
    this.initialized = false;
  }
}
