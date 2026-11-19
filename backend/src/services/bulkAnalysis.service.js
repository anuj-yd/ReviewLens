import mongoose from 'mongoose'

import ImportBatch from '../models/ImportBatch.model.js'
import Review from '../models/Review.model.js'
import ReviewAnalysisCache from '../models/ReviewAnalysisCache.js'

import { getOllamaConfig } from '../config/ollama.js'
import { analyseReviewWithAI } from './reviewAnalysis.service.js'

import createReviewHash from '../utils/reviewHash.js'
import retryWithBackoff from '../utils/retryWithBackoff.js'

const BATCH_SIZE = 5
const PROMPT_VERSION = 'v1'

const normalizeAnalysis = analysis => ({
  sentiment: analysis.sentiment,
  topics: analysis.topics || [],
  summary: analysis.summary,
  needsReply: analysis.needsReply ?? analysis.needs_reply ?? null
})

const applyAnalysisToGroup = async (group, analysis) => {
  await Review.updateMany(
    {
      _id: {
        $in: group.rows.map(review => review._id)
      }
    },
    {
      $set: {
        aiAnalysis: analysis,
        analysisStatus: 'completed'
      }
    }
  )
}

export const analyseImportReviews = async (importId, { onProgress = async () => {} } = {}) => {
  if (!mongoose.Types.ObjectId.isValid(importId)) {
    const error = new Error('Invalid import ID')
    error.status = 400
    throw error
  }

  const startTime = Date.now()

  const metrics = {
    totalReviews: 0,
    uniqueReviews: 0,
    duplicateReviewsSkipped: 0,
    processed: 0,
    alreadyCompleted: 0,
    aiCalls: 0,
    cacheHits: 0,
    failed: 0,
    retries: 0
  }

  const batchExists = await ImportBatch.exists({ _id: importId })

  if (!batchExists) {
    const error = new Error('Import batch not found')
    error.status = 404
    throw error
  }

  const reviews = await Review.find({ importId }).lean()
  metrics.totalReviews = reviews.length

  if (reviews.length === 0) {
    await onProgress({ processed: 0, total: 0, failed: 0, stage: 'completed' })
    return {
      importId,
      metrics: {
        ...metrics,
        processingTimeMs: Date.now() - startTime
      }
    }
  }

  const { model } = getOllamaConfig()
  const groups = new Map()

  // Group identical review text so each unique review needs at most one call.
  for (const review of reviews) {
    const hash = createReviewHash(
      review.reviewText,
      model,
      PROMPT_VERSION
    )

    if (!groups.has(hash)) {
      groups.set(hash, { hash, rows: [] })
    }

    groups.get(hash).rows.push(review)
  }

  const allGroups = Array.from(groups.values())
  metrics.uniqueReviews = allGroups.length
  metrics.duplicateReviewsSkipped = reviews.length - allGroups.length
  await onProgress({
    processed: 0,
    total: metrics.totalReviews,
    uniqueReviews: metrics.uniqueReviews,
    failed: 0,
    stage: 'analyzing'
  })

  // Reuse completed analyses already stored on a review in this import.
  const groupsNeedingAnalysis = []

  for (const group of allGroups) {
    const existing = group.rows.find(review => (
      review.analysisStatus === 'completed' &&
      review.aiAnalysis?.sentiment
    ))

    if (existing) {
      await applyAnalysisToGroup(
        group,
        normalizeAnalysis(existing.aiAnalysis)
      )

      metrics.processed += group.rows.length
      metrics.alreadyCompleted += group.rows.length
      await onProgress({
        processed: metrics.processed,
        total: metrics.totalReviews,
        uniqueReviews: metrics.uniqueReviews,
        failed: metrics.failed,
        stage: 'analyzing'
      })
    } else {
      groupsNeedingAnalysis.push(group)
    }
  }

  // Load cache entries in one database query.
  const hashes = groupsNeedingAnalysis.map(group => group.hash)
  const cachedResults = await ReviewAnalysisCache.find({
    hash: { $in: hashes },
    model,
    promptVersion: PROMPT_VERSION
  }).lean()

  const cacheMap = new Map(
    cachedResults.map(item => [item.hash, item.result])
  )
  const uncachedGroups = []

  for (const group of groupsNeedingAnalysis) {
    const cachedAnalysis = cacheMap.get(group.hash)

    if (cachedAnalysis) {
      await applyAnalysisToGroup(
        group,
        normalizeAnalysis(cachedAnalysis)
      )

      metrics.cacheHits += group.rows.length
      metrics.processed += group.rows.length
      await onProgress({
        processed: metrics.processed,
        total: metrics.totalReviews,
        uniqueReviews: metrics.uniqueReviews,
        failed: metrics.failed,
        stage: 'analyzing'
      })
    } else {
      uncachedGroups.push(group)
    }
  }

  const processGroup = async group => {
    try {
      const rawAnalysis = await retryWithBackoff(
        () => analyseReviewWithAI(
          group.rows[0].reviewText,
          {
            onRequest: () => {
              metrics.aiCalls += 1
            }
          }
        ),
        {
          maxAttempts: 4,
          baseDelay: 1000,
          maxDelay: 8000,
          onRetry: () => {
            metrics.retries += 1
          }
        }
      )

      const analysis = normalizeAnalysis(rawAnalysis)

      // Cache-write failures should not discard a valid model response.
      try {
        await ReviewAnalysisCache.updateOne(
          { hash: group.hash },
          {
            $setOnInsert: {
              hash: group.hash,
              model,
              promptVersion: PROMPT_VERSION,
              result: analysis
            }
          },
          { upsert: true }
        )
      } catch (cacheError) {
        console.error('[AI cache save error]', cacheError.message)
      }

      await applyAnalysisToGroup(group, analysis)
      metrics.processed += group.rows.length
      await onProgress({
        processed: metrics.processed,
        total: metrics.totalReviews,
        uniqueReviews: metrics.uniqueReviews,
        failed: metrics.failed,
        stage: 'analyzing'
      })
    } catch (error) {
      console.error('[Bulk AI analysis failed]', error.message)
      metrics.failed += group.rows.length

      await Review.updateMany(
        {
          _id: {
            $in: group.rows.map(review => review._id)
          }
        },
        {
          $set: {
            analysisStatus: 'analysis_failed'
          }
        }
      )
      metrics.processed += group.rows.length
      await onProgress({
        processed: metrics.processed,
        total: metrics.totalReviews,
        uniqueReviews: metrics.uniqueReviews,
        failed: metrics.failed,
        stage: 'analyzing'
      })
    }
  }

  for (let i = 0; i < uncachedGroups.length; i += BATCH_SIZE) {
    const currentBatch = uncachedGroups.slice(i, i + BATCH_SIZE)
    await Promise.allSettled(currentBatch.map(processGroup))
  }

  await onProgress({
    processed: metrics.processed,
    total: metrics.totalReviews,
    uniqueReviews: metrics.uniqueReviews,
    failed: metrics.failed,
    stage: 'completed'
  })

  return {
    importId,
    model,
    metrics: {
      ...metrics,
      processingTimeMs: Date.now() - startTime
    }
  }
}
