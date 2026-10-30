import { AmortizationEntry } from '@/types';

/**
 * Calculates monthly Equated Monthly Installment (EMI).
 *
 * Formulas:
 * 1. Reducing Balance (Standard banking formula):
 *    EMI = P * r * (1 + r)^n / ((1 + r)^n - 1)
 *    where P = principal, r = annualRate / 12 / 100, n = months.
 *    If annualRate == 0, EMI = P / n.
 *
 * 2. Flat Rate Interest:
 *    Total Interest = P * (annualRate / 100) * (n / 12)
 *    Total Repayment = P + Total Interest
 *    EMI = Total Repayment / n
 */
export function calcEMI(
  principal: number,
  annualRate: number,
  months: number,
  method: 'reducing' | 'flat' = 'reducing'
): number {
  if (principal <= 0 || months <= 0) {
    return 0;
  }

  if (annualRate <= 0) {
    return Math.round((principal / months) * 100) / 100;
  }

  if (method === 'flat') {
    const totalInterest = principal * (annualRate / 100) * (months / 12);
    const totalPayment = principal + totalInterest;
    return Math.round((totalPayment / months) * 100) / 100;
  }

  // Reducing balance method
  const monthlyRate = annualRate / 12 / 100;
  const growthFactor = Math.pow(1 + monthlyRate, months);
  const emi = (principal * monthlyRate * growthFactor) / (growthFactor - 1);

  return Math.round(emi * 100) / 100;
}

/**
 * Generates month-by-month loan repayment schedule.
 * Returns principal portion, interest portion, and declining balance for each month.
 */
export function amortizationSchedule(
  principal: number,
  annualRate: number,
  months: number,
  method: 'reducing' | 'flat' = 'reducing'
): AmortizationEntry[] {
  if (principal <= 0 || months <= 0) {
    return [];
  }

  const emi = calcEMI(principal, annualRate, months, method);
  const schedule: AmortizationEntry[] = [];
  let remainingBalance = principal;

  if (method === 'flat') {
    const totalInterest = principal * (annualRate / 100) * (months / 12);
    const monthlyInterest = Math.round((totalInterest / months) * 100) / 100;
    const monthlyPrincipal = Math.round((principal / months) * 100) / 100;

    for (let month = 1; month <= months; month++) {
      const isLastMonth = month === months;
      const principalPart = isLastMonth ? remainingBalance : monthlyPrincipal;
      remainingBalance = isLastMonth ? 0 : Math.max(0, remainingBalance - principalPart);

      schedule.push({
        month,
        emi: Math.round((principalPart + monthlyInterest) * 100) / 100,
        principalPart: Math.round(principalPart * 100) / 100,
        interestPart: monthlyInterest,
        balance: Math.round(remainingBalance * 100) / 100,
      });
    }

    return schedule;
  }

  // Reducing balance amortization
  const monthlyRate = annualRate / 12 / 100;

  for (let month = 1; month <= months; month++) {
    const interestPart = Math.round(remainingBalance * monthlyRate * 100) / 100;
    let principalPart = Math.round((emi - interestPart) * 100) / 100;

    const isLastMonth = month === months;
    if (isLastMonth || principalPart > remainingBalance) {
      principalPart = remainingBalance;
      remainingBalance = 0;
    } else {
      remainingBalance = Math.round((remainingBalance - principalPart) * 100) / 100;
    }

    const currentEmi = Math.round((principalPart + interestPart) * 100) / 100;

    schedule.push({
      month,
      emi: currentEmi,
      principalPart,
      interestPart,
      balance: remainingBalance,
    });
  }

  return schedule;
}

export interface TotalCostEMIResult {
  monthlyEMI: number;
  totalPaidInEMIs: number;
  totalInterest: number;
  totalCost: number;
  interestPremiumPercent: number;
}

/**
 * Calculates total financial out-of-pocket costs associated with taking an EMI.
 *
 * Formulas:
 * totalPaidInEMIs = sum of all monthly installments
 * totalInterest = totalPaidInEMIs - principal
 * totalCost = downPayment + processingFee + totalPaidInEMIs
 * interestPremiumPercent = (totalInterest / principal) * 100
 */
export function totalCostOfEMI(
  principal: number,
  annualRate: number,
  months: number,
  method: 'reducing' | 'flat' = 'reducing',
  processingFee: number = 0,
  downPayment: number = 0
): TotalCostEMIResult {
  if (principal <= 0 || months <= 0) {
    const totalCost = Math.round((downPayment + processingFee) * 100) / 100;
    return {
      monthlyEMI: 0,
      totalPaidInEMIs: 0,
      totalInterest: 0,
      totalCost,
      interestPremiumPercent: 0,
    };
  }

  const monthlyEMI = calcEMI(principal, annualRate, months, method);
  const schedule = amortizationSchedule(principal, annualRate, months, method);

  const totalPaidInEMIs = schedule.reduce((sum, item) => sum + item.emi, 0);
  const totalInterest = Math.max(0, totalPaidInEMIs - principal);
  const totalCost = downPayment + processingFee + totalPaidInEMIs;
  const interestPremiumPercent = principal > 0 ? (totalInterest / principal) * 100 : 0;

  return {
    monthlyEMI,
    totalPaidInEMIs: Math.round(totalPaidInEMIs * 100) / 100,
    totalInterest: Math.round(totalInterest * 100) / 100,
    totalCost: Math.round(totalCost * 100) / 100,
    interestPremiumPercent: Math.round(interestPremiumPercent * 100) / 100,
  };
}
