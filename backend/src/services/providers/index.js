import { createOpenRouterProvider } from './openrouter.provider.js'
import { createGeminiProvider } from './gemini.provider.js'

const isFailoverWorthy = error => {
  const status = Number(error.response?.status || error.status)
  return status === 429 || (status >= 500 && status <= 599) || [
    'ECONNRESET',
    'ETIMEDOUT',
    'EAI_AGAIN',
    'ECONNREFUSED',
    'EHOSTUNREACH',
    'UND_ERR_CONNECT_TIMEOUT'
  ].includes(error.code)
}

export const createLlmProvider = config => {
  const openRouter = createOpenRouterProvider(config)
  if (!config.gemini?.apiKey) return openRouter

  const gemini = createGeminiProvider(config.gemini)

  return {
    async chat(messages, options) {
      try {
        return await openRouter.chat(messages, options)
      } catch (primaryError) {
        if (!isFailoverWorthy(primaryError)) throw primaryError

        console.warn(
          `[AI provider fallback] OpenRouter failed (${primaryError.response?.status || primaryError.code || 'connection error'}); using Gemini ${config.gemini.model}.`
        )

        try {
          return await gemini.chat(messages, options)
        } catch (fallbackError) {
          fallbackError.fallbackProvider = 'Gemini'
          if (primaryError.rateLimitScope === 'account') {
            fallbackError.primaryProviderQuotaExhausted = true
            fallbackError.retryable = false
            fallbackError.rateLimitScope = 'account'
            fallbackError.rateLimitProvider = 'OpenRouter and Gemini fallback'
          }
          throw fallbackError
        }
      }
    }
  }
}
