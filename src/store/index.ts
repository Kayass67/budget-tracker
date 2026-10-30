import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import {
  CalendarSystem,
  CurrencyCode,
  UserProfile,
  ExchangeRatesState,
  AnalysisHistoryItem,
  ProductInput,
  EMITerms,
} from '@/types';
import {
  FALLBACK_RATES,
  loadExchangeRates,
  convert,
  formatMoney,
  FormatMoneyOptions,
  roundToCurrency,
} from '@/lib/currency';
import {
  UserFinanceThresholds,
  DEFAULT_THRESHOLDS,
  updateFinanceConfig,
  resetFinanceConfig,
} from '@/lib/finance';

interface AppState {
  // Working Currency (The single source of truth across the app)
  currency: CurrencyCode;
  calendar: CalendarSystem;
  setCalendar: (calendar: CalendarSystem) => void;

  // Currency Switching State & Actions
  pendingCurrencyChange: CurrencyCode | null;
  requestCurrencyChange: (newCurrency: CurrencyCode) => void;
  confirmCurrencyChange: (convertValues: boolean) => void;
  cancelCurrencyChange: () => void;
  setCurrencyDirect: (currency: CurrencyCode) => void; // For tests or forced change

  // Onboarding Status
  isOnboarded: boolean;
  setOnboarded: (value: boolean) => void;

  // Exchange Rates State
  exchangeRates: ExchangeRatesState;
  refreshExchangeRates: () => Promise<void>;

  // Financial Profile (Always in working currency)
  profile: UserProfile;
  updateProfile: (partial: Partial<UserProfile>) => void;
  resetProfile: () => void;

  // Custom User Financial Thresholds (configurable in Settings)
  userThresholds: UserFinanceThresholds;
  updateUserThresholds: (partial: Partial<UserFinanceThresholds>) => void;
  resetUserThresholds: () => void;

  // Data Export, Import & Reset
  exportData: () => string;
  importData: (jsonStr: string) => { success: boolean; error?: string };
  clearAllData: () => void;

  // In-progress Analyzer inputs (kept in sync when currency converts)
  currentProduct: ProductInput;
  updateCurrentProduct: (partial: Partial<ProductInput>) => void;
  currentEmiTerms: EMITerms;
  updateCurrentEmiTerms: (partial: Partial<EMITerms>) => void;

  // Analysis History
  analysisHistory: AnalysisHistoryItem[];
  saveAnalysis: (
    item: Omit<AnalysisHistoryItem, 'id' | 'createdAt' | 'currency'> & {
      currency?: CurrencyCode;
    }
  ) => string;
  deleteAnalysis: (id: string) => void;
  clearAnalysisHistory: () => void;

  // Conversion & Display Helpers
  convertValue: (amount: number, fromCurrency: CurrencyCode, toCurrency?: CurrencyCode) => number;
  formatValue: (
    amount: number,
    sourceCurrency?: CurrencyCode,
    options?: FormatMoneyOptions
  ) => string;
}

const DEFAULT_PROFILE: UserProfile = {
  monthlyIncome: 80000,
  monthlyFixedExpenses: 35000,
  monthlyLifestyleExpenses: 15000,
  existingMonthlyEMIs: 0,
  currentSavings: 200000,
  emergencyFundCurrent: 105000,
  dependents: 0,
  currency: 'NPR',
  calendar: 'AD',

  // Backward compatibility
  fixedExpenses: 35000,
  variableExpenses: 15000,
  emergencyFundMonths: 3,
};

const DEFAULT_PRODUCT: ProductInput = {
  name: 'MacBook Air M3',
  category: 'Electronics & Tech',
  price: 150000,
  resaleValueAfterNYears: 50000,
  expectedUsefulLifeYears: 5,
};

const DEFAULT_EMI_TERMS: EMITerms = {
  downPayment: 0,
  annualInterestRate: 12,
  tenureMonths: 12,
  processingFee: 0,
  method: 'reducing',
};

const DEFAULT_RATES_STATE: ExchangeRatesState = {
  rates: FALLBACK_RATES,
  lastUpdated: null,
  isLive: false,
  isLoading: false,
  error: null,
};

const getStorage = () => {
  if (typeof window !== 'undefined' && window.localStorage) {
    return window.localStorage;
  }
  const memoryStore = new Map<string, string>();
  return {
    getItem: (key: string) => memoryStore.get(key) ?? null,
    setItem: (key: string, value: string) => {
      memoryStore.set(key, value);
    },
    removeItem: (key: string) => {
      memoryStore.delete(key);
    },
  };
};

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      // Active Single Working Currency (defaults to NPR)
      currency: 'NPR',
      calendar: 'AD',
      setCalendar: (calendar) => set({ calendar }),

      // Currency switch dialog state
      pendingCurrencyChange: null,

      requestCurrencyChange: (newCurrency: CurrencyCode) => {
        if (newCurrency === get().currency) return;
        set({ pendingCurrencyChange: newCurrency });
      },

      cancelCurrencyChange: () => {
        set({ pendingCurrencyChange: null });
      },

      confirmCurrencyChange: (convertValues: boolean) => {
        const {
          currency: oldCurrency,
          pendingCurrencyChange: newCurrency,
          exchangeRates,
          profile,
          currentProduct,
          currentEmiTerms,
        } = get();
        if (!newCurrency || newCurrency === oldCurrency) {
          set({ pendingCurrencyChange: null });
          return;
        }

        const rates = exchangeRates?.rates || FALLBACK_RATES;

        if (convertValues) {
          // Choice A: Convert all stored profile values and in-progress product inputs
          const convertAndRound = (val: number) => {
            if (val === 0) return 0;
            const converted = convert(val, oldCurrency, newCurrency, rates);
            return roundToCurrency(converted, newCurrency);
          };

          const convertedProfile: UserProfile = {
            ...profile,
            currency: newCurrency,
            monthlyIncome: convertAndRound(profile.monthlyIncome),
            monthlyFixedExpenses: convertAndRound(profile.monthlyFixedExpenses),
            monthlyLifestyleExpenses: convertAndRound(profile.monthlyLifestyleExpenses),
            existingMonthlyEMIs: convertAndRound(profile.existingMonthlyEMIs),
            currentSavings: convertAndRound(profile.currentSavings),
            emergencyFundCurrent: convertAndRound(profile.emergencyFundCurrent),
            fixedExpenses: convertAndRound(profile.monthlyFixedExpenses),
            variableExpenses: convertAndRound(profile.monthlyLifestyleExpenses),
          };

          const convertedProduct: ProductInput = {
            ...currentProduct,
            price: convertAndRound(currentProduct.price),
            resaleValueAfterNYears: currentProduct.resaleValueAfterNYears
              ? convertAndRound(currentProduct.resaleValueAfterNYears)
              : undefined,
          };

          const convertedEmiTerms: EMITerms = {
            ...currentEmiTerms,
            downPayment: convertAndRound(currentEmiTerms.downPayment),
            processingFee: convertAndRound(currentEmiTerms.processingFee),
          };

          set({
            currency: newCurrency,
            profile: convertedProfile,
            currentProduct: convertedProduct,
            currentEmiTerms: convertedEmiTerms,
            pendingCurrencyChange: null,
          });
        } else {
          // Choice B: Keep the numbers, just change the currency label
          set({
            currency: newCurrency,
            profile: { ...profile, currency: newCurrency },
            pendingCurrencyChange: null,
          });
        }
      },

      // Direct switch without prompt (e.g. for testing)
      setCurrencyDirect: (currency: CurrencyCode) => {
        set((state) => ({
          currency,
          profile: { ...state.profile, currency },
        }));
      },

      // Onboarding
      isOnboarded: false,
      setOnboarded: (value) => set({ isOnboarded: value }),

      // Exchange Rates
      exchangeRates: DEFAULT_RATES_STATE,
      refreshExchangeRates: async () => {
        set((state) => ({
          exchangeRates: { ...state.exchangeRates, isLoading: true },
        }));
        try {
          const ratesResult = await loadExchangeRates();
          set({ exchangeRates: ratesResult });
        } catch {
          set((state) => ({
            exchangeRates: {
              ...state.exchangeRates,
              isLoading: false,
              isLive: false,
              error: 'Failed to fetch rates, using fallback table.',
            },
          }));
        }
      },

      // Profile (always kept in sync with working currency)
      profile: DEFAULT_PROFILE,
      updateProfile: (partial) =>
        set((state) => {
          const updated: UserProfile = {
            ...state.profile,
            ...partial,
            currency: state.currency, // Profile currency strictly equals working currency
          };
          if (partial.monthlyFixedExpenses !== undefined) {
            updated.fixedExpenses = partial.monthlyFixedExpenses;
          }
          if (partial.monthlyLifestyleExpenses !== undefined) {
            updated.variableExpenses = partial.monthlyLifestyleExpenses;
          }
          return { profile: updated };
        }),
      resetProfile: () =>
        set((state) => ({
          profile: { ...DEFAULT_PROFILE, currency: state.currency },
          isOnboarded: false,
        })),

      // In-progress Analyzer inputs
      currentProduct: DEFAULT_PRODUCT,
      updateCurrentProduct: (partial) =>
        set((state) => ({
          currentProduct: { ...state.currentProduct, ...partial },
        })),
      currentEmiTerms: DEFAULT_EMI_TERMS,
      updateCurrentEmiTerms: (partial) =>
        set((state) => ({
          currentEmiTerms: { ...state.currentEmiTerms, ...partial },
        })),

      // History
      analysisHistory: [],
      saveAnalysis: (item) => {
        const id = `analysis_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
        const newItem: AnalysisHistoryItem = {
          ...item,
          id,
          createdAt: new Date().toISOString(),
          currency: item.currency || get().currency,
        };
        set((state) => ({
          analysisHistory: [newItem, ...state.analysisHistory],
        }));
        return id;
      },
      deleteAnalysis: (id) =>
        set((state) => ({
          analysisHistory: state.analysisHistory.filter((item) => item.id !== id),
        })),
      clearAnalysisHistory: () => set({ analysisHistory: [] }),

      // Custom Financial Thresholds
      userThresholds: DEFAULT_THRESHOLDS,
      updateUserThresholds: (partial) =>
        set((state) => {
          const updated = { ...state.userThresholds, ...partial };
          updateFinanceConfig(updated);
          return { userThresholds: updated };
        }),
      resetUserThresholds: () => {
        resetFinanceConfig();
        set({ userThresholds: DEFAULT_THRESHOLDS });
      },

      // Backup Export / Import / Reset
      exportData: () => {
        const state = get();
        const payload = {
          schemaVersion: 3,
          exportedAt: new Date().toISOString(),
          app: 'MyCA',
          currency: state.currency,
          calendar: state.calendar,
          profile: state.profile,
          currentProduct: state.currentProduct,
          currentEmiTerms: state.currentEmiTerms,
          userThresholds: state.userThresholds,
          analysisHistory: state.analysisHistory,
        };
        return JSON.stringify(payload, null, 2);
      },

      importData: (jsonStr: string) => {
        try {
          const data = JSON.parse(jsonStr);
          if (!data || typeof data !== 'object') {
            return {
              success: false,
              error: 'Invalid file format: Backup content must be a JSON object.',
            };
          }
          if (typeof data.schemaVersion !== 'number') {
            return {
              success: false,
              error: 'Invalid backup file: Missing schema version metadata.',
            };
          }
          if (data.schemaVersion > 3) {
            return {
              success: false,
              error: `Incompatible backup version: This file was generated by MyCA schema v${data.schemaVersion}, but your current application is schema v3. Please update the application.`,
            };
          }
          if (
            !data.profile ||
            typeof data.profile !== 'object' ||
            typeof data.profile.monthlyIncome !== 'number'
          ) {
            return {
              success: false,
              error: 'Invalid backup content: Missing or malformed financial profile data.',
            };
          }

          const importedCurrency =
            (data.currency as CurrencyCode) || (data.profile.currency as CurrencyCode) || 'NPR';
          const importedThresholds: UserFinanceThresholds = data.userThresholds
            ? { ...DEFAULT_THRESHOLDS, ...data.userThresholds }
            : DEFAULT_THRESHOLDS;

          updateFinanceConfig(importedThresholds);

          set({
            currency: importedCurrency,
            calendar: data.calendar || 'AD',
            profile: { ...data.profile, currency: importedCurrency },
            currentProduct: data.currentProduct || DEFAULT_PRODUCT,
            currentEmiTerms: data.currentEmiTerms || DEFAULT_EMI_TERMS,
            userThresholds: importedThresholds,
            analysisHistory: Array.isArray(data.analysisHistory) ? data.analysisHistory : [],
            isOnboarded: true,
            pendingCurrencyChange: null,
          });

          return { success: true };
        } catch {
          return {
            success: false,
            error: 'Failed to parse JSON file: The file is corrupted or not valid JSON.',
          };
        }
      },

      clearAllData: () => {
        resetFinanceConfig();
        set({
          currency: 'NPR',
          calendar: 'AD',
          isOnboarded: false,
          profile: DEFAULT_PROFILE,
          currentProduct: DEFAULT_PRODUCT,
          currentEmiTerms: DEFAULT_EMI_TERMS,
          userThresholds: DEFAULT_THRESHOLDS,
          analysisHistory: [],
          pendingCurrencyChange: null,
        });
      },

      // Helpers
      convertValue: (amount, fromCurrency, toCurrency) => {
        const targetCurrency = toCurrency || get().currency;
        const rates = get().exchangeRates?.rates || FALLBACK_RATES;
        return convert(amount, fromCurrency, targetCurrency, rates);
      },

      /**
       * Formats value in the working currency.
       * - If sourceCurrency is omitted or matches working currency -> Direct format, NO conversion!
       * - If sourceCurrency is different (e.g. historical saved record) -> Converts using rates table.
       */
      formatValue: (amount, sourceCurrency, options) => {
        const workingCurrency = get().currency;
        if (!sourceCurrency || sourceCurrency === workingCurrency) {
          return formatMoney(amount, workingCurrency, options);
        }
        const rates = get().exchangeRates?.rates || FALLBACK_RATES;
        const converted = convert(amount, sourceCurrency, workingCurrency, rates);
        return formatMoney(converted, workingCurrency, options);
      },
    }),
    {
      name: 'myca_storage_v1',
      version: 3,
      storage: createJSONStorage(getStorage),
      migrate: (persistedState: unknown, _version: number) => {
        const state = (
          persistedState && typeof persistedState === 'object' ? persistedState : {}
        ) as Record<string, unknown>;
        const oldProfile = (
          state.profile && typeof state.profile === 'object' ? state.profile : {}
        ) as Record<string, unknown>;

        // Migration to version 3:
        // Use the saved profile.currency as the working currency without modifying any numbers!
        const savedCurrency =
          (oldProfile.currency as CurrencyCode) || (state.currency as CurrencyCode) || 'NPR';

        const monthlyFixed =
          typeof oldProfile.monthlyFixedExpenses === 'number'
            ? oldProfile.monthlyFixedExpenses
            : typeof oldProfile.fixedExpenses === 'number'
              ? oldProfile.fixedExpenses
              : 35000;

        const monthlyLifestyle =
          typeof oldProfile.monthlyLifestyleExpenses === 'number'
            ? oldProfile.monthlyLifestyleExpenses
            : typeof oldProfile.variableExpenses === 'number'
              ? oldProfile.variableExpenses
              : 15000;

        const migratedProfile: UserProfile = {
          monthlyIncome:
            typeof oldProfile.monthlyIncome === 'number' ? oldProfile.monthlyIncome : 80000,
          monthlyFixedExpenses: monthlyFixed,
          monthlyLifestyleExpenses: monthlyLifestyle,
          existingMonthlyEMIs:
            typeof oldProfile.existingMonthlyEMIs === 'number' ? oldProfile.existingMonthlyEMIs : 0,
          currentSavings:
            typeof oldProfile.currentSavings === 'number' ? oldProfile.currentSavings : 200000,
          emergencyFundCurrent:
            typeof oldProfile.emergencyFundCurrent === 'number'
              ? oldProfile.emergencyFundCurrent
              : monthlyFixed * 3,
          dependents: typeof oldProfile.dependents === 'number' ? oldProfile.dependents : 0,
          currency: savedCurrency,
          calendar: (oldProfile.calendar as CalendarSystem) || 'AD',
          fixedExpenses: monthlyFixed,
          variableExpenses: monthlyLifestyle,
          emergencyFundMonths:
            typeof oldProfile.emergencyFundMonths === 'number' ? oldProfile.emergencyFundMonths : 3,
        };

        const rawHistory = Array.isArray(state.analysisHistory) ? state.analysisHistory : [];
        const migratedHistory = rawHistory.map((item: any) => ({
          ...item,
          product: {
            ...item.product,
            // Ensure product category and price exist
            price: item.product?.price || item.totalCost || 0,
          },
          currency: item.currency || (item.product?.currency as CurrencyCode) || savedCurrency,
        }));

        return {
          ...state,
          currency: savedCurrency,
          calendar: (state.calendar as CalendarSystem) || 'AD',
          isOnboarded: Boolean(state.isOnboarded),
          analysisHistory: migratedHistory,
          profile: migratedProfile,
          currentProduct: (state.currentProduct as ProductInput) || DEFAULT_PRODUCT,
          currentEmiTerms: (state.currentEmiTerms as EMITerms) || DEFAULT_EMI_TERMS,
          userThresholds: (state.userThresholds as UserFinanceThresholds) || DEFAULT_THRESHOLDS,
          pendingCurrencyChange: null,
        } as unknown as AppState;
      },
      partialize: (state) => ({
        currency: state.currency,
        calendar: state.calendar,
        isOnboarded: state.isOnboarded,
        profile: state.profile,
        currentProduct: state.currentProduct,
        currentEmiTerms: state.currentEmiTerms,
        userThresholds: state.userThresholds,
        analysisHistory: state.analysisHistory,
        exchangeRates: state.exchangeRates,
      }),
    }
  )
);

// Synchronize runtime finance thresholds with persisted thresholds on startup
if (typeof window !== 'undefined') {
  const initialThresholds = useAppStore.getState().userThresholds;
  if (initialThresholds) {
    updateFinanceConfig(initialThresholds);
  }
}
