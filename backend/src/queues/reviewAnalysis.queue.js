import { Queue } from 'bullmq'
import IORedis from 'ioredis'

export const REVIEW_ANALYSIS_QUEUE = 'review-analysis'

export const createRedisConnection = () => new IORedis(
  process.env.REDIS_URL || 'redis://127.0.0.1:6379',
  { maxRetriesPerRequest: null }
)

let reviewAnalysisQueue

export const getReviewAnalysisQueue = () => {
  if (!reviewAnalysisQueue) {
    reviewAnalysisQueue = new Queue(REVIEW_ANALYSIS_QUEUE, {
      connection: createRedisConnection()
    })
    reviewAnalysisQueue.on('error', error => {
      console.error('[Analysis queue] Redis error:', error.message)
    })
  }

  return reviewAnalysisQueue
}

export const closeReviewAnalysisQueue = async () => {
  if (reviewAnalysisQueue) {
    await reviewAnalysisQueue.close()
    reviewAnalysisQueue = null
  }
}
