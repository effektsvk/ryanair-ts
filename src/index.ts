/**
 * ryanair-ts - TypeScript client for Ryanair flight search API
 *
 * @example
 * ```ts
 * import { Ryanair } from 'ryanair-ts';
 *
 * const api = new Ryanair({ currency: 'EUR' });
 *
 * // Search for one-way flights from Dublin
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
 *
 * @packageDocumentation
 */

// Main client
export { Ryanair } from './ryanair.js';

// Types
export type {
  Flight,
  Trip,
  Airport,
  Logger,
  RetryConfig,
  RyanairConfig,
  OneWayFlightOptions,
  ReturnFlightOptions,
} from './types.js';

// Errors
export { RyanairError, HttpError, RetryError } from './errors.js';

// Airport utilities (tree-shakeable)
export {
  loadAirports,
  getAirportsSync,
  clearAirportsCache,
  getFlightDistance,
  getDistanceBetweenAirports,
} from './airport-utils.js';

// Distance calculation utility
export { haversine } from './utils/haversine.js';

// Retry utilities (for advanced usage)
export { setRetryTestMode, getRetryTestMode, DEFAULT_RETRY_CONFIG } from './retry.js';
