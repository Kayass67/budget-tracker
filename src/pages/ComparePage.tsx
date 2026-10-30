import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  Sliders,
  TrendingUp,
  Banknote,
  CreditCard,
  Trophy,
  ShieldCheck,
  RotateCcw,
  Sparkles,
  Zap,
} from 'lucide-react';
import { useAppStore } from '@/store';
import {
  compareOptions,
  affordabilityCash,
  affordabilityEMI,
  recoveryTime,
  verdictScore,
} from '@/lib/finance';
import { EMITerms, ProductInput, UserProfile } from '@/types';
import { SavingsProjectionChart, BudgetImpactBarChart } from '@/components/charts';

export const ComparePage: React.FC = () => {
  const { profile, formatValue, currentProduct, currentEmiTerms } = useAppStore();

  // In-page interactive Product State (initialized from currentProduct in store)
  const [productPrice, setProductPrice] = useState<number>(currentProduct.price || 150000);
  const [productName] = useState<string>(currentProduct.name || 'Target Purchase');

  // Sliders for EMI Loan Terms
  const [interestRate, setInterestRate] = useState<number>(
    currentEmiTerms.annualInterestRate || 12
  );
  const [tenureMonths, setTenureMonths] = useState<number>(currentEmiTerms.tenureMonths || 12);
  const [downPayment, setDownPayment] = useState<number>(currentEmiTerms.downPayment || 0);

  // "What if my income changes?" Slider (-50% to +50%)
  const [incomeDeltaPercent, setIncomeDeltaPercent] = useState<number>(0);

  // Clean simulated profile with adjusted income
  const simulatedIncome = Math.max(
    0,
    Math.round(profile.monthlyIncome * (1 + incomeDeltaPercent / 100))
  );

  const simulatedProfile: UserProfile = useMemo(
    () => ({
      ...profile,
      monthlyIncome: simulatedIncome,
    }),
    [profile, simulatedIncome]
  );

  const cleanProduct: ProductInput = useMemo(
    () => ({
      name: productName,
      category: currentProduct.category || 'General',
      price: Math.max(0, productPrice),
      expectedUsefulLifeYears: currentProduct.expectedUsefulLifeYears || 5,
    }),
    [productName, productPrice, currentProduct]
  );

  const activeEmiTerms: EMITerms = useMemo(
    () => ({
      downPayment: Math.min(cleanProduct.price, Math.max(0, downPayment)),
      annualInterestRate: Math.max(0, interestRate),
      tenureMonths: Math.max(1, tenureMonths),
      processingFee: currentEmiTerms.processingFee || 0,
      method: currentEmiTerms.method || 'reducing',
    }),
    [cleanProduct.price, downPayment, interestRate, tenureMonths, currentEmiTerms]
  );

  // Calculations derived live from finance engine
  const compareRes = useMemo(
    () => compareOptions(simulatedProfile, cleanProduct, activeEmiTerms),
    [simulatedProfile, cleanProduct, activeEmiTerms]
  );

  const cashAff = useMemo(
    () => affordabilityCash(simulatedProfile, cleanProduct),
    [simulatedProfile, cleanProduct]
  );

  const emiAff = useMemo(
    () => affordabilityEMI(simulatedProfile, cleanProduct, activeEmiTerms),
    [simulatedProfile, cleanProduct, activeEmiTerms]
  );

  const cashRec = useMemo(
    () => recoveryTime(simulatedProfile, cleanProduct, 'cash'),
    [simulatedProfile, cleanProduct]
  );

  const emiRec = useMemo(
    () => recoveryTime(simulatedProfile, cleanProduct, 'emi', activeEmiTerms),
    [simulatedProfile, cleanProduct, activeEmiTerms]
  );

  const cashVer = useMemo(
    () => verdictScore(simulatedProfile, cleanProduct, 'cash'),
    [simulatedProfile, cleanProduct]
  );

  const emiVer = useMemo(
    () => verdictScore(simulatedProfile, cleanProduct, 'emi', activeEmiTerms),
    [simulatedProfile, cleanProduct, activeEmiTerms]
  );

  // Winner derivations for 4 categories
  // 1. Cheapest Overall
  const cheapestWinner: 'cash' | 'emi' | 'tie' = compareRes.extraCostOfEMI === 0 ? 'tie' : 'cash';

  // 2. Lowest Monthly Strain
  const lowestStrainWinner: 'cash' | 'emi' = compareRes.lowerStrainOption;

  // 3. Fastest Recovery
  let fastestRecoveryWinner: 'cash' | 'emi' | 'tie' = 'tie';
  if (cashRec.monthsToRecover < emiRec.monthsToRecover) {
    fastestRecoveryWinner = 'cash';
  } else if (emiRec.monthsToRecover < cashRec.monthsToRecover) {
    fastestRecoveryWinner = 'emi';
  }

  // 4. Safest Option
  let safestWinner: 'cash' | 'emi' | 'tie' = 'tie';
  if (cashVer.score > emiVer.score) {
    safestWinner = 'cash';
  } else if (emiVer.score > cashVer.score) {
    safestWinner = 'emi';
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.25 }}
      className="space-y-8 max-w-6xl mx-auto"
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-slate-800 tracking-tight">
            Cash vs EMI Comparison
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Pit paying in full against loan installments with live rate, tenure, and income
            stress-testing.
          </p>
        </div>
      </div>

      {/* Interactive Control Panel */}
      <div className="p-6 md:p-8 rounded-3xl bg-white/75 backdrop-blur-xl border border-pastel-border shadow-pastel space-y-6">
        <div className="flex items-center gap-2 text-primary font-bold text-xs uppercase tracking-wider">
          <Sliders className="w-4 h-4" />
          <span>Simulation & Stress-Testing Parameters</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          {/* Item Price */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
              Item Price ({profile.currency})
            </label>
            <input
              type="number"
              min="0"
              value={productPrice || ''}
              onChange={(e) => setProductPrice(Math.max(0, Number(e.target.value)))}
              className="w-full px-3.5 py-2.5 rounded-xl bg-white/90 border border-slate-200 font-mono text-sm font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>

          {/* Down Payment */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
              Down Payment ({profile.currency})
            </label>
            <input
              type="number"
              min="0"
              max={cleanProduct.price}
              value={downPayment || ''}
              onChange={(e) => setDownPayment(Math.max(0, Number(e.target.value)))}
              className="w-full px-3.5 py-2.5 rounded-xl bg-white/90 border border-slate-200 font-mono text-sm font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>

          {/* Interest Rate Slider */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <label className="font-bold uppercase tracking-wider text-slate-600">
                Interest Rate:
              </label>
              <span className="font-mono font-bold text-primary">{interestRate}% p.a.</span>
            </div>
            <input
              type="range"
              min="0"
              max="28"
              step="0.5"
              value={interestRate}
              onChange={(e) => setInterestRate(Number(e.target.value))}
              className="w-full accent-primary h-2 bg-slate-200 rounded-lg cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-400 font-mono">
              <span>0% (No cost)</span>
              <span>12% (Standard)</span>
              <span>28%</span>
            </div>
          </div>

          {/* Tenure Slider */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <label className="font-bold uppercase tracking-wider text-slate-600">
                Loan Tenure:
              </label>
              <span className="font-mono font-bold text-primary">{tenureMonths} Months</span>
            </div>
            <input
              type="range"
              min="3"
              max="60"
              step="3"
              value={tenureMonths}
              onChange={(e) => setTenureMonths(Number(e.target.value))}
              className="w-full accent-primary h-2 bg-slate-200 rounded-lg cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-400 font-mono">
              <span>3m</span>
              <span>{(tenureMonths / 12).toFixed(1)} yrs</span>
              <span>60m</span>
            </div>
          </div>
        </div>

        {/* "What If My Income Changes?" Slider (±50%) */}
        <div className="p-4 md:p-5 rounded-2xl bg-gradient-to-r from-primary/10 via-white/70 to-mint/15 border border-primary/20 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-primary" />
              <h3 className="font-bold text-slate-800 text-xs uppercase tracking-wider">
                Stress-Test: What If My Income Changes?
              </h3>
            </div>
            <div className="flex items-center gap-3">
              <span className="font-mono font-bold text-xs text-slate-700">
                Simulated Income:{' '}
                <strong
                  className={`font-mono text-sm ${
                    incomeDeltaPercent > 0
                      ? 'text-mint-dark'
                      : incomeDeltaPercent < 0
                        ? 'text-verdict-red'
                        : 'text-slate-800'
                  }`}
                >
                  {formatValue(simulatedIncome)}
                </strong>
                <span className="ml-1 text-[11px] font-semibold text-slate-500">
                  ({incomeDeltaPercent > 0 ? `+${incomeDeltaPercent}%` : `${incomeDeltaPercent}%`})
                </span>
              </span>
              {incomeDeltaPercent !== 0 && (
                <button
                  type="button"
                  onClick={() => setIncomeDeltaPercent(0)}
                  className="flex items-center gap-1 text-[11px] font-semibold text-slate-500 hover:text-primary transition-colors"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Reset</span>
                </button>
              )}
            </div>
          </div>

          <input
            type="range"
            min="-50"
            max="50"
            step="5"
            value={incomeDeltaPercent}
            onChange={(e) => setIncomeDeltaPercent(Number(e.target.value))}
            className="w-full accent-primary h-2.5 bg-slate-200 rounded-lg cursor-pointer"
          />

          <div className="flex justify-between text-[10px] text-slate-400 font-mono font-medium">
            <span className="text-verdict-red">-50% Salary Cut</span>
            <span>Current ({formatValue(profile.monthlyIncome)})</span>
            <span className="text-mint-dark">+50% Salary Raise</span>
          </div>
        </div>
      </div>

      {/* Side-by-Side Comparison Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
        {/* OPTION A: Full Cash Card */}
        <div className="p-6 md:p-8 rounded-3xl bg-white/80 backdrop-blur-xl border border-pastel-border shadow-pastel flex flex-col justify-between space-y-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-mint/15 text-mint-dark flex items-center justify-center">
                  <Banknote className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-800 text-lg">
                    Option A: Pay in Full (Cash)
                  </h3>
                  <p className="text-xs text-slate-500">Zero debt, immediate full ownership</p>
                </div>
              </div>
              <div className="text-right">
                <span className="font-mono text-xl font-extrabold text-slate-800">
                  {formatValue(cleanProduct.price)}
                </span>
                <span className="block text-[10px] font-bold text-mint-dark uppercase">
                  100% Upfront
                </span>
              </div>
            </div>

            {/* Winner Badges Achieved by Cash */}
            <div className="flex flex-wrap gap-2">
              {cheapestWinner === 'cash' && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-mint/15 text-mint-dark text-xs font-bold border border-mint/30 shadow-xs">
                  <Trophy className="w-3.5 h-3.5" />
                  <span>Cheapest Overall (Saves {formatValue(compareRes.extraCostOfEMI)})</span>
                </span>
              )}
              {lowestStrainWinner === 'cash' && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-sky/15 text-sky-dark text-xs font-bold border border-sky/30">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Lowest Monthly Strain</span>
                </span>
              )}
              {fastestRecoveryWinner === 'cash' && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold border border-primary/20">
                  <Zap className="w-3.5 h-3.5" />
                  <span>Fastest Recovery (~{cashRec.monthsToRecover} mos)</span>
                </span>
              )}
              {safestWinner === 'cash' && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-verdict-green/15 text-verdict-green text-xs font-bold border border-verdict-green/30">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Safest Decision ({cashVer.score}/100)</span>
                </span>
              )}
            </div>

            {/* Metric Rows */}
            <div className="space-y-3 pt-2 text-xs">
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50/70 border border-slate-100">
                <span className="text-slate-600 font-medium">Financing Surcharge:</span>
                <span className="font-mono font-bold text-mint-dark">
                  {formatValue(0)} (0% extra)
                </span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50/70 border border-slate-100">
                <span className="text-slate-600 font-medium">Monthly Outflow:</span>
                <span className="font-mono font-bold text-slate-800">
                  {formatValue(0)} / mo (Zero ongoing debt)
                </span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50/70 border border-slate-100">
                <span className="text-slate-600 font-medium">Time to Recover Wealth:</span>
                <span className="font-mono font-bold text-slate-800">
                  {cashRec.monthsToRecover === Infinity
                    ? 'Not achievable'
                    : `${cashRec.monthsToRecover} Months`}
                </span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50/70 border border-slate-100">
                <span className="text-slate-600 font-medium">Emergency Fund Protected:</span>
                <span
                  className={`font-mono font-bold ${cashAff.emergencyFundIntact ? 'text-verdict-green' : 'text-verdict-red'}`}
                >
                  {cashAff.emergencyFundIntact ? '100% Intact' : 'Dips into reserve buffer'}
                </span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50/70 border border-slate-100">
                <span className="text-slate-600 font-medium">
                  Min Salary Required (at 20% savings):
                </span>
                <span className="font-mono font-bold text-primary">
                  {formatValue(cashAff.minimumIncomeRequired)}
                </span>
              </div>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-white border border-pastel-border/80 flex items-center justify-between">
            <span className="text-xs font-bold text-slate-700">Cash Verdict Rating:</span>
            <span
              className={`px-3 py-1 rounded-full text-xs font-bold font-mono ${
                cashVer.label === 'Safe to Buy'
                  ? 'bg-verdict-green/15 text-verdict-green'
                  : cashVer.label === 'Buy With Caution'
                    ? 'bg-amber-100 text-amber-800'
                    : 'bg-rose/15 text-rose-dark'
              }`}
            >
              {cashVer.score}/100 • {cashVer.label}
            </span>
          </div>
        </div>

        {/* OPTION B: EMI Installments Card */}
        <div className="p-6 md:p-8 rounded-3xl bg-white/80 backdrop-blur-xl border border-pastel-border shadow-pastel flex flex-col justify-between space-y-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
                  <CreditCard className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-800 text-lg">Option B: Pay by EMI</h3>
                  <p className="text-xs text-slate-500">
                    {tenureMonths} monthly payments at {interestRate}% rate
                  </p>
                </div>
              </div>
              <div className="text-right">
                <span className="font-mono text-xl font-extrabold text-primary">
                  {formatValue(emiAff.newEMI)}
                </span>
                <span className="block text-[10px] font-bold text-slate-400 uppercase">
                  / month
                </span>
              </div>
            </div>

            {/* Winner Badges Achieved by EMI */}
            <div className="flex flex-wrap gap-2">
              {lowestStrainWinner === 'emi' && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-sky/15 text-sky-dark text-xs font-bold border border-sky/30 shadow-xs">
                  <Trophy className="w-3.5 h-3.5" />
                  <span>Lowest Monthly Strain (Preserves Cash Cushion)</span>
                </span>
              )}
              {fastestRecoveryWinner === 'emi' && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold border border-primary/20">
                  <Zap className="w-3.5 h-3.5" />
                  <span>Fastest Recovery</span>
                </span>
              )}
              {safestWinner === 'emi' && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-verdict-green/15 text-verdict-green text-xs font-bold border border-verdict-green/30">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Safest Decision ({emiVer.score}/100)</span>
                </span>
              )}
            </div>

            {/* Metric Rows */}
            <div className="space-y-3 pt-2 text-xs">
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50/70 border border-slate-100">
                <span className="text-slate-600 font-medium">Total Interest & Fees:</span>
                <span className="font-mono font-bold text-amber-700">
                  +{formatValue(compareRes.extraCostOfEMI)} (+{compareRes.extraCostPercent}%)
                </span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50/70 border border-slate-100">
                <span className="text-slate-600 font-medium">Upfront Down Payment + Fees:</span>
                <span className="font-mono font-bold text-slate-800">
                  {formatValue(activeEmiTerms.downPayment + (activeEmiTerms.processingFee || 0))}
                </span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50/70 border border-slate-100">
                <span className="text-slate-600 font-medium">Total Lifetime Outflow:</span>
                <span className="font-mono font-bold text-slate-800">
                  {formatValue(emiAff.emiCost.totalCost)}
                </span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50/70 border border-slate-100">
                <span className="text-slate-600 font-medium">New Debt-to-Income (DTI):</span>
                <span
                  className={`font-mono font-bold ${
                    emiAff.dtiStatus === 'healthy'
                      ? 'text-mint-dark'
                      : emiAff.dtiStatus === 'risky'
                        ? 'text-amber-700'
                        : 'text-verdict-red'
                  }`}
                >
                  {(emiAff.newDTI * 100).toFixed(1)}% ({emiAff.dtiStatus})
                </span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50/70 border border-slate-100">
                <span className="text-slate-600 font-medium">
                  Min Salary Required (DTI + 20% savings):
                </span>
                <span className="font-mono font-bold text-primary">
                  {formatValue(emiAff.minimumIncomeRequired)}
                </span>
              </div>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-white border border-pastel-border/80 flex items-center justify-between">
            <span className="text-xs font-bold text-slate-700">EMI Verdict Rating:</span>
            <span
              className={`px-3 py-1 rounded-full text-xs font-bold font-mono ${
                emiVer.label === 'Safe to Buy'
                  ? 'bg-verdict-green/15 text-verdict-green'
                  : emiVer.label === 'Buy With Caution'
                    ? 'bg-amber-100 text-amber-800'
                    : 'bg-rose/15 text-rose-dark'
              }`}
            >
              {emiVer.score}/100 • {emiVer.label}
            </span>
          </div>
        </div>
      </div>

      {/* CA's Recommendation Callout */}
      <div className="p-6 md:p-7 rounded-3xl bg-gradient-to-r from-primary/10 via-white/80 to-mint/15 border border-primary/20 backdrop-blur-xl shadow-pastel flex items-start gap-4">
        <div className="w-10 h-10 rounded-2xl bg-primary text-white flex items-center justify-center shrink-0 shadow-sm">
          <Sparkles className="w-5 h-5" />
        </div>
        <div className="space-y-1">
          <h4 className="font-bold text-slate-800 text-sm">CA's Comparative Verdict</h4>
          <p className="text-xs text-slate-700 leading-relaxed font-normal">
            {compareRes.recommendation}
          </p>
        </div>
      </div>

      {/* Statutory Disclaimer */}
      <p className="text-center text-[11px] text-slate-500 font-medium px-2">
        Note: This is a guidance tool, not professional financial advice.
      </p>

      {/* Live Chart Visualizations */}
      <div className="space-y-6">
        <h3 className="font-extrabold text-slate-800 text-lg tracking-tight">
          Trajectory & Recovery Comparison
        </h3>
        <SavingsProjectionChart
          profile={simulatedProfile}
          product={cleanProduct}
          emiTerms={activeEmiTerms}
        />
        <BudgetImpactBarChart
          profile={simulatedProfile}
          product={cleanProduct}
          paymentOption="emi"
          emiTerms={activeEmiTerms}
        />
      </div>
    </motion.div>
  );
};
