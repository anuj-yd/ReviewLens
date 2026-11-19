import 'dotenv/config'

import mongoose from 'mongoose'
import { Worker } from 'bullmq'

import { connectDB } from '../config/db.js'
import { analyseImportReviews } from '../services/bulkAnalysis.service.js'
import {
  createRedisConnection,
  REVIEW_ANALYSIS_QUEUE
} from '../queues/reviewAnalysis.queue.js'

const connection = createRedisConnection()

const startWorker = async () => {
  await connectDB()

  const configuredConcurrency = Number.parseInt(
    process.env.ANALYSIS_JOB_CONCURRENCY || '1',
    10
  )
  const concurrency = Number.isInteger(configuredConcurrency) && configuredConcurrency > 0
    ? configuredConcurrency
    : 1

  const worker = new Worker(
    REVIEW_ANALYSIS_QUEUE,
    async job => analyseImportReviews(job.data.importId, {
      onProgress: progress => job.updateProgress(progress)
    }),
    {
      connection,
      concurrency
    }
  )

  worker.on('completed', job => {
    console.log(`[Analysis worker] Job ${job.id} completed`)
  })

  worker.on('failed', (job, error) => {
    console.error(`[Analysis worker] Job ${job?.id || 'unknown'} failed:`, error.message)
  })

  worker.on('error', error => {
    console.error('[Analysis worker] Worker error:', error.message)
  })

  console.log(`Review analysis worker started with concurrency ${concurrency}`)

  const shutdown = async signal => {
    console.log(`[Analysis worker] Received ${signal}; shutting down`)
    await worker.close()
    await connection.quit()
    await mongoose.disconnect()
    process.exit(0)
  }

  process.once('SIGINT', () => shutdown('SIGINT'))
  process.once('SIGTERM', () => shutdown('SIGTERM'))
}

startWorker().catch(async error => {
  console.error('[Analysis worker] Startup failed:', error)
  await connection.quit().catch(() => {})
  await mongoose.disconnect().catch(() => {})
  process.exit(1)
})
