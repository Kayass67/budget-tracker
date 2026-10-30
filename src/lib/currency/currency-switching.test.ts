import { describe, it, expect, beforeEach } from 'vitest';
import { useAppStore } from '@/store';
import { affordabilityEMI, calcEMI } from '@/lib/finance';
import { UserProfile, ProductInput, EMITerms } from '@/types';
import { FALLBACK_RATES } from './index';

describe('Currency Switching & Working Currency System', () => {
  beforeEach(() => {
    // Reset store state before each test
    const store = useAppStore.getState();
    store.setCurrencyDirect('NPR');
    store.updateProfile({
      monthlyIncome: 80000,
      monthlyFixedExpenses: 35000,
      monthlyLifestyleExpenses: 15000,
      existingMonthlyEMIs: 0,
      currentSavings: 200000,
      emergencyFundCurrent: 105000,
      dependents: 0,
    });
    store.updateCurrentProduct({
      name: 'MacBook Air M3',
      category: 'Electronics & Tech',
      price: 150000,
      resaleValueAfterNYears: 50000,
      expectedUsefulLifeYears: 5,
    });
    store.updateCurrentEmiTerms({
      downPayment: 0,
      annualInterestRate: 12,
      tenureMonths: 12,
      processingFee: 0,
      method: 'reducing',
    });
    store.clearAnalysisHistory();
  });

  it('(a) with NPR selected, entering income 80,000 yields displayed income of "रू 80,000" with no conversion', () => {
    const store = useAppStore.getState();
    expect(store.currency).toBe('NPR');
    expect(store.profile.currency).toBe('NPR');
    expect(store.profile.monthlyIncome).toBe(80000);

    // formatValue directly formats without any currency exchange rate multiplier
    const formatted = store.formatValue(store.profile.monthlyIncome, store.profile.currency);
    expect(formatted).toBe('रू 80,000');
  });

  it('(b) switching NPR to USD with "Convert" (Choice A) changes stored values by exchange rate', () => {
    const store = useAppStore.getState();
    expect(store.profile.monthlyIncome).toBe(80000);

    // Request switch to USD
    store.requestCurrencyChange('USD');
    expect(useAppStore.getState().pendingCurrencyChange).toBe('USD');

    // Confirm with convert = true (Choice A)
    store.confirmCurrencyChange(true);

    const updated = useAppStore.getState();
    expect(updated.currency).toBe('USD');
    expect(updated.profile.currency).toBe('USD');

    // 80,000 NPR / 134.5 = 594.7955... -> rounded to 2 decimals = 594.8
    const expectedUsdIncome = Math.round((80000 / FALLBACK_RATES.NPR) * 100) / 100;
    expect(updated.profile.monthlyIncome).toBeCloseTo(expectedUsdIncome, 1);
    expect(updated.profile.monthlyIncome).toBe(594.8);

    // In-progress product inputs should also convert
    // 150,000 NPR / 134.5 = 1,115.2416... -> 1115.24
    const expectedUsdPrice = Math.round((150000 / FALLBACK_RATES.NPR) * 100) / 100;
    expect(updated.currentProduct.price).toBe(expectedUsdPrice);

    // Formatted in USD displays with $ symbol
    const formatted = updated.formatValue(updated.profile.monthlyIncome);
    expect(formatted).toContain('$');
    expect(formatted).toContain('594.80');
  });

  it('(c) switching currency with "Keep the numbers" (Choice B) leaves stored numbers unchanged', () => {
    const store = useAppStore.getState();
    expect(store.profile.monthlyIncome).toBe(80000);
    expect(store.currentProduct.price).toBe(150000);

    // Request switch to USD
    store.requestCurrencyChange('USD');

    // Confirm with convert = false (Choice B)
    store.confirmCurrencyChange(false);

    const updated = useAppStore.getState();
    expect(updated.currency).toBe('USD');
    expect(updated.profile.currency).toBe('USD');

    // Numeric values stay exactly identical
    expect(updated.profile.monthlyIncome).toBe(80000);
    expect(updated.currentProduct.price).toBe(150000);

    // Display updates symbol only without conversion
    const formatted = updated.formatValue(updated.profile.monthlyIncome);
    expect(formatted).toContain('$');
    expect(formatted).toContain('80,000');
  });

  it('(d) a saved analysis made in NPR displays correctly after switching to USD and back to NPR without double conversion', () => {
    const store = useAppStore.getState();

    // Save an analysis while in NPR
    const savedId = store.saveAnalysis({
      currency: 'NPR',
      product: {
        name: 'MacBook Air',
        category: 'Electronics & Tech',
        price: 134500, // 134,500 NPR = 1,000 USD at 134.5 rate
        expectedUsefulLifeYears: 4,
      },
      paymentOption: 'cash',
      verdictScore: 85,
      verdictLabel: 'Safe to Buy',
      monthsToRecover: 3,
      totalCost: 134500,
    });

    const item = useAppStore.getState().analysisHistory.find((h) => h.id === savedId)!;
    expect(item).toBeDefined();
    expect(item.currency).toBe('NPR');

    // 1. In NPR, displays in NPR without conversion
    expect(useAppStore.getState().formatValue(item.product.price, item.currency)).toBe(
      'रू 1,34,500'
    );

    // 2. Switch working currency to USD
    useAppStore.getState().setCurrencyDirect('USD');
    expect(useAppStore.getState().currency).toBe('USD');

    // In USD, converts 134,500 NPR -> 1,000 USD
    const usdFormatted = useAppStore.getState().formatValue(item.product.price, item.currency);
    expect(usdFormatted).toContain('$');
    expect(usdFormatted).toContain('1,000.00');

    // 3. Switch back to NPR
    useAppStore.getState().setCurrencyDirect('NPR');
    expect(useAppStore.getState().currency).toBe('NPR');

    // In NPR, again displays exact original रू 1,34,500 with ZERO double-conversion or rounding drift
    const backToNprFormatted = useAppStore
      .getState()
      .formatValue(item.product.price, item.currency);
    expect(backToNprFormatted).toBe('रू 1,34,500');
  });

  it('(e) reference scenario in NPR: income 80k, fixed 35k, lifestyle 15k, laptop 150k at 12% 12m -> EMI ≈ 13,327, min salary ≈ 79,160', () => {
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
      name: 'Laptop',
      category: 'Electronics & Tech',
      price: 150000,
      expectedUsefulLifeYears: 5,
    };

    const emiTerms: EMITerms = {
      downPayment: 0,
      annualInterestRate: 12,
      tenureMonths: 12,
      processingFee: 0,
      method: 'reducing',
    };

    // 1. Verify EMI calculation in NPR
    const emi = calcEMI(150000, 12, 12, 'reducing');
    expect(Math.round(emi)).toBe(13327);

    // 2. Verify affordability calculation in NPR
    const emiResult = affordabilityEMI(profile, product, emiTerms);

    expect(Math.round(emiResult.newEMI)).toBe(13327);
    expect(emiResult.minimumIncomeRequired).toBe(79160);

    // 3. Verify store formatValue displays without any conversion
    const store = useAppStore.getState();
    store.setCurrencyDirect('NPR');

    const emiFormatted = store.formatValue(Math.round(emiResult.newEMI), 'NPR');
    expect(emiFormatted).toBe('रू 13,327');

    const minSalaryFormatted = store.formatValue(emiResult.minimumIncomeRequired, 'NPR');
    expect(minSalaryFormatted).toBe('रू 79,160');
  });
});
