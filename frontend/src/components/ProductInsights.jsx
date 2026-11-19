import { useMemo, useState } from 'react'
import { SectionHeading } from './ReviewLensUI'

const sentimentTypes = [
  { key: 'positive', label: 'Positive', bar: 'bg-emerald-400', text: 'text-emerald-300', line: '#34d399' },
  { key: 'neutral', label: 'Neutral', bar: 'bg-amber-300', text: 'text-amber-200', line: '#fcd34d' },
  { key: 'negative', label: 'Negative', bar: 'bg-rose-400', text: 'text-rose-300', line: '#fb7185' }
]

function SentimentTrendChart({ points }) {
  const width = 620
  const height = 220
  const left = 36
  const right = 10
  const top = 12
  const bottom = 28
  const chartWidth = width - left - right
  const chartHeight = height - top - bottom
  const levels = [0, 25, 50, 75, 100]
  const xAt = index => points.length < 2 ? left + chartWidth / 2 : left + index / (points.length - 1) * chartWidth
  const yAt = value => top + (100 - value) / 100 * chartHeight
  const labelIndexes = [...new Set([0, Math.floor((points.length - 1) / 2), points.length - 1])]

  if (!points.length) {
    return <div className="flex min-h-44 items-center justify-center rounded-lg border border-dashed border-white/[0.08] px-4 text-center text-xs text-[#77777f]">Add review dates and analyze reviews to see sentiment trends.</div>
  }

  return <div className="min-h-44 rounded-lg border border-white/[0.045] bg-white/[0.015] px-2 py-2 sm:px-3">
    <svg viewBox={`0 0 ${width} ${height}`} className="aspect-[2.8/1] min-h-40 w-full overflow-visible" role="img" aria-label={`Sentiment percentages by review date for ${points.length} dates`}>
      {levels.map(level => <g key={level}>
        <line x1={left} x2={width - right} y1={yAt(level)} y2={yAt(level)} stroke="rgba(255,255,255,0.08)" strokeDasharray={level === 0 ? undefined : '3 5'} />
        <text x={left - 8} y={yAt(level) + 3} textAnchor="end" fill="#686870" fontSize="9" fontFamily="IBM Plex Mono, monospace">{level}</text>
      </g>)}
      {labelIndexes.map(index => <text key={points[index].date} x={xAt(index)} y={height - 6} textAnchor={index === 0 ? 'start' : index === points.length - 1 ? 'end' : 'middle'} fill="#77777f" fontSize="9" fontFamily="IBM Plex Mono, monospace">{points[index].date.slice(5).replace('-', '/')}</text>)}
      {sentimentTypes.map(series => {
        const path = points.map((point, index) => `${index === 0 ? 'M' : 'L'} ${xAt(index)} ${yAt(point[series.key])}`).join(' ')
        return <g key={series.key}>
          {points.length > 1 && <path d={path} fill="none" stroke={series.line} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />}
          {points.map((point, index) => <circle key={`${series.key}-${point.date}`} cx={xAt(index)} cy={yAt(point[series.key])} r="4" fill="#09090b" stroke={series.line} strokeWidth="2" vectorEffect="non-scaling-stroke">
            <title>{`${series.label}: ${point[series.key]}% on ${point.date} (${point.count} ${point.count === 1 ? 'review' : 'reviews'})`}</title>
          </circle>)}
        </g>
      })}
    </svg>
  </div>
}

function IssueList({ title, items, tone }) {
  const positive = tone === 'positive'
  const marker = positive ? 'text-emerald-300' : 'text-[#ff9a62]'
  const border = positive ? 'border-emerald-300/15' : 'border-[#ff8a4c]/20'
  const countColor = positive ? 'text-emerald-200' : 'text-[#ffad7f]'

  return <div className={`rounded-xl border ${border} bg-[#09090b] p-4 sm:p-5`}>
    <div className="mb-3 flex items-center justify-between gap-3">
      <h3 className="text-sm font-semibold text-[#f2f1ec]">{title}</h3>
      <span className={`font-mono text-[10px] uppercase tracking-[0.08em] ${marker}`}>{items.length} themes</span>
    </div>
    {items.length ? <ol className="space-y-2.5">
      {items.map((item, index) => <li key={`${item.topic}-${item.summary}`} className="flex items-start gap-2.5 rounded-lg border border-white/[0.045] bg-white/[0.02] p-3 transition-colors hover:bg-white/[0.045]">
        <span className={`pt-0.5 font-mono text-[10px] ${marker}`}>{String(index + 1).padStart(2, '0')}</span>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-medium leading-5 text-[#dedde1]">{item.summary}</p>
          <p className="mt-1 font-mono text-[9px] uppercase tracking-[0.04em] text-[#77777f]">{item.topic.split(',').map(topic => topic.trim().replaceAll('_', ' ')).join(' / ')}</p>
        </div>
        <span className={`shrink-0 font-mono text-[10px] ${countColor}`}>{item.count}×</span>
      </li>)}
    </ol> : <p className="rounded-lg border border-dashed border-white/[0.08] px-3 py-5 text-center text-xs text-[#77777f]">Analyze reviews to see {positive ? 'praises' : 'complaints'}.</p>}
  </div>
}

export default function ProductInsights({ reviews = [] }) {
  const [selectedProduct, setSelectedProduct] = useState('')
  const products = useMemo(() => [...new Set(reviews.map(review => review.product).filter(Boolean))].sort((a, b) => a.localeCompare(b)), [reviews])
  const activeProduct = products.includes(selectedProduct) ? selectedProduct : products[0] || ''

  const insights = useMemo(() => {
    const seenReviews = new Set()
    const productReviews = []

    for (const review of reviews) {
      if (review.product !== activeProduct) continue
      const normalizedText = String(review.reviewText || '').normalize('NFKC').trim().replace(/\s+/g, ' ').toLocaleLowerCase()
      const key = JSON.stringify([review.product, normalizedText])
      if (seenReviews.has(key)) continue
      seenReviews.add(key)
      productReviews.push(review)
    }

    const analyzed = productReviews.filter(review => review.analysisStatus === 'completed' && review.analysis?.sentiment)
    const sentimentCounts = { positive: 0, neutral: 0, negative: 0 }
    const issueGroups = { complaints: new Map(), praises: new Map() }
    const dateGroups = new Map()

    for (const review of analyzed) {
      const analysis = review.analysis
      sentimentCounts[analysis.sentiment] += 1
      const reviewDate = review.date ? new Date(review.date) : null
      if (reviewDate && !Number.isNaN(reviewDate.getTime())) {
        const dateKey = reviewDate.toISOString().slice(0, 10)
        const dateGroup = dateGroups.get(dateKey) || { date: dateKey, count: 0, positive: 0, neutral: 0, negative: 0 }
        dateGroup.count += 1
        dateGroup[analysis.sentiment] += 1
        dateGroups.set(dateKey, dateGroup)
      }
      if (analysis.sentiment !== 'negative' && analysis.sentiment !== 'positive') continue

      const kind = analysis.sentiment === 'negative' ? 'complaints' : 'praises'
      const topic = [...(analysis.topics || [])].sort().join(', ') || 'other'
      const summary = analysis.summary || 'No summary available'
      const key = `${topic}:${summary.toLocaleLowerCase()}`
      const item = issueGroups[kind].get(key) || { topic, summary, count: 0 }
      item.count += 1
      issueGroups[kind].set(key, item)
    }

    const sortTop = groups => [...groups.values()]
      .sort((a, b) => b.count - a.count || a.summary.localeCompare(b.summary))
      .slice(0, 3)

    const total = analyzed.length
    const sentimentPercentages = Object.fromEntries(Object.entries(sentimentCounts).map(([key, count]) => [key, total ? Math.round(count / total * 100) : 0]))
    const sentimentTrend = [...dateGroups.values()].sort((a, b) => a.date.localeCompare(b.date)).map(group => ({
      ...group,
      positive: Math.round(group.positive / group.count * 100),
      neutral: Math.round(group.neutral / group.count * 100),
      negative: Math.round(group.negative / group.count * 100)
    }))

    return {
      productReviewCount: productReviews.length,
      analyzed,
      sentimentCounts,
      sentimentPercentages,
      sentimentTrend,
      datedReviewCount: sentimentTrend.reduce((count, point) => count + point.count, 0),
      needsReply: analyzed.filter(review => review.analysis.needs_reply).length,
      complaints: sortTop(issueGroups.complaints),
      praises: sortTop(issueGroups.praises)
    }
  }, [reviews, activeProduct])

  return <section className="mb-7 rounded-2xl border border-white/[0.08] bg-[#0e0e10] p-5 sm:p-6">
    <div className="mb-5 flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
      <SectionHeading eyebrow="Product detail" title="Product insights" detail={activeProduct ? `${insights.analyzed.length} analyzed / ${insights.productReviewCount} reviews` : 'No products uploaded'} />
      <label className="block w-full sm:w-72">
        <span className="sr-only">Choose a product for product insights</span>
        <select value={activeProduct} onChange={event => setSelectedProduct(event.target.value)} disabled={!products.length} title="Choose a product to see its sentiment and issues" className="filter-input capitalize">
          {products.length ? products.map(product => <option key={product} value={product}>{product}</option>) : <option value="">No products available</option>}
        </select>
      </label>
    </div>

    {activeProduct ? <div className="grid gap-3 xl:grid-cols-[0.9fr_1.1fr]">
      <div className="rounded-xl border border-white/[0.07] bg-[#09090b] p-4 sm:p-5">
        <div className="mb-4 flex items-center justify-between gap-3">
          <h3 className="font-mono text-[10px] uppercase tracking-[0.1em] text-[#92929a]">Sentiment trend</h3>
          <span className="font-mono text-[10px] text-[#77777f]">{insights.sentimentTrend.length} review dates</span>
        </div>
        <SentimentTrendChart points={insights.sentimentTrend} />
        <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2">
          {sentimentTypes.map(item => <span key={item.key} className="inline-flex items-center gap-2 text-[10px] text-[#92929a]"><i className="h-0.5 w-4 rounded-full" style={{ backgroundColor: item.line }} />{item.label}</span>)}
        </div>
        {insights.datedReviewCount < insights.analyzed.length && <p className="mt-2 text-[10px] text-[#686870]">{insights.analyzed.length - insights.datedReviewCount} analyzed {insights.analyzed.length - insights.datedReviewCount === 1 ? 'review has' : 'reviews have'} no valid date and are not plotted.</p>}
        <div className="mt-4 grid grid-cols-3 gap-2">
          {sentimentTypes.map(item => <div key={item.key} className="rounded-lg border border-white/[0.045] bg-white/[0.02] px-2.5 py-3">
            <p className="text-[10px] text-[#92929a]">{item.label}</p>
            <p className={`mt-1 font-mono text-sm font-medium tabular-nums ${item.text}`}>{insights.sentimentPercentages[item.key]}%</p>
            <p className="mt-0.5 text-[10px] text-[#686870]">{insights.sentimentCounts[item.key]} reviews</p>
          </div>)}
        </div>
        <div className="mt-3 flex items-center justify-between rounded-lg border border-[#ff8a4c]/10 bg-[#ff8a4c]/[0.025] px-3 py-2.5">
          <span className="text-xs text-[#b9b8bd]">Needs a reply</span>
          <span className="font-mono text-sm tabular-nums text-[#ffad7f]">{insights.needsReply}</span>
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        <IssueList title="Top complaints" items={insights.complaints} tone="complaint" />
        <IssueList title="Top praises" items={insights.praises} tone="positive" />
      </div>
    </div> : <p className="rounded-xl border border-dashed border-white/[0.1] px-4 py-8 text-center text-sm text-[#77777f]">Upload reviews to see product-level insights.</p>}
  </section>
}
