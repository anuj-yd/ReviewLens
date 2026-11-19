export function BrandMark() {
  return <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-[#ff8a4c]/30 bg-[#ff8a4c]/10 text-[#ff9a62]">
    <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" aria-hidden="true"><path d="M4.5 17.5V7.2c0-.9.7-1.7 1.6-1.7h11.8c.9 0 1.6.8 1.6 1.7v10.3c0 .9-.7 1.7-1.6 1.7H6.1c-.9 0-1.6-.8-1.6-1.7Z" stroke="currentColor" strokeWidth="1.5"/><path d="m8 14 2.5-2.5 2 2 3.5-4M8 16.5h8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
  </div>
}

export function Icon({ name, className = 'h-4 w-4' }) {
  const paths = {
    upload: <><path d="M12 15V4m0 0L8 8m4-4 4 4M5 15v3.5c0 .8.7 1.5 1.5 1.5h11c.8 0 1.5-.7 1.5-1.5V15" /></>,
    arrow: <path d="M4 10h12m-5-5 5 5-5 5" />,
    check: <path d="m4.5 10.2 3.4 3.4 7.6-7.4" />,
    spark: <path d="m12 3 1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8L12 3Zm6 12 .9 2.1L21 18l-2.1.9L18 21l-.9-2.1L15 18l2.1-.9L18 15Z" />,
    search: <><circle cx="10.8" cy="10.8" r="6.3" /><path d="m15.5 15.5 4 4" /></>,
    review: <><path d="M4 5.8c0-1 .8-1.8 1.8-1.8h12.4c1 0 1.8.8 1.8 1.8v8.4c0 1-.8 1.8-1.8 1.8h-7l-4.5 4v-4.1c-1.5-.1-2.7-.9-2.7-2.4V5.8Z"/><path d="M8 8h8M8 12h5"/></>,
    reply: <path d="M9 14 4 9l5-5M4 9h10a6 6 0 0 1 6 6v4" />,
    positive: <path d="m5 14 5-5 4 4 5-7m-5 0h5v5" />,
    neutral: <path d="M5 12h14" />,
    negative: <path d="m5 10 5 5 4-4 5 7m-5 0h5v-5" />,
    chart: <><path d="M4 19V5m0 14h16"/><path d="m6 15 4-4 3 2 5-6"/></>,
    warning: <><path d="M10.3 3.8 2.6 17a2 2 0 0 0 1.7 3h15.4a2 2 0 0 0 1.7-3L13.7 3.8a2 2 0 0 0-3.4 0Z"/><path d="M12 9v4m0 3h.01"/></>,
    help: <><circle cx="12" cy="12" r="9"/><path d="M9.6 9a2.5 2.5 0 0 1 4.8.8c0 1.7-2.4 2-2.4 3.8M12 17h.01"/></>,
    close: <path d="m6 6 12 12M18 6 6 18" />
  }
  return <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true"><g stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">{paths[name] || paths.chart}</g></svg>
}

export function Spinner() {
  return <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-r-transparent" aria-hidden="true" />
}

export function SectionHeading({ eyebrow, title, detail }) {
  return <div className="mb-4"><p className="font-mono text-[11px] font-medium uppercase tracking-[0.14em] text-[#77777f]">{eyebrow}</p><div className="mt-1.5 flex flex-wrap items-baseline gap-x-3 gap-y-1"><h2 className="text-2xl font-semibold tracking-tight text-[#f2f1ec]">{title}</h2>{detail && <p className="font-mono text-xs text-[#77777f]">{detail}</p>}</div></div>
}

export function StatCard({ title, value, detail, icon, accent, tooltip }) {
  const accents = {
    blue: 'border-white/[0.09] bg-white/[0.035] text-[#b8b8c0]',
    emerald: 'border-emerald-300/15 bg-emerald-300/[0.05] text-emerald-200',
    amber: 'border-amber-300/15 bg-amber-300/[0.05] text-amber-200',
    rose: 'border-rose-300/15 bg-rose-300/[0.05] text-rose-200'
  }
  return <div title={tooltip || title} className="rounded-2xl border border-white/[0.08] bg-[#0e0e10] p-5 transition duration-200 hover:-translate-y-0.5 hover:border-white/[0.15] sm:p-6">
    <div className="flex items-start justify-between gap-3"><p className="font-mono text-[11px] font-medium uppercase tracking-[0.1em] text-[#92929a]">{title}</p><span className={`flex h-9 w-9 items-center justify-center rounded-lg border ${accents[accent]}`}><Icon name={icon} className="h-4 w-4" /></span></div>
    <p className="mt-4 font-serif text-5xl italic leading-none tracking-tight tabular-nums text-[#f2f1ec]">{value}</p>
    <p className="mt-3 text-sm text-[#77777f]">{detail}</p>
  </div>
}

export function SentimentBadge({ sentiment }) {
  const styles = sentiment === 'positive'
    ? 'border-emerald-300/15 bg-emerald-300/[0.07] text-emerald-200'
    : sentiment === 'negative'
      ? 'border-rose-300/15 bg-rose-300/[0.07] text-rose-200'
      : 'border-amber-300/15 bg-amber-300/[0.07] text-amber-100'
  return <span className={`inline-flex rounded-full border px-2.5 py-1 text-[10px] font-semibold capitalize ${styles}`}>{sentiment}</span>
}

export function Rating({ rating }) {
  if (rating == null) return <span className="rounded-md bg-white/[0.04] px-1.5 py-0.5 text-[10px] text-slate-500">Unrated</span>
  return <span className="inline-flex items-center gap-1 text-[11px] text-amber-200"><span aria-label={`${rating} out of 5 stars`}>{'★'.repeat(rating)}<span className="text-slate-700">{'★'.repeat(5 - rating)}</span></span><span className="text-slate-500">{rating}/5</span></span>
}

export function AnalysisStatus({ status }) {
  const failed = status === 'analysis_failed'
  return <span className={`inline-flex items-center gap-1.5 text-[11px] ${failed ? 'text-rose-300' : 'text-slate-500'}`}><i className={`h-1.5 w-1.5 rounded-full ${failed ? 'bg-rose-400' : 'bg-slate-600'}`} />{failed ? 'Analysis failed' : 'Not analyzed'}</span>
}

