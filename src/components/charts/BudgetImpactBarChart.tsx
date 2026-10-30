import React from 'react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { useAppStore } from '@/store';
import { UserProfile, ProductInput, EMITerms } from '@/types';
import { monthlySurplus, affordabilityEMI, getProfileValues } from '@/lib/finance';
import { ChartEmptyState } from './ChartEmptyState';
import { BarChart3 } from 'lucide-react';

interface BudgetImpactBarChartProps {
  profile: Partial<UserProfile>;
  product: ProductInput;
  paymentOption: 'cash' | 'emi';
  emiTerms?: EMITerms;
}

export const BudgetImpactBarChart: React.FC<BudgetImpactBarChartProps> = ({
  profile,
  product,
  paymentOption,
  emiTerms,
}) => {
  const { formatValue } = useAppStore();
  const { income, fixed, lifestyle, existingEMIs } = getProfileValues(profile);

  if (income <= 0) {
    return (
      <ChartEmptyState
        title="Income Required"
        message="Configure your monthly income in profile to analyze monthly budget restructuring."
        icon={<BarChart3 className="w-6 h-6" />}
      />
    );
  }

  const beforeSurplus = monthlySurplus(profile);

  let newEMI = 0;
  if (paymentOption === 'emi' && emiTerms) {
    const emiResult = affordabilityEMI(profile, product, emiTerms);
    newEMI = emiResult.newEMI;
  }

  const afterEMIs = existingEMIs + newEMI;
  const afterSurplus = beforeSurplus - newEMI;

  const data = [
    {
      category: 'Needs (Fixed)',
      before: Math.max(0, Math.round(fixed)),
      after: Math.max(0, Math.round(fixed)),
    },
    {
      category: 'Wants (Lifestyle)',
      before: Math.max(0, Math.round(lifestyle)),
      after: Math.max(0, Math.round(lifestyle)),
    },
    {
      category: 'EMI Debt',
      before: Math.max(0, Math.round(existingEMIs)),
      after: Math.max(0, Math.round(afterEMIs)),
    },
    {
      category: 'Monthly Savings',
      before: Math.round(beforeSurplus),
      after: Math.round(afterSurplus),
    },
  ];

  return (
    <div
      className="p-6 rounded-3xl bg-white/75 backdrop-blur-xl border border-pastel-border shadow-pastel space-y-4"
      role="region"
      aria-label="Monthly Budget Impact Before vs After Purchase"
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h3 className="text-sm font-bold text-slate-800">Monthly Budget Restructuring</h3>
          <p className="text-xs text-slate-500">
            Comparing monthly cash allocation before vs after this purchase
          </p>
        </div>
        <div className="flex items-center gap-3 text-xs">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-slate-400" />
            <span className="text-slate-600 font-medium">Before Purchase</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-primary" />
            <span className="text-slate-600 font-medium">After Purchase</span>
          </div>
        </div>
      </div>

      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 12, right: 12, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" opacity={0.6} />
            <XAxis
              dataKey="category"
              tickLine={false}
              axisLine={{ stroke: '#CBD5E1' }}
              tick={{ fill: '#64748B', fontSize: 11, fontWeight: 600 }}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              tick={{ fill: '#64748B', fontSize: 10, fontFamily: 'monospace' }}
              tickFormatter={(v) => formatValue(v, undefined, { compact: true })}
            />
            <Tooltip
              content={({ active, payload, label }) => {
                if (active && payload && payload.length >= 2) {
                  const beforeVal = Number(payload[0].value) || 0;
                  const afterVal = Number(payload[1].value) || 0;
                  const delta = afterVal - beforeVal;

                  return (
                    <div className="p-3.5 rounded-2xl bg-white/95 backdrop-blur-md border border-pastel-border shadow-pastel-lg text-xs space-y-2 min-w-[200px]">
                      <div className="font-bold text-slate-800 border-b border-slate-100 pb-1.5">
                        {label}
                      </div>
                      <div className="space-y-1 font-mono">
                        <div className="flex items-center justify-between text-slate-500">
                          <span className="font-sans font-medium">Before:</span>
                          <span className="font-bold">{formatValue(beforeVal)}</span>
                        </div>
                        <div className="flex items-center justify-between text-primary">
                          <span className="font-sans font-medium">After:</span>
                          <span className="font-bold">{formatValue(afterVal)}</span>
                        </div>
                        {delta !== 0 && (
                          <div
                            className={`flex items-center justify-between pt-1 border-t border-slate-100 font-bold ${
                              delta > 0 && label === 'Monthly Savings'
                                ? 'text-mint-dark'
                                : delta < 0 && label === 'Monthly Savings'
                                  ? 'text-verdict-red'
                                  : 'text-amber-600'
                            }`}
                          >
                            <span className="font-sans font-medium text-slate-600">Net Shift:</span>
                            <span>{delta > 0 ? `+${formatValue(delta)}` : formatValue(delta)}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Bar
              dataKey="before"
              name="Before Purchase"
              fill="#94A3B8"
              radius={[6, 6, 0, 0]}
              maxBarSize={40}
            />
            <Bar
              dataKey="after"
              name="After Purchase"
              fill="#7C6FE0"
              radius={[6, 6, 0, 0]}
              maxBarSize={40}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="flex flex-wrap items-center justify-between text-xs text-slate-500 pt-2 border-t border-slate-100">
        <span>
          Surplus Shift:{' '}
          <strong
            className={`font-mono font-bold ${
              afterSurplus >= beforeSurplus * 0.5 ? 'text-mint-dark' : 'text-amber-600'
            }`}
          >
            {formatValue(afterSurplus)} / mo
          </strong>
        </span>
        <span>
          Payment Type:{' '}
          <strong className="uppercase font-mono text-primary font-bold">{paymentOption}</strong>
        </span>
      </div>
    </div>
  );
};
