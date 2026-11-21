const API_BASE_URL = (
  import.meta.env.VITE_API_URL ||
  import.meta.env.VITE_API_BASE_URL ||
  (import.meta.env.PROD ? '' : 'http://localhost:5000')
).replace(/\/api\/?$/, '').replace(/\/$/, '')

const API_URL = `${API_BASE_URL}/api`

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

export const analyzeImport = async importId => {
  try {
    const response = await fetch(
      `${API_URL}/reviews/bulk-analyze/${encodeURIComponent(importId)}`,
      { method: 'POST' }
    )

    const data = await response.json()

    if (!response.ok || !data.success) {
      throw new Error(data.message || 'Bulk analysis failed')
    }

    return data
  } catch (error) {
    console.error('[Bulk Analysis API]', error)
    throw error
  }
}

const readJson = async response => {
  const data = await response.json()
  if (!response.ok || !data.success) throw new Error(data.message || 'Request failed')
  return data
}

export const getImportDashboard = async importId => readJson(await fetch(
  `${API_URL}/reviews/${encodeURIComponent(importId)}/dashboard`
))

export const suggestReply = async (importId, reviewId) => readJson(await fetch(
  `${API_URL}/reviews/${encodeURIComponent(importId)}/${encodeURIComponent(reviewId)}/suggest-reply`,
  { method: 'POST' }
))
