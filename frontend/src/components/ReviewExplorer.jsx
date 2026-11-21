import { useMemo, useState } from 'react'
import { AnalysisStatus, Icon, Rating, SentimentBadge, Spinner } from './ReviewLensUI'
import { isRatingSentimentMismatch } from '../utils/ratingSentimentAgreement'

function FilterSelect({ label, value, onChange, options }) {
  return (
    <label className="block">
      <span className="sr-only">Filter by {label}</span>
      <select
        title={`Filter reviews by ${label.toLowerCase()}`}
        value={value}
        onChange={event => onChange(event.target.value)}
        className="filter-input w-full capitalize font-mono text-xs focus:outline-none"
      >
        <option value="all">All {label}s</option>
        {options.map(option => (
          <option key={option} value={option}>
            {option.replaceAll('_', ' ')}
          </option>
        ))}
      </select>
    </label>
  )
}

export default function ReviewExplorer({
  reviews = [],
  replies = {},
  copiedId,
  loadingReviewId,
  loadingReplyId,
  busy,
  onAnalyze,
  onSuggestReply,
  onCopyReply,
  activeProductFilter = 'all',
  onProductFilterChange,
  activeTopicFilter = 'all',
  onTopicFilterChange
}) {
  const pageSize = 10
  const [query, setQuery] = useState('')
  const [localProduct, setLocalProduct] = useState('all')
  const [sentiment, setSentiment] = useState('all')
  const [localTopic, setLocalTopic] = useState('all')
  const [needsReply, setNeedsReply] = useState(false)
  const [visibleCount, setVisibleCount] = useState(pageSize)

  const product = activeProductFilter !== undefined ? activeProductFilter : localProduct
  const topic = activeTopicFilter !== undefined ? activeTopicFilter : localTopic

  const products = useMemo(
    () => [...new Set(reviews.map(review => review.product).filter(Boolean))].sort(),
    [reviews]
  )
  const topics = useMemo(
    () => [...new Set(reviews.flatMap(review => review.analysis?.topics || []))].sort(),
    [reviews]
  )

  const handleProductChange = nextProduct => {
    setLocalProduct(nextProduct)
    setVisibleCount(pageSize)
    if (onProductFilterChange) onProductFilterChange(nextProduct)
  }

  const handleTopicChange = nextTopic => {
    setLocalTopic(nextTopic)
    setVisibleCount(pageSize)
    if (onTopicFilterChange) onTopicFilterChange(nextTopic)
  }

  const filtered = reviews.filter(review => {
    const text = query.trim().toLowerCase()
    return (
      (!text ||
        review.reviewId.toLowerCase().includes(text) ||
        review.reviewText.toLowerCase().includes(text) ||
        review.product.toLowerCase().includes(text)) &&
      (product === 'all' || review.product === product) &&
      (sentiment === 'all' || review.analysis?.sentiment === sentiment) &&
      (topic === 'all' || review.analysis?.topics?.includes(topic)) &&
      (!needsReply || review.analysis?.needs_reply)
    )
  })

  const hasFilters = query || product !== 'all' || sentiment !== 'all' || topic !== 'all' || needsReply
  const changeFilter = setter => value => {
    setter(value)
    setVisibleCount(pageSize)
  }
  const clearFilters = () => {
    setQuery('')
    handleProductChange('all')
    setSentiment('all')
    handleTopicChange('all')
    setNeedsReply(false)
    setVisibleCount(pageSize)
  }

  const visibleReviews = filtered.slice(0, visibleCount)

  return (
    <section id="review-explorer" className="bento-card overflow-hidden p-0 shadow-[0_8px_32px_rgba(0,0,0,0.4)]">
      {/* Header & Filter Controls */}
      <div className="border-b border-white/[0.07] bg-[#111114] p-5 sm:p-6">
        <div className="flex flex-col justify-between gap-4 xl:flex-row xl:items-end">
          <div>
            <div className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-[#ff8a4c]" />
              <p className="font-mono text-[10.5px] font-semibold uppercase tracking-[0.14em] text-[#ff8a4c]">
                RAW INTELLIGENCE
              </p>
            </div>
            <div className="mt-1 flex flex-wrap items-baseline gap-2">
              <h2 className="text-xl font-semibold tracking-tight text-[#f5f5f4]">Customer Feedback Explorer</h2>
              <span className="font-mono text-xs text-[#71717a]">
                · Showing {visibleReviews.length} of {filtered.length} matching reviews ({reviews.length} total)
              </span>
            </div>
          </div>

          <div className="grid gap-2.5 sm:grid-cols-2 xl:grid-cols-4 xl:w-[740px]">
            <label className="relative block">
              <span className="sr-only">Search reviews</span>
              <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#71717a]">
                <Icon name="search" className="h-3.5 w-3.5" />
              </span>
              <input
                title="Search by review ID, product, or review text"
                value={query}
                onChange={event => changeFilter(setQuery)(event.target.value)}
                placeholder="Search reviews..."
                style={{ paddingLeft: '38px' }}
                className="filter-input pl-10 w-full font-mono text-xs focus:outline-none"
              />
            </label>
            <FilterSelect label="Product" value={product} onChange={handleProductChange} options={products} />
            <FilterSelect
              label="Sentiment"
              value={sentiment}
              onChange={changeFilter(setSentiment)}
              options={['positive', 'neutral', 'negative']}
            />
            <FilterSelect label="Topic" value={topic} onChange={handleTopicChange} options={topics} />
          </div>
        </div>

        {/* Filter Badges & Reply Toggle */}
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-white/[0.04] pt-3.5">
          <div className="flex flex-wrap items-center gap-2">
            <label className="inline-flex cursor-pointer items-center gap-2 font-mono text-xs text-[#a1a1aa] hover:text-[#f5f5f4]">
              <input
                type="checkbox"
                checked={needsReply}
                onChange={event => changeFilter(setNeedsReply)(event.target.checked)}
                className="h-3.5 w-3.5 rounded border-zinc-700 bg-zinc-950 text-[#ff8a4c] focus:ring-[#ff8a4c]"
              />
              <span>Needs follow-up only</span>
            </label>

            {product !== 'all' && (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-[#ff8a4c]/30 bg-[#ff8a4c]/10 px-2.5 py-0.5 font-mono text-[10.5px] font-medium text-[#ffad7f]">
                Product: {product}
                <button
                  type="button"
                  onClick={() => handleProductChange('all')}
                  className="ml-0.5 text-[#71717a] hover:text-white"
                  title="Clear product filter"
                >
                  ×
                </button>
              </span>
            )}

            {topic !== 'all' && (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-blue-400/25 bg-blue-400/10 px-2.5 py-0.5 font-mono text-[10.5px] font-medium text-blue-200 capitalize">
                Theme: {topic.replaceAll('_', ' ')}
                <button
                  type="button"
                  onClick={() => handleTopicChange('all')}
                  className="ml-0.5 text-blue-400 hover:text-white"
                  title="Clear theme filter"
                >
                  ×
                </button>
              </span>
            )}
          </div>

          {hasFilters && (
            <button
              type="button"
              onClick={clearFilters}
              className="font-mono text-xs text-[#ff8a4c] hover:underline"
            >
              Reset all filters
            </button>
          )}
        </div>
      </div>

      {/* Reviews Table */}
      <div className="overflow-x-auto">
        <table className="w-full min-w-[1080px] table-fixed text-left text-sm">
          <colgroup>
            <col className="w-[33%]" />
            <col className="w-[14%]" />
            <col className="w-[26%]" />
            <col className="w-[27%]" />
          </colgroup>
          <thead className="border-b border-white/[0.06] bg-[#09090b] font-mono text-[10.5px] font-semibold uppercase tracking-[0.12em] text-[#71717a]">
            <tr>
              <th className="px-5 py-3">Customer Feedback</th>
              <th className="px-4 py-3">Product</th>
              <th className="px-4 py-3">AI Intelligence</th>
              <th className="px-5 py-3">Suggested Reply</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/[0.04]">
            {visibleReviews.map(review => {
              const original = review.isDuplicate ? reviews.find(item => item.reviewId === review.duplicateOf) : null
              const targetId = review.isDuplicate && !original?.analysis ? review.duplicateOf : review.reviewId
              const isAnalyzing = loadingReviewId === review.reviewId || (review.isDuplicate && loadingReviewId === review.duplicateOf)

              return (
                <tr key={review.reviewId} className="group align-top transition-colors duration-150 hover:bg-white/[0.015]">
                  <td className="px-5 py-4.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-xs font-semibold text-[#f5f5f4]">{review.reviewId}</span>
                      <Rating rating={review.rating} />
                      {isRatingSentimentMismatch(review) && (
                        <span
                          title={`The ${review.rating}-star rating conflicts with the AI's ${review.analysis.sentiment} sentiment.`}
                          className="inline-flex items-center gap-1 rounded-full border border-amber-300/25 bg-amber-300/[0.08] px-2 py-0.5 font-mono text-[10px] font-medium text-amber-200"
                        >
                          <Icon name="warning" className="h-3 w-3" />
                          <span>Rating mismatch</span>
                        </span>
                      )}
                      {review.isDuplicate && (
                        <span className="rounded-full border border-white/[0.08] bg-white/[0.03] px-2 py-0.5 font-mono text-[10px] text-[#71717a]">
                          Duplicate of {review.duplicateOf}
                        </span>
                      )}
                    </div>
                    <p className="mt-2.5 whitespace-pre-line text-sm leading-6 text-[#dedde1]">{review.reviewText}</p>
                    <p className="mt-2 font-mono text-[10.5px] text-[#71717a]">
                      {review.date ? review.date.slice(0, 10) : 'No review date'}
                    </p>
                  </td>

                  <td className="px-4 py-4.5">
                    <span className="inline-block rounded-lg border border-white/[0.08] bg-white/[0.03] px-2.5 py-1 font-mono text-xs font-medium capitalize text-[#dedde1]">
                      {review.product}
                    </span>
                  </td>

                  <td className="px-4 py-4.5">
                    {review.analysis ? (
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <SentimentBadge sentiment={review.analysis.sentiment} />
                          {review.analysis.needs_reply && (
                            <span className="rounded-full border border-rose-400/25 bg-rose-400/10 px-2 py-0.5 font-mono text-[10px] font-semibold text-rose-300">
                              Needs reply
                            </span>
                          )}
                        </div>
                        <p className="mt-2 text-xs font-medium leading-5 text-[#f5f5f4]">“{review.analysis.summary}”</p>
                        <div className="mt-2 flex flex-wrap gap-1.5">
                          {review.analysis.topics?.map(t => (
                            <span
                              key={t}
                              className="rounded-md border border-white/[0.06] bg-white/[0.025] px-2 py-0.5 font-mono text-[10px] text-[#a1a1aa] capitalize"
                            >
                              {t.replaceAll('_', ' ')}
                            </span>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <AnalysisStatus status={review.analysisStatus} />
                        <div>
                          <button
                            type="button"
                            onClick={() => onAnalyze(targetId)}
                            disabled={busy || isAnalyzing}
                            className="button-secondary text-xs"
                          >
                            {isAnalyzing ? (
                              <>
                                <Spinner className="h-3 w-3" />
                                <span>Analyzing...</span>
                              </>
                            ) : review.isDuplicate ? (
                              'Analyze original'
                            ) : (
                              'Analyze review'
                            )}
                          </button>
                        </div>
                      </div>
                    )}
                  </td>

                  <td className="px-5 py-4.5">
                    {review.analysis?.needs_reply ? (
                      replies[review.reviewId] ? (
                        <div className="bento-subcard p-3">
                          <p className="whitespace-pre-line text-xs leading-5 text-[#dedde1]">{replies[review.reviewId]}</p>
                          <div className="mt-2.5 flex items-center justify-between gap-3 border-t border-white/[0.06] pt-2">
                            <button
                              type="button"
                              onClick={() => onCopyReply(review.reviewId, replies[review.reviewId])}
                              className="button-secondary text-xs font-mono"
                            >
                              {copiedId === review.reviewId ? (
                                <>
                                  <Icon name="check" className="h-3.5 w-3.5 text-emerald-400" />
                                  <span className="text-emerald-400">Copied!</span>
                                </>
                              ) : (
                                <>
                                  <Icon name="review" className="h-3.5 w-3.5" />
                                  <span>Copy Reply</span>
                                </>
                              )}
                            </button>
                            <span className="font-mono text-[9.5px] uppercase tracking-[0.08em] text-[#ff8a4c]">
                              AI DRAFT
                            </span>
                          </div>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => onSuggestReply(review.reviewId)}
                          disabled={busy || loadingReplyId === review.reviewId}
                          className="button-reply text-xs font-mono"
                        >
                          {loadingReplyId === review.reviewId ? (
                            <>
                              <Spinner className="h-3.5 w-3.5" />
                              <span>Drafting Response...</span>
                            </>
                          ) : (
                            <>
                              <Icon name="spark" className="h-3.5 w-3.5" />
                              <span>Suggest Reply</span>
                            </>
                          )}
                        </button>
                      )
                    ) : (
                      <span className="font-mono text-xs text-[#71717a]">
                        {review.analysis ? 'No follow-up required' : 'Awaiting review analysis'}
                      </span>
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {visibleCount < filtered.length && (
        <div className="border-t border-white/[0.06] bg-[#09090b] p-4 text-center">
          <button
            type="button"
            onClick={() => setVisibleCount(count => count + pageSize)}
            className="button-secondary text-xs font-mono"
          >
            Load more reviews ({filtered.length - visibleCount} remaining)
          </button>
        </div>
      )}
    </section>
  )
}
