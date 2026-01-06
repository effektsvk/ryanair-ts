import { HttpError } from './errors.js';

/**
 * Base URL for establishing session cookies
 */
const BASE_SITE_FOR_SESSION_URL = 'https://www.ryanair.com/ie/en';

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
      headers: {
        Cookie: this.formatCookieHeader(),
        Accept: 'application/json',
        'User-Agent': 'ryanair-ts/1.0.0',
      },
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
