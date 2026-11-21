const sleep = ms =>
  new Promise(resolve => setTimeout(resolve, ms))

const isRetryableError = error => {
  if (error.retryable === false) return false

  const status = Number(error.status || error.response?.status)

  const retryableCodes = [
    'ECONNRESET',
    'ETIMEDOUT',
    'EAI_AGAIN',
    'ECONNREFUSED',
    'EHOSTUNREACH',
    'UND_ERR_CONNECT_TIMEOUT'
  ]

  return (
    status === 429 ||
    (status >= 500 && status <= 599) ||
    retryableCodes.includes(error.code) ||
    error.name === 'TimeoutError' ||
    error.name === 'AbortError'
  )
}

const retryWithBackoff = async (
  operation,
  {
    maxAttempts = 4,
    baseDelay = 1000,
    maxDelay = 8000,
    onRetry = () => {},
    sleepFn = sleep,
    random = Math.random
  } = {}
) => {
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await operation()
    } catch (error) {
      if (
        attempt === maxAttempts ||
        !isRetryableError(error)
      ) {
        throw error
      }

      const exponentialDelay = Math.min(
        maxDelay,
        baseDelay * Math.pow(2, attempt - 1)
      )

      const jitter = Math.floor(random() * 250)

      const delay = error.retryAfterMs
        ? Math.min(error.retryAfterMs, maxDelay)
        : exponentialDelay + jitter

      onRetry({
        attempt,
        nextAttempt: attempt + 1,
        delay,
        error: error.message
      })

      console.log(
        `[AI Retry] Attempt ${attempt + 1} in ${delay}ms`
      )

      await sleepFn(delay)
    }
  }
}

export default retryWithBackoff
