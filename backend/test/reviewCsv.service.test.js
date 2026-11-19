import assert from 'node:assert/strict'
import test from 'node:test'

import { parseAndCleanReviews } from '../src/services/reviewCsv.service.js'

test('cleans review text, skips empty reviews, and records unknown ratings', () => {
  const csv = [
    'review_id,product,rating,date,review_text',
    'R001,Mug,5,2026-01-01,"<p>Great&nbsp;quality</p>"',
    'R002,Mug,,2026-01-02," great quality "',
    'R003,Mug,6,not-a-date,"Works well"',
    'R004,Mug,4,2026-01-04,"   "'
  ].join('\n')

  const result = parseAndCleanReviews(Buffer.from(csv))

  assert.equal(result.reviews.length, 3)
  assert.equal(result.reviews[0].reviewText, 'Great quality')
  assert.equal(result.reviews[1].rating, null)
  assert.equal(result.reviews[1].ratingStatus, 'missing')
  assert.equal(result.reviews[2].rating, null)
  assert.equal(result.reviews[2].ratingStatus, 'invalid')
  assert.equal(result.summary.skippedEmptyReviews, 1)
  assert.equal(result.summary.missingRatingCount, 1)
  assert.equal(result.summary.invalidRatingCount, 1)
  assert.equal(result.summary.invalidDateCount, 1)
})

test('detects duplicate review text once, ignoring case and whitespace', () => {
  const csv = [
    'review_id,product,rating,date,review_text',
    'R001,Mug,5,2026-01-01,"Excellent mug"',
    'R002,Cup,4,2026-01-02," excellent   MUG "'
  ].join('\n')

  const result = parseAndCleanReviews(Buffer.from(csv))

  assert.equal(result.reviews.length, 2)
  assert.equal(result.reviews[0].isDuplicate, false)
  assert.equal(result.reviews[1].isDuplicate, true)
  assert.equal(result.reviews[1].duplicateOf, 'R001')
  assert.equal(result.summary.uniqueReviewCount, 1)
  assert.equal(result.summary.duplicateCount, 1)
})

test('rejects CSVs missing required columns with a useful error', () => {
  assert.throws(
    () => parseAndCleanReviews(Buffer.from('review_id,review_text\nR001,Hello')),
    /Missing required columns: product, rating, date/
  )
})
