/**
 * Represents a single flight
 */
export interface Flight {
  /** Flight departure time */
  readonly departureTime: Date;
  /** Flight number (e.g., "FR 504") */
  readonly flightNumber: string;
  /** Fare price */
  readonly price: number;
  /** Currency code (e.g., "EUR", "GBP") */
  readonly currency: string;
  /** IATA code of origin airport (e.g., "DUB") */
  readonly origin: string;
  /** Full origin description (e.g., "Dublin, Ireland") */
  readonly originFull: string;
  /** IATA code of destination airport (e.g., "BRS") */
  readonly destination: string;
  /** Full destination description (e.g., "Bristol, United Kingdom") */
  readonly destinationFull: string;
}

/**
 * Represents a round trip with outbound and inbound flights
 */
export interface Trip {
  /** Combined price of outbound and inbound flights */
  readonly totalPrice: number;
  /** Outbound flight details */
  readonly outbound: Flight;
  /** Inbound/return flight details */
  readonly inbound: Flight;
}

/**
 * Represents an airport from the airports database
 */
export interface Airport {
  /** IATA airport code (e.g., "DUB") */
  readonly iataCode: string;
  /** Latitude in decimal degrees */
  readonly lat: number;
  /** Longitude in decimal degrees */
  readonly lng: number;
  /** Location description (region, country) */
  readonly location: string;
}

/**
 * Logger interface for custom logging implementations
 */
export interface Logger {
  debug(message: string, ...args: unknown[]): void;
  info(message: string, ...args: unknown[]): void;
  warn(message: string, ...args: unknown[]): void;
  error(message: string, ...args: unknown[]): void;
}

/**
 * Retry configuration options
 */
export interface RetryConfig {
  /** Maximum number of retry attempts (default: 5) */
  maxRetries: number;
  /** Base delay in milliseconds (default: 1000) */
  baseDelay: number;
  /** Maximum delay in milliseconds (default: 30000) */
  maxDelay: number;
  /** Jitter factor 0-1 for randomization (default: 0.1) */
  jitter: number;
}

/**
 * Configuration options for Ryanair client
 */
export interface RyanairConfig {
  /** Currency code for prices (e.g., "EUR", "GBP") */
  currency?: string;
  /** Custom logger implementation */
  logger?: Logger;
  /** Retry configuration */
  retry?: Partial<RetryConfig>;
}

/**
 * Options for one-way flight search
 */
export interface OneWayFlightOptions {
  /** IATA code of departure airport */
  airport: string;
  /** Start of departure date range (Date object or "YYYY-MM-DD" string) */
  dateFrom: Date | string;
  /** End of departure date range (Date object or "YYYY-MM-DD" string) */
  dateTo: Date | string;
  /** ISO country code to filter destinations (e.g., "GB", "ES") */
  destinationCountry?: string;
  /** IATA code of specific destination airport */
  destinationAirport?: string;
  /** Earliest departure time ("HH:MM" format or Date, default: "00:00") */
  departureTimeFrom?: string | Date;
  /** Latest departure time ("HH:MM" format or Date, default: "23:59") */
  departureTimeTo?: string | Date;
  /** Maximum price filter */
  maxPrice?: number;
  /** Additional custom API parameters */
  customParams?: Record<string, string | number>;
}

/**
 * Options for return flight search
 */
export interface ReturnFlightOptions {
  /** IATA code of source airport */
  sourceAirport: string;
  /** Start of outbound departure date range */
  dateFrom: Date | string;
  /** End of outbound departure date range */
  dateTo: Date | string;
  /** Start of return date range */
  returnDateFrom: Date | string;
  /** End of return date range */
  returnDateTo: Date | string;
  /** ISO country code to filter destinations */
  destinationCountry?: string;
  /** IATA code of specific destination airport */
  destinationAirport?: string;
  /** Earliest outbound departure time (default: "00:00") */
  outboundDepartureTimeFrom?: string | Date;
  /** Latest outbound departure time (default: "23:59") */
  outboundDepartureTimeTo?: string | Date;
  /** Earliest inbound departure time (default: "00:00") */
  inboundDepartureTimeFrom?: string | Date;
  /** Latest inbound departure time (default: "23:59") */
  inboundDepartureTimeTo?: string | Date;
  /** Maximum price filter */
  maxPrice?: number;
  /** Additional custom API parameters */
  customParams?: Record<string, string | number>;
}

// ============================================================================
// Internal API Response Types
// ============================================================================

/** @internal */
export interface RyanairApiResponse {
  fares: ApiFare[] | null;
  nextPage: string | null;
  size: number;
}

/** @internal */
export interface ApiFare {
  outbound: ApiFlight;
  inbound?: ApiFlight;
  summary: ApiSummary;
}

/** @internal */
export interface ApiFlight {
  departureAirport: ApiAirport;
  arrivalAirport: ApiAirport;
  departureDate: string;
  arrivalDate: string;
  price: ApiPrice;
  flightKey: string;
  flightNumber: string;
  previousPrice: number | null;
  priceUpdated: number;
}

/** @internal */
export interface ApiAirport {
  countryName: string;
  iataCode: string;
  name: string;
  seoName: string;
  city: ApiCity;
}

/** @internal */
export interface ApiCity {
  name: string;
  code: string;
  countryCode: string;
}

/** @internal */
export interface ApiPrice {
  value: number;
  valueMainUnit: string;
  valueFractionalUnit: string;
  currencyCode: string;
  currencySymbol: string;
}

/** @internal */
export interface ApiSummary {
  price: ApiPrice;
  previousPrice: number | null;
  newRoute: boolean;
  tripDurationDays?: number;
}
