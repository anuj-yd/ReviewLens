import { Router } from 'express'

import { uploadCsv } from '../middlewares/upload.middleware.js'

import {
  uploadReviews
} from '../controllers/review.controller.js'

const router = Router()

router.post(
  '/upload',
  uploadCsv,
  uploadReviews
)

export default router