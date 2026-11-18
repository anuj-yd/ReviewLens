import mongoose from 'mongoose'

const rowErrorSchema = new mongoose.Schema(
  {
    recordNumber: Number,
    reviewId: String,
    reason: String
  },
  { _id: false }
)

const importBatchSchema = new mongoose.Schema(
  {
    fileName: {
      type: String,
      required: true
    },

    status: {
      type: String,
      enum: ['uploaded', 'failed'],
      default: 'uploaded'
    },

    totalRows: {
      type: Number,
      default: 0
    },

    acceptedReviewRows: {
      type: Number,
      default: 0
    },

    uniqueReviewCount: {
      type: Number,
      default: 0
    },

    skippedEmptyReviews: {
      type: Number,
      default: 0
    },

    skippedInvalidRows: {
      type: Number,
      default: 0
    },

    duplicateCount: {
      type: Number,
      default: 0
    },

    missingRatingCount: {
      type: Number,
      default: 0
    },

    invalidRatingCount: {
      type: Number,
      default: 0
    },

    invalidDateCount: {
      type: Number,
      default: 0
    },

    rowErrors: [rowErrorSchema]
  },
  { timestamps: true }
)

export default mongoose.model(
  'ImportBatch',
  importBatchSchema
)

