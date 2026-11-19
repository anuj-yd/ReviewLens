import { useMemo, useState } from 'react'
import { AnalysisStatus, Icon, Rating, SectionHeading, SentimentBadge, Spinner } from './ReviewLensUI'
import { isRatingSentimentMismatch } from '../utils/ratingSentimentAgreement'

function FilterSelect({ label, value, onChange, options }) {
  return <label className="filter-select"><span className="sr-only">Filter by {label}</span><select title={`Filter reviews by ${label.toLowerCase()}`} value={value} onChange={event => onChange(event.target.value)} className="filter-input capitalize"><option value="all">All {label.toLowerCase()}s</option>{options.map(option => <option key={option} value={option}>{option.replaceAll('_', ' ')}</option>)}</select></label>
}

export default function ReviewExplorer({ reviews, replies, copiedId, loadingReviewId, loadingReplyId, busy, onAnalyze, onSuggestReply, onCopyReply }) {
  const pageSize = 10
  const [query, setQuery] = useState('')
  const [product, setProduct] = useState('all')
  const [sentiment, setSentiment] = useState('all')
  const [topic, setTopic] = useState('all')
  const [needsReply, setNeedsReply] = useState(false)
  const [visibleCount, setVisibleCount] = useState(pageSize)
  const products = useMemo(() => [...new Set(reviews.map(review => review.product))].sort(), [reviews])
  const topics = useMemo(() => [...new Set(reviews.flatMap(review => review.analysis?.topics || []))].sort(), [reviews])
  const filtered = reviews.filter(review => {
    const text = query.trim().toLowerCase()
    return (!text || review.reviewId.toLowerCase().includes(text) || review.reviewText.toLowerCase().includes(text) || review.product.toLowerCase().includes(text)) &&
      (product === 'all' || review.product === product) &&
      (sentiment === 'all' || review.analysis?.sentiment === sentiment) &&
      (topic === 'all' || review.analysis?.topics?.includes(topic)) &&
      (!needsReply || review.analysis?.needs_reply)
  })
  const hasFilters = query || product !== 'all' || sentiment !== 'all' || topic !== 'all' || needsReply
  const changeFilter = setter => value => { setter(value); setVisibleCount(pageSize) }
  const clearFilters = () => { setQuery(''); setProduct('all'); setSentiment('all'); setTopic('all'); setNeedsReply(false); setVisibleCount(pageSize) }
  const visibleReviews = filtered.slice(0, visibleCount)

  return <section className="overflow-hidden rounded-2xl border border-white/[0.08] bg-[#0e0e10]">
    <div className="border-b border-white/[0.07] bg-[#111113] p-5 sm:p-6">
      <div className="flex flex-col justify-between gap-3 xl:flex-row xl:items-end">
        <SectionHeading eyebrow="Customer feedback" title="Review explorer" detail={`${filtered.length} of ${reviews.length}`} />
        <div className="grid gap-2.5 sm:grid-cols-2 xl:grid-cols-4">
          <label className="relative block"><span className="sr-only">Search reviews</span><span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"><Icon name="search" className="h-5 w-5" /></span><input title="Search by review ID, product, or review text" value={query} onChange={event => changeFilter(setQuery)(event.target.value)} placeholder="Search reviews" className="filter-input pl-10" /></label>
          <FilterSelect label="Product" value={product} onChange={changeFilter(setProduct)} options={products} />
          <FilterSelect label="Sentiment" value={sentiment} onChange={changeFilter(setSentiment)} options={['positive', 'neutral', 'negative']} />
          <FilterSelect label="Topic" value={topic} onChange={changeFilter(setTopic)} options={topics} />
        </div>
      </div>
      <div className="mt-3 flex items-center justify-between gap-3">
        <label className="reply-filter inline-flex cursor-pointer items-center gap-2 text-[11px] text-slate-400"><input type="checkbox" checked={needsReply} onChange={event => changeFilter(setNeedsReply)(event.target.checked)} className="h-3.5 w-3.5 rounded border-slate-600 bg-slate-950 text-blue-500 focus:ring-blue-500" />Needs a reply</label>
        {hasFilters && <button type="button" onClick={clearFilters} className="text-[11px] font-medium text-blue-300 hover:text-blue-200">Clear filters</button>}
      </div>
    </div>
    <div className="overflow-x-auto">
      <table className="w-full min-w-[1100px] table-fixed text-left text-sm">
        <colgroup><col className="w-[30%]" /><col className="w-[16%]" /><col className="w-[27%]" /><col className="w-[27%]" /></colgroup>
        <thead className="bg-white/[0.025] text-xs font-semibold uppercase tracking-[0.12em] text-slate-400"><tr><th className="px-5 py-4">Review</th><th className="px-4 py-4">Product</th><th className="px-4 py-4">Analysis</th><th className="px-5 py-4">Suggested reply</th></tr></thead>
        <tbody className="divide-y divide-white/[0.055]">
          {visibleReviews.map(review => {
            const original = review.isDuplicate ? reviews.find(item => item.reviewId === review.duplicateOf) : null
            const targetId = review.isDuplicate && !original?.analysis ? review.duplicateOf : review.reviewId
            const isAnalyzing = loadingReviewId === review.reviewId || (review.isDuplicate && loadingReviewId === review.duplicateOf)
            return <tr key={review.reviewId} className="align-top transition hover:bg-white/[0.025]">
              <td className="max-w-[450px] px-5 py-5">
                <div className="flex flex-wrap items-center gap-2.5"><span className="text-base font-semibold text-slate-200">{review.reviewId}</span><Rating rating={review.rating} />{isRatingSentimentMismatch(review) && <span title={`The ${review.rating}-star rating conflicts with the AI's ${review.analysis.sentiment} sentiment. Check this review.`} className="inline-flex items-center gap-1 rounded-full border border-amber-300/20 bg-amber-300/[0.07] px-2 py-1 text-[10px] font-medium text-amber-200"><Icon name="warning" className="h-3 w-3" />Rating mismatch</span>}{review.isDuplicate && <span className="rounded-full border border-amber-300/15 bg-amber-300/[0.07] px-2.5 py-1 text-[11px] text-amber-200">Duplicate of {review.duplicateOf}</span>}</div>
                <p className="mt-3 whitespace-pre-line text-sm leading-6 text-slate-300">{review.reviewText}</p>
              </td>
              <td className="px-4 py-5 text-sm text-slate-300">{review.product}</td>
              <td className="min-w-[235px] px-3 py-4">
                {review.analysis ? <><SentimentBadge sentiment={review.analysis.sentiment} /><div className="mt-2 flex flex-wrap gap-1.5">{review.analysis.topics.map(item => <span key={item} className="rounded-md border border-white/[0.08] bg-white/[0.035] px-2 py-1 text-[10px] font-mono capitalize text-[#c0bfc5]">{item.replaceAll('_', ' ')}</span>)}</div><p className="mt-2.5 text-sm leading-5 text-[#dedde1]">{review.analysis.summary}</p><p className={`mt-2 font-mono text-[10px] uppercase tracking-[0.05em] ${review.analysis.needs_reply ? 'text-[#ff9a62]' : 'text-[#77777f]'}`}>{review.analysis.needs_reply ? 'Reply recommended' : 'No reply needed'}</p></> : <div className="flex flex-col items-start gap-2"><AnalysisStatus status={review.analysisStatus} /><button type="button" onClick={() => onAnalyze(targetId)} disabled={Boolean(loadingReviewId) || busy} className="button-quiet text-sm">{isAnalyzing ? <><Spinner /> Analyzing</> : review.isDuplicate ? original?.analysis ? 'Apply original analysis' : 'Analyze original' : 'Analyze review'}</button></div>}
              </td>
              <td className="min-w-[230px] px-4 py-4">
                {review.analysis?.needs_reply ? replies[review.reviewId] ? <div className="max-h-44 overflow-y-auto overflow-x-hidden rounded-lg border border-white/[0.08] bg-slate-950/70 p-4"><p className="break-words text-sm leading-5 text-slate-200">{replies[review.reviewId]}</p><button type="button" onClick={() => onCopyReply(review.reviewId, replies[review.reviewId])} title="Copy this suggested response" className="mt-3 text-sm font-semibold text-blue-300 hover:text-blue-200">{copiedId === review.reviewId ? 'Copied' : 'Copy reply'}</button></div> : <button type="button" onClick={() => onSuggestReply(review.reviewId)} title="Draft a reply for this review" disabled={loadingReplyId === review.reviewId} className="button-reply text-sm">{loadingReplyId === review.reviewId ? <><Spinner /> Drafting</> : 'Generate reply'}</button> : <span className="text-sm text-slate-400">{review.analysis ? 'Not needed' : 'After analysis'}</span>}
              </td>
            </tr>
          })}
          {!filtered.length && <tr><td colSpan="4" className="px-4 py-16 text-center"><p className="text-base font-medium text-slate-200">No matching reviews</p><p className="mt-1 text-sm text-slate-400">Try changing your search or filters.</p></td></tr>}
        </tbody>
      </table>
    </div>
    {filtered.length > visibleCount && <div className="flex justify-end border-t border-white/[0.07] px-5 py-4 sm:px-6">
      <button type="button" title="Show the next 10 matching reviews" onClick={() => setVisibleCount(count => Math.min(count + pageSize, filtered.length))} className="button-quiet min-h-10 px-4 font-mono text-[10px] uppercase tracking-[0.08em]">
        Load more <span className="text-[#77777f]">({filtered.length - visibleCount} remaining)</span>
      </button>
    </div>}
  </section>
}
