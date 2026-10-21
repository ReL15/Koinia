import { describe, expect, it } from 'vitest';
import {
  compareDateTimeDescending,
  formatDurationInHours,
  formatTime12Hour,
  formatTimeRange12Hour,
} from '../lib/dateUtils';

describe('formatTime12Hour', () => {
  it.each([
    ['00:00', '12:00 a. m.'],
    ['09:05', '9:05 a. m.'],
    ['12:00', '12:00 p. m.'],
    ['23:59', '11:59 p. m.'],
  ])('formats %s as %s', (time, expected) => {
    expect(formatTime12Hour(time)).toBe(expected);
  });
});

describe('compareDateTimeDescending', () => {
  it('sorts by newest date and then latest time first', () => {
    const assignments = [
      { date: '2026-10-20', time: '09:00' },
      { date: '2026-10-21', time: '08:30' },
      { date: '2026-10-21', time: '17:00' },
    ];

    expect(assignments.sort(compareDateTimeDescending)).toEqual([
      { date: '2026-10-21', time: '17:00' },
      { date: '2026-10-21', time: '08:30' },
      { date: '2026-10-20', time: '09:00' },
    ]);
  });
});

describe('formatDurationInHours', () => {
  it.each([
    [30, '0,5 horas'],
    [60, '1 hora'],
    [90, '1,5 horas'],
    [120, '2 horas'],
  ])('formats %i minutes as %s', (duration, expected) => {
    expect(formatDurationInHours(duration)).toBe(expected);
  });
});

describe('formatTimeRange12Hour', () => {
  it('calculates the end time', () => {
    expect(formatTimeRange12Hour('09:30', 90)).toBe('9:30 a. m. – 11:00 a. m.');
  });

  it('marks when the assignment ends the following day', () => {
    expect(formatTimeRange12Hour('23:30', 90)).toBe(
      '11:30 p. m. – 1:00 a. m. (día siguiente)'
    );
  });

  it('rejects invalid times and durations', () => {
    expect(formatTimeRange12Hour('25:00', 60)).toBeNull();
    expect(formatTimeRange12Hour('09:00', -15)).toBeNull();
  });
});
