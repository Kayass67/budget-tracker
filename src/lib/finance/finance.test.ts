import { describe, it, expect } from 'vitest';
import {
  calcEMI,
  amortizationSchedule,
  totalCostOfEMI,
  monthlySurplus,
  budgetHealth,
  emergencyFundTarget,
  affordabilityCash,
  affordabilityEMI,
  recoveryTime,
  verdictScore,
  compareOptions,
  projectSavings,
  projectAllSavingsOptions,
  FINANCE_CONFIG,
  // Backward-compatibility functions
  calculateDiscretionaryIncome,
  calculateEmergencyFundRequired,
  calculateRecoveryTime,
  calculateEmi,
  evaluateCashAffordability,
} from './index';
import { UserProfile, ProductInput, EMITerms } from '@/types';

describe('Finance Engine - Pure Calculations Suite', () => {
  // Common Nepali realistic test profile
  const baseNepaliProfile: UserProfile = {
    monthlyIncome: 80000, // 80,000 NPR / month
    monthlyFixedExpenses: 30000, // Rent, groceries, bills: 30,000 NPR
    monthlyLifestyleExpenses: 15000, // Dining, recreation: 15,000 NPR
    existingMonthlyEMIs: 5000, // Smartphone or two-wheeler EMI: 5,000 NPR
    currentSavings: 250000, // 250,000 NPR liquid savings
    emergencyFundCurrent: 120000, // 120,000 NPR reserved
    dependents: 1, // 1 child (requires 6-month buffer)
    currency: 'NPR',
    calendar: 'AD',
  };

  const sampleLaptop: ProductInput = {
    name: 'MacBook Air M3',
    category: 'Electronics',
    price: 150000, // 150,000 NPR
    expectedUsefulLifeYears: 5,
  };

  const sampleEmiTerms: EMITerms = {
    downPayment: 30000, // 30,000 NPR down payment
    annualInterestRate: 12, // 12% per year
    tenureMonths: 12, // 12 months tenure
    processingFee: 1500, // 1,500 NPR processing fee
    method: 'reducing',
  };

  // --------------------------------------------------------------------------
  // 1. calcEMI
  // --------------------------------------------------------------------------
  describe('1. calcEMI()', () => {
    it('calculates 0% promotional EMI accurately', () => {
      // 120,000 NPR over 12 months at 0% = 10,000 NPR / month
      const emi = calcEMI(120000, 0, 12, 'reducing');
      expect(emi).toBe(10000);
    });

    it('calculates reducing-balance EMI on 120,000 NPR at 12% for 12 months', () => {
      // Formula: P * r * (1+r)^n / ((1+r)^n - 1)
      // r = 0.01, (1.01)^12 = 1.126825, EMI approx 10,661.85 NPR
      const emi = calcEMI(120000, 12, 12, 'reducing');
      expect(emi).toBeGreaterThan(10650);
      expect(emi).toBeLessThan(10670);
      expect(emi).toBe(10661.85);
    });

    it('calculates flat-rate interest EMI correctly', () => {
      // Flat rate on 120,000 NPR at 12% for 12 months:
      // Total Interest = 120,000 * 0.12 * 1 = 14,400 NPR
      // Total Payment = 134,400 NPR -> EMI = 11,200 NPR / month
      const emi = calcEMI(120000, 12, 12, 'flat');
      expect(emi).toBe(11200);
    });

    it('handles zero or negative loan amount safely', () => {
      expect(calcEMI(0, 12, 12)).toBe(0);
      expect(calcEMI(-5000, 12, 12)).toBe(0);
      expect(calcEMI(10000, 12, 0)).toBe(0);
    });
  });

  // --------------------------------------------------------------------------
  // 2. amortizationSchedule
  // --------------------------------------------------------------------------
  describe('2. amortizationSchedule()', () => {
    it('produces a full 12-month schedule reducing balance to zero', () => {
      const schedule = amortizationSchedule(120000, 12, 12, 'reducing');
      expect(schedule).toHaveLength(12);

      // First month interest = 120,000 * 0.01 = 1,200 NPR
      expect(schedule[0].interestPart).toBe(1200);

      // Final month balance must reach 0
      expect(schedule[11].balance).toBe(0);

      // Total principal repaid must equal exactly 120,000 NPR
      const totalPrincipalRepaid = schedule.reduce((sum, item) => sum + item.principalPart, 0);
      expect(Math.round(totalPrincipalRepaid)).toBe(120000);
    });

    it('generates accurate flat-rate amortization with equal monthly interest', () => {
      const schedule = amortizationSchedule(60000, 10, 6, 'flat');
      expect(schedule).toHaveLength(6);
      schedule.forEach((entry) => {
        expect(entry.principalPart).toBe(10000);
        expect(entry.interestPart).toBe(500); // (60000 * 0.10 * 0.5) / 6 = 500
      });
      expect(schedule[5].balance).toBe(0);
    });
  });

  // --------------------------------------------------------------------------
  // 3. totalCostOfEMI
  // --------------------------------------------------------------------------
  describe('3. totalCostOfEMI()', () => {
    it('calculates total cost, total interest, and financing premium percentage', () => {
      const principal = 120000;
      const downPayment = 30000;
      const processingFee = 1500;
      const cost = totalCostOfEMI(principal, 12, 12, 'reducing', processingFee, downPayment);

      expect(cost.monthlyEMI).toBe(10661.85);
      expect(cost.totalInterest).toBeCloseTo(7942.2, 0);
      expect(cost.totalCost).toBeCloseTo(30000 + 1500 + 127942.2, 0);
      expect(cost.interestPremiumPercent).toBeCloseTo(6.62, 1);
    });
  });

  // --------------------------------------------------------------------------
  // 4. monthlySurplus
  // --------------------------------------------------------------------------
  describe('4. monthlySurplus()', () => {
    it('calculates net monthly disposable surplus (income - fixed - lifestyle - EMIs)', () => {
      // 80,000 - 30,000 - 15,000 - 5,000 = 30,000 NPR
      const surplus = monthlySurplus(baseNepaliProfile);
      expect(surplus).toBe(30000);
    });

    it('identifies budget deficit when expenses exceed income', () => {
      const deficitProfile: UserProfile = {
        ...baseNepaliProfile,
        monthlyIncome: 45000,
        monthlyFixedExpenses: 30000,
        monthlyLifestyleExpenses: 15000,
        existingMonthlyEMIs: 5000,
      };
      expect(monthlySurplus(deficitProfile)).toBe(-5000);
    });
  });

  // --------------------------------------------------------------------------
  // 5. budgetHealth (50/30/20 Rule)
  // --------------------------------------------------------------------------
  describe('5. budgetHealth()', () => {
    it('grades a well-balanced 50/30/20 budget as healthy', () => {
      // Needs: 35,000 / 80,000 = 43.75% (<= 50%)
      // Wants: 15,000 / 80,000 = 18.75% (<= 30%)
      // Savings: 30,000 / 80,000 = 37.5% (>= 20%)
      const health = budgetHealth(baseNepaliProfile);
      expect(health.meetsNeedsRule).toBe(true);
      expect(health.meetsWantsRule).toBe(true);
      expect(health.meetsSavingsRule).toBe(true);
      expect(health.healthScore).toBe(100);
    });

    it('detects violations when needs exceed 50% or savings are under 20%', () => {
      const strainedProfile: UserProfile = {
        ...baseNepaliProfile,
        monthlyIncome: 60000,
        monthlyFixedExpenses: 35000,
        existingMonthlyEMIs: 5000, // Total needs: 40k / 60k = 66.7% (> 50%)
        monthlyLifestyleExpenses: 15000, // Total wants: 15k / 60k = 25% (<= 30%)
      };
      const health = budgetHealth(strainedProfile);
      expect(health.meetsNeedsRule).toBe(false);
      expect(health.meetsSavingsRule).toBe(false);
      expect(health.healthScore).toBeLessThan(75);
    });
  });

  // --------------------------------------------------------------------------
  // 6. emergencyFundTarget
  // --------------------------------------------------------------------------
  describe('6. emergencyFundTarget()', () => {
    it('sets 6-month target when user has dependents', () => {
      // Monthly commitments: 30,000 + 5,000 = 35,000 NPR
      // 6 months target = 210,000 NPR
      const ef = emergencyFundTarget(baseNepaliProfile);
      expect(ef.targetMonths).toBe(6);
      expect(ef.monthlyCommitments).toBe(35000);
      expect(ef.targetAmount).toBe(210000);
      expect(ef.gap).toBe(90000); // 210,000 - 120,000
      expect(ef.isFullyFunded).toBe(false);
      // Usable savings above emergency target: 250,000 - 210,000 = 40,000 NPR
      expect(ef.usableSavings).toBe(40000);
    });

    it('sets 3-month target when user has zero dependents', () => {
      const singleProfile: UserProfile = {
        ...baseNepaliProfile,
        dependents: 0,
      };
      // 3 * 35,000 = 105,000 NPR
      const ef = emergencyFundTarget(singleProfile);
      expect(ef.targetMonths).toBe(3);
      expect(ef.targetAmount).toBe(105000);
      expect(ef.isFullyFunded).toBe(true); // 120,000 >= 105,000
    });
  });

  // --------------------------------------------------------------------------
  // 7. affordabilityCash
  // --------------------------------------------------------------------------
  describe('7. affordabilityCash()', () => {
    it('returns canPayNow: false when price exceeds usable savings cushion', () => {
      // Price = 150,000 NPR, Usable savings = 40,000 NPR
      const cash = affordabilityCash(baseNepaliProfile, sampleLaptop);
      expect(cash.canPayNow).toBe(false);
      expect(cash.usableSavings).toBe(40000);
      // Remaining needed = 150,000 - 40,000 = 110,000 NPR. Monthly surplus = 30,000 NPR
      // ceil(110,000 / 30,000) = 4 months
      expect(cash.monthsToSaveUp).toBe(4);
    });

    it('returns canPayNow: true when user has savings well above emergency buffer', () => {
      const wealthyProfile: UserProfile = {
        ...baseNepaliProfile,
        currentSavings: 500000, // 500,000 - 210,000 = 290,000 usable
      };
      const cash = affordabilityCash(wealthyProfile, sampleLaptop);
      expect(cash.canPayNow).toBe(true);
      expect(cash.monthsToSaveUp).toBe(0);
      expect(cash.emergencyFundIntact).toBe(true);
    });

    it('computes minimum income required to save up within 6 months', () => {
      // Laptop: 150,000 NPR over 6 months = 25,000 NPR / month
      // Needs: 35,000 NPR, Lifestyle: 15,000 NPR
      // 0.80 * Income = 35,000 + 15,000 + 25,000 = 75,000
      // Income = 75,000 / 0.80 = 93,750 NPR
      const cash = affordabilityCash(baseNepaliProfile, sampleLaptop, 6);
      expect(cash.minimumIncomeRequired).toBe(93750);
    });
  });

  // --------------------------------------------------------------------------
  // 8. affordabilityEMI
  // --------------------------------------------------------------------------
  describe('8. affordabilityEMI()', () => {
    it('evaluates healthy EMI with DTI <= 40%', () => {
      // Existing EMI = 5,000 NPR. New EMI = 10,661.85 NPR
      // Total EMIs = 15,661.85 NPR
      // DTI = 15,661.85 / 80,000 = 19.6% (<= 40%) -> healthy
      const emi = affordabilityEMI(baseNepaliProfile, sampleLaptop, sampleEmiTerms);
      expect(emi.newEMI).toBe(10661.85);
      expect(emi.totalEMIs).toBe(15661.85);
      expect(emi.dtiStatus).toBe('healthy');
      expect(emi.newDTI).toBeCloseTo(0.196, 2);
      expect(emi.surplusAfterEMI).toBeCloseTo(30000 - 10661.85, 1);
    });

    it('flags risky or unsafe DTI when total EMIs exceed thresholds', () => {
      const lowIncomeProfile: UserProfile = {
        ...baseNepaliProfile,
        monthlyIncome: 30000,
      };
      // Total EMIs = 15,661.85 / 30,000 = 52.2% (> 50%) -> unsafe
      const emi = affordabilityEMI(lowIncomeProfile, sampleLaptop, sampleEmiTerms);
      expect(emi.dtiStatus).toBe('unsafe');
      expect(emi.newDTI).toBeGreaterThan(0.5);
    });

    it('checks down payment affordability against usable savings', () => {
      // Down payment = 30,000 + 1,500 = 31,500 NPR. Usable savings = 40,000 NPR
      const emi = affordabilityEMI(baseNepaliProfile, sampleLaptop, sampleEmiTerms);
      expect(emi.downPaymentAffordable).toBe(true);
    });
  });

  // --------------------------------------------------------------------------
  // 9. recoveryTime
  // --------------------------------------------------------------------------
  describe('9. recoveryTime()', () => {
    it('calculates cash recovery timeline based on monthly surplus', () => {
      // 150,000 NPR outflow / 30,000 NPR surplus = 5 months
      const recovery = recoveryTime(baseNepaliProfile, sampleLaptop, 'cash');
      expect(recovery.monthsToRecover).toBe(5);
      expect(recovery.daysToRecover).toBe(Math.round(5 * 30.4));
    });

    it('calculates EMI recovery timeline accounting for reduced surplus during loan tenure', () => {
      // Outflow = 159,442.2 NPR. Monthly surplus during loan = 30,000 - 10,661.85 = 19,338.15 NPR
      // 159,442.2 / 19,338.15 = 8.24 -> month 9
      const recovery = recoveryTime(baseNepaliProfile, sampleLaptop, 'emi', sampleEmiTerms);
      expect(recovery.monthsToRecover).toBe(9);
    });

    it('returns monthly saving needed for 12, 24, 36 months horizon', () => {
      const recovery = recoveryTime(baseNepaliProfile, sampleLaptop, 'cash');
      expect(recovery.monthlySavingNeeded[12]).toBe(Math.ceil(150000 / 12)); // 12,500
      expect(recovery.monthlySavingNeeded[24]).toBe(Math.ceil(150000 / 24)); // 6,250
      expect(recovery.monthlySavingNeeded[36]).toBe(Math.ceil(150000 / 36)); // 4,167
    });

    it('calculates compound opportunity cost at 6% annual return', () => {
      // 150,000 invested at 6% for 5 months
      const recovery = recoveryTime(baseNepaliProfile, sampleLaptop, 'cash');
      expect(recovery.opportunityCost.annualRatePercent).toBe(6);
      expect(recovery.opportunityCost.growthAmount).toBeGreaterThan(3000);
      expect(recovery.opportunityCost.futureValue).toBeGreaterThan(153000);
    });
  });

  // --------------------------------------------------------------------------
  // 10. verdictScore
  // --------------------------------------------------------------------------
  describe('10. verdictScore()', () => {
    it('awards high score for safe affordable purchase', () => {
      const wealthyProfile: UserProfile = {
        ...baseNepaliProfile,
        currentSavings: 600000,
      };
      const verdict = verdictScore(wealthyProfile, sampleLaptop, 'cash');
      expect(verdict.score).toBeGreaterThanOrEqual(80);
      expect(verdict.label).toBe('Safe to Buy');
      expect(verdict.reasons.some((r) => r.status === 'pass')).toBe(true);
    });

    it('raises a red flag when product price exceeds 3x monthly income', () => {
      const expensiveBike: ProductInput = {
        name: 'Royal Enfield Classic 350',
        category: 'Vehicle',
        price: 350000, // 350,000 > 3 * 80,000 (240,000 NPR)
      };
      const verdict = verdictScore(baseNepaliProfile, expensiveBike, 'cash');
      const redFlagReason = verdict.reasons.find((r) => r.factor === 'Price vs Income');
      expect(redFlagReason?.status).toBe('fail');
      expect(redFlagReason?.message).toContain('exceeds 3x your monthly earnings');
    });

    it('warns or fails when EMI interest premium exceeds 20%', () => {
      const longHighInterestTerms: EMITerms = {
        downPayment: 10000,
        annualInterestRate: 24, // 24% high interest
        tenureMonths: 24, // 2 years
        processingFee: 3000,
        method: 'flat',
      };
      const verdict = verdictScore(baseNepaliProfile, sampleLaptop, 'emi', longHighInterestTerms);
      const interestReason = verdict.reasons.find((r) => r.factor === 'Interest Overhead');
      expect(interestReason?.status).toBe('fail');
      expect(interestReason?.message).toContain('High interest premium');
    });
  });

  // --------------------------------------------------------------------------
  // 11. compareOptions
  // --------------------------------------------------------------------------
  describe('11. compareOptions()', () => {
    it('compares cash vs EMI side-by-side with extra costs and clear recommendation', () => {
      const comparison = compareOptions(baseNepaliProfile, sampleLaptop, sampleEmiTerms);
      expect(comparison.cheaperOption).toBe('cash');
      expect(comparison.extraCostOfEMI).toBeGreaterThan(7000);
      expect(comparison.extraCostPercent).toBeGreaterThan(4);
      expect(comparison.recommendation).toBeTruthy();
    });
  });

  // --------------------------------------------------------------------------
  // 12. Config Thresholds Check
  // --------------------------------------------------------------------------
  describe('12. Config & Threshold Constants', () => {
    it('maintains expected threshold defaults in FINANCE_CONFIG', () => {
      expect(FINANCE_CONFIG.BUDGET_RULE.MAX_NEEDS_RATIO).toBe(0.5);
      expect(FINANCE_CONFIG.BUDGET_RULE.MAX_WANTS_RATIO).toBe(0.3);
      expect(FINANCE_CONFIG.BUDGET_RULE.TARGET_SAVINGS_RATIO).toBe(0.2);
      expect(FINANCE_CONFIG.DTI_THRESHOLDS.HEALTHY_MAX).toBe(0.4);
      expect(FINANCE_CONFIG.EMERGENCY_FUND.MONTHS_WITH_DEPENDENTS).toBe(6);
    });
  });

  // --------------------------------------------------------------------------
  // 13. Backward-Compatibility Suite
  // --------------------------------------------------------------------------
  describe('13. Backward Compatibility Functions', () => {
    it('supports calculateDiscretionaryIncome', () => {
      expect(calculateDiscretionaryIncome(5000, 2000, 1000)).toBe(2000);
    });

    it('supports calculateEmergencyFundRequired', () => {
      expect(calculateEmergencyFundRequired(1500, 6)).toBe(9000);
    });

    it('supports calculateRecoveryTime', () => {
      const rec = calculateRecoveryTime(2400, 1200);
      expect(rec.months).toBe(2);
      expect(rec.days).toBe(61);
    });

    it('supports calculateEmi', () => {
      const emi = calculateEmi(1200, 0, 12);
      expect(emi.monthlyEmi).toBe(100);
    });

    it('supports evaluateCashAffordability legacy adapter', () => {
      const res = evaluateCashAffordability({
        productPrice: 1000,
        monthlyIncome: 4000,
        fixedExpenses: 1500,
        variableExpenses: 500,
        currentSavings: 10000,
        emergencyFundMonths: 3,
      });
      expect(res.verdict).toBe('AFFORDABLE');
    });
  });

  describe('12. Savings Trajectory Projection (projectSavings)', () => {
    const profile: UserProfile = {
      monthlyIncome: 80000,
      monthlyFixedExpenses: 35000,
      monthlyLifestyleExpenses: 15000,
      existingMonthlyEMIs: 0,
      currentSavings: 200000,
      emergencyFundCurrent: 105000,
      dependents: 0,
      currency: 'NPR',
      calendar: 'AD',
    };

    const product: ProductInput = {
      name: 'MacBook',
      category: 'Electronics',
      price: 150000,
      expectedUsefulLifeYears: 4,
    };

    const emiTerms: EMITerms = {
      downPayment: 30000,
      annualInterestRate: 12,
      tenureMonths: 12,
      processingFee: 1500,
      method: 'reducing',
    };

    it('projects "do_nothing" savings growing steadily by base surplus', () => {
      // base surplus = 80000 - 35000 - 15000 = 30000 / month
      const res = projectSavings(profile, product, 'do_nothing', 12);
      expect(res.option).toBe('do_nothing');
      expect(res.startingSavings).toBe(200000);
      expect(res.recoveryMonth).toBe(0);
      expect(res.points).toHaveLength(13); // months 0 to 12
      expect(res.points[0].savings).toBe(200000);
      expect(res.points[1].savings).toBe(230000);
      expect(res.points[12].savings).toBe(200000 + 12 * 30000); // 560,000
    });

    it('projects "cash" option dipping by price at M0 and recovering over time', () => {
      const res = projectSavings(profile, product, 'cash', 12);
      expect(res.option).toBe('cash');
      expect(res.points[0].savings).toBe(50000); // 200,000 - 150,000
      expect(res.points[0].isRecovered).toBe(false);

      // Month 1: 50,000 + 30,000 = 80,000
      expect(res.points[1].savings).toBe(80000);
      // Recovers 150,000 / 30,000 = 5 months
      expect(res.recoveryMonth).toBe(5);
      expect(res.points[5].savings).toBe(200000);
      expect(res.points[5].isRecovered).toBe(true);
    });

    it('projects "emi" option dipping by downpayment+fee and recovering through tenure', () => {
      const res = projectSavings(profile, product, 'emi', 24, emiTerms);
      expect(res.option).toBe('emi');
      // Month 0: 200,000 - (30,000 + 1,500) = 168,500
      expect(res.points[0].savings).toBe(168500);
      expect(res.recoveryMonth).toBeGreaterThan(0);
      expect(res.points.length).toBe(25);
    });

    it('handles zero or negative surplus without NaN or Infinity', () => {
      const brokeProfile: UserProfile = {
        ...profile,
        monthlyIncome: 40000, // surplus = 40000 - 35000 - 15000 = -10000
      };
      const res = projectSavings(brokeProfile, product, 'cash', 12);
      expect(res.recoveryMonth).toBeNull();
      res.points.forEach((p) => {
        expect(Number.isFinite(p.savings)).toBe(true);
        expect(Number.isNaN(p.savings)).toBe(false);
      });
    });

    it('projectAllSavingsOptions generates multi-series points for Recharts', () => {
      const multi = projectAllSavingsOptions(profile, product, emiTerms, 12);
      expect(multi.points).toHaveLength(13);
      expect(multi.recoveryMonths.doNothing).toBe(0);
      expect(multi.recoveryMonths.cash).toBe(5);
      expect(multi.startingSavings).toBe(200000);
      expect(multi.points[0]).toEqual({
        month: 0,
        label: 'M0',
        doNothing: 200000,
        cash: 50000,
        emi: 168500,
      });
    });
  });
});
