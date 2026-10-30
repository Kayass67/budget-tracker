import { CurrencyCode, CurrencyConfig, ExchangeRatesState } from '@/types';

export const SUPPORTED_CURRENCIES: Record<CurrencyCode, CurrencyConfig> = {
  NPR: {
    code: 'NPR',
    name: 'Nepalese Rupee',
    symbol: 'रू',
    locale: 'en-IN',
    rateAgainstUSD: 134.5,
    digits: 0,
  },
  USD: {
    code: 'USD',
    name: 'US Dollar',
    symbol: '$',
    locale: 'en-US',
    rateAgainstUSD: 1.0,
    digits: 2,
  },
  GBP: {
    code: 'GBP',
    name: 'British Pound',
    symbol: '£',
    locale: 'en-GB',
    rateAgainstUSD: 0.78,
    digits: 2,
  },
  EUR: {
    code: 'EUR',
    name: 'Euro',
    symbol: '€',
    locale: 'de-DE',
    rateAgainstUSD: 0.92,
    digits: 2,
  },
  INR: {
    code: 'INR',
    name: 'Indian Rupee',
    symbol: '₹',
    locale: 'en-IN',
    rateAgainstUSD: 84.05,
    digits: 0,
  },
  AUD: {
    code: 'AUD',
    name: 'Australian Dollar',
    symbol: 'A$',
    locale: 'en-AU',
    rateAgainstUSD: 1.52,
    digits: 2,
  },
  CAD: {
    code: 'CAD',
    name: 'Canadian Dollar',
    symbol: 'CA$',
    locale: 'en-CA',
    rateAgainstUSD: 1.39,
    digits: 2,
  },
  JPY: {
    code: 'JPY',
    name: 'Japanese Yen',
    symbol: '¥',
    locale: 'ja-JP',
    rateAgainstUSD: 153.2,
    digits: 0,
  },
  CNY: {
    code: 'CNY',
    name: 'Chinese Yuan',
    symbol: '¥',
    locale: 'zh-CN',
    rateAgainstUSD: 7.15,
    digits: 2,
  },
  AED: {
    code: 'AED',
    name: 'UAE Dirham',
    symbol: 'AED',
    locale: 'en-AE',
    rateAgainstUSD: 3.67,
    digits: 2,
  },
  SAR: {
    code: 'SAR',
    name: 'Saudi Riyal',
    symbol: 'SAR',
    locale: 'en-SA',
    rateAgainstUSD: 3.75,
    digits: 2,
  },
  QAR: {
    code: 'QAR',
    name: 'Qatari Riyal',
    symbol: 'QAR',
    locale: 'en-QA',
    rateAgainstUSD: 3.64,
    digits: 2,
  },
  MYR: {
    code: 'MYR',
    name: 'Malaysian Ringgit',
    symbol: 'RM',
    locale: 'en-MY',
    rateAgainstUSD: 4.4,
    digits: 2,
  },
  SGD: {
    code: 'SGD',
    name: 'Singapore Dollar',
    symbol: 'S$',
    locale: 'en-SG',
    rateAgainstUSD: 1.32,
    digits: 2,
  },
  CHF: {
    code: 'CHF',
    name: 'Swiss Franc',
    symbol: 'CHF',
    locale: 'de-CH',
    rateAgainstUSD: 0.87,
    digits: 2,
  },
  KRW: {
    code: 'KRW',
    name: 'South Korean Won',
    symbol: '₩',
    locale: 'ko-KR',
    rateAgainstUSD: 1380.0,
    digits: 0,
  },
  THB: {
    code: 'THB',
    name: 'Thai Baht',
    symbol: '฿',
    locale: 'th-TH',
    rateAgainstUSD: 33.8,
    digits: 2,
  },
  HKD: {
    code: 'HKD',
    name: 'Hong Kong Dollar',
    symbol: 'HK$',
    locale: 'zh-HK',
    rateAgainstUSD: 7.77,
    digits: 2,
  },
  NZD: {
    code: 'NZD',
    name: 'New Zealand Dollar',
    symbol: 'NZ$',
    locale: 'en-NZ',
    rateAgainstUSD: 1.67,
    digits: 2,
  },
  BDT: {
    code: 'BDT',
    name: 'Bangladeshi Taka',
    symbol: '৳',
    locale: 'en-IN',
    rateAgainstUSD: 120.0,
    digits: 0,
  },
  LKR: {
    code: 'LKR',
    name: 'Sri Lankan Rupee',
    symbol: 'Rs',
    locale: 'en-LK',
    rateAgainstUSD: 295.0,
    digits: 0,
  },
  PKR: {
    code: 'PKR',
    name: 'Pakistani Rupee',
    symbol: 'Rs',
    locale: 'en-PK',
    rateAgainstUSD: 278.0,
    digits: 0,
  },
};

export const CURRENCY_LIST: CurrencyConfig[] = Object.values(SUPPORTED_CURRENCIES);

export const FALLBACK_RATES: Record<string, number> = Object.fromEntries(
  CURRENCY_LIST.map((c) => [c.code, c.rateAgainstUSD])
);

export interface FormatMoneyOptions {
  compact?: boolean;
  hideSymbol?: boolean;
  decimalPlaces?: number;
  useNprCode?: boolean; // Displays "NPR" instead of "रू"
}

/**
 * Formats a monetary amount into the specified currency representation.
 * - NPR and INR adhere to the South Asian / Indian numbering system (12,34,567).
 * - NPR displays as "रू" by default, or "NPR" if specified.
 */
export function formatMoney(
  amount: number,
  currencyCode: CurrencyCode = 'NPR',
  options?: FormatMoneyOptions
): string {
  const config = SUPPORTED_CURRENCIES[currencyCode] || SUPPORTED_CURRENCIES.USD;
  const isNegative = amount < 0;
  const absAmount = Math.abs(amount);

  // Decimal places: respect option, fallback to currency config
  const decimals = options?.decimalPlaces !== undefined ? options.decimalPlaces : config.digits;

  let formattedNumber: string;

  if (options?.compact && absAmount >= 1000) {
    // Compact notation e.g. 12.5k, 1.2M
    const compactFormatter = new Intl.NumberFormat('en-US', {
      notation: 'compact',
      maximumFractionDigits: 1,
    });
    formattedNumber = compactFormatter.format(absAmount);
  } else if (currencyCode === 'NPR' || currencyCode === 'INR') {
    // Indian digit grouping style: 12,34,567
    const formatter = new Intl.NumberFormat('en-IN', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    });
    formattedNumber = formatter.format(absAmount);
  } else {
    // Standard international locale formatting
    const formatter = new Intl.NumberFormat(config.locale, {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    });
    formattedNumber = formatter.format(absAmount);
  }

  if (options?.hideSymbol) {
    return isNegative ? `-${formattedNumber}` : formattedNumber;
  }

  let symbol = config.symbol;
  if (currencyCode === 'NPR' && options?.useNprCode) {
    symbol = 'NPR';
  }

  const sign = isNegative ? '-' : '';
  return `${sign}${symbol} ${formattedNumber}`;
}

/**
 * Backward compatibility alias for formatMoney
 */
export const formatCurrency = formatMoney;

/**
 * Converts a given amount from one currency to another using the provided
 * rates table (or the built-in fallback table if not specified).
 */
export function convert(
  amount: number,
  from: CurrencyCode,
  to: CurrencyCode,
  ratesTable?: Record<string, number>
): number {
  if (from === to || amount === 0) return amount;

  const rates = ratesTable || FALLBACK_RATES;
  const fromRate = rates[from] || FALLBACK_RATES[from] || 1.0;
  const toRate = rates[to] || FALLBACK_RATES[to] || 1.0;

  // Convert to USD base first, then to target currency
  const amountInUSD = amount / fromRate;
  const convertedAmount = amountInUSD * toRate;

  // Round reasonably according to target currency precision
  const targetConfig = SUPPORTED_CURRENCIES[to];
  const digits = targetConfig ? targetConfig.digits : 2;

  if (digits === 0) {
    return Math.round(convertedAmount);
  }
  const factor = Math.pow(10, digits);
  return Math.round(convertedAmount * factor) / factor;
}

/**
 * Backward compatibility alias for convert
 */
export const convertCurrency = convert;

/**
 * Rounds an amount according to currency standards:
 * - Whole units for currencies with 0 decimal places or high exchange rates (>= 1000 per USD)
 * - 2 decimal places for currencies with minor units
 */
export function roundToCurrency(amount: number, currencyCode: CurrencyCode): number {
  const config = SUPPORTED_CURRENCIES[currencyCode];
  const digits = config ? config.digits : 2;
  if (digits === 0 || (config && config.rateAgainstUSD >= 1000)) {
    return Math.round(amount);
  }
  return Math.round(amount * 100) / 100;
}

// LocalStorage caching constant
export const CACHE_STORAGE_KEY = 'myca_exchange_rates_cache';
const TWENTY_FOUR_HOURS_MS = 24 * 60 * 60 * 1000;

interface CachedRatesData {
  rates: Record<string, number>;
  lastUpdated: string;
  timestamp: number;
}

/**
 * Loads exchange rates:
 * 1. Checks 24-hr valid cache in localStorage
 * 2. Fetches live rates from https://open.er-api.com/v6/latest/USD
 * 3. Silently falls back to built-in table if request fails or offline
 */
export async function loadExchangeRates(): Promise<ExchangeRatesState> {
  // Check localStorage cache first
  try {
    const rawCache = localStorage.getItem(CACHE_STORAGE_KEY);
    if (rawCache) {
      const cached: CachedRatesData = JSON.parse(rawCache);
      const isFresh = Date.now() - cached.timestamp < TWENTY_FOUR_HOURS_MS;
      if (isFresh && cached.rates && Object.keys(cached.rates).length > 0) {
        return {
          rates: { ...FALLBACK_RATES, ...cached.rates },
          lastUpdated: cached.lastUpdated,
          isLive: true,
          isLoading: false,
          error: null,
        };
      }
    }
  } catch {
    // Ignore localStorage parse errors
  }

  // Fetch live rates from open.er-api.com
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6000);

    const response = await fetch('https://open.er-api.com/v6/latest/USD', {
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (response.ok) {
      const data = await response.json();
      if (data && data.result === 'success' && data.rates) {
        const lastUpdated = data.time_last_update_utc || new Date().toUTCString();
        const mergedRates = { ...FALLBACK_RATES, ...data.rates };

        // Save to cache
        try {
          const cachePayload: CachedRatesData = {
            rates: mergedRates,
            lastUpdated,
            timestamp: Date.now(),
          };
          localStorage.setItem(CACHE_STORAGE_KEY, JSON.stringify(cachePayload));
        } catch {
          // LocalStorage full or disabled
        }

        return {
          rates: mergedRates,
          lastUpdated,
          isLive: true,
          isLoading: false,
          error: null,
        };
      }
    }
  } catch {
    // Network or abort error: fall through to fallback
  }

  // If live fetch fails, check if we have any stale cache to use
  try {
    const rawCache = localStorage.getItem(CACHE_STORAGE_KEY);
    if (rawCache) {
      const cached: CachedRatesData = JSON.parse(rawCache);
      if (cached.rates) {
        return {
          rates: { ...FALLBACK_RATES, ...cached.rates },
          lastUpdated: cached.lastUpdated,
          isLive: true,
          isLoading: false,
          error: 'Using cached rates (offline)',
        };
      }
    }
  } catch {
    // Ignore
  }

  // Built-in fallback table
  return {
    rates: FALLBACK_RATES,
    lastUpdated: null,
    isLive: false,
    isLoading: false,
    error: 'Using offline built-in rates',
  };
}
