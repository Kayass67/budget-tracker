# MyCA — My Personal Chartered Accountant 💼✨

A modern, privacy-first personal finance web application designed to help you determine whether you can truly afford a purchase — either by paying in full or through an EMI schedule — and how long it will take to financially recover.

---

## 🌟 Key Features

- **Purchase Affordability Analyzer**: Evaluates whether an item is safe to buy in cash or via EMI installments based on liquid buffers and monthly surplus.
- **Visual Analytics Suite (Recharts)**:
  - **EMI Cost Breakdown Donut**: Principal vs total interest overhead vs upfront fees.
  - **Loan Amortization Area Chart**: Month-by-month principal accumulation vs interest reduction.
  - **36-Month Savings Trajectory**: Multi-scenario projections ("Do Nothing", "Buy in Cash", "Buy on EMI") with starting savings recovery milestones.
  - **Monthly Budget Restructuring**: Grouped bar chart comparing Needs, Wants, Debt commitments (EMIs), and Savings Before vs. After purchase.
  - **Recovery Velocity Timeline**: Horizontal progress chart showing months to replenish funds at standard (1.0x), accelerated (+25%), and sprint (+50%) savings paces.
  - **50/30/20 Budget Health Donut**: Compares actual spending against standard financial guidelines.
- **Side-by-Side Comparison Engine**: Compare Cash vs. EMI with category winner badges (*Cheapest Overall*, *Lowest Monthly Strain*, *Fastest Recovery*, *Safest Decision*) and live rate/tenure sliders.
- **Income Stress-Testing**: "What if my income changes?" slider (±50%) to evaluate financial resilience against salary cuts or raises in real time.
- **Dual Calendar Support**: Toggle between **Gregorian (AD)** and **Bikram Sambat (BS)** with full round-trip conversion and native Nepali month formatting.
- **Unified Currency Engine**: Supports 22 global and regional currencies (NPR, INR, USD, EUR, GBP, AUD, etc.) with Indian digit grouping style for NPR and INR (`12,34,567`), live daily exchange rates with offline fallbacks, and intelligent currency switching with conversion options.
- **Full Data Backup & Restore**: Export all settings, profile, and analysis history as a portable JSON file (Schema v3) with version validation and error handling.
- **100% Client-Side & Private**: No backend, no telemetry, no tracking. All financial data stays strictly in your browser's local storage.

---

## 📸 Screenshots

| Purchase Analyzer & 7 Metric Cards | Visual Financial Impact Dashboard |
| :---: | :---: |
| ![Purchase Analyzer](https://via.placeholder.com/600x380/F4F1FF/7C6FE0?text=Purchase+Analyzer+Results) | ![Financial Impact Charts](https://via.placeholder.com/600x380/EAF7F4/5CC8A8?text=Savings+Projection+%26+Recovery) |

| Cash vs. EMI Side-by-Side Comparison | 50/30/20 Budget Health Diagnostic |
| :---: | :---: |
| ![Cash vs EMI Comparison](https://via.placeholder.com/600x380/F4F1FF/FFB48A?text=Cash+vs+EMI+Comparison) | ![Budget Health Donut](https://via.placeholder.com/600x380/EAF7F4/6EC1F2?text=50%2F30%2F20+Budget+Health) |

---

## 📐 Financial Rules & Formulas

MyCA implements pure, mathematically sound financial principles in `src/lib/finance/`:

### 1. 50/30/20 Budgeting Rule
- **Needs (Fixed Expenses + Existing EMIs)**: Must be $\le 50\%$ of monthly net income.
- **Wants (Discretionary Lifestyle)**: Must be $\le 30\%$ of monthly net income.
- **Savings / Net Surplus**: Must be $\ge 20\%$ of monthly net income.
$$\text{Monthly Surplus} = \text{Income} - \text{Fixed Needs} - \text{Lifestyle Wants} - \text{Existing EMIs}$$

### 2. Debt-to-Income (DTI) Ceiling
- Total monthly loan obligations must remain below the healthy threshold:
$$\text{New DTI} = \frac{\text{Existing EMIs} + \text{New EMI}}{\text{Monthly Income}} \le 40\%$$
*(Values between 40% and 50% are flagged as risky; over 50% is unsafe).*

### 3. Emergency Safety Reserve
- **0 Dependents**: 3 months of non-negotiable fixed expenses + debt commitments.
- **1+ Dependents**: 6 months of non-negotiable living commitments.
$$\text{Usable Liquid Savings} = \max(0, \text{Current Savings} - \text{Emergency Fund Target})$$

### 4. EMI Calculation (Standard Reducing Balance)
$$\text{EMI} = P \times \frac{r(1+r)^n}{(1+r)^n - 1}$$
Where $P$ is principal (Price − Down Payment), $r = \frac{\text{Annual Rate}}{12 \times 100}$, and $n$ is tenure in months.

### 5. Financial Recovery Time
- **Cash**: Exact months to save back the full price:
$$\text{Months to Recover} = \left\lceil \frac{\text{Price}}{\text{Monthly Surplus}} \right\rceil$$
- **EMI**: Integrates reduced monthly surplus during the loan tenure until cumulative savings equal the total loan outflow.

### 6. Minimum Salary Required
Calculates the minimum income needed to safely make the purchase without breaking rules:
- **Cash**: Income needed to support fixed needs and maintain a 20% surplus:
$$\text{Min Income} = \max\left(\frac{\text{Fixed}}{0.50}, \frac{\text{Fixed} + \text{Lifestyle}}{0.80}\right)$$
- **EMI**: Income needed to satisfy both DTI $\le 40\%$ and a 20% savings margin:
$$\text{Min Income} = \max\left(\left\lceil \frac{\text{Total EMIs}}{0.40} \right\rceil, \left\lceil \frac{\text{Fixed} + \text{Lifestyle} + \text{Total EMIs}}{0.80} \right\rceil\right)$$

### 7. Opportunity Cost
Compound future value of what the spent funds could have earned if invested in safe fixed-income assets:
$$\text{FV} = \text{Outflow} \times \left(1 + \frac{r}{12}\right)^n$$
Where $r$ is the configurable annual return rate (default 6%–8%) over the recovery horizon $n$.

---

## 🛠 Tech Stack

- **Framework**: React 18 + Vite + TypeScript (Strict mode)
- **Styling**: Tailwind CSS (custom light-pastel theme)
- **Visuals**: Recharts
- **Animations**: Framer Motion (with `prefers-reduced-motion` compliance)
- **Icons**: Lucide React
- **Routing**: React Router DOM (`HashRouter` for GitHub Pages static hosting compatibility)
- **State Management**: Zustand with `persist` middleware (Schema v3)
- **Date Engine**: `nepali-date-converter` (Bikram Sambat BS $\leftrightarrow$ Gregorian AD)
- **Testing**: Vitest (60+ pure unit tests)
- **Linting & Code Quality**: ESLint 9 + TypeScript-ESLint + React Hooks + Prettier

---

## 🔒 Privacy Architecture

MyCA operates on a **zero-knowledge, 100% client-side privacy model**:
1. All financial figures (income, savings, debt, expense breakdowns, and purchase evaluations) are stored exclusively in your local browser storage (`localStorage`).
2. No user accounts, database backends, analytics trackers, or third-party marketing SDKs exist in the project.
3. The only network call made is a public `GET` request to `https://open.er-api.com/v6/latest/USD` to fetch live exchange rates. This request transmits **zero user data or identifiers**. If offline or blocked, the app automatically falls back to its built-in rate table.

> ⚠️ **Disclaimer**: *MyCA is a guidance and financial education tool, not professional financial advice.*

---

## 📦 About the `@rollup/wasm-node` Override

In `package.json`, you will notice:
```json
"overrides": {
  "rollup": "npm:@rollup/wasm-node"
}
```
### Why is this present?
On Windows environments (particularly Windows 11 with Smart App Control or aggressive antivirus heuristics enabled), loading native C++ binary addons such as `@rollup/rollup-win32-x64-msvc.node` can be blocked with an `ERR_DLOPEN_FAILED` error during compilation.

To guarantee seamless builds across all development environments without requiring complex visual C++ toolchains, npm is configured to use Rollup's official WebAssembly build (`@rollup/wasm-node`). WebAssembly is platform-agnostic, meaning the project builds with 100% fidelity on **Windows, macOS, and Linux (including GitHub Actions runners)**. If desired on a standard Linux machine, this override can be safely removed, but leaving it ensures complete cross-platform portability.

---

## 🚀 Running Locally

### 1. Prerequisites
- Node.js (version 20 LTS recommended)
- npm (version 10+)

### 2. Setup & Installation
```bash
# Clone the repository
git clone https://github.com/<your-username>/budget_tracker.git
cd budget_tracker

# Install dependencies
npm ci

# Start the local development server
npm run dev
```

### 3. NPM Scripts
| Script | Command | Purpose |
| :--- | :--- | :--- |
| **Development** | `npm run dev` | Launches Vite local dev server with HMR |
| **Lint** | `npm run lint` | Runs ESLint 9 across all TypeScript files |
| **Format** | `npm run format` | Formats all code with Prettier |
| **Tests** | `npm run test` | Executes the Vitest unit test suite |
| **Build** | `npm run build` | Runs TypeScript type checking and builds production bundle to `dist/` |
| **Preview** | `npm run preview` | Starts a local HTTP server serving the production `dist/` build |

---

## 🌐 Deploying to GitHub Pages

The repository includes a ready-to-use GitHub Actions workflow at [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml).

### Step-by-Step Deployment Instructions:
1. **Create the GitHub Repository**:
   - Go to [GitHub](https://github.com/new) and create a new repository (e.g. `budget_tracker`).
2. **Push your code to `main`**:
   ```bash
   git init
   git add .
   git commit -m "feat: complete MyCA personal finance web app"
   git branch -M main
   git remote add origin https://github.com/<your-username>/budget_tracker.git
   git push -u origin main
   ```
3. **Configure GitHub Pages Source**:
   - On GitHub, navigate to **Settings** $\to$ **Pages**.
   - Under **Build and deployment** $\to$ **Source**, select **"GitHub Actions"**.
4. **Automatic Deployment**:
   - The workflow will automatically trigger on push to `main`, install dependencies with Node 20, run linting and tests, build with the correct repository base URL, and deploy directly to GitHub Pages.
   - Access your live app at `https://<your-username>.github.io/budget_tracker/`.

---

## 📁 Folder Structure

```
budget_tracker/
├── .github/
│   └── workflows/
│       └── deploy.yml          # GitHub Pages CI/CD workflow
├── src/
│   ├── components/
│   │   ├── analyzer/           # VerdictGauge & score widgets
│   │   ├── charts/             # Recharts pastel visualization components
│   │   │   ├── AmortizationAreaChart.tsx
│   │   │   ├── BudgetHealthDonut.tsx
│   │   │   ├── BudgetImpactBarChart.tsx
│   │   │   ├── ChartEmptyState.tsx
│   │   │   ├── EmiBreakdownDonut.tsx
│   │   │   ├── RecoveryTimelineChart.tsx
│   │   │   └── SavingsProjectionChart.tsx
│   │   ├── common/             # DatePicker, DateText, ErrorBoundary, Modals
│   │   └── layout/             # AppShell, Topbar, Sidebar, BottomNav
│   ├── lib/
│   │   ├── currency/           # 22 currencies, live rates, Indian digit grouping
│   │   ├── date/               # Bikram Sambat (BS) & Gregorian (AD) converter
│   │   └── finance/            # Pure finance calculation engine & formulas
│   ├── pages/                  # Dashboard, Profile, Analyzer, Compare, Settings
│   ├── store/                  # Zustand store (persist v3 with migration)
│   ├── types/                  # TypeScript interfaces
│   ├── App.tsx                 # Root layout with ErrorBoundary & HashRouter
│   ├── index.css               # Tailwind & accessible focus styles
│   └── main.tsx                # Application bootstrap entrypoint
├── eslint.config.js            # ESLint 9 flat configuration
├── vite.config.ts              # Vite configuration (with dynamic VITE_BASE)
└── package.json                # Dependencies, scripts, and overrides
```

---

## ⚠️ Known Limitations

- **Offline Currency Rates**: When offline, the app utilizes built-in fallback exchange rates calibrated against USD. Exchange rates fluctuate daily; connect to the internet to fetch fresh daily rates.
- **Guidance Tool**: Calculations do not model country-specific progressive income tax deductions or dynamic inflation adjustments over multi-decade horizons.

---

## 📄 License

This project is open-source under the [MIT License](LICENSE).
