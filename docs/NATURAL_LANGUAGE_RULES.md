# Natural Language Rule Input

## Architecture

The natural-language feature is a **separate AI layer** that produces validated `DiscountRule` objects for the existing engine. The discount engine never calls the LLM.

```
React UI
    ↓
Anthropic Claude (Messages API)
    ↓
Rule Validator (schema + ambiguity)
    ↓
Pricing Engine (unchanged)
```

```
NaturalLanguageRuleInput (UI)
        ↓
   llmService.js          ← Claude API call + JSON parse
        ↓
   ruleValidator.js       ← schema + duplicate checks
        ↓
RuleConfirmationDialog     ← user edit + explicit confirm
        ↓
   generateRuleId.js      ← local RULE-001, RULE-002, …
        ↓
   App state (rules[])     → processCart() recalculates
```

## Module Responsibilities

| Module | Responsibility |
|--------|----------------|
| `services/promptBuilder.js` | System prompt, few-shot examples, unsupported/ambiguous patterns |
| `services/llmService.js` | Anthropic Claude Messages API, JSON extraction, orchestrates validation |
| `validators/ruleValidator.js` | Schema validation, duplicate detection, draft → DiscountRule mapping |
| `types/ruleSchema.js` | LLM dialect ↔ engine dialect normalisation |
| `utils/generateRuleId.js` | Sequential local IDs (never trusts AI) |
| `utils/parseLlmJson.js` | Safe JSON extraction from LLM text |
| `components/NaturalLanguageRuleInput.jsx` | Textarea, parse button, loading, errors |
| `components/RuleConfirmationDialog.jsx` | Edit + Confirm + Cancel |
| `components/RulePreviewCard.jsx` | Human-readable preview with chips |

## Prompt Strategy

- **JSON-only** output enforced via system prompt (temperature 0)
- **Few-shot examples** for Brand, Platform, Cart rules
- **Unsupported patterns** (BOGO, free shipping) must return `{ "error": "..." }`
- **Ambiguous input** must return `{ "ambiguity": { "message", "options" } }` — never guess

## Validation Strategy

1. **LLM response** — error / ambiguity / schema mapping
2. **Confirmation dialog** — user can edit all fields
3. **On confirm** — full validation including duplicate definition check
4. **Rule ID** — assigned locally at confirm time

## Failure Handling

| Failure | User message |
|---------|--------------|
| Empty input | "Please describe a discount rule…" |
| Missing API key | "Add VITE_ANTHROPIC_API_KEY to your .env file" |
| Authentication | "Claude API Error: Invalid API key…" |
| Rate limit | "Claude API Error: Rate limit exceeded…" |
| Network / timeout | Friendly retry message (no raw exception) |
| Malformed JSON | "Could not parse the AI response…" |
| Unsupported rule | LLM error message surfaced |
| Ambiguity | Question + clickable option suggestions |
| Duplicate rule | "This rule duplicates existing rule RULE-XXX" |

## Tradeoffs

- **Client-side API key** — simple Vercel deploy; key visible in bundle. Production would use a serverless proxy.
- **Anthropic Claude dependency** — requires network; tests use injected `callLlm` mock.
- **No auto-insert** — extra click for safety; prevents hallucinated rules entering the engine.

## Setup

```bash
cp .env.example .env
# Add VITE_ANTHROPIC_API_KEY=YOUR_KEY
npm run dev
```

The Natural Language Rule feature requires an Anthropic API key. All pricing engine functionality works without an API key.

Navigate to **Discount Rules → Create Rule with AI**, describe a rule, parse, confirm.

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `VITE_ANTHROPIC_API_KEY` | For AI rules | Anthropic API key |
| `VITE_ANTHROPIC_MODEL` | No | Override model (default: `claude-sonnet-4-6`) |
