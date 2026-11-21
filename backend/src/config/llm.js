import { getOpenRouterConfig } from './openrouter.js'
import { getGeminiConfig } from './gemini.js'

export const getLlmConfig = () => {
  const config = getOpenRouterConfig()
  const gemini = getGeminiConfig()

  if (!config.apiKey) {
    throw new Error('OPENROUTER_API_KEY is required.')
  }

  if (!config.model) {
    throw new Error('OPENROUTER_MODEL is required.')
  }

  return {
    ...config,
    gemini,
    provider: gemini.apiKey ? 'openrouter+gemini-fallback' : 'openrouter',
    cacheModel: `openrouter:${config.model}${config.fallbackModel ? `|fallback:${config.fallbackModel}` : ''}${gemini.apiKey ? `|gemini:${gemini.model}` : ''}`
  }
}
