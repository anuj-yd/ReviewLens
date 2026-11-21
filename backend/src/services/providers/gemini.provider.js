import axios from 'axios'

export const createGeminiProvider = config => ({
  async chat(messages, { temperature = 0.1, responseSchema, onRequest } = {}) {
    if (!config.apiKey) {
      throw new Error('GEMINI_API_KEY is required to use the Gemini fallback.')
    }

    const systemText = messages
      .filter(message => message.role === 'system')
      .map(message => message.content)
      .join('\n\n')

    const contents = messages
      .filter(message => message.role !== 'system')
      .map(message => ({
        role: message.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: message.content }]
      }))

    try {
      onRequest?.()
      const response = await axios.post(
        `${config.baseUrl.replace(/\/$/, '')}/models/${encodeURIComponent(config.model)}:generateContent`,
        {
          ...(systemText ? { systemInstruction: { parts: [{ text: systemText }] } } : {}),
          contents,
          generationConfig: {
            temperature,
            responseMimeType: 'application/json',
            ...(responseSchema ? { responseJsonSchema: responseSchema } : {})
          }
        },
        {
          timeout: 120000,
          headers: {
            'Content-Type': 'application/json',
            'x-goog-api-key': config.apiKey
          }
        }
      )

      return response.data.candidates?.[0]?.content?.parts
        ?.map(part => part.text || '')
        .join('')
    } catch (error) {
      if (Number(error.response?.status) === 429) {
        error.status = 429
        error.retryable = false
        error.rateLimitScope = 'account'
        error.rateLimitProvider = 'Gemini'
      }

      throw error
    }
  }
})
