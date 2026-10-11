import "server-only";
export function newsletterConfig() {
  return {
    key: process.env.RESEND_NEWSLETTER_API_KEY?.trim(),
    segment: process.env.RESEND_NEWSLETTER_SEGMENT_ID?.trim(),
    from: process.env.NEWSLETTER_FROM_ADDRESS?.trim(),
  };
}
export function newsletterConfigured() {
  const c = newsletterConfig();
  return !!(c.key && c.segment && c.from);
}
export class ProviderError extends Error {
  constructor(public status: number) {
    super(
      `Resend request failed (${status}). Check provider logs and newsletter configuration.`,
    );
  }
}
// Serialize calls within this process to respect Resend's default two requests/sec.
let tail: Promise<unknown> = Promise.resolve(),
  lastCall = 0;
export async function resendRequest<T>(
  path: string,
  method = "GET",
  body?: unknown,
): Promise<T> {
  const operation = tail
    .catch(() => {})
    .then(async () => {
      const c = newsletterConfig();
      if (!newsletterConfigured())
        throw new Error("Newsletter provider is not configured");
      const wait = Math.max(0, 600 - (Date.now() - lastCall));
      if (wait) await new Promise((r) => setTimeout(r, wait));
      lastCall = Date.now();
      const response = await fetch(`https://api.resend.com${path}`, {
        method,
        cache: "no-store",
        headers: {
          Authorization: `Bearer ${c.key}`,
          "Content-Type": "application/json",
        },
        body: body === undefined ? undefined : JSON.stringify(body),
        signal: AbortSignal.timeout(7000),
      });
      if (!response.ok) throw new ProviderError(response.status);
      return response.json() as Promise<T>;
    });
  tail = operation;
  return operation;
}
export async function syncResendContact(email: string, name: string) {
  let contact: { id: string; unsubscribed: boolean };
  try {
    contact = await resendRequest(`/contacts/${encodeURIComponent(email)}`);
  } catch (error) {
    if (!(error instanceof ProviderError) || error.status !== 404) throw error;
    const [first_name, ...rest] = name.split(/\s+/);
    try {
      await resendRequest("/contacts", "POST", {
        email,
        first_name: first_name || undefined,
        last_name: rest.join(" ") || undefined,
        unsubscribed: false,
      });
    } catch (createError) {
      if (!(createError instanceof ProviderError) || createError.status !== 409)
        throw createError;
    }
    // Re-read also protects a race with an existing contact's unsubscribe state.
    contact = await resendRequest(`/contacts/${encodeURIComponent(email)}`);
  }
  if (!contact.unsubscribed)
    await resendRequest(
      `/contacts/${encodeURIComponent(contact.id)}/segments/${encodeURIComponent(newsletterConfig().segment!)}`,
      "POST",
      {},
    );
  return contact;
}
