/**
 * Data table with sticky header, hover rows, and optional client-side sort.
 */

import { memo, useMemo, useState } from 'react'
import EmptyState from './ui/EmptyState.jsx'

function DataTable({
  columns,
  rows,
  emptyMessage,
  emptyIcon,
  emptyAction,
  sticky = false,
  sortable = false,
}) {
  const [sortKey, setSortKey] = useState(null)
  const [sortDir, setSortDir] = useState('asc')

  const sortedRows = useMemo(() => {
    if (!sortKey || !sortable) return rows ?? []
    const copy = [...rows]
    copy.sort((a, b) => {
      const av = a[sortKey]
      const bv = b[sortKey]
      if (typeof av === 'number' && typeof bv === 'number') {
        return sortDir === 'asc' ? av - bv : bv - av
      }
      return sortDir === 'asc'
        ? String(av ?? '').localeCompare(String(bv ?? ''))
        : String(bv ?? '').localeCompare(String(av ?? ''))
    })
    return copy
  }, [rows, sortKey, sortDir, sortable])

  function toggleSort(key) {
    if (!sortable) return
    if (sortKey === key) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    else { setSortKey(key); setSortDir('asc') }
  }

  if (!rows?.length) {
    return (
      <EmptyState
        icon={emptyIcon ?? '📋'}
        title={emptyMessage ?? 'No data loaded'}
        description="Upload a file or add data to see it here."
        action={emptyAction}
      />
    )
  }

  return (
    <div className={`table-wrap${sticky ? ' table-wrap--sticky' : ''}`}>
      <table className="table">
        <thead>
          <tr>
            {columns.map((col) => (
              <th
                key={col.key}
                scope="col"
                className={sortable ? 'table__th--sortable' : ''}
                onClick={() => toggleSort(col.key)}
                aria-sort={sortKey === col.key ? (sortDir === 'asc' ? 'ascending' : 'descending') : undefined}
              >
                {col.label}
                {sortable && sortKey === col.key && (
                  <span className="table__sort-icon" aria-hidden>{sortDir === 'asc' ? '↑' : '↓'}</span>
                )}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {sortedRows.map((row, i) => (
            <tr key={row.itemId ?? row.ruleId ?? i}>
              {columns.map((col) => (
                <td key={col.key}>
                  {col.render ? col.render(row[col.key], row) : row[col.key] ?? '—'}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default memo(DataTable)
