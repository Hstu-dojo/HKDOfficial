/** Native sessions reuse the same expiring, revocable partner session records. */
export function partnerBearerToken(value: string | null) {
  const match = value?.match(/^Bearer ([a-f0-9]{64})$/i);
  return match?.[1] || null;
}
export function partnerPortalPath(value: string | null) {
  if (!value || /[\\\r\n]/.test(value) || /%(?:2f|5c|0a|0d)/i.test(value))
    return "/partner-admin";
  try {
    const url = new URL(value, "https://partner.invalid");
    if (
      url.origin !== "https://partner.invalid" ||
      !/^\/partner-admin(?:\/|$)/.test(url.pathname)
    )
      return "/partner-admin";
    return url.pathname + url.search + url.hash;
  } catch {
    return "/partner-admin";
  }
}
