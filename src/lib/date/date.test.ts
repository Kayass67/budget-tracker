import { describe, it, expect } from 'vitest';
import {
  adToBs,
  bsToAd,
  toIsoDateString,
  formatDate,
  getBsDaysInMonth,
  NEPALI_MONTHS,
} from './index';

describe('Date Library - AD / BS Conversions', () => {
  const sampleAdDates = [
    '2000-01-01',
    '2015-04-25',
    '2020-01-01',
    '2024-01-01',
    '2024-04-13',
    '2024-04-14',
    '2024-05-15',
    '2024-10-12',
    '2025-01-01',
    '2026-10-30',
    '2028-02-29', // Leap day in AD
    '1995-08-20',
  ];

  it('performs accurate round-trip conversion for at least 10 sample dates (AD -> BS -> AD)', () => {
    expect(sampleAdDates.length).toBeGreaterThanOrEqual(10);

    sampleAdDates.forEach((adStr) => {
      // 1. Convert AD string to BS
      const bs = adToBs(adStr);

      // Verify BS components are in valid ranges
      expect(bs.year).toBeGreaterThanOrEqual(2050);
      expect(bs.month).toBeGreaterThanOrEqual(1);
      expect(bs.month).toBeLessThanOrEqual(12);
      expect(bs.day).toBeGreaterThanOrEqual(1);
      expect(bs.day).toBeLessThanOrEqual(32);

      // 2. Convert back to AD
      const reconstructedAdDate = bsToAd(bs.year, bs.month, bs.day);
      const reconstructedAdStr = toIsoDateString(reconstructedAdDate);

      // 3. Must match the original AD date exactly
      expect(reconstructedAdStr).toBe(adStr);
    });
  });

  it('performs accurate round-trip conversion from BS -> AD -> BS', () => {
    const sampleBsDates = [
      { year: 2072, month: 1, day: 12 }, // Baisakh 12, 2072
      { year: 2080, month: 12, day: 30 }, // Chaitra 30, 2080
      { year: 2081, month: 1, day: 1 }, // Baisakh 1, 2081
      { year: 2081, month: 2, day: 2 }, // Jestha 2, 2081
      { year: 2081, month: 6, day: 26 }, // Ashwin 26, 2081
      { year: 2081, month: 9, day: 17 }, // Poush 17, 2081
      { year: 2082, month: 5, day: 15 }, // Bhadra 15, 2082
      { year: 2083, month: 7, day: 13 }, // Kartik 13, 2083
      { year: 2084, month: 11, day: 17 }, // Falgun 17, 2084
      { year: 2085, month: 10, day: 1 }, // Magh 1, 2085
    ];

    sampleBsDates.forEach(({ year, month, day }) => {
      const adDate = bsToAd(year, month, day);
      const bsBack = adToBs(adDate);

      expect(bsBack.year).toBe(year);
      expect(bsBack.month).toBe(month);
      expect(bsBack.day).toBe(day);
    });
  });

  it('returns valid days count for BS months in 2081', () => {
    // 2081 Baisakh has 31 days, Jestha has 32 days
    expect(getBsDaysInMonth(2081, 1)).toBe(31);
    expect(getBsDaysInMonth(2081, 2)).toBe(32);
  });

  it('contains all 12 Nepali month names in sequence', () => {
    expect(NEPALI_MONTHS).toHaveLength(12);
    expect(NEPALI_MONTHS[0].nameEn).toBe('Baisakh');
    expect(NEPALI_MONTHS[0].nameNp).toBe('वैशाख');
    expect(NEPALI_MONTHS[11].nameEn).toBe('Chaitra');
    expect(NEPALI_MONTHS[11].nameNp).toBe('चैत');
  });

  it('formats dates in both AD and BS formats', () => {
    const testDate = '2024-05-15'; // 2081 Jestha 2
    const adFormatted = formatDate(testDate, 'AD');
    expect(adFormatted).toBe('15 May 2024');

    const bsFormatted = formatDate(testDate, 'BS');
    expect(bsFormatted).toBe('2 Jestha 2081 BS');

    const bsNpFormatted = formatDate(testDate, 'BS', { useNepaliScript: true });
    expect(bsNpFormatted).toContain('जेठ');
  });
});
