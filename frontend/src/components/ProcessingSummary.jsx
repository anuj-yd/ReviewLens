function formatDuration(milliseconds = 0) {
  if (milliseconds < 1000) return `${milliseconds} ms`
  return `${(milliseconds / 1000).toFixed(1)} s`
}

export default function ProcessingSummary({ metrics }) {
  if (!metrics) return null

  const items = [
    { label: 'AI requests', value: metrics.aiCalls ?? 0 },
    { label: 'Cache reused', value: metrics.cacheHits ?? 0 },
    { label: 'Retries', value: metrics.retries ?? 0 },
    { label: 'Failed reviews', value: metrics.failed ?? 0 },
    { label: 'Processing time', value: formatDuration(metrics.processingTimeMs) }
  ]

  return <section className="mb-5 rounded-2xl border border-white/[0.08] bg-[#0e0e10] px-5 py-4 sm:px-6" aria-label="Last analysis run metrics">
    <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
      <h2 className="text-sm font-semibold text-[#f2f1ec]">Last analysis run</h2>
      <p className="text-xs text-[#77777f]">Requests, cache reuse, and elapsed time</p>
    </div>
    <dl className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
      {items.map(item => <div key={item.label} className="rounded-xl border border-white/[0.045] bg-[#09090b] px-3.5 py-3">
        <dt className="text-xs text-[#92929a]">{item.label}</dt>
        <dd className="mt-1 font-mono text-lg font-medium tabular-nums text-slate-100">{item.value}</dd>
      </div>)}
    </dl>
  </section>
}
