import { createHash } from 'node:crypto'

const createReviewHash = (
  review,
  model,
  promptVersion = 'v1'
) => {
  const normalizedReview = String(review)
    .normalize('NFKC')
    .trim()
    .replace(/\s+/g, ' ')

  return createHash('sha256')
    .update(`${model}:${promptVersion}:${normalizedReview}`)
    .digest('hex')
}

export default createReviewHash
