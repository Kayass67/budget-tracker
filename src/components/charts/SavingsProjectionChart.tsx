import React from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ReferenceLine,
} from 'recharts';
import { useAppStore } from '@/store';
import { UserProfile, ProductInput, EMITerms } from '@/types';
import { projectAllSavingsOptions } from '@/lib/finance';
import { ChartEmptyState } from './ChartEmptyState';
import { TrendingUp } from 'lucide-react';

interface SavingsProjectionChartProps {
  profile: Partial<UserProfile>;
  product: ProductInput;
  emiTerms?: EMITerms;
  horizonMonths?: number;
}

export const SavingsProjectionChart: React.FC<SavingsProjectionChartProps> = ({
  profile,
  product,
  emiTerms,
  horizonMonths = 36,
}) => {
  const { formatValue } = useAppStore();

  const safeMonths = Math.max(12, Math.min(60, horizonMonths));
  const projection = projectAllSavingsOptions(profile, product, emiTerms, safeMonths);

  if (!projection.points || projection.points.length === 0) {
    return (
      <ChartEmptyState
        title="Savings Projection Unavailable"
        message="Enter valid profile income and savings to project your 36-month wealth trajectory."
        icon={<TrendingUp className="w-6 h-6" />}
      />
    );
  }

  const { startingSavings, recoveryMonths, points } = projection;

  return (
    <div
      className="p-6 rounded-3xl bg-white/75 backdrop-blur-xl border border-pastel-border shadow-pastel space-y-5"
      role="region"
      aria-label="36-Month Savings Balance Projection Chart"
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h3 className="text-sm font-bold text-slate-800">
            36-Month Savings Trajectory & Recovery
          </h3>
          <p className="text-xs text-slate-500">
            Comparing wealth growth: baseline status-quo vs cash vs EMI financing
          </p>
        </div>

        {/* Recovery badges */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Cash Recovery Badge */}
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-primary/10 border border-primary/20 text-[11px] font-mono font-bold text-primary">
            <span className="w-2 h-2 rounded-full bg-primary" />
            <span>Cash:</span>
            {recoveryMonths.cash !== null ? (
              <span className="text-slate-700">
                M{recoveryMonths.cash} (~{recoveryMonths.cash} mos)
              </span>
            ) : (
              <span className="text-verdict-red">&gt;36 mos</span>
            )}
          </div>

          {/* EMI Recovery Badge */}
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-peach/20 border border-peach/30 text-[11px] font-mono font-bold text-peach-dark">
            <span className="w-2 h-2 rounded-full bg-peach" />
            <span>EMI:</span>
            {recoveryMonths.emi !== null ? (
              <span className="text-slate-700">
                M{recoveryMonths.emi} (~{recoveryMonths.emi} mos)
              </span>
            ) : (
              <span className="text-verdict-red">&gt;36 mos</span>
            )}
          </div>
        </div>
      </div>

      <div className="h-72 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={points} margin={{ top: 12, right: 12, left: -15, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" opacity={0.6} />
            <XAxis
              dataKey="label"
              tickLine={false}
              axisLine={{ stroke: '#CBD5E1' }}
              tick={{ fill: '#64748B', fontSize: 10, fontFamily: 'monospace' }}
              interval={5}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              tick={{ fill: '#64748B', fontSize: 10, fontFamily: 'monospace' }}
              tickFormatter={(v) => formatValue(v, undefined, { compact: true })}
            />

            {/* Starting Savings Baseline Reference Line */}
            {startingSavings > 0 && (
              <ReferenceLine
                y={startingSavings}
                stroke="#94A3B8"
                strokeDasharray="4 4"
                strokeWidth={1.5}
                label={{
                  value: `Start: ${formatValue(startingSavings, undefined, { compact: true })}`,
                  position: 'insideTopLeft',
                  fill: '#64748B',
                  fontSize: 10,
                  fontFamily: 'monospace',
                }}
              />
            )}

            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const data = payload[0].payload;
                  return (
                    <div className="p-3.5 rounded-2xl bg-white/95 backdrop-blur-md border border-pastel-border shadow-pastel-lg text-xs space-y-2 min-w-[210px]">
                      <div className="flex items-center justify-between border-b border-slate-100 pb-1.5 font-bold text-slate-800">
                        <span>Month {data.month}</span>
                        <span className="text-[10px] font-mono text-slate-400">Horizon Check</span>
                      </div>
                      <div className="space-y-1.5 font-mono">
                        <div className="flex items-center justify-between text-mint-dark">
                          <span className="font-sans font-medium text-slate-600 flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-mint" /> Do Nothing:
                          </span>
                          <span className="font-bold">{formatValue(data.doNothing)}</span>
                        </div>
                        <div className="flex items-center justify-between text-primary">
                          <span className="font-sans font-medium text-slate-600 flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-primary" /> Buy in Cash:
                          </span>
                          <span className="font-bold">{formatValue(data.cash)}</span>
                        </div>
                        <div className="flex items-center justify-between text-peach-dark">
                          <span className="font-sans font-medium text-slate-600 flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-peach" /> Buy on EMI:
                          </span>
                          <span className="font-bold">{formatValue(data.emi)}</span>
                        </div>
                      </div>
                    </div>
                  );
                }
                return null;
              }}
            />

            {/* Line 1: Do Nothing (Mint) */}
            <Line
              type="monotone"
              dataKey="doNothing"
              name="Do Nothing"
              stroke="#5CC8A8"
              strokeWidth={2.5}
              dot={false}
              activeDot={{ r: 5, fill: '#5CC8A8' }}
            />

            {/* Line 2: Buy in Cash (Violet) */}
            <Line
              type="monotone"
              dataKey="cash"
              name="Buy in Cash"
              stroke="#7C6FE0"
              strokeWidth={2.5}
              dot={false}
              activeDot={{ r: 5, fill: '#7C6FE0' }}
            />

            {/* Line 3: Buy on EMI (Peach) */}
            <Line
              type="monotone"
              dataKey="emi"
              name="Buy on EMI"
              stroke="#FFB48A"
              strokeWidth={2.5}
              dot={false}
              activeDot={{ r: 5, fill: '#FFB48A' }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Legend & Milestone summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-slate-100">
        <div className="flex items-center gap-2 text-xs">
          <span className="w-3 h-3 rounded-full bg-mint shrink-0" />
          <div>
            <span className="font-bold text-slate-700">Do Nothing</span>
            <p className="text-[10px] text-slate-500">Continuous baseline wealth accumulation</p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <span className="w-3 h-3 rounded-full bg-primary shrink-0" />
          <div>
            <span className="font-bold text-slate-700">Buy in Cash</span>
            <p className="text-[10px] text-slate-500">
              {recoveryMonths.cash !== null
                ? `Reaches starting level at month ${recoveryMonths.cash}`
                : 'Takes > 36 months to recover'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <span className="w-3 h-3 rounded-full bg-peach shrink-0" />
          <div>
            <span className="font-bold text-slate-700">Buy on EMI</span>
            <p className="text-[10px] text-slate-500">
              {recoveryMonths.emi !== null
                ? `Reaches starting level at month ${recoveryMonths.emi}`
                : 'Takes > 36 months to recover'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
