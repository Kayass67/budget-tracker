import NepaliDate, { dateConfigMap } from 'nepali-date-converter';
import { CalendarSystem } from '@/types';

export interface NepaliMonthMeta {
  index: number; // 0-indexed (0 to 11)
  monthNumber: number; // 1-indexed (1 to 12)
  nameEn: string;
  nameNp: string;
  key: string;
}

export const NEPALI_MONTHS: NepaliMonthMeta[] = [
  { index: 0, monthNumber: 1, nameEn: 'Baisakh', nameNp: 'वैशाख', key: 'Baisakh' },
  { index: 1, monthNumber: 2, nameEn: 'Jestha', nameNp: 'जेठ', key: 'Jestha' },
  { index: 2, monthNumber: 3, nameEn: 'Asar', nameNp: 'असार', key: 'Asar' },
  { index: 3, monthNumber: 4, nameEn: 'Shrawan', nameNp: 'श्रावण', key: 'Shrawan' },
  { index: 4, monthNumber: 5, nameEn: 'Bhadra', nameNp: 'भाद्र', key: 'Bhadra' },
  { index: 5, monthNumber: 6, nameEn: 'Aswin', nameNp: 'असोज', key: 'Aswin' },
  { index: 6, monthNumber: 7, nameEn: 'Kartik', nameNp: 'कार्तिक', key: 'Kartik' },
  { index: 7, monthNumber: 8, nameEn: 'Mangsir', nameNp: 'मंसिर', key: 'Mangsir' },
  { index: 8, monthNumber: 9, nameEn: 'Poush', nameNp: 'पुष', key: 'Poush' },
  { index: 9, monthNumber: 10, nameEn: 'Magh', nameNp: 'माघ', key: 'Magh' },
  { index: 10, monthNumber: 11, nameEn: 'Falgun', nameNp: 'फागुन', key: 'Falgun' },
  { index: 11, monthNumber: 12, nameEn: 'Chaitra', nameNp: 'चैत', key: 'Chaitra' },
];

export const GREGORIAN_MONTHS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

/**
 * Safe parser for dates, preventing timezone offset rollover bugs
 */
export function parseDate(dateInput: Date | string | number): Date {
  if (dateInput instanceof Date) {
    return dateInput;
  }
  if (typeof dateInput === 'string') {
    const match = dateInput.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (match) {
      const year = parseInt(match[1], 10);
      const month = parseInt(match[2], 10) - 1;
      const day = parseInt(match[3], 10);
      return new Date(year, month, day, 12, 0, 0);
    }
  }
  return new Date(dateInput);
}

/**
 * Formats a JS Date to a pure ISO date string YYYY-MM-DD
 */
export function toIsoDateString(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export interface BsDateDetails {
  year: number;
  month: number; // 1-12
  monthIndex: number; // 0-11
  day: number;
  monthNameEn: string;
  monthNameNp: string;
  formatted: string;
  formattedNp: string;
}

/**
 * Converts an AD date to BS (Bikram Sambat) details
 */
export function adToBs(dateInput: Date | string | number): BsDateDetails {
  const adDate = parseDate(dateInput);
  const nepaliDate = new NepaliDate(adDate);

  const year = nepaliDate.getYear();
  const monthIndex = nepaliDate.getMonth(); // 0-11
  const monthNumber = monthIndex + 1;
  const day = nepaliDate.getDate();

  const meta = NEPALI_MONTHS[monthIndex] || NEPALI_MONTHS[0];

  return {
    year,
    month: monthNumber,
    monthIndex,
    day,
    monthNameEn: meta.nameEn,
    monthNameNp: meta.nameNp,
    formatted: `${day} ${meta.nameEn} ${year} BS`,
    formattedNp: `${day} ${meta.nameNp} ${year} वि.सं.`,
  };
}

/**
 * Converts BS year, month (1-12), and day to an AD Date object
 */
export function bsToAd(year: number, monthNumber: number, day: number): Date {
  const safeMonthIndex = Math.min(Math.max(monthNumber - 1, 0), 11);
  const nepaliDate = new NepaliDate(year, safeMonthIndex, day);
  return nepaliDate.toJsDate();
}

/**
 * Returns the exact number of days in a specific BS year and month
 */
export function getBsDaysInMonth(year: number, monthNumber: number): number {
  const safeMonthIndex = Math.min(Math.max(monthNumber - 1, 0), 11);
  const meta = NEPALI_MONTHS[safeMonthIndex];

  const yearConfig = (dateConfigMap as Record<string, Record<string, number>>)[String(year)];
  if (yearConfig && meta && yearConfig[meta.key]) {
    return yearConfig[meta.key];
  }
  return 30; // fallback default
}

/**
 * Backward compatibility alias for step 1
 */
export function convertAdToBs(adDate: Date) {
  const details = adToBs(adDate);
  return {
    year: details.year,
    month: details.month,
    day: details.day,
    formatted: details.formatted,
  };
}

export interface FormatDateOptions {
  includeEra?: boolean;
  useNepaliScript?: boolean;
}

/**
 * Universal date formatter supporting AD and BS calendar modes
 */
export function formatDate(
  dateInput: Date | string | number,
  calendar: CalendarSystem = 'AD',
  options?: FormatDateOptions
): string {
  if (calendar === 'BS') {
    const bs = adToBs(dateInput);
    if (options?.useNepaliScript) {
      return bs.formattedNp;
    }
    return options?.includeEra !== false ? bs.formatted : `${bs.day} ${bs.monthNameEn} ${bs.year}`;
  }

  const adDate = parseDate(dateInput);
  const day = adDate.getDate();
  const monthName = GREGORIAN_MONTHS[adDate.getMonth()];
  const year = adDate.getFullYear();

  return options?.includeEra ? `${day} ${monthName} ${year} AD` : `${day} ${monthName} ${year}`;
}
