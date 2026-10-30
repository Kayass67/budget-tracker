import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { AlertCircle, BarChart3 } from 'lucide-react';

interface ChartEmptyStateProps {
  title?: string;
  message?: string;
  icon?: React.ReactNode;
}

export const ChartEmptyState: React.FC<ChartEmptyStateProps> = ({
  title = 'Chart Unavailable',
  message = 'Insufficient or non-positive data to render this visualization. Ensure your income and price inputs are positive.',
  icon,
}) => {
  const shouldReduceMotion = useReducedMotion();

  return (
    <motion.div
      initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.25 }}
      role="status"
      aria-label={title}
      className="flex flex-col items-center justify-center p-8 rounded-2xl bg-white/50 backdrop-blur-sm border border-pastel-border/60 text-center min-h-[240px]"
    >
      <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400 mb-3 shadow-xs">
        {icon || <BarChart3 className="w-6 h-6" />}
      </div>
      <div className="flex items-center gap-1.5 text-slate-700 font-bold text-sm mb-1">
        <AlertCircle className="w-4 h-4 text-amber-500" />
        <h4>{title}</h4>
      </div>
      <p className="text-xs text-slate-500 max-w-sm leading-relaxed">{message}</p>
    </motion.div>
  );
};
