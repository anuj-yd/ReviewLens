const sentimentForRating = rating => {
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) return null
  if (rating <= 2) return 'negative'
  if (rating === 3) return 'neutral'
  return 'positive'
}

export const isRatingSentimentMismatch = review => {
  const expectedSentiment = sentimentForRating(review.rating)
  const actualSentiment = review.analysis?.sentiment

  return Boolean(
    review.analysisStatus === 'completed' &&
    expectedSentiment &&
    actualSentiment &&
    expectedSentiment !== actualSentiment
  )
}

export const getRatingSentimentAgreement = (reviews = []) => {
  let compared = 0
  let mismatches = 0

  for (const review of reviews) {
    const expectedSentiment = sentimentForRating(review.rating)
    const actualSentiment = review.analysis?.sentiment

    if (review.analysisStatus !== 'completed' || !expectedSentiment || !actualSentiment) continue

    compared += 1
    if (expectedSentiment !== actualSentiment) mismatches += 1
  }

  return {
    compared,
    mismatches,
    percentage: compared ? Math.round((compared - mismatches) / compared * 100) : null
  }
}
