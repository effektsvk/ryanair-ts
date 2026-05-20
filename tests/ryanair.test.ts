import { describe, it, expect, beforeEach } from 'vitest';
import { http, HttpResponse } from 'msw';
import { server } from './setup.js';
import { Ryanair } from '../src/ryanair.js';
import { MOCK_ONE_WAY_RESPONSE, MOCK_RETURN_RESPONSE, MOCK_EMPTY_RESPONSE } from './fixtures/mock-responses.js';

describe('Ryanair', () => {
  let api: Ryanair;

  beforeEach(() => {
    api = new Ryanair({ currency: 'EUR' });
  });

  describe('constructor', () => {
    it('should create instance with default config', () => {
      const instance = new Ryanair();
      expect(instance).toBeInstanceOf(Ryanair);
      expect(instance.numQueries).toBe(0);
    });

    it('should create instance with custom currency', () => {
      const instance = new Ryanair({ currency: 'GBP' });
      expect(instance).toBeInstanceOf(Ryanair);
    });
  });

  describe('getCheapestFlights', () => {
    it('should return flights from API response', async () => {
      server.use(
        http.get('https://services-api.ryanair.com/farfnd/v4/oneWayFares', () => {
          return HttpResponse.json(MOCK_ONE_WAY_RESPONSE);
        })
      );

      const flights = await api.getCheapestFlights({
        airport: 'DUB',
        dateFrom: '2023-08-01',
        dateTo: '2023-08-31',
      });

      expect(flights).toHaveLength(2);
      expect(flights[0]).toMatchObject({
        origin: 'DUB',
        destination: 'BRS',
        price: 17.68,
        currency: 'EUR',
        flightNumber: 'FR 504',
        originFull: 'Dublin, Ireland',
        destinationFull: 'Bristol, United Kingdom',
      });
      expect(flights[0]?.departureTime).toBeInstanceOf(Date);
    });

    it('should return empty array when no fares', async () => {
      server.use(
        http.get('https://services-api.ryanair.com/farfnd/v4/oneWayFares', () => {
          return HttpResponse.json(MOCK_EMPTY_RESPONSE);
        })
      );

      const flights = await api.getCheapestFlights({
        airport: 'DUB',
        dateFrom: '2023-08-01',
        dateTo: '2023-08-31',
      });

      expect(flights).toEqual([]);
    });

    it('should pass query parameters correctly', async () => {
      let capturedUrl: URL | null = null;

      server.use(
        http.get('https://services-api.ryanair.com/farfnd/v4/oneWayFares', ({ request }) => {
          capturedUrl = new URL(request.url);
          return HttpResponse.json(MOCK_EMPTY_RESPONSE);
        })
      );

      await api.getCheapestFlights({
        airport: 'DUB',
        dateFrom: '2023-08-01',
        dateTo: '2023-08-31',
        destinationCountry: 'ES',
        maxPrice: 100,
        departureTimeFrom: '08:00',
        departureTimeTo: '20:00',
      });

      expect(capturedUrl).not.toBeNull();
      expect(capturedUrl!.searchParams.get('departureAirportIataCode')).toBe('DUB');
      expect(capturedUrl!.searchParams.get('outboundDepartureDateFrom')).toBe('2023-08-01');
      expect(capturedUrl!.searchParams.get('outboundDepartureDateTo')).toBe('2023-08-31');
      expect(capturedUrl!.searchParams.get('arrivalCountryCode')).toBe('ES');
      expect(capturedUrl!.searchParams.get('priceValueTo')).toBe('100');
      expect(capturedUrl!.searchParams.get('outboundDepartureTimeFrom')).toBe('08:00');
      expect(capturedUrl!.searchParams.get('outboundDepartureTimeTo')).toBe('20:00');
      expect(capturedUrl!.searchParams.get('currency')).toBe('EUR');
    });

    it('should accept Date objects for dates', async () => {
      let capturedUrl: URL | null = null;

      server.use(
        http.get('https://services-api.ryanair.com/farfnd/v4/oneWayFares', ({ request }) => {
          capturedUrl = new URL(request.url);
          return HttpResponse.json(MOCK_EMPTY_RESPONSE);
        })
      );

      await api.getCheapestFlights({
        airport: 'DUB',
        dateFrom: new Date('2023-08-01'),
        dateTo: new Date('2023-08-31'),
      });

      expect(capturedUrl!.searchParams.get('outboundDepartureDateFrom')).toBe('2023-08-01');
      expect(capturedUrl!.searchParams.get('outboundDepartureDateTo')).toBe('2023-08-31');
    });

    it('should increment numQueries on each call', async () => {
      server.use(
        http.get('https://services-api.ryanair.com/farfnd/v4/oneWayFares', () => {
          return HttpResponse.json(MOCK_EMPTY_RESPONSE);
        })
      );

      expect(api.numQueries).toBe(0);

      await api.getCheapestFlights({
        airport: 'DUB',
        dateFrom: '2023-08-01',
        dateTo: '2023-08-31',
      });

      expect(api.numQueries).toBe(1);

      await api.getCheapestFlights({
        airport: 'DUB',
        dateFrom: '2023-08-01',
        dateTo: '2023-08-31',
      });

      expect(api.numQueries).toBe(2);
    });
  });

  describe('getCheapestReturnFlights', () => {
    it('should return trips from API response', async () => {
      server.use(
        http.get('https://services-api.ryanair.com/farfnd/v4/roundTripFares', () => {
          return HttpResponse.json(MOCK_RETURN_RESPONSE);
        })
      );

      const trips = await api.getCheapestReturnFlights({
        sourceAirport: 'DUB',
        dateFrom: '2023-08-01',
        dateTo: '2023-08-15',
        returnDateFrom: '2023-08-20',
        returnDateTo: '2023-08-31',
      });

      expect(trips).toHaveLength(2);
      expect(trips[0]).toMatchObject({
        totalPrice: 36.35,
      });
      expect(trips[0]?.outbound).toMatchObject({
        origin: 'DUB',
        destination: 'BRS',
        price: 17.68,
        currency: 'EUR',
      });
      expect(trips[0]?.inbound).toMatchObject({
        origin: 'BRS',
        destination: 'DUB',
        price: 18.67,
        currency: 'EUR',
      });
    });

    it('should return empty array when no fares', async () => {
      server.use(
        http.get('https://services-api.ryanair.com/farfnd/v4/roundTripFares', () => {
          return HttpResponse.json(MOCK_EMPTY_RESPONSE);
        })
      );

      const trips = await api.getCheapestReturnFlights({
        sourceAirport: 'DUB',
        dateFrom: '2023-08-01',
        dateTo: '2023-08-15',
        returnDateFrom: '2023-08-20',
        returnDateTo: '2023-08-31',
      });

      expect(trips).toEqual([]);
    });

    it('should pass query parameters correctly', async () => {
      let capturedUrl: URL | null = null;

      server.use(
        http.get('https://services-api.ryanair.com/farfnd/v4/roundTripFares', ({ request }) => {
          capturedUrl = new URL(request.url);
          return HttpResponse.json(MOCK_EMPTY_RESPONSE);
        })
      );

      await api.getCheapestReturnFlights({
        sourceAirport: 'DUB',
        dateFrom: '2023-08-01',
        dateTo: '2023-08-15',
        returnDateFrom: '2023-08-20',
        returnDateTo: '2023-08-31',
        destinationCountry: 'ES',
        outboundDepartureTimeFrom: '08:00',
        outboundDepartureTimeTo: '20:00',
        inboundDepartureTimeFrom: '10:00',
        inboundDepartureTimeTo: '22:00',
      });

      expect(capturedUrl).not.toBeNull();
      expect(capturedUrl!.searchParams.get('departureAirportIataCode')).toBe('DUB');
      expect(capturedUrl!.searchParams.get('outboundDepartureDateFrom')).toBe('2023-08-01');
      expect(capturedUrl!.searchParams.get('outboundDepartureDateTo')).toBe('2023-08-15');
      expect(capturedUrl!.searchParams.get('inboundDepartureDateFrom')).toBe('2023-08-20');
      expect(capturedUrl!.searchParams.get('inboundDepartureDateTo')).toBe('2023-08-31');
      expect(capturedUrl!.searchParams.get('arrivalCountryCode')).toBe('ES');
      expect(capturedUrl!.searchParams.get('outboundDepartureTimeFrom')).toBe('08:00');
      expect(capturedUrl!.searchParams.get('outboundDepartureTimeTo')).toBe('20:00');
      expect(capturedUrl!.searchParams.get('inboundDepartureTimeFrom')).toBe('10:00');
      expect(capturedUrl!.searchParams.get('inboundDepartureTimeTo')).toBe('22:00');
    });
  });

  describe('getFlights', () => {
    it('should send Ryanair web client headers to the availability API', async () => {
      let capturedHeaders: Headers | null = null;
      let capturedUrl: URL | null = null;

      server.use(
        http.get('https://www.ryanair.com/api/booking/v4/en-gb/availability', ({ request }) => {
          capturedHeaders = request.headers;
          capturedUrl = new URL(request.url);
          return HttpResponse.json({
            currency: 'EUR',
            currPrecision: 2,
            serverTimeUTC: '2026-04-23T12:00:00.000Z',
            trips: [
              {
                origin: 'DUB',
                originName: 'Dublin',
                destination: 'BRS',
                destinationName: 'Bristol',
                dates: [
                  {
                    dateOut: '2026-05-23T00:00:00.000',
                    flights: [
                      {
                        faresLeft: 5,
                        flightKey: 'FR~ 504~ ~~DUB~05/23/2026 06:00~BRS~05/23/2026 07:05~~',
                        infantsLeft: 18,
                        regularFare: {
                          fareKey: 'fare-key',
                          fares: [
                            {
                              type: 'ADT',
                              amount: 14.99,
                              count: 1,
                              hasDiscount: false,
                              publishedFare: 14.99,
                              discountInPercent: 0,
                              hasPromoDiscount: false,
                              discountAmount: 0,
                              hasBogof: false,
                            },
                          ],
                        },
                        operatedBy: 'Ryanair',
                        segments: [],
                        flightNumber: 'FR 504',
                        time: ['2026-05-23T06:00:00.000', '2026-05-23T07:05:00.000'],
                        timeUTC: ['2026-05-23T05:00:00.000Z', '2026-05-23T06:05:00.000Z'],
                        duration: '01:05',
                      },
                    ],
                  },
                ],
              },
            ],
          });
        })
      );

      const flights = await api.getFlights({
        origin: 'DUB',
        destination: 'BRS',
        dateOut: '2026-05-23',
      });

      expect(flights).toHaveLength(1);
      expect(flights[0]).toMatchObject({
        flightNumber: 'FR 504',
        price: 14.99,
        currency: 'EUR',
        origin: 'DUB',
        destination: 'BRS',
      });

      expect(capturedHeaders).not.toBeNull();
      expect(capturedHeaders!.get('client')).toBe('desktop');
      expect(capturedHeaders!.get('client-version')).toBe('3.198.0');
      expect(capturedHeaders!.get('accept')).toBe('application/json, text/plain, */*');
      expect(capturedHeaders!.get('user-agent')).toContain('Mozilla/5.0');
      expect(capturedHeaders!.get('referer')).toContain('/ie/en/trip/flights/select');
      expect(capturedHeaders!.get('cookie')).toContain('rid=test-session-id');
      expect(capturedUrl).not.toBeNull();
      expect(capturedUrl!.searchParams.get('IncludePrimeFares')).toBe('false');
    });
  });

  describe('retry mechanism', () => {
    it('should retry on server error and eventually succeed', async () => {
      let callCount = 0;

      server.use(
        http.get('https://services-api.ryanair.com/farfnd/v4/oneWayFares', () => {
          callCount++;
          if (callCount < 3) {
            return new HttpResponse(null, { status: 500 });
          }
          return HttpResponse.json(MOCK_ONE_WAY_RESPONSE);
        })
      );

      const flights = await api.getCheapestFlights({
        airport: 'DUB',
        dateFrom: '2023-08-01',
        dateTo: '2023-08-31',
      });

      expect(flights).toHaveLength(2);
      expect(api.numQueries).toBe(3); // 2 failed + 1 successful
    });

    it('should give up after max retries', async () => {
      server.use(
        http.get('https://services-api.ryanair.com/farfnd/v4/oneWayFares', () => {
          return new HttpResponse(null, { status: 500 });
        })
      );

      await expect(
        api.getCheapestFlights({
          airport: 'DUB',
          dateFrom: '2023-08-01',
          dateTo: '2023-08-31',
        })
      ).rejects.toThrow();

      expect(api.numQueries).toBe(5); // 5 failed attempts
    });
  });
});
