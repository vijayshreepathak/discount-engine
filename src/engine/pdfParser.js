/**
 * pdfParser.js
 *
 * Extracts cart table rows from PDF and maps them to CartItem objects.
 * Reuses mapCartRow from csvParser — no duplicated validation logic.
 * Does not modify csvParser, discountEngine, or validators.
 */

import * as pdfjsLib from 'pdfjs-dist/build/pdf.mjs'
import { mapCartRow } from './csvParser.js'

pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url,
).href

const REQUIRED_COLUMNS = ['item_id', 'product', 'brand', 'platform', 'base_price']

const HEADER_ALIASES = {
  item_id: ['item_id', 'itemid', 'item'],
  product: ['product', 'description', 'item_description'],
  brand: ['brand'],
  platform: ['platform'],
  base_price: ['base_price', 'baseprice', 'price'],
}

function normaliseHeaderToken(token) {
  const key = token.trim().toLowerCase().replace(/\s+/g, '_')
  for (const [canonical, aliases] of Object.entries(HEADER_ALIASES)) {
    if (aliases.includes(key)) return canonical
  }
  return key
}

function isHeaderRow(values) {
  const normalised = values.map(normaliseHeaderToken)
  return REQUIRED_COLUMNS.every((col) => normalised.includes(col))
}

/**
 * Groups PDF text items into table rows by Y position, columns sorted by X.
 * @param {{ str: string, x: number, y: number }[]} items
 */
function clusterIntoRows(items, yTolerance = 4) {
  const rowMap = new Map()

  for (const item of items) {
    const yKey = Math.round(item.y / yTolerance) * yTolerance
    if (!rowMap.has(yKey)) rowMap.set(yKey, [])
    rowMap.get(yKey).push(item)
  }

  return [...rowMap.entries()]
    .sort((a, b) => b[0] - a[0])
    .map(([, cells]) => cells.sort((a, b) => a.x - b.x).map((c) => c.str.trim()))
    .filter((row) => row.some(Boolean))
}

async function extractTextItems(arrayBuffer) {
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer.slice(0) }).promise
  const items = []

  for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
    const page = await pdf.getPage(pageNum)
    const content = await page.getTextContent()

    for (const item of content.items) {
      const text = item.str?.trim()
      if (!text) continue
      items.push({
        str: text,
        x: item.transform[4],
        y: item.transform[5],
      })
    }
  }

  return items
}

async function extractPlainTextLines(arrayBuffer) {
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer.slice(0) }).promise
  const lines = []

  for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
    const page = await pdf.getPage(pageNum)
    const content = await page.getTextContent()
    const pageText = content.items.map((item) => item.str).join(' ')
    lines.push(...pageText.split(/\r?\n/))
  }

  return lines.map((line) => line.trim()).filter(Boolean)
}

function parseDelimitedLine(line) {
  if (line.includes(',')) return line.split(',').map((s) => s.trim())
  if (line.includes('\t')) return line.split('\t').map((s) => s.trim())
  const spaced = line.split(/\s{2,}/).map((s) => s.trim()).filter(Boolean)
  return spaced.length >= 4 ? spaced : null
}

function buildRowObject(headers, values) {
  const row = {}
  headers.forEach((header, index) => {
    row[header] = values[index] ?? ''
  })
  return row
}

function parseMatrixRows(matrix) {
  if (matrix.length < 1) {
    return { data: [], errors: ['No table data found in PDF'] }
  }

  let headerIndex = matrix.findIndex(isHeaderRow)
  let headers
  let startIndex

  if (headerIndex >= 0) {
    headers = matrix[headerIndex].map(normaliseHeaderToken)
    startIndex = headerIndex + 1
    const missing = REQUIRED_COLUMNS.filter((col) => !headers.includes(col))
    if (missing.length) {
      return { data: [], errors: [`PDF table missing columns: ${missing.join(', ')}`] }
    }
  } else if (matrix[0].length >= 5) {
    headers = REQUIRED_COLUMNS
    startIndex = 0
  } else {
    return {
      data: [],
      errors: ['Could not detect cart table headers. Expected: item_id, product, brand, platform, base_price'],
    }
  }

  const data = []
  const errors = []

  for (let i = startIndex; i < matrix.length; i++) {
    const values = matrix[i]
    if (!values.length || values.every((cell) => !cell)) continue
    if (isHeaderRow(values)) continue

    const rowObj = buildRowObject(headers, values)
    const { item, error } = mapCartRow(rowObj, i + 1)
    if (error) {
      errors.push(error.replace(/^Row/, 'PDF row'))
    } else {
      data.push(item)
    }
  }

  if (!data.length) {
    return {
      data: [],
      errors: errors.length ? errors : ['No valid cart rows found in PDF'],
    }
  }

  return { data, errors }
}

/**
 * Parses a cart PDF into CartItem objects.
 * @param {ArrayBuffer} arrayBuffer
 * @returns {Promise<{ data: import('../types.js').CartItem[], errors: string[] }>}
 */
export async function parseCartPDF(arrayBuffer) {
  if (!arrayBuffer?.byteLength) {
    return { data: [], errors: ['Empty PDF file'] }
  }

  try {
    const positionedItems = await extractTextItems(arrayBuffer)
    let matrix = clusterIntoRows(positionedItems)

    if (matrix.length < 2) {
      const lines = await extractPlainTextLines(arrayBuffer)
      matrix = lines.map(parseDelimitedLine).filter(Boolean)
    }

    return parseMatrixRows(matrix)
  } catch (err) {
    return { data: [], errors: [`Failed to parse PDF: ${err.message}`] }
  }
}
