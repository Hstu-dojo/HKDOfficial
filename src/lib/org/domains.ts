/** Host helpers usable in both Edge middleware and Node routes. */
export function normalizeDomain(value: string) {
  const name = value.trim().toLowerCase().replace(/\.$/, "");
  if (
    name.length > 253 ||
    !name.includes(".") ||
    !name
      .split(".")
      .every((label) => /^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/.test(label)) ||
    /^[\d.]+$/.test(name)
  )
    return null;
  return name;
}
export function hostnameOf(host: string | null) {
  return (host || "")
    .split(",")[0]
    .trim()
    .toLowerCase()
    .split(":")[0]
    .replace(/\.$/, "");
}
export function isPlatformHost(host: string | null) {
  const hostname = hostnameOf(host);
  if (
    process.env.NODE_ENV !== "production" &&
    /^(?:[0-9]{1,3}\.){3}[0-9]{1,3}$/.test(hostname)
  )
    return true;
  const root = (process.env.ROOT_DOMAIN || "hstuma.com").toLowerCase();
  const site =
    process.env.SITE_URL ||
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.NEXT_PUBLIC_SITE_URL;
  let siteHost = "";
  try {
    if (site) siteHost = new URL(site).hostname;
  } catch {}
  return (
    !hostname ||
    [
      root,
      `www.${root}`,
      siteHost,
      "localhost",
      "127.0.0.1",
      process.env.VERCEL_URL,
      process.env.VERCEL_PROJECT_PRODUCTION_URL,
    ].includes(hostname) ||
    hostname.endsWith(".vercel.app")
  );
}
export function isAssignableDomain(domain: string) {
  const base = (process.env.TENANT_BASE_DOMAIN || "p.hstuma.com").toLowerCase();
  return (
    !!normalizeDomain(domain) &&
    !isPlatformHost(domain) &&
    domain !== base &&
    domain !== `www.${base}` &&
    !domain.startsWith("*")
  );
}
