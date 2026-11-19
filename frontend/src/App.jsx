import { useState } from 'react'
import {
  analyzeImport,
  analyzeReviewById,
  getImportDashboard,
  suggestReply,
  uploadReviews
} from './services/reviewApi'
import ImportSummary from './components/ImportSummary'
import InsightsOverview from './components/InsightsOverview'
import ReviewExplorer from './components/ReviewExplorer'
import UploadPanel from './components/UploadPanel'
import { BrandMark, Icon, Spinner } from './components/ReviewLensUI'

const EMPTY_DASHBOARD = { summary: null, reviews: [], topComplaints: [], topPraises: [] }

export default function App() {
  const [file, setFile] = useState(null)
  const [uploading, setUploading] = useState(false)
  const [analyzingAll, setAnalyzingAll] = useState(false)
  const [analyzingReviewId, setAnalyzingReviewId] = useState(null)
  const [replyLoadingId, setReplyLoadingId] = useState(null)
  const [error, setError] = useState('')
  const [importResult, setImportResult] = useState(null)
  const [dashboard, setDashboard] = useState(EMPTY_DASHBOARD)
  const [replies, setReplies] = useState({})
  const [copiedId, setCopiedId] = useState(null)

  const refreshDashboard = async importId => {
    setDashboard(await getImportDashboard(importId))
  }

  const handleFile = nextFile => {
    setError('')
    if (!nextFile) return
    if (!nextFile.name.toLowerCase().endsWith('.csv')) return setError('Choose a CSV file.')
    if (nextFile.size > 5 * 1024 * 1024) return setError('The CSV must be smaller than 5 MB.')
    setFile(nextFile)
  }

  const resetImport = () => {
    setFile(null)
    setImportResult(null)
    setDashboard(EMPTY_DASHBOARD)
    setReplies({})
    setError('')
  }

  const handleUpload = async event => {
    event.preventDefault()
    if (!file) return setError('Select a CSV file before uploading.')
    setUploading(true)
    setError('')
    setImportResult(null)
    setDashboard(EMPTY_DASHBOARD)
    setReplies({})
    try {
      const uploaded = await uploadReviews(file)
      setImportResult(uploaded)
      await refreshDashboard(uploaded.importId)
    } catch (err) {
      setError(err.message)
    } finally {
      setUploading(false)
    }
  }

  const handleAnalyzeAll = async () => {
    if (!importResult?.importId) return
    setAnalyzingAll(true)
    setError('')
    try {
      await analyzeImport(importResult.importId)
      await refreshDashboard(importResult.importId)
    } catch (err) {
      setError(err.message)
    } finally {
      setAnalyzingAll(false)
    }
  }

  const handleAnalyzeReview = async reviewId => {
    setAnalyzingReviewId(reviewId)
    setError('')
    try {
      await analyzeReviewById(importResult.importId, reviewId)
      await refreshDashboard(importResult.importId)
    } catch (err) {
      setError(err.message)
    } finally {
      setAnalyzingReviewId(null)
    }
  }

  const handleSuggestReply = async reviewId => {
    setReplyLoadingId(reviewId)
    setError('')
    try {
      const response = await suggestReply(importResult.importId, reviewId)
      setReplies(current => ({ ...current, [reviewId]: response.reply }))
    } catch (err) {
      setError(err.message)
    } finally {
      setReplyLoadingId(null)
    }
  }

  const handleCopyReply = async (reviewId, reply) => {
    try {
      await navigator.clipboard.writeText(reply)
      setCopiedId(reviewId)
      window.setTimeout(() => setCopiedId(null), 1600)
    } catch {
      setError('Clipboard access is unavailable. Select the reply text to copy it.')
    }
  }

  const busy = uploading || analyzingAll || Boolean(analyzingReviewId)

  return <main className="min-h-screen bg-[#0a0a0b] text-[#f2f1ec]">
    <div className="pointer-events-none fixed inset-0 overflow-hidden" aria-hidden="true"><div className="absolute -right-48 -top-48 h-[32rem] w-[32rem] rounded-full bg-orange-400/[0.035] blur-3xl" /></div>
    <div className="relative mx-auto max-w-[1480px] px-4 py-5 sm:px-7 lg:px-9 lg:py-7">
      <header className="mb-8 flex items-center justify-between border-b border-white/[0.08] pb-5">
        <div className="flex items-center gap-3.5"><BrandMark /><div><p className="text-xl font-semibold tracking-tight text-white">ReviewLens</p><p className="font-mono text-[11px] uppercase tracking-[0.12em] text-[#77777f]">AI review insights</p></div></div>
        <div className="flex items-center gap-3">{busy && <span className="inline-flex items-center gap-2 font-mono text-[11px] text-[#ffad7f]"><Spinner />Working</span>}</div>
      </header>

      <section className="mb-8 grid gap-7 lg:grid-cols-[minmax(0,1fr)_460px] lg:items-center xl:grid-cols-[minmax(0,1fr)_500px]">
        <div className="max-w-4xl"><p className="mb-3 font-mono text-xs font-medium uppercase tracking-[0.16em] text-[#ff9a62]">Customer feedback / Review intelligence</p><h1 className="font-serif text-5xl font-normal leading-[0.98] tracking-tight text-[#f2f1ec] sm:text-6xl lg:text-7xl">Understand what your customers are saying.</h1><p className="mt-5 max-w-3xl text-base leading-7 text-[#92929a]">Find product themes, spot issues that need attention, and prepare thoughtful replies.</p></div>
        <UploadPanel file={file} onFile={handleFile} onSubmit={handleUpload} loading={uploading} busy={analyzingAll || Boolean(analyzingReviewId)} error={error} result={importResult} onReset={resetImport} />
      </section>

      {importResult ? <>
        <ImportSummary summary={importResult.summary} />
        <InsightsOverview summary={dashboard.summary} reviewCount={dashboard.reviews.length} complaints={dashboard.topComplaints} praises={dashboard.topPraises} onAnalyzeAll={handleAnalyzeAll} analyzing={analyzingAll || uploading || Boolean(analyzingReviewId)} />
        {analyzingAll && <div className="mb-4 flex items-center gap-2 rounded-lg border border-blue-400/15 bg-blue-400/[0.05] px-3 py-2.5 text-[11px] text-blue-100" role="status" aria-live="polite"><Spinner />Analyzing the import. This may take a little while.</div>}
        <ReviewExplorer reviews={dashboard.reviews} replies={replies} copiedId={copiedId} loadingReviewId={analyzingReviewId} loadingReplyId={replyLoadingId} busy={analyzingAll} onAnalyze={handleAnalyzeReview} onSuggestReply={handleSuggestReply} onCopyReply={handleCopyReply} />
      </> : <GettingStarted />}

      <footer className="mt-8 flex flex-wrap justify-between gap-2 border-t border-white/[0.07] pt-5 font-mono text-[11px] uppercase tracking-[0.08em] text-[#686870]"><span>ReviewLens / Insights</span><span><Icon name="check" className="mr-1 inline h-3 w-3" />Review text is treated as untrusted input</span></footer>
    </div>
  </main>
}

function GettingStarted() {
  const steps = [
    ['01', 'Upload', 'Import a CSV of product reviews.'],
    ['02', 'Analyze', 'Classify unique reviews and find common themes.'],
    ['03', 'Respond', 'Filter customer issues and draft replies when needed.']
  ]
  return <section className="grid gap-5 rounded-2xl border border-white/[0.08] bg-[#0e0e10] p-6 sm:grid-cols-3 sm:p-7">{steps.map(([number, title, description]) => <div key={number} className="flex gap-4"><span className="font-mono text-xs text-[#ff9a62]">{number}</span><div><h2 className="text-base font-semibold text-[#dedde1]">{title}</h2><p className="mt-1 text-sm leading-5 text-[#77777f]">{description}</p></div></div>)}</section>
}
