import { getOpenRouterConfig } from './openrouter.js'

export const getLlmConfig = () => {
  const config = getOpenRouterConfig()

  if (!config.apiKey) {
    throw new Error('OPENROUTER_API_KEY is required.')
  }

  if (!config.model) {
    throw new Error('OPENROUTER_MODEL is required.')
  }

  return {
    ...config,
    provider: 'openrouter',
    cacheModel: `openrouter:${config.model}`
  }
}
