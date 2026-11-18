import { getOllamaConfig } from '../config/ollama.js'

import {
  reviewAnalysisSchema
} from '../validators/reviewAnalysis.schema.js'

import {
  REVIEW_SYSTEM_PROMPT,
  buildReviewPrompt
} from './reviewPrompt.service.js'

export class AnalysisValidationError extends Error {
  constructor(message) {
    super(message)
    this.name = 'AnalysisValidationError'
  }
}

const RESPONSE_SCHEMA = {
  type: 'object',
  properties: {
    sentiment: {
      type: 'string',
      enum: ['positive', 'neutral', 'negative']
    },
    topics: {
      type: 'array',
      items: {
        type: 'string',
        enum: [
          'quality',
          'delivery',
          'price',
          'packaging',
          'support',
          'size_fit',
          'other'
        ]
      }
    },
    summary: {
      type: 'string'
    },
    needs_reply: {
      type: 'boolean'
    }
  },
  required: [
    'sentiment',
    'topics',
    'summary',
    'needs_reply'
  ],
  additionalProperties: false
}

const hasExplicitProductFailure = reviewText => {
  const reportsFailure = /\b(?:malfunction(?:ed|ing)?|defective|defect|broken|faulty|damaged|stopped working|no longer works|not working|does not work|doesn't work|failed after)\b/i
  const deniesFailure = /\b(?:no|not|never|without)\s+(?:\w+\s+){0,2}(?:malfunction(?:ing)?|defect|problem|issue|fault|damage|break)\b/i

  return reportsFailure.test(reviewText) && !deniesFailure.test(reviewText)
}

export const analyseReviewWithAI = async reviewText => {
  const { baseUrl, model } = getOllamaConfig()
  let validationFeedback = ''

  for (let attempt = 1; attempt <= 2; attempt += 1) {
    console.log(`[Ollama] Analysis attempt ${attempt}`)

    let response

    try {
      response = await fetch(`${baseUrl.replace(/\/$/, '')}/api/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model,
          messages: [
            {
              role: 'system',
              content: REVIEW_SYSTEM_PROMPT
            },
            {
              role: 'user',
              content: buildReviewPrompt(reviewText, validationFeedback)
            }
          ],
          format: RESPONSE_SCHEMA,
          stream: false,
          options: {
            temperature: 0.1
          }
        }),
        signal: AbortSignal.timeout(120000)
      })
    } catch (error) {
      console.error('[Ollama connection error]', error.message)
      throw new Error('Unable to connect to local Ollama server.')
    }

    if (!response.ok) {
      const errorText = await response.text()
      console.error('[Ollama API error]', errorText)
      throw new Error(`Ollama request failed: ${response.status}`)
    }

    const data = await response.json()
    const content = data.message?.content
    let parsedResponse

    try {
      if (typeof content !== 'string' || !content.trim()) {
        throw new Error('Ollama returned an empty response.')
      }

      parsedResponse = JSON.parse(content)
    } catch {
      validationFeedback = 'Return valid JSON only. No Markdown.'

      if (attempt === 2) {
        throw new AnalysisValidationError('Invalid JSON returned twice.')
      }

      continue
    }

    const validation = reviewAnalysisSchema.safeParse(parsedResponse)

    if (validation.success) {
      console.log('[Ollama] Analysis successful')

      // Small local models can miss explicit product failures. Preserve the
      // model's other fields, but make clear defect reports actionable.
      if (hasExplicitProductFailure(reviewText)) {
        return {
          ...validation.data,
          sentiment: 'negative',
          needs_reply: true
        }
      }

      return validation.data
    }

    validationFeedback = validation.error.issues
      .map(issue => `${issue.path.join('.')}: ${issue.message}`)
      .join('; ')

    if (attempt === 2) {
      throw new AnalysisValidationError(
        'Ollama response failed schema validation twice.'
      )
    }
  }

  throw new AnalysisValidationError('Unable to analyse review.')
}
