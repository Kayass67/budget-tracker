import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { useAppStore } from '@/store';
import { UserProfile, ProductInput, EMITerms } from '@/types';
import { recoveryTime, monthlySurplus } from '@/lib/finance';
import { ChartEmptyState } from './ChartEmptyState';
import { FastForward, Hourglass, Zap, ShieldAlert } from 'lucide-react';

interface RecoveryTimelineChartProps {
  profile: Partial<UserProfile>;
  product: ProductInput;
  paymentOption: 'cash' | 'emi';
  emiTerms?: EMITerms;
}

export const RecoveryTimelineChart: React.FC<RecoveryTimelineChartProps> = ({
  profile,
  product,
  paymentOption,
  emiTerms,
}) => {
  const { formatValue } = useAppStore();
  const shouldReduceMotion = useReducedMotion();

  const baseSurplus = monthlySurplus(profile);
  const rec = recoveryTime(profile, product, paymentOption, emiTerms);
  const totalOutflow = rec.totalOutflow;

  if (totalOutflow <= 0) {
    return (
      <ChartEmptyState
        title="Zero Outflow"
        message="No cost detected for this purchase scenario."
        icon={<Hourglass className="w-6 h-6" />}
      />
    );
  }

  if (baseSurplus <= 0 || rec.monthsToRecover === Infinity) {
    return (
      <div
        className="p-6 rounded-3xl bg-verdict-red/5 border border-verdict-red/20 shadow-pastel space-y-3"
        role="region"
        aria-label="Recovery Timeline Status"
      >
        <div className="flex items-center gap-2 text-verdict-red font-bold text-sm">
          <ShieldAlert className="w-5 h-5 shrink-0" />
          <h4>Recovery Not Achievable at Current Surplus</h4>
        </div>
        <p className="text-xs text-slate-600 leading-relaxed">
          Your current monthly surplus is {formatValue(baseSurplus)}/month. To replenish the{' '}
          {formatValue(totalOutflow)} outlay, you must generate a positive monthly cash buffer by
          reducing discretionary wants or enhancing monthly inflow.
        </p>
      </div>
    );
  }

  const currentMonths = rec.monthsToRecover;
  const currentDays = rec.daysToRecover;

  // 1.25x savings scenario
  const surplus125 = baseSurplus * 1.25;
  const months125 = Math.max(1, Math.ceil(totalOutflow / surplus125));
  const savedMonths125 = Math.max(0, currentMonths - months125);

  // 1.50x savings scenario
  const surplus150 = baseSurplus * 1.5;
  const months150 = Math.max(1, Math.ceil(totalOutflow / surplus150));
  const savedMonths150 = Math.max(0, currentMonths - months150);

  const maxMonths = Math.max(currentMonths, 1);

  const tiers = [
    {
      label: 'Standard Pace (1.0x)',
      subtitle: `Saving ${formatValue(baseSurplus)}/mo at current lifestyle`,
      months: currentMonths,
      days: currentDays,
      saved: 0,
      color: 'bg-primary',
      textColor: 'text-primary',
      badgeBg: 'bg-primary/10',
      widthPercent: 100,
      icon: <Hourglass className="w-3.5 h-3.5" />,
    },
    {
      label: 'Accelerated Pace (1.25x)',
      subtitle: `Boost savings by 25% (${formatValue(surplus125)}/mo)`,
      months: months125,
      days: Math.round(months125 * 30.4),
      saved: savedMonths125,
      color: 'bg-sky',
      textColor: 'text-sky-dark',
      badgeBg: 'bg-sky/15',
      widthPercent: Math.max(15, Math.round((months125 / maxMonths) * 100)),
      icon: <FastForward className="w-3.5 h-3.5" />,
    },
    {
      label: 'Sprint Recovery (1.50x)',
      subtitle: `Boost savings by 50% (${formatValue(surplus150)}/mo)`,
      months: months150,
      days: Math.round(months150 * 30.4),
      saved: savedMonths150,
      color: 'bg-mint',
      textColor: 'text-mint-dark',
      badgeBg: 'bg-mint/15',
      widthPercent: Math.max(15, Math.round((months150 / maxMonths) * 100)),
      icon: <Zap className="w-3.5 h-3.5" />,
    },
  ];

  return (
    <div
      className="p-6 rounded-3xl bg-white/75 backdrop-blur-xl border border-pastel-border shadow-pastel space-y-5"
      role="region"
      aria-label="Financial Recovery Speed & Timeline Chart"
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h3 className="text-sm font-bold text-slate-800">Replenishment Velocity Timeline</h3>
          <p className="text-xs text-slate-500">
            How many months to fully recover {formatValue(totalOutflow)} across different savings
            rates
          </p>
        </div>
        <div className="text-xs font-mono font-bold text-slate-700 bg-slate-100 px-3 py-1 rounded-full">
          Outflow: {formatValue(totalOutflow)}
        </div>
      </div>

      <div className="space-y-4 pt-1">
        {tiers.map((tier, idx) => (
          <div key={tier.label} className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-1.5 font-bold text-slate-700">
                <span className={tier.textColor}>{tier.icon}</span>
                <span>{tier.label}</span>
              </div>
              <div className="flex items-center gap-2">
                {tier.saved > 0 && (
                  <span className="text-[10px] font-mono font-bold text-mint-dark bg-mint/15 px-2 py-0.5 rounded-full">
                    Saves {tier.saved} mo{tier.saved > 1 ? 's' : ''}
                  </span>
                )}
                <span className="font-mono font-extrabold text-slate-800 text-xs">
                  {tier.months} Months
                </span>
                <span className="text-slate-400 font-mono text-[11px]">(~{tier.days} days)</span>
              </div>
            </div>

            {/* Horizontal Progress Bar */}
            <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden p-0.5 border border-slate-200/50">
              <motion.div
                initial={shouldReduceMotion ? { width: `${tier.widthPercent}%` } : { width: '0%' }}
                animate={{ width: `${tier.widthPercent}%` }}
                transition={{ duration: 0.6, delay: idx * 0.1, ease: 'easeOut' }}
                className={`h-full rounded-full ${tier.color}`}
              />
            </div>
            <div className="text-[10px] text-slate-400 pl-1">{tier.subtitle}</div>
          </div>
        ))}
      </div>

      <div className="p-3.5 rounded-2xl bg-primary/5 border border-primary/10 flex items-center gap-3 text-xs text-slate-600">
        <FastForward className="w-4 h-4 text-primary shrink-0" />
        <span>
          <strong>Pro-Tip:</strong> Tightening lifestyle wants by just 25% shaves{' '}
          <strong className="text-primary">{savedMonths125} months</strong> off your recovery
          journey.
        </span>
      </div>
    </div>
  );
};
