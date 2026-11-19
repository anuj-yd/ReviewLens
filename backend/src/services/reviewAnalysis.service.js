import axios from 'axios'
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

export const analyseReviewWithAI = async (reviewText, { onRequest } = {}) => {
  const { baseUrl, model } = getOllamaConfig()
  let validationFeedback = ''

  for (let attempt = 1; attempt <= 2; attempt += 1) {
    console.log(`[Ollama] Analysis attempt ${attempt}`)

    let response

    try {
      onRequest?.()

      response = await axios.post(
        `${baseUrl.replace(/\/$/, '')}/api/chat`,
        {
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
        },
        {
          timeout: 120000,
          transitional: {
            clarifyTimeoutError: true
          },
          headers: {
            'Content-Type': 'application/json'
          }
        }
      )
    } catch (error) {
      console.error('[Ollama connection error]', error.message)

      if (error.response) {
        const apiError = new Error(
          `Ollama request failed: ${error.response.status}`,
          { cause: error }
        )

        apiError.status = error.response.status

        const retryAfter = Number(
          error.response.headers?.['retry-after']
        )

        if (Number.isFinite(retryAfter) && retryAfter > 0) {
          apiError.retryAfterMs = retryAfter * 1000
        }

        throw apiError
      }

      const connectionError = new Error(
        'Unable to connect to local Ollama server.',
        { cause: error }
      )

      connectionError.code =
        error.cause?.code ||
        error.code ||
        (error.name === 'TimeoutError' ? 'ETIMEDOUT' : 'ECONNRESET')

      throw connectionError
    }

    const data = response.data
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
