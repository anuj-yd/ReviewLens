import axios from 'axios'

const annotateRateLimit = error => {
  if (Number(error.response?.status) !== 429) return false

  error.status = 429

  const headers = error.response.headers || {}
  const remainingValue = headers['x-ratelimit-remaining']
  const remaining = remainingValue === undefined ? null : Number(remainingValue)
  const retryAfter = Number(headers['retry-after'])
  const resetValue = Number(headers['x-ratelimit-reset'])

  if (Number.isFinite(retryAfter) && retryAfter > 0) {
    error.retryAfterMs = retryAfter * 1000
  } else if (Number.isFinite(resetValue) && resetValue > 0) {
    const resetAt = resetValue > 1e12 ? resetValue : resetValue * 1000
    const delay = resetAt - Date.now()
    if (delay > 0) error.retryAfterMs = delay
  }

  if (remaining === 0) {
    error.retryable = false
    error.rateLimitScope = 'account'
    error.rateLimitProvider = 'OpenRouter'
  }

  return true
}

export const createOpenRouterProvider = config => ({
  async chat(messages, { temperature = 0.1, onRequest } = {}) {
    if (!config.apiKey) {
      throw new Error('OPENROUTER_API_KEY is required.')
    }

    const headers = {
      Authorization: `Bearer ${config.apiKey}`,
      'Content-Type': 'application/json'
    }

    if (config.siteUrl) headers['HTTP-Referer'] = config.siteUrl
    if (config.appName) headers['X-Title'] = config.appName

    const requestModel = model => {
      onRequest?.()
      return axios.post(
        `${config.baseUrl.replace(/\/$/, '')}/chat/completions`,
        {
          model,
          messages,
          response_format: { type: 'json_object' },
          temperature,
          stream: false
        },
        {
          timeout: 120000,
          transitional: { clarifyTimeoutError: true },
          headers
        }
      )
    }

    let response

    try {
      response = await requestModel(config.model)
    } catch (primaryError) {
      const wasRateLimited = annotateRateLimit(primaryError)
      const canUseFallback = wasRateLimited &&
        primaryError.retryable !== false &&
        config.fallbackModel &&
        config.fallbackModel !== config.model

      if (!canUseFallback) throw primaryError

      console.warn(
        `[OpenRouter] Primary model ${config.model} returned 429; trying fallback ${config.fallbackModel}.`
      )

      try {
        response = await requestModel(config.fallbackModel)
      } catch (fallbackError) {
        annotateRateLimit(fallbackError)
        fallbackError.fallbackModel = config.fallbackModel
        throw fallbackError
      }
    }

    return response.data.choices?.[0]?.message?.content
  }
})
