import { describe, it, expect } from 'vitest';
import { formatDate, formatTime, parseISODate } from '../src/utils/date-formatter.js';

describe('date-formatter', () => {
  describe('formatDate', () => {
    it('should format Date object to YYYY-MM-DD', () => {
      const date = new Date('2023-08-15T10:30:00');
      expect(formatDate(date)).toBe('2023-08-15');
    });

    it('should pass through correctly formatted string', () => {
      expect(formatDate('2023-08-15')).toBe('2023-08-15');
    });

    it('should parse and format other date strings', () => {
      expect(formatDate('August 15, 2023')).toBe('2023-08-15');
    });

    it('should throw for invalid date string', () => {
      expect(() => formatDate('not a date')).toThrow('Invalid date string');
    });

    it('should pad single-digit months and days', () => {
      const date = new Date('2023-01-05T10:30:00');
      expect(formatDate(date)).toBe('2023-01-05');
    });
  });

  describe('formatTime', () => {
    it('should format Date object to HH:MM', () => {
      const date = new Date('2023-08-15T14:30:00');
      expect(formatTime(date)).toBe('14:30');
    });

    it('should pass through correctly formatted string', () => {
      expect(formatTime('14:30')).toBe('14:30');
      expect(formatTime('08:00')).toBe('08:00');
    });

    it('should throw for invalid time string', () => {
      expect(() => formatTime('not a time')).toThrow('Invalid time string');
    });

    it('should pad single-digit hours and minutes', () => {
      const date = new Date('2023-08-15T08:05:00');
      expect(formatTime(date)).toBe('08:05');
    });
  });

  describe('parseISODate', () => {
    it('should parse ISO date string', () => {
      const date = parseISODate('2023-08-15T14:30:00');
      expect(date).toBeInstanceOf(Date);
      expect(date.getFullYear()).toBe(2023);
      expect(date.getMonth()).toBe(7); // 0-indexed
      expect(date.getDate()).toBe(15);
    });

    it('should throw for invalid ISO string', () => {
      expect(() => parseISODate('not a date')).toThrow('Invalid ISO date string');
    });
  });
});
