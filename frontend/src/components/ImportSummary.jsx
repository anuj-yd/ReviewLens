function MiniStat({ label, value, tone = 'slate' }) {
  const colors = { slate: 'text-slate-200', emerald: 'text-emerald-300', amber: 'text-amber-200' }
  return <div className="rounded-xl border border-white/[0.045] bg-[#09090b] px-4 py-4"><p className="font-mono text-[10px] uppercase tracking-[0.08em] text-[#77777f]">{label}</p><p className={`mt-2 font-serif text-3xl italic tabular-nums ${colors[tone]}`}>{value ?? 0}</p></div>
}

export default function ImportSummary({ summary }) {
  if (!summary) return null
  const unknownRatings = (summary.missingRatingCount || 0) + (summary.invalidRatingCount || 0)
  return <section className="mb-8 rounded-2xl border border-white/[0.08] bg-[#0e0e10] p-5 sm:p-6">
    <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
      <div><h2 className="text-base font-semibold text-[#f2f1ec]">Data cleaning report</h2><p className="mt-1 text-sm text-[#77777f]">Accepted rows and cleanup counts</p></div>
      <span className="rounded-full border border-emerald-300/15 bg-emerald-300/[0.06] px-3 py-1.5 text-xs text-emerald-200">Complete</span>
    </div>
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
      <MiniStat label="CSV rows" value={summary.totalRows} />
      <MiniStat label="Accepted" value={summary.acceptedReviewRows} tone="emerald" />
      <MiniStat label="Unique reviews" value={summary.uniqueReviewCount} />
      <MiniStat label="Duplicates" value={summary.duplicateCount} tone="amber" />
      <MiniStat label="Empty skipped" value={summary.skippedEmptyReviews} />
      <MiniStat label="Unknown ratings" value={unknownRatings} />
    </div>
  </section>
}
