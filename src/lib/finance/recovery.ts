import { UserProfile, ProductInput, EMITerms } from '@/types';
import { FINANCE_CONFIG } from './config';
import { monthlySurplus } from './affordability';
import { totalCostOfEMI } from './emi';

export interface OpportunityCostResult {
  futureValue: number;
  growthAmount: number;
  annualRatePercent: number;
  horizonMonths: number;
}

export interface RecoveryTimeResult {
  option: 'cash' | 'emi';
  totalOutflow: number;
  monthlySurplusAfterPurchase: number;
  monthsToRecover: number;
  daysToRecover: number;
  monthlySavingNeeded: Record<number, number>;
  opportunityCost: OpportunityCostResult;
}

/**
 * 9. Evaluates financial recovery timeline and opportunity cost.
 *
 * Formulas:
 * - Cash: totalOutflow = price.
 * - EMI: totalOutflow = downPayment + processingFee + totalPaidInEMIs.
 * - monthsToRecover:
 *     For Cash: ceil(totalOutflow / monthlySurplus)
 *     For EMI: models reduced surplus during tenure, returning exact month of net recovery.
 * - monthlySavingNeeded: totalOutflow / targetMonths (e.g. 12, 24, 36 months).
 * - Opportunity Cost: Future Value (FV) = totalOutflow * (1 + annualReturnRate / 12)^months
 */
export function recoveryTime(
  profile: Partial<UserProfile>,
  product: ProductInput,
  option: 'cash' | 'emi',
  emiTerms?: EMITerms,
  targetRecoveryMonths: number[] = [...FINANCE_CONFIG.RECOVERY_TIMELINES.DEFAULT_SAVING_TARGETS],
  annualReturnRate: number = FINANCE_CONFIG.OPPORTUNITY_COST.DEFAULT_ANNUAL_RETURN
): RecoveryTimeResult {
  const baseSurplus = monthlySurplus(profile);

  let totalOutflow: number;
  let monthlySurplusAfterPurchase: number;
  let monthsToRecover: number;

  if (option === 'cash') {
    totalOutflow = product.price;
    monthlySurplusAfterPurchase = baseSurplus;

    if (totalOutflow <= 0) {
      monthsToRecover = 0;
    } else if (baseSurplus <= 0) {
      monthsToRecover = Infinity;
    } else {
      monthsToRecover = Math.ceil(totalOutflow / baseSurplus);
    }
  } else {
    // EMI Option
    const terms = emiTerms || {
      downPayment: 0,
      annualInterestRate: 0,
      tenureMonths: 12,
      processingFee: 0,
      method: 'reducing',
    };

    const downPayment = terms.downPayment || 0;
    const processingFee = terms.processingFee || 0;
    const principal = Math.max(0, product.price - downPayment);

    const cost = totalCostOfEMI(
      principal,
      terms.annualInterestRate,
      terms.tenureMonths,
      terms.method || 'reducing',
      processingFee,
      downPayment
    );

    totalOutflow = cost.totalCost;
    monthlySurplusAfterPurchase = baseSurplus - cost.monthlyEMI;

    if (totalOutflow <= 0) {
      monthsToRecover = 0;
    } else if (baseSurplus <= 0) {
      monthsToRecover = Infinity;
    } else {
      // Step through months to account for reduced surplus during loan tenure
      let accumulated = 0;
      let month = 0;
      const tenure = terms.tenureMonths;
      const maxGuardMonths = 600; // 50 years max limit

      while (accumulated < totalOutflow && month < maxGuardMonths) {
        month++;
        const currentMonthSurplus = month <= tenure ? baseSurplus - cost.monthlyEMI : baseSurplus;

        if (currentMonthSurplus > 0) {
          accumulated += currentMonthSurplus;
        } else if (month > tenure) {
          // If after tenure base surplus is not positive, recovery is impossible
          month = Infinity;
          break;
        }
      }

      monthsToRecover = month >= maxGuardMonths ? Infinity : month;
    }
  }

  // Monthly savings needed for chosen targets (12, 24, 36 months)
  const monthlySavingNeeded: Record<number, number> = {};
  targetRecoveryMonths.forEach((target) => {
    monthlySavingNeeded[target] = target > 0 ? Math.ceil(totalOutflow / target) : totalOutflow;
  });

  // Opportunity Cost computation
  // If monthsToRecover is finite, use it as horizon; otherwise default to 36 months
  const horizonMonths = monthsToRecover !== Infinity && monthsToRecover > 0 ? monthsToRecover : 36;
  const monthlyRate = annualReturnRate / 12;
  const futureValue =
    Math.round(totalOutflow * Math.pow(1 + monthlyRate, horizonMonths) * 100) / 100;
  const growthAmount = Math.round((futureValue - totalOutflow) * 100) / 100;

  const daysToRecover =
    monthsToRecover === Infinity ? Infinity : Math.round(monthsToRecover * 30.4);

  return {
    option,
    totalOutflow,
    monthlySurplusAfterPurchase,
    monthsToRecover,
    daysToRecover,
    monthlySavingNeeded,
    opportunityCost: {
      futureValue,
      growthAmount,
      annualRatePercent: annualReturnRate * 100,
      horizonMonths,
    },
  };
}

export interface SavingsProjectionPoint {
  month: number;
  savings: number;
  isRecovered: boolean;
}

export interface SavingsProjectionResult {
  option: 'cash' | 'emi' | 'do_nothing';
  startingSavings: number;
  recoveryMonth: number | null;
  points: SavingsProjectionPoint[];
  values: number[];
}

export interface MultiLineSavingsPoint {
  month: number;
  label: string;
  doNothing: number;
  cash: number;
  emi: number;
}

export interface MultiOptionSavingsProjection {
  startingSavings: number;
  recoveryMonths: {
    doNothing: number;
    cash: number | null;
    emi: number | null;
  };
  points: MultiLineSavingsPoint[];
}

/**
 * 12. Projects savings trajectory over a specified month horizon (default 36 months).
 * Compares "Do nothing", "Buy in cash", or "Buy on EMI".
 * Guarantees zero NaN or Infinity values.
 */
export function projectSavings(
  profile: Partial<UserProfile>,
  product: ProductInput,
  option: 'cash' | 'emi' | 'do_nothing',
  months: number = 36,
  emiTerms?: EMITerms
): SavingsProjectionResult {
  const startingSavings = Math.max(0, profile.currentSavings || 0);
  const baseSurplus = monthlySurplus(profile);
  const cleanMonths = Math.max(1, Math.min(120, months || 36));

  const points: SavingsProjectionPoint[] = [];
  const values: number[] = [];
  let recoveryMonth: number | null = null;

  if (option === 'do_nothing') {
    recoveryMonth = 0;
    for (let m = 0; m <= cleanMonths; m++) {
      const bal = startingSavings + m * baseSurplus;
      const safeBal = isFinite(bal) && !isNaN(bal) ? Math.round(bal) : startingSavings;
      points.push({ month: m, savings: safeBal, isRecovered: safeBal >= startingSavings });
      values.push(safeBal);
    }
  } else if (option === 'cash') {
    const price = Math.max(0, product.price || 0);
    const initialBal = startingSavings - price;

    for (let m = 0; m <= cleanMonths; m++) {
      const bal = initialBal + m * baseSurplus;
      const safeBal = isFinite(bal) && !isNaN(bal) ? Math.round(bal) : initialBal;
      const isRec = safeBal >= startingSavings;
      if (isRec && recoveryMonth === null) {
        recoveryMonth = m;
      }
      points.push({ month: m, savings: safeBal, isRecovered: isRec });
      values.push(safeBal);
    }
  } else {
    // EMI option
    const terms = emiTerms || {
      downPayment: 0,
      annualInterestRate: 12,
      tenureMonths: 12,
      processingFee: 0,
      method: 'reducing',
    };
    const downPayment = Math.max(0, terms.downPayment || 0);
    const processingFee = Math.max(0, terms.processingFee || 0);
    const principal = Math.max(0, (product.price || 0) - downPayment);
    const cost = totalCostOfEMI(
      principal,
      terms.annualInterestRate,
      terms.tenureMonths,
      terms.method || 'reducing',
      processingFee,
      downPayment
    );

    const upfront = downPayment + processingFee;
    let currentBalance = startingSavings - upfront;

    points.push({
      month: 0,
      savings: Math.round(currentBalance),
      isRecovered: currentBalance >= startingSavings,
    });
    values.push(Math.round(currentBalance));

    if (currentBalance >= startingSavings) {
      recoveryMonth = 0;
    }

    for (let m = 1; m <= cleanMonths; m++) {
      const surplusThisMonth =
        m <= terms.tenureMonths ? baseSurplus - cost.monthlyEMI : baseSurplus;
      currentBalance += surplusThisMonth;
      const safeBal =
        isFinite(currentBalance) && !isNaN(currentBalance)
          ? Math.round(currentBalance)
          : startingSavings;
      const isRec = safeBal >= startingSavings;
      if (isRec && recoveryMonth === null) {
        recoveryMonth = m;
      }
      points.push({ month: m, savings: safeBal, isRecovered: isRec });
      values.push(safeBal);
    }
  }

  return {
    option,
    startingSavings,
    recoveryMonth,
    points,
    values,
  };
}

/**
 * Convenience helper that bundles all 3 options into a single multi-series array for Recharts.
 */
export function projectAllSavingsOptions(
  profile: Partial<UserProfile>,
  product: ProductInput,
  emiTerms?: EMITerms,
  months: number = 36
): MultiOptionSavingsProjection {
  const doNothing = projectSavings(profile, product, 'do_nothing', months);
  const cash = projectSavings(profile, product, 'cash', months);
  const emi = projectSavings(profile, product, 'emi', months, emiTerms);

  const points: MultiLineSavingsPoint[] = [];
  const cleanMonths = Math.max(1, Math.min(120, months || 36));

  for (let m = 0; m <= cleanMonths; m++) {
    points.push({
      month: m,
      label: `M${m}`,
      doNothing: doNothing.points[m]?.savings ?? 0,
      cash: cash.points[m]?.savings ?? 0,
      emi: emi.points[m]?.savings ?? 0,
    });
  }

  return {
    startingSavings: doNothing.startingSavings,
    recoveryMonths: {
      doNothing: 0,
      cash: cash.recoveryMonth,
      emi: emi.recoveryMonth,
    },
    points,
  };
}
