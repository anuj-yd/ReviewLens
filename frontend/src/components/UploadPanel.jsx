import { useRef } from 'react'
import { Icon, Spinner } from './ReviewLensUI'

const formatBytes = bytes => bytes < 1024 * 1024
  ? `${Math.max(1, Math.round(bytes / 1024))} KB`
  : `${(bytes / (1024 * 1024)).toFixed(1)} MB`

export default function UploadPanel({ file, onFile, onSubmit, loading, busy, error, result, onReset }) {
  const input = useRef(null)
  const handleFile = nextFile => {
    if (nextFile) onFile(nextFile)
  }

  return <form onSubmit={onSubmit} className="rounded-2xl border border-white/[0.07] bg-[#0e0e10] p-4 sm:p-5">
    <div className="mb-3 flex items-start justify-between gap-3">
      <div><h2 className="text-base font-semibold text-[#f2f1ec]">Import reviews</h2><p className="mt-1 font-mono text-[11px] text-[#77777f]">CSV file · up to 5 MB</p></div>
      {result && <button type="button" onClick={() => { input.current.value = ''; onReset() }} disabled={busy} className="font-mono text-[10px] uppercase tracking-[0.06em] text-[#ff9a62] hover:text-[#ffc19e] disabled:opacity-50">New import</button>}
    </div>
    <input ref={input} id="review-csv" type="file" accept=".csv,text/csv" onChange={event => handleFile(event.target.files?.[0])} className="peer sr-only" />
    <label htmlFor="review-csv" title="Choose a CSV file or drop it here" onDragOver={event => event.preventDefault()} onDrop={event => { event.preventDefault(); handleFile(event.dataTransfer.files?.[0]) }} className="group flex min-h-[112px] cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed border-white/[0.11] bg-[#09090b] px-4 py-4 text-center transition hover:border-[#ff8a4c]/50 peer-focus-visible:ring-2 peer-focus-visible:ring-[#ff8a4c]/60">
      <Icon name="upload" className="h-5 w-5 text-[#ff9a62] transition group-hover:-translate-y-0.5" />
      <span className="mt-2 text-sm font-medium text-[#dedde1]">{file ? file.name : 'Drop your CSV here or browse'}</span>
      <span className="mt-1 font-mono text-[10px] text-[#77777f]">{file ? `${formatBytes(file.size)} · ready to upload` : 'review_id, product, rating, date, review_text'}</span>
    </label>
    <button type="submit" disabled={loading || busy || !file} title={file ? 'Upload the selected CSV and clean its rows' : 'Select a CSV file first'} className="button-primary mt-3 min-h-11 w-full font-mono text-[11px] uppercase tracking-[0.06em]">
      {loading ? <><Spinner /> Uploading...</> : <>Upload and clean <Icon name="arrow" /></>}
    </button>
    {result && <p className="mt-3 flex items-center gap-2 text-sm text-emerald-300"><Icon name="check" />{result.message}</p>}
    {error && <p role="alert" className="mt-3 rounded-lg border border-rose-400/20 bg-rose-400/[0.08] px-3 py-2 text-sm leading-5 text-rose-200">{error}</p>}
  </form>
}
