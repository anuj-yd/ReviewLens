import { Icon } from './ReviewLensUI'

function formatDuration(milliseconds = 0) {
  if (milliseconds < 1000) return `${milliseconds} ms`
  return `${(milliseconds / 1000).toFixed(1)} s`
}

export default function ProcessingSummary({ metrics }) {
  if (!metrics) return null

  const items = [
    { label: 'AI requests', value: metrics.aiCalls ?? 0, icon: 'spark', color: 'text-blue-300' },
    { label: 'Cache reused', value: metrics.cacheHits ?? 0, icon: 'check', color: 'text-emerald-300' },
    { label: 'Retries handled', value: metrics.retries ?? 0, icon: 'warning', color: 'text-amber-300' },
    { label: 'Failed reviews', value: metrics.failed ?? 0, icon: 'close', color: metrics.failed > 0 ? 'text-rose-300' : 'text-slate-400' },
    { label: 'Elapsed time', value: formatDuration(metrics.processingTimeMs), icon: 'chart', color: 'text-slate-100' }
  ]

  const totalReviewsProcessed = (metrics.aiCalls || 0) + (metrics.cacheHits || 0)
  const cacheRatio = totalReviewsProcessed > 0 ? Math.round(((metrics.cacheHits || 0) / totalReviewsProcessed) * 100) : 0

  return <section className="mb-6 rounded-2xl border border-white/[0.08] bg-gradient-to-b from-[#121215] to-[#0c0c0e] p-4 shadow-[0_4px_20px_rgba(0,0,0,0.25)] sm:p-5" aria-label="Last analysis run metrics">
    <div className="mb-3.5 flex flex-wrap items-center justify-between gap-2">
      <div className="flex items-center gap-2">
        <span className="h-1.5 w-1.5 rounded-full bg-blue-400" />
        <h2 className="text-sm font-semibold text-[#f2f1ec]">Batch execution & performance log</h2>
        <span className="font-mono text-xs text-[#77777f]">· OpenRouter calls & MongoDB cache</span>
      </div>
      {cacheRatio > 0 && <span className="rounded-full border border-emerald-400/20 bg-emerald-400/[0.08] px-2.5 py-0.5 font-mono text-[10.5px] text-emerald-300">
        {cacheRatio}% cache hit rate (instant reuse)
      </span>}
    </div>

    <dl className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-5">
      {items.map(item => <div key={item.label} className="rounded-xl border border-white/[0.05] bg-[#09090b] px-3.5 py-2.5 transition hover:border-white/[0.12]">
        <div className="flex items-center justify-between gap-1">
          <dt className="text-xs text-[#92929a]">{item.label}</dt>
          <span className={item.color}><Icon name={item.icon} className="h-3.5 w-3.5" /></span>
        </div>
        <dd className={`mt-1 font-mono text-lg font-semibold tabular-nums ${item.color}`}>{item.value}</dd>
      </div>)}
    </dl>
  </section>
}
