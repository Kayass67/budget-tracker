import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeftRight, Tag, X, AlertCircle } from 'lucide-react';
import { useAppStore } from '@/store';
import { SUPPORTED_CURRENCIES } from '@/lib/currency';

export const CurrencySwitchModal: React.FC = () => {
  const {
    currency: oldCurrency,
    pendingCurrencyChange: newCurrency,
    confirmCurrencyChange,
    cancelCurrencyChange,
  } = useAppStore();

  if (!newCurrency) return null;

  const oldConfig = SUPPORTED_CURRENCIES[oldCurrency] || SUPPORTED_CURRENCIES.NPR;
  const newConfig = SUPPORTED_CURRENCIES[newCurrency] || SUPPORTED_CURRENCIES.USD;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          className="relative w-full max-w-md p-6 rounded-3xl bg-white/95 backdrop-blur-2xl border border-pastel-border shadow-pastel-lg space-y-5"
        >
          {/* Header */}
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-primary/10 flex items-center justify-center text-primary shrink-0">
                <ArrowLeftRight className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-extrabold text-slate-800 text-base">
                  Switch to {newConfig.code} ({newConfig.symbol})
                </h3>
                <p className="text-xs text-slate-500">
                  Changing working currency from {oldConfig.code} to {newConfig.code}
                </p>
              </div>
            </div>

            <button
              onClick={() => cancelCurrencyChange()}
              className="p-1 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="p-3.5 rounded-2xl bg-primary-50/50 border border-primary/15 text-xs text-slate-600 flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 text-primary shrink-0 mt-0.5" />
            <span>
              You have active financial data entered in{' '}
              <strong className="font-mono">{oldConfig.code}</strong>. Choose how you would like
              MyCA to handle your numbers:
            </span>
          </div>

          {/* Action Choices */}
          <div className="space-y-3">
            {/* Choice A: Convert (Default & Recommended) */}
            <button
              onClick={() => confirmCurrencyChange(true)}
              className="w-full p-4 rounded-2xl bg-gradient-to-r from-primary to-primary-600 hover:from-primary-600 hover:to-primary-700 text-white shadow-pastel text-left transition-all duration-200 group flex items-start gap-3.5"
            >
              <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center shrink-0 mt-0.5">
                <ArrowLeftRight className="w-4 h-4 text-white" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-sm">Convert my numbers to {newConfig.code}</span>
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-white/20 text-white uppercase tracking-wider">
                    Recommended
                  </span>
                </div>
                <p className="text-xs text-white/80 mt-1 leading-normal">
                  Recalculates your salary, living expenses, savings, and in-progress product price
                  using current exchange rates.
                </p>
              </div>
            </button>

            {/* Choice B: Keep Numbers */}
            <button
              onClick={() => confirmCurrencyChange(false)}
              className="w-full p-4 rounded-2xl bg-white hover:bg-slate-50 text-slate-800 border border-slate-200 shadow-sm text-left transition-all duration-200 group flex items-start gap-3.5"
            >
              <div className="w-8 h-8 rounded-xl bg-slate-100 flex items-center justify-center shrink-0 mt-0.5 text-slate-600">
                <Tag className="w-4 h-4" />
              </div>
              <div>
                <span className="font-bold text-sm text-slate-800">
                  Keep the numbers, just change the currency
                </span>
                <p className="text-xs text-slate-500 mt-1 leading-normal">
                  Leaves your numeric amounts unchanged (e.g. 80,000 stays 80,000) and only switches
                  the label and symbol to {newConfig.symbol}.
                </p>
              </div>
            </button>
          </div>

          {/* Cancel */}
          <div className="pt-1 flex justify-end">
            <button
              onClick={() => cancelCurrencyChange()}
              className="px-4 py-2 rounded-xl text-slate-500 hover:text-slate-800 text-xs font-semibold transition-colors"
            >
              Cancel (Keep {oldConfig.code})
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
