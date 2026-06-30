/**
 * CSV upload zone with drag-drop, progress, validation summary, and timestamp.
 */

import { useCallback, useRef, useState } from 'react'

function formatFileSize(bytes) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function formatTimestamp(date) {
  if (!date) return null
  return new Intl.DateTimeFormat(undefined, {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }).format(date)
}

/**
 * @param {{
 *   label: string,
 *   description: string,
 *   accept?: string,
 *   onLoad: (text: string, fileName: string) => void,
 *   onLoadFile?: (file: File) => void | Promise<void>,
 *   itemCount?: number,
 *   itemLabel?: string,
 *   fileName?: string,
 *   errorCount?: number,
 *   uploadedAt?: Date | null,
 * }} props
 */
export default function CsvUploader({
  label,
  description,
  accept = '.csv',
  onLoad,
  onLoadFile,
  itemCount = 0,
  itemLabel = 'items',
  fileName = '',
  errorCount = 0,
  uploadedAt = null,
}) {
  const inputRef = useRef(null)
  const [dragging, setDragging] = useState(false)
  const [loading, setLoading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [lastMeta, setLastMeta] = useState(null)
  const [uploadMs, setUploadMs] = useState(null)
  const [justLoaded, setJustLoaded] = useState(false)

  const hasData = itemCount > 0
  const hasErrors = errorCount > 0
  const isValid = hasData && !hasErrors

  const processFile = useCallback(
    async (file) => {
      if (!file) return
      const start = performance.now()
      setLoading(true)
      setProgress(0)
      setJustLoaded(false)
      setLastMeta({ name: file.name, size: file.size })

      const tick = setInterval(() => {
        setProgress((p) => Math.min(p + 12, 90))
      }, 40)

      try {
        if (onLoadFile) {
          await onLoadFile(file)
        } else {
          await new Promise((resolve, reject) => {
            const reader = new FileReader()
            reader.onload = (evt) => {
              onLoad(evt.target.result, file.name)
              resolve()
            }
            reader.onerror = () => reject(new Error('Failed to read file'))
            reader.readAsText(file)
          })
        }

        clearInterval(tick)
        setProgress(100)
        setUploadMs(Math.round(performance.now() - start))
        setTimeout(() => {
          setLoading(false)
          setJustLoaded(true)
          setTimeout(() => setJustLoaded(false), 1000)
        }, 180)
      } catch {
        clearInterval(tick)
        setLoading(false)
        setProgress(0)
      }
    },
    [onLoad, onLoadFile]
  )

  const stateClass = [
    loading && 'upload--loading',
    isValid && 'upload--success',
    hasErrors && 'upload--error',
    dragging && 'upload--drag',
    justLoaded && 'upload--celebrate',
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <div
      className={`upload ${stateClass}`}
      onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
      onDragLeave={() => setDragging(false)}
      onDrop={(e) => { e.preventDefault(); setDragging(false); processFile(e.dataTransfer.files?.[0]) }}
      onClick={() => !loading && inputRef.current?.click()}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); inputRef.current?.click() }
      }}
      role="button"
      tabIndex={0}
      aria-label={`Upload ${label}`}
    >
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        className="sr-only"
        onChange={(e) => { processFile(e.target.files?.[0]); e.target.value = '' }}
      />

      <div className="upload__icon" aria-hidden>
        {loading ? (
          <span className="spinner spinner--dark" />
        ) : isValid ? (
          <span className="upload__check">✓</span>
        ) : hasErrors ? (
          <span className="upload__warn">!</span>
        ) : (
          <span className="upload__file-icon" />
        )}
      </div>

      <div className="upload__label">{label}</div>
      <div className="upload__hint">
        {loading ? 'Reading and validating…' : hasData ? fileName || lastMeta?.name : description}
      </div>

      {loading && (
        <div className="upload__progress" role="progressbar" aria-valuenow={progress} aria-valuemin={0} aria-valuemax={100}>
          <div className="upload__progress-fill" style={{ width: `${progress}%` }} />
        </div>
      )}

      {isValid && !loading && (
        <div className="upload__summary" role="status">
          <div className="upload__summary-row upload__summary-row--success">
            <span>{itemCount} {itemLabel} imported</span>
            <span>All rows valid</span>
          </div>
          <div className="upload__summary-meta">
            {lastMeta && <span>{formatFileSize(lastMeta.size)}</span>}
            {uploadMs != null && <span>{uploadMs}ms</span>}
            {uploadedAt && <span>{formatTimestamp(uploadedAt)}</span>}
          </div>
        </div>
      )}

      {hasErrors && !loading && hasData && (
        <div className="upload__summary upload__summary--warn" role="status">
          <div className="upload__summary-row">
            <span>{itemCount} {itemLabel} imported</span>
            <span>{errorCount} validation issue{errorCount > 1 ? 's' : ''}</span>
          </div>
          {uploadedAt && (
            <div className="upload__summary-meta">
              <span>Uploaded {formatTimestamp(uploadedAt)}</span>
            </div>
          )}
        </div>
      )}

      {!loading && (
        <div className="upload__browse">
          <button
            type="button"
            className="btn btn--secondary btn--sm"
            onClick={(e) => { e.stopPropagation(); inputRef.current?.click() }}
          >
            Browse files
          </button>
        </div>
      )}
    </div>
  )
}
