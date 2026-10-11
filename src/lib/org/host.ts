export function tenantFromHost(
  host: string | null,
  base = process.env.TENANT_BASE_DOMAIN || "p.hstuma.com",
) {
  const hostname = (host || "")
    .split(",")[0]
    .trim()
    .toLowerCase()
    .split(":")[0];
  const suffix = `.${base.toLowerCase()}`;
  if (!hostname.endsWith(suffix)) return null;
  const slug = hostname.slice(0, -suffix.length);
  return /^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/.test(slug) &&
    !["www", "app", "api"].includes(slug)
    ? slug
    : null;
}
