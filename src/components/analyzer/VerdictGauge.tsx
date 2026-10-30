import React from 'react';
import { motion } from 'framer-motion';
import { VerdictLabel } from '@/types';

interface VerdictGaugeProps {
  score: number;
  label: VerdictLabel;
}

export const VerdictGauge: React.FC<VerdictGaugeProps> = ({ score, label }) => {
  // Clamp score between 0 and 100
  const clampedScore = Math.max(0, Math.min(100, score));

  // Determine colors based on label/score
  let color = '#4CBF8F'; // green
  let bgGradient = 'from-emerald-500/10 to-mint/20';
  let badgeColor = 'bg-verdict-green/15 text-verdict-green border-verdict-green/30';

  if (label === 'Buy With Caution') {
    color = '#F2B84B'; // amber
    bgGradient = 'from-amber-500/10 to-peach/20';
    badgeColor = 'bg-amber-100 text-amber-800 border-amber-200';
  } else if (label === 'Wait') {
    color = '#FFB48A'; // peach/orange
    bgGradient = 'from-orange-500/10 to-rose/15';
    badgeColor = 'bg-orange-100 text-orange-800 border-orange-200';
  } else if (label === 'Avoid') {
    color = '#EE6B6B'; // red
    bgGradient = 'from-rose-500/15 to-red-500/20';
    badgeColor = 'bg-rose-100 text-rose-800 border-rose-200';
  }

  // SVG Gauge geometry (Semi-circle or 240-degree arc)
  const radius = 64;
  const circumference = Math.PI * radius; // 180-degree semi-circle
  const strokeDashoffset = circumference - (clampedScore / 100) * circumference;

  return (
    <div
      className={`relative p-6 rounded-3xl bg-gradient-to-br ${bgGradient} border border-pastel-border backdrop-blur-md shadow-pastel flex flex-col items-center justify-center text-center overflow-hidden`}
    >
      <div className="relative w-44 h-28 flex items-center justify-center">
        <svg className="w-44 h-44 -rotate-180 transform" viewBox="0 0 160 160">
          {/* Background Arc */}
          <circle
            cx="80"
            cy="80"
            r={radius}
            fill="none"
            stroke="rgba(0,0,0,0.06)"
            strokeWidth="14"
            strokeDasharray={circumference}
            strokeDashoffset="0"
            strokeLinecap="round"
          />
          {/* Animated Value Arc */}
          <motion.circle
            cx="80"
            cy="80"
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth="14"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset }}
            transition={{ duration: 0.9, ease: 'easeOut' }}
            strokeLinecap="round"
          />
        </svg>

        {/* Center Score Metric */}
        <div className="absolute top-12 flex flex-col items-center">
          <motion.span
            className="font-mono text-4xl font-extrabold text-slate-800"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.4, delay: 0.2 }}
          >
            {clampedScore}
          </motion.span>
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Out of 100
          </span>
        </div>
      </div>

      {/* Label Badge */}
      <div className="mt-2">
        <span
          className={`inline-block px-3.5 py-1 rounded-full text-xs font-bold border shadow-xs ${badgeColor}`}
        >
          {label}
        </span>
      </div>
    </div>
  );
};
