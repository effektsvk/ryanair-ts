# ryanair-ts

TypeScript client for the Ryanair flight search API.

This module allows you to retrieve the cheapest flights, with or without return flights, within a fixed set of dates.

This is done directly through Ryanair's API, and does not require an API key.

## Disclaimer

> **DISCLAIMER:** This library is not affiliated, endorsed, or sponsored by Ryanair or any of its affiliates.
> All trademarks related to Ryanair and its affiliates are owned by the relevant companies.
> The author(s) of this library assume no responsibility for any consequences resulting from the use of this library.
> The author(s) of this library also assume no liability for any damages, losses, or expenses that may arise from the use of this library.
> Any use of this library is entirely at the user's own risk.
> It is solely the user's responsibility to ensure compliance with Ryanair's terms of use and any applicable laws and regulations.
> The library is an independent project aimed at providing a convenient way to interact with the Ryanair API, allowing individuals to find flights for personal use, and then ultimately purchase them via Ryanair's website.
> While the author(s) will make efforts to ensure the library's functionality, they do not guarantee the accuracy, completeness, or timeliness of the information provided.
> The author(s) do not guarantee the availability or continuity of the library, and updates may not be guaranteed.
> Support for this library may be provided at the author(s)'s discretion, but it is not guaranteed.
> Users are encouraged to report any issues or feedback to the author(s) via appropriate channels.
> By using this library, users acknowledge that they have read, understood, and agreed to the terms of this disclaimer.

## Installation

```bash
npm install ryanair-ts
```

## Requirements

- Node.js 18.0.0 or higher

## Usage

### Create an instance

```typescript
import { Ryanair } from 'ryanair-ts';

// You can set a currency at the API instance level
// Note: this may not always be respected by the API, so always check the currency returned
const api = new Ryanair({ currency: 'EUR' });
```

### Get the cheapest one-way flights

Get the cheapest flights from a given origin airport (returns at most 1 flight to each destination).

```typescript
import { Ryanair } from 'ryanair-ts';

const api = new Ryanair({ currency: 'EUR' });

const flights = await api.getCheapestFlights({
  airport: 'DUB',
  dateFrom: '2024-03-01',
  dateTo: '2024-03-31',
});

// Returns an array of Flight objects
const flight = flights[0];
console.log(flight);
// {
//   departureTime: Date,
//   flightNumber: 'FR 9717',
//   price: 31.99,
//   currency: 'EUR',
//   origin: 'DUB',
//   originFull: 'Dublin, Ireland',
//   destination: 'GOA',
//   destinationFull: 'Genoa, Italy'
// }

console.log(flight.price); // 31.99
```

### Get the cheapest return trips

```typescript
import { Ryanair } from 'ryanair-ts';

const api = new Ryanair({ currency: 'EUR' });

const trips = await api.getCheapestReturnFlights({
  sourceAirport: 'DUB',
  dateFrom: '2024-03-01',
  dateTo: '2024-03-15',
  returnDateFrom: '2024-03-16',
  returnDateTo: '2024-03-31',
});

const trip = trips[0];
console.log(trip.totalPrice); // 85.31
console.log(trip.outbound.destination); // 'EMA'
console.log(trip.inbound.origin); // 'EMA'
```

### Advanced options

Both search methods support additional filtering options:

```typescript
const flights = await api.getCheapestFlights({
  airport: 'DUB',
  dateFrom: '2024-03-01',
  dateTo: '2024-03-31',
  destinationCountry: 'ES',          // Filter to Spain only
  destinationAirport: 'BCN',         // Or a specific airport
  departureTimeFrom: '08:00',        // Earliest departure time
  departureTimeTo: '20:00',          // Latest departure time
  maxPrice: 50,                      // Maximum price filter
  customParams: { limit: 10 },       // Additional API parameters
});
```

### Airport utilities

Calculate distances between airports:

```typescript
import { getDistanceBetweenAirports, getFlightDistance } from 'ryanair-ts';

// Get distance between two airports
const distance = await getDistanceBetweenAirports('DUB', 'BCN');
console.log(`Dublin to Barcelona: ${distance.toFixed(0)} km`);

// Or calculate distance for a flight
const flights = await api.getCheapestFlights({ ... });
const flightDistance = await getFlightDistance(flights[0]);
```

### Configuration options

```typescript
import { Ryanair } from 'ryanair-ts';

const api = new Ryanair({
  // Currency for prices
  currency: 'EUR',

  // Custom logger (defaults to console)
  logger: {
    debug: (msg) => console.debug(msg),
    info: (msg) => console.info(msg),
    warn: (msg) => console.warn(msg),
    error: (msg) => console.error(msg),
  },

  // Retry configuration
  retry: {
    maxRetries: 5,      // Maximum retry attempts
    baseDelay: 1000,    // Base delay in ms (doubles each retry)
    maxDelay: 30000,    // Maximum delay cap
    jitter: 0.1,        // Randomization factor
  },
});
```

## API Reference

### `Ryanair`

Main client class.

#### Constructor

```typescript
new Ryanair(config?: RyanairConfig)
```

#### Methods

- `getCheapestFlights(options: OneWayFlightOptions): Promise<Flight[]>`
- `getCheapestReturnFlights(options: ReturnFlightOptions): Promise<Trip[]>`
- `numQueries: number` - Read-only count of API queries made

### Types

```typescript
interface Flight {
  departureTime: Date;
  flightNumber: string;
  price: number;
  currency: string;
  origin: string;
  originFull: string;
  destination: string;
  destinationFull: string;
}

interface Trip {
  totalPrice: number;
  outbound: Flight;
  inbound: Flight;
}
```

## License

MIT
