import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Globe,
  Calendar,
  RotateCcw,
  RefreshCw,
  Coins,
  CheckCircle2,
  AlertTriangle,
  Sliders,
  Download,
  Upload,
  Trash2,
  FileText,
  X,
} from 'lucide-react';
import { useAppStore } from '@/store';
import { SUPPORTED_CURRENCIES } from '@/lib/currency';
import { CurrencyCode } from '@/types';
import { DEFAULT_THRESHOLDS } from '@/lib/finance';

export const SettingsPage: React.FC = () => {
  const {
    currency,
    requestCurrencyChange,
    calendar,
    setCalendar,
    exchangeRates,
    refreshExchangeRates,
    userThresholds,
    updateUserThresholds,
    resetUserThresholds,
    exportData,
    importData,
    clearAllData,
  } = useAppStore();

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Status & Feedback states
  const [importStatus, setImportStatus] = useState<{
    type: 'success' | 'error' | null;
    message: string;
  }>({ type: null, message: '' });

  // Confirmation modal state for Clear All Data
  const [showClearConfirm, setShowClearConfirm] = useState<boolean>(false);

  // Handle Export
  const handleExport = () => {
    try {
      const jsonString = exportData();
      const blob = new Blob([jsonString], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      const dateStr = new Date().toISOString().slice(0, 10);
      a.href = url;
      a.download = `myca-backup-${currency}-${dateStr}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch {
      setImportStatus({
        type: 'error',
        message: 'Failed to generate backup export file.',
      });
    }
  };

  // Handle File Upload & Import
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      const res = importData(content);
      if (res.success) {
        setImportStatus({
          type: 'success',
          message: 'Backup data imported successfully! All settings and history are restored.',
        });
      } else {
        setImportStatus({
          type: 'error',
          message: res.error || 'Failed to import backup.',
        });
      }
      // Reset input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    };
    reader.onerror = () => {
      setImportStatus({
        type: 'error',
        message: 'Could not read the selected file.',
      });
    };
    reader.readAsText(file);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.25 }}
      className="space-y-8 max-w-4xl mx-auto"
    >
      <div>
        <h1 className="text-2xl md:text-3xl font-extrabold text-slate-800 tracking-tight">
          Preferences & Settings
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Configure display currency, dual calendar formatting, rule thresholds, and client-side
          backups.
        </p>
      </div>

      {/* Import / Error Alert Notification */}
      <AnimatePresence>
        {importStatus.type && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className={`p-4 rounded-2xl flex items-start justify-between gap-3 border text-xs ${
              importStatus.type === 'success'
                ? 'bg-mint/15 border-mint/30 text-mint-dark'
                : 'bg-rose/15 border-rose/30 text-rose-dark'
            }`}
          >
            <div className="flex items-center gap-2">
              {importStatus.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 shrink-0 text-mint-dark" />
              ) : (
                <AlertTriangle className="w-4 h-4 shrink-0 text-rose-dark" />
              )}
              <span className="font-semibold">{importStatus.message}</span>
            </div>
            <button
              onClick={() => setImportStatus({ type: null, message: '' })}
              className="text-slate-400 hover:text-slate-600 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="space-y-6">
        {/* SECTION 1: Currency & Calendar */}
        <div className="space-y-3">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 px-1">
            Localization & Exchange Rates
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Currency Setting */}
            <div className="p-5 rounded-3xl bg-white/75 backdrop-blur-xl border border-pastel-border shadow-pastel flex flex-col justify-between space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-primary/10 flex items-center justify-center text-primary shrink-0">
                  <Globe className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-800 text-sm">Working Currency</h3>
                  <p className="text-xs text-slate-500">
                    All money inputs and results align to this
                  </p>
                </div>
              </div>

              <select
                value={currency}
                onChange={(e) => requestCurrencyChange(e.target.value as CurrencyCode)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-slate-200 text-xs font-mono font-bold text-slate-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
              >
                {Object.values(SUPPORTED_CURRENCIES).map((c) => (
                  <option key={c.code} value={c.code}>
                    {c.code} — {c.name} ({c.symbol})
                  </option>
                ))}
              </select>
            </div>

            {/* Calendar Standard */}
            <div className="p-5 rounded-3xl bg-white/75 backdrop-blur-xl border border-pastel-border shadow-pastel flex flex-col justify-between space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-mint/15 flex items-center justify-center text-mint-dark shrink-0">
                  <Calendar className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-800 text-sm">Calendar Standard</h3>
                  <p className="text-xs text-slate-500">Gregorian (AD) or Bikram Sambat (BS)</p>
                </div>
              </div>

              <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-100 border border-slate-200">
                <button
                  type="button"
                  onClick={() => setCalendar('AD')}
                  className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    calendar === 'AD'
                      ? 'bg-white text-primary font-bold shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  AD (Gregorian)
                </button>
                <button
                  type="button"
                  onClick={() => setCalendar('BS')}
                  className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    calendar === 'BS'
                      ? 'bg-white text-primary font-bold shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  BS (Bikram Sambat)
                </button>
              </div>
            </div>
          </div>

          {/* Exchange Rates Live Engine Card */}
          <div className="p-5 rounded-3xl bg-white/75 backdrop-blur-xl border border-pastel-border shadow-pastel flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-primary/10 flex items-center justify-center text-primary shrink-0">
                <Coins className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-slate-800 text-sm">Exchange Rate Engine</h3>
                  {exchangeRates.isLive ? (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-verdict-green/15 text-verdict-green">
                      <CheckCircle2 className="w-3 h-3" />
                      Live Active
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">
                      <AlertTriangle className="w-3 h-3" />
                      Offline Fallback Table
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  {exchangeRates.isLive && exchangeRates.lastUpdated
                    ? `Rates updated: ${exchangeRates.lastUpdated}`
                    : 'Using built-in offline rates table (base USD)'}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => refreshExchangeRates()}
              disabled={exchangeRates.isLoading}
              className="inline-flex items-center justify-center gap-2 px-3.5 py-2 rounded-xl bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold border border-slate-200 shadow-sm transition-all disabled:opacity-50"
            >
              <RefreshCw
                className={`w-3.5 h-3.5 text-primary ${
                  exchangeRates.isLoading ? 'animate-spin' : ''
                }`}
              />
              <span>{exchangeRates.isLoading ? 'Updating...' : 'Refresh Rates'}</span>
            </button>
          </div>
        </div>

        {/* SECTION 2: Financial Engine Thresholds */}
        <div className="p-6 md:p-8 rounded-3xl bg-white/75 backdrop-blur-xl border border-pastel-border shadow-pastel space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                <Sliders className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-slate-800 text-sm">Financial Engine Thresholds</h3>
                <p className="text-xs text-slate-500">
                  Customizable parameters governing debt ceilings, emergency buffers, and savings
                  rules
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => resetUserThresholds()}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors w-fit"
            >
              <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
              <span>Reset to Defaults</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {/* Threshold 1: EMI Cap % */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600">
                Max EMI Cap Ratio (%)
              </label>
              <div className="relative">
                <input
                  type="number"
                  min="10"
                  max="80"
                  step="1"
                  value={userThresholds.maxEmiCapPercent}
                  onChange={(e) =>
                    updateUserThresholds({ maxEmiCapPercent: Math.max(5, Number(e.target.value)) })
                  }
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-slate-200 font-mono text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
                <span className="absolute right-3.5 top-1/2 -translate-y-1/2 font-mono text-xs text-slate-400">
                  % of income
                </span>
              </div>
              <p className="text-[10px] text-slate-400">
                Default: {DEFAULT_THRESHOLDS.maxEmiCapPercent}% (Healthy ceiling)
              </p>
            </div>

            {/* Threshold 2: EF Months No Dependents */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600">
                Safety Fund (0 Dependents)
              </label>
              <div className="relative">
                <input
                  type="number"
                  min="1"
                  max="24"
                  step="1"
                  value={userThresholds.emergencyFundMonthsNoDependents}
                  onChange={(e) =>
                    updateUserThresholds({
                      emergencyFundMonthsNoDependents: Math.max(1, Number(e.target.value)),
                    })
                  }
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-slate-200 font-mono text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
                <span className="absolute right-3.5 top-1/2 -translate-y-1/2 font-mono text-xs text-slate-400">
                  Months
                </span>
              </div>
              <p className="text-[10px] text-slate-400">
                Default: {DEFAULT_THRESHOLDS.emergencyFundMonthsNoDependents} months
              </p>
            </div>

            {/* Threshold 3: EF Months With Dependents */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600">
                Safety Fund (1+ Dependents)
              </label>
              <div className="relative">
                <input
                  type="number"
                  min="1"
                  max="36"
                  step="1"
                  value={userThresholds.emergencyFundMonthsWithDependents}
                  onChange={(e) =>
                    updateUserThresholds({
                      emergencyFundMonthsWithDependents: Math.max(1, Number(e.target.value)),
                    })
                  }
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-slate-200 font-mono text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
                <span className="absolute right-3.5 top-1/2 -translate-y-1/2 font-mono text-xs text-slate-400">
                  Months
                </span>
              </div>
              <p className="text-[10px] text-slate-400">
                Default: {DEFAULT_THRESHOLDS.emergencyFundMonthsWithDependents} months
              </p>
            </div>

            {/* Threshold 4: Target Savings % */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600">
                Target Savings Ratio (%)
              </label>
              <div className="relative">
                <input
                  type="number"
                  min="5"
                  max="50"
                  step="1"
                  value={userThresholds.targetSavingsPercent}
                  onChange={(e) =>
                    updateUserThresholds({
                      targetSavingsPercent: Math.max(5, Number(e.target.value)),
                    })
                  }
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-slate-200 font-mono text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
                <span className="absolute right-3.5 top-1/2 -translate-y-1/2 font-mono text-xs text-slate-400">
                  % of income
                </span>
              </div>
              <p className="text-[10px] text-slate-400">
                Default: {DEFAULT_THRESHOLDS.targetSavingsPercent}% (50/30/20 benchmark)
              </p>
            </div>

            {/* Threshold 5: Expected Annual Return % */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600">
                Expected Annual Return (%)
              </label>
              <div className="relative">
                <input
                  type="number"
                  min="0"
                  max="30"
                  step="0.5"
                  value={userThresholds.expectedAnnualReturnPercent}
                  onChange={(e) =>
                    updateUserThresholds({
                      expectedAnnualReturnPercent: Math.max(0, Number(e.target.value)),
                    })
                  }
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-slate-200 font-mono text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
                <span className="absolute right-3.5 top-1/2 -translate-y-1/2 font-mono text-xs text-slate-400">
                  % p.a.
                </span>
              </div>
              <p className="text-[10px] text-slate-400">
                Opportunity cost rate (Default: {DEFAULT_THRESHOLDS.expectedAnnualReturnPercent}%)
              </p>
            </div>
          </div>
        </div>

        {/* SECTION 3: Backup Export & Import */}
        <div className="p-6 md:p-8 rounded-3xl bg-white/75 backdrop-blur-xl border border-pastel-border shadow-pastel space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-sky/15 flex items-center justify-center text-sky-dark shrink-0">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-800 text-sm">Data Backup & Migration</h3>
              <p className="text-xs text-slate-500">
                Export and import your entire financial model, settings, and analysis history as
                JSON
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            {/* Export Button */}
            <button
              type="button"
              onClick={handleExport}
              className="flex items-center justify-center gap-2 p-4 rounded-2xl bg-white hover:bg-slate-50 border border-slate-200 text-xs font-bold text-slate-700 shadow-xs transition-all hover:border-primary/40"
            >
              <Download className="w-4 h-4 text-primary" />
              <span>Export All Data (JSON)</span>
            </button>

            {/* Import Button */}
            <div>
              <input
                type="file"
                ref={fileInputRef}
                accept=".json,application/json"
                onChange={handleFileUpload}
                className="hidden"
                id="myca-import-json"
              />
              <label
                htmlFor="myca-import-json"
                className="flex items-center justify-center gap-2 p-4 rounded-2xl bg-white hover:bg-slate-50 border border-slate-200 text-xs font-bold text-slate-700 shadow-xs transition-all hover:border-primary/40 cursor-pointer"
              >
                <Upload className="w-4 h-4 text-primary" />
                <span>Import JSON Backup</span>
              </label>
            </div>
          </div>
          <p className="text-[11px] text-slate-400">
            Backed-up files include schema metadata version 3 and preserve your active currency.
          </p>
        </div>

        {/* SECTION 4: Clear All Data & Reset */}
        <div className="p-6 rounded-3xl bg-white/75 backdrop-blur-xl border border-rose-200 shadow-pastel flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-rose/15 flex items-center justify-center text-rose-dark shrink-0">
              <Trash2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-800 text-sm">Clear All Application Data</h3>
              <p className="text-xs text-slate-500">
                Wipes all stored financial profiles, saved analysis history, and custom thresholds
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setShowClearConfirm(true)}
            className="px-4 py-2.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-bold transition-colors w-fit"
          >
            Clear All Data...
          </button>
        </div>
      </div>

      {/* Clear Confirmation Modal */}
      <AnimatePresence>
        {showClearConfirm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="p-6 md:p-8 rounded-3xl bg-white border border-rose-200 shadow-pastel-lg max-w-md w-full space-y-4"
            >
              <div className="w-12 h-12 rounded-2xl bg-rose/15 text-rose-dark flex items-center justify-center mx-auto">
                <Trash2 className="w-6 h-6" />
              </div>
              <div className="text-center space-y-1">
                <h3 className="font-extrabold text-slate-800 text-lg">Clear All Stored Data?</h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  This will permanently erase your monthly salary inputs, living expenses, emergency
                  fund records, and all saved purchase analyses from your browser. This action
                  cannot be undone.
                </p>
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowClearConfirm(false)}
                  className="flex-1 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => {
                    clearAllData();
                    setShowClearConfirm(false);
                    setImportStatus({
                      type: 'success',
                      message: 'All application data has been cleared and reset to fresh defaults.',
                    });
                  }}
                  className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-sm transition-colors"
                >
                  Yes, Clear Everything
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};
