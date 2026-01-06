import type { RyanairApiResponse } from '../../src/types.js';

/**
 * Mock response for one-way flights API
 */
export const MOCK_ONE_WAY_RESPONSE: RyanairApiResponse = {
  fares: [
    {
      outbound: {
        departureAirport: {
          countryName: 'Ireland',
          iataCode: 'DUB',
          name: 'Dublin',
          seoName: 'dublin',
          city: {
            name: 'Dublin',
            code: 'DUBLIN',
            countryCode: 'ie',
          },
        },
        arrivalAirport: {
          countryName: 'United Kingdom',
          iataCode: 'BRS',
          name: 'Bristol',
          seoName: 'bristol',
          city: {
            name: 'Bristol',
            code: 'BRISTOL',
            countryCode: 'gb',
          },
        },
        departureDate: '2023-08-23T08:20:00',
        arrivalDate: '2023-08-23T09:30:00',
        price: {
          value: 17.68,
          valueMainUnit: '17',
          valueFractionalUnit: '68',
          currencyCode: 'EUR',
          currencySymbol: '€',
        },
        flightKey: 'FR~ 504~ ~~DUB~08/23/2023 08:20~BRS~08/23/2023 09:30~~',
        flightNumber: 'FR504',
        previousPrice: null,
        priceUpdated: 1692686097000,
      },
      summary: {
        price: {
          value: 17.68,
          valueMainUnit: '17',
          valueFractionalUnit: '68',
          currencyCode: 'EUR',
          currencySymbol: '€',
        },
        previousPrice: null,
        newRoute: false,
      },
    },
    {
      outbound: {
        departureAirport: {
          countryName: 'Ireland',
          iataCode: 'DUB',
          name: 'Dublin',
          seoName: 'dublin',
          city: {
            name: 'Dublin',
            code: 'DUBLIN',
            countryCode: 'ie',
          },
        },
        arrivalAirport: {
          countryName: 'Spain',
          iataCode: 'BCN',
          name: 'Barcelona',
          seoName: 'barcelona',
          city: {
            name: 'Barcelona',
            code: 'BARCELONA',
            countryCode: 'es',
          },
        },
        departureDate: '2023-08-25T14:30:00',
        arrivalDate: '2023-08-25T18:00:00',
        price: {
          value: 45.99,
          valueMainUnit: '45',
          valueFractionalUnit: '99',
          currencyCode: 'EUR',
          currencySymbol: '€',
        },
        flightKey: 'FR~ 1234~ ~~DUB~08/25/2023 14:30~BCN~08/25/2023 18:00~~',
        flightNumber: 'FR1234',
        previousPrice: null,
        priceUpdated: 1692686097000,
      },
      summary: {
        price: {
          value: 45.99,
          valueMainUnit: '45',
          valueFractionalUnit: '99',
          currencyCode: 'EUR',
          currencySymbol: '€',
        },
        previousPrice: null,
        newRoute: false,
      },
    },
  ],
  nextPage: null,
  size: 2,
};

/**
 * Mock response for round-trip flights API
 */
export const MOCK_RETURN_RESPONSE: RyanairApiResponse = {
  fares: [
    {
      outbound: {
        departureAirport: {
          countryName: 'Ireland',
          iataCode: 'DUB',
          name: 'Dublin',
          seoName: 'dublin',
          city: {
            name: 'Dublin',
            code: 'DUBLIN',
            countryCode: 'ie',
          },
        },
        arrivalAirport: {
          countryName: 'United Kingdom',
          iataCode: 'BRS',
          name: 'Bristol',
          seoName: 'bristol',
          city: {
            name: 'Bristol',
            code: 'BRISTOL',
            countryCode: 'gb',
          },
        },
        departureDate: '2023-08-23T08:20:00',
        arrivalDate: '2023-08-23T09:30:00',
        price: {
          value: 17.68,
          valueMainUnit: '17',
          valueFractionalUnit: '68',
          currencyCode: 'EUR',
          currencySymbol: '€',
        },
        flightKey: 'FR~ 504~ ~~DUB~08/23/2023 08:20~BRS~08/23/2023 09:30~~',
        flightNumber: 'FR504',
        previousPrice: null,
        priceUpdated: 1692686097000,
      },
      inbound: {
        departureAirport: {
          countryName: 'United Kingdom',
          iataCode: 'BRS',
          name: 'Bristol',
          seoName: 'bristol',
          city: {
            name: 'Bristol',
            code: 'BRISTOL',
            countryCode: 'gb',
          },
        },
        arrivalAirport: {
          countryName: 'Ireland',
          iataCode: 'DUB',
          name: 'Dublin',
          seoName: 'dublin',
          city: {
            name: 'Dublin',
            code: 'DUBLIN',
            countryCode: 'ie',
          },
        },
        departureDate: '2023-08-30T10:15:00',
        arrivalDate: '2023-08-30T11:25:00',
        price: {
          value: 18.67,
          valueMainUnit: '18',
          valueFractionalUnit: '67',
          currencyCode: 'EUR',
          currencySymbol: '€',
        },
        flightKey: 'FR~ 505~ ~~BRS~08/30/2023 10:15~DUB~08/30/2023 11:25~~',
        flightNumber: 'FR505',
        previousPrice: null,
        priceUpdated: 1692686097000,
      },
      summary: {
        price: {
          value: 36.35,
          valueMainUnit: '36',
          valueFractionalUnit: '35',
          currencyCode: 'EUR',
          currencySymbol: '€',
        },
        previousPrice: null,
        newRoute: false,
        tripDurationDays: 7,
      },
    },
    {
      outbound: {
        departureAirport: {
          countryName: 'Ireland',
          iataCode: 'DUB',
          name: 'Dublin',
          seoName: 'dublin',
          city: {
            name: 'Dublin',
            code: 'DUBLIN',
            countryCode: 'ie',
          },
        },
        arrivalAirport: {
          countryName: 'Spain',
          iataCode: 'BCN',
          name: 'Barcelona',
          seoName: 'barcelona',
          city: {
            name: 'Barcelona',
            code: 'BARCELONA',
            countryCode: 'es',
          },
        },
        departureDate: '2023-08-25T14:30:00',
        arrivalDate: '2023-08-25T18:00:00',
        price: {
          value: 45.99,
          valueMainUnit: '45',
          valueFractionalUnit: '99',
          currencyCode: 'EUR',
          currencySymbol: '€',
        },
        flightKey: 'FR~ 1234~ ~~DUB~08/25/2023 14:30~BCN~08/25/2023 18:00~~',
        flightNumber: 'FR1234',
        previousPrice: null,
        priceUpdated: 1692686097000,
      },
      inbound: {
        departureAirport: {
          countryName: 'Spain',
          iataCode: 'BCN',
          name: 'Barcelona',
          seoName: 'barcelona',
          city: {
            name: 'Barcelona',
            code: 'BARCELONA',
            countryCode: 'es',
          },
        },
        arrivalAirport: {
          countryName: 'Ireland',
          iataCode: 'DUB',
          name: 'Dublin',
          seoName: 'dublin',
          city: {
            name: 'Dublin',
            code: 'DUBLIN',
            countryCode: 'ie',
          },
        },
        departureDate: '2023-09-01T09:00:00',
        arrivalDate: '2023-09-01T10:30:00',
        price: {
          value: 52.01,
          valueMainUnit: '52',
          valueFractionalUnit: '01',
          currencyCode: 'EUR',
          currencySymbol: '€',
        },
        flightKey: 'FR~ 1235~ ~~BCN~09/01/2023 09:00~DUB~09/01/2023 10:30~~',
        flightNumber: 'FR1235',
        previousPrice: null,
        priceUpdated: 1692686097000,
      },
      summary: {
        price: {
          value: 98.0,
          valueMainUnit: '98',
          valueFractionalUnit: '00',
          currencyCode: 'EUR',
          currencySymbol: '€',
        },
        previousPrice: null,
        newRoute: false,
        tripDurationDays: 7,
      },
    },
  ],
  nextPage: null,
  size: 2,
};

/**
 * Empty response (no fares)
 */
export const MOCK_EMPTY_RESPONSE: RyanairApiResponse = {
  fares: null,
  nextPage: null,
  size: 0,
};
