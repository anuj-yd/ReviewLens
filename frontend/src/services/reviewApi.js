const API_URL =
  import.meta.env.VITE_API_BASE_URL ||
  'http://localhost:5000/api'

export const uploadReviews = async (file) => {
  const formData = new FormData()

  formData.append('file', file)

  const response = await fetch(
    `${API_URL}/reviews/upload`,
    {
      method: 'POST',
      body: formData
    }
  )

  const data = await response.json()

  if (!response.ok) {
    throw new Error(data.message || 'Upload failed')
  }

  return data
}

export const analyzeReviewById = async (importId, reviewId) => {
  const response = await fetch(
    `${API_URL}/reviews/${encodeURIComponent(importId)}/${encodeURIComponent(reviewId)}/analyze`,
    { method: 'POST' }
  )

  const data = await response.json()

  if (!response.ok) {
    throw new Error(data.message || 'Review analysis failed')
  }

  return data
}
