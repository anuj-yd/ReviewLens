import { z } from 'zod'

export const reviewAnalysisSchema = z.object({

  sentiment: z.enum([
    'positive',
    'neutral',
    'negative'
  ]),

  topics: z.array(
    z.enum([
      'quality',
      'delivery',
      'price',
      'packaging',
      'support',
      'size_fit',
      'other'
    ])
  )
    .min(1)
    .max(7)
    .refine(
      topics => new Set(topics).size === topics.length,
      'Topics must not contain duplicates.'
    ),

  summary: z.string()
    .trim()
    .min(1)
    .max(280)
    .refine(
      summary => !/[\r\n]/.test(summary),
      'Summary must be a single line.'
    ),

  needs_reply: z.boolean()

}).strict()
