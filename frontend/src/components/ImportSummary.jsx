import { Icon } from './ReviewLensUI'

function MiniStat({ label, value, tone = 'slate', icon }) {
  const colors = {
    slate: 'text-slate-200 border-white/[0.06]',
    emerald: 'text-emerald-300 border-emerald-400/20 bg-emerald-400/[0.02]',
    amber: 'text-amber-200 border-amber-400/20 bg-amber-400/[0.02]'
  }

  return <div className={`flex flex-col justify-between rounded-xl border bg-[#09090b] p-3.5 transition hover:border-white/[0.12] ${colors[tone]}`}>
    <div className="flex items-center justify-between gap-2">
      <span className="font-mono text-[10px] uppercase tracking-[0.08em] text-[#77777f]">{label}</span>
      {icon && <span className="text-[#92929a]"><Icon name={icon} className="h-3.5 w-3.5" /></span>}
    </div>
    <p className={`mt-2 font-serif text-3xl italic tabular-nums ${colors[tone].split(' ')[0]}`}>{value ?? 0}</p>
  </div>
}

export default function ImportSummary({ summary }) {
  if (!summary) return null
  const unknownRatings = (summary.missingRatingCount || 0) + (summary.invalidRatingCount || 0)

  return <section className="mb-7 rounded-2xl border border-white/[0.08] bg-gradient-to-b from-[#121215] to-[#0c0c0e] p-5 shadow-[0_4px_20px_rgba(0,0,0,0.25)] sm:p-6">
    <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
      <div>
        <div className="flex items-center gap-2">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
          <h2 className="text-base font-semibold text-[#f2f1ec]">Data cleaning & ingestion report</h2>
        </div>
        <p className="mt-0.5 text-xs text-[#77777f]">Sanitized review records, duplicate detection, and missing rating handling</p>
      </div>
      <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-400/20 bg-emerald-400/[0.08] px-3 py-1 font-mono text-xs text-emerald-300">
        <Icon name="check" className="h-3.5 w-3.5" /> Cleaned & Indexed
      </span>
    </div>

    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
      <MiniStat label="CSV rows" value={summary.totalRows} icon="upload" />
      <MiniStat label="Accepted" value={summary.acceptedReviewRows} tone="emerald" icon="check" />
      <MiniStat label="Unique reviews" value={summary.uniqueReviewCount} icon="spark" />
      <MiniStat label="Duplicates" value={summary.duplicateCount} tone="amber" icon="review" />
      <MiniStat label="Empty skipped" value={summary.skippedEmptyReviews} icon="close" />
      <MiniStat label="Unknown ratings" value={unknownRatings} icon="warning" />
    </div>
  </section>
}
