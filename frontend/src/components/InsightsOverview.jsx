import { useMemo } from 'react'
import { BentoCard, Icon, Spinner, StatCard } from './ReviewLensUI'
import ProductInsights from './ProductInsights'
import { getRatingSentimentAgreement } from '../utils/ratingSentimentAgreement'

function SentimentDistributionBar({ summary }) {
  const items = [
    { key: 'positive', label: 'Positive', color: 'bg-emerald-400', text: 'text-emerald-300' },
    { key: 'neutral', label: 'Neutral', color: 'bg-amber-300', text: 'text-amber-200' },
    { key: 'negative', label: 'Negative', color: 'bg-rose-400', text: 'text-rose-300' }
  ]

  return (
    <div className="mt-4 rounded-xl border border-white/[0.06] bg-[#09090b]/60 p-4">
      <div className="mb-3 flex items-center justify-between gap-2">
        <span className="font-mono text-[10.5px] uppercase tracking-[0.1em] text-[#a1a1aa]">Sentiment Distribution</span>
        <span className="font-mono text-[10px] text-[#71717a]">Unique classified feedback</span>
      </div>
      <div
        className="flex h-4 w-full overflow-hidden rounded-full bg-white/[0.06] p-0.5"
        role="img"
        aria-label={items.map(item => `${item.label} ${summary.sentimentPercentages?.[item.key] || 0}%`).join(', ')}
      >
        {items.map(item => (
          <span
            key={item.key}
            className={`${item.color} rounded-full transition-[width] duration-500`}
            style={{ width: `${summary.sentimentPercentages?.[item.key] || 0}%` }}
          />
        ))}
      </div>
      <div className="mt-3 flex flex-wrap gap-x-6 gap-y-2">
        {items.map(item => (
          <span key={item.key} className="inline-flex items-center gap-2 text-xs text-[#a1a1aa]">
            <i className={`h-2 w-2 rounded-full ${item.color}`} />
            <span>{item.label}</span>
            <b className={`font-mono font-semibold tabular-nums ${item.text}`}>
              {summary.sentimentPercentages?.[item.key] || 0}%
            </b>
          </span>
        ))}
      </div>
    </div>
  )
}

function InsightListCard({ title, subtitle, items = [], tone = 'rose' }) {
  const isRose = tone === 'rose'
  const theme = isRose
    ? {
        border: 'border-[#ff8a4c]/20',
        icon: 'text-[#ff8a4c] bg-[#ff8a4c]/10 border-[#ff8a4c]/20',
        rank: 'border-[#ff8a4c]/20 bg-[#ff8a4c]/[0.06] text-[#ffad7f]',
        chip: 'border-[#ff8a4c]/20 bg-[#ff8a4c]/[0.04] text-[#ffad7f]',
        iconName: 'negative',
        tag: 'Critical friction'
      }
    : {
        border: 'border-emerald-400/20',
        icon: 'text-emerald-300 bg-emerald-400/10 border-emerald-400/20',
        rank: 'border-emerald-400/20 bg-emerald-400/[0.06] text-emerald-300',
        chip: 'border-emerald-400/15 bg-emerald-400/[0.04] text-emerald-200',
        iconName: 'positive',
        tag: 'Positive signals'
      }

  return (
    <BentoCard className={theme.border}>
      <div className="mb-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className={`flex h-9 w-9 items-center justify-center rounded-xl border ${theme.icon}`}>
            <Icon name={theme.iconName} className="h-4 w-4" />
          </span>
          <div>
            <h3 className="text-base font-semibold tracking-tight text-[#f5f5f4]">{title}</h3>
            <p className="font-mono text-[11px] text-[#71717a]">{subtitle}</p>
          </div>
        </div>
        <span className="rounded-full border border-white/[0.08] bg-white/[0.03] px-2.5 py-0.5 font-mono text-[10.5px] text-[#a1a1aa]">
          {items.length} {items.length === 1 ? 'theme' : 'themes'}
        </span>
      </div>

      {items.length ? (
        <ol className="space-y-2.5">
          {items.map((item, index) => {
            const itemTopics = item.topic.split(',').map(v => v.trim()).filter(Boolean)
            return (
              <li
                key={`${item.topic}-${item.summary}`}
                className="bento-subcard flex items-start gap-3 p-3.5 transition duration-150 hover:border-white/[0.14]"
              >
                <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border font-mono text-xs font-bold tabular-nums ${theme.rank}`}>
                  {String(index + 1).padStart(2, '0')}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-medium leading-5 text-[#f5f5f4]">“{item.summary}”</p>
                  <div className="mt-1.5 flex flex-wrap gap-1.5">
                    {itemTopics.map(topic => (
                      <span key={topic} className={`rounded-md border px-2 py-0.5 font-mono text-[10px] capitalize ${theme.chip}`}>
                        {topic.replaceAll('_', ' ')}
                      </span>
                    ))}
                  </div>
                </div>
                <span className="shrink-0 rounded-lg border border-white/[0.08] bg-white/[0.03] px-2.5 py-1 font-mono text-xs text-[#f5f5f4]">
                  <b className="font-semibold">{item.count}</b>
                  <span className="ml-1 text-[10px] text-[#71717a]">{item.count === 1 ? 'mention' : 'mentions'}</span>
                </span>
              </li>
            )
          })}
        </ol>
      ) : (
        <p className="rounded-xl border border-dashed border-white/[0.08] p-6 text-center font-mono text-xs text-[#71717a]">
          Analyze reviews to populate insights.
        </p>
      )}
    </BentoCard>
  )
}

function ProductComparisonMatrix({ products = [], onSelectProduct }) {
  if (!products.length) return null

  return (
    <div className="bento-card mb-6 p-5 sm:p-6">
      <div className="mb-4 flex flex-col justify-between gap-2 sm:flex-row sm:items-center">
        <div>
          <div className="flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-[#ff8a4c]" />
            <p className="font-mono text-[10.5px] font-semibold uppercase tracking-[0.14em] text-[#ff8a4c]">
              CROSS-PRODUCT BENCHMARK
            </p>
          </div>
          <h3 className="mt-1 text-base font-semibold tracking-tight text-[#f5f5f4]">Product Catalog Breakdown</h3>
          <p className="font-mono text-[11px] text-[#71717a]">
            Compare feedback volume, sentiment splits, and dominant friction areas across products
          </p>
        </div>
        <span className="font-mono text-xs text-[#a1a1aa]">{products.length} products detected</span>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {products.map(item => (
          <div
            key={item.product}
            className="bento-subcard flex flex-col justify-between p-4 transition duration-200 hover:border-white/[0.16]"
          >
            <div>
              <div className="flex items-start justify-between gap-2">
                <h4 className="text-sm font-semibold capitalize text-[#f5f5f4]">{item.product}</h4>
                <span className="shrink-0 rounded-full border border-white/[0.08] bg-white/[0.03] px-2 py-0.5 font-mono text-[10px] text-[#a1a1aa]">
                  {item.totalReviews} reviews
                </span>
              </div>

              <div className="mt-3">
                <div className="flex items-center justify-between font-mono text-[10.5px] text-[#71717a]">
                  <span>Sentiment split</span>
                  <span>
                    <span className="font-medium text-emerald-300">{item.positivePercent}% pos</span> ·{' '}
                    <span className="font-medium text-rose-300">{item.negativePercent}% neg</span>
                  </span>
                </div>
                <div className="mt-1.5 flex h-2 w-full overflow-hidden rounded-full bg-white/[0.07]">
                  {item.positivePercent > 0 && <span className="bg-emerald-400" style={{ width: `${item.positivePercent}%` }} />}
                  {item.neutralPercent > 0 && <span className="bg-amber-300" style={{ width: `${item.neutralPercent}%` }} />}
                  {item.negativePercent > 0 && <span className="bg-rose-400" style={{ width: `${item.negativePercent}%` }} />}
                </div>
              </div>

              <div className="mt-3.5 flex items-center justify-between border-t border-white/[0.06] pt-2 font-mono text-xs">
                <span className="text-[#71717a]">Primary friction:</span>
                <span className="font-medium capitalize text-[#dedde1]">
                  {item.topTheme ? item.topTheme.replaceAll('_', ' ') : 'None'}
                </span>
              </div>

              <div className="mt-1 flex items-center justify-between font-mono text-xs">
                <span className="text-[#71717a]">Follow-up needed:</span>
                <span className="font-semibold text-[#ffad7f]">{item.needsReply}</span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => onSelectProduct(item.product)}
              className="mt-3.5 flex w-full items-center justify-between rounded-lg border border-[#ff8a4c]/25 bg-[#ff8a4c]/[0.06] px-3 py-1.5 font-mono text-xs font-semibold text-[#ffad7f] transition hover:border-[#ff8a4c]/40 hover:bg-[#ff8a4c]/10"
            >
              <span>Focus on this product</span>
              <Icon name="arrow" className="h-3.5 w-3.5" />
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function InsightsOverview({
  summary,
  reviewCount,
  complaints = [],
  praises = [],
  reviews = [],
  onAnalyzeAll,
  analyzing,
  selectedProduct = 'all',
  onSelectProduct,
  onSelectTheme
}) {
  const products = useMemo(
    () => [...new Set(reviews.map(review => review.product).filter(Boolean))].sort((a, b) => a.localeCompare(b)),
    [reviews]
  )

  const activeMetrics = useMemo(() => {
    if (selectedProduct === 'all') {
      const ratingAgreement = getRatingSentimentAgreement(reviews)
      return {
        analyzedCount: summary?.totalReviews ?? 0,
        totalCount: reviewCount,
        sentimentCounts: summary?.sentimentCounts || { positive: 0, neutral: 0, negative: 0 },
        sentimentPercentages: summary?.sentimentPercentages || { positive: 0, neutral: 0, negative: 0 },
        needsReply: summary?.needsReply ?? 0,
        ratingAgreement,
        complaints,
        praises,
        isFiltered: false
      }
    }

    const filteredReviews = reviews.filter(r => r.product === selectedProduct)
    const analyzed = filteredReviews.filter(r => r.analysisStatus === 'completed' && r.analysis?.sentiment)
    const sentimentCounts = { positive: 0, neutral: 0, negative: 0 }
    const issueGroups = { complaints: new Map(), praises: new Map() }

    for (const r of analyzed) {
      const analysis = r.analysis
      sentimentCounts[analysis.sentiment] += 1

      if (analysis.sentiment === 'negative' || analysis.sentiment === 'positive') {
        const kind = analysis.sentiment === 'negative' ? 'complaints' : 'praises'
        const topic = [...(analysis.topics || [])].sort().join(', ') || 'other'
        const itemSummary = analysis.summary || 'No summary available'
        const key = `${topic}:${itemSummary.toLowerCase()}`
        const item = issueGroups[kind].get(key) || { topic, summary: itemSummary, count: 0 }
        item.count += 1
        issueGroups[kind].set(key, item)
      }
    }

    const total = analyzed.length
    const sentimentPercentages = Object.fromEntries(
      Object.entries(sentimentCounts).map(([key, count]) => [key, total ? Math.round((count / total) * 100) : 0])
    )

    const productComplaints = [...issueGroups.complaints.values()]
      .sort((a, b) => b.count - a.count || a.summary.localeCompare(b.summary))
      .slice(0, 3)

    const productPraises = [...issueGroups.praises.values()]
      .sort((a, b) => b.count - a.count || a.summary.localeCompare(b.summary))
      .slice(0, 3)

    const ratingAgreement = getRatingSentimentAgreement(filteredReviews)

    return {
      analyzedCount: total,
      totalCount: filteredReviews.length,
      sentimentCounts,
      sentimentPercentages,
      needsReply: analyzed.filter(r => r.analysis.needs_reply).length,
      ratingAgreement,
      complaints: productComplaints,
      praises: productPraises,
      isFiltered: true
    }
  }, [selectedProduct, reviews, summary, reviewCount, complaints, praises])

  const productComparison = useMemo(() => {
    if (!products.length) return []
    return products.map(prod => {
      const prodReviews = reviews.filter(r => r.product === prod)
      const analyzed = prodReviews.filter(r => r.analysisStatus === 'completed' && r.analysis?.sentiment)
      const pos = analyzed.filter(r => r.analysis.sentiment === 'positive').length
      const neu = analyzed.filter(r => r.analysis.sentiment === 'neutral').length
      const neg = analyzed.filter(r => r.analysis.sentiment === 'negative').length
      const total = analyzed.length

      const topicCounts = new Map()
      for (const r of analyzed) {
        if (r.analysis.sentiment === 'negative') {
          for (const t of r.analysis.topics || []) {
            topicCounts.set(t, (topicCounts.get(t) || 0) + 1)
          }
        }
      }
      const topTheme = [...topicCounts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] || ''

      return {
        product: prod,
        totalReviews: prodReviews.length,
        analyzedCount: total,
        positivePercent: total ? Math.round((pos / total) * 100) : 0,
        neutralPercent: total ? Math.round((neu / total) * 100) : 0,
        negativePercent: total ? Math.round((neg / total) * 100) : 0,
        topTheme,
        needsReply: analyzed.filter(r => r.analysis.needs_reply).length
      }
    })
  }, [products, reviews])

  const analyzed = activeMetrics.analyzedCount

  return (
    <div className="space-y-6">
      {/* SECTION A: Bento 8 cols Executive Overview + 4 cols Active Product Scope Switcher */}
      <div className="grid gap-4.5 lg:grid-cols-12">
        {/* 8 Columns: Executive Overview */}
        <div className="bento-card flex flex-col justify-between overflow-hidden p-5 sm:p-6 lg:col-span-8">
          <div>
            <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#ff8a4c]" />
                  <p className="font-mono text-[10.5px] font-semibold uppercase tracking-[0.14em] text-[#ff8a4c]">
                    {activeMetrics.isFiltered ? `PRODUCT SCOPE: ${selectedProduct}` : 'EXECUTIVE OVERVIEW'}
                  </p>
                </div>
                <div className="mt-1 flex flex-wrap items-baseline gap-2">
                  <h2 className="text-xl font-semibold tracking-tight text-[#f5f5f4]">
                    {activeMetrics.isFiltered ? `${selectedProduct} Intelligence` : 'Executive Intelligence'}
                  </h2>
                  <span className="font-mono text-xs text-[#71717a]">
                    · {analyzed ? `${analyzed} of ${activeMetrics.totalCount} analyzed` : 'Awaiting analysis'}
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={onAnalyzeAll}
                disabled={analyzing}
                title="Analyze all unique reviews and update the insights"
                className="button-primary min-h-10 px-4 text-xs font-mono uppercase tracking-[0.06em]"
              >
                {analyzing ? (
                  <>
                    <Spinner className="h-3 w-3" />
                    <span>Analyzing Reviews...</span>
                  </>
                ) : (
                  <>
                    <Icon name="spark" className="h-3.5 w-3.5" />
                    <span>Analyze All Reviews</span>
                  </>
                )}
              </button>
            </div>

            {/* 6 Metric Stat Cards */}
            <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 xl:grid-cols-6">
              <StatCard
                title="Analyzed"
                value={analyzed}
                detail={`${activeMetrics.totalCount} accepted`}
                icon="review"
                accent="blue"
                tooltip="Count of reviews with a completed AI analysis"
              />
              <StatCard
                title="Positive"
                value={`${activeMetrics.sentimentPercentages.positive}%`}
                detail={`${activeMetrics.sentimentCounts.positive} reviews`}
                icon="positive"
                accent="emerald"
                tooltip="Share of analyzed reviews classified as positive"
              />
              <StatCard
                title="Neutral"
                value={`${activeMetrics.sentimentPercentages.neutral}%`}
                detail={`${activeMetrics.sentimentCounts.neutral} reviews`}
                icon="neutral"
                accent="amber"
                tooltip="Share of analyzed reviews classified as neutral"
              />
              <StatCard
                title="Negative"
                value={`${activeMetrics.sentimentPercentages.negative}%`}
                detail={`${activeMetrics.sentimentCounts.negative} reviews`}
                icon="negative"
                accent="rose"
                tooltip="Share of analyzed reviews classified as negative"
              />
              <StatCard
                title="Need Reply"
                value={activeMetrics.needsReply}
                detail="Critical follow-ups"
                icon="reply"
                accent="rose"
                tooltip="Reviews with complaints or unresolved issues that should receive a response"
              />
              <StatCard
                title="Agreement"
                value={activeMetrics.ratingAgreement.percentage == null ? '—' : `${activeMetrics.ratingAgreement.percentage}%`}
                detail={activeMetrics.ratingAgreement.compared ? `${activeMetrics.ratingAgreement.mismatches} mismatches` : 'No rated items'}
                icon="chart"
                accent="amber"
                tooltip="Star rating vs sentiment agreement (1-2★ negative, 3★ neutral, 4-5★ positive)"
              />
            </div>
          </div>

          {analyzed > 0 && <SentimentDistributionBar summary={activeMetrics} />}
        </div>

        {/* 4 Columns: Active Product Scope Switcher */}
        <div className="bento-card flex flex-col justify-between overflow-hidden p-5 sm:p-6 lg:col-span-4">
          <div>
            <div className="mb-3.5 flex items-start justify-between gap-2">
              <div>
                <div className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#ff8a4c]" />
                  <p className="font-mono text-[10.5px] font-semibold uppercase tracking-[0.14em] text-[#ff8a4c]">
                    CATALOG SCOPE
                  </p>
                </div>
                <h3 className="mt-1 text-base font-semibold tracking-tight text-[#f5f5f4]">Product Focus</h3>
              </div>
              <span className="rounded-full border border-white/[0.08] bg-white/[0.03] px-2 py-0.5 font-mono text-[10.5px] text-[#a1a1aa]">
                {products.length} products
              </span>
            </div>
            <p className="font-mono text-[11px] text-[#71717a] mb-3">
              Switching scope recalculates trends, themes, and executive metrics.
            </p>

            <div className="space-y-1.5 max-h-[260px] overflow-y-auto pr-1">
              <button
                type="button"
                onClick={() => onSelectProduct('all')}
                className={`flex w-full items-center justify-between rounded-xl border p-2.5 font-mono text-xs transition duration-150 ${
                  selectedProduct === 'all'
                    ? 'border-[#ff8a4c]/50 bg-[#ff8a4c]/15 font-semibold text-[#ffad7f] shadow-[0_0_12px_rgba(255,138,76,0.15)]'
                    : 'border-white/[0.06] bg-white/[0.02] text-[#a1a1aa] hover:border-white/[0.12] hover:bg-white/[0.04] hover:text-white'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className={`h-2 w-2 rounded-full ${selectedProduct === 'all' ? 'bg-[#ff8a4c]' : 'bg-zinc-600'}`} />
                  <span>All Products</span>
                </div>
                <span className="text-[11px] text-[#71717a]">{reviewCount} total</span>
              </button>

              {products.map(p => {
                const count = reviews.filter(r => r.product === p).length
                const isSelected = selectedProduct === p
                return (
                  <button
                    key={p}
                    type="button"
                    onClick={() => onSelectProduct(p)}
                    className={`flex w-full items-center justify-between rounded-xl border p-2.5 font-mono text-xs capitalize transition duration-150 ${
                      isSelected
                        ? 'border-[#ff8a4c]/50 bg-[#ff8a4c]/15 font-semibold text-[#ffad7f] shadow-[0_0_12px_rgba(255,138,76,0.15)]'
                        : 'border-white/[0.06] bg-white/[0.02] text-[#a1a1aa] hover:border-white/[0.12] hover:bg-white/[0.04] hover:text-white'
                    }`}
                  >
                    <div className="flex items-center gap-2 truncate">
                      <span className={`h-2 w-2 rounded-full shrink-0 ${isSelected ? 'bg-[#ff8a4c]' : 'bg-zinc-600'}`} />
                      <span className="truncate">{p}</span>
                    </div>
                    <span className="text-[11px] text-[#71717a] shrink-0">{count} reviews</span>
                  </button>
                )
              })}
            </div>
          </div>

          {selectedProduct !== 'all' && (
            <button
              type="button"
              onClick={() => onSelectProduct('all')}
              className="mt-3.5 flex w-full items-center justify-center gap-1.5 rounded-lg border border-white/[0.08] bg-white/[0.03] py-1.5 font-mono text-[11px] text-[#a1a1aa] transition hover:bg-white/[0.06] hover:text-white"
            >
              <span>Reset to All Products</span>
            </button>
          )}
        </div>
      </div>

      {/* SECTION B: 7 cols Sentiment Velocity & Trends + 5 cols Product Issue Themes */}
      <ProductInsights
        reviews={reviews}
        selectedProduct={selectedProduct === 'all' ? undefined : selectedProduct}
        onSelectProduct={onSelectProduct}
        onSelectTheme={onSelectTheme}
      />

      {/* SECTION C: 6 cols Top Customer Complaints + 6 cols Top Customer Praises */}
      <div className="grid gap-4.5 lg:grid-cols-2">
        <InsightListCard
          title={activeMetrics.isFiltered ? `Top Complaints for ${selectedProduct}` : 'Top Customer Complaints'}
          subtitle={activeMetrics.isFiltered ? 'Reported friction areas for this product' : 'Top issues customers want resolved'}
          items={activeMetrics.complaints}
          tone="rose"
        />
        <InsightListCard
          title={activeMetrics.isFiltered ? `Top Praises for ${selectedProduct}` : 'Top Customer Praises'}
          subtitle={activeMetrics.isFiltered ? 'What customers love about this product' : 'Highest-rated product strengths'}
          items={activeMetrics.praises}
          tone="emerald"
        />
      </div>

      {/* Cross-Product Benchmark (When All Products selected and >1 products) */}
      {selectedProduct === 'all' && products.length > 1 && (
        <ProductComparisonMatrix products={productComparison} onSelectProduct={onSelectProduct} />
      )}
    </div>
  )
}
