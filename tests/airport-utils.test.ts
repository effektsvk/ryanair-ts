import { describe, it, expect, beforeEach } from 'vitest';
import {
  loadAirports,
  getAirportsSync,
  clearAirportsCache,
  getDistanceBetweenAirports,
} from '../src/airport-utils.js';
import { haversine } from '../src/utils/haversine.js';

describe('airport-utils', () => {
  beforeEach(() => {
    clearAirportsCache();
  });

  describe('loadAirports', () => {
    it('should load airports data', async () => {
      const airports = await loadAirports();

      expect(airports).toBeInstanceOf(Map);
      expect(airports.size).toBeGreaterThan(0);
    });

    it('should contain Dublin airport', async () => {
      const airports = await loadAirports();
      const dublin = airports.get('DUB');

      expect(dublin).toBeDefined();
      expect(dublin?.iataCode).toBe('DUB');
      expect(dublin?.lat).toBeCloseTo(53.4273, 1);
      expect(dublin?.lng).toBeCloseTo(-6.2436, 1);
    });

    it('should cache results', async () => {
      const airports1 = await loadAirports();
      const airports2 = await loadAirports();

      expect(airports1).toBe(airports2); // Same reference
    });
  });

  describe('getAirportsSync', () => {
    it('should throw if airports not loaded', () => {
      expect(() => getAirportsSync()).toThrow('Airports not loaded');
    });

    it('should return airports after loading', async () => {
      await loadAirports();
      const airports = getAirportsSync();

      expect(airports).toBeInstanceOf(Map);
      expect(airports.size).toBeGreaterThan(0);
    });
  });

  describe('clearAirportsCache', () => {
    it('should clear the cache', async () => {
      await loadAirports();
      expect(() => getAirportsSync()).not.toThrow();

      clearAirportsCache();
      expect(() => getAirportsSync()).toThrow('Airports not loaded');
    });
  });

  describe('getDistanceBetweenAirports', () => {
    it('should calculate distance between Dublin and Barcelona', async () => {
      const distance = await getDistanceBetweenAirports('DUB', 'BCN');

      // Dublin to Barcelona is approximately 1470 km
      expect(distance).toBeGreaterThan(1400);
      expect(distance).toBeLessThan(1550);
    });

    it('should calculate distance between Dublin and Bristol', async () => {
      const distance = await getDistanceBetweenAirports('DUB', 'BRS');

      // Dublin to Bristol is approximately 330 km
      expect(distance).toBeGreaterThan(300);
      expect(distance).toBeLessThan(400);
    });

    it('should throw for unknown airport', async () => {
      await expect(getDistanceBetweenAirports('XXX', 'DUB')).rejects.toThrow(
        'Airport not found: XXX'
      );
    });
  });

  describe('haversine', () => {
    it('should calculate correct distance', () => {
      // Dublin coordinates: 53.4273, -6.2436
      // London coordinates: 51.4775, -0.4614
      const distance = haversine(53.4273, -6.2436, 51.4775, -0.4614);

      // Dublin to London is approximately 450 km
      expect(distance).toBeGreaterThan(400);
      expect(distance).toBeLessThan(500);
    });

    it('should return 0 for same point', () => {
      const distance = haversine(53.4273, -6.2436, 53.4273, -6.2436);
      expect(distance).toBe(0);
    });
  });
});
