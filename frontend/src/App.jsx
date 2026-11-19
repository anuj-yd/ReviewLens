import { useMemo, useState } from 'react'
import {
  uploadReviews,
  analyzeReviewById,
  analyzeImport,
  getBulkAnalysisStatus,
  getImportDashboard,
  suggestReply
} from './services/reviewApi'

const emptyDashboard = { summary: null, reviews: [], topComplaints: [], topPraises: [] }

function App() {
  const [file, setFile] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [result, setResult] = useState(null)
  const [dashboard, setDashboard] = useState(emptyDashboard)
  const [bulkLoading, setBulkLoading] = useState(false)
  const [bulkJob, setBulkJob] = useState(null)
  const [bulkResult, setBulkResult] = useState(null)
  const [analysisLoadingId, setAnalysisLoadingId] = useState(null)
  const [replyLoadingId, setReplyLoadingId] = useState(null)
  const [replies, setReplies] = useState({})
  const [productFilter, setProductFilter] = useState('all')
  const [sentimentFilter, setSentimentFilter] = useState('all')
  const [topicFilter, setTopicFilter] = useState('all')

  const refreshDashboard = async importId => {
    const data = await getImportDashboard(importId)
    setDashboard(data)
  }

  const handleUpload = async event => {
    event.preventDefault()
    if (!file) return setError('Please select a CSV file.')
    setLoading(true); setError(''); setResult(null); setDashboard(emptyDashboard); setReplies({}); setBulkJob(null); setBulkResult(null)
    try {
      const data = await uploadReviews(file)
      setResult(data)
      await refreshDashboard(data.importId)
    } catch (err) { setError(err.message) } finally { setLoading(false) }
  }

  const handleAnalyzeImport = async () => {
    if (!result?.importId) return
    setBulkLoading(true); setError('')
    try {
      let job = await analyzeImport(result.importId)
      setBulkJob(job)
      while (job.state !== 'completed' && job.state !== 'failed') {
        await new Promise(resolve => setTimeout(resolve, 1000))
        job = await getBulkAnalysisStatus(job.jobId)
        setBulkJob(job)
      }
      if (job.state === 'failed') {
        throw new Error(job.error || 'Bulk analysis job failed.')
      }
      setBulkResult(job.result)
      await refreshDashboard(result.importId)
    } catch (err) { setError(err.message) } finally { setBulkLoading(false) }
  }

  const handleAnalyzeReview = async reviewId => {
    setAnalysisLoadingId(reviewId); setError('')
    try {
      await analyzeReviewById(result.importId, reviewId)
      await refreshDashboard(result.importId)
    } catch (err) { setError(err.message) } finally { setAnalysisLoadingId(null) }
  }

  const handleSuggestReply = async reviewId => {
    setReplyLoadingId(reviewId); setError('')
    try {
      const data = await suggestReply(result.importId, reviewId)
      setReplies(current => ({ ...current, [reviewId]: data.reply }))
    } catch (err) { setError(err.message) } finally { setReplyLoadingId(null) }
  }

  const products = useMemo(() => [...new Set(dashboard.reviews.map(review => review.product))].sort(), [dashboard.reviews])
  const topics = useMemo(() => [...new Set(dashboard.reviews.flatMap(review => review.analysis?.topics || []))].sort(), [dashboard.reviews])
  const filteredReviews = dashboard.reviews.filter(review =>
    (productFilter === 'all' || review.product === productFilter) &&
    (sentimentFilter === 'all' || review.analysis?.sentiment === sentimentFilter) &&
    (topicFilter === 'all' || review.analysis?.topics?.includes(topicFilter))
  )
  const stats = dashboard.summary

  return (
    <main className="min-h-screen bg-slate-950 p-5 text-white md:p-10">
      <div className="mx-auto max-w-7xl space-y-8">
        <header>
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-blue-300">CEDCOSS Technical Assessment</p>
          <h1 className="mt-2 text-3xl font-bold text-white md:text-4xl">ReviewLens <span className="text-blue-400">(AI Review Insights)</span></h1>
          <p className="mt-2 text-slate-400">Understand customer feedback across your products.</p>
        </header>

        <section className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
          <h2 className="text-xl font-semibold">Upload reviews</h2>
          <p className="mt-1 text-sm text-slate-400">Choose a reviews.csv file to clean and analyze customer feedback.</p>
          <form onSubmit={handleUpload} className="mt-5 flex flex-col gap-4 sm:flex-row sm:items-center">
            <input type="file" accept=".csv,text/csv" onChange={event => setFile(event.target.files?.[0] ?? null)} className="block min-w-0 flex-1 text-sm text-slate-300 file:mr-4 file:rounded-lg file:border-0 file:bg-slate-700 file:px-4 file:py-2 file:text-white" />
            <button disabled={loading} className="rounded-lg bg-blue-600 px-5 py-3 font-semibold hover:bg-blue-500 disabled:opacity-50">{loading ? 'Uploading…' : 'Upload CSV'}</button>
          </form>
          {result && <p className="mt-4 text-sm text-emerald-300">{result.message} {result.summary?.acceptedReviewRows} reviews loaded.</p>}
          {error && <p role="alert" className="mt-4 rounded-lg bg-red-950 p-3 text-sm text-red-200">{error}</p>}
        </section>

        {result?.importId && <>
          <section className="flex flex-col justify-between gap-4 rounded-2xl border border-slate-800 bg-slate-900 p-6 sm:flex-row sm:items-center">
            <div><h2 className="text-xl font-semibold">Review insights</h2><p className="mt-1 text-sm text-slate-400">Analyze all unique reviews to populate sentiment and topic insights.</p></div>
            <button onClick={handleAnalyzeImport} disabled={bulkLoading} className="rounded-lg bg-blue-600 px-5 py-3 font-semibold hover:bg-blue-500 disabled:opacity-50">{bulkLoading ? 'Analysis running…' : 'Analyze all reviews'}</button>
            {bulkLoading && <div className="mt-4 text-sm text-blue-200" role="status" aria-live="polite">
              <p>Background job {bulkJob?.state || 'waiting'}{bulkJob?.progress?.total ? ` · ${bulkJob.progress.processed}/${bulkJob.progress.total} reviews processed` : ''}</p>
            </div>}
            {bulkResult?.metrics && <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-xs text-slate-400">
              <span>AI calls: {bulkResult.metrics.aiCalls}</span>
              <span>Cache hits: {bulkResult.metrics.cacheHits}</span>
              <span>Retries: {bulkResult.metrics.retries}</span>
              <span>Failed: {bulkResult.metrics.failed}</span>
              <span>Time: {bulkResult.metrics.processingTimeMs} ms</span>
            </div>}
          </section>

          <section>
            <h2 className="mb-4 text-xl font-semibold">Analysis summary</h2>
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
              <StatCard title="Reviews analyzed" value={stats?.totalReviews ?? 0} />
              <StatCard title="Positive" value={`${stats?.sentimentPercentages?.positive ?? 0}%`} detail={`${stats?.sentimentCounts?.positive ?? 0} reviews`} />
              <StatCard title="Neutral" value={`${stats?.sentimentPercentages?.neutral ?? 0}%`} detail={`${stats?.sentimentCounts?.neutral ?? 0} reviews`} />
              <StatCard title="Negative" value={`${stats?.sentimentPercentages?.negative ?? 0}%`} detail={`${stats?.sentimentCounts?.negative ?? 0} reviews`} />
              <StatCard title="Need a reply" value={stats?.needsReply ?? 0} />
            </div>
            <p className="mt-3 text-xs text-slate-500">Sentiment percentages use reviews with a completed analysis.</p>
          </section>

          <section className="grid gap-5 lg:grid-cols-2">
            <InsightList title="Top complaints" items={dashboard.topComplaints} empty="No complaint insights yet. Analyze reviews to see recurring issues." tone="rose" />
            <InsightList title="Top praises" items={dashboard.topPraises} empty="No praise insights yet. Analyze reviews to see what customers like." tone="emerald" />
          </section>

          <section className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900">
            <div className="flex flex-col gap-4 border-b border-slate-800 p-6 xl:flex-row xl:items-end xl:justify-between">
              <div><h2 className="text-xl font-semibold">Reviews</h2><p className="mt-1 text-sm text-slate-400">{filteredReviews.length} of {dashboard.reviews.length} reviews</p></div>
              <div className="grid gap-3 sm:grid-cols-3">
                <FilterSelect label="Product" value={productFilter} onChange={setProductFilter} options={products} />
                <FilterSelect label="Sentiment" value={sentimentFilter} onChange={setSentimentFilter} options={['positive', 'neutral', 'negative']} />
                <FilterSelect label="Topic" value={topicFilter} onChange={setTopicFilter} options={topics} />
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[900px] text-left text-sm">
                <thead className="bg-slate-800/70 text-xs uppercase tracking-wide text-slate-400"><tr><th className="p-4">Review</th><th className="p-4">Product</th><th className="p-4">Analysis</th><th className="p-4">Suggested reply</th></tr></thead>
                <tbody>
                  {filteredReviews.map(review => <tr key={review.reviewId} className="border-t border-slate-800 align-top">
                    <td className="max-w-md p-4"><div className="font-medium text-slate-200">{review.reviewId} · {review.rating ?? 'Unrated'}</div><p className="mt-2 whitespace-normal text-slate-400">{review.reviewText}</p>{review.isDuplicate && <span className="mt-2 inline-block text-xs text-amber-300">Duplicate of {review.duplicateOf}</span>}</td>
                    <td className="p-4 text-slate-300">{review.product}</td>
                    <td className="min-w-56 p-4">
                      {review.analysis ? <><span className={`rounded-full px-2.5 py-1 text-xs font-semibold capitalize ${sentimentClass(review.analysis.sentiment)}`}>{review.analysis.sentiment}</span><p className="mt-2 text-xs text-blue-300">{review.analysis.topics.join(', ')}</p><p className="mt-2 text-slate-300">{review.analysis.summary}</p><p className="mt-2 text-xs text-slate-500">{review.analysis.needs_reply ? 'Reply recommended' : 'No reply needed'}</p></> : <><span className="text-xs text-slate-500">{review.analysisStatus === 'analysis_failed' ? 'Analysis failed' : 'Not analyzed'}</span><button onClick={() => handleAnalyzeReview(review.reviewId)} disabled={Boolean(analysisLoadingId) || bulkLoading} className="mt-2 block rounded-md bg-slate-700 px-3 py-2 text-xs hover:bg-slate-600 disabled:opacity-50">{analysisLoadingId === review.reviewId ? 'Analyzing…' : 'Analyze review'}</button></>}
                    </td>
                    <td className="min-w-64 p-4">
                      {review.analysis?.needs_reply ? <>{replies[review.reviewId] ? <div className="rounded-lg border border-slate-700 bg-slate-950 p-3 text-slate-300">{replies[review.reviewId]}</div> : <button onClick={() => handleSuggestReply(review.reviewId)} disabled={replyLoadingId === review.reviewId} className="rounded-md border border-blue-500/60 px-3 py-2 text-xs font-semibold text-blue-300 hover:bg-blue-950 disabled:opacity-50">{replyLoadingId === review.reviewId ? 'Drafting reply…' : 'Generate suggested reply'}</button>}</> : <span className="text-xs text-slate-600">{review.analysis ? '—' : 'Available after analysis'}</span>}
                    </td>
                  </tr>)}
                  {!filteredReviews.length && <tr><td colSpan="4" className="p-10 text-center text-slate-500">No reviews match these filters.</td></tr>}
                </tbody>
              </table>
            </div>
          </section>
        </>}
      </div>
    </main>
  )
}

function StatCard({ title, value, detail }) {
  return <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5"><p className="text-sm text-slate-400">{title}</p><p className="mt-2 text-3xl font-bold text-white">{value}</p>{detail && <p className="mt-1 text-xs text-slate-500">{detail}</p>}</div>
}

function InsightList({ title, items, empty, tone }) {
  return <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6"><h2 className="text-xl font-semibold">{title}</h2>{items.length ? <ol className="mt-4 space-y-3">{items.map((item, index) => <li key={`${item.topic}-${item.summary}`} className="flex gap-3 rounded-xl bg-slate-950/70 p-4"><span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-sm font-bold ${tone === 'rose' ? 'bg-rose-950 text-rose-300' : 'bg-emerald-950 text-emerald-300'}`}>{index + 1}</span><div className="min-w-0"><p className="text-sm text-slate-200">{item.summary}</p><p className="mt-1 text-xs capitalize text-slate-500">{item.topic} · {item.count} {item.count === 1 ? 'review' : 'reviews'}</p></div></li>)}</ol> : <p className="mt-4 text-sm text-slate-500">{empty}</p>}</div>
}

function FilterSelect({ label, value, onChange, options }) {
  return <label className="text-xs text-slate-400">{label}<select value={value} onChange={event => onChange(event.target.value)} className="mt-1 block w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm capitalize text-white"><option value="all">All {label.toLowerCase()}s</option>{options.map(option => <option key={option} value={option}>{option.replaceAll('_', ' ')}</option>)}</select></label>
}

function sentimentClass(sentiment) {
  return sentiment === 'positive' ? 'bg-emerald-950 text-emerald-300' : sentiment === 'negative' ? 'bg-rose-950 text-rose-300' : 'bg-amber-950 text-amber-300'
}

export default App
