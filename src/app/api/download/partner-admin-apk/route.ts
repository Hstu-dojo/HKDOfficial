import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

/**
 * GET /api/download/partner-admin-apk
 * Redirects directly to the latest Kaizen Partner Admin Android APK in Cloudflare R2.
 * Supports ?info=true to return build metadata JSON instead of redirecting.
 */
export async function GET(request: Request) {
  const publicBase = (
    process.env.CLOUDFLARE_R2_PUBLIC_URL || "https://storage.hstuma.com"
  ).replace(/\/+$/, "");

  const downloadUrl = `${publicBase}/downloads/partner-admin/kaizen-partner-admin-latest.apk`;
  const sha256Url = `${downloadUrl}.sha256`;
  const metadataUrl = `${publicBase}/downloads/partner-admin/latest.json`;

  const url = new URL(request.url);
  if (url.searchParams.get("info") === "true") {
    return NextResponse.json({
      appName: "Kaizen Karate Academy - Partner Admin",
      downloadUrl,
      sha256Url,
      metadataUrl,
    });
  }

  // Redirect directly to the standalone APK file in Cloudflare storage with cache-busting
  const timestamp = Date.now();
  const directTarget = `${downloadUrl}?t=${timestamp}`;

  const response = NextResponse.redirect(directTarget, 307);
  response.headers.set(
    "Cache-Control",
    "no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0",
  );
  response.headers.set("Pragma", "no-cache");
  response.headers.set("Expires", "0");
  response.headers.set("Surrogate-Control", "no-store");
  return response;
}

