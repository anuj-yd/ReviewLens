import ReviewAnalysisCache from '../models/ReviewAnalysisCache.js'
import createReviewHash from '../utils/reviewHash.js'
import { reviewAnalysisSchema } from '../validators/reviewAnalysis.schema.js'

export const REVIEW_ANALYSIS_PROMPT_VERSION = 'v1'

export const normalizeReviewAnalysis = analysis => ({
  sentiment: analysis.sentiment,
  topics: analysis.topics || [],
  summary: analysis.summary,
  needsReply: analysis.needsReply ?? analysis.needs_reply ?? null
})

const validateCachedAnalysis = analysis => {
  if (!analysis || typeof analysis !== 'object') return null

  const normalized = normalizeReviewAnalysis(analysis)
  const validation = reviewAnalysisSchema.safeParse({
    sentiment: normalized.sentiment,
    topics: normalized.topics,
    summary: normalized.summary,
    needs_reply: normalized.needsReply
  })

  return validation.success
    ? normalizeReviewAnalysis(validation.data)
    : null
}

export const createReviewAnalysisCacheHash = (reviewText, model) => (
  createReviewHash(reviewText, model, REVIEW_ANALYSIS_PROMPT_VERSION)
)

export const findCachedReviewAnalyses = async (hashes, model) => {
  if (hashes.length === 0) return new Map()

  const entries = await ReviewAnalysisCache.find({
    hash: { $in: hashes },
    model,
    promptVersion: REVIEW_ANALYSIS_PROMPT_VERSION
  }).lean()

  return new Map(entries.flatMap(entry => {
    const analysis = validateCachedAnalysis(entry.result)
    return analysis ? [[entry.hash, analysis]] : []
  }))
}

export const findCachedReviewAnalysis = async (reviewText, model) => {
  const hash = createReviewAnalysisCacheHash(reviewText, model)
  const results = await findCachedReviewAnalyses([hash], model)

  return { hash, analysis: results.get(hash) || null }
}

export const saveReviewAnalysisCache = async (hash, model, analysis) => {
  const validatedAnalysis = validateCachedAnalysis(analysis)

  if (!validatedAnalysis) {
    throw new Error('Refusing to cache an invalid review analysis.')
  }

  await ReviewAnalysisCache.updateOne(
    { hash },
    {
      $set: {
        model,
        promptVersion: REVIEW_ANALYSIS_PROMPT_VERSION,
        result: validatedAnalysis
      },
      $setOnInsert: { hash }
    },
    { upsert: true }
  )
}
