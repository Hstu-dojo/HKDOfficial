import { NextRequest, NextResponse } from "next/server";
import { privatePath } from "./site";
/** Preserve auth/locale middleware overrides while adding the actual requested path. */
export function withSeoRequest(request: NextRequest, response: Response) {
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-seo-pathname", request.nextUrl.pathname);
  const forwarded = NextResponse.next({ request: { headers: requestHeaders } });
  const existing =
    response.headers.get("x-middleware-override-headers")?.split(",") || [];
  const added =
    forwarded.headers.get("x-middleware-override-headers")?.split(",") || [];
  forwarded.headers.forEach((value, key) => {
    if (
      key.startsWith("x-middleware-request-") &&
      (!response.headers.has(key) ||
        key === "x-middleware-request-x-seo-pathname")
    )
      response.headers.set(key, value);
  });
  response.headers.set(
    "x-middleware-override-headers",
    [...new Set([...existing, ...added])].filter(Boolean).join(","),
  );
  if (privatePath(request.nextUrl.pathname))
    response.headers.set("X-Robots-Tag", "noindex, nofollow");
  return response;
}
