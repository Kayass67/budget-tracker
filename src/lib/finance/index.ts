export * from './config';
export * from './emi';
export * from './affordability';
export * from './recovery';
export * from './verdict';
export * from './advice';

import { AffordabilityVerdict, CalculationResult } from '@/types';
import { totalCostOfEMI } from './emi';

// ============================================================================
// Backward-compatibility wrappers for legacy code & initial tests
// ============================================================================

export function calculateDiscretionaryIncome(
  monthlyIncome: number,
  fixedExpenses: number,
  variableExpenses: number
): number {
  return Math.max(0, monthlyIncome - (fixedExpenses + variableExpenses));
}

export function calculateEmergencyFundRequired(fixedExpenses: number, months: number = 3): number {
  return fixedExpenses * Math.max(1, months);
}

export function calculateRecoveryTime(
  amountSpent: number,
  monthlyDiscretionaryIncome: number
): { months: number; days: number } {
  if (amountSpent <= 0) {
    return { months: 0, days: 0 };
  }
  if (monthlyDiscretionaryIncome <= 0) {
    return { months: Infinity, days: Infinity };
  }

  const exactMonths = amountSpent / monthlyDiscretionaryIncome;
  const roundedMonths = Math.round(exactMonths * 10) / 10;
  const roundedDays = Math.round(exactMonths * 30.4);

  return {
    months: roundedMonths,
    days: roundedDays,
  };
}

export function calculateEmi(
  principal: number,
  annualInterestRatePercent: number,
  tenureMonths: number
): { monthlyEmi: number; totalInterest: number; totalPayment: number } {
  if (principal <= 0 || tenureMonths <= 0) {
    return { monthlyEmi: 0, totalInterest: 0, totalPayment: 0 };
  }

  const cost = totalCostOfEMI(principal, annualInterestRatePercent, tenureMonths, 'reducing');
  return {
    monthlyEmi: cost.monthlyEMI,
    totalInterest: cost.totalInterest,
    totalPayment: cost.totalPaidInEMIs,
  };
}

export function evaluateCashAffordability(input: {
  productPrice: number;
  monthlyIncome: number;
  fixedExpenses: number;
  variableExpenses: number;
  currentSavings: number;
  emergencyFundMonths?: number;
}): CalculationResult {
  const {
    productPrice,
    monthlyIncome,
    fixedExpenses,
    variableExpenses,
    currentSavings,
    emergencyFundMonths = 3,
  } = input;

  const discretionaryIncome = calculateDiscretionaryIncome(
    monthlyIncome,
    fixedExpenses,
    variableExpenses
  );

  const emergencyRequired = calculateEmergencyFundRequired(fixedExpenses, emergencyFundMonths);

  const savingsAfter = currentSavings - productPrice;
  const recovery = calculateRecoveryTime(productPrice, discretionaryIncome);

  let verdict: AffordabilityVerdict;
  let verdictTitle: string;
  let verdictExplanation: string;

  if (savingsAfter < 0) {
    verdict = 'UNAFFORDABLE';
    verdictTitle = 'Not Recommended (Insufficient Funds)';
    verdictExplanation = `You are short by ${Math.abs(savingsAfter).toLocaleString()} in liquid savings. Purchasing this directly would deplete your entire reserve.`;
  } else if (savingsAfter < emergencyRequired) {
    verdict = 'CAUTION';
    verdictTitle = 'Proceed with Caution (Breaches Safety Net)';
    verdictExplanation = `You have enough cash, but this purchase cuts into your ${emergencyFundMonths}-month emergency reserve of ${emergencyRequired.toLocaleString()}.`;
  } else if (recovery.months > 12) {
    verdict = 'CAUTION';
    verdictTitle = 'High Recovery Time (Over 1 Year)';
    verdictExplanation = `It will take you approximately ${recovery.months} months to rebuild your savings balance back to its current level.`;
  } else {
    verdict = 'AFFORDABLE';
    verdictTitle = 'Safe to Buy (Healthy Cushion)';
    verdictExplanation = `Your emergency buffer remains fully protected, and you will recoup this amount in about ${recovery.months} months.`;
  }

  return {
    verdict,
    verdictTitle,
    verdictExplanation,
    recoveryDays: recovery.days,
    recoveryMonths: recovery.months,
    savingsAfterPurchase: savingsAfter,
    emergencyFundRequired: emergencyRequired,
    monthlyDiscretionaryIncome: discretionaryIncome,
  };
}
