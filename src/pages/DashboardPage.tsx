import React from 'react';
import { motion } from 'framer-motion';
import {
  Wallet,
  ShieldCheck,
  CreditCard,
  Sparkles,
  ArrowRight,
  History,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  PiggyBank,
  Compass,
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useAppStore } from '@/store';
import { monthlySurplus, emergencyFundTarget, budgetHealth, getProfileValues } from '@/lib/finance';
import { DateText } from '@/components/common/DateText';
import { BudgetHealthDonut } from '@/components/charts';
import { AnalysisHistoryItem } from '@/types';

export const DashboardPage: React.FC = () => {
  const {
    profile,
    formatValue,
    analysisHistory,
    deleteAnalysis,
    updateCurrentProduct,
    updateCurrentEmiTerms,
  } = useAppStore();

  const navigate = useNavigate();

  const { income, existingEMIs } = getProfileValues(profile);
  const netSurplus = monthlySurplus(profile);
  const efTarget = emergencyFundTarget(profile);
  const health = budgetHealth(profile);

  // Derived metrics
  const savingsRate = income > 0 ? (netSurplus / income) * 100 : 0;
  const dti = income > 0 ? (existingEMIs / income) * 100 : 0;

  const efFundedPercent =
    efTarget.targetAmount > 0
      ? Math.min(100, Math.round((profile.emergencyFundCurrent / efTarget.targetAmount) * 100))
      : 100;

  // Handler to reload a historical analysis into Analyzer
  const handleReloadItem = (item: AnalysisHistoryItem) => {
    updateCurrentProduct(item.product);
    if (item.emiTerms) {
      updateCurrentEmiTerms(item.emiTerms);
    }
    navigate('/analyzer');
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.25 }}
      className="space-y-8 max-w-6xl mx-auto"
    >
      {/* Welcome Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-primary-500/15 via-primary-400/10 to-mint/20 p-6 md:p-8 border border-primary/20 backdrop-blur-md shadow-pastel">
        <div className="relative z-10 max-w-2xl space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary-700 text-xs font-semibold tracking-wide">
            <Sparkles className="w-3.5 h-3.5" />
            <span>AI Chartered Accountant Active</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-slate-800 tracking-tight">
            Can I afford this? Let&apos;s run the numbers.
          </h1>
          <p className="text-sm md:text-base text-slate-600 leading-relaxed">
            MyCA evaluates your savings safety buffer, compares full-cash vs EMI options, and models
            exact replenishment timelines with zero bank bias.
          </p>
          <div className="pt-2 flex flex-wrap gap-3">
            <Link
              to="/analyzer"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-white font-medium text-sm shadow-sm hover:bg-primary-600 transition-colors"
            >
              <span>Analyze a Purchase</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              to="/compare"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/70 hover:bg-white text-slate-700 font-medium text-sm border border-pastel-border transition-colors backdrop-blur-sm"
            >
              <span>Compare Cash vs EMI</span>
            </Link>
            <Link
              to="/profile"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/70 hover:bg-white text-slate-700 font-medium text-sm border border-pastel-border transition-colors backdrop-blur-sm"
            >
              <span>Update Finances</span>
            </Link>
          </div>
        </div>
      </div>

      {/* 4 Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Monthly Surplus */}
        <div className="p-5 rounded-2xl bg-white/75 backdrop-blur-md border border-pastel-border shadow-pastel hover:shadow-pastel-lg transition-all duration-300 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Monthly Surplus
              </span>
              <div className="w-9 h-9 rounded-xl bg-mint/15 flex items-center justify-center text-mint-dark">
                <Wallet className="w-5 h-5" />
              </div>
            </div>
            <div
              className={`mt-3 font-mono text-2xl font-bold ${
                netSurplus >= 0 ? 'text-slate-800' : 'text-verdict-red'
              }`}
            >
              {formatValue(netSurplus)}
            </div>
          </div>
          <div className="mt-2 text-xs flex items-center justify-between text-slate-500">
            <span>Free cash flow</span>
            <span
              className={`font-semibold font-mono text-[11px] ${
                netSurplus > 0 ? 'text-mint-dark' : 'text-verdict-red'
              }`}
            >
              {netSurplus > 0 ? 'Surplus' : 'Deficit'}
            </span>
          </div>
        </div>

        {/* Card 2: Savings Rate */}
        <div className="p-5 rounded-2xl bg-white/75 backdrop-blur-md border border-pastel-border shadow-pastel hover:shadow-pastel-lg transition-all duration-300 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Savings Rate
              </span>
              <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                <PiggyBank className="w-5 h-5" />
              </div>
            </div>
            <div
              className={`mt-3 font-mono text-2xl font-bold ${
                savingsRate >= 20
                  ? 'text-mint-dark'
                  : savingsRate > 0
                    ? 'text-amber-600'
                    : 'text-verdict-red'
              }`}
            >
              {savingsRate.toFixed(1)}%
            </div>
          </div>
          <div className="mt-2 text-xs flex items-center justify-between text-slate-500">
            <span>Benchmark: ≥20%</span>
            <span
              className={`font-semibold text-[11px] ${
                savingsRate >= 20 ? 'text-mint-dark' : 'text-amber-600'
              }`}
            >
              {savingsRate >= 20 ? 'Healthy' : 'Below Target'}
            </span>
          </div>
        </div>

        {/* Card 3: Emergency Fund Status */}
        <div className="p-5 rounded-2xl bg-white/75 backdrop-blur-md border border-pastel-border shadow-pastel hover:shadow-pastel-lg transition-all duration-300 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Emergency Cushion
              </span>
              <div className="w-9 h-9 rounded-xl bg-sky/15 flex items-center justify-center text-sky-dark">
                <ShieldCheck className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-3 font-mono text-2xl font-bold text-slate-800">
              {formatValue(profile.emergencyFundCurrent, undefined, { compact: true })}
            </div>
          </div>
          <div className="mt-2 space-y-1">
            <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full ${efFundedPercent >= 100 ? 'bg-mint' : 'bg-sky'}`}
                style={{ width: `${efFundedPercent}%` }}
              />
            </div>
            <div className="text-[11px] text-slate-500 flex items-center justify-between">
              <span>{efTarget.targetMonths} mos buffer</span>
              <span className="font-mono font-semibold text-slate-700">{efFundedPercent}%</span>
            </div>
          </div>
        </div>

        {/* Card 4: Total EMI Burden */}
        <div className="p-5 rounded-2xl bg-white/75 backdrop-blur-md border border-pastel-border shadow-pastel hover:shadow-pastel-lg transition-all duration-300 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Total EMI Burden (DTI)
              </span>
              <div className="w-9 h-9 rounded-xl bg-peach/20 flex items-center justify-center text-peach-dark">
                <CreditCard className="w-5 h-5" />
              </div>
            </div>
            <div
              className={`mt-3 font-mono text-2xl font-bold ${
                dti <= 40 ? 'text-slate-800' : 'text-verdict-red'
              }`}
            >
              {formatValue(existingEMIs)}
            </div>
          </div>
          <div className="mt-2 text-xs flex items-center justify-between text-slate-500">
            <span>{dti.toFixed(1)}% of income</span>
            <span
              className={`font-semibold font-mono text-[11px] ${
                dti <= 40 ? 'text-mint-dark' : 'text-verdict-red'
              }`}
            >
              {dti === 0 ? 'No Debt' : dti <= 40 ? 'Safe DTI' : 'Strained DTI'}
            </span>
          </div>
        </div>
      </div>

      {/* Middle Section: Budget Health Donut & Financial Vital Signs */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Budget Health Donut (50/30/20 Ideal vs Actual) */}
        <div className="lg:col-span-6">
          <BudgetHealthDonut profile={profile} />
        </div>

        {/* Financial Vital Signs & Guidelines */}
        <div className="lg:col-span-6 p-6 md:p-7 rounded-3xl bg-white/75 backdrop-blur-xl border border-pastel-border shadow-pastel space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <Compass className="w-4 h-4 text-primary" />
              <h3 className="font-bold text-slate-800 text-sm">Financial Health Diagnostic</h3>
            </div>
            <span
              className={`px-3 py-1 rounded-full text-xs font-mono font-bold ${
                health.healthScore >= 80
                  ? 'bg-verdict-green/15 text-verdict-green'
                  : health.healthScore >= 50
                    ? 'bg-amber-100 text-amber-800'
                    : 'bg-rose/15 text-rose-dark'
              }`}
            >
              {health.healthScore}/100 Grade
            </span>
          </div>

          <p className="text-xs text-slate-600 leading-relaxed font-normal">{health.summary}</p>

          <div className="space-y-2.5 pt-1 text-xs">
            {/* Needs check */}
            <div className="flex items-start gap-2.5 p-3 rounded-xl bg-white/60 border border-slate-100">
              {health.meetsNeedsRule ? (
                <CheckCircle2 className="w-4 h-4 text-verdict-green shrink-0 mt-0.5" />
              ) : (
                <AlertTriangle className="w-4 h-4 text-verdict-amber shrink-0 mt-0.5" />
              )}
              <div>
                <span className="font-bold text-slate-700">Needs (Fixed + EMIs): </span>
                <span className="text-slate-600">
                  Takes {(health.needsRatio * 100).toFixed(1)}% of income (Ideal ≤ 50%).
                </span>
              </div>
            </div>

            {/* Wants check */}
            <div className="flex items-start gap-2.5 p-3 rounded-xl bg-white/60 border border-slate-100">
              {health.meetsWantsRule ? (
                <CheckCircle2 className="w-4 h-4 text-verdict-green shrink-0 mt-0.5" />
              ) : (
                <AlertTriangle className="w-4 h-4 text-verdict-amber shrink-0 mt-0.5" />
              )}
              <div>
                <span className="font-bold text-slate-700">Wants (Lifestyle): </span>
                <span className="text-slate-600">
                  Takes {(health.wantsRatio * 100).toFixed(1)}% of income (Ideal ≤ 30%).
                </span>
              </div>
            </div>

            {/* Savings check */}
            <div className="flex items-start gap-2.5 p-3 rounded-xl bg-white/60 border border-slate-100">
              {health.meetsSavingsRule ? (
                <CheckCircle2 className="w-4 h-4 text-verdict-green shrink-0 mt-0.5" />
              ) : (
                <AlertTriangle className="w-4 h-4 text-verdict-amber shrink-0 mt-0.5" />
              )}
              <div>
                <span className="font-bold text-slate-700">Savings Cushion: </span>
                <span className="text-slate-600">
                  Saves {(health.savingsRatio * 100).toFixed(1)}% of income (Ideal ≥ 20%).
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* History of Saved Analyses */}
      <div className="p-6 md:p-8 rounded-3xl bg-white/75 backdrop-blur-xl border border-pastel-border shadow-pastel space-y-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <History className="w-5 h-5 text-primary" />
            <div>
              <h3 className="font-bold text-slate-800 text-base">
                Saved Analysis History ({analysisHistory.length})
              </h3>
              <p className="text-xs text-slate-500">
                Purchases evaluated with your Personal Chartered Accountant
              </p>
            </div>
          </div>

          {analysisHistory.length > 0 && (
            <Link
              to="/analyzer"
              className="text-xs font-semibold text-primary hover:underline flex items-center gap-1"
            >
              <span>New Analysis</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          )}
        </div>

        {analysisHistory.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {analysisHistory.map((item) => (
              <div
                key={item.id}
                className="p-4 rounded-2xl bg-white/80 border border-pastel-border shadow-pastel-sm flex flex-col justify-between space-y-3 hover:shadow-pastel transition-all"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-400 font-mono text-[11px]">
                      <DateText date={item.createdAt} />
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        item.verdictLabel === 'Safe to Buy'
                          ? 'bg-verdict-green/15 text-verdict-green'
                          : item.verdictLabel === 'Buy With Caution'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-rose/15 text-rose-dark'
                      }`}
                    >
                      {item.verdictScore}/100 • {item.verdictLabel}
                    </span>
                  </div>

                  <h4 className="font-bold text-slate-800 text-sm line-clamp-1">
                    {item.product.name}
                  </h4>

                  <div className="flex items-center gap-2 text-xs text-slate-500 font-mono">
                    <span className="font-bold text-slate-700">
                      {formatValue(item.product.price, item.currency)}
                    </span>
                    <span>•</span>
                    <span className="uppercase text-[10px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded">
                      {item.paymentOption}
                    </span>
                  </div>

                  <div className="text-[11px] text-slate-500 font-mono flex items-center justify-between pt-1">
                    <span>Recovery:</span>
                    <span className="font-bold text-slate-700">
                      {item.monthsToRecover === Infinity
                        ? 'Not achievable'
                        : `${item.monthsToRecover} Months`}
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                  <button
                    onClick={() => handleReloadItem(item)}
                    className="text-xs font-semibold text-primary hover:underline flex items-center gap-1"
                  >
                    <span>View Details</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                  <button
                    onClick={() => deleteAnalysis(item.id)}
                    className="p-1 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-50 transition-colors"
                    title="Delete record"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          /* Empty State */
          <div className="flex flex-col items-center justify-center p-10 rounded-2xl border border-dashed border-primary/20 bg-primary/5 text-center space-y-3">
            <div className="w-14 h-14 rounded-2xl bg-white shadow-pastel flex items-center justify-center text-primary">
              <Sparkles className="w-7 h-7" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-slate-800">No Past Analyses Yet</h4>
              <p className="text-xs text-slate-500 mt-1 max-w-sm leading-relaxed">
                Thinking about buying a smartphone, laptop, vehicle, or appliance? Evaluate your
                affordability and replenishment speed with peace of mind.
              </p>
            </div>
            <Link
              to="/analyzer"
              className="mt-2 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-white text-xs font-bold shadow-sm hover:bg-primary-600 transition-colors"
            >
              <span>Analyze Your First Purchase</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        )}
      </div>
    </motion.div>
  );
};
