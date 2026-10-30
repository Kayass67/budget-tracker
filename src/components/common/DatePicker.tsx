import React, { useMemo } from 'react';
import { useAppStore } from '@/store';
import {
  adToBs,
  bsToAd,
  parseDate,
  toIsoDateString,
  getBsDaysInMonth,
  NEPALI_MONTHS,
  GREGORIAN_MONTHS,
  formatDate,
} from '@/lib/date';
import { CalendarSystem } from '@/types';
import { Calendar as CalendarIcon, ArrowLeftRight } from 'lucide-react';

export interface DatePickerProps {
  value?: string; // ISO date string e.g. '2024-05-15'
  onChange: (isoDateString: string) => void;
  label?: string;
  calendar?: CalendarSystem;
  className?: string;
  disabled?: boolean;
}

export const DatePicker: React.FC<DatePickerProps> = ({
  value,
  onChange,
  label,
  calendar: calendarProp,
  className = '',
  disabled = false,
}) => {
  const storeCalendar = useAppStore((state) => state.calendar);
  const activeCalendar = calendarProp || storeCalendar;

  // Resolve current date safely
  const currentDate = useMemo(() => {
    return value ? parseDate(value) : new Date();
  }, [value]);

  // BS Representation
  const bsDetails = useMemo(() => adToBs(currentDate), [currentDate]);

  // AD Representation
  const adYear = currentDate.getFullYear();
  const adMonth = currentDate.getMonth() + 1; // 1-12
  const adDay = currentDate.getDate();

  // BS years range: 2040 to 2095 BS
  const bsYears = useMemo(() => {
    const years: number[] = [];
    for (let y = 2040; y <= 2095; y++) {
      years.push(y);
    }
    return years;
  }, []);

  // AD years range: 1985 to 2040 AD
  const adYears = useMemo(() => {
    const years: number[] = [];
    for (let y = 1985; y <= 2040; y++) {
      years.push(y);
    }
    return years;
  }, []);

  // Compute maximum days in current month
  const maxBsDays = useMemo(() => {
    return getBsDaysInMonth(bsDetails.year, bsDetails.month);
  }, [bsDetails.year, bsDetails.month]);

  const maxAdDays = useMemo(() => {
    return new Date(adYear, adMonth, 0).getDate();
  }, [adYear, adMonth]);

  // Handler for BS date part changes
  const handleBsChange = (
    newYear: number = bsDetails.year,
    newMonth: number = bsDetails.month,
    newDay: number = bsDetails.day
  ) => {
    const validMaxDays = getBsDaysInMonth(newYear, newMonth);
    const clampedDay = Math.min(newDay, validMaxDays);
    const newAdDate = bsToAd(newYear, newMonth, clampedDay);
    onChange(toIsoDateString(newAdDate));
  };

  // Handler for AD date part changes
  const handleAdChange = (
    newYear: number = adYear,
    newMonth: number = adMonth,
    newDay: number = adDay
  ) => {
    const validMaxDays = new Date(newYear, newMonth, 0).getDate();
    const clampedDay = Math.min(newDay, validMaxDays);
    const newAdDate = new Date(newYear, newMonth - 1, clampedDay, 12, 0, 0);
    onChange(toIsoDateString(newAdDate));
  };

  return (
    <div className={`space-y-2 ${className}`}>
      {label && (
        <div className="flex items-center justify-between">
          <label className="text-xs font-semibold uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
            <CalendarIcon className="w-3.5 h-3.5 text-primary" />
            <span>{label}</span>
          </label>
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-primary/10 text-primary-700">
            {activeCalendar} Mode
          </span>
        </div>
      )}

      {/* Date Pickers Container */}
      <div className="p-3.5 rounded-2xl bg-white/70 backdrop-blur-md border border-pastel-border shadow-pastel-sm hover:shadow-pastel transition-all">
        {activeCalendar === 'BS' ? (
          /* ================= Bikram Sambat (BS) Controls ================= */
          <div className="space-y-2.5">
            <div className="grid grid-cols-12 gap-2">
              {/* BS Year */}
              <div className="col-span-4">
                <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">
                  BS Year
                </label>
                <select
                  disabled={disabled}
                  value={bsDetails.year}
                  onChange={(e) =>
                    handleBsChange(Number(e.target.value), bsDetails.month, bsDetails.day)
                  }
                  className="w-full px-2.5 py-1.5 rounded-xl bg-white/80 border border-slate-200 text-xs font-mono font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-primary/20"
                >
                  {bsYears.map((y) => (
                    <option key={y} value={y}>
                      {y} BS
                    </option>
                  ))}
                </select>
              </div>

              {/* BS Month with Nepali Names */}
              <div className="col-span-5">
                <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">
                  BS Month
                </label>
                <select
                  disabled={disabled}
                  value={bsDetails.month}
                  onChange={(e) =>
                    handleBsChange(bsDetails.year, Number(e.target.value), bsDetails.day)
                  }
                  className="w-full px-2.5 py-1.5 rounded-xl bg-white/80 border border-slate-200 text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-primary/20"
                >
                  {NEPALI_MONTHS.map((m) => (
                    <option key={m.monthNumber} value={m.monthNumber}>
                      {m.nameEn} ({m.nameNp})
                    </option>
                  ))}
                </select>
              </div>

              {/* BS Day */}
              <div className="col-span-3">
                <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">
                  Day
                </label>
                <select
                  disabled={disabled}
                  value={bsDetails.day}
                  onChange={(e) =>
                    handleBsChange(bsDetails.year, bsDetails.month, Number(e.target.value))
                  }
                  className="w-full px-2.5 py-1.5 rounded-xl bg-white/80 border border-slate-200 text-xs font-mono font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-primary/20"
                >
                  {Array.from({ length: maxBsDays }, (_, i) => i + 1).map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Equivalent AD Indicator */}
            <div className="flex items-center justify-between pt-1 text-[11px] text-slate-500 border-t border-slate-100">
              <span className="flex items-center gap-1">
                <ArrowLeftRight className="w-3 h-3 text-primary" />
                <span>Equivalent AD Date:</span>
              </span>
              <span className="font-mono font-medium text-slate-700">
                {formatDate(currentDate, 'AD', { includeEra: true })}
              </span>
            </div>
          </div>
        ) : (
          /* ================= Gregorian (AD) Controls ================= */
          <div className="space-y-2.5">
            <div className="grid grid-cols-12 gap-2">
              {/* AD Year */}
              <div className="col-span-4">
                <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">
                  Year
                </label>
                <select
                  disabled={disabled}
                  value={adYear}
                  onChange={(e) => handleAdChange(Number(e.target.value), adMonth, adDay)}
                  className="w-full px-2.5 py-1.5 rounded-xl bg-white/80 border border-slate-200 text-xs font-mono font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-primary/20"
                >
                  {adYears.map((y) => (
                    <option key={y} value={y}>
                      {y} AD
                    </option>
                  ))}
                </select>
              </div>

              {/* AD Month */}
              <div className="col-span-5">
                <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">
                  Month
                </label>
                <select
                  disabled={disabled}
                  value={adMonth}
                  onChange={(e) => handleAdChange(adYear, Number(e.target.value), adDay)}
                  className="w-full px-2.5 py-1.5 rounded-xl bg-white/80 border border-slate-200 text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-primary/20"
                >
                  {GREGORIAN_MONTHS.map((name, idx) => (
                    <option key={idx + 1} value={idx + 1}>
                      {name}
                    </option>
                  ))}
                </select>
              </div>

              {/* AD Day */}
              <div className="col-span-3">
                <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">
                  Day
                </label>
                <select
                  disabled={disabled}
                  value={adDay}
                  onChange={(e) => handleAdChange(adYear, adMonth, Number(e.target.value))}
                  className="w-full px-2.5 py-1.5 rounded-xl bg-white/80 border border-slate-200 text-xs font-mono font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-primary/20"
                >
                  {Array.from({ length: maxAdDays }, (_, i) => i + 1).map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Equivalent BS Indicator */}
            <div className="flex items-center justify-between pt-1 text-[11px] text-slate-500 border-t border-slate-100">
              <span className="flex items-center gap-1">
                <ArrowLeftRight className="w-3 h-3 text-primary" />
                <span>Equivalent BS Date:</span>
              </span>
              <span className="font-mono font-medium text-slate-700">
                {formatDate(currentDate, 'BS', { includeEra: true })}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
