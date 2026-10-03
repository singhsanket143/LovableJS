export type RetryWithBackoffOptions = {
  maxAttempts?: number;
  initialBackoffMs?: number;
  label?: string;
};

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function retryWithExponentialBackoff<T>(
  fn: () => Promise<T>,
  options: RetryWithBackoffOptions = {},
): Promise<T> {
  const maxAttempts = options.maxAttempts ?? 5;
  const initialBackoffMs = options.initialBackoffMs ?? 1_000;
  const label = options.label ?? "Operation";

  let lastError: unknown;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;

      if (attempt === maxAttempts) {
        break;
      }

      const delayMs = initialBackoffMs * 2 ** (attempt - 1);
      const message = error instanceof Error ? error.message : String(error);
      console.warn(
        `${label} attempt ${attempt}/${maxAttempts} failed (${message}); retrying in ${delayMs}ms...`,
      );
      await sleep(delayMs);
    }
  }

  throw lastError;
}
