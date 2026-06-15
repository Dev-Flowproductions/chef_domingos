const DEFAULT_MS = 12_000;

export async function fetchWithTimeout(
  input: RequestInfo | URL,
  init?: RequestInit,
  ms = DEFAULT_MS,
): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), ms);

  const signals = [controller.signal];
  if (init?.signal) signals.push(init.signal);

  try {
    return await fetch(input, {
      ...init,
      signal: controller.signal,
    });
  } catch (err) {
    if (controller.signal.aborted) {
      throw new TypeError('Network request failed');
    }
    throw err;
  } finally {
    clearTimeout(timer);
  }
}
