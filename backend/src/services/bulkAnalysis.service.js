import mongoose from 'mongoose'

import ImportBatch from '../models/ImportBatch.model.js'
import Review from '../models/Review.model.js'

import { getLlmConfig } from '../config/llm.js'
import { analyseReviewWithAI } from './reviewAnalysis.service.js'
import retryWithBackoff from '../utils/retryWithBackoff.js'
import {
  createReviewAnalysisCacheHash,
  findCachedReviewAnalyses,
  normalizeReviewAnalysis,
  saveReviewAnalysisCache
} from './reviewAnalysisCache.service.js'

const BATCH_SIZE = 5

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

export const analyseImportReviews = async importId => {
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
    return {
      importId,
      metrics: {
        ...metrics,
        processingTimeMs: Date.now() - startTime
      }
    }
  }

  const { model, cacheModel, provider } = getLlmConfig()
  const groups = new Map()

  // Group identical review text so each unique review needs at most one call.
  for (const review of reviews) {
    const hash = createReviewAnalysisCacheHash(review.reviewText, cacheModel)

    if (!groups.has(hash)) {
      groups.set(hash, { hash, rows: [] })
    }

    groups.get(hash).rows.push(review)
  }

  const allGroups = Array.from(groups.values())
  metrics.uniqueReviews = allGroups.length
  metrics.duplicateReviewsSkipped = reviews.length - allGroups.length

  // Reuse completed analyses already stored on a review in this import.
  const groupsNeedingAnalysis = []

  for (const group of allGroups) {
    const existing = group.rows.find(review => (
      review.analysisStatus === 'completed' &&
      review.aiAnalysis?.sentiment
    ))

    if (existing) {
      const existingAnalysis = normalizeReviewAnalysis(existing.aiAnalysis)

      try {
        await saveReviewAnalysisCache(group.hash, cacheModel, existingAnalysis)
      } catch (cacheError) {
        console.error('[AI cache save error]', cacheError.message)
      }

      await applyAnalysisToGroup(
        group,
        existingAnalysis
      )

      metrics.processed += group.rows.length
      metrics.alreadyCompleted += group.rows.length
    } else {
      groupsNeedingAnalysis.push(group)
    }
  }

  // Load cache entries in one database query.
  const hashes = groupsNeedingAnalysis.map(group => group.hash)
  const cacheMap = await findCachedReviewAnalyses(hashes, cacheModel)
  const uncachedGroups = []

  for (const group of groupsNeedingAnalysis) {
    const cachedAnalysis = cacheMap.get(group.hash)

    if (cachedAnalysis) {
      await applyAnalysisToGroup(
        group,
        cachedAnalysis
      )

      metrics.cacheHits += group.rows.length
      metrics.processed += group.rows.length
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

      const analysis = normalizeReviewAnalysis(rawAnalysis)

      // Cache-write failures should not discard a valid model response.
      try {
        await saveReviewAnalysisCache(group.hash, cacheModel, analysis)
      } catch (cacheError) {
        console.error('[AI cache save error]', cacheError.message)
      }

      await applyAnalysisToGroup(group, analysis)
      metrics.processed += group.rows.length
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
    }
  }

  for (let i = 0; i < uncachedGroups.length; i += BATCH_SIZE) {
    const currentBatch = uncachedGroups.slice(i, i + BATCH_SIZE)
    await Promise.allSettled(currentBatch.map(processGroup))
  }

  return {
    importId,
    provider,
    model,
    metrics: {
      ...metrics,
      processingTimeMs: Date.now() - startTime
    }
  }
}
