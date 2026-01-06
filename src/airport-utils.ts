import type { Airport, Flight } from './types.js';
import { haversine } from './utils/haversine.js';

/**
 * Compact airport format from airports.json
 * @internal
 */
interface CompactAirport {
  /** IATA code */
  c: string;
  /** Latitude */
  a: number;
  /** Longitude */
  o: number;
  /** Location */
  l: string;
}

/**
 * Cache for loaded airport data
 */
let airportsCache: Map<string, Airport> | null = null;

/**
 * Load airports data from the bundled JSON file.
 * Data is cached after first load for subsequent calls.
 *
 * @returns Map of IATA codes to Airport objects
 *
 * @example
 * ```ts
 * const airports = await loadAirports();
 * const dublin = airports.get('DUB');
 * console.log(dublin?.location); // "IE-L,IE"
 * ```
 */
export async function loadAirports(): Promise<Map<string, Airport>> {
  if (airportsCache) {
    return airportsCache;
  }

  // Dynamic import to enable tree-shaking if airports not used
  // The path is relative to the compiled output location
  const dataModule = await import('../data/airports.json', {
    with: { type: 'json' },
  });

  const data = dataModule.default as CompactAirport[];

  airportsCache = new Map(
    data.map((a) => [
      a.c,
      {
        iataCode: a.c,
        lat: a.a,
        lng: a.o,
        location: a.l,
      } satisfies Airport,
    ])
  );

  return airportsCache;
}

/**
 * Get the airports map synchronously.
 * Only works if loadAirports() has been called previously.
 *
 * @returns Map of IATA codes to Airport objects
 * @throws Error if airports haven't been loaded yet
 */
export function getAirportsSync(): Map<string, Airport> {
  if (!airportsCache) {
    throw new Error('Airports not loaded. Call loadAirports() first.');
  }
  return airportsCache;
}

/**
 * Clear the airports cache.
 * Useful for testing or freeing memory.
 */
export function clearAirportsCache(): void {
  airportsCache = null;
}

/**
 * Calculate the distance of a flight in kilometers using the Haversine formula.
 *
 * @param flight - Flight object with origin and destination IATA codes
 * @returns Distance in kilometers
 * @throws Error if origin or destination airport not found
 *
 * @example
 * ```ts
 * const flight = flights[0];
 * const distance = await getFlightDistance(flight);
 * console.log(`Flight distance: ${distance.toFixed(0)} km`);
 * ```
 */
export async function getFlightDistance(flight: Flight): Promise<number> {
  return getDistanceBetweenAirports(flight.origin, flight.destination);
}

/**
 * Calculate the distance between two airports in kilometers.
 *
 * @param iataA - IATA code of the first airport
 * @param iataB - IATA code of the second airport
 * @returns Distance in kilometers
 * @throws Error if either airport not found
 *
 * @example
 * ```ts
 * const distance = await getDistanceBetweenAirports('DUB', 'BRS');
 * console.log(`Dublin to Bristol: ${distance.toFixed(0)} km`);
 * ```
 */
export async function getDistanceBetweenAirports(iataA: string, iataB: string): Promise<number> {
  const airports = await loadAirports();

  const airportA = airports.get(iataA);
  const airportB = airports.get(iataB);

  if (!airportA) {
    throw new Error(`Airport not found: ${iataA}`);
  }
  if (!airportB) {
    throw new Error(`Airport not found: ${iataB}`);
  }

  return haversine(airportA.lat, airportA.lng, airportB.lat, airportB.lng);
}
