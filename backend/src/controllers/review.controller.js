import mongoose from 'mongoose'
import path from 'node:path'

import ImportBatch from '../models/ImportBatch.model.js'
import Review from '../models/Review.model.js'

import { getOllamaConfig } from '../config/ollama.js'
import { parseAndCleanReviews } from '../services/reviewCsv.service.js'
import {
  analyseReviewWithAI,
  AnalysisValidationError,
  generateSuggestedReply
} from '../services/reviewAnalysis.service.js'
import {
  createReviewAnalysisCacheHash,
  findCachedReviewAnalysis,
  normalizeReviewAnalysis,
  saveReviewAnalysisCache
} from '../services/reviewAnalysisCache.service.js'
import retryWithBackoff from '../utils/retryWithBackoff.js'

const serializeAnalysis = review => ({
  sentiment: review.aiAnalysis.sentiment,
  topics: review.aiAnalysis.topics,
  summary: review.aiAnalysis.summary,
  needs_reply: review.aiAnalysis.needsReply
})

const hasSavedAnalysis = review => (
  Boolean(review.aiAnalysis?.sentiment) &&
  Array.isArray(review.aiAnalysis?.topics) &&
  Boolean(review.aiAnalysis?.summary) &&
  typeof review.aiAnalysis?.needsReply === 'boolean'
)

export const uploadReviews = async (req, res, next) => {
  // Check uploaded file
  if (!req.file) {
    return res.status(400).json({
      success: false,
      message: 'Please upload a CSV file.'
    })
  }

  // Parse and clean CSV
  let result

  try {
    result = parseAndCleanReviews(req.file.buffer)
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: `CSV processing failed: ${error.message}`
    })
  }

  const { reviews, summary, rowErrors } = result

  // No valid reviews
  if (reviews.length === 0) {
    return res.status(422).json({
      success: false,
      message: 'No valid reviews found in CSV.',
      summary,
      rowErrors
    })
  }

  let batch

  try {
    // Create import batch
    batch = await ImportBatch.create({
      fileName: path.basename(req.file.originalname),
      status: 'uploaded',
      ...summary,
      rowErrors
    })

    // Save cleaned reviews
    const reviewDocuments = reviews.map(review => ({
      ...review,
      importId: batch._id
    }))

    await Review.insertMany(reviewDocuments)

    return res.status(201).json({
      success: true,
      message: 'CSV uploaded and cleaned successfully.',

      importId: batch._id,

      summary,

      rowErrors,

      reviews: reviews.map(review => ({
        ...review,
        _id: undefined
      }))
    })

  } catch (error) {

    // Cleanup if database insertion fails
    if (batch?._id) {
      await Review.deleteMany({ importId: batch._id })
      await ImportBatch.deleteOne({ _id: batch._id })
    }

    next(error)
  }
}

export const getImportDashboard = async (req, res) => {
  const { importId } = req.params
  if (!mongoose.isValidObjectId(importId)) {
    return res.status(400).json({ success: false, message: 'Invalid import ID.' })
  }

  const reviews = await Review.find({ importId }).sort({ createdAt: 1 }).lean()
  if (!reviews.length && !(await ImportBatch.exists({ _id: importId }))) {
    return res.status(404).json({ success: false, message: 'Import batch not found.' })
  }

  const analyzed = reviews.filter(review => review.analysisStatus === 'completed' && review.aiAnalysis?.sentiment)
  const sentimentCounts = { positive: 0, neutral: 0, negative: 0 }
  const insights = { complaints: new Map(), praises: new Map() }
  for (const review of analyzed) {
    const { sentiment, summary, topics = [] } = review.aiAnalysis
    sentimentCounts[sentiment] += 1
    if (sentiment === 'negative' || sentiment === 'positive') {
      const kind = sentiment === 'negative' ? 'complaints' : 'praises'
      const key = `${topics.join(', ') || 'other'}: ${summary}`
      const item = insights[kind].get(key) || { topic: topics.join(', ') || 'other', summary, count: 0 }
      item.count += 1
      insights[kind].set(key, item)
    }
  }
  const total = analyzed.length
  const percentages = Object.fromEntries(Object.entries(sentimentCounts).map(([key, count]) => [key, total ? Math.round(count / total * 100) : 0]))
  return res.json({
    success: true,
    summary: {
      totalReviews: total,
      needsReply: analyzed.filter(review => review.aiAnalysis.needsReply).length,
      sentimentCounts,
      sentimentPercentages: percentages
    },
    topComplaints: [...insights.complaints.values()].sort((a, b) => b.count - a.count).slice(0, 3),
    topPraises: [...insights.praises.values()].sort((a, b) => b.count - a.count).slice(0, 3),
    reviews: reviews.map(review => ({
      reviewId: review.reviewId,
      product: review.product,
      rating: review.rating,
      date: review.date,
      reviewText: review.reviewText,
      isDuplicate: review.isDuplicate,
      duplicateOf: review.duplicateOf,
      analysisStatus: review.analysisStatus,
      analysis: review.analysisStatus === 'completed' ? {
        sentiment: review.aiAnalysis.sentiment,
        topics: review.aiAnalysis.topics,
        summary: review.aiAnalysis.summary,
        needs_reply: review.aiAnalysis.needsReply
      } : null
    }))
  })
}

export const suggestReviewReply = async (req, res) => {
  const { importId, reviewId } = req.params
  if (!mongoose.isValidObjectId(importId)) {
    return res.status(400).json({ success: false, message: 'Invalid import ID.' })
  }
  try {
    const review = await Review.findOne({ importId, reviewId })
    if (!review) return res.status(404).json({ success: false, message: 'Review not found.' })
    if (review.analysisStatus !== 'completed' || !review.aiAnalysis?.needsReply) {
      return res.status(409).json({ success: false, message: 'A suggested reply is available only for analysed reviews marked as needing a reply.' })
    }
    const reply = await generateSuggestedReply(review)
    return res.json({ success: true, reply })
  } catch (error) {
    req.log?.error({ err: error }, 'Suggested reply generation failed')
    return res.status(502).json({ success: false, message: 'Could not generate a suggested reply. Please try again.' })
  }
}

export const analyzeSingleReview = async (req, res) => {

  try {

    const { importId, reviewId } = req.params

    if (!mongoose.isValidObjectId(importId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid import ID.'
      })
    }

    const review = await Review.findOne({
      importId,
      reviewId
    })

    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Review not found.'
      })
    }

    const { model } = getOllamaConfig()
    const cacheHash = createReviewAnalysisCacheHash(review.reviewText, model)
    const writeCacheSafely = async analysis => {
      try {
        await saveReviewAnalysisCache(cacheHash, model, analysis)
      } catch (cacheError) {
        req.log?.error({ err: cacheError }, 'Review analysis cache save failed')
      }
    }

    // Keep older completed records useful to future uploads by backfilling
    // their validated result into the shared cache.
    if (review.analysisStatus === 'completed' && hasSavedAnalysis(review)) {
      const analysis = normalizeReviewAnalysis(review.aiAnalysis)
      await writeCacheSafely(analysis)

      return res.status(200).json({
        success: true,
        message: 'Analysis already available.',
        analysis: serializeAnalysis(review),
        cacheHit: false
      })
    }

    const { analysis: cachedAnalysis } = await findCachedReviewAnalysis(
      review.reviewText,
      model
    )
    let analysis = cachedAnalysis
    let message = 'Review analysed successfully.'

    if (!analysis && review.isDuplicate) {
      const originalReview = await Review.findOne({
        importId,
        reviewId: review.duplicateOf
      })

      if (!originalReview ||
          originalReview.analysisStatus !== 'completed' ||
          !hasSavedAnalysis(originalReview)) {
        return res.status(409).json({
          success: false,
          message: 'Analyse the original review first.'
        })
      }

      analysis = normalizeReviewAnalysis(originalReview.aiAnalysis)
      await writeCacheSafely(analysis)
      message = 'Duplicate review inherited original analysis.'
    } else if (!analysis) {
      const modelAnalysis = await retryWithBackoff(
        () => analyseReviewWithAI(review.reviewText),
        {
          maxAttempts: 4,
          baseDelay: 1000,
          maxDelay: 8000
        }
      )
      analysis = normalizeReviewAnalysis(modelAnalysis)
      await writeCacheSafely(analysis)
    } else {
      message = 'Review analysis restored from shared cache.'
    }

    review.aiAnalysis = analysis
    review.analysisStatus = 'completed'
    await review.save()

    return res.status(200).json({
      success: true,
      message,
      analysis: serializeAnalysis(review),
      cacheHit: Boolean(cachedAnalysis)
    })

  } catch (error) {

    // Invalid JSON or schema after two attempts
    if (error instanceof AnalysisValidationError) {

      const { importId, reviewId } = req.params

      await Review.updateOne(
        { importId, reviewId },
        { $set: { analysisStatus: 'analysis_failed' } }
      )

      return res.status(422).json({
        success: false,
        message: 'AI returned an invalid analysis twice.',
        analysisStatus: 'analysis_failed'
      })

    }

    // Keep provider details in server logs, but return a useful, safe hint to
    // the UI instead of making configuration and quota errors look identical.
    const providerStatus = Number(
      error.status ?? error.statusCode ?? error.httpResponse?.status
    )

    req.log?.error({ err: error, providerStatus }, 'Review analysis failed')
    let status = 502
    let message = 'Ollama could not analyse this review. Please try again.'

    if (error.message === 'Unable to connect to local Ollama server.') {
      status = 503
      message = 'Cannot reach Ollama. Start the local Ollama server and try again.'
    } else if (error.message === 'Ollama request failed: 404') {
      status = 503
      message = 'The configured Ollama model is unavailable. Pull the model and try again.'
    } else if (process.env.NODE_ENV !== 'production' && error.message) {
      message = `${message} (${error.message})`
    }

    return res.status(status).json({
      success: false,
      message
    })

  }

}
