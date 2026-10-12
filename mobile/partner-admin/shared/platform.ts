export function apiOrigin(value: string, development = false) {
  const url = new URL(value.trim());
  if (
    (url.protocol !== "https:" && !(development && url.protocol === "http:")) ||
    url.username ||
    url.password ||
    url.pathname !== "/" ||
    url.search ||
    url.hash
  )
    throw Error("Enter the HTTPS website address, without a page path.");
  return url.origin;
}
export function portalNavigation(url: string, origin: string) {
  try {
    const target = new URL(url);
    if (target.origin === origin) return "internal";
    if (["https:", "mailto:", "tel:"].includes(target.protocol))
      return "external";
  } catch {}
  return "blocked";
}
