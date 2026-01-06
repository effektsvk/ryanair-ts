import type {
  Flight,
  FlightDetails,
  Trip,
  Logger,
  RyanairConfig,
  RetryConfig,
  OneWayFlightOptions,
  ReturnFlightOptions,
  GetFlightsOptions,
  RyanairApiResponse,
  ApiFare,
  ApiFlight,
  AvailabilityApiResponse,
} from './types.js';
import { SessionManager } from './session-manager.js';
import { withRetry, DEFAULT_RETRY_CONFIG } from './retry.js';
import { formatDate, formatTime, parseISODate } from './utils/date-formatter.js';

/**
 * Base URL for Ryanair's fare finder API
 */
const API_BASE_URL = 'https://services-api.ryanair.com/farfnd/v4';

/**
 * Base URL for Ryanair's booking availability API
 */
const AVAILABILITY_API_URL = 'https://www.ryanair.com/api/booking/v4/en-gb/availability';

/**
 * Default console logger implementation
 */
const defaultLogger: Logger = {
  debug: (msg, ...args) => console.debug(`[ryanair-ts] ${msg}`, ...args),
  info: (msg, ...args) => console.info(`[ryanair-ts] ${msg}`, ...args),
  warn: (msg, ...args) => console.warn(`[ryanair-ts] ${msg}`, ...args),
  error: (msg, ...args) => console.error(`[ryanair-ts] ${msg}`, ...args),
};

/**
 * Parse API flight response into a Flight object
 */
function parseFlightResponse(data: ApiFlight, expectedCurrency?: string, logger?: Logger): Flight {
  const currency = data.price.currencyCode;

  // Warn if currency doesn't match expected
  if (expectedCurrency && currency !== expectedCurrency) {
    logger?.warn(
      `Currency mismatch: requested ${expectedCurrency} but received ${currency}. ` +
        `This may be due to the API not supporting the requested currency.`
    );
  }

  // Format flight number with space (e.g., "FR504" -> "FR 504")
  const flightNumber = data.flightNumber.replace(/^([A-Z]{2})(\d+)$/, '$1 $2');

  return {
    departureTime: parseISODate(data.departureDate),
    flightNumber,
    price: data.price.value,
    currency,
    origin: data.departureAirport.iataCode,
    originFull: `${data.departureAirport.name}, ${data.departureAirport.countryName}`,
    destination: data.arrivalAirport.iataCode,
    destinationFull: `${data.arrivalAirport.name}, ${data.arrivalAirport.countryName}`,
  };
}

/**
 * Ryanair API client for searching cheap flights.
 *
 * @example
 * ```ts
 * import { Ryanair } from 'ryanair-ts';
 *
 * const api = new Ryanair({ currency: 'EUR' });
 *
 * // Search for one-way flights
 * const flights = await api.getCheapestFlights({
 *   airport: 'DUB',
 *   dateFrom: '2024-03-01',
 *   dateTo: '2024-03-31',
 * });
 *
 * // Search for return flights
 * const trips = await api.getCheapestReturnFlights({
 *   sourceAirport: 'DUB',
 *   dateFrom: '2024-03-01',
 *   dateTo: '2024-03-15',
 *   returnDateFrom: '2024-03-16',
 *   returnDateTo: '2024-03-31',
 * });
 * ```
 */
export class Ryanair {
  private readonly currency?: string;
  private readonly logger: Logger;
  private readonly retryConfig: RetryConfig;
  private readonly session: SessionManager;
  private _numQueries = 0;

  /**
   * Create a new Ryanair API client.
   *
   * @param config - Configuration options
   * @param config.currency - Currency code for prices (e.g., "EUR", "GBP")
   * @param config.logger - Custom logger implementation
   * @param config.retry - Retry configuration options
   */
  constructor(config: RyanairConfig = {}) {
    this.currency = config.currency;
    this.logger = config.logger ?? defaultLogger;
    this.retryConfig = {
      ...DEFAULT_RETRY_CONFIG,
      ...config.retry,
    };
    this.session = new SessionManager();
  }

  /**
   * Number of API queries executed by this client instance.
   */
  get numQueries(): number {
    return this._numQueries;
  }

  /**
   * Execute an API query with retry logic.
   */
  private async query<T>(url: string, params: Record<string, string | number | undefined>): Promise<T> {
    return withRetry(
      async () => {
        this._numQueries++;
        return this.session.get<T>(url, params);
      },
      this.retryConfig,
      this.logger
    );
  }

  /**
   * Search for the cheapest one-way flights.
   *
   * Returns at most one flight per destination - the cheapest available
   * within the specified date range.
   *
   * @param options - Search options
   * @returns Array of Flight objects, sorted by price
   *
   * @example
   * ```ts
   * const flights = await api.getCheapestFlights({
   *   airport: 'DUB',
   *   dateFrom: '2024-03-01',
   *   dateTo: '2024-03-31',
   *   destinationCountry: 'ES',  // Optional: filter to Spain
   *   maxPrice: 50,              // Optional: max price filter
   * });
   *
   * for (const flight of flights) {
   *   console.log(`${flight.origin} -> ${flight.destination}: ${flight.price} ${flight.currency}`);
   * }
   * ```
   */
  async getCheapestFlights(options: OneWayFlightOptions): Promise<Flight[]> {
    const {
      airport,
      dateFrom,
      dateTo,
      destinationCountry,
      destinationAirport,
      departureTimeFrom = '00:00',
      departureTimeTo = '23:59',
      maxPrice,
      customParams = {},
    } = options;

    const params: Record<string, string | number | undefined> = {
      departureAirportIataCode: airport,
      outboundDepartureDateFrom: formatDate(dateFrom),
      outboundDepartureDateTo: formatDate(dateTo),
      outboundDepartureTimeFrom: formatTime(departureTimeFrom),
      outboundDepartureTimeTo: formatTime(departureTimeTo),
      currency: this.currency,
      arrivalCountryCode: destinationCountry,
      arrivalAirportIataCode: destinationAirport,
      priceValueTo: maxPrice,
      ...customParams,
    };

    const response = await this.query<RyanairApiResponse>(`${API_BASE_URL}/oneWayFares`, params);

    if (!response.fares) {
      return [];
    }

    return response.fares.map((fare) =>
      parseFlightResponse(fare.outbound, this.currency, this.logger)
    );
  }

  /**
   * Search for the cheapest return (round-trip) flights.
   *
   * Returns at most one trip per destination - the cheapest available
   * within the specified date ranges for outbound and inbound flights.
   *
   * @param options - Search options
   * @returns Array of Trip objects, sorted by total price
   *
   * @example
   * ```ts
   * const trips = await api.getCheapestReturnFlights({
   *   sourceAirport: 'DUB',
   *   dateFrom: '2024-03-01',
   *   dateTo: '2024-03-15',
   *   returnDateFrom: '2024-03-16',
   *   returnDateTo: '2024-03-31',
   *   destinationCountry: 'ES',  // Optional: filter to Spain
   * });
   *
   * for (const trip of trips) {
   *   console.log(`${trip.outbound.origin} <-> ${trip.outbound.destination}`);
   *   console.log(`Total: ${trip.totalPrice} ${trip.outbound.currency}`);
   * }
   * ```
   */
  async getCheapestReturnFlights(options: ReturnFlightOptions): Promise<Trip[]> {
    const {
      sourceAirport,
      dateFrom,
      dateTo,
      returnDateFrom,
      returnDateTo,
      destinationCountry,
      destinationAirport,
      outboundDepartureTimeFrom = '00:00',
      outboundDepartureTimeTo = '23:59',
      inboundDepartureTimeFrom = '00:00',
      inboundDepartureTimeTo = '23:59',
      maxPrice,
      customParams = {},
    } = options;

    const params: Record<string, string | number | undefined> = {
      departureAirportIataCode: sourceAirport,
      outboundDepartureDateFrom: formatDate(dateFrom),
      outboundDepartureDateTo: formatDate(dateTo),
      inboundDepartureDateFrom: formatDate(returnDateFrom),
      inboundDepartureDateTo: formatDate(returnDateTo),
      outboundDepartureTimeFrom: formatTime(outboundDepartureTimeFrom),
      outboundDepartureTimeTo: formatTime(outboundDepartureTimeTo),
      inboundDepartureTimeFrom: formatTime(inboundDepartureTimeFrom),
      inboundDepartureTimeTo: formatTime(inboundDepartureTimeTo),
      currency: this.currency,
      arrivalCountryCode: destinationCountry,
      arrivalAirportIataCode: destinationAirport,
      priceValueTo: maxPrice,
      ...customParams,
    };

    const response = await this.query<RyanairApiResponse>(`${API_BASE_URL}/roundTripFares`, params);

    if (!response.fares) {
      return [];
    }

    return response.fares
      .filter((fare): fare is ApiFare & { inbound: ApiFlight } => fare.inbound !== undefined)
      .map((fare) => {
        const outbound = parseFlightResponse(fare.outbound, this.currency, this.logger);
        const inbound = parseFlightResponse(fare.inbound, this.currency, this.logger);

        return {
          totalPrice: fare.summary.price.value,
          outbound,
          inbound,
        };
      });
  }

  /**
   * Get all available flights for a specific route on a given date.
   *
   * Unlike getCheapestFlights which returns only the cheapest flight per destination,
   * this method returns ALL flights available on the specified route and date.
   *
   * @param options - Search options
   * @returns Array of FlightDetails objects with extended information
   *
   * @example
   * ```ts
   * const flights = await api.getFlights({
   *   origin: 'STN',
   *   destination: 'BTS',
   *   dateOut: '2024-03-15',
   * });
   *
   * for (const flight of flights) {
   *   console.log(`${flight.flightNumber}: ${flight.departureTime} - ${flight.arrivalTime}`);
   *   console.log(`  Price: ${flight.price} ${flight.currency}`);
   *   console.log(`  Duration: ${flight.duration}`);
   *   console.log(`  Seats left: ${flight.seatsLeft}`);
   * }
   * ```
   */
  async getFlights(options: GetFlightsOptions): Promise<FlightDetails[]> {
    const {
      origin,
      destination,
      dateOut,
      adults = 1,
      teens = 0,
      children = 0,
      infants = 0,
      promoCode = '',
      includeConnectingFlights = false,
      flexDaysBefore = 0,
      flexDaysAfter = 0,
    } = options;

    const params: Record<string, string | number | undefined> = {
      ADT: adults,
      TEEN: teens,
      CHD: children,
      INF: infants,
      DateIn: '',
      DateOut: formatDate(dateOut),
      Destination: destination.toUpperCase(),
      Origin: origin.toUpperCase(),
      Disc: 0,
      promoCode,
      IncludeConnectingFlights: includeConnectingFlights.toString(),
      FlexDaysBeforeOut: flexDaysBefore,
      FlexDaysOut: flexDaysAfter,
      FlexDaysBeforeIn: 0,
      FlexDaysIn: 0,
      RoundTrip: 'false',
      ToUs: 'AGREED',
    };

    const response = await this.query<AvailabilityApiResponse>(AVAILABILITY_API_URL, params);

    const trips = response.trips;
    if (!trips || trips.length === 0) {
      return [];
    }

    const trip = trips[0];
    if (!trip) {
      return [];
    }

    const dates = trip.dates;
    if (!dates || dates.length === 0) {
      return [];
    }

    const dateEntry = dates[0];
    if (!dateEntry) {
      return [];
    }

    const flights = dateEntry.flights;
    if (!flights || flights.length === 0) {
      return [];
    }

    const currency = response.currency || this.currency || 'EUR';
    const originCode = trip.origin;
    const originName = trip.originName;
    const destinationCode = trip.destination;
    const destinationName = trip.destinationName;

    const results: FlightDetails[] = [];

    for (const flight of flights) {
      const fare = flight.regularFare?.fares?.[0];
      if (!fare) {
        continue;
      }

      results.push({
        departureTime: parseISODate(flight.time[0]),
        arrivalTime: parseISODate(flight.time[1]),
        flightNumber: flight.flightNumber,
        price: fare.amount,
        currency,
        origin: originCode,
        originFull: originName,
        destination: destinationCode,
        destinationFull: destinationName,
        duration: flight.duration,
        seatsLeft: flight.faresLeft,
        operatedBy: flight.operatedBy || 'Ryanair',
      });
    }

    return results;
  }
}
