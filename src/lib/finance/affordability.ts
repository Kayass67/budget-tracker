import { UserProfile, ProductInput, EMITerms } from '@/types';
import { FINANCE_CONFIG } from './config';
import { totalCostOfEMI, TotalCostEMIResult } from './emi';

export interface BudgetHealthResult {
  needsAmount: number;
  wantsAmount: number;
  savingsAmount: number;
  needsRatio: number;
  wantsRatio: number;
  savingsRatio: number;
  meetsNeedsRule: boolean; // needs <= 50%
  meetsWantsRule: boolean; // wants <= 30%
  meetsSavingsRule: boolean; // savings >= 20%
  healthScore: number; // 0-100
  summary: string;
}

export interface EmergencyFundResult {
  targetMonths: number;
  monthlyCommitments: number;
  targetAmount: number;
  currentAmount: number;
  gap: number;
  usableSavings: number;
  isFullyFunded: boolean;
}

export interface CashAffordabilityResult {
  canPayNow: boolean;
  usableSavings: number;
  savingsAfterPurchase: number;
  emergencyFundTarget: number;
  emergencyFundIntact: boolean;
  monthlySurplus: number;
  monthsToSaveUp: number;
  minimumIncomeRequired: number;
  saveWindowMonths: number;
}

export interface EMIAffordabilityResult {
  principal: number;
  newEMI: number;
  totalEMIs: number;
  newDTI: number;
  dtiStatus: 'healthy' | 'risky' | 'unsafe';
  surplusAfterEMI: number;
  downPaymentAffordable: boolean;
  minimumIncomeRequired: number;
  emiCost: TotalCostEMIResult;
}

/**
 * Normalizes profile fields for backward compatibility
 */
export function getProfileValues(profile: Partial<UserProfile>) {
  const income = profile.monthlyIncome || 0;
  const fixed = profile.monthlyFixedExpenses ?? profile.fixedExpenses ?? 0;
  const lifestyle = profile.monthlyLifestyleExpenses ?? profile.variableExpenses ?? 0;
  const existingEMIs = profile.existingMonthlyEMIs || 0;
  const currentSavings = profile.currentSavings || 0;
  const dependents = profile.dependents || 0;

  // If emergencyFundCurrent not set, approximate from fixed expenses
  const defaultEFMonths =
    dependents > 0
      ? FINANCE_CONFIG.EMERGENCY_FUND.MONTHS_WITH_DEPENDENTS
      : FINANCE_CONFIG.EMERGENCY_FUND.MONTHS_NO_DEPENDENTS;
  const emergencyFundCurrent =
    profile.emergencyFundCurrent ??
    (fixed + existingEMIs) * (profile.emergencyFundMonths ?? defaultEFMonths);

  return {
    income,
    fixed,
    lifestyle,
    existingEMIs,
    currentSavings,
    emergencyFundCurrent,
    dependents,
  };
}

/**
 * 4. Monthly net disposable surplus.
 * Formula: income - fixedExpenses - lifestyleExpenses - existingEMIs
 */
export function monthlySurplus(profile: Partial<UserProfile>): number {
  const { income, fixed, lifestyle, existingEMIs } = getProfileValues(profile);
  return income - fixed - lifestyle - existingEMIs;
}

/**
 * 5. Budget health check against standard 50/30/20 guideline.
 * - Needs (Fixed expenses + existing EMIs) <= 50%
 * - Wants (Lifestyle) <= 30%
 * - Savings / Surplus >= 20%
 */
export function budgetHealth(profile: Partial<UserProfile>): BudgetHealthResult {
  const { income, fixed, lifestyle, existingEMIs } = getProfileValues(profile);

  if (income <= 0) {
    return {
      needsAmount: fixed + existingEMIs,
      wantsAmount: lifestyle,
      savingsAmount: 0,
      needsRatio: 1,
      wantsRatio: 0,
      savingsRatio: 0,
      meetsNeedsRule: false,
      meetsWantsRule: false,
      meetsSavingsRule: false,
      healthScore: 0,
      summary: 'Income is zero or negative. Immediate budgeting required.',
    };
  }

  const needsAmount = fixed + existingEMIs;
  const wantsAmount = lifestyle;
  const savingsAmount = monthlySurplus(profile);

  const needsRatio = Math.round((needsAmount / income) * 1000) / 1000;
  const wantsRatio = Math.round((wantsAmount / income) * 1000) / 1000;
  const savingsRatio = Math.round((savingsAmount / income) * 1000) / 1000;

  const meetsNeedsRule = needsRatio <= FINANCE_CONFIG.BUDGET_RULE.MAX_NEEDS_RATIO;
  const meetsWantsRule = wantsRatio <= FINANCE_CONFIG.BUDGET_RULE.MAX_WANTS_RATIO;
  const meetsSavingsRule = savingsRatio >= FINANCE_CONFIG.BUDGET_RULE.TARGET_SAVINGS_RATIO;

  let healthScore = 100;
  if (!meetsNeedsRule) {
    const excessNeedsPercent =
      Math.max(0, needsRatio - FINANCE_CONFIG.BUDGET_RULE.MAX_NEEDS_RATIO) * 100;
    healthScore -= Math.min(35, excessNeedsPercent * 1.5);
  }
  if (!meetsWantsRule) {
    const excessWantsPercent =
      Math.max(0, wantsRatio - FINANCE_CONFIG.BUDGET_RULE.MAX_WANTS_RATIO) * 100;
    healthScore -= Math.min(25, excessWantsPercent * 1.2);
  }
  if (!meetsSavingsRule) {
    const deficitSavingsPercent =
      Math.max(0, FINANCE_CONFIG.BUDGET_RULE.TARGET_SAVINGS_RATIO - savingsRatio) * 100;
    healthScore -= Math.min(40, deficitSavingsPercent * 2.0);
  }

  healthScore = Math.max(0, Math.round(healthScore));

  let summary = 'Healthy 50/30/20 balanced budget.';
  if (!meetsSavingsRule && !meetsNeedsRule) {
    summary = 'High essential expenses are crowding out your savings ability.';
  } else if (!meetsSavingsRule) {
    summary = 'Savings rate is below the recommended 20% wealth-building threshold.';
  } else if (!meetsWantsRule) {
    summary = 'Lifestyle expenditures slightly elevated above the 30% guideline.';
  }

  return {
    needsAmount,
    wantsAmount,
    savingsAmount,
    needsRatio,
    wantsRatio,
    savingsRatio,
    meetsNeedsRule,
    meetsWantsRule,
    meetsSavingsRule,
    healthScore,
    summary,
  };
}

/**
 * 6. Emergency fund target and liquidity gap calculation.
 * Formula: target = months * (fixedExpenses + existingEMIs)
 * 6 months with dependents, 3 months without dependents (customizable).
 */
export function emergencyFundTarget(
  profile: Partial<UserProfile>,
  customMonths?: number
): EmergencyFundResult {
  const { fixed, existingEMIs, currentSavings, emergencyFundCurrent, dependents } =
    getProfileValues(profile);

  const targetMonths =
    customMonths !== undefined
      ? customMonths
      : dependents > 0
        ? FINANCE_CONFIG.EMERGENCY_FUND.MONTHS_WITH_DEPENDENTS
        : FINANCE_CONFIG.EMERGENCY_FUND.MONTHS_NO_DEPENDENTS;

  const monthlyCommitments = fixed + existingEMIs;
  const targetAmount = targetMonths * monthlyCommitments;
  const gap = Math.max(0, targetAmount - emergencyFundCurrent);

  // Usable savings = savings that can be spent without violating the emergency fund target
  const usableSavings = Math.max(0, currentSavings - targetAmount);
  const isFullyFunded = emergencyFundCurrent >= targetAmount;

  return {
    targetMonths,
    monthlyCommitments,
    targetAmount,
    currentAmount: emergencyFundCurrent,
    gap,
    usableSavings,
    isFullyFunded,
  };
}

/**
 * 7. Evaluates cash purchase feasibility.
 *
 * Requirements:
 * - canPayNow = (currentSavings - emergencyFundTarget) >= price
 * - monthsToSaveUp = if not payable now, ceil((price - usableSavings) / monthlySurplus), or Infinity if surplus <= 0
 * - minimumIncomeRequired = income at which user could save the price within saveWindowMonths
 *   while keeping needs <= 50% and savings >= 20%.
 *   Formula: needs + lifestyle + price/saveWindowMonths = 0.80 * income
 *   => income = (needs + lifestyle + price/saveWindowMonths) / 0.80
 *   Checked against: income >= needs / 0.50
 */
export function affordabilityCash(
  profile: Partial<UserProfile>,
  product: ProductInput,
  saveWindowMonths: number = 6
): CashAffordabilityResult {
  const { currentSavings } = getProfileValues(profile);
  const ef = emergencyFundTarget(profile);
  const surplus = monthlySurplus(profile);

  const canPayNow = currentSavings - ef.targetAmount >= product.price;
  const usableSavings = ef.usableSavings;
  const savingsAfterPurchase = currentSavings - product.price;
  const emergencyFundIntact = savingsAfterPurchase >= ef.targetAmount;

  let monthsToSaveUp = 0;
  if (!canPayNow) {
    if (surplus <= 0) {
      monthsToSaveUp = Infinity;
    } else {
      const remainingNeeded = Math.max(0, product.price - usableSavings);
      monthsToSaveUp = Math.ceil(remainingNeeded / surplus);
    }
  }

  // Minimum income required computation
  const { fixed, lifestyle, existingEMIs } = getProfileValues(profile);
  const needs = fixed + existingEMIs;
  const priceMonthlyTarget = product.price / Math.max(1, saveWindowMonths);

  // (needs + lifestyle + priceMonthlyTarget) / 0.80 ensures 20% savings margin
  const incomeRequiredFromSavings = (needs + lifestyle + priceMonthlyTarget) / 0.8;
  // needs / 0.50 ensures needs do not breach 50% of income
  const incomeRequiredFromNeedsCap = needs / 0.5;

  const minimumIncomeRequired = Math.ceil(
    Math.max(incomeRequiredFromSavings, incomeRequiredFromNeedsCap)
  );

  return {
    canPayNow,
    usableSavings,
    savingsAfterPurchase,
    emergencyFundTarget: ef.targetAmount,
    emergencyFundIntact,
    monthlySurplus: surplus,
    monthsToSaveUp,
    minimumIncomeRequired,
    saveWindowMonths,
  };
}

/**
 * 8. Evaluates EMI purchase option and debt sustainability.
 *
 * Formulas:
 * - newDTI = (existingEMIs + newEMI) / income (<= 40% healthy, 40-50% risky, > 50% unsafe)
 * - surplusAfterEMI = monthlySurplus - newEMI
 * - minimumIncomeRequired = max of:
 *   (a) (existingEMIs + newEMI) / 0.40 (DTI <= 40%)
 *   (b) (fixed + lifestyle + existingEMIs + newEMI) / 0.80 (20% surplus maintained)
 * - downPaymentAffordable = usableSavings >= downPayment + processingFee
 */
export function affordabilityEMI(
  profile: Partial<UserProfile>,
  product: ProductInput,
  emiTerms: EMITerms
): EMIAffordabilityResult {
  const { income, fixed, lifestyle, existingEMIs } = getProfileValues(profile);
  const downPayment = emiTerms.downPayment || 0;
  const processingFee = emiTerms.processingFee || 0;
  const principal = Math.max(0, product.price - downPayment);

  const emiCost = totalCostOfEMI(
    principal,
    emiTerms.annualInterestRate,
    emiTerms.tenureMonths,
    emiTerms.method || 'reducing',
    processingFee,
    downPayment
  );

  const newEMI = emiCost.monthlyEMI;
  const totalEMIs = existingEMIs + newEMI;
  const newDTI = income > 0 ? Math.round((totalEMIs / income) * 1000) / 1000 : 1.0;

  let dtiStatus: 'healthy' | 'risky' | 'unsafe';
  if (newDTI <= FINANCE_CONFIG.DTI_THRESHOLDS.HEALTHY_MAX) {
    dtiStatus = 'healthy';
  } else if (newDTI <= FINANCE_CONFIG.DTI_THRESHOLDS.RISKY_MAX) {
    dtiStatus = 'risky';
  } else {
    dtiStatus = 'unsafe';
  }

  const surplus = monthlySurplus(profile);
  const surplusAfterEMI = surplus - newEMI;

  const ef = emergencyFundTarget(profile);
  const downPaymentAffordable = ef.usableSavings >= downPayment + processingFee;

  // Minimum income required calculation:
  // (a) Income so that totalEMIs / income <= 0.40 (DTI <= 40%)
  const incomeForDTI = totalEMIs / FINANCE_CONFIG.DTI_THRESHOLDS.HEALTHY_MAX;
  // (b) Income so that (income - fixed - lifestyle - totalEMIs) >= 0.20 * income (20% surplus maintained)
  //     => 0.80 * income >= fixed + lifestyle + totalEMIs
  const incomeForSavings = (fixed + lifestyle + totalEMIs) / 0.8;

  const minimumIncomeRequired = Math.ceil(Math.max(incomeForDTI, incomeForSavings));

  return {
    principal,
    newEMI,
    totalEMIs,
    newDTI,
    dtiStatus,
    surplusAfterEMI,
    downPaymentAffordable,
    minimumIncomeRequired,
    emiCost,
  };
}
