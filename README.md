# Discount Engine

<p align="center">
  <strong>Customer-facing discount pricing engine for Opptra</strong><br/>
  Upload rules and cart data, apply brand/platform/cart discounts, create rules with AI, and export professional pricing results.
</p>

<p align="center">
  <a href="https://disengine.vercel.app/"><strong>🚀 Live Demo → disengine.vercel.app</strong></a>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Live-disengine.vercel.app-FF5800?style=flat-square" alt="Live Demo" />
  <img src="https://img.shields.io/badge/React-18-61dafb?style=flat-square&logo=react&logoColor=white" alt="React 18" />
  <img src="https://img.shields.io/badge/Vite-5-646cff?style=flat-square&logo=vite&logoColor=white" alt="Vite 5" />
  <img src="https://img.shields.io/badge/Opptra-Assignment-FF5800?style=flat-square" alt="Opptra Assignment" />
  <img src="https://img.shields.io/badge/License-MIT-green?style=flat-square" alt="MIT License" />
  <img src="https://img.shields.io/badge/Build-Passing-success?style=flat-square" alt="Build Passing" />
  <img src="https://img.shields.io/badge/Tests-42%20passing-success?style=flat-square" alt="Tests Passing" />
</p>

---

## Live Demo

Try the deployed app (no install required):

**[https://disengine.vercel.app/](https://disengine.vercel.app/)**

Upload `sample-data/rules.csv` and `sample-data/cart.csv` to reproduce the assignment output. Natural Language Rules require an Anthropic API key configured in the Vercel deployment environment.

---

## Project Overview

This project implements a **customer-facing discount pricing engine** capable of:

- **CSV Rules** — Upload and validate discount rule definitions
- **CSV Cart** — Upload shopping cart line items
- **PDF Cart Upload** — Extract cart tables from PDF using pdf.js
- **Natural Language Rules** — Describe discounts in plain English (Anthropic Claude Sonnet, optional)
- **Rule Confirmation** — Mandatory review before any AI rule enters the engine
- **Cart-level Offers** — Threshold-based cart discounts (e.g. 10% off orders ≥ Rs.4,000)
- **Export Results** — Download item-level and cart summary CSV with timestamp

The discount engine is **pure JavaScript** — isolated from React, CSV parsing, PDF parsing, and LLM services. All pricing, stacking, and cart logic lives in a single testable module.

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Presentation Layer                       │
│  React · Vite · Components · Hooks · Design System          │
└─────────────────────────────┬───────────────────────────────┘
                              │
┌─────────────────────────────▼───────────────────────────────┐
│                      Parsers Layer                           │
│  csvParser.js (rules + cart) · pdfParser.js (cart PDF)      │
└─────────────────────────────┬───────────────────────────────┘
                              │
┌─────────────────────────────▼───────────────────────────────┐
│                    Validation Layer                          │
│  ruleValidator.js · LLM schema · duplicate detection          │
└─────────────────────────────┬───────────────────────────────┘
                              │
┌─────────────────────────────▼───────────────────────────────┐
│                   Pricing Engine (LOCKED)                    │
│  discountEngine.js — stacking · max savings · cart offers   │
└─────────────────────────────┬───────────────────────────────┘
                              │
┌─────────────────────────────▼───────────────────────────────┐
│                      Results Layer                           │
│  KPIs · Tables · Order Summary · Export CSV                   │
└─────────────────────────────────────────────────────────────┘
```

| Layer | Responsibility | Does NOT |
|-------|----------------|----------|
| **Presentation** | UI, state orchestration, toasts, theme | Calculate discounts |
| **Parsers** | CSV/PDF → typed `CartItem` / `DiscountRule` | Apply business rules |
| **Validation** | Schema checks, LLM output, duplicates | Modify engine |
| **Pricing Engine** | Item + cart discount math, status labels | Know about React or files |
| **Results** | Format and display engine output | Recalculate prices |

### Natural Language Rule Flow

```
React UI
    ↓
Anthropic Claude (Messages API)
    ↓
Rule Validator (schema + ambiguity)
    ↓
Pricing Engine (unchanged)
```

The Natural Language Rule feature requires an **Anthropic API key**. All pricing engine functionality works without an API key.

---

## Project Structure

```
discount-engine/
├── assets/
│   └── screenshots/          # UI captures (see README inside)
├── docs/
│   ├── DEPLOYMENT.md
│   ├── FINAL_QA_REPORT.md
│   ├── LOOM_SCRIPT.md
│   ├── NATURAL_LANGUAGE_RULES.md
│   └── SUBMISSION_CHECKLIST.md
├── sample-data/
│   ├── cart.csv              # Assignment sample cart
│   └── rules.csv             # Assignment sample rules
├── src/
│   ├── components/
│   │   ├── layout/Header.jsx
│   │   ├── ui/               # Badges, KPI, EmptyState, ThinkingDots
│   │   ├── CartSummaryPanel.jsx
│   │   ├── ConfidenceIndicator.jsx
│   │   ├── CsvUploader.jsx
│   │   ├── DataTable.jsx
│   │   ├── ErrorBanner.jsx
│   │   ├── NaturalLanguageRuleInput.jsx
│   │   ├── ProcessingTimeline.jsx
│   │   ├── RuleConfirmationDialog.jsx
│   │   ├── RuleExplanationCard.jsx
│   │   ├── RuleHistoryPanel.jsx
│   │   ├── RulePreviewCard.jsx
│   │   ├── SavingsBreakdown.jsx
│   │   └── Toast.jsx
│   ├── constants/statusLabels.js
│   ├── engine/
│   │   ├── csvParser.js      # LOCKED
│   │   ├── discountEngine.js # LOCKED
│   │   └── pdfParser.js
│   ├── hooks/
│   │   ├── useAnimatedNumber.js
│   │   ├── useTheme.js
│   │   └── useToast.js
│   ├── services/
│   │   ├── llmService.js
│   │   └── promptBuilder.js
│   ├── styles/
│   │   ├── app.css
│   │   └── tokens.css
│   ├── types/
│   │   └── ruleSchema.js
│   ├── utils/
│   │   ├── buildRuleBusinessImpact.js
│   │   ├── exportResultsCsv.js
│   │   ├── exportRulesCsv.js
│   │   ├── formatCurrency.js
│   │   ├── generateRuleId.js
│   │   └── parseLlmJson.js
│   ├── validators/ruleValidator.js  # LOCKED
│   ├── App.jsx
│   ├── index.css
│   ├── main.jsx
│   └── types.js
├── tests/                    # 42 Vitest tests
├── .env.example
├── .gitignore
├── index.html
├── LICENSE
├── package.json
└── vite.config.js
```

---

## Features

- [x] CSV Rules Upload
- [x] CSV Cart Upload
- [x] PDF Cart Upload
- [x] Rule Engine (brand, platform, cart)
- [x] Stackable Rules (flat then percentage)
- [x] Max Savings Selection (non-stackable)
- [x] Cart Discount (threshold-based)
- [x] Natural Language Rules (Anthropic Claude Sonnet)
- [x] Confirmation Dialog
- [x] Confidence Indicator
- [x] Rule Explanation
- [x] Export Results CSV
- [x] Export Rules CSV
- [x] Responsive UI (320px – 1440px)
- [x] Dark Mode
- [x] Accessibility (keyboard, ARIA, focus states)

---

## Technology Stack

| Technology | Purpose |
|------------|---------|
| **React 18** | UI components and state |
| **Vite 5** | Dev server and production build |
| **PapaParse** | CSV parsing |
| **pdf.js** | PDF table extraction |
| **Anthropic Claude Sonnet** | Natural language rule parsing (optional) |
| **@anthropic-ai/sdk** | Claude Messages API client |
| **CSS** | Design tokens, no UI framework |
| **Vitest** | Unit and regression tests |

---

## How Discount Selection Works

```
Cart Items + Rules
        │
        ▼
┌───────────────────┐
│ Match item rules  │  brand · platform scope
└─────────┬─────────┘
          │
          ▼
   Any stackable?
    /           \
  Yes            No
   │              │
   ▼              ▼
 Stack ALL     Pick rule with
 flat → %      MAX rupee saving
   │              │
   └──────┬───────┘
          ▼
   Item final prices
          │
          ▼
   Sum cart subtotal
          │
          ▼
   Cart rules meet
   min threshold?
    /           \
  Yes            No
   │              │
   ▼              ▼
 Apply cart    Final total
 discount      = subtotal
   │
   ▼
 Final Cart Total
```

**Non-stackable:** When multiple rules match, the engine compares rupee savings and applies the best one (`Max discount` status).

**Stackable:** If any matching rule is stackable, all matching rules apply — flat discounts first, then percentages sequentially.

**Cart offer:** Applied after item discounts when subtotal meets `min_cart_value`.

---

## Sample Flow

```
Upload Rules (CSV or AI)
        ↓
Upload Cart (CSV or PDF)
        ↓
Calculate Discounts
        ↓
Review Results (table + KPIs + order summary)
        ↓
Export CSV
```

### Assignment Sample Output

Upload `sample-data/rules.csv` and `sample-data/cart.csv`, then click **Calculate Discounts**:

| Item | Final Price | Status |
|------|-------------|--------|
| ITEM-01 | Rs.1,104 | Max discount |
| ITEM-02 | Rs.629 | Stacked |
| ITEM-03 | Rs.509 | Discount applied |
| ITEM-04 | Rs.2,499 | No offer |
| ITEM-05 | Rs.382 | Discount applied |
| ITEM-06 | Rs.809 | Discount applied |

**Cart:** Rs.5,932 subtotal → Rs.593 cart offer → **Rs.5,339 final**

---

## Running Locally

```bash
git clone <your-repo-url>
cd discount-engine
npm install
npm run dev
```

Open **http://localhost:5173**

Optional — enable AI rules with Anthropic Claude:

```bash
cp .env.example .env
```

Add to `.env`:

```
VITE_ANTHROPIC_API_KEY=YOUR_KEY
```

The Natural Language Rule feature requires an Anthropic API key. All pricing engine functionality works without an API key.

---

## Running Tests

```bash
npm test
```

42 tests cover assignment sample regression, stacking edge cases, cart thresholds, CSV validation, and LLM mocks.

---

## Production Build

```bash
npm run build
npm run preview
```

Output directory: `dist/`

---

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `VITE_ANTHROPIC_API_KEY` | Only for AI rules | Anthropic API key for natural language rule parsing |
| `VITE_ANTHROPIC_MODEL` | No | Claude model override (default: `claude-sonnet-4-6`) |

**No API key is required** for CSV upload, PDF upload, discount calculation, or export unless Natural Language Rule parsing is enabled.

See `.env.example` for the template.

---

## Deployment

**Live deployment:** [https://disengine.vercel.app/](https://disengine.vercel.app/)

Static deployment to **Vercel**, **Netlify**, or **GitHub Pages**.

| Setting | Value |
|---------|-------|
| Build command | `npm run build` |
| Output directory | `dist` |
| Node version | 18+ |

For AI rule creation on Vercel, add `VITE_ANTHROPIC_API_KEY` (and optionally `VITE_ANTHROPIC_MODEL`) under **Project → Settings → Environment Variables**, then redeploy.

Full guides: [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md)

---

## Screenshots

| Home | Upload | Results |
|------|--------|---------|
| ![Home](assets/screenshots/01-home.svg) | ![Upload](assets/screenshots/02-upload.svg) | ![Results](assets/screenshots/03-results.svg) |

| AI Rule | Dark Mode | Mobile |
|---------|-----------|--------|
| ![AI Rule](assets/screenshots/04-ai-rule.svg) | ![Dark Mode](assets/screenshots/05-dark-mode.svg) | ![Mobile](assets/screenshots/06-mobile.svg) |

Replace SVG placeholders with PNG captures before submission. See [assets/screenshots/README.md](assets/screenshots/README.md).

---

## Documentation

| Document | Description |
|----------|-------------|
| [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) | Vercel, Netlify, GitHub Pages |
| [docs/LOOM_SCRIPT.md](docs/LOOM_SCRIPT.md) | 3-minute demo script |
| [docs/SUBMISSION_CHECKLIST.md](docs/SUBMISSION_CHECKLIST.md) | Pre-submission checklist |
| [docs/FINAL_QA_REPORT.md](docs/FINAL_QA_REPORT.md) | QA audit report |
| [docs/NATURAL_LANGUAGE_RULES.md](docs/NATURAL_LANGUAGE_RULES.md) | AI rule architecture |

---

## Future Improvements

- Serverless Claude proxy (hide API key from client)
- Authentication and user accounts
- Rule and cart persistence (database)
- Multiple currencies
- Coupon codes and promotional campaigns

---

## License

[MIT](LICENSE)

---

## Author

**Vijayshree**

- LinkedIn: [linkedin.com/in/vijayshreevaibhav](https://www.linkedin.com/in/vijayshreevaibhav)

---

<p align="center">Built for the Opptra FDE Assignment · Discount Engine</p>
<p align="center">Built by <a href="https://www.linkedin.com/in/vijayshreevaibhav">Vijayshree</a></p>
