import {
  UserProfile,
  ProductInput,
  EMITerms,
  VerdictLabel,
  VerdictReason,
  VerdictScoreResult,
} from '@/types';
import { FINANCE_CONFIG } from './config';
import {
  monthlySurplus,
  affordabilityCash,
  affordabilityEMI,
  emergencyFundTarget,
  getProfileValues,
  CashAffordabilityResult,
  EMIAffordabilityResult,
} from './affordability';
import { recoveryTime, RecoveryTimeResult } from './recovery';

export interface CompareOptionsResult {
  cheaperOption: 'cash' | 'emi';
  extraCostOfEMI: number;
  extraCostPercent: number;
  lowerStrainOption: 'cash' | 'emi';
  cashAnalysis: {
    affordability: CashAffordabilityResult;
    recovery: RecoveryTimeResult;
    verdict: VerdictScoreResult;
  };
  emiAnalysis: {
    affordability: EMIAffordabilityResult;
    recovery: RecoveryTimeResult;
    verdict: VerdictScoreResult;
  };
  recommendation: string;
}

/**
 * 10. Computes a composite 0-100 verdict score, category label, and factor-by-factor breakdown.
 *
 * Evaluated Factors:
 * 1. Emergency fund intact (max 20 pts)
 * 2. EMI / Debt-to-Income ratio (max 20 pts)
 * 3. Savings rate after purchase (max 20 pts)
 * 4. Months to recover (max 20 pts)
 * 5. Price vs monthly income (max 10 pts; red flag if > 3x income)
 * 6. Interest premium (max 10 pts; penalty if > 20%)
 */
export function verdictScore(
  profile: Partial<UserProfile>,
  product: ProductInput,
  option: 'cash' | 'emi',
  emiTerms?: EMITerms
): VerdictScoreResult {
  const { income, currentSavings } = getProfileValues(profile);
  const ef = emergencyFundTarget(profile);
  const reasons: VerdictReason[] = [];
  let score = 0;

  const cashAff = affordabilityCash(profile, product);
  const terms: EMITerms = emiTerms || {
    downPayment: 0,
    annualInterestRate: 12,
    tenureMonths: 12,
    processingFee: 0,
    method: 'reducing',
  };
  const emiAff = affordabilityEMI(profile, product, terms);
  const recovery = recoveryTime(profile, product, option, terms);

  // 1. Emergency Fund Factor (20 Points)
  if (option === 'cash') {
    if (cashAff.emergencyFundIntact) {
      score += 20;
      reasons.push({
        factor: 'Emergency Cushion',
        status: 'pass',
        message: 'Your emergency safety net remains 100% protected after paying in full.',
      });
    } else if (cashAff.savingsAfterPurchase >= 0) {
      score += 10;
      reasons.push({
        factor: 'Emergency Cushion',
        status: 'warn',
        message: `Paying in cash will cut into your ${ef.targetMonths}-month emergency reserve buffer.`,
      });
    } else {
      score += 0;
      reasons.push({
        factor: 'Emergency Cushion',
        status: 'fail',
        message:
          'Insufficient liquid savings. Purchasing with full cash will completely deplete your funds.',
      });
    }
  } else {
    // EMI option down payment check
    const requiredDown = terms.downPayment + (terms.processingFee || 0);
    if (requiredDown <= ef.usableSavings) {
      score += 20;
      reasons.push({
        factor: 'Down Payment Liquidity',
        status: 'pass',
        message: 'Down payment and upfront fees are easily covered from surplus savings.',
      });
    } else if (requiredDown <= currentSavings) {
      score += 10;
      reasons.push({
        factor: 'Down Payment Liquidity',
        status: 'warn',
        message: 'Upfront down payment requires tapping slightly into emergency savings.',
      });
    } else {
      score += 0;
      reasons.push({
        factor: 'Down Payment Liquidity',
        status: 'fail',
        message: 'Insufficient savings to cover the initial down payment and fees.',
      });
    }
  }

  // 2. Debt-to-Income / EMI Burden Factor (20 Points)
  if (option === 'cash') {
    score += 20;
    reasons.push({
      factor: 'Debt Burden (DTI)',
      status: 'pass',
      message: 'Zero ongoing monthly debt obligation or interest commitments.',
    });
  } else {
    if (emiAff.dtiStatus === 'healthy') {
      score += 20;
      reasons.push({
        factor: 'Debt Burden (DTI)',
        status: 'pass',
        message: `Total EMI payments take ${(emiAff.newDTI * 100).toFixed(1)}% of your income, comfortably under the 40% ceiling.`,
      });
    } else if (emiAff.dtiStatus === 'risky') {
      score += 10;
      reasons.push({
        factor: 'Debt Burden (DTI)',
        status: 'warn',
        message: `Total EMI commitments take ${(emiAff.newDTI * 100).toFixed(1)}% of income (40-50% risky zone).`,
      });
    } else {
      score += 0;
      reasons.push({
        factor: 'Debt Burden (DTI)',
        status: 'fail',
        message: `Unsafe debt load: Total EMIs consume ${(emiAff.newDTI * 100).toFixed(1)}% of monthly income (> 50%).`,
      });
    }
  }

  // 3. Savings Rate After Purchase (20 Points)
  const surplusAfter = option === 'cash' ? monthlySurplus(profile) : emiAff.surplusAfterEMI;
  const savingsRateAfter = income > 0 ? surplusAfter / income : 0;

  if (savingsRateAfter >= FINANCE_CONFIG.BUDGET_RULE.TARGET_SAVINGS_RATIO) {
    score += 20;
    reasons.push({
      factor: 'Post-Purchase Cash Flow',
      status: 'pass',
      message: `You will still maintain a strong ${(savingsRateAfter * 100).toFixed(1)}% monthly savings rate.`,
    });
  } else if (savingsRateAfter >= 0.1) {
    score += 10;
    reasons.push({
      factor: 'Post-Purchase Cash Flow',
      status: 'warn',
      message: `Monthly savings margin will compress to ${(savingsRateAfter * 100).toFixed(1)}% of income.`,
    });
  } else if (savingsRateAfter > 0) {
    score += 5;
    reasons.push({
      factor: 'Post-Purchase Cash Flow',
      status: 'warn',
      message: `Very tight breathing room: monthly surplus drops to ${(savingsRateAfter * 100).toFixed(1)}%.`,
    });
  } else {
    score += 0;
    reasons.push({
      factor: 'Post-Purchase Cash Flow',
      status: 'fail',
      message: 'Zero or negative monthly cash flow created by this purchase.',
    });
  }

  // 4. Months to Recover (20 Points)
  if (recovery.monthsToRecover <= FINANCE_CONFIG.RECOVERY_TIMELINES.HEALTHY_MAX_MONTHS) {
    score += 20;
    reasons.push({
      factor: 'Recovery Timeline',
      status: 'pass',
      message: `Quick recovery: fully replenished in approximately ${recovery.monthsToRecover} months.`,
    });
  } else if (recovery.monthsToRecover <= FINANCE_CONFIG.RECOVERY_TIMELINES.MODERATE_MAX_MONTHS) {
    score += 10;
    reasons.push({
      factor: 'Recovery Timeline',
      status: 'warn',
      message: `Moderate recovery period: takes ${recovery.monthsToRecover} months to recoup the expense.`,
    });
  } else {
    score += 0;
    reasons.push({
      factor: 'Recovery Timeline',
      status: 'fail',
      message:
        recovery.monthsToRecover === Infinity
          ? 'Cannot recover: monthly cash flow is insufficient to recoup this purchase.'
          : `Prolonged recovery: requires ${recovery.monthsToRecover} months (> 1.5 years) to recoup.`,
    });
  }

  // 5. Price to Monthly Income Ratio (10 Points)
  // Red flag if price exceeds 3x monthly income for non-appreciating consumer goods
  const priceToIncomeRatio = income > 0 ? product.price / income : 999;
  if (priceToIncomeRatio <= 1.0) {
    score += 10;
    reasons.push({
      factor: 'Price vs Income',
      status: 'pass',
      message: `Cost is modest (${priceToIncomeRatio.toFixed(1)}x monthly income).`,
    });
  } else if (priceToIncomeRatio <= FINANCE_CONFIG.VERDICT_THRESHOLDS.PRICE_TO_INCOME_RED_FLAG) {
    score += 5;
    reasons.push({
      factor: 'Price vs Income',
      status: 'warn',
      message: `Significant purchase amounting to ${priceToIncomeRatio.toFixed(1)}x your monthly income.`,
    });
  } else {
    score += 0;
    reasons.push({
      factor: 'Price vs Income',
      status: 'fail',
      message: `Red flag: Product price (${priceToIncomeRatio.toFixed(1)}x income) exceeds 3x your monthly earnings.`,
    });
  }

  // 6. Interest Premium (10 Points)
  if (option === 'cash') {
    score += 10;
    reasons.push({
      factor: 'Interest Overhead',
      status: 'pass',
      message: 'Zero interest overhead (paying 0 extra above retail price).',
    });
  } else {
    const premiumPercent = emiAff.emiCost.interestPremiumPercent;
    if (premiumPercent <= 10.0) {
      score += 10;
      reasons.push({
        factor: 'Interest Overhead',
        status: 'pass',
        message: `Low borrowing overhead of ${premiumPercent.toFixed(1)}% extra.`,
      });
    } else if (premiumPercent <= FINANCE_CONFIG.VERDICT_THRESHOLDS.MAX_SAFE_INTEREST_PREMIUM) {
      score += 5;
      reasons.push({
        factor: 'Interest Overhead',
        status: 'warn',
        message: `Moderate financing cost: you will pay ${premiumPercent.toFixed(1)}% extra above cash price.`,
      });
    } else {
      score += 0;
      reasons.push({
        factor: 'Interest Overhead',
        status: 'fail',
        message: `High interest premium: paying ${premiumPercent.toFixed(1)}% extra above retail price (> 20% limit).`,
      });
    }
  }

  // Determine Label based on total score
  let label: VerdictLabel;
  if (score >= FINANCE_CONFIG.VERDICT_THRESHOLDS.SCORE_SAFE_MIN) {
    label = 'Safe to Buy';
  } else if (score >= FINANCE_CONFIG.VERDICT_THRESHOLDS.SCORE_CAUTION_MIN) {
    label = 'Buy With Caution';
  } else if (score >= FINANCE_CONFIG.VERDICT_THRESHOLDS.SCORE_WAIT_MIN) {
    label = 'Wait';
  } else {
    label = 'Avoid';
  }

  let summary = '';
  switch (label) {
    case 'Safe to Buy':
      summary =
        'Your finances are well-fortified. This purchase fits comfortably within your safety parameters.';
      break;
    case 'Buy With Caution':
      summary = 'Affordable, but noticeably compresses your safety buffer or monthly savings rate.';
      break;
    case 'Wait':
      summary =
        'Not recommended right now. Give yourself a few more months to build up liquid surplus.';
      break;
    case 'Avoid':
      summary =
        'High financial risk. Proceeding with this purchase could jeopardize your financial resilience.';
      break;
  }

  return {
    score,
    label,
    reasons,
    summary,
  };
}

/**
 * 11. Compares cash payment vs EMI financing side-by-side with trade-offs.
 */
export function compareOptions(
  profile: Partial<UserProfile>,
  product: ProductInput,
  emiTerms: EMITerms
): CompareOptionsResult {
  const cashAff = affordabilityCash(profile, product);
  const cashRec = recoveryTime(profile, product, 'cash');
  const cashVer = verdictScore(profile, product, 'cash');

  const emiAff = affordabilityEMI(profile, product, emiTerms);
  const emiRec = recoveryTime(profile, product, 'emi', emiTerms);
  const emiVer = verdictScore(profile, product, 'emi', emiTerms);

  const extraCostOfEMI = Math.max(0, emiAff.emiCost.totalCost - product.price);
  const extraCostPercent = product.price > 0 ? (extraCostOfEMI / product.price) * 100 : 0;
  const cheaperOption: 'cash' | 'emi' = extraCostOfEMI === 0 ? 'cash' : 'cash';

  // Determine which option produces lower financial strain:
  // If cash leaves emergency fund intact, cash has lower ongoing financial strain.
  // If cash empties emergency fund while EMI preserves emergency cushion and keeps DTI healthy, EMI has lower liquidity strain.
  let lowerStrainOption: 'cash' | 'emi';
  if (
    !cashAff.emergencyFundIntact &&
    emiAff.dtiStatus === 'healthy' &&
    emiAff.downPaymentAffordable
  ) {
    lowerStrainOption = 'emi';
  } else if (cashVer.score >= emiVer.score) {
    lowerStrainOption = 'cash';
  } else {
    lowerStrainOption = 'emi';
  }

  let recommendation: string;
  if (cashAff.canPayNow && cashVer.score >= 80) {
    recommendation = `Pay in Full (Cash). You have ample liquid reserves above your safety net, saving you ${extraCostOfEMI.toLocaleString()} in loan interest and processing fees.`;
  } else if (!cashAff.canPayNow && emiAff.dtiStatus === 'healthy' && emiAff.downPaymentAffordable) {
    recommendation = `Choose EMI. Paying in cash would deplete your emergency fund, whereas EMI keeps your debt-to-income ratio at a manageable ${(emiAff.newDTI * 100).toFixed(1)}%.`;
  } else if (!cashAff.canPayNow && emiAff.dtiStatus !== 'healthy') {
    recommendation = `Wait & Save Up. Neither cash nor EMI is currently safe. Focus on saving for ${cashAff.monthsToSaveUp} months to purchase without financial stress.`;
  } else {
    recommendation = `Cash is cheaper by ${extraCostOfEMI.toLocaleString()}, but evaluate whether keeping liquid cash in hand is worth the ${extraCostPercent.toFixed(1)}% financing surcharge.`;
  }

  return {
    cheaperOption,
    extraCostOfEMI: Math.round(extraCostOfEMI * 100) / 100,
    extraCostPercent: Math.round(extraCostPercent * 10) / 10,
    lowerStrainOption,
    cashAnalysis: {
      affordability: cashAff,
      recovery: cashRec,
      verdict: cashVer,
    },
    emiAnalysis: {
      affordability: emiAff,
      recovery: emiRec,
      verdict: emiVer,
    },
    recommendation,
  };
}
