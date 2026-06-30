# Loom Walkthrough Script (~3 minutes)

> Record at **1920×1080**, browser zoom **100%**. Pre-load `sample-data/rules.csv` and `sample-data/cart.csv` in a folder for drag-and-drop.

---

## 1. Introduction (0:00 – 0:25)

**Say:**

> "Hi, I'm [Your Name]. This is the Opptra Discount Engine — a customer-facing pricing application built with React and Vite. It calculates item-level and cart-level discounts from CSV rules, supports PDF cart upload, natural-language rule creation, and exports professional pricing results."

**Show:** App home — Opptra header, rules panel, cart panel, dark mode toggle.

---

## 2. Architecture (0:25 – 0:45)

**Say:**

> "The architecture separates concerns cleanly. React handles presentation. CSV and PDF parsers convert uploads into typed objects. Validators check AI output. The discount engine is pure JavaScript with 42 unit tests — it knows nothing about React, files, or AI."

**Show:** README architecture diagram (optional quick scroll).

---

## 3. CSV Upload — Rules & Cart (0:45 – 1:15)

**Action:** Drag-drop `sample-data/rules.csv` into the rules upload zone.

**Say:**

> "Rules upload validates every row — scope, type, value, stackable flag, and cart thresholds. You get row count, validation summary, and timestamp on success."

**Action:** Drag-drop `sample-data/cart.csv` into the cart upload zone.

**Say:**

> "Cart CSV accepts item ID, product, brand, platform, and base price. Both files must pass validation before Calculate is enabled."

**Show:** Green success states, rules table preview, cart table preview.

---

## 4. Calculate & Results (1:15 – 1:50)

**Action:** Click **Calculate Discounts**.

**Say:**

> "The processing timeline walks through each stage. KPI cards show items, rules applied, stacked discounts, total savings, and final amount. ITEM-01 gets max discount — 15% beats Rs.150 flat. ITEM-02 stacks brand flat with platform percentage. The cart offer applies 10% because the subtotal exceeds Rs.4,000."

**Show:** Results table with status badges, savings breakdown, order summary with **Final Cart Total** highlighted.

---

## 5. Natural Language Rule (1:50 – 2:25)

**Say:**

> "Now the AI feature — optional, requires an Anthropic API key."

**Action:** Type `20% off Nordic Basics` → click **Parse Rule**.

**Say:**

> "Before any rule enters the engine, I review a confirmation dialog with preview, confidence score, validation checklist, and business impact. I can edit fields. Only on Confirm does the rule get a local ID and recalculate."

**Action:** Confirm rule → show rule history timeline.

---

## 6. PDF Upload & Export (2:25 – 2:50)

**Say:**

> "Cart data can also come from PDF — pdf.js extracts the table and reuses the same validation as CSV."

**Action:** (Optional) Upload a cart PDF, or mention capability.

**Action:** Click **Export Results**.

**Say:**

> "Export includes every item row plus cart subtotal, cart offer, final total, and an export timestamp — machine-readable CSV."

---

## 7. Closing (2:50 – 3:00)

**Say:**

> "The engine is fully tested against the assignment sample — Rs.5,339 final total. It deploys as a static Vite build to Vercel or Netlify. Thanks for watching."

**Show:** Dark mode toggle (5 seconds) or mobile responsive layout.

---

## Recording Checklist

- [ ] `.env` configured if demoing AI
- [ ] Sample CSVs ready to drag-drop
- [ ] No console errors visible (F12 closed)
- [ ] Light mode first, dark mode snippet at end
- [ ] Speak clearly, ~3 minutes total
