import { Ryanair } from '../src/ryanair.js';

const MS_PER_DAY = 24 * 60 * 60 * 1000;
const RYANAIR_WEB_USER_AGENT =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 ' +
  '(KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36';
const RYANAIR_WEB_CLIENT_VERSION_FALLBACK = '3.199.1';

function isoDateDaysFromNow(days: number): string {
  return new Date(Date.now() + days * MS_PER_DAY).toISOString().slice(0, 10);
}

function buildUrl(baseUrl: string, params: Record<string, string>): string {
  const url = new URL(baseUrl);
  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, value);
  }
  return url.toString();
}

function errorSummary(error: unknown): Record<string, unknown> {
  const outer = error as {
    name?: string;
    message?: string;
    lastError?: {
      name?: string;
      message?: string;
      status?: number;
      statusText?: string;
      body?: string;
    };
  };
  const root = outer.lastError ?? outer;

  return {
    ok: false,
    errorName: outer.name,
    message: outer.message,
    causeName: outer.lastError?.name,
    causeMessage: outer.lastError?.message,
    status: root.status,
    statusText: root.statusText,
    bodyPreview: root.body?.slice(0, 1000),
  };
}

function parseCookieHeader(setCookieHeader: string | null): string {
  if (!setCookieHeader) {
    return '';
  }

  return setCookieHeader
    .split(/,(?=[^,]*=)/)
    .map((part) => part.trim().split(';')[0])
    .filter((part) => part.includes('='))
    .join('; ');
}

async function fetchRyanairSiteCookie(): Promise<string> {
  const response = await fetch('https://www.ryanair.com/ie/en', {
    method: 'GET',
    redirect: 'follow',
    headers: {
      Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      'User-Agent': RYANAIR_WEB_USER_AGENT,
    },
  });

  return parseCookieHeader(response.headers.get('set-cookie'));
}

async function resolveRyanairWebClientVersion(selectPageUrl: string): Promise<string> {
  try {
    const response = await fetch(selectPageUrl, {
      method: 'GET',
      redirect: 'follow',
      headers: {
        Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'User-Agent': RYANAIR_WEB_USER_AGENT,
      },
    });
    const html = await response.text();
    const assetPath = html.match(/(?:src|href)="([^"]*\/flightselect_dist\/desktop\/main\.[^"]+\.js[^"]*)"/)?.[1];

    if (!assetPath) {
      return RYANAIR_WEB_CLIENT_VERSION_FALLBACK;
    }

    const assetUrl = new URL(assetPath, selectPageUrl);
    const assetResponse = await fetch(assetUrl, {
      method: 'GET',
      headers: {
        Accept: 'application/javascript,*/*;q=0.8',
        'User-Agent': RYANAIR_WEB_USER_AGENT,
      },
    });
    const asset = await assetResponse.text();

    return (
      asset.match(/const\s+\w+="(\d+\.\d+\.\d+)"/)?.[1] ??
      RYANAIR_WEB_CLIENT_VERSION_FALLBACK
    );
  } catch {
    return RYANAIR_WEB_CLIENT_VERSION_FALLBACK;
  }
}

async function runProbe<T>(label: string, probe: () => Promise<T>): Promise<boolean> {
  console.log(`\n=== ${label} ===`);

  try {
    const result = await probe();
    const resultOk =
      typeof result === 'object' &&
      result !== null &&
      'ok' in result &&
      (result as { ok?: unknown }).ok === false
        ? false
        : true;

    console.log(JSON.stringify({ ok: resultOk, ...result }, null, 2));
    return resultOk;
  } catch (error) {
    console.log(JSON.stringify(errorSummary(error), null, 2));
    return false;
  }
}

async function fetchStatus(
  url: string,
  headers: Record<string, string> = {
    Accept: 'application/json',
    'User-Agent': 'ryanair-ts-live-probe/1.0',
  }
): Promise<Record<string, unknown>> {
  const response = await fetch(url, {
    method: 'GET',
    headers,
  });
  const body = await response.text();

  return {
    ok: response.ok,
    url,
    status: response.status,
    statusText: response.statusText,
    contentType: response.headers.get('content-type'),
    bodyPreview: body.slice(0, 1000),
  };
}

function createClient(): Ryanair {
  return new Ryanair({
    currency: process.env.CURRENCY ?? 'EUR',
    retry: {
      maxRetries: 1,
      baseDelay: 0,
      maxDelay: 0,
      jitter: 0,
    },
    logger: {
      debug: () => undefined,
      info: () => undefined,
      warn: () => undefined,
      error: () => undefined,
    },
  });
}

const dateOut = process.env.DATE_OUT ?? isoDateDaysFromNow(30);
const dateIn = process.env.DATE_IN ?? isoDateDaysFromNow(35);
const origin = process.env.ORIGIN ?? 'STN';
const destination = process.env.DESTINATION ?? 'BTS';
const cheapestOrigin = process.env.CHEAPEST_ORIGIN ?? 'DUB';
const requireAvailabilityFlights = process.env.REQUIRE_AVAILABILITY_FLIGHTS === 'true';
const availabilityOnly = process.env.AVAILABILITY_ONLY === 'true';

const oneWayUrl = buildUrl('https://services-api.ryanair.com/farfnd/v4/oneWayFares', {
  departureAirportIataCode: cheapestOrigin,
  outboundDepartureDateFrom: dateOut,
  outboundDepartureDateTo: dateOut,
  outboundDepartureTimeFrom: '00:00',
  outboundDepartureTimeTo: '23:59',
  currency: process.env.CURRENCY ?? 'EUR',
});

const availabilityUrl = buildUrl('https://www.ryanair.com/api/booking/v4/en-gb/availability', {
  ADT: '1',
  TEEN: '0',
  CHD: '0',
  INF: '0',
  DateIn: '',
  DateOut: dateOut,
  Destination: destination,
  Origin: origin,
  Disc: '0',
  promoCode: '',
  IncludeConnectingFlights: 'false',
  IncludePrimeFares: 'false',
  FlexDaysBeforeOut: '0',
  FlexDaysOut: '0',
  FlexDaysBeforeIn: '0',
  FlexDaysIn: '0',
  RoundTrip: 'false',
  ToUs: 'AGREED',
});
const availabilityReferer = buildUrl('https://www.ryanair.com/ie/en/trip/flights/select', {
  adults: '1',
  teens: '0',
  children: '0',
  infants: '0',
  dateOut,
  dateIn: '',
  originIata: origin,
  destinationIata: destination,
  isConnectedFlight: 'false',
  isReturn: 'false',
  discount: '0',
  promoCode: '',
});

const availabilityCookie = await fetchRyanairSiteCookie();
const ryanairWebClientVersion = await resolveRyanairWebClientVersion(availabilityReferer);

console.log(
  JSON.stringify(
    {
      dateOut,
      dateIn,
      origin,
      destination,
      cheapestOrigin,
      requireAvailabilityFlights,
      availabilityOnly,
      ryanairWebClientVersion,
      currency: process.env.CURRENCY ?? 'EUR',
    },
    null,
    2
  )
);

const results = [];

if (!availabilityOnly) {
  results.push(await runProbe('direct farfnd oneWayFares GET', () => fetchStatus(oneWayUrl)));
}
results.push(
  await runProbe('direct booking availability GET', () =>
    fetchStatus(availabilityUrl, {
      Cookie: availabilityCookie,
      Accept: 'application/json, text/plain, */*',
      'User-Agent': RYANAIR_WEB_USER_AGENT,
      client: 'desktop',
      'client-version': ryanairWebClientVersion,
      Referer: availabilityReferer,
    })
  )
);
if (!availabilityOnly) {
  results.push(
    await runProbe('client getCheapestFlights()', async () => {
      const flights = await createClient().getCheapestFlights({
        airport: cheapestOrigin,
        dateFrom: dateOut,
        dateTo: dateOut,
      });
      return {
        count: flights.length,
        sample: flights[0] ?? null,
      };
    })
  );
  results.push(
    await runProbe('client getCheapestReturnFlights()', async () => {
      const trips = await createClient().getCheapestReturnFlights({
        sourceAirport: cheapestOrigin,
        dateFrom: dateOut,
        dateTo: dateOut,
        returnDateFrom: dateIn,
        returnDateTo: dateIn,
      });
      return {
        count: trips.length,
        sample: trips[0] ?? null,
      };
    })
  );
}
results.push(
  await runProbe('client getFlights() availability', async () => {
    const flights = await createClient().getFlights({
      origin,
      destination,
      dateOut,
    });
    if (requireAvailabilityFlights && flights.length === 0) {
      return {
        ok: false,
        count: 0,
        message: `No availability flights returned for ${origin} -> ${destination} on ${dateOut}`,
        sample: null,
      };
    }
    return {
      count: flights.length,
      sample: flights[0] ?? null,
    };
  })
);

if (results.some((ok) => !ok)) {
  process.exitCode = 1;
}
