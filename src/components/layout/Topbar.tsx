import React from 'react';
import { useLocation } from 'react-router-dom';
import { Globe, Calendar as CalendarIcon } from 'lucide-react';
import { useAppStore } from '@/store';
import { SUPPORTED_CURRENCIES } from '@/lib/currency';
import { formatDate } from '@/lib/date';
import { CurrencyCode } from '@/types';

const routeTitles: Record<string, string> = {
  '/': 'Financial Overview',
  '/profile': 'Profile & Cash Flow',
  '/analyzer': 'Affordability Analyzer',
  '/compare': 'Purchase Comparison',
  '/settings': 'Settings & Preferences',
};

export const Topbar: React.FC = () => {
  const location = useLocation();
  const { currency, requestCurrencyChange, calendar, setCalendar } = useAppStore();

  const currentTitle = routeTitles[location.pathname] || 'Dashboard';
  const todayFormatted = formatDate(new Date(), calendar);

  return (
    <header className="sticky top-0 z-20 w-full bg-white/60 backdrop-blur-md border-b border-pastel-border px-4 md:px-8 py-3.5 flex items-center justify-between gap-4">
      {/* Page Title & Mobile Brand */}
      <div className="flex items-center gap-3">
        <div className="md:hidden w-8 h-8 rounded-xl bg-gradient-to-tr from-primary to-primary-400 flex items-center justify-center text-white font-bold text-xs shadow-pastel">
          CA
        </div>
        <div>
          <h2 className="text-base md:text-lg font-bold text-slate-800 tracking-tight">
            {currentTitle}
          </h2>
          <div className="hidden sm:flex items-center gap-2 text-xs text-slate-500 font-mono">
            <CalendarIcon className="w-3.5 h-3.5 text-primary" />
            <span>{todayFormatted}</span>
          </div>
        </div>
      </div>

      {/* Controls: Currency Selector & BS/AD Toggle */}
      <div className="flex items-center gap-2 md:gap-3">
        {/* BS / AD Calendar Toggle */}
        <div className="flex items-center p-1 rounded-xl bg-white/70 border border-pastel-border shadow-pastel-sm">
          <button
            type="button"
            onClick={() => setCalendar('AD')}
            className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-all ${
              calendar === 'AD'
                ? 'bg-primary text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
            title="Gregorian Calendar (AD)"
          >
            AD
          </button>
          <button
            type="button"
            onClick={() => setCalendar('BS')}
            className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-all ${
              calendar === 'BS'
                ? 'bg-primary text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
            title="Bikram Sambat Calendar (BS)"
          >
            BS
          </button>
        </div>

        {/* Currency Dropdown Selector */}
        <div className="relative flex items-center">
          <div className="relative">
            <select
              value={currency}
              onChange={(e) => requestCurrencyChange(e.target.value as CurrencyCode)}
              className="appearance-none pl-8 pr-7 py-1.5 rounded-xl bg-white/80 border border-pastel-border text-xs font-bold font-mono text-slate-800 shadow-pastel-sm hover:bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 cursor-pointer transition-all"
            >
              {Object.values(SUPPORTED_CURRENCIES).map((c) => (
                <option key={c.code} value={c.code}>
                  {c.code} ({c.symbol})
                </option>
              ))}
            </select>
            <Globe className="w-3.5 h-3.5 text-primary absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <span className="text-[10px] text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none">
              ▼
            </span>
          </div>
        </div>
      </div>
    </header>
  );
};
