import { useRef, useState } from 'react'
import { Icon, Spinner } from './ReviewLensUI'

const formatBytes = bytes => bytes < 1024 * 1024
  ? `${Math.max(1, Math.round(bytes / 1024))} KB`
  : `${(bytes / (1024 * 1024)).toFixed(1)} MB`

export default function UploadPanel({ file, onFile, onSubmit, loading, busy, error, result, onReset }) {
  const input = useRef(null)
  const [isDragging, setIsDragging] = useState(false)

  const handleFile = nextFile => {
    if (nextFile) onFile(nextFile)
  }

  return (
    <form
      onSubmit={onSubmit}
      className="bento-card relative flex flex-col justify-between overflow-hidden p-6 sm:p-7 shadow-[0_8px_32px_rgba(0,0,0,0.5)]"
    >
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-[#ff8a4c]" />
            <p className="font-mono text-[10.5px] font-semibold uppercase tracking-[0.14em] text-[#ff8a4c]">CSV INGESTION</p>
          </div>
          <h2 className="mt-1 text-lg font-semibold tracking-tight text-[#f5f5f4]">Import Customer Reviews</h2>
          <p className="mt-0.5 font-mono text-[11px] text-[#71717a]">RFC 4180 CSV · Max size 5 MB</p>
        </div>
        {result && (
          <button
            type="button"
            onClick={() => {
              if (input.current) input.current.value = ''
              onReset()
            }}
            disabled={busy}
            className="rounded-lg border border-white/[0.08] bg-white/[0.03] px-2.5 py-1 font-mono text-[11px] text-[#a1a1aa] transition hover:border-[#ff8a4c]/40 hover:bg-[#ff8a4c]/10 hover:text-[#ffad7f] disabled:opacity-50"
          >
            New import
          </button>
        )}
      </div>

      <input
        ref={input}
        id="review-csv"
        type="file"
        accept=".csv,text/csv"
        onChange={event => handleFile(event.target.files?.[0])}
        className="peer sr-only"
      />

      <label
        htmlFor="review-csv"
        title="Choose a CSV file or drop it here"
        onDragOver={event => {
          event.preventDefault()
          setIsDragging(true)
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={event => {
          event.preventDefault()
          setIsDragging(false)
          handleFile(event.dataTransfer.files?.[0])
        }}
        className={`group flex min-h-[140px] cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed p-5 text-center transition-all duration-200 ${
          isDragging
            ? 'border-[#ff8a4c] bg-[#ff8a4c]/[0.08] shadow-[0_0_24px_rgba(255,138,76,0.18)]'
            : file
              ? 'border-emerald-400/40 bg-emerald-400/[0.03]'
              : 'border-white/[0.12] bg-[#09090b]/80 hover:border-[#ff8a4c]/50 hover:bg-[#ff8a4c]/[0.02]'
        }`}
      >
        <div
          className={`flex h-11 w-11 items-center justify-center rounded-xl border transition duration-200 ${
            file
              ? 'border-emerald-400/30 bg-emerald-400/10 text-emerald-300'
              : 'border-white/[0.08] bg-white/[0.03] text-[#ff8a4c] group-hover:-translate-y-0.5 group-hover:scale-105'
          }`}
        >
          <Icon name={file ? 'check' : 'upload'} className="h-5 w-5" />
        </div>
        <span className="mt-3 text-sm font-medium text-[#f5f5f4]">
          {file ? file.name : 'Drop your CSV file here or click to browse'}
        </span>
        <span className="mt-1 font-mono text-[11px] text-[#71717a]">
          {file
            ? `${formatBytes(file.size)} · ready for schema validation & ingestion`
            : 'Required columns: review_id, product, rating, date, review_text'}
        </span>
      </label>

      <button
        type="submit"
        disabled={loading || busy || !file}
        title={file ? 'Upload the selected CSV and clean its rows' : 'Select a CSV file first'}
        className="button-primary mt-4.5 w-full font-mono text-xs uppercase tracking-[0.08em]"
      >
        {loading ? (
          <>
            <Spinner className="h-3.5 w-3.5" />
            <span>Validating & Cleaning Reviews...</span>
          </>
        ) : (
          <>
            <span>Upload & Clean Reviews</span>
            <Icon name="arrow" className="h-3.5 w-3.5" />
          </>
        )}
      </button>

      {result && (
        <div className="mt-3.5 flex items-center gap-2.5 rounded-xl border border-emerald-400/20 bg-emerald-400/[0.06] px-3.5 py-2.5 text-xs text-emerald-200">
          <Icon name="check" className="h-4 w-4 shrink-0 text-emerald-400" />
          <span>{result.message}</span>
        </div>
      )}

      {error && (
        <div role="alert" className="mt-3.5 flex items-start gap-2.5 rounded-xl border border-rose-400/20 bg-rose-400/[0.08] px-3.5 py-2.5 text-xs leading-5 text-rose-200">
          <Icon name="warning" className="h-4 w-4 shrink-0 text-rose-400 mt-0.5" />
          <span>{error}</span>
        </div>
      )}
    </form>
  )
}
