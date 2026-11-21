import { useEffect, useState } from 'react'
import {
  analyzeImport,
  analyzeReviewById,
  getImportDashboard,
  suggestReply,
  uploadReviews
} from './services/reviewApi'
import IngestionDetails from './components/IngestionDetails'
import InsightsOverview from './components/InsightsOverview'
import ReviewExplorer from './components/ReviewExplorer'
import UploadPanel from './components/UploadPanel'
import { BrandMark, Icon, Spinner } from './components/ReviewLensUI'

const EMPTY_DASHBOARD = { summary: null, reviews: [], topComplaints: [], topPraises: [] }

const STORAGE_KEYS = {
  IMPORT_ID: 'reviewlens_active_import_id',
  METRICS: 'reviewlens_analysis_metrics',
  REPLIES: 'reviewlens_replies',
  PRODUCT: 'reviewlens_selected_product',
  TOPIC: 'reviewlens_selected_topic'
}

const getInitialSavedId = () => {
  try {
    const params = new URLSearchParams(window.location.search)
    return params.get('importId') || localStorage.getItem(STORAGE_KEYS.IMPORT_ID)
  } catch {
    return null
  }
}

export default function App() {
  const [file, setFile] = useState(null)
  const [uploading, setUploading] = useState(false)
  const [analyzingAll, setAnalyzingAll] = useState(false)
  const [analyzingReviewId, setAnalyzingReviewId] = useState(null)
  const [replyLoadingId, setReplyLoadingId] = useState(null)
  const [error, setError] = useState('')
  const [analysisNotice, setAnalysisNotice] = useState('')
  const [analysisMetrics, setAnalysisMetrics] = useState(null)
  const [importResult, setImportResult] = useState(null)
  const [dashboard, setDashboard] = useState(EMPTY_DASHBOARD)
  const [replies, setReplies] = useState({})
  const [copiedId, setCopiedId] = useState(null)
  const [selectedProduct, setSelectedProduct] = useState('all')
  const [selectedTopic, setSelectedTopic] = useState('all')
  const [restoring, setRestoring] = useState(() => Boolean(getInitialSavedId()))

  // Restore session from localStorage or URL on reload
  useEffect(() => {
    const savedImportId = getInitialSavedId()
    if (!savedImportId) return

    getImportDashboard(savedImportId)
      .then(data => {
        setImportResult({
          importId: savedImportId,
          summary: data.importSummary || null
        })
        setDashboard(data)

        // Restore saved metrics
        try {
          const savedMetrics = JSON.parse(localStorage.getItem(STORAGE_KEYS.METRICS) || 'null')
          if (savedMetrics) setAnalysisMetrics(savedMetrics)
        } catch {
          // ignore storage error
        }

        // Restore saved replies
        try {
          const savedReplies = JSON.parse(localStorage.getItem(STORAGE_KEYS.REPLIES) || '{}')
          if (savedReplies && typeof savedReplies === 'object') setReplies(savedReplies)
        } catch {
          // ignore storage error
        }

        // Restore product & topic selection
        const savedProduct = localStorage.getItem(STORAGE_KEYS.PRODUCT)
        if (savedProduct) setSelectedProduct(savedProduct)

        const savedTopic = localStorage.getItem(STORAGE_KEYS.TOPIC)
        if (savedTopic) setSelectedTopic(savedTopic)

        // Keep URL in sync
        const url = new URL(window.location.href)
        if (url.searchParams.get('importId') !== savedImportId) {
          url.searchParams.set('importId', savedImportId)
          window.history.replaceState({}, '', url.toString())
        }
      })
      .catch(err => {
        console.warn('Could not restore previous import batch:', err)
        try {
          localStorage.removeItem(STORAGE_KEYS.IMPORT_ID)
          localStorage.removeItem(STORAGE_KEYS.METRICS)
          localStorage.removeItem(STORAGE_KEYS.REPLIES)
        } catch {
          // ignore
        }
        const url = new URL(window.location.href)
        url.searchParams.delete('importId')
        window.history.replaceState({}, '', url.pathname)
      })
      .finally(() => {
        setRestoring(false)
      })
  }, [])

  const refreshDashboard = async importId => {
    const data = await getImportDashboard(importId)
    setDashboard(data)
    return data
  }

  const handleSelectProduct = product => {
    setSelectedProduct(product)
    try {
      localStorage.setItem(STORAGE_KEYS.PRODUCT, product)
    } catch {
      // ignore
    }
  }

  const handleSelectTheme = topic => {
    setSelectedTopic(topic)
    try {
      localStorage.setItem(STORAGE_KEYS.TOPIC, topic)
    } catch {
      // ignore
    }
    const element = document.getElementById('review-explorer')
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' })
    }
  }

  const handleFile = nextFile => {
    setError('')
    setAnalysisNotice('')
    setAnalysisMetrics(null)
    setSelectedProduct('all')
    setSelectedTopic('all')
    if (!nextFile) return
    if (!nextFile.name.toLowerCase().endsWith('.csv')) return setError('Choose a valid CSV file.')
    if (nextFile.size > 5 * 1024 * 1024) return setError('The CSV file must be under 5 MB.')
    setFile(nextFile)
  }

  const resetImport = () => {
    setFile(null)
    setImportResult(null)
    setDashboard(EMPTY_DASHBOARD)
    setReplies({})
    setError('')
    setAnalysisNotice('')
    setAnalysisMetrics(null)
    setSelectedProduct('all')
    setSelectedTopic('all')

    try {
      localStorage.removeItem(STORAGE_KEYS.IMPORT_ID)
      localStorage.removeItem(STORAGE_KEYS.METRICS)
      localStorage.removeItem(STORAGE_KEYS.REPLIES)
      localStorage.removeItem(STORAGE_KEYS.PRODUCT)
      localStorage.removeItem(STORAGE_KEYS.TOPIC)
    } catch {
      // ignore
    }

    const url = new URL(window.location.href)
    url.searchParams.delete('importId')
    window.history.replaceState({}, '', url.pathname)
  }

  const handleUpload = async event => {
    event.preventDefault()
    if (!file) return setError('Select a CSV file before uploading.')
    setUploading(true)
    setError('')
    setAnalysisNotice('')
    try {
      const response = await uploadReviews(file)
      setImportResult(response)
      await refreshDashboard(response.importId)

      try {
        localStorage.setItem(STORAGE_KEYS.IMPORT_ID, response.importId)
      } catch {
        // ignore
      }

      const url = new URL(window.location.href)
      url.searchParams.set('importId', response.importId)
      window.history.replaceState({}, '', url.toString())
    } catch (uploadError) {
      setError(uploadError.message || 'CSV upload failed.')
    } finally {
      setUploading(false)
    }
  }

  const handleAnalyzeAll = async () => {
    if (!importResult?.importId) return
    setAnalyzingAll(true)
    setError('')
    setAnalysisNotice('')
    setAnalysisMetrics(null)
    try {
      const result = await analyzeImport(importResult.importId)
      const metrics = result.metrics || null
      setAnalysisMetrics(metrics)

      if (metrics) {
        try {
          localStorage.setItem(STORAGE_KEYS.METRICS, JSON.stringify(metrics))
        } catch {
          // ignore
        }
      }

      await refreshDashboard(importResult.importId)
      if (result.metrics?.quotaExhausted) {
        setAnalysisNotice(
          `${result.metrics.quotaProvider || 'The configured AI provider'} has exhausted its request quota. Completed reviews are saved; remaining reviews were skipped. Try again after its quota resets.`
        )
      } else if (result.skippedReviews > 0) {
        setAnalysisNotice(
          `Analysis ended early after provider quota or server errors. ${result.successfulReviews} reviews are ready; ${result.skippedReviews} reviews can be retried later.`
        )
      }
    } catch (analysisError) {
      const status = analysisError.response?.status
      const provider = analysisError.response?.data?.provider || 'The configured AI provider'
      if (status === 429) {
        setAnalysisNotice(`${provider} has exhausted its request quota. Try again after its quota resets.`)
      } else {
        setError(analysisError.message || 'Analysis failed.')
      }
    } finally {
      setAnalyzingAll(false)
    }
  }

  const handleAnalyzeReview = async reviewId => {
    if (!importResult?.importId) return
    setAnalyzingReviewId(reviewId)
    setError('')
    try {
      await analyzeReviewById(importResult.importId, reviewId)
      await refreshDashboard(importResult.importId)
    } catch (analysisError) {
      setError(analysisError.message || 'Single review analysis failed.')
    } finally {
      setAnalyzingReviewId(null)
    }
  }

  const handleSuggestReply = async reviewId => {
    if (!importResult?.importId) return
    setReplyLoadingId(reviewId)
    setError('')
    try {
      const result = await suggestReply(importResult.importId, reviewId)
      setReplies(current => {
        const updated = { ...current, [reviewId]: result.reply }
        try {
          localStorage.setItem(STORAGE_KEYS.REPLIES, JSON.stringify(updated))
        } catch {
          // ignore
        }
        return updated
      })
    } catch (replyError) {
      setError(replyError.message || 'Suggested reply request failed.')
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

  return (
    <main className="min-h-screen bg-[#09090b] text-[#f5f5f4] selection:bg-[#ff8a4c]/30 selection:text-white">
      {/* Ambient background glows */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden" aria-hidden="true">
        <div className="absolute -right-40 -top-40 h-[36rem] w-[36rem] rounded-full bg-[#ff8a4c]/[0.035] blur-3xl" />
        <div className="absolute -left-40 top-1/3 h-[32rem] w-[32rem] rounded-full bg-blue-500/[0.025] blur-3xl" />
      </div>

      <div className="relative mx-auto max-w-[1440px] px-4 py-6 sm:px-6 lg:px-8">
        {/* Top Navbar */}
        <header className="mb-8 flex flex-wrap items-center justify-between gap-4 border-b border-white/[0.08] pb-5">
          <div className="flex items-center gap-3.5">
            <BrandMark />
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xl font-bold tracking-tight text-[#f5f5f4]">ReviewLens</span>
                <span className="rounded-md border border-white/[0.08] bg-white/[0.04] px-1.5 py-0.5 font-mono text-[9.5px] uppercase tracking-[0.06em] text-[#a1a1aa]">
                  v1.0-prod
                </span>
                <span className="hidden sm:inline-flex items-center gap-1.5 rounded-full border border-emerald-400/20 bg-emerald-400/[0.08] px-2 py-0.5 font-mono text-[9.5px] text-emerald-300">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                  <span>Engine Active</span>
                </span>
              </div>
              <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-[#71717a]">
                AI-Powered Customer Feedback Intelligence
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden md:flex items-center gap-2 rounded-full border border-white/[0.08] bg-white/[0.025] px-3 py-1 font-mono text-[11px] text-[#a1a1aa]">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
              <span>Atlas & OpenRouter Connected</span>
            </div>

            {importResult && (
              <button
                type="button"
                onClick={resetImport}
                disabled={busy}
                className="rounded-lg border border-white/[0.08] bg-white/[0.03] px-3 py-1 font-mono text-xs text-[#a1a1aa] transition hover:border-[#ff8a4c]/40 hover:bg-[#ff8a4c]/10 hover:text-[#ffad7f] disabled:opacity-50"
              >
                New Batch
              </button>
            )}

            {busy && (
              <span className="inline-flex items-center gap-2 rounded-full border border-[#ff8a4c]/30 bg-[#ff8a4c]/10 px-3 py-1 font-mono text-xs text-[#ffad7f]">
                <Spinner className="h-3 w-3" />
                <span>Processing</span>
              </span>
            )}
          </div>
        </header>

        {/* Restoring Session Loader */}
        {restoring && (
          <div className="mb-8 flex items-center justify-center gap-3 rounded-2xl border border-white/[0.08] bg-[#111114] p-8 text-center shadow-lg">
            <Spinner className="h-4 w-4 text-[#ff8a4c]" />
            <p className="font-mono text-sm text-[#a1a1aa]">Restoring customer intelligence session...</p>
          </div>
        )}

        {/* Pre-Upload / Landing View */}
        {!restoring && !importResult && (
          <div className="space-y-8">
            <section className="grid gap-6 lg:grid-cols-[minmax(0,1.2fr)_480px] lg:items-center">
              <div>
                <div className="mb-3.5 inline-flex items-center gap-2 rounded-full border border-[#ff8a4c]/30 bg-[#ff8a4c]/10 px-3 py-1 font-mono text-xs font-medium text-[#ffad7f]">
                  <Icon name="spark" className="h-3.5 w-3.5 text-[#ff8a4c]" />
                  <span>AI Customer Feedback Intelligence</span>
                </div>
                <h1 className="font-serif text-5xl font-normal leading-[1.02] tracking-tight text-[#f5f5f4] sm:text-6xl">
                  Turn customer feedback into product intelligence.
                </h1>
                <p className="mt-5 max-w-2xl text-base leading-7 text-[#a1a1aa]">
                  Clean messy review files, extract structured sentiment and product issue themes with AI, compare feedback across products, and draft suggested replies instantly.
                </p>
              </div>

              <UploadPanel
                file={file}
                onFile={handleFile}
                onSubmit={handleUpload}
                loading={uploading}
                busy={busy}
                error={error}
                result={importResult}
                onReset={resetImport}
              />
            </section>

            <GettingStartedGrid />
          </div>
        )}

        {/* Active Dashboard Bento View */}
        {!restoring && importResult && (
          <div className="space-y-6">
            {/* Top Ingestion Telemetry & Performance Details */}
            <IngestionDetails
              importSummary={importResult.summary}
              processingMetrics={analysisMetrics}
            />

            {/* Analysis Notice Alert */}
            {analysisNotice && (
              <div
                className="flex items-start gap-2.5 rounded-xl border border-amber-300/25 bg-amber-300/[0.08] px-4 py-3 text-sm leading-6 text-amber-100 shadow-sm"
                role="status"
                aria-live="polite"
              >
                <Icon name="warning" className="h-4 w-4 shrink-0 text-amber-400 mt-1" />
                <span>{analysisNotice}</span>
              </div>
            )}

            {/* Main Bento Sections A, B, C & Comparison Matrix */}
            <InsightsOverview
              summary={dashboard.summary}
              reviewCount={dashboard.reviews.length}
              complaints={dashboard.topComplaints}
              praises={dashboard.topPraises}
              reviews={dashboard.reviews}
              onAnalyzeAll={handleAnalyzeAll}
              analyzing={analyzingAll || uploading || Boolean(analyzingReviewId)}
              selectedProduct={selectedProduct}
              onSelectProduct={handleSelectProduct}
              onSelectTheme={handleSelectTheme}
            />

            {/* In-flight Batch Analysis Progress Banner */}
            {analyzingAll && (
              <div
                className="flex items-center gap-2.5 rounded-xl border border-blue-400/20 bg-blue-400/[0.08] px-4 py-3 font-mono text-xs text-blue-100 shadow-sm"
                role="status"
                aria-live="polite"
              >
                <Spinner className="h-3.5 w-3.5" />
                <span>Analyzing reviews with OpenRouter in bounded batches of five. This may take a few moments...</span>
              </div>
            )}

            {/* Section D: Customer Feedback Explorer */}
            <ReviewExplorer
              reviews={dashboard.reviews}
              replies={replies}
              copiedId={copiedId}
              loadingReviewId={analyzingReviewId}
              loadingReplyId={replyLoadingId}
              busy={analyzingAll}
              onAnalyze={handleAnalyzeReview}
              onSuggestReply={handleSuggestReply}
              onCopyReply={handleCopyReply}
              activeProductFilter={selectedProduct}
              onProductFilterChange={handleSelectProduct}
              activeTopicFilter={selectedTopic}
              onTopicFilterChange={setSelectedTopic}
            />
          </div>
        )}

        {/* Global Footer */}
        <footer className="mt-12 flex flex-wrap items-center justify-between gap-3 border-t border-white/[0.07] pt-5 font-mono text-[11px] uppercase tracking-[0.08em] text-[#71717a]">
          <div className="flex items-center gap-2">
            <span>ReviewLens</span>
            <span>·</span>
            <span>CEDCOSS Technical Assessment</span>
          </div>
          <div className="flex items-center gap-1.5 text-emerald-400/90">
            <Icon name="check" className="h-3.5 w-3.5" />
            <span>Review text is sanitized and treated as untrusted data</span>
          </div>
        </footer>
      </div>
    </main>
  )
}

function GettingStartedGrid() {
  const steps = [
    {
      number: '01',
      title: 'Import Customer Reviews',
      description: 'Upload a CSV with review_id, product, rating, date, and review_text. Malformed rows, HTML, and duplicates are automatically cleaned.',
      icon: 'upload'
    },
    {
      number: '02',
      title: 'Structured AI Classification',
      description: 'Analyze unique reviews with OpenRouter. Every response is strictly validated for sentiment, topic tags, summary, and response urgency.',
      icon: 'spark'
    },
    {
      number: '03',
      title: 'Product Themes & Replies',
      description: 'Toggle between overall and product-specific sentiment trends, inspect recurring friction themes, and draft customer replies on demand.',
      icon: 'reply'
    }
  ]

  return (
    <section className="grid gap-4 sm:grid-cols-3">
      {steps.map(step => (
        <div
          key={step.number}
          className="bento-card group flex flex-col justify-between p-6 transition duration-200 hover:-translate-y-0.5 hover:border-white/[0.14]"
        >
          <div>
            <div className="flex items-center justify-between">
              <span className="font-mono text-xs font-semibold text-[#ff8a4c]">{step.number}</span>
              <span className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/[0.08] bg-white/[0.03] text-[#a1a1aa] transition group-hover:scale-105 group-hover:text-[#ff8a4c]">
                <Icon name={step.icon} className="h-4 w-4" />
              </span>
            </div>
            <h3 className="mt-4 text-base font-semibold tracking-tight text-[#f5f5f4]">{step.title}</h3>
            <p className="mt-2 text-xs leading-5 text-[#71717a]">{step.description}</p>
          </div>
        </div>
      ))}
    </section>
  )
}
