import assert from 'node:assert/strict'
import test from 'node:test'

import retryWithBackoff from '../src/utils/retryWithBackoff.js'

test('retries a rate-limited operation with exponential delays, then returns its result', async () => {
  let calls = 0
  const delays = []
  const retryEvents = []

  const result = await retryWithBackoff(async () => {
    calls++
    if (calls < 3) {
      const error = new Error('Rate limited')
      error.status = 429
      throw error
    }
    return 'completed'
  }, {
    maxAttempts: 3,
    baseDelay: 10,
    maxDelay: 100,
    random: () => 0,
    sleepFn: async delay => delays.push(delay),
    onRetry: event => retryEvents.push(event)
  })

  assert.equal(result, 'completed')
  assert.equal(calls, 3)
  assert.deepEqual(delays, [10, 20])
  assert.deepEqual(retryEvents.map(event => event.attempt), [1, 2])
})

test('does not retry a non-retryable client error', async () => {
  let calls = 0
  const error = Object.assign(new Error('Bad request'), { status: 400 })

  await assert.rejects(
    retryWithBackoff(async () => {
      calls++
      throw error
    }, { sleepFn: async () => assert.fail('sleep should not be called') }),
    error
  )

  assert.equal(calls, 1)
})

test('throws after the configured maximum number of attempts', async () => {
  let calls = 0
  const error = Object.assign(new Error('Server unavailable'), { status: 503 })

  await assert.rejects(
    retryWithBackoff(async () => {
      calls++
      throw error
    }, {
      maxAttempts: 3,
      baseDelay: 1,
      random: () => 0,
      sleepFn: async () => {}
    }),
    error
  )

  assert.equal(calls, 3)
})
