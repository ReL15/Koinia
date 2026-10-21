import { describe, expect, it } from 'vitest';
import { compareDateTimeDescending, formatTime12Hour } from '../lib/dateUtils';

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
