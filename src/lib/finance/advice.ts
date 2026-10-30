import { UserProfile, ProductInput, EMITerms, VerdictScoreResult } from '@/types';
import { CashAffordabilityResult, EMIAffordabilityResult } from './affordability';
import { RecoveryTimeResult } from './recovery';

interface AdviceParams {
  profile: UserProfile;
  product: ProductInput;
  option: 'cash' | 'emi';
  emiTerms?: EMITerms;
  cashAff: CashAffordabilityResult;
  emiAff: EMIAffordabilityResult;
  recovery: RecoveryTimeResult;
  verdict: VerdictScoreResult;
  formatFn: (amount: number, currency: UserProfile['currency']) => string;
}

/**
 * Generates an articulate, personalized, plain-language financial advisor (CA)
 * breakdown using pure rule-based template logic (zero external AI dependencies).
 */
export function generateCAAdvice(params: AdviceParams): string {
  const { profile, product, option, cashAff, emiAff, recovery, verdict, formatFn } = params;

  const currency = profile.currency;
  const productName = product.name || 'this item';
  const formattedPrice = formatFn(product.price, currency);
  const formattedIncome = formatFn(profile.monthlyIncome, currency);

  // 1. Context Opening
  const sentences: string[] = [];
  sentences.push(
    `At an in-hand monthly income of ${formattedIncome}, purchasing ${productName} for ${formattedPrice} represents a meaningful financial commitment.`
  );

  // 2. Payment Method Analysis
  if (option === 'cash') {
    if (cashAff.canPayNow) {
      sentences.push(
        `Paying in cash is fully viable: you maintain an emergency cushion of ${formatFn(cashAff.emergencyFundTarget, currency)} and avoid all debt obligations or interest penalties.`
      );
    } else if (cashAff.savingsAfterPurchase >= 0) {
      const deficit = cashAff.emergencyFundTarget - cashAff.savingsAfterPurchase;
      sentences.push(
        `While your account has enough cash to complete the transaction, doing so dips into your non-negotiable emergency reserve by ${formatFn(deficit, currency)}, leaving your safety buffer compromised.`
      );
    } else {
      const shortfall = Math.abs(cashAff.savingsAfterPurchase);
      sentences.push(
        `You currently face a shortfall of ${formatFn(shortfall, currency)} in liquid savings to pay for this upfront without incurring unbudgeted debt.`
      );
    }
  } else {
    // EMI Evaluation
    const interest = emiAff.emiCost.totalInterest;
    const premium = emiAff.emiCost.interestPremiumPercent;
    const emiMonthly = formatFn(emiAff.newEMI, currency);
    sentences.push(
      `Opting for EMI requires a monthly installment of ${emiMonthly}, adding ${formatFn(interest, currency)} (${premium.toFixed(1)}% extra) in interest and financing fees.`
    );

    if (emiAff.dtiStatus === 'healthy') {
      sentences.push(
        `Your resulting debt-to-income ratio of ${(emiAff.newDTI * 100).toFixed(1)}% stays within the safe 40% threshold.`
      );
    } else {
      sentences.push(
        `Crucially, your new debt burden will consume ${(emiAff.newDTI * 100).toFixed(1)}% of your monthly earnings, which pushes your budget into the ${emiAff.dtiStatus} risk category.`
      );
    }
  }

  // 3. Recovery & Opportunity Cost
  if (recovery.monthsToRecover !== Infinity && recovery.monthsToRecover > 0) {
    const oppCost = formatFn(recovery.opportunityCost.growthAmount, currency);
    sentences.push(
      `Based on your monthly surplus, it will take roughly ${recovery.monthsToRecover} months to recover your wealth. For context, keeping this capital invested at 6% would have earned approximately ${oppCost} over the same timeframe.`
    );
  } else {
    sentences.push(
      `Because your current expenses equal or exceed your income, there is no surplus cash flow to recover this expenditure.`
    );
  }

  // 4. Recommendation conclusion
  switch (verdict.label) {
    case 'Safe to Buy':
      sentences.push(
        `Chartered Accountant Verdict: **Green light to purchase.** Your balance sheet is sound, and you can proceed without compromising your household financial resilience.`
      );
      break;
    case 'Buy With Caution':
      sentences.push(
        `Chartered Accountant Verdict: **Proceed with caution.** If this product is non-essential, consider building an extra month of cushion or saving up for ${cashAff.monthsToSaveUp || 2} more months.`
      );
      break;
    case 'Wait':
      sentences.push(
        `Chartered Accountant Verdict: **Wait and accumulate.** Postponing this purchase for ${cashAff.monthsToSaveUp !== Infinity ? cashAff.monthsToSaveUp : 6} months while channeling your monthly surplus will allow you to buy it stress-free.`
      );
      break;
    case 'Avoid':
      sentences.push(
        `Chartered Accountant Verdict: **Avoid at this time.** This purchase presents excessive risk of budget deficit or safety net depletion.`
      );
      break;
  }

  return sentences.join(' ');
}
