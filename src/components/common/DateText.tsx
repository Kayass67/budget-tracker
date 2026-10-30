import React from 'react';
import { useAppStore } from '@/store';
import { formatDate, FormatDateOptions } from '@/lib/date';
import { CalendarSystem } from '@/types';

export interface DateTextProps extends FormatDateOptions {
  date: string | Date | number;
  calendar?: CalendarSystem;
  className?: string;
  fallback?: string;
}

/**
 * Renders any stored AD date in the currently active calendar (BS or AD)
 */
export const DateText: React.FC<DateTextProps> = ({
  date,
  calendar: calendarProp,
  className = '',
  fallback = '—',
  includeEra,
  useNepaliScript,
}) => {
  const storeCalendar = useAppStore((state) => state.calendar);
  const activeCalendar = calendarProp || storeCalendar;

  if (!date) {
    return <span className={className}>{fallback}</span>;
  }

  let formattedText: string;
  try {
    formattedText = formatDate(date, activeCalendar, {
      includeEra,
      useNepaliScript,
    });
  } catch {
    formattedText = fallback;
  }

  return <span className={className}>{formattedText}</span>;
};
