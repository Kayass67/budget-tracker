import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CreditCard,
  Banknote,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  BookmarkCheck,
  Bookmark,
  Trash2,
  ChevronDown,
  ChevronUp,
  Tag,
  Percent,
  History,
  ShieldCheck,
} from 'lucide-react';
import { useAppStore } from '@/store';
import {
  affordabilityCash,
  affordabilityEMI,
  recoveryTime,
  verdictScore,
  generateCAAdvice,
} from '@/lib/finance';
import { ProductInput, AnalysisHistoryItem } from '@/types';
import { SUPPORTED_CURRENCIES } from '@/lib/currency';
import { DateText } from '@/components/common/DateText';
import { VerdictGauge } from '@/components/analyzer/VerdictGauge';
import {
  EmiBreakdownDonut,
  AmortizationAreaChart,
  SavingsProjectionChart,
  BudgetImpactBarChart,
  RecoveryTimelineChart,
} from '@/components/charts';

const PRODUCT_CATEGORIES = [
  'Electronics & Tech',
  'Vehicle / Two-Wheeler',
  'Home Appliance',
  'Smartphone',
  'Furniture & Living',
  'Travel & Vacation',
  'Education & Upskilling',
  'Luxury & Fashion',
  'Other',
];

export const AnalyzerPage: React.FC = () => {
  const {
    currency,
    profile,
    formatValue,
    saveAnalysis,
    analysisHistory,
    deleteAnalysis,
    currentProduct,
    updateCurrentProduct,
    currentEmiTerms,
    updateCurrentEmiTerms,
  } = useAppStore();

  const profileCurrency = SUPPORTED_CURRENCIES[currency] || SUPPORTED_CURRENCIES.NPR;

  // Step 1: Product State from Store (stays reactive across currency switches)
  const product = currentProduct;
  const [showAdvancedProduct, setShowAdvancedProduct] = useState<boolean>(false);

  // Step 2: Payment Option State ('cash' | 'emi')
  const [paymentOption, setPaymentOption] = useState<'cash' | 'emi'>('cash');
  const emiTerms = currentEmiTerms;

  // Saved alert toast state
  const [justSavedId, setJustSavedId] = useState<string | null>(null);

  // Live Calculations (Directly from Engine)
  const safeProductPrice = Math.max(0, product.price || 0);

  const cleanProduct: ProductInput = useMemo(
    () => ({
      ...product,
      price: safeProductPrice,
    }),
    [product, safeProductPrice]
  );

  const cashAff = useMemo(() => affordabilityCash(profile, cleanProduct), [profile, cleanProduct]);

  const emiAff = useMemo(
    () => affordabilityEMI(profile, cleanProduct, emiTerms),
    [profile, cleanProduct, emiTerms]
  );

  const recovery = useMemo(
    () => recoveryTime(profile, cleanProduct, paymentOption, emiTerms),
    [profile, cleanProduct, paymentOption, emiTerms]
  );

  const verdict = useMemo(
    () => verdictScore(profile, cleanProduct, paymentOption, emiTerms),
    [profile, cleanProduct, paymentOption, emiTerms]
  );

  const caAdvice = useMemo(
    () =>
      generateCAAdvice({
        profile,
        product: cleanProduct,
        option: paymentOption,
        emiTerms,
        cashAff,
        emiAff,
        recovery,
        verdict,
        formatFn: (amount, curr) => formatValue(amount, curr),
      }),
    [
      profile,
      cleanProduct,
      paymentOption,
      emiTerms,
      cashAff,
      emiAff,
      recovery,
      verdict,
      formatValue,
    ]
  );

  // Handle Save Analysis
  const handleSaveCurrentAnalysis = () => {
    const newId = saveAnalysis({
      currency: profile.currency,
      product: cleanProduct,
      paymentOption,
      emiTerms: paymentOption === 'emi' ? emiTerms : undefined,
      verdictScore: verdict.score,
      verdictLabel: verdict.label,
      monthlyEMI: paymentOption === 'emi' ? emiAff.newEMI : undefined,
      monthsToRecover: recovery.monthsToRecover,
      totalCost: paymentOption === 'emi' ? emiAff.emiCost.totalCost : cleanProduct.price,
    });
    setJustSavedId(newId);
    setTimeout(() => setJustSavedId(null), 3000);
  };

  // Load a saved analysis back into state
  const handleLoadSaved = (item: AnalysisHistoryItem) => {
    updateCurrentProduct(item.product);
    setPaymentOption(item.paymentOption);
    if (item.emiTerms) {
      updateCurrentEmiTerms(item.emiTerms);
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Key metrics derivation
  const canAffordNow = paymentOption === 'cash' ? cashAff.canPayNow : emiAff.downPaymentAffordable;
  const currentSurplusAfter =
    paymentOption === 'cash' ? cashAff.monthlySurplus : emiAff.surplusAfterEMI;
  const savingsRateAfter =
    profile.monthlyIncome > 0 ? (currentSurplusAfter / profile.monthlyIncome) * 100 : 0;
  const dtiPercent = (emiAff.newDTI * 100).toFixed(1);

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      {/* Title */}
      <div>
        <h1 className="text-2xl md:text-3xl font-extrabold text-slate-800 tracking-tight">
          Can I Afford This?
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Evaluate purchasing power, debt sustainability, and recovery time with your Personal
          Chartered Accountant.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left 6 Columns: Inputs (Step 1 & Step 2) */}
        <div className="lg:col-span-6 space-y-6">
          {/* STEP 1: Product Details */}
          <div className="p-6 rounded-3xl bg-white/75 backdrop-blur-xl border border-pastel-border shadow-pastel space-y-4">
            <div className="flex items-center gap-2.5 text-primary font-bold text-xs uppercase tracking-wider">
              <span className="w-5 h-5 rounded-full bg-primary text-white flex items-center justify-center text-[10px]">
                1
              </span>
              <span>Product & Pricing Details</span>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                  Product / Item Name
                </label>
                <input
                  type="text"
                  value={product.name}
                  onChange={(e) => updateCurrentProduct({ name: e.target.value })}
                  placeholder="e.g. MacBook Air M3, Honda Dio, Sony OLED"
                  className="w-full px-4 py-2.5 rounded-xl bg-white/90 border border-slate-200 text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                    Category
                  </label>
                  <div className="relative">
                    <select
                      value={product.category}
                      onChange={(e) => updateCurrentProduct({ category: e.target.value })}
                      className="w-full appearance-none pl-3.5 pr-8 py-2.5 rounded-xl bg-white/90 border border-slate-200 text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-primary/20 cursor-pointer"
                    >
                      {PRODUCT_CATEGORIES.map((cat) => (
                        <option key={cat} value={cat}>
                          {cat}
                        </option>
                      ))}
                    </select>
                    <Tag className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                    Price ({profile.currency})
                  </label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-mono text-xs font-bold text-slate-400">
                      {profileCurrency.symbol}
                    </span>
                    <input
                      type="number"
                      min="0"
                      value={product.price || ''}
                      onChange={(e) =>
                        updateCurrentProduct({ price: Math.max(0, Number(e.target.value)) })
                      }
                      className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-white/90 border border-slate-200 font-mono text-sm font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-primary/20"
                    />
                  </div>
                </div>
              </div>

              {/* Optional Collapsible: Resale & Useful Life */}
              <div>
                <button
                  type="button"
                  onClick={() => setShowAdvancedProduct(!showAdvancedProduct)}
                  className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-primary transition-colors"
                >
                  {showAdvancedProduct ? (
                    <ChevronUp className="w-3.5 h-3.5" />
                  ) : (
                    <ChevronDown className="w-3.5 h-3.5" />
                  )}
                  <span>
                    {showAdvancedProduct
                      ? 'Hide Optional Lifecycle Data'
                      : 'Add Optional Resale & Useful Life'}
                  </span>
                </button>

                <AnimatePresence>
                  {showAdvancedProduct && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-3 overflow-hidden"
                    >
                      <div>
                        <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">
                          Expected Useful Life (Years)
                        </label>
                        <input
                          type="number"
                          min="1"
                          max="30"
                          value={product.expectedUsefulLifeYears || ''}
                          onChange={(e) =>
                            updateCurrentProduct({
                              expectedUsefulLifeYears: Math.max(1, Number(e.target.value)),
                            })
                          }
                          placeholder="e.g. 5"
                          className="w-full px-3 py-2 rounded-xl bg-white/90 border border-slate-200 font-mono text-xs text-slate-800"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">
                          Estimated Resale Value ({profileCurrency.symbol})
                        </label>
                        <input
                          type="number"
                          min="0"
                          value={product.resaleValueAfterNYears || ''}
                          onChange={(e) =>
                            updateCurrentProduct({
                              resaleValueAfterNYears: Math.max(0, Number(e.target.value)),
                            })
                          }
                          placeholder="e.g. 40000"
                          className="w-full px-3 py-2 rounded-xl bg-white/90 border border-slate-200 font-mono text-xs text-slate-800"
                        />
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>

          {/* STEP 2: Big Payment Option Selector (Cash vs EMI) */}
          <div className="space-y-4">
            <div className="flex items-center gap-2.5 text-primary font-bold text-xs uppercase tracking-wider px-1">
              <span className="w-5 h-5 rounded-full bg-primary text-white flex items-center justify-center text-[10px]">
                2
              </span>
              <span>Select Payment Strategy</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Option A: Cash Card */}
              <div
                onClick={() => setPaymentOption('cash')}
                className={`cursor-pointer p-5 rounded-3xl border transition-all duration-200 relative ${
                  paymentOption === 'cash'
                    ? 'bg-white border-primary shadow-pastel-lg ring-2 ring-primary/20 scale-[1.01]'
                    : 'bg-white/60 border-pastel-border hover:bg-white/80'
                }`}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="w-10 h-10 rounded-2xl bg-mint/15 flex items-center justify-center text-mint-dark">
                    <Banknote className="w-5 h-5" />
                  </div>
                  <input
                    type="radio"
                    name="paymentMethod"
                    checked={paymentOption === 'cash'}
                    onChange={() => setPaymentOption('cash')}
                    className="accent-primary w-4 h-4"
                  />
                </div>
                <h3 className="font-bold text-slate-800 text-sm">Pay in Full (Cash)</h3>
                <p className="text-xs text-slate-500 mt-1">
                  100% upfront out of pocket. Zero interest overhead, zero debt burden, and
                  immediate full ownership.
                </p>
                <div className="mt-3 font-mono text-xs font-bold text-mint-dark">
                  Total: {formatValue(cleanProduct.price, profile.currency)}
                </div>
              </div>

              {/* Option B: EMI Card */}
              <div
                onClick={() => setPaymentOption('emi')}
                className={`cursor-pointer p-5 rounded-3xl border transition-all duration-200 relative ${
                  paymentOption === 'emi'
                    ? 'bg-white border-primary shadow-pastel-lg ring-2 ring-primary/20 scale-[1.01]'
                    : 'bg-white/60 border-pastel-border hover:bg-white/80'
                }`}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="w-10 h-10 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
                    <CreditCard className="w-5 h-5" />
                  </div>
                  <input
                    type="radio"
                    name="paymentMethod"
                    checked={paymentOption === 'emi'}
                    onChange={() => setPaymentOption('emi')}
                    className="accent-primary w-4 h-4"
                  />
                </div>
                <h3 className="font-bold text-slate-800 text-sm">Pay by EMI (Installments)</h3>
                <p className="text-xs text-slate-500 mt-1">
                  Spread cost across monthly installments. Preserves liquid cash cushion at the cost
                  of interest.
                </p>
                <div className="mt-3 font-mono text-xs font-bold text-primary">
                  Installment: {formatValue(emiAff.newEMI, profile.currency)} / mo
                </div>
              </div>
            </div>

            {/* Expanded EMI Terms Configuration */}
            <AnimatePresence>
              {paymentOption === 'emi' && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="p-6 rounded-3xl bg-white/75 backdrop-blur-xl border border-pastel-border shadow-pastel space-y-5 overflow-hidden"
                >
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                    EMI Loan Terms & Structure
                  </h4>

                  {/* Down Payment & Processing Fee */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                        Down Payment ({profile.currency})
                      </label>
                      <div className="relative">
                        <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-mono text-xs font-bold text-slate-400">
                          {profileCurrency.symbol}
                        </span>
                        <input
                          type="number"
                          min="0"
                          max={cleanProduct.price}
                          value={emiTerms.downPayment || ''}
                          onChange={(e) =>
                            updateCurrentEmiTerms({
                              downPayment: Math.min(
                                cleanProduct.price,
                                Math.max(0, Number(e.target.value))
                              ),
                            })
                          }
                          className="w-full pl-9 pr-3 py-2 rounded-xl bg-white/90 border border-slate-200 font-mono text-xs font-semibold text-slate-800"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                        Processing Fee (Flat)
                      </label>
                      <div className="relative">
                        <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-mono text-xs font-bold text-slate-400">
                          {profileCurrency.symbol}
                        </span>
                        <input
                          type="number"
                          min="0"
                          value={emiTerms.processingFee || ''}
                          onChange={(e) =>
                            updateCurrentEmiTerms({
                              processingFee: Math.max(0, Number(e.target.value)),
                            })
                          }
                          className="w-full pl-9 pr-3 py-2 rounded-xl bg-white/90 border border-slate-200 font-mono text-xs font-semibold text-slate-800"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Tenure Slider */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <label className="font-bold uppercase tracking-wider text-slate-600">
                        Tenure Duration:{' '}
                        <span className="font-mono text-primary font-bold">
                          {emiTerms.tenureMonths} Months
                        </span>
                      </label>
                      <span className="text-slate-400 font-mono text-[11px]">
                        {(emiTerms.tenureMonths / 12).toFixed(1)} Years
                      </span>
                    </div>

                    <input
                      type="range"
                      min="3"
                      max="84"
                      step="1"
                      value={emiTerms.tenureMonths}
                      onChange={(e) =>
                        updateCurrentEmiTerms({ tenureMonths: Number(e.target.value) })
                      }
                      className="w-full accent-primary h-2 bg-slate-200 rounded-lg cursor-pointer"
                    />

                    {/* Quick Tenure Pills */}
                    <div className="flex flex-wrap gap-2 pt-1">
                      {[6, 12, 18, 24, 36, 48, 60].map((months) => (
                        <button
                          key={months}
                          type="button"
                          onClick={() => updateCurrentEmiTerms({ tenureMonths: months })}
                          className={`px-2.5 py-1 rounded-lg text-[10px] font-bold font-mono transition-colors ${
                            emiTerms.tenureMonths === months
                              ? 'bg-primary text-white shadow-xs'
                              : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                          }`}
                        >
                          {months}m
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Interest Rate & Calculation Method */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                        Annual Interest Rate (%)
                      </label>
                      <div className="relative">
                        <input
                          type="number"
                          min="0"
                          max="40"
                          step="0.5"
                          value={emiTerms.annualInterestRate}
                          onChange={(e) =>
                            updateCurrentEmiTerms({
                              annualInterestRate: Math.max(0, Number(e.target.value)),
                            })
                          }
                          className="w-full px-3 py-2 rounded-xl bg-white/90 border border-slate-200 font-mono text-xs font-semibold text-slate-800"
                        />
                        <Percent className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                      </div>

                      {/* Quick Rate Buttons */}
                      <div className="flex gap-1.5 mt-2">
                        {[0, 10, 12, 14, 18].map((rate) => (
                          <button
                            key={rate}
                            type="button"
                            onClick={() => updateCurrentEmiTerms({ annualInterestRate: rate })}
                            className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold transition-all ${
                              emiTerms.annualInterestRate === rate
                                ? 'bg-primary text-white'
                                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                            }`}
                          >
                            {rate}%
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                        Interest Calculation Method
                      </label>
                      <div className="flex rounded-xl bg-slate-100 p-1 border border-slate-200">
                        <button
                          type="button"
                          onClick={() => updateCurrentEmiTerms({ method: 'reducing' })}
                          className={`flex-1 py-1.5 rounded-lg text-[11px] font-bold transition-all ${
                            emiTerms.method !== 'flat'
                              ? 'bg-white text-primary shadow-xs'
                              : 'text-slate-600 hover:text-slate-900'
                          }`}
                        >
                          Reducing (Standard)
                        </button>
                        <button
                          type="button"
                          onClick={() => updateCurrentEmiTerms({ method: 'flat' })}
                          className={`flex-1 py-1.5 rounded-lg text-[11px] font-bold transition-all ${
                            emiTerms.method === 'flat'
                              ? 'bg-white text-primary shadow-xs'
                              : 'text-slate-600 hover:text-slate-900'
                          }`}
                        >
                          Flat Rate
                        </button>
                      </div>
                      <p className="text-[10px] text-slate-400 mt-1.5">
                        Banks in Nepal primarily use reducing-balance formula.
                      </p>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Right 6 Columns: Step 3 Results Screen */}
        <div className="lg:col-span-6 space-y-6">
          <motion.div
            key={`${cleanProduct.price}_${paymentOption}_${emiTerms.tenureMonths}_${emiTerms.annualInterestRate}`}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="space-y-6"
          >
            {/* Top Action Bar & Verdict Score Gauge */}
            <div className="p-6 rounded-3xl bg-white/75 backdrop-blur-xl border border-pastel-border shadow-pastel space-y-5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Step 3: AI CA Evaluation
                </span>

                <button
                  onClick={handleSaveCurrentAnalysis}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-primary/10 hover:bg-primary/20 text-primary text-xs font-bold transition-all"
                >
                  {justSavedId ? (
                    <>
                      <BookmarkCheck className="w-3.5 h-3.5 text-mint-dark" />
                      <span className="text-mint-dark">Saved to History!</span>
                    </>
                  ) : (
                    <>
                      <Bookmark className="w-3.5 h-3.5" />
                      <span>Save Analysis</span>
                    </>
                  )}
                </button>
              </div>

              {/* Verdict Gauge Component */}
              <VerdictGauge score={verdict.score} label={verdict.label} />

              <p className="text-center text-xs text-slate-600 font-medium max-w-md mx-auto">
                {verdict.summary}
              </p>
            </div>

            {/* 7 Key Metric Cards Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3.5">
              {/* Metric 1: Afford Now? */}
              <div className="p-4 rounded-2xl bg-white/70 backdrop-blur-md border border-pastel-border shadow-pastel space-y-1">
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                  Can I Afford Now?
                </span>
                <div className="flex items-center gap-1.5 pt-0.5">
                  {canAffordNow ? (
                    <span className="inline-flex items-center gap-1 font-mono text-base font-extrabold text-verdict-green">
                      <CheckCircle2 className="w-4 h-4" /> YES
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 font-mono text-base font-extrabold text-verdict-red">
                      <XCircle className="w-4 h-4" /> NO
                    </span>
                  )}
                </div>
                <p className="text-[10px] text-slate-500">
                  {paymentOption === 'cash'
                    ? cashAff.canPayNow
                      ? 'Safety fund intact'
                      : 'Dips into buffer'
                    : emiAff.downPaymentAffordable
                      ? 'Down payment ready'
                      : 'Insufficient down payment'}
                </p>
              </div>

              {/* Metric 2: Minimum Salary Required */}
              <div className="p-4 rounded-2xl bg-white/70 backdrop-blur-md border border-pastel-border shadow-pastel space-y-1">
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                  Min Salary Required
                </span>
                <div className="font-mono text-sm font-bold text-slate-800 pt-0.5">
                  {formatValue(
                    paymentOption === 'cash'
                      ? cashAff.minimumIncomeRequired
                      : emiAff.minimumIncomeRequired,
                    profile.currency,
                    { compact: true }
                  )}
                </div>
                <p className="text-[10px] text-slate-500">Preserves 20% savings</p>
              </div>

              {/* Metric 3: Monthly Installment */}
              <div className="p-4 rounded-2xl bg-white/70 backdrop-blur-md border border-pastel-border shadow-pastel space-y-1">
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                  Monthly Installment
                </span>
                <div className="font-mono text-sm font-bold text-primary pt-0.5">
                  {paymentOption === 'emi'
                    ? formatValue(emiAff.newEMI, profile.currency)
                    : 'N/A (Cash)'}
                </div>
                <p className="text-[10px] text-slate-500">
                  {paymentOption === 'emi'
                    ? `${emiTerms.tenureMonths} total installments`
                    : 'Zero monthly debt'}
                </p>
              </div>

              {/* Metric 4: Total Interest Paid */}
              <div className="p-4 rounded-2xl bg-white/70 backdrop-blur-md border border-pastel-border shadow-pastel space-y-1">
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                  Total Interest Paid
                </span>
                <div className="font-mono text-sm font-bold text-slate-800 pt-0.5">
                  {paymentOption === 'emi'
                    ? formatValue(emiAff.emiCost.totalInterest, profile.currency)
                    : formatValue(0)}
                </div>
                <p className="text-[10px] text-slate-500">
                  {paymentOption === 'emi'
                    ? `+${emiAff.emiCost.interestPremiumPercent.toFixed(1)}% premium`
                    : 'No interest cost'}
                </p>
              </div>

              {/* Metric 5: Time to Recover */}
              <div className="p-4 rounded-2xl bg-white/70 backdrop-blur-md border border-pastel-border shadow-pastel space-y-1">
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                  Time to Recover
                </span>
                <div className="font-mono text-sm font-bold text-slate-800 pt-0.5">
                  {recovery.monthsToRecover === Infinity
                    ? 'Not achievable'
                    : `${recovery.monthsToRecover} Months`}
                </div>
                <p className="text-[10px] text-slate-500">
                  {recovery.monthsToRecover === Infinity
                    ? 'No monthly surplus'
                    : `~${recovery.daysToRecover} days total`}
                </p>
              </div>

              {/* Metric 6: Savings Rate After */}
              <div className="p-4 rounded-2xl bg-white/70 backdrop-blur-md border border-pastel-border shadow-pastel space-y-1">
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                  Savings Rate After
                </span>
                <div
                  className={`font-mono text-sm font-bold pt-0.5 ${savingsRateAfter >= 20 ? 'text-mint-dark' : savingsRateAfter > 0 ? 'text-amber-700' : 'text-verdict-red'}`}
                >
                  {savingsRateAfter.toFixed(1)}%
                </div>
                <p className="text-[10px] text-slate-500">Benchmark: ≥20%</p>
              </div>

              {/* Metric 7: Debt-to-Income (DTI) - spans on mobile if needed */}
              <div className="col-span-2 sm:col-span-3 p-4 rounded-2xl bg-white/70 backdrop-blur-md border border-pastel-border shadow-pastel flex items-center justify-between">
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                    Total EMI Burden (DTI)
                  </span>
                  <div className="font-mono text-base font-bold text-slate-800 pt-0.5">
                    {paymentOption === 'emi'
                      ? `${dtiPercent}% of Monthly Income`
                      : '0% (No new debt)'}
                  </div>
                </div>
                <span
                  className={`text-xs font-bold px-2.5 py-1 rounded-lg ${
                    paymentOption === 'cash' || emiAff.dtiStatus === 'healthy'
                      ? 'bg-mint/15 text-mint-dark'
                      : emiAff.dtiStatus === 'risky'
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-rose/15 text-rose-dark'
                  }`}
                >
                  {paymentOption === 'cash' ? 'Zero Debt' : emiAff.dtiStatus.toUpperCase()}
                </span>
              </div>
            </div>

            {/* Why This Verdict Checklist */}
            <div className="p-6 rounded-3xl bg-white/75 backdrop-blur-xl border border-pastel-border shadow-pastel space-y-3.5">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-primary" />
                <h3 className="font-bold text-slate-800 text-sm">Why This Verdict?</h3>
              </div>

              <div className="space-y-2.5">
                {verdict.reasons.map((r, i) => (
                  <div
                    key={i}
                    className="flex items-start gap-2.5 p-3 rounded-xl bg-white/60 border border-slate-100 text-xs"
                  >
                    {r.status === 'pass' && (
                      <CheckCircle2 className="w-4 h-4 text-verdict-green shrink-0 mt-0.5" />
                    )}
                    {r.status === 'warn' && (
                      <AlertTriangle className="w-4 h-4 text-verdict-amber shrink-0 mt-0.5" />
                    )}
                    {r.status === 'fail' && (
                      <XCircle className="w-4 h-4 text-verdict-red shrink-0 mt-0.5" />
                    )}
                    <div>
                      <span className="font-bold text-slate-700">{r.factor}: </span>
                      <span className="text-slate-600">{r.message}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Plain-Language CA's Advice Paragraph */}
            <div className="p-6 rounded-3xl bg-gradient-to-br from-primary/10 via-white/80 to-mint/15 border border-primary/20 backdrop-blur-xl shadow-pastel space-y-2.5">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-primary" />
                <h3 className="font-bold text-slate-800 text-sm">
                  Chartered Accountant&apos;s Advice
                </h3>
              </div>
              <p className="text-xs text-slate-700 leading-relaxed font-normal">{caAdvice}</p>
            </div>

            {/* Statutory Disclaimer */}
            <p className="text-center text-[11px] text-slate-500 font-medium px-2">
              Note: This is a guidance tool, not professional financial advice.
            </p>
          </motion.div>
        </div>
      </div>

      {/* Visual Analytics Deep-Dive Section */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, delay: 0.1 }}
        className="space-y-6 pt-2"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-pastel-border/60 pb-3">
          <div>
            <h2 className="text-lg md:text-xl font-extrabold text-slate-800 tracking-tight flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-primary" />
              <span>Financial Impact Visualizations</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Multi-scenario wealth models, debt amortization trajectories, and replenishment curves
            </p>
          </div>
          <span className="text-[11px] font-mono font-bold text-primary bg-primary/10 px-3 py-1 rounded-full w-fit">
            Strategy:{' '}
            {paymentOption === 'cash'
              ? 'Full Cash Outflow'
              : `${emiTerms.tenureMonths}-Mo EMI Financing`}
          </span>
        </div>

        {/* 1. 36-Month Savings Balance Projection Chart (Full Width) */}
        <SavingsProjectionChart profile={profile} product={cleanProduct} emiTerms={emiTerms} />

        {/* 2. Grid with Recovery Velocity and Budget Restructuring */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <RecoveryTimelineChart
            profile={profile}
            product={cleanProduct}
            paymentOption={paymentOption}
            emiTerms={emiTerms}
          />
          <BudgetImpactBarChart
            profile={profile}
            product={cleanProduct}
            paymentOption={paymentOption}
            emiTerms={emiTerms}
          />
        </div>

        {/* 3. EMI Breakdown Donut and Amortization Area Chart */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-5">
            <EmiBreakdownDonut
              principal={emiAff.principal}
              totalInterest={emiAff.emiCost.totalInterest}
              fees={emiTerms.processingFee}
              downPayment={emiTerms.downPayment}
            />
          </div>
          <div className="lg:col-span-7">
            <AmortizationAreaChart
              principal={emiAff.principal}
              annualInterestRate={emiTerms.annualInterestRate}
              tenureMonths={emiTerms.tenureMonths}
              method={emiTerms.method}
            />
          </div>
        </div>
      </motion.div>

      {/* Analysis History Section */}
      {analysisHistory.length > 0 && (
        <div className="p-6 md:p-8 rounded-3xl bg-white/75 backdrop-blur-xl border border-pastel-border shadow-pastel space-y-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <History className="w-4 h-4 text-primary" />
              <h3 className="font-bold text-slate-800 text-sm md:text-base">
                Saved Analysis History ({analysisHistory.length})
              </h3>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {analysisHistory.map((item) => (
              <div
                key={item.id}
                className="p-4 rounded-2xl bg-white/80 border border-pastel-border shadow-pastel-sm flex flex-col justify-between space-y-3"
              >
                <div className="space-y-1.5">
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
                    <span>{formatValue(item.product.price, item.currency)}</span>
                    <span>•</span>
                    <span className="uppercase text-[10px] font-bold text-primary">
                      {item.paymentOption}
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                  <button
                    onClick={() => handleLoadSaved(item)}
                    className="text-xs font-semibold text-primary hover:underline"
                  >
                    Reload in Analyzer
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
        </div>
      )}
    </div>
  );
};
