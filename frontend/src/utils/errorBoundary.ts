/**
 * Error Boundary Wrapper
 * Provides error handling and recovery for React components
 */

/**
 * Error handling result
 */
export type ErrorHandlerResult = {
  handled: boolean
  message: string
  recoverable: boolean
}

/**
 * Error handler function
 */
export type ErrorHandler = (error: Error, context: string) => ErrorHandlerResult

/**
 * Default error handler
 */
export const defaultErrorHandler: ErrorHandler = (error: Error, context: string) => {
  console.error(`[${context}] Error:`, error.message)

  return {
    handled: true,
    message: error.message,
    recoverable: !error.message.includes('fatal'),
  }
}

/**
 * Safe wrapper for async operations with error handling
 */
export async function tryCatch<T>(
  fn: () => Promise<T>,
  context: string,
  handler: ErrorHandler = defaultErrorHandler,
): Promise<T | null> {
  try {
    return await fn()
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error))
    handler(err, context)
    return null
  }
}

/**
 * Safe wrapper for sync operations
 */
export function trySync<T>(
  fn: () => T,
  context: string,
  handler: ErrorHandler = defaultErrorHandler,
): T | null {
  try {
    return fn()
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error))
    handler(err, context)
    return null
  }
}

/**
 * Retry logic with exponential backoff
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxAttempts: number = 3,
  delayMs: number = 100,
  context: string = 'retry',
): Promise<T | null> {
  let lastError: Error | null = null

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn()
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error))

      if (attempt < maxAttempts) {
        const delay = delayMs * Math.pow(2, attempt - 1)
        console.warn(`[${context}] Attempt ${attempt} failed, retrying in ${delay}ms...`)
        await new Promise((resolve) => setTimeout(resolve, delay))
      }
    }
  }

  console.error(`[${context}] Failed after ${maxAttempts} attempts:`, lastError)
  return null
}

/**
 * Safely execute code with fallback value
 */
export function getOrDefault<T>(
  fn: () => T,
  defaultValue: T,
  context: string = 'getOrDefault',
): T {
  try {
    return fn()
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error))
    console.warn(`[${context}] Error, using default:`, err.message)
    return defaultValue
  }
}

/**
 * Validate input before processing
 */
export function validate<T>(
  value: T,
  predicate: (val: T) => boolean,
  errorMessage: string,
): T {
  if (!predicate(value)) {
    throw new Error(errorMessage)
  }
  return value
}

/**
 * Log errors without stopping execution
 */
export function logError(error: unknown, context: string = 'error'): void {
  const message = error instanceof Error ? error.message : String(error)
  const stack = error instanceof Error ? error.stack : 'No stack trace'

  console.error(`[${context}] ${message}`, stack)

  // Could send to logging service here
  // analytics.track('error', { message, context })
}
