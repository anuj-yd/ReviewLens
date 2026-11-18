import path from 'node:path'

import ImportBatch from '../models/ImportBatch.model.js'
import Review from '../models/Review.model.js'

import { parseAndCleanReviews } from '../services/reviewCsv.service.js'

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