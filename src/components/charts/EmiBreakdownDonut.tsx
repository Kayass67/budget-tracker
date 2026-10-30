import React from 'react';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from 'recharts';
import { useAppStore } from '@/store';
import { ChartEmptyState } from './ChartEmptyState';
import { PieChart as PieIcon } from 'lucide-react';

interface EmiBreakdownDonutProps {
  principal: number;
  totalInterest: number;
  fees: number; // processing fee + any upfront loan fees
  downPayment?: number;
}

const COLORS = {
  principal: '#7C6FE0', // Primary soft violet
  interest: '#FFB48A', // Peach / warm accent
  fees: '#5CC8A8', // Mint
  downPayment: '#6EC1F2', // Sky blue
};

export const EmiBreakdownDonut: React.FC<EmiBreakdownDonutProps> = ({
  principal,
  totalInterest,
  fees,
  downPayment = 0,
}) => {
  const { formatValue } = useAppStore();

  const safePrincipal = Math.max(0, isFinite(principal) ? principal : 0);
  const safeInterest = Math.max(0, isFinite(totalInterest) ? totalInterest : 0);
  const safeFees = Math.max(0, isFinite(fees) ? fees : 0);
  const safeDownPayment = Math.max(0, isFinite(downPayment) ? downPayment : 0);

  const rawData = [
    { name: 'Loan Principal', value: safePrincipal, color: COLORS.principal },
    { name: 'Total Interest', value: safeInterest, color: COLORS.interest },
    { name: 'Processing Fees', value: safeFees, color: COLORS.fees },
    { name: 'Down Payment', value: safeDownPayment, color: COLORS.downPayment },
  ];

  const data = rawData.filter((item) => item.value > 0);
  const totalCost = data.reduce((acc, curr) => acc + curr.value, 0);

  if (totalCost <= 0 || isNaN(totalCost)) {
    return (
      <ChartEmptyState
        title="No EMI Cost Data"
        message="Configure a loan principal or down payment to view your financing cost breakdown."
        icon={<PieIcon className="w-6 h-6" />}
      />
    );
  }

  return (
    <div
      className="p-6 rounded-3xl bg-white/75 backdrop-blur-xl border border-pastel-border shadow-pastel space-y-4"
      role="region"
      aria-label="EMI Cost Breakdown Donut Chart"
    >
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-bold text-slate-800">EMI Cost Breakdown</h3>
          <p className="text-xs text-slate-500">
            Principal vs interest overhead vs upfront charges
          </p>
        </div>
        <span className="text-[11px] font-mono font-bold text-primary bg-primary/10 px-2.5 py-1 rounded-full">
          Total: {formatValue(totalCost)}
        </span>
      </div>

      <div className="relative h-60 w-full flex items-center justify-center">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart aria-label="EMI Cost Breakdown Pie Chart">
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const entry = payload[0];
                  const value = Number(entry.value) || 0;
                  const percent = totalCost > 0 ? ((value / totalCost) * 100).toFixed(1) : '0';
                  return (
                    <div className="p-3 rounded-2xl bg-white/95 backdrop-blur-md border border-pastel-border shadow-pastel-lg text-xs space-y-1">
                      <div className="flex items-center gap-2">
                        <span
                          className="w-2.5 h-2.5 rounded-full"
                          style={{ backgroundColor: entry.payload?.color || '#7C6FE0' }}
                        />
                        <span className="font-bold text-slate-800">{entry.name}</span>
                      </div>
                      <div className="font-mono text-sm font-extrabold text-slate-800">
                        {formatValue(value)}
                      </div>
                      <div className="text-[10px] text-slate-400 font-medium">
                        {percent}% of total cost
                      </div>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={65}
              outerRadius={95}
              paddingAngle={3}
              dataKey="value"
              animationDuration={800}
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>

        {/* Center Donut Label */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <span className="text-[10px] uppercase tracking-wider font-bold text-slate-400">
            Total Outflow
          </span>
          <span className="font-mono text-base font-extrabold text-slate-800">
            {formatValue(totalCost, undefined, { compact: true })}
          </span>
          <span className="text-[10px] font-mono text-slate-500 font-semibold">
            {totalCost > 0 ? `${((safeInterest / totalCost) * 100).toFixed(0)}% Interest` : ''}
          </span>
        </div>
      </div>

      {/* Custom Accessible Legend */}
      <div className="grid grid-cols-2 gap-2.5 pt-2 border-t border-slate-100">
        {data.map((item) => {
          const percent = totalCost > 0 ? ((item.value / totalCost) * 100).toFixed(1) : '0';
          return (
            <div key={item.name} className="flex items-start gap-2 text-xs">
              <span
                className="w-3 h-3 rounded-full mt-0.5 shrink-0"
                style={{ backgroundColor: item.color }}
              />
              <div className="min-w-0">
                <div className="text-[11px] font-medium text-slate-600 truncate">{item.name}</div>
                <div className="font-mono font-bold text-slate-800 text-xs">
                  {formatValue(item.value)}
                  <span className="text-[10px] font-normal text-slate-400 ml-1">({percent}%)</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
