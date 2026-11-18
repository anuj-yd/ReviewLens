import mongoose from 'mongoose'

const reviewSchema = new mongoose.Schema(
  {
    importId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ImportBatch',
      required: true
    },

    reviewId: {
      type: String,
      required: true,
      trim: true
    },

    product: {
      type: String,
      required: true,
      trim: true
    },

    rating: {
      type: Number,
      default: null,
      min: 1,
      max: 5
    },

    ratingStatus: {
      type: String,
      enum: ['valid', 'missing', 'invalid'],
      required: true
    },

    date: {
      type: Date,
      default: null
    },

    reviewText: {
      type: String,
      required: true
    },

    textHash: {
      type: String,
      required: true,
      index: true
    },

    isDuplicate: {
      type: Boolean,
      default: false
    },

    duplicateOf: {
      type: String,
      default: null
    },

    analysisStatus: {
      type: String,
      enum: ['pending', 'completed', 'analysis_failed'],
      default: 'pending'
    }
  },
  { timestamps: true }
)

reviewSchema.index(
  { importId: 1, reviewId: 1 },
  { unique: true }
)

export default mongoose.model('Review', reviewSchema)

