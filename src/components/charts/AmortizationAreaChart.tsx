import React from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';
import { useAppStore } from '@/store';
import { amortizationSchedule } from '@/lib/finance';
import { ChartEmptyState } from './ChartEmptyState';
import { Layers } from 'lucide-react';

interface AmortizationAreaChartProps {
  principal: number;
  annualInterestRate: number;
  tenureMonths: number;
  method?: 'flat' | 'reducing';
}

export const AmortizationAreaChart: React.FC<AmortizationAreaChartProps> = ({
  principal,
  annualInterestRate,
  tenureMonths,
  method = 'reducing',
}) => {
  const { formatValue } = useAppStore();

  const safePrincipal = Math.max(0, isFinite(principal) ? principal : 0);
  const safeRate = Math.max(0, isFinite(annualInterestRate) ? annualInterestRate : 0);
  const safeTenure = Math.max(1, isFinite(tenureMonths) ? tenureMonths : 12);

  if (safePrincipal <= 0) {
    return (
      <ChartEmptyState
        title="No Loan Principal"
        message="A positive loan principal is required to generate the month-by-month amortization schedule."
        icon={<Layers className="w-6 h-6" />}
      />
    );
  }

  const rawSchedule = amortizationSchedule(safePrincipal, safeRate, safeTenure, method);

  const chartData = rawSchedule.map((row) => ({
    month: row.month,
    label: `M${row.month}`,
    principalPart: Math.max(0, Math.round(row.principalPart)),
    interestPart: Math.max(0, Math.round(row.interestPart)),
    totalEMI: Math.max(0, Math.round(row.emi)),
    balance: Math.max(0, Math.round(row.balance)),
  }));

  return (
    <div
      className="p-6 rounded-3xl bg-white/75 backdrop-blur-xl border border-pastel-border shadow-pastel space-y-4"
      role="region"
      aria-label="Amortization Schedule Stacked Area Chart"
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h3 className="text-sm font-bold text-slate-800">
            Amortization Trajectory ({safeTenure} Months)
          </h3>
          <p className="text-xs text-slate-500">
            Monthly principal accumulation vs interest reduction over time
          </p>
        </div>
        <div className="flex items-center gap-3 text-xs">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-primary" />
            <span className="text-slate-600 font-medium">Principal</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-peach" />
            <span className="text-slate-600 font-medium">Interest</span>
          </div>
        </div>
      </div>

      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="principalGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#7C6FE0" stopOpacity={0.45} />
                <stop offset="95%" stopColor="#7C6FE0" stopOpacity={0.05} />
              </linearGradient>
              <linearGradient id="interestGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#FFB48A" stopOpacity={0.45} />
                <stop offset="95%" stopColor="#FFB48A" stopOpacity={0.05} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" opacity={0.6} />
            <XAxis
              dataKey="label"
              tickLine={false}
              axisLine={{ stroke: '#CBD5E1' }}
              tick={{ fill: '#64748B', fontSize: 10, fontFamily: 'monospace' }}
              interval={safeTenure > 24 ? Math.floor(safeTenure / 6) : 1}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              tick={{ fill: '#64748B', fontSize: 10, fontFamily: 'monospace' }}
              tickFormatter={(v) => formatValue(v, undefined, { compact: true })}
            />
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const data = payload[0].payload;
                  return (
                    <div className="p-3.5 rounded-2xl bg-white/95 backdrop-blur-md border border-pastel-border shadow-pastel-lg text-xs space-y-2 min-w-[200px]">
                      <div className="flex items-center justify-between border-b border-slate-100 pb-1.5">
                        <span className="font-bold text-slate-800">Month {data.month}</span>
                        <span className="text-[10px] font-mono font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                          EMI: {formatValue(data.totalEMI)}
                        </span>
                      </div>
                      <div className="space-y-1 font-mono">
                        <div className="flex items-center justify-between text-primary">
                          <span className="font-sans font-medium text-slate-600">
                            Principal Paid:
                          </span>
                          <span className="font-bold">{formatValue(data.principalPart)}</span>
                        </div>
                        <div className="flex items-center justify-between text-peach-dark">
                          <span className="font-sans font-medium text-slate-600">
                            Interest Paid:
                          </span>
                          <span className="font-bold">{formatValue(data.interestPart)}</span>
                        </div>
                        <div className="flex items-center justify-between text-slate-500 pt-1 border-t border-slate-100 text-[11px]">
                          <span className="font-sans font-medium">Loan Balance:</span>
                          <span className="font-bold text-slate-700">
                            {formatValue(data.balance)}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Area
              type="monotone"
              dataKey="principalPart"
              name="Principal"
              stackId="1"
              stroke="#7C6FE0"
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#principalGrad)"
            />
            <Area
              type="monotone"
              dataKey="interestPart"
              name="Interest"
              stackId="1"
              stroke="#FFB48A"
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#interestGrad)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="flex items-center justify-between text-[11px] text-slate-500 bg-slate-50/70 p-3 rounded-2xl border border-slate-100">
        <span>
          Initial Principal:{' '}
          <strong className="font-mono text-slate-800">{formatValue(safePrincipal)}</strong>
        </span>
        <span>
          Method: <strong className="uppercase text-primary font-mono">{method}</strong>
        </span>
        <span>
          Final Balance: <strong className="font-mono text-mint-dark">{formatValue(0)}</strong>
        </span>
      </div>
    </div>
  );
};
