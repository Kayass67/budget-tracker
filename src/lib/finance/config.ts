/**
 * Financial Engine Configuration & Thresholds
 * All percentage parameters are in decimals (e.g., 0.50 = 50%) unless noted otherwise.
 */

export interface UserFinanceThresholds {
  maxEmiCapPercent: number; // e.g. 40 (EMI cap %)
  emergencyFundMonthsNoDependents: number; // e.g. 3 (months without dependents)
  emergencyFundMonthsWithDependents: number; // e.g. 6 (months with dependents)
  targetSavingsPercent: number; // e.g. 20 (target savings %)
  expectedAnnualReturnPercent: number; // e.g. 8 (expected annual return %)
}

export const DEFAULT_THRESHOLDS: UserFinanceThresholds = {
  maxEmiCapPercent: 40,
  emergencyFundMonthsNoDependents: 3,
  emergencyFundMonthsWithDependents: 6,
  targetSavingsPercent: 20,
  expectedAnnualReturnPercent: 6,
};

export const FINANCE_CONFIG = {
  // 50/30/20 Budgeting Rule Thresholds
  BUDGET_RULE: {
    MAX_NEEDS_RATIO: 0.5, // Needs (Fixed + EMIs) should be <= 50% of income
    MAX_WANTS_RATIO: 0.3, // Wants (Lifestyle) should be <= 30% of income
    TARGET_SAVINGS_RATIO: 0.2, // Savings/Surplus should be >= 20% of income
  },

  // Debt-to-Income (DTI) Thresholds for total EMIs vs monthly income
  DTI_THRESHOLDS: {
    HEALTHY_MAX: 0.4, // Total EMIs <= 40% is healthy
    RISKY_MAX: 0.5, // Total EMIs 40-50% is risky, > 50% unsafe
  },

  // Emergency Fund Multipliers (Months of non-negotiable living expenses)
  EMERGENCY_FUND: {
    MONTHS_NO_DEPENDENTS: 3, // 3 months if 0 dependents
    MONTHS_WITH_DEPENDENTS: 6, // 6 months if 1+ dependents
  },

  // Recovery Timelines (Months)
  RECOVERY_TIMELINES: {
    HEALTHY_MAX_MONTHS: 6, // Recovery <= 6 months is considered safe
    MODERATE_MAX_MONTHS: 18, // 6 - 18 months requires caution, > 18 months high strain
    DEFAULT_SAVING_TARGETS: [12, 24, 36], // Target recovery horizon options
  },

  // Opportunity Cost Settings
  OPPORTUNITY_COST: {
    DEFAULT_ANNUAL_RETURN: 0.06, // Default 6% per annum nominal return on safe investments
  },

  // Decision & Verdict Scoring Weights & Limits
  VERDICT_THRESHOLDS: {
    PRICE_TO_INCOME_RED_FLAG: 3.0, // Price > 3x monthly income is a red flag for non-appreciating goods
    MAX_SAFE_INTEREST_PREMIUM: 20.0, // EMI interest overhead > 20% is considered excessive
    SCORE_SAFE_MIN: 80, // Score >= 80 -> "Safe to Buy"
    SCORE_CAUTION_MIN: 60, // Score 60-79 -> "Buy With Caution"
    SCORE_WAIT_MIN: 40, // Score 40-59 -> "Wait", < 40 -> "Avoid"
  },
};

/**
 * Updates runtime thresholds from user preferences
 */
export function updateFinanceConfig(thresholds: Partial<UserFinanceThresholds>) {
  if (typeof thresholds.maxEmiCapPercent === 'number' && !isNaN(thresholds.maxEmiCapPercent)) {
    FINANCE_CONFIG.DTI_THRESHOLDS.HEALTHY_MAX = Math.max(
      0.05,
      Math.min(0.8, thresholds.maxEmiCapPercent / 100)
    );
  }
  if (
    typeof thresholds.emergencyFundMonthsNoDependents === 'number' &&
    !isNaN(thresholds.emergencyFundMonthsNoDependents)
  ) {
    FINANCE_CONFIG.EMERGENCY_FUND.MONTHS_NO_DEPENDENTS = Math.max(
      1,
      Math.min(24, thresholds.emergencyFundMonthsNoDependents)
    );
  }
  if (
    typeof thresholds.emergencyFundMonthsWithDependents === 'number' &&
    !isNaN(thresholds.emergencyFundMonthsWithDependents)
  ) {
    FINANCE_CONFIG.EMERGENCY_FUND.MONTHS_WITH_DEPENDENTS = Math.max(
      1,
      Math.min(36, thresholds.emergencyFundMonthsWithDependents)
    );
  }
  if (
    typeof thresholds.targetSavingsPercent === 'number' &&
    !isNaN(thresholds.targetSavingsPercent)
  ) {
    FINANCE_CONFIG.BUDGET_RULE.TARGET_SAVINGS_RATIO = Math.max(
      0.05,
      Math.min(0.5, thresholds.targetSavingsPercent / 100)
    );
  }
  if (
    typeof thresholds.expectedAnnualReturnPercent === 'number' &&
    !isNaN(thresholds.expectedAnnualReturnPercent)
  ) {
    FINANCE_CONFIG.OPPORTUNITY_COST.DEFAULT_ANNUAL_RETURN = Math.max(
      0,
      Math.min(0.3, thresholds.expectedAnnualReturnPercent / 100)
    );
  }
}

/**
 * Resets runtime thresholds to defaults
 */
export function resetFinanceConfig() {
  updateFinanceConfig(DEFAULT_THRESHOLDS);
}
