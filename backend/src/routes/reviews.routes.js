import { Router } from 'express'

import { uploadCsv } from '../middlewares/upload.middleware.js'

import {
  uploadReviews,
  analyzeSingleReview,
  getImportDashboard,
  suggestReviewReply
} from '../controllers/review.controller.js'
import {
  bulkAnalyseImport,
  getBulkAnalysisStatus
} from '../controllers/bulkAnalysis.controller.js'

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

router.get('/bulk-analysis/:jobId', getBulkAnalysisStatus)

router.get('/:importId/dashboard', getImportDashboard)

router.post('/:importId/:reviewId/suggest-reply', suggestReviewReply)

router.post(
  '/:importId/:reviewId/analyze',
  analyzeSingleReview
)

export default router
