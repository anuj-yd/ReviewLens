import { useState } from 'react'
import { Icon } from './ReviewLensUI'

function formatDuration(milliseconds = 0) {
  if (milliseconds < 1000) return `${milliseconds} ms`
  return `${(milliseconds / 1000).toFixed(1)} s`
}

export default function IngestionDetails({ importSummary, processingMetrics }) {
  const [isOpen, setIsOpen] = useState(false)

  if (!importSummary && !processingMetrics) return null

  const unknownRatings = (importSummary?.missingRatingCount || 0) + (importSummary?.invalidRatingCount || 0)
  const totalAiAndCache = (processingMetrics?.aiCalls || 0) + (processingMetrics?.cacheHits || 0)
  const cacheRatio = totalAiAndCache > 0 ? Math.round(((processingMetrics?.cacheHits || 0) / totalAiAndCache) * 100) : 0

  return (
    <div className="mb-6 overflow-hidden rounded-2xl border border-white/[0.08] bg-[#111114] transition-all">
      <button
        type="button"
        onClick={() => setIsOpen(prev => !prev)}
        className="flex w-full items-center justify-between px-5 py-3.5 text-left transition hover:bg-white/[0.02]"
      >
        <div className="flex items-center gap-3">
          <span className="flex h-6 w-6 items-center justify-center rounded-lg border border-white/[0.08] bg-white/[0.03] text-[#a1a1aa]">
            <Icon name="chart" className="h-3.5 w-3.5" />
          </span>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold tracking-tight text-[#f5f5f4]">Import & Processing Pipeline Details</span>
              <span className="rounded-full border border-white/[0.08] bg-white/[0.03] px-2 py-0.5 font-mono text-[10px] text-[#71717a]">
                11 telemetry metrics
              </span>
            </div>
            <p className="font-mono text-[10.5px] text-[#71717a]">
              {importSummary ? `${importSummary.acceptedReviewRows} accepted rows` : 'Pending'}
              {processingMetrics ? ` · ${processingMetrics.aiCalls || 0} AI calls · ${cacheRatio}% cache hit rate` : ''}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 font-mono text-xs text-[#a1a1aa]">
          <span>{isOpen ? 'Collapse' : 'Expand'}</span>
          <span className={`transform transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}>
            <Icon name="chevronDown" className="h-3.5 w-3.5" />
          </span>
        </div>
      </button>

      {isOpen && (
        <div className="border-t border-white/[0.06] p-5 sm:p-6 bg-[#09090b]">
          {/* Ingestion & Sanitization Section */}
          {importSummary && (
            <div className="mb-5">
              <div className="mb-3 flex items-center justify-between">
                <span className="font-mono text-[10.5px] font-semibold uppercase tracking-[0.1em] text-[#a1a1aa]">
                  Data Cleaning & Ingestion Telemetry
                </span>
                <span className="inline-flex items-center gap-1 font-mono text-[10.5px] text-emerald-400">
                  <Icon name="check" className="h-3 w-3" /> Sanitized RFC 4180
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-6">
                <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-3">
                  <span className="font-mono text-[10px] uppercase text-[#71717a]">CSV Total Rows</span>
                  <p className="mt-1 font-mono text-lg font-bold text-[#f5f5f4]">{importSummary.totalRows ?? 0}</p>
                </div>
                <div className="rounded-xl border border-emerald-400/20 bg-emerald-400/[0.03] p-3">
                  <span className="font-mono text-[10px] uppercase text-emerald-300">Accepted Rows</span>
                  <p className="mt-1 font-mono text-lg font-bold text-emerald-400">{importSummary.acceptedReviewRows ?? 0}</p>
                </div>
                <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-3">
                  <span className="font-mono text-[10px] uppercase text-[#71717a]">Unique Feedback</span>
                  <p className="mt-1 font-mono text-lg font-bold text-[#f5f5f4]">{importSummary.uniqueReviewCount ?? 0}</p>
                </div>
                <div className="rounded-xl border border-amber-400/20 bg-amber-400/[0.03] p-3">
                  <span className="font-mono text-[10px] uppercase text-amber-300">Duplicates Linked</span>
                  <p className="mt-1 font-mono text-lg font-bold text-amber-400">{importSummary.duplicateCount ?? 0}</p>
                </div>
                <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-3">
                  <span className="font-mono text-[10px] uppercase text-[#71717a]">Empty Skipped</span>
                  <p className="mt-1 font-mono text-lg font-bold text-[#71717a]">{importSummary.skippedEmptyReviews ?? 0}</p>
                </div>
                <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-3">
                  <span className="font-mono text-[10px] uppercase text-[#71717a]">Unknown Ratings</span>
                  <p className="mt-1 font-mono text-lg font-bold text-amber-200">{unknownRatings}</p>
                </div>
              </div>
            </div>
          )}

          {/* AI Execution & Cache Section */}
          {processingMetrics ? (
            <div>
              <div className="mb-3 flex items-center justify-between">
                <span className="font-mono text-[10.5px] font-semibold uppercase tracking-[0.1em] text-[#a1a1aa]">
                  Batch Execution & Cache Performance
                </span>
                {cacheRatio > 0 && (
                  <span className="font-mono text-[10.5px] text-emerald-400">
                    {cacheRatio}% cache hit rate
                  </span>
                )}
              </div>
              <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-5">
                <div className="rounded-xl border border-blue-400/20 bg-blue-400/[0.03] p-3">
                  <span className="font-mono text-[10px] uppercase text-blue-300">AI Calls</span>
                  <p className="mt-1 font-mono text-lg font-bold text-blue-400">{processingMetrics.aiCalls ?? 0}</p>
                </div>
                <div className="rounded-xl border border-emerald-400/20 bg-emerald-400/[0.03] p-3">
                  <span className="font-mono text-[10px] uppercase text-emerald-300">Cache Reused</span>
                  <p className="mt-1 font-mono text-lg font-bold text-emerald-400">{processingMetrics.cacheHits ?? 0}</p>
                </div>
                <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-3">
                  <span className="font-mono text-[10px] uppercase text-[#71717a]">Retries Handled</span>
                  <p className="mt-1 font-mono text-lg font-bold text-amber-300">{processingMetrics.retries ?? 0}</p>
                </div>
                <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-3">
                  <span className="font-mono text-[10px] uppercase text-[#71717a]">Failed Reviews</span>
                  <p className={`mt-1 font-mono text-lg font-bold ${processingMetrics.failed > 0 ? 'text-rose-400' : 'text-[#71717a]'}`}>
                    {processingMetrics.failed ?? 0}
                  </p>
                </div>
                <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-3">
                  <span className="font-mono text-[10px] uppercase text-[#71717a]">Processing Time</span>
                  <p className="mt-1 font-mono text-lg font-bold text-[#f5f5f4]">{formatDuration(processingMetrics.processingTimeMs)}</p>
                </div>
              </div>
            </div>
          ) : (
            <p className="font-mono text-xs text-[#71717a]">
              Run AI analysis on reviews to populate batch execution & cache performance logs.
            </p>
          )}
        </div>
      )}
    </div>
  )
}
