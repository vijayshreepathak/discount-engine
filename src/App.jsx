/**
 * App.jsx — orchestration only. No discount, parsing, or AI logic.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import Header from './components/layout/Header.jsx'
import CsvUploader from './components/CsvUploader.jsx'
import DataTable from './components/DataTable.jsx'
import ErrorBanner from './components/ErrorBanner.jsx'
import NaturalLanguageRuleInput from './components/NaturalLanguageRuleInput.jsx'
import CartSummaryPanel from './components/CartSummaryPanel.jsx'
import RuleHistoryPanel from './components/RuleHistoryPanel.jsx'
import ProcessingTimeline from './components/ProcessingTimeline.jsx'
import SavingsBreakdown from './components/SavingsBreakdown.jsx'
import StatusBadge from './components/ui/StatusBadge.jsx'
import KpiCard from './components/ui/KpiCard.jsx'
import EmptyState from './components/ui/EmptyState.jsx'
import { ToastContainer } from './components/Toast.jsx'
import { parseRulesCSV, parseCartCSV } from './engine/csvParser.js'
import { processCart } from './engine/discountEngine.js'
import { formatCurrency } from './utils/formatCurrency.js'
import { downloadResultsCsv } from './utils/exportResultsCsv.js'
import { downloadRulesCsv } from './utils/exportRulesCsv.js'
import { useTheme } from './hooks/useTheme.js'
import { useToast } from './hooks/useToast.js'

export default function App() {
  const { theme, toggleTheme } = useTheme()
  const { toasts, show, dismiss } = useToast()

  const [rules, setRules] = useState([])
  const [rulesErrors, setRulesErr] = useState([])
  const [rulesFileName, setRulesFileName] = useState('')
  const [ruleHistory, setRuleHistory] = useState([])
  const [aiRules, setAiRules] = useState([])

  const [cartItems, setCartItems] = useState([])
  const [cartErrors, setCartErrors] = useState([])
  const [cartFileName, setCartFileName] = useState('')

  const [results, setResults] = useState(null)
  const [calculating, setCalculating] = useState(false)
  const [showTimeline, setShowTimeline] = useState(false)
  const [rulesUploadedAt, setRulesUploadedAt] = useState(null)
  const [cartUploadedAt, setCartUploadedAt] = useState(null)
  const [ruleSearch, setRuleSearch] = useState('')
  const [resultFilter, setResultFilter] = useState('')
  const resultsRef = useRef(null)
  const scrollToResultsRef = useRef(false)

  const handleRulesLoad = useCallback(
    (csvText, fileName) => {
      const { data, errors } = parseRulesCSV(csvText)
      setRules(data)
      setRulesErr(errors)
      setRulesFileName(fileName)
      setResults(null)
      setShowTimeline(false)
      setRulesUploadedAt(new Date())
      if (data.length && !errors.length) {
        show(`${data.length} rule${data.length > 1 ? 's' : ''} loaded`, 'success')
      } else if (errors.length) {
        show('Rules CSV has validation issues', 'warning')
      }
    },
    [show]
  )

  const applyCartParseResult = useCallback(
    (data, errors, fileName) => {
      setCartItems(data)
      setCartErrors(errors)
      setCartFileName(fileName)
      setResults(null)
      setShowTimeline(false)
      setCartUploadedAt(new Date())
      if (data.length && !errors.length) {
        show(`${data.length} item${data.length > 1 ? 's' : ''} loaded`, 'success')
      } else if (errors.length) {
        show('Cart file has validation issues', 'warning')
      }
    },
    [show]
  )

  const handleCartFile = useCallback(
    async (file) => {
      const fileName = file.name
      if (fileName.toLowerCase().endsWith('.pdf')) {
        const { parseCartPDF } = await import('./engine/pdfParser.js')
        const { data, errors } = await parseCartPDF(await file.arrayBuffer())
        applyCartParseResult(data, errors, fileName)
        return
      }

      const text = await file.text()
      const { data, errors } = parseCartCSV(text)
      applyCartParseResult(data, errors, fileName)
    },
    [applyCartParseResult]
  )

  const handleCalculate = useCallback(() => {
    setCalculating(true)
    setShowTimeline(false)
    scrollToResultsRef.current = true
    setTimeout(() => {
      setResults(processCart(cartItems, rules))
      setCalculating(false)
      setShowTimeline(true)
      show('Discounts calculated successfully', 'success')
    }, 480)
  }, [cartItems, rules, show])

  useEffect(() => {
    if (!results || calculating || !scrollToResultsRef.current) return
    scrollToResultsRef.current = false
    const frame = requestAnimationFrame(() => {
      resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    })
    return () => cancelAnimationFrame(frame)
  }, [results, calculating])

  const handleRuleConfirmed = useCallback(
    (newRule, prompt = '') => {
      setRuleHistory((h) => [...h, rules])
      const updated = [...rules, newRule]
      setRules(updated)
      setAiRules((a) => [...a, { rule: newRule, prompt, addedAt: Date.now() }])
      if (cartItems.length > 0 && cartErrors.length === 0) {
        setResults(processCart(cartItems, updated))
        setShowTimeline(true)
      }
    },
    [rules, cartItems, cartErrors]
  )

  const handleUndoRule = useCallback(() => {
    if (!ruleHistory.length) return
    const prev = ruleHistory[ruleHistory.length - 1]
    setRules(prev)
    setRuleHistory((h) => h.slice(0, -1))
    setAiRules((a) => a.slice(0, -1))
    if (cartItems.length > 0) {
      setResults(processCart(cartItems, prev))
    }
    show('Last rule addition undone', 'info')
  }, [ruleHistory, cartItems, show])

  const canCalculate =
    rules.length > 0 && cartItems.length > 0 && rulesErrors.length === 0 && cartErrors.length === 0

  const baseTotal = useMemo(
    () => cartItems.reduce((s, i) => s + i.basePrice, 0),
    [cartItems]
  )

  const filteredRules = useMemo(() => {
    if (!ruleSearch.trim()) return rules
    const q = ruleSearch.toLowerCase()
    return rules.filter(
      (r) =>
        r.ruleId.toLowerCase().includes(q) ||
        r.appliesTo?.toLowerCase().includes(q) ||
        r.scope.includes(q)
    )
  }, [rules, ruleSearch])

  const filteredResults = useMemo(() => {
    if (!results) return []
    if (!resultFilter.trim()) return results.items
    const q = resultFilter.toLowerCase()
    return results.items.filter(
      (r) =>
        r.itemId.toLowerCase().includes(q) ||
        r.product.toLowerCase().includes(q) ||
        r.brand.toLowerCase().includes(q) ||
        r.status.toLowerCase().includes(q)
    )
  }, [results, resultFilter])

  const analytics = useMemo(() => {
    if (!results) return null
    const itemSavings = results.items.reduce((s, i) => s + i.totalDiscount, 0)
    const rulesApplied = new Set(
      results.items.flatMap((i) => i.appliedRules).concat(results.cartSummary.appliedCartRules)
    )
    const stackedCount = results.items.filter((i) => i.status === 'Stacked').length
    const totalSavings = itemSavings + results.cartSummary.cartDiscount
    const savingsPct = baseTotal > 0 ? ((totalSavings / baseTotal) * 100).toFixed(1) : '0'

    return {
      totalItems: results.items.length,
      rulesApplied: rulesApplied.size,
      stackedCount,
      totalSavings,
      savingsPct,
      finalAmount: results.cartSummary.finalTotal,
      itemSavings,
    }
  }, [results, baseTotal])

  const rulesColumns = useMemo(
    () => [
      { key: 'ruleId', label: 'Rule ID' },
      {
        key: 'scope',
        label: 'Scope',
        render: (v) => <span className="badge badge--neutral">{v.charAt(0).toUpperCase() + v.slice(1)}</span>,
      },
      { key: 'appliesTo', label: 'Applies To', render: (v) => v || 'Entire cart' },
      {
        key: 'type',
        label: 'Type',
        render: (v) => (
          <span className={`badge ${v === 'percentage' ? 'badge--info' : 'badge--purple'}`}>
            {v.charAt(0).toUpperCase() + v.slice(1)}
          </span>
        ),
      },
      {
        key: 'value',
        label: 'Value',
        render: (v, row) => (row.type === 'percentage' ? `${v}% off` : formatCurrency(v) + ' off'),
      },
      {
        key: 'minCartValue',
        label: 'Min Cart',
        render: (v) => (v != null ? formatCurrency(v) : '—'),
      },
      {
        key: 'stackable',
        label: 'Stackable',
        render: (v) => (
          <span className={`badge ${v ? 'badge--success' : 'badge--neutral'}`}>{v ? 'Yes' : 'No'}</span>
        ),
      },
    ],
    []
  )

  const cartColumns = useMemo(
    () => [
      { key: 'itemId', label: 'Item' },
      { key: 'product', label: 'Product' },
      { key: 'brand', label: 'Brand' },
      { key: 'platform', label: 'Platform' },
      { key: 'basePrice', label: 'Base Price', render: (v) => formatCurrency(v) },
    ],
    []
  )

  const resultsColumns = useMemo(
    () => [
      { key: 'itemId', label: 'Item' },
      { key: 'product', label: 'Product' },
      { key: 'brand', label: 'Brand' },
      { key: 'platform', label: 'Platform' },
      { key: 'basePrice', label: 'Base Price', render: (v) => formatCurrency(v) },
      {
        key: 'appliedRules',
        label: 'Applied Rules',
        render: (v) => (v.length ? v.join(' + ') : '—'),
      },
      {
        key: 'totalDiscount',
        label: 'Savings',
        render: (v) =>
          v > 0 ? (
            <span className="table__savings">{formatCurrency(v)}</span>
          ) : (
            <span className="table__muted">—</span>
          ),
      },
      {
        key: 'reasoning',
        label: 'Explanation',
        render: (v, row) => (
          <span className={row.status === 'No offer' ? 'table__muted' : 'table__explanation'}>{v}</span>
        ),
      },
      {
        key: 'finalPrice',
        label: 'Final Price',
        render: (v, row) => (
          <span className={row.totalDiscount > 0 ? 'table__final table__final--discounted' : 'table__final'}>
            {formatCurrency(v)}
          </span>
        ),
      },
      { key: 'status', label: 'Status', render: (v) => <StatusBadge status={v} /> },
    ],
    []
  )

  function copyLastRuleJson() {
    const last = aiRules[aiRules.length - 1]?.rule ?? rules[rules.length - 1]
    if (!last) return
    navigator.clipboard.writeText(JSON.stringify(last, null, 2))
    show('Rule JSON copied to clipboard', 'info')
  }

  function copyLastPrompt() {
    const last = aiRules[aiRules.length - 1]?.prompt
    if (!last) { show('No AI prompt to copy', 'warning'); return }
    navigator.clipboard.writeText(last)
    show('Prompt copied to clipboard', 'info')
  }

  return (
    <div className="app">
      <Header theme={theme} onToggleTheme={toggleTheme} />
      <ToastContainer toasts={toasts} onDismiss={dismiss} />

      <main className="main">
        <div className="grid-2">
          <section className="card" aria-labelledby="rules-heading">
            <div className="card__header">
              <div>
                <h2 id="rules-heading" className="card__title">Discount Rules</h2>
                <p className="card__desc">Create rules with AI or upload a CSV file</p>
                <div className="card__accent" />
              </div>
            </div>

            <NaturalLanguageRuleInput
              existingRules={rules}
              onRuleConfirmed={handleRuleConfirmed}
              onToast={show}
            />

            <div className="section-divider">
              <span>Or upload rules CSV</span>
            </div>

            <CsvUploader
              label="rules.csv"
              description="Drag and drop or browse to upload"
              onLoad={handleRulesLoad}
              itemCount={rules.length}
              itemLabel={rules.length === 1 ? 'Rule' : 'Rules'}
              fileName={rulesFileName}
              errorCount={rulesErrors.length}
              uploadedAt={rulesUploadedAt}
            />
            <ErrorBanner errors={rulesErrors} />

            <RuleHistoryPanel
              aiRules={aiRules}
              canUndo={ruleHistory.length > 0}
              onUndo={handleUndoRule}
              onCopyJson={copyLastRuleJson}
              onCopyPrompt={copyLastPrompt}
              onExport={() => { downloadRulesCsv(rules); show('Rules exported', 'success') }}
            />

            {rules.length > 0 ? (
              <>
                <div className="toolbar section-block">
                  <input
                    type="search"
                    className="toolbar__search"
                    placeholder="Search rules…"
                    value={ruleSearch}
                    onChange={(e) => setRuleSearch(e.target.value)}
                    aria-label="Search rules"
                  />
                </div>
                <DataTable columns={rulesColumns} rows={filteredRules} sortable emptyMessage="No matching rules" />
              </>
            ) : (
              <EmptyState
                variant="rules"
                title="No rules yet"
                description="Create a rule with AI above, or upload a rules CSV file."
                action={
                  <button type="button" className="btn btn--secondary btn--sm" onClick={() => document.getElementById('nl-rule-input')?.focus()}>
                    Write a rule
                  </button>
                }
              />
            )}
          </section>

          <section className="card" aria-labelledby="cart-heading">
            <div className="card__header">
              <div>
                <h2 id="cart-heading" className="card__title">Cart Items</h2>
                <p className="card__desc">Upload cart CSV or PDF to calculate discounts</p>
                <div className="card__accent" />
              </div>
            </div>

            <CsvUploader
              label="cart.csv or cart.pdf"
              description="Drag and drop CSV or PDF, or browse to upload"
              accept=".csv,.pdf"
              onLoadFile={handleCartFile}
              itemCount={cartItems.length}
              itemLabel={cartItems.length === 1 ? 'Item' : 'Items'}
              fileName={cartFileName}
              errorCount={cartErrors.length}
              uploadedAt={cartUploadedAt}
            />
            <ErrorBanner errors={cartErrors} />

            {cartItems.length > 0 ? (
              <div className="section-block">
                <DataTable columns={cartColumns} rows={cartItems} sortable />
              </div>
            ) : (
              <EmptyState
                variant="cart"
                title="No cart items"
                description="Upload a cart CSV or PDF with item_id, product, brand, platform, and base_price."
              />
            )}
          </section>
        </div>

        <div className="section-actions">
          <button
            type="button"
            className="btn btn--primary btn--lg"
            onClick={handleCalculate}
            disabled={!canCalculate || calculating}
            aria-busy={calculating}
          >
            {calculating ? (
              <>
                <span className="spinner" aria-hidden /> Calculating…
              </>
            ) : (
              'Calculate Discounts'
            )}
          </button>
          {!canCalculate && (
            <p className="calculate-hint">Upload both rules and cart files to calculate</p>
          )}
        </div>

        {calculating && (
          <div className="card section-block--lg">
            <div className="kpi-grid kpi-grid--skeleton">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="kpi">
                  <div className="skeleton skeleton--sm" />
                  <div className="skeleton skeleton--lg" />
                </div>
              ))}
            </div>
          </div>
        )}

        {results && analytics && !calculating && (
          <section
            ref={resultsRef}
            className="results-section card"
            aria-labelledby="results-heading"
            tabIndex={-1}
          >
            <div className="card__header results-section__header">
              <div>
                <h2 id="results-heading" className="card__title">Pricing Results</h2>
                <p className="card__desc">Item-level discounts, savings breakdown, and cart summary</p>
              </div>
              <div className="btn-group">
                <button
                  type="button"
                  className="btn btn--secondary btn--sm"
                  onClick={() => { downloadResultsCsv(results); show('Results exported', 'success') }}
                >
                  Export Results
                </button>
              </div>
            </div>

            <div className="results-section__body">
              {showTimeline && <ProcessingTimeline visible />}

              <div className="kpi-grid">
                <KpiCard label="Total Items" value={analytics.totalItems} icon="items" />
                <KpiCard label="Rules Applied" value={analytics.rulesApplied} icon="rules" accent />
                <KpiCard label="Stacked Discounts" value={analytics.stackedCount} icon="stacked" />
                <KpiCard label="Total Savings" value={analytics.totalSavings} prefix="Rs." green icon="savings" />
                <KpiCard label="Savings %" value={analytics.savingsPct} suffix="%" icon="percent" green />
                <KpiCard label="Final Total" value={analytics.finalAmount} prefix="Rs." accent icon="final" />
              </div>

              <SavingsBreakdown
                baseTotal={baseTotal}
                totalSavings={analytics.totalSavings}
                finalTotal={analytics.finalAmount}
              />

              <div className="toolbar">
                <input
                  type="search"
                  className="toolbar__search"
                  placeholder="Filter by item, brand, status…"
                  value={resultFilter}
                  onChange={(e) => setResultFilter(e.target.value)}
                  aria-label="Filter results"
                />
              </div>

              <DataTable columns={resultsColumns} rows={filteredResults} sticky sortable emptyMessage="No matching results" />

              <CartSummaryPanel
                cartSummary={results.cartSummary}
                itemSavings={analytics.itemSavings}
                rulesAppliedCount={analytics.rulesApplied}
                itemCount={analytics.totalItems}
                baseTotal={baseTotal}
              />
            </div>
          </section>
        )}

        {!results && !calculating && canCalculate && (
          <div className="ready-hint" role="status">
            <p className="ready-hint__text">
              Rules and cart are loaded. Click <strong>Calculate Discounts</strong> above to view pricing results.
            </p>
          </div>
        )}
      </main>
    </div>
  )
}
