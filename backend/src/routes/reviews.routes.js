import { Router } from 'express'

import { uploadCsv } from '../middlewares/upload.middleware.js'

import {
  uploadReviews,
  analyzeSingleReview
} from '../controllers/review.controller.js'
import { bulkAnalyseImport } from '../controllers/bulkAnalysis.controller.js'

const router = Router()

router.post(
  '/upload',
  uploadCsv,
  uploadReviews
)

router.post(
  '/bulk-analyze/:importId',
  bulkAnalyseImport
)

router.post(
  '/:importId/:reviewId/analyze',
  analyzeSingleReview
)

export default router
