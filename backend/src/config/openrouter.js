export const getOpenRouterConfig = () => ({
  baseUrl: process.env.OPENROUTER_BASE_URL || 'https://openrouter.ai/api/v1',
  apiKey: process.env.OPENROUTER_API_KEY || '',
  model: process.env.OPENROUTER_MODEL || '',
  siteUrl: process.env.OPENROUTER_SITE_URL || '',
  appName: process.env.OPENROUTER_APP_NAME || 'ReviewLens'
})
