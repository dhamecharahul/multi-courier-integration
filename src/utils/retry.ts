import { config } from "../config";

export const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export async function withRetry<T>(
  operation: () => Promise<T>,
  options: { maxAttempts?: number; baseDelayMs?: number; shouldRetry?: (e: any) => boolean } = {}
): Promise<T> {
  const maxAttempts = options.maxAttempts ?? config.retry.maxAttempts;
  const baseDelayMs = options.baseDelayMs ?? config.retry.baseDelayMs;
  const shouldRetry = options.shouldRetry ?? ((e: any) => Boolean(e?.retryable));

  let lastError: unknown;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      if (attempt >= maxAttempts || !shouldRetry(error)) throw error;
      await sleep(baseDelayMs * Math.pow(2, attempt - 1));
    }
  }
  throw lastError;
}
