import mongoose from 'mongoose'
import path from 'node:path'

import ImportBatch from '../models/ImportBatch.model.js'
import Review from '../models/Review.model.js'

import { parseAndCleanReviews } from '../services/reviewCsv.service.js'
import {
  analyseReviewWithAI,
  AnalysisValidationError
} from '../services/reviewAnalysis.service.js'

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

    // Return existing analysis instead of calling the model again
    if (review.analysisStatus === 'completed' && hasSavedAnalysis(review)) {

      return res.status(200).json({
        success: true,
        message: 'Analysis already available.',
        analysis: serializeAnalysis(review)
      })

    }

    // Duplicate reviews must inherit the original analysis
    if (review.isDuplicate) {

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

      review.aiAnalysis = {
        sentiment: originalReview.aiAnalysis.sentiment,
        topics: originalReview.aiAnalysis.topics,
        summary: originalReview.aiAnalysis.summary,
        needsReply: originalReview.aiAnalysis.needsReply
      }

      review.analysisStatus = 'completed'

      await review.save()

      return res.status(200).json({
        success: true,
        message: 'Duplicate review inherited original analysis.',
        analysis: serializeAnalysis(review)
      })

    }

    // Call the configured AI model
    const analysis = await analyseReviewWithAI(
      review.reviewText
    )

    // Save validated analysis
    review.aiAnalysis = {
      sentiment: analysis.sentiment,
      topics: analysis.topics,
      summary: analysis.summary,
      needsReply: analysis.needs_reply
    }

    review.analysisStatus = 'completed'

    await review.save()

    return res.status(200).json({
      success: true,
      message: 'Review analysed successfully.',
      analysis
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
