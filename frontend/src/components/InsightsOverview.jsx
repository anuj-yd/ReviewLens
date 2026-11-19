import { Icon, SectionHeading, StatCard } from './ReviewLensUI'

function SentimentMix({ summary }) {
  const items = [
    { key: 'positive', label: 'Positive', color: 'bg-emerald-400', text: 'text-emerald-300' },
    { key: 'neutral', label: 'Neutral', color: 'bg-amber-300', text: 'text-amber-200' },
    { key: 'negative', label: 'Negative', color: 'bg-rose-400', text: 'text-rose-300' }
  ]
  return <div className="mt-4 rounded-2xl border border-white/[0.08] bg-[#0e0e10] px-5 py-5 sm:px-6">
    <div className="mb-4 flex items-center justify-between gap-3"><p className="font-mono text-[11px] font-medium uppercase tracking-[0.12em] text-[#c5c4c9]">Sentiment mix</p><p className="font-mono text-[10px] uppercase tracking-[0.08em] text-[#77777f]">Analyzed reviews</p></div>
    <div className="flex h-5 w-full overflow-hidden rounded-full bg-white/[0.05]" role="img" aria-label={items.map(item => `${item.label} ${summary.sentimentPercentages?.[item.key] || 0}%`).join(', ')}>{items.map(item => <span key={item.key} className={`${item.color} transition-[width] duration-500`} style={{ width: `${summary.sentimentPercentages?.[item.key] || 0}%` }} />)}</div>
    <div className="mt-4 flex flex-wrap gap-x-8 gap-y-3">{items.map(item => <span key={item.key} className="inline-flex items-center gap-2.5 text-base text-slate-300"><i className={`h-3 w-3 rounded-full ${item.color}`} />{item.label}<b className={`font-semibold tabular-nums ${item.text}`}>{summary.sentimentPercentages?.[item.key] || 0}%</b></span>)}</div>
  </div>
}

function InsightCard({ title, subtitle, items, tone }) {
  const complaint = tone === 'rose'
  const theme = complaint
    ? { border: 'border-[#ff8a4c]/20', icon: 'text-[#ff9a62] bg-[#ff8a4c]/[0.08]', rank: 'border-[#ff8a4c]/20 bg-[#ff8a4c]/[0.05] text-[#ffad7f]', chip: 'border-[#ff8a4c]/15 bg-[#ff8a4c]/[0.04] text-[#ffc19e]', count: 'text-[#ffad7f]', iconName: 'negative' }
    : { border: 'border-emerald-300/15', icon: 'text-emerald-300 bg-emerald-300/[0.06]', rank: 'border-emerald-300/20 bg-emerald-300/[0.04] text-emerald-200', chip: 'border-emerald-300/10 bg-emerald-300/[0.035] text-emerald-200', count: 'text-emerald-200', iconName: 'positive' }
  return <div className={`relative overflow-hidden rounded-2xl border ${theme.border} bg-[#0e0e10] p-5 sm:p-6`}>
    <div className={`pointer-events-none absolute inset-x-0 top-0 h-px ${complaint ? 'bg-[#ff8a4c]/55' : 'bg-emerald-300/45'}`} />
    <div className="flex items-center justify-between gap-4">
      <div className="flex items-center gap-3">
        <span className={`flex h-10 w-10 items-center justify-center rounded-xl ${theme.icon}`}><Icon name={theme.iconName} className="h-5 w-5" /></span>
        <div><h3 className="text-lg font-semibold tracking-tight text-[#f2f1ec]">{title}</h3><p className="mt-0.5 text-sm text-[#77777f]">{subtitle}</p></div>
      </div>
      <span className="shrink-0 rounded-full border border-white/[0.08] bg-white/[0.03] px-3 py-1.5 text-xs font-medium text-slate-300">{items.length} {items.length === 1 ? 'theme' : 'themes'}</span>
    </div>
    {items.length ? <ol className="mt-5 space-y-3">{items.map((item, index) => {
      const itemTopics = item.topic.split(',').map(value => value.trim()).filter(Boolean)
      return <li key={`${item.topic}-${item.summary}`} className="group flex items-start gap-3 rounded-xl border border-white/[0.045] bg-slate-950/45 p-4 transition hover:border-white/[0.11] hover:bg-slate-950/70 sm:gap-4">
        <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full border text-sm font-semibold tabular-nums ${theme.rank}`}>{String(index + 1).padStart(2, '0')}</span>
        <div className="min-w-0 flex-1">
          <p className="text-[15px] font-medium leading-6 text-slate-100">{item.summary}</p>
          <div className="mt-2.5 flex flex-wrap gap-1.5">{itemTopics.map(topic => <span key={topic} className={`rounded-md border px-2 py-1 text-xs capitalize ${theme.chip}`}>{topic.replaceAll('_', ' ')}</span>)}</div>
        </div>
        <span className="shrink-0 rounded-lg border border-white/[0.07] bg-white/[0.035] px-2.5 py-1.5 text-xs text-slate-300"><b className={`font-semibold ${theme.count}`}>{item.count}</b><span className="ml-1">{item.count === 1 ? 'review' : 'reviews'}</span></span>
      </li>
    })}</ol> : <p className="mt-5 rounded-xl border border-dashed border-white/[0.1] px-3 py-8 text-center text-sm text-slate-400">Analyze reviews to see insights.</p>}
  </div>
}

export default function InsightsOverview({ summary, reviewCount, complaints, praises, onAnalyzeAll, analyzing }) {
  const analyzed = summary?.totalReviews ?? 0
  return <>
    <section className="mb-6">
      <div className="mb-3 flex flex-wrap items-end justify-between gap-3">
        <SectionHeading eyebrow="Overview" title="Review insights" detail={analyzed ? `${analyzed} analyzed` : 'Analysis not started'} />
        <button onClick={onAnalyzeAll} disabled={analyzing} title="Analyze all unique reviews and update the insights" className="button-primary mb-4 min-h-12 px-5 text-base">
          {analyzing ? <><span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-r-transparent" /> Analyzing...</> : <><Icon name="spark" /> Analyze all reviews</>}
        </button>
      </div>
      <div className="grid gap-2.5 sm:grid-cols-2 xl:grid-cols-5">
        <StatCard title="Reviews analyzed" value={analyzed} detail={`${reviewCount} accepted`} icon="review" accent="blue" tooltip="Count of reviews with a completed AI analysis" />
        <StatCard title="Positive" value={`${summary?.sentimentPercentages?.positive ?? 0}%`} detail={`${summary?.sentimentCounts?.positive ?? 0} reviews`} icon="positive" accent="emerald" tooltip="Share of analyzed reviews classified as positive" />
        <StatCard title="Neutral" value={`${summary?.sentimentPercentages?.neutral ?? 0}%`} detail={`${summary?.sentimentCounts?.neutral ?? 0} reviews`} icon="neutral" accent="amber" tooltip="Share of analyzed reviews classified as neutral" />
        <StatCard title="Negative" value={`${summary?.sentimentPercentages?.negative ?? 0}%`} detail={`${summary?.sentimentCounts?.negative ?? 0} reviews`} icon="negative" accent="rose" tooltip="Share of analyzed reviews classified as negative" />
        <StatCard title="Need a reply" value={summary?.needsReply ?? 0} detail="Issues to follow up" icon="reply" accent="rose" tooltip="Reviews with complaints or unresolved issues that should receive a response" />
      </div>
      {analyzed > 0 && <SentimentMix summary={summary} />}
    </section>
    <section className="mb-7 grid gap-3 lg:grid-cols-2">
      <InsightCard title="Top complaints" subtitle="Themes customers want fixed" items={complaints} tone="rose" />
      <InsightCard title="Top praises" subtitle="What customers value" items={praises} tone="emerald" />
    </section>
  </>
}
