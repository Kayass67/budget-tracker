import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Wallet,
  ShieldCheck,
  TrendingUp,
  CreditCard,
  Users,
  AlertTriangle,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  Sliders,
  DollarSign,
  Info,
} from 'lucide-react';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from 'recharts';
import { useAppStore } from '@/store';
import { monthlySurplus, budgetHealth, emergencyFundTarget } from '@/lib/finance';
import { SUPPORTED_CURRENCIES } from '@/lib/currency';

export const ProfilePage: React.FC = () => {
  const { profile, updateProfile, formatValue, isOnboarded, setOnboarded } = useAppStore();
  const [wizardStep, setWizardStep] = useState<number>(1);
  const [showWizard, setShowWizard] = useState<boolean>(!isOnboarded);

  // Live Finance Calculations directly from engine
  const surplus = monthlySurplus(profile);
  const health = budgetHealth(profile);
  const ef = emergencyFundTarget(profile);

  const profileCurrencyConfig = SUPPORTED_CURRENCIES[profile.currency] || SUPPORTED_CURRENCIES.NPR;

  // Chart Data for 50/30/20 Donut
  const chartData = [
    { name: 'Needs (Fixed + EMIs)', value: Math.max(0, health.needsAmount), color: '#7C6FE0' },
    { name: 'Wants (Lifestyle)', value: Math.max(0, health.wantsAmount), color: '#FFB48A' },
    { name: 'Savings / Surplus', value: Math.max(0, health.savingsAmount), color: '#5CC8A8' },
  ].filter((d) => d.value > 0);

  // EF progress percent capped at 100%
  const efProgressPercent =
    ef.targetAmount > 0
      ? Math.min(100, Math.round((profile.emergencyFundCurrent / ef.targetAmount) * 100))
      : 100;

  // Helper for numeric inputs
  const handleNumberChange = (field: keyof typeof profile, valStr: string) => {
    const num = valStr === '' ? 0 : Math.max(0, Number(valStr));
    updateProfile({ [field]: num });
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-slate-800 tracking-tight">
            Your Finances
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Maintain your income, living expenses, and liquid reserves. All calculations save
            automatically.
          </p>
        </div>

        <button
          onClick={() => {
            setShowWizard(!showWizard);
            setWizardStep(1);
          }}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white/80 hover:bg-white text-slate-700 text-xs font-semibold border border-pastel-border shadow-pastel-sm transition-all self-start sm:self-auto"
        >
          <Sliders className="w-3.5 h-3.5 text-primary" />
          <span>{showWizard ? 'Switch to Full Profile' : 'Guided Onboarding Wizard'}</span>
        </button>
      </div>

      {/* Critical Deficit Alert Banner */}
      {surplus <= 0 && (
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          className="p-4 md:p-5 rounded-2xl bg-rose-50/90 border border-rose-200/80 shadow-pastel flex items-start gap-3.5"
        >
          <AlertTriangle className="w-5 h-5 text-verdict-red shrink-0 mt-0.5" />
          <div>
            <h4 className="text-sm font-bold text-rose-900">
              Budget Deficit Warning: Zero or Negative Free Cash Flow
            </h4>
            <p className="text-xs text-rose-700 mt-1 leading-relaxed">
              Your monthly expenses and existing debt obligations (
              {formatValue(
                profile.monthlyFixedExpenses +
                  profile.monthlyLifestyleExpenses +
                  profile.existingMonthlyEMIs,
                profile.currency
              )}
              ) currently equal or exceed your in-hand earnings (
              {formatValue(profile.monthlyIncome, profile.currency)}). Taking on any new purchase or
              EMI will result in cash flow distress.
            </p>
          </div>
        </motion.div>
      )}

      {/* Mode A: 3-Step Guided Onboarding Wizard */}
      <AnimatePresence mode="wait">
        {showWizard ? (
          <motion.div
            key="wizard"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            className="p-6 md:p-8 rounded-3xl bg-white/75 backdrop-blur-xl border border-pastel-border shadow-pastel max-w-2xl mx-auto space-y-6"
          >
            {/* Step Indicators */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                {[1, 2, 3].map((step) => (
                  <div
                    key={step}
                    className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs transition-all ${
                      wizardStep === step
                        ? 'bg-primary text-white shadow-pastel'
                        : wizardStep > step
                          ? 'bg-mint text-white'
                          : 'bg-slate-100 text-slate-400'
                    }`}
                  >
                    {wizardStep > step ? <CheckCircle2 className="w-4 h-4" /> : step}
                  </div>
                ))}
              </div>
              <span className="text-xs font-semibold text-slate-500">Step {wizardStep} of 3</span>
            </div>

            {/* Wizard Steps */}
            {wizardStep === 1 && (
              <div className="space-y-5">
                <div>
                  <h3 className="text-lg font-bold text-slate-800">Income & Fixed Needs</h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Start with your predictable monthly cash inflow and non-negotiable living
                    essentials.
                  </p>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                      Monthly Take-Home Inflow (Net Income)
                    </label>
                    <div className="relative">
                      <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-mono text-xs font-bold text-slate-400">
                        {profileCurrencyConfig.symbol}
                      </span>
                      <input
                        type="number"
                        min="0"
                        value={profile.monthlyIncome || ''}
                        onChange={(e) => handleNumberChange('monthlyIncome', e.target.value)}
                        placeholder="e.g. 80000"
                        className="w-full pl-10 pr-4 py-3 rounded-xl bg-white/90 border border-slate-200 font-mono text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-primary/20"
                      />
                    </div>
                    <p className="text-[11px] text-slate-500 mt-1 flex items-center gap-1">
                      <Info className="w-3 h-3 text-primary" />
                      Net salary deposited into your bank account after all taxes and deductions.
                    </p>
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                      Monthly Fixed Expenses (Needs)
                    </label>
                    <div className="relative">
                      <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-mono text-xs font-bold text-slate-400">
                        {profileCurrencyConfig.symbol}
                      </span>
                      <input
                        type="number"
                        min="0"
                        value={profile.monthlyFixedExpenses || ''}
                        onChange={(e) => handleNumberChange('monthlyFixedExpenses', e.target.value)}
                        placeholder="e.g. 30000"
                        className="w-full pl-10 pr-4 py-3 rounded-xl bg-white/90 border border-slate-200 font-mono text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-primary/20"
                      />
                    </div>
                    <p className="text-[11px] text-slate-500 mt-1 flex items-center gap-1">
                      <Info className="w-3 h-3 text-primary" />
                      Rent, groceries, utilities, basic commute, children tuition—bills you cannot
                      avoid.
                    </p>
                  </div>
                </div>

                <div className="pt-4 flex justify-end">
                  <button
                    onClick={() => setWizardStep(2)}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-white font-semibold text-xs shadow-pastel hover:bg-primary-600 transition-colors"
                  >
                    <span>Next: Lifestyle & Debt</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {wizardStep === 2 && (
              <div className="space-y-5">
                <div>
                  <h3 className="text-lg font-bold text-slate-800">Lifestyle & Debt Commitments</h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Account for flexible wants, existing loan installments, and family size.
                  </p>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                      Monthly Lifestyle Spending (Wants)
                    </label>
                    <div className="relative">
                      <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-mono text-xs font-bold text-slate-400">
                        {profileCurrencyConfig.symbol}
                      </span>
                      <input
                        type="number"
                        min="0"
                        value={profile.monthlyLifestyleExpenses || ''}
                        onChange={(e) =>
                          handleNumberChange('monthlyLifestyleExpenses', e.target.value)
                        }
                        placeholder="e.g. 15000"
                        className="w-full pl-10 pr-4 py-3 rounded-xl bg-white/90 border border-slate-200 font-mono text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-primary/20"
                      />
                    </div>
                    <p className="text-[11px] text-slate-500 mt-1 flex items-center gap-1">
                      <Info className="w-3 h-3 text-primary" />
                      Dining out, recreation, streaming subscriptions, clothing, and hobbies.
                    </p>
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                      Existing Monthly Loans & EMIs
                    </label>
                    <div className="relative">
                      <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-mono text-xs font-bold text-slate-400">
                        {profileCurrencyConfig.symbol}
                      </span>
                      <input
                        type="number"
                        min="0"
                        value={profile.existingMonthlyEMIs || ''}
                        onChange={(e) => handleNumberChange('existingMonthlyEMIs', e.target.value)}
                        placeholder="e.g. 5000"
                        className="w-full pl-10 pr-4 py-3 rounded-xl bg-white/90 border border-slate-200 font-mono text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-primary/20"
                      />
                    </div>
                    <p className="text-[11px] text-slate-500 mt-1 flex items-center gap-1">
                      <Info className="w-3 h-3 text-primary" />
                      Sum of all current vehicle, smartphone, or personal loan monthly deductions.
                    </p>
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                      Number of Dependents
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="10"
                      value={profile.dependents || 0}
                      onChange={(e) => handleNumberChange('dependents', e.target.value)}
                      className="w-full px-4 py-3 rounded-xl bg-white/90 border border-slate-200 font-mono text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-primary/20"
                    />
                    <p className="text-[11px] text-slate-500 mt-1 flex items-center gap-1">
                      <Info className="w-3 h-3 text-primary" />
                      Having 1+ dependents elevates your recommended emergency buffer from 3 to 6
                      months.
                    </p>
                  </div>
                </div>

                <div className="pt-4 flex items-center justify-between">
                  <button
                    onClick={() => setWizardStep(1)}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-slate-600 hover:text-slate-900 text-xs font-semibold"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    <span>Back</span>
                  </button>
                  <button
                    onClick={() => setWizardStep(3)}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-white font-semibold text-xs shadow-pastel hover:bg-primary-600 transition-colors"
                  >
                    <span>Next: Savings & Buffer</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {wizardStep === 3 && (
              <div className="space-y-5">
                <div>
                  <h3 className="text-lg font-bold text-slate-800">Savings & Safety Cushion</h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Your financial cushion protects you from job loss and unexpected life
                    emergencies.
                  </p>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                      Total Liquid Savings Available
                    </label>
                    <div className="relative">
                      <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-mono text-xs font-bold text-slate-400">
                        {profileCurrencyConfig.symbol}
                      </span>
                      <input
                        type="number"
                        min="0"
                        value={profile.currentSavings || ''}
                        onChange={(e) => handleNumberChange('currentSavings', e.target.value)}
                        placeholder="e.g. 250000"
                        className="w-full pl-10 pr-4 py-3 rounded-xl bg-white/90 border border-slate-200 font-mono text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-primary/20"
                      />
                    </div>
                    <p className="text-[11px] text-slate-500 mt-1 flex items-center gap-1">
                      <Info className="w-3 h-3 text-primary" />
                      All liquid balances in your checking, savings, or easily cashable fixed
                      deposits.
                    </p>
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                      Dedicated Emergency Reserve Fund
                    </label>
                    <div className="relative">
                      <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-mono text-xs font-bold text-slate-400">
                        {profileCurrencyConfig.symbol}
                      </span>
                      <input
                        type="number"
                        min="0"
                        value={profile.emergencyFundCurrent || ''}
                        onChange={(e) => handleNumberChange('emergencyFundCurrent', e.target.value)}
                        placeholder="e.g. 150000"
                        className="w-full pl-10 pr-4 py-3 rounded-xl bg-white/90 border border-slate-200 font-mono text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-primary/20"
                      />
                    </div>
                    <p className="text-[11px] text-slate-500 mt-1 flex items-center gap-1">
                      <Info className="w-3 h-3 text-primary" />
                      Portion of liquid savings untouchable for consumer purchases. Target:{' '}
                      {formatValue(ef.targetAmount, profile.currency)}.
                    </p>
                  </div>
                </div>

                <div className="pt-4 flex items-center justify-between">
                  <button
                    onClick={() => setWizardStep(2)}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-slate-600 hover:text-slate-900 text-xs font-semibold"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    <span>Back</span>
                  </button>
                  <button
                    onClick={() => {
                      setOnboarded(true);
                      setShowWizard(false);
                    }}
                    className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-mint text-white font-bold text-xs shadow-pastel hover:bg-mint-dark transition-colors"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Complete & View Dashboard</span>
                  </button>
                </div>
              </div>
            )}
          </motion.div>
        ) : (
          /* Mode B: Full Multi-Section Form + Live Side Summary */
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Left 7 Columns: Form */}
            <div className="lg:col-span-7 space-y-5">
              {/* Card 1: Inflow & Needs */}
              <div className="p-6 rounded-2xl bg-white/70 backdrop-blur-md border border-pastel-border shadow-pastel space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                    <TrendingUp className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-800 text-sm">
                      Monthly Inflow & Fixed Needs
                    </h3>
                    <p className="text-xs text-slate-500">Core earnings and non-negotiables</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                      Net Monthly Income
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 font-mono text-xs font-bold text-slate-400">
                        {profileCurrencyConfig.symbol}
                      </span>
                      <input
                        type="number"
                        min="0"
                        value={profile.monthlyIncome || ''}
                        onChange={(e) => handleNumberChange('monthlyIncome', e.target.value)}
                        className="w-full pl-9 pr-3 py-2 rounded-xl bg-white/80 border border-slate-200 font-mono text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-primary/20"
                      />
                    </div>
                    <p className="text-[11px] text-slate-500 mt-1">
                      Net in-hand salary or earnings deposited.
                    </p>
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                      Fixed Living Needs
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 font-mono text-xs font-bold text-slate-400">
                        {profileCurrencyConfig.symbol}
                      </span>
                      <input
                        type="number"
                        min="0"
                        value={profile.monthlyFixedExpenses || ''}
                        onChange={(e) => handleNumberChange('monthlyFixedExpenses', e.target.value)}
                        className="w-full pl-9 pr-3 py-2 rounded-xl bg-white/80 border border-slate-200 font-mono text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-primary/20"
                      />
                    </div>
                    <p className="text-[11px] text-slate-500 mt-1">
                      Rent, groceries, utilities, and transport.
                    </p>
                  </div>
                </div>
              </div>

              {/* Card 2: Lifestyle & Debts */}
              <div className="p-6 rounded-2xl bg-white/70 backdrop-blur-md border border-pastel-border shadow-pastel space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-peach/20 flex items-center justify-center text-peach-dark">
                    <CreditCard className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-800 text-sm">
                      Discretionary Spending & Debts
                    </h3>
                    <p className="text-xs text-slate-500">
                      Flexible lifestyle and active loan installments
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                      Monthly Lifestyle (Wants)
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 font-mono text-xs font-bold text-slate-400">
                        {profileCurrencyConfig.symbol}
                      </span>
                      <input
                        type="number"
                        min="0"
                        value={profile.monthlyLifestyleExpenses || ''}
                        onChange={(e) =>
                          handleNumberChange('monthlyLifestyleExpenses', e.target.value)
                        }
                        className="w-full pl-9 pr-3 py-2 rounded-xl bg-white/80 border border-slate-200 font-mono text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-primary/20"
                      />
                    </div>
                    <p className="text-[11px] text-slate-500 mt-1">
                      Dining out, shopping, and entertainment.
                    </p>
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                      Existing Monthly EMIs
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 font-mono text-xs font-bold text-slate-400">
                        {profileCurrencyConfig.symbol}
                      </span>
                      <input
                        type="number"
                        min="0"
                        value={profile.existingMonthlyEMIs || ''}
                        onChange={(e) => handleNumberChange('existingMonthlyEMIs', e.target.value)}
                        className="w-full pl-9 pr-3 py-2 rounded-xl bg-white/80 border border-slate-200 font-mono text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-primary/20"
                      />
                    </div>
                    <p className="text-[11px] text-slate-500 mt-1">
                      Existing loans, vehicle or device installments.
                    </p>
                  </div>
                </div>
              </div>

              {/* Card 3: Savings, Emergency Reserve & Dependents */}
              <div className="p-6 rounded-2xl bg-white/70 backdrop-blur-md border border-pastel-border shadow-pastel space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-mint/15 flex items-center justify-center text-mint-dark">
                    <Wallet className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-800 text-sm">Reserves & Family Context</h3>
                    <p className="text-xs text-slate-500">
                      Liquid balances and emergency buffer target
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-1">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                      Total Liquid Savings
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 font-mono text-xs font-bold text-slate-400">
                        {profileCurrencyConfig.symbol}
                      </span>
                      <input
                        type="number"
                        min="0"
                        value={profile.currentSavings || ''}
                        onChange={(e) => handleNumberChange('currentSavings', e.target.value)}
                        className="w-full pl-9 pr-3 py-2 rounded-xl bg-white/80 border border-slate-200 font-mono text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-primary/20"
                      />
                    </div>
                    <p className="text-[11px] text-slate-500 mt-1">Cash and liquid deposits.</p>
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                      Emergency Fund
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 font-mono text-xs font-bold text-slate-400">
                        {profileCurrencyConfig.symbol}
                      </span>
                      <input
                        type="number"
                        min="0"
                        value={profile.emergencyFundCurrent || ''}
                        onChange={(e) => handleNumberChange('emergencyFundCurrent', e.target.value)}
                        className="w-full pl-9 pr-3 py-2 rounded-xl bg-white/80 border border-slate-200 font-mono text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-primary/20"
                      />
                    </div>
                    <p className="text-[11px] text-slate-500 mt-1">Dedicated safety buffer.</p>
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                      Dependents
                    </label>
                    <div className="relative">
                      <Users className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                      <input
                        type="number"
                        min="0"
                        max="10"
                        value={profile.dependents || 0}
                        onChange={(e) => handleNumberChange('dependents', e.target.value)}
                        className="w-full pl-9 pr-3 py-2 rounded-xl bg-white/80 border border-slate-200 font-mono text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-primary/20"
                      />
                    </div>
                    <p className="text-[11px] text-slate-500 mt-1">
                      {profile.dependents > 0 ? '6-mo target applied.' : '3-mo target applied.'}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Right 5 Columns: Live Mini-Summary & Charts */}
            <div className="lg:col-span-5 space-y-5 sticky top-20">
              {/* 50/30/20 Donut Chart Card */}
              <div className="p-6 rounded-2xl bg-white/70 backdrop-blur-md border border-pastel-border shadow-pastel space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <DollarSign className="w-4 h-4 text-primary" />
                    <h3 className="font-bold text-slate-800 text-sm">50/30/20 Cash Allocation</h3>
                  </div>
                  <span className="font-mono text-xs font-bold text-primary px-2.5 py-0.5 rounded-full bg-primary/10">
                    {health.healthScore}/100
                  </span>
                </div>

                {/* Donut Chart */}
                <div className="h-44 w-full relative">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={chartData}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={70}
                        paddingAngle={3}
                        dataKey="value"
                      >
                        {chartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(val: number) => [formatValue(val, profile.currency), 'Amount']}
                        contentStyle={{
                          backgroundColor: 'rgba(255, 255, 255, 0.95)',
                          borderRadius: '0.75rem',
                          border: '1px solid rgba(124, 111, 224, 0.15)',
                          fontSize: '11px',
                          fontFamily: 'JetBrains Mono',
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                  {/* Center Metric */}
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    <span className="text-[10px] uppercase tracking-wider font-bold text-slate-400">
                      Free Surplus
                    </span>
                    <span
                      className={`text-sm font-mono font-bold ${surplus >= 0 ? 'text-mint-dark' : 'text-verdict-red'}`}
                    >
                      {formatValue(surplus, profile.currency, { compact: true })}
                    </span>
                  </div>
                </div>

                {/* Legend & Rule Comparison */}
                <div className="space-y-2 pt-1 text-xs">
                  <div className="flex items-center justify-between p-2 rounded-xl bg-white/60 border border-slate-100">
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full bg-primary shrink-0" />
                      <span className="text-slate-600">Needs (Fixed + EMIs)</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-slate-800">
                        {(health.needsRatio * 100).toFixed(0)}%
                      </span>
                      <span
                        className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${health.meetsNeedsRule ? 'bg-mint/15 text-mint-dark' : 'bg-rose/15 text-rose-dark'}`}
                      >
                        {health.meetsNeedsRule ? '≤50% OK' : '>50% High'}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-2 rounded-xl bg-white/60 border border-slate-100">
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full bg-peach-dark shrink-0" />
                      <span className="text-slate-600">Wants (Lifestyle)</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-slate-800">
                        {(health.wantsRatio * 100).toFixed(0)}%
                      </span>
                      <span
                        className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${health.meetsWantsRule ? 'bg-mint/15 text-mint-dark' : 'bg-rose/15 text-rose-dark'}`}
                      >
                        {health.meetsWantsRule ? '≤30% OK' : '>30% High'}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-2 rounded-xl bg-white/60 border border-slate-100">
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full bg-mint-dark shrink-0" />
                      <span className="text-slate-600">Savings / Surplus</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-slate-800">
                        {(health.savingsRatio * 100).toFixed(0)}%
                      </span>
                      <span
                        className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${health.meetsSavingsRule ? 'bg-mint/15 text-mint-dark' : 'bg-amber-100 text-amber-800'}`}
                      >
                        {health.meetsSavingsRule ? '≥20% OK' : '<20% Low'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Emergency Reserve Progress Card */}
              <div className="p-6 rounded-2xl bg-white/70 backdrop-blur-md border border-pastel-border shadow-pastel space-y-3.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-sky-dark" />
                    <h3 className="font-bold text-slate-800 text-sm">Emergency Fund Buffer</h3>
                  </div>
                  <span className="text-xs font-mono font-bold text-slate-700">
                    {efProgressPercent}%
                  </span>
                </div>

                {/* Progress Bar */}
                <div className="w-full h-3 rounded-full bg-slate-100 overflow-hidden p-0.5">
                  <motion.div
                    className="h-full rounded-full bg-gradient-to-r from-sky to-primary"
                    initial={{ width: 0 }}
                    animate={{ width: `${efProgressPercent}%` }}
                    transition={{ duration: 0.5, ease: 'easeOut' }}
                  />
                </div>

                <div className="flex items-center justify-between text-xs text-slate-500 font-mono">
                  <span>
                    Current: {formatValue(profile.emergencyFundCurrent, profile.currency)}
                  </span>
                  <span>Target: {formatValue(ef.targetAmount, profile.currency)}</span>
                </div>

                <div className="p-2.5 rounded-xl bg-sky-50/60 border border-sky-100 text-[11px] text-slate-600 leading-relaxed">
                  {ef.isFullyFunded ? (
                    <span className="text-emerald-700 font-medium">
                      🛡️ Fully funded for {ef.targetMonths} months of survival needs. You have{' '}
                      {formatValue(ef.usableSavings, profile.currency)} in surplus usable capital.
                    </span>
                  ) : (
                    <span>
                      ⚠️ Gap of{' '}
                      <strong className="font-mono text-slate-800">
                        {formatValue(ef.gap, profile.currency)}
                      </strong>{' '}
                      needed to achieve your {ef.targetMonths}-month survival cushion.
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
