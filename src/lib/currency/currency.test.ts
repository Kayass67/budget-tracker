import { describe, it, expect } from 'vitest';
import { SUPPORTED_CURRENCIES, formatMoney, convert, FALLBACK_RATES } from './index';
import { CurrencyCode } from '@/types';

describe('Currency Library', () => {
  const expectedCodes: CurrencyCode[] = [
    'NPR',
    'USD',
    'GBP',
    'EUR',
    'INR',
    'AUD',
    'CAD',
    'JPY',
    'CNY',
    'AED',
    'SAR',
    'QAR',
    'MYR',
    'SGD',
    'CHF',
    'KRW',
    'THB',
    'HKD',
    'NZD',
    'BDT',
    'LKR',
    'PKR',
  ];

  it('supports all 22 required currencies', () => {
    expect(Object.keys(SUPPORTED_CURRENCIES)).toHaveLength(22);
    expectedCodes.forEach((code) => {
      expect(SUPPORTED_CURRENCIES[code]).toBeDefined();
      expect(SUPPORTED_CURRENCIES[code].code).toBe(code);
      expect(SUPPORTED_CURRENCIES[code].symbol).toBeTruthy();
      expect(SUPPORTED_CURRENCIES[code].rateAgainstUSD).toBeGreaterThan(0);
    });
  });

  describe('formatMoney Indian digit grouping', () => {
    it('formats NPR using Indian digit grouping (12,34,567) with default symbol रू', () => {
      const formatted = formatMoney(1234567, 'NPR');
      expect(formatted).toBe('रू 12,34,567');
    });

    it('formats NPR with useNprCode option displaying NPR', () => {
      const formatted = formatMoney(1234567, 'NPR', { useNprCode: true });
      expect(formatted).toBe('NPR 12,34,567');
    });

    it('formats INR using Indian digit grouping (12,34,567) with ₹', () => {
      const formatted = formatMoney(1234567, 'INR');
      expect(formatted).toBe('₹ 12,34,567');
    });

    it('formats negative amounts properly with sign', () => {
      const formattedNpr = formatMoney(-50000, 'NPR');
      expect(formattedNpr).toBe('-रू 50,000');

      const formattedInr = formatMoney(-1234567, 'INR');
      expect(formattedInr).toBe('-₹ 12,34,567');
    });
  });

  describe('formatMoney standard formatting', () => {
    it('formats USD with standard thousands separators and decimals', () => {
      const formatted = formatMoney(1234567.5, 'USD');
      expect(formatted).toContain('1,234,567.50');
      expect(formatted).toContain('$');
    });

    it('supports hideSymbol option', () => {
      const formatted = formatMoney(1234567, 'NPR', { hideSymbol: true });
      expect(formatted).toBe('12,34,567');
    });

    it('supports compact notation', () => {
      const formatted = formatMoney(1500000, 'USD', { compact: true });
      expect(formatted).toContain('1.5M');
    });
  });

  describe('convert function', () => {
    it('returns exact amount when converting between the same currency', () => {
      expect(convert(100, 'USD', 'USD')).toBe(100);
      expect(convert(5000, 'NPR', 'NPR')).toBe(5000);
    });

    it('converts from USD to NPR based on rate table', () => {
      // 100 USD at 134.5 NPR/USD = 13450 NPR
      const result = convert(100, 'USD', 'NPR', { USD: 1.0, NPR: 134.5 });
      expect(result).toBe(13450);
    });

    it('converts from NPR to USD based on rate table', () => {
      const result = convert(13450, 'NPR', 'USD', { USD: 1.0, NPR: 134.5 });
      expect(result).toBe(100);
    });

    it('converts cross-currencies (e.g. NPR to INR)', () => {
      // Rates: 1 USD = 134.5 NPR, 1 USD = 84.05 INR
      // 13450 NPR = 100 USD = 8405 INR
      const result = convert(13450, 'NPR', 'INR', { USD: 1.0, NPR: 134.5, INR: 84.05 });
      expect(result).toBe(8405);
    });

    it('uses built-in fallback table when custom table is omitted', () => {
      const converted = convert(100, 'USD', 'NPR');
      expect(converted).toBeCloseTo(100 * FALLBACK_RATES.NPR, -1);
    });
  });
});
