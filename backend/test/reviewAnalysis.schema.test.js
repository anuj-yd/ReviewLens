import assert from 'node:assert/strict'
import test from 'node:test'

import { reviewAnalysisSchema } from '../src/validators/reviewAnalysis.schema.js'

const validAnalysis = {
  sentiment: 'negative',
  topics: ['quality', 'support'],
  summary: 'The earbuds stopped working after two days.',
  needs_reply: true
}

test('accepts a valid analysis with exactly the required fields', () => {
  assert.equal(reviewAnalysisSchema.safeParse(validAnalysis).success, true)
})

test('rejects invalid labels, empty topics, multiline summaries, and extra fields', () => {
  const invalidResponses = [
    { ...validAnalysis, sentiment: 'mixed' },
    { ...validAnalysis, topics: [] },
    { ...validAnalysis, topics: ['quality', 'made_up_topic'] },
    { ...validAnalysis, summary: 'First line\nSecond line' },
    { ...validAnalysis, needs_reply: 'yes' },
    { ...validAnalysis, injected: 'unexpected field' }
  ]

  for (const response of invalidResponses) {
    assert.equal(reviewAnalysisSchema.safeParse(response).success, false)
  }
})

test('rejects duplicate topic labels', () => {
  assert.equal(
    reviewAnalysisSchema.safeParse({ ...validAnalysis, topics: ['quality', 'quality'] }).success,
    false
  )
})
