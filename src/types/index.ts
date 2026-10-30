export type CurrencyCode =
  | 'NPR'
  | 'USD'
  | 'GBP'
  | 'EUR'
  | 'INR'
  | 'AUD'
  | 'CAD'
  | 'JPY'
  | 'CNY'
  | 'AED'
  | 'SAR'
  | 'QAR'
  | 'MYR'
  | 'SGD'
  | 'CHF'
  | 'KRW'
  | 'THB'
  | 'HKD'
  | 'NZD'
  | 'BDT'
  | 'LKR'
  | 'PKR';

export interface CurrencyConfig {
  code: CurrencyCode;
  name: string;
  symbol: string;
  locale: string;
  rateAgainstUSD: number;
  digits: number;
}

export interface ExchangeRatesState {
  rates: Record<string, number>;
  lastUpdated: string | null;
  isLive: boolean;
  isLoading: boolean;
  error: string | null;
}

export type CalendarSystem = 'AD' | 'BS';

export interface UserProfile {
  monthlyIncome: number;
  monthlyFixedExpenses: number;
  monthlyLifestyleExpenses: number;
  existingMonthlyEMIs: number;
  currentSavings: number;
  emergencyFundCurrent: number;
  dependents: number;
  currency: CurrencyCode;
  calendar: CalendarSystem;

  // Backward-compatibility properties
  fixedExpenses?: number;
  variableExpenses?: number;
  emergencyFundMonths?: number;
}

export interface ProductInput {
  name: string;
  category: string;
  price: number;
  resaleValueAfterNYears?: number;
  expectedUsefulLifeYears?: number;
}

export interface EMITerms {
  downPayment: number;
  annualInterestRate: number; // In percent, e.g. 12 for 12%
  tenureMonths: number;
  processingFee: number;
  method?: 'reducing' | 'flat';
}

export interface AmortizationEntry {
  month: number;
  emi: number;
  principalPart: number;
  interestPart: number;
  balance: number;
}

export type VerdictLabel = 'Safe to Buy' | 'Buy With Caution' | 'Wait' | 'Avoid';

export interface VerdictReason {
  factor: string;
  status: 'pass' | 'warn' | 'fail';
  message: string;
}

export interface VerdictScoreResult {
  score: number; // 0 to 100
  label: VerdictLabel;
  reasons: VerdictReason[];
  summary: string;
}

export interface AnalysisHistoryItem {
  id: string;
  createdAt: string; // ISO string
  currency: CurrencyCode;
  product: ProductInput;
  paymentOption: 'cash' | 'emi';
  emiTerms?: EMITerms;
  verdictScore: number;
  verdictLabel: VerdictLabel;
  monthlyEMI?: number;
  monthsToRecover: number;
  totalCost: number;
}

export type AffordabilityVerdict = 'AFFORDABLE' | 'CAUTION' | 'UNAFFORDABLE';

export interface CalculationResult {
  verdict: AffordabilityVerdict;
  verdictTitle: string;
  verdictExplanation: string;
  recoveryDays: number;
  recoveryMonths: number;
  savingsAfterPurchase: number;
  emergencyFundRequired: number;
  monthlyDiscretionaryIncome: number;
}

export interface NavigationItem {
  name: string;
  path: string;
  icon: string;
}
