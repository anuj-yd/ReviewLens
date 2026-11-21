import axios from 'axios'

export const createOpenRouterProvider = config => ({
  async chat(messages, { temperature = 0.1 } = {}) {
    if (!config.apiKey) {
      throw new Error('OPENROUTER_API_KEY is required.')
    }

    const headers = {
      Authorization: `Bearer ${config.apiKey}`,
      'Content-Type': 'application/json'
    }

    if (config.siteUrl) headers['HTTP-Referer'] = config.siteUrl
    if (config.appName) headers['X-Title'] = config.appName

    const response = await axios.post(
      `${config.baseUrl.replace(/\/$/, '')}/chat/completions`,
      {
        model: config.model,
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

    return response.data.choices?.[0]?.message?.content
  }
})
