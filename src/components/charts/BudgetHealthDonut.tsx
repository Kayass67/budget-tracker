import React from 'react';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from 'recharts';
import { useAppStore } from '@/store';
import { UserProfile } from '@/types';
import { budgetHealth } from '@/lib/finance';
import { ChartEmptyState } from './ChartEmptyState';
import { PieChart as PieIcon, CheckCircle2, AlertTriangle } from 'lucide-react';

interface BudgetHealthDonutProps {
  profile: Partial<UserProfile>;
}

const COLORS = {
  needs: '#7C6FE0', // Violet (Needs - 50%)
  wants: '#FFB48A', // Peach (Wants - 30%)
  savings: '#5CC8A8', // Mint (Savings - 20%)
};

export const BudgetHealthDonut: React.FC<BudgetHealthDonutProps> = ({ profile }) => {
  const { formatValue } = useAppStore();
  const health = budgetHealth(profile);

  const safeNeeds = Math.max(0, health.needsAmount);
  const safeWants = Math.max(0, health.wantsAmount);
  const safeSavings = Math.max(0, health.savingsAmount);

  const total = safeNeeds + safeWants + safeSavings;

  if (total <= 0) {
    return (
      <ChartEmptyState
        title="No Budget Data"
        message="Enter income and expense details in your profile to view your 50/30/20 budget breakdown."
        icon={<PieIcon className="w-6 h-6" />}
      />
    );
  }

  const data = [
    {
      name: 'Needs (Fixed + Debt)',
      ideal: '≤50%',
      actualPercent: (health.needsRatio * 100).toFixed(1),
      value: safeNeeds,
      color: COLORS.needs,
      status: health.meetsNeedsRule,
    },
    {
      name: 'Wants (Lifestyle)',
      ideal: '≤30%',
      actualPercent: (health.wantsRatio * 100).toFixed(1),
      value: safeWants,
      color: COLORS.wants,
      status: health.meetsWantsRule,
    },
    {
      name: 'Savings / Surplus',
      ideal: '≥20%',
      actualPercent: (health.savingsRatio * 100).toFixed(1),
      value: safeSavings,
      color: COLORS.savings,
      status: health.meetsSavingsRule,
    },
  ].filter((d) => d.value > 0);

  return (
    <div
      className="p-6 rounded-3xl bg-white/75 backdrop-blur-xl border border-pastel-border shadow-pastel space-y-4"
      role="region"
      aria-label="Budget Health 50/30/20 Donut Chart"
    >
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-bold text-slate-800">50/30/20 Budget Health</h3>
          <p className="text-xs text-slate-500">Actual allocation vs ideal benchmark</p>
        </div>
        <div className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold font-mono bg-primary/10 text-primary">
          Score: {health.healthScore}/100
        </div>
      </div>

      <div className="relative h-56 w-full flex items-center justify-center">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart aria-label="Budget Health Pie Chart">
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const entry = payload[0].payload;
                  return (
                    <div className="p-3.5 rounded-2xl bg-white/95 backdrop-blur-md border border-pastel-border shadow-pastel-lg text-xs space-y-1.5 min-w-[180px]">
                      <div className="flex items-center gap-2 font-bold text-slate-800">
                        <span
                          className="w-2.5 h-2.5 rounded-full"
                          style={{ backgroundColor: entry.color }}
                        />
                        <span>{entry.name}</span>
                      </div>
                      <div className="font-mono text-sm font-extrabold text-slate-800">
                        {formatValue(entry.value)}
                      </div>
                      <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1 border-t border-slate-100">
                        <span>
                          Actual: <strong>{entry.actualPercent}%</strong>
                        </span>
                        <span>
                          Ideal: <strong>{entry.ideal}</strong>
                        </span>
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
              outerRadius={90}
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

        {/* Center label */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">
            Health Index
          </span>
          <span className="font-mono text-xl font-extrabold text-slate-800">
            {health.healthScore}
            <span className="text-xs text-slate-400 font-normal">/100</span>
          </span>
          <span
            className={`text-[10px] font-bold ${
              health.healthScore >= 80
                ? 'text-verdict-green'
                : health.healthScore >= 50
                  ? 'text-amber-600'
                  : 'text-verdict-red'
            }`}
          >
            {health.healthScore >= 80
              ? 'Optimal'
              : health.healthScore >= 50
                ? 'Moderate'
                : 'Strained'}
          </span>
        </div>
      </div>

      {/* Legend & Rule Check */}
      <div className="space-y-2 pt-2 border-t border-slate-100">
        {data.map((item) => (
          <div key={item.name} className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
              <span className="font-medium text-slate-700">{item.name}</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="font-mono font-bold text-slate-800">
                {formatValue(item.value, undefined, { compact: true })}
                <span className="text-[10px] text-slate-400 font-normal ml-1">
                  ({item.actualPercent}%)
                </span>
              </span>
              <span className="flex items-center gap-1 text-[11px] font-mono">
                {item.status ? (
                  <CheckCircle2
                    className="w-3.5 h-3.5 text-mint-dark"
                    aria-label={`Passes ${item.ideal}`}
                  />
                ) : (
                  <AlertTriangle
                    className="w-3.5 h-3.5 text-amber-500"
                    aria-label={`Exceeds ${item.ideal}`}
                  />
                )}
                <span className="text-slate-400 text-[10px]">{item.ideal}</span>
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
