import mongoose from 'mongoose'
import ImportBatch from '../models/ImportBatch.model.js'
import { getReviewAnalysisQueue } from '../queues/reviewAnalysis.queue.js'

export const bulkAnalyseImport = async (req, res) => {
  try {
    const { importId } = req.params
    if (!mongoose.isValidObjectId(importId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid import ID.'
      })
    }

    if (!(await ImportBatch.exists({ _id: importId }))) {
      return res.status(404).json({
        success: false,
        message: 'Import batch not found.'
      })
    }

    const queue = getReviewAnalysisQueue()
    let job = await queue.getJob(importId)
    if (job && (await job.getState()) === 'failed') {
      await job.remove()
      job = null
    }

    if (!job) {
      job = await queue.add(
        'analyze-import',
        { importId },
        {
          // A single import should have at most one active/completed job.
          jobId: importId,
          attempts: 3,
          backoff: { type: 'exponential', delay: 2000 },
          removeOnComplete: { age: 86400, count: 1000 },
          removeOnFail: { age: 604800, count: 1000 }
        }
      )
    }

    const state = await job.getState()

    return res.status(202).json({
      success: true,
      message: 'Bulk review analysis queued.',
      jobId: job.id,
      state,
      progress: job.progress,
      result: state === 'completed' ? job.returnvalue : null,
      error: state === 'failed' ? job.failedReason : null
    })
  } catch (error) {
    req.log?.error({ err: error }, 'Bulk review analysis failed')

    return res.status(error.status || 500).json({
      success: false,
      message: error.status ? error.message : 'Bulk review analysis failed.'
    })
  }
}

export const getBulkAnalysisStatus = async (req, res) => {
  try {
    const queue = getReviewAnalysisQueue()
    const job = await queue.getJob(req.params.jobId)

    if (!job) {
      return res.status(404).json({
        success: false,
        message: 'Analysis job not found. It may have expired from the queue.'
      })
    }

    const state = await job.getState()
    return res.json({
      success: true,
      jobId: job.id,
      state,
      progress: job.progress,
      result: state === 'completed' ? job.returnvalue : null,
      error: state === 'failed' ? job.failedReason : null
    })
  } catch (error) {
    req.log?.error({ err: error }, 'Bulk analysis status lookup failed')
    return res.status(500).json({
      success: false,
      message: 'Unable to read analysis job status.'
    })
  }
}
