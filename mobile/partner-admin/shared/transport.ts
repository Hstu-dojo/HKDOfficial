export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
  ) {
    super(message);
  }
}
export async function requestJSON<T>(
  input: RequestInfo | URL,
  init: RequestInit = {},
): Promise<T> {
  const controller = new AbortController(),
    abort = () => controller.abort(),
    timer = setTimeout(abort, 45000);
  init.signal?.addEventListener("abort", abort, { once: true });
  if (init.signal?.aborted) abort();
  try {
    const response = await fetch(input, { ...init, signal: controller.signal });
    const data = await response.json().catch(() => null);
    if (!response.ok)
      throw new ApiError(
        data?.error || data?.message || "Request failed. Please retry.",
        response.status,
      );
    if (data === null)
      throw new ApiError(
        "The server returned an unexpected response. Update the website backend and retry.",
        502,
      );
    return data;
  } catch (error) {
    if (error instanceof ApiError || init.signal?.aborted) throw error;
    throw Error("Could not connect. Check your internet connection and retry.");
  } finally {
    clearTimeout(timer);
    init.signal?.removeEventListener("abort", abort);
  }
}
