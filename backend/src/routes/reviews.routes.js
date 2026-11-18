import { Router } from 'express'

import { uploadCsv } from '../middlewares/upload.middleware.js'

import {
  uploadReviews,
  analyzeSingleReview
} from '../controllers/review.controller.js'

const router = Router()

router.post(
  '/upload',
  uploadCsv,
  uploadReviews
)

router.post(
  '/:importId/:reviewId/analyze',
  analyzeSingleReview
)

export default router
