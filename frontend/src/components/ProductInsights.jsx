import { useMemo, useState } from 'react'
import { Icon } from './ReviewLensUI'

const sentimentTypes = [
  { key: 'positive', label: 'Positive', bar: 'bg-emerald-400', text: 'text-emerald-300', line: '#34d399' },
  { key: 'neutral', label: 'Neutral', bar: 'bg-amber-300', text: 'text-amber-200', line: '#fbbf24' },
  { key: 'negative', label: 'Negative', bar: 'bg-rose-400', text: 'text-rose-300', line: '#fb7185' }
]

const TOPIC_META = {
  quality: { label: 'Quality & Durability', icon: 'spark', color: 'text-blue-300', bg: 'bg-blue-400/10 border-blue-400/20' },
  delivery: { label: 'Delivery & Shipping', icon: 'upload', color: 'text-amber-300', bg: 'bg-amber-400/10 border-amber-400/20' },
  price: { label: 'Price & Value', icon: 'chart', color: 'text-emerald-300', bg: 'bg-emerald-400/10 border-emerald-400/20' },
  packaging: { label: 'Packaging', icon: 'review', color: 'text-purple-300', bg: 'bg-purple-400/10 border-purple-400/20' },
  support: { label: 'Customer Support', icon: 'reply', color: 'text-rose-300', bg: 'bg-rose-400/10 border-rose-400/20' },
  size_fit: { label: 'Size & Fit', icon: 'check', color: 'text-teal-300', bg: 'bg-teal-400/10 border-teal-400/20' },
  other: { label: 'General / Other', icon: 'help', color: 'text-slate-300', bg: 'bg-slate-400/10 border-slate-400/20' }
}

function SentimentTrendChart({ points }) {
  const width = 640
  const height = 230
  const left = 34
  const right = 12
  const top = 14
  const bottom = 26
  const chartWidth = width - left - right
  const chartHeight = height - top - bottom
  const levels = [0, 25, 50, 75, 100]
  const xAt = index => points.length < 2 ? left + chartWidth / 2 : left + index / (points.length - 1) * chartWidth
  const yAt = value => top + (100 - value) / 100 * chartHeight
  const labelIndexes = [...new Set([0, Math.floor((points.length - 1) / 2), points.length - 1])]

  if (!points.length) {
    return (
      <div className="flex min-h-[180px] items-center justify-center rounded-xl border border-dashed border-white/[0.08] px-4 text-center font-mono text-xs text-[#71717a]">
        Add review dates and analyze reviews to see sentiment trends over time.
      </div>
    )
  }

  const posAreaPath = points.length > 1
    ? `${points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${xAt(i)} ${yAt(p.positive)}`).join(' ')} L ${xAt(points.length - 1)} ${top + chartHeight} L ${xAt(0)} ${top + chartHeight} Z`
    : ''

  return (
    <div className="rounded-xl border border-white/[0.06] bg-[#09090b]/60 p-3 sm:p-4">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="aspect-[2.5/1] min-h-[170px] w-full overflow-visible"
        role="img"
        aria-label={`Sentiment percentages by review date for ${points.length} dates`}
      >
        <defs>
          <linearGradient id="trendPosGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#34d399" stopOpacity="0.25" />
            <stop offset="100%" stopColor="#34d399" stopOpacity="0.0" />
          </linearGradient>
        </defs>

        {/* Grid lines */}
        {levels.map(level => (
          <g key={level}>
            <line
              x1={left}
              x2={width - right}
              y1={yAt(level)}
              y2={yAt(level)}
              stroke="rgba(255,255,255,0.06)"
              strokeDasharray={level === 0 ? undefined : '3 5'}
            />
            <text
              x={left - 8}
              y={yAt(level) + 3}
              textAnchor="end"
              fill="#71717a"
              fontSize="9"
              fontFamily="IBM Plex Mono, monospace"
            >
              {level}
            </text>
          </g>
        ))}

        {/* Area fill */}
        {posAreaPath && <path d={posAreaPath} fill="url(#trendPosGradient)" />}

        {/* Date labels */}
        {labelIndexes.map(index => (
          <text
            key={points[index].date}
            x={xAt(index)}
            y={height - 6}
            textAnchor={index === 0 ? 'start' : index === points.length - 1 ? 'end' : 'middle'}
            fill="#71717a"
            fontSize="9.5"
            fontFamily="IBM Plex Mono, monospace"
          >
            {points[index].date.slice(5).replace('-', '/')}
          </text>
        ))}

        {/* Series lines & points */}
        {sentimentTypes.map(series => {
          const path = points.map((point, index) => `${index === 0 ? 'M' : 'L'} ${xAt(index)} ${yAt(point[series.key])}`).join(' ')
          return (
            <g key={series.key}>
              {points.length > 1 && (
                <path
                  d={path}
                  fill="none"
                  stroke={series.line}
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  vectorEffect="non-scaling-stroke"
                />
              )}
              {points.map((point, index) => (
                <circle
                  key={`${series.key}-${point.date}`}
                  cx={xAt(index)}
                  cy={yAt(point[series.key])}
                  r="4"
                  fill="#111114"
                  stroke={series.line}
                  strokeWidth="2"
                  vectorEffect="non-scaling-stroke"
                  className="transition-transform duration-150 hover:scale-125"
                >
                  <title>{`${series.label}: ${point[series.key]}% on ${point.date} (${point.count} reviews)`}</title>
                </circle>
              ))}
            </g>
          )
        })}
      </svg>
    </div>
  )
}

export default function ProductInsights({
  reviews = [],
  selectedProduct,
  onSelectProduct,
  onSelectTheme
}) {
  const [internalProduct, setInternalProduct] = useState('')
  const products = useMemo(
    () => [...new Set(reviews.map(review => review.product).filter(Boolean))].sort((a, b) => a.localeCompare(b)),
    [reviews]
  )

  const effectiveSelected = selectedProduct !== undefined ? selectedProduct : internalProduct
  const activeProduct = products.includes(effectiveSelected) ? effectiveSelected : products[0] || ''

  const handleProductChange = nextProduct => {
    setInternalProduct(nextProduct)
    if (onSelectProduct) onSelectProduct(nextProduct)
  }

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
    const topicStats = new Map()
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

      const reviewTopics = analysis.topics || []
      for (const topic of reviewTopics) {
        const current = topicStats.get(topic) || {
          topic,
          totalMentions: 0,
          positive: 0,
          neutral: 0,
          negative: 0,
          complaints: new Map(),
          praises: new Map()
        }
        current.totalMentions += 1
        current[analysis.sentiment] += 1

        if (analysis.sentiment === 'negative' && analysis.summary) {
          const count = current.complaints.get(analysis.summary) || 0
          current.complaints.set(analysis.summary, count + 1)
        } else if (analysis.sentiment === 'positive' && analysis.summary) {
          const count = current.praises.get(analysis.summary) || 0
          current.praises.set(analysis.summary, count + 1)
        }

        topicStats.set(topic, current)
      }
    }

    const total = analyzed.length
    const sentimentPercentages = Object.fromEntries(
      Object.entries(sentimentCounts).map(([key, count]) => [key, total ? Math.round((count / total) * 100) : 0])
    )

    const sentimentTrend = [...dateGroups.values()]
      .sort((a, b) => a.date.localeCompare(b.date))
      .map(group => ({
        ...group,
        positive: Math.round((group.positive / group.count) * 100),
        neutral: Math.round((group.neutral / group.count) * 100),
        negative: Math.round((group.negative / group.count) * 100)
      }))

    let trajectory = null
    if (sentimentTrend.length >= 2) {
      const mid = Math.floor(sentimentTrend.length / 2)
      const firstHalf = sentimentTrend.slice(0, mid)
      const secondHalf = sentimentTrend.slice(mid)
      const avgFirstPos = firstHalf.reduce((sum, p) => sum + p.positive, 0) / firstHalf.length
      const avgSecondPos = secondHalf.reduce((sum, p) => sum + p.positive, 0) / secondHalf.length
      const diff = Math.round(avgSecondPos - avgFirstPos)

      if (diff >= 7) {
        trajectory = { label: 'Improving', badge: 'text-emerald-300 bg-emerald-400/10 border-emerald-400/20', note: `+${diff}% in recent reviews` }
      } else if (diff <= -7) {
        trajectory = { label: 'Declining', badge: 'text-rose-300 bg-rose-400/10 border-rose-400/20', note: `${diff}% in recent reviews` }
      } else {
        trajectory = { label: 'Stable', badge: 'text-blue-300 bg-blue-400/10 border-blue-400/20', note: 'Consistent sentiment' }
      }
    }

    const structuredThemes = [...topicStats.values()]
      .map(t => {
        const posPct = t.totalMentions ? Math.round((t.positive / t.totalMentions) * 100) : 0
        const neuPct = t.totalMentions ? Math.round((t.neutral / t.totalMentions) * 100) : 0
        const negPct = t.totalMentions ? Math.round((t.negative / t.totalMentions) * 100) : 0

        const topComplaints = [...t.complaints.entries()]
          .map(([summary, count]) => ({ summary, count }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 2)

        const topPraises = [...t.praises.entries()]
          .map(([summary, count]) => ({ summary, count }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 2)

        return {
          topic: t.topic,
          totalMentions: t.totalMentions,
          positivePercent: posPct,
          neutralPercent: neuPct,
          negativePercent: negPct,
          topComplaints,
          topPraises
        }
      })
      .sort((a, b) => b.negativePercent * b.totalMentions - a.negativePercent * a.totalMentions || b.totalMentions - a.totalMentions)

    return {
      productReviewCount: productReviews.length,
      analyzed,
      sentimentCounts,
      sentimentPercentages,
      sentimentTrend,
      trajectory,
      structuredThemes,
      datedReviewCount: sentimentTrend.reduce((count, point) => count + point.count, 0),
      needsReply: analyzed.filter(review => review.analysis.needs_reply).length
    }
  }, [reviews, activeProduct])

  if (!activeProduct) return null

  return (
    <div className="grid gap-4.5 lg:grid-cols-12">
      {/* 7 Columns: Sentiment Velocity & Trends */}
      <div className="bento-card flex flex-col overflow-hidden p-5 sm:p-6 lg:col-span-7">
        <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-[#ff8a4c]" />
              <p className="font-mono text-[10.5px] font-semibold uppercase tracking-[0.14em] text-[#ff8a4c]">
                SENTIMENT VELOCITY & TRENDS
              </p>
            </div>
            <h3 className="mt-1 text-base font-semibold tracking-tight text-[#f5f5f4]">
              Trajectory for {activeProduct}
            </h3>
          </div>
          <div className="flex items-center gap-2">
            {insights.trajectory && (
              <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 font-mono text-[10px] font-medium ${insights.trajectory.badge}`}>
                {insights.trajectory.label} · {insights.trajectory.note}
              </span>
            )}
            <span className="font-mono text-[11px] text-[#71717a]">
              {insights.sentimentTrend.length} dates
            </span>
          </div>
        </div>

        <SentimentTrendChart points={insights.sentimentTrend} />

        {/* Legend */}
        <div className="mt-3 flex flex-wrap items-center justify-between gap-3 font-mono text-[11px]">
          <div className="flex items-center gap-4">
            {sentimentTypes.map(item => (
              <span key={item.key} className="inline-flex items-center gap-1.5 text-[#a1a1aa]">
                <i className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: item.line }} />
                <span>{item.label}</span>
              </span>
            ))}
          </div>
          {insights.datedReviewCount < insights.analyzed.length && (
            <span className="text-[10px] text-[#71717a]">
              {insights.analyzed.length - insights.datedReviewCount} reviews without valid date excluded
            </span>
          )}
        </div>

        {/* Mini stats footer directly beneath the chart */}
        <div className="mt-4 grid grid-cols-3 gap-2.5 border-t border-white/[0.06] pt-3.5">
          {sentimentTypes.map(item => (
            <div key={item.key} className="bento-subcard p-3">
              <span className="font-mono text-[10px] text-[#71717a]">{item.label}</span>
              <p className={`mt-0.5 font-mono text-base font-bold tabular-nums ${item.text}`}>
                {insights.sentimentPercentages[item.key]}%
              </p>
              <p className="font-mono text-[10px] text-[#71717a]">{insights.sentimentCounts[item.key]} reviews</p>
            </div>
          ))}
        </div>

        {/* Follow-up / Trajectory insight pill */}
        <div className="mt-3 flex items-center justify-between rounded-xl border border-white/[0.06] bg-white/[0.02] px-3.5 py-2.5">
          <div className="flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-[#ff8a4c]" />
            <span className="font-mono text-xs text-[#a1a1aa]">Critical follow-up required</span>
          </div>
          <span className="font-mono text-xs font-semibold text-[#ffad7f]">
            {insights.needsReply} {insights.needsReply === 1 ? 'review' : 'reviews'}
          </span>
        </div>
      </div>

      {/* 5 Columns: Product Issue Themes */}
      <div className="bento-card flex flex-col justify-between overflow-hidden p-5 sm:p-6 lg:col-span-5">
        <div>
          <div className="mb-4 flex items-start justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-[#ff8a4c]" />
                <p className="font-mono text-[10.5px] font-semibold uppercase tracking-[0.14em] text-[#ff8a4c]">
                  RECURRING THEMES
                </p>
              </div>
              <h3 className="mt-1 text-base font-semibold tracking-tight text-[#f5f5f4]">
                Friction & Drivers
              </h3>
            </div>
            <span className="rounded-full border border-white/[0.08] bg-white/[0.03] px-2.5 py-0.5 font-mono text-[10.5px] text-[#a1a1aa]">
              {insights.structuredThemes.length} themes
            </span>
          </div>

          {insights.structuredThemes.length ? (
            <div className="space-y-3">
              {insights.structuredThemes.slice(0, 4).map(theme => {
                const meta = TOPIC_META[theme.topic] || {
                  label: theme.topic.replaceAll('_', ' '),
                  icon: 'spark',
                  color: 'text-slate-300',
                  bg: 'bg-white/[0.03] border-white/[0.08]'
                }
                const isSevere = theme.negativePercent >= 50 && theme.totalMentions >= 2
                const isPositive = theme.positivePercent >= 60

                return (
                  <div
                    key={theme.topic}
                    className="bento-subcard p-3.5 transition duration-150 hover:border-white/[0.14]"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border ${meta.bg} ${meta.color}`}>
                          <Icon name={meta.icon} className="h-3.5 w-3.5" />
                        </span>
                        <div className="min-w-0">
                          <p className="truncate text-xs font-semibold text-[#f5f5f4]">{meta.label}</p>
                          <p className="font-mono text-[10px] text-[#71717a]">{theme.totalMentions} mentions</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        {isSevere && (
                          <span className="rounded-full border border-rose-400/25 bg-rose-400/10 px-2 py-0.5 font-mono text-[9.5px] text-rose-300">
                            Friction
                          </span>
                        )}
                        {isPositive && (
                          <span className="rounded-full border border-emerald-400/25 bg-emerald-400/10 px-2 py-0.5 font-mono text-[9.5px] text-emerald-300">
                            Praised
                          </span>
                        )}
                        {onSelectTheme && (
                          <button
                            type="button"
                            onClick={() => onSelectTheme(theme.topic)}
                            title="Filter Explorer by this theme"
                            className="rounded-lg border border-white/[0.08] bg-white/[0.02] p-1 text-[#71717a] transition hover:border-[#ff8a4c]/40 hover:text-[#ffad7f]"
                          >
                            <Icon name="arrow" className="h-3 w-3" />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Progress bar */}
                    <div className="mt-2.5">
                      <div className="flex items-center justify-between font-mono text-[10px] text-[#71717a]">
                        <span>{theme.positivePercent}% pos</span>
                        <span>{theme.negativePercent}% neg</span>
                      </div>
                      <div className="mt-1 flex h-1.5 w-full overflow-hidden rounded-full bg-white/[0.06]">
                        {theme.positivePercent > 0 && <span className="bg-emerald-400" style={{ width: `${theme.positivePercent}%` }} />}
                        {theme.neutralPercent > 0 && <span className="bg-amber-300" style={{ width: `${theme.neutralPercent}%` }} />}
                        {theme.negativePercent > 0 && <span className="bg-rose-400" style={{ width: `${theme.negativePercent}%` }} />}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <p className="rounded-xl border border-dashed border-white/[0.08] p-5 text-center font-mono text-xs text-[#71717a]">
              Run analysis to detect recurring topic themes for this product.
            </p>
          )}
        </div>

        {/* Product selector switch if multiple */}
        {products.length > 1 && (
          <div className="mt-4 border-t border-white/[0.06] pt-3 flex flex-wrap items-center gap-1.5">
            <span className="font-mono text-[10px] uppercase text-[#71717a]">Switch product:</span>
            {products.map(p => (
              <button
                key={p}
                type="button"
                onClick={() => handleProductChange(p)}
                className={`rounded-md border px-2 py-0.5 font-mono text-[10.5px] transition ${
                  p === activeProduct
                    ? 'border-[#ff8a4c]/50 bg-[#ff8a4c]/15 font-semibold text-[#ffad7f]'
                    : 'border-white/[0.06] bg-white/[0.02] text-[#a1a1aa] hover:border-white/[0.12] hover:text-white'
                }`}
              >
                {p}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
