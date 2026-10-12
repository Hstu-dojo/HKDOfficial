import { NextResponse } from "next/server";
import { resolveTenantHost } from "@/lib/org/domain-server";
import { isAssignableDomain, normalizeDomain } from "@/lib/org/domains";
export const dynamic = "force-dynamic";
/** Public host-to-slug lookup; returns no admin, contact or credential data. */
export async function GET(request: Request) {
  const host = normalizeDomain(
    new URL(request.url).searchParams.get("host") || "",
  );
  if (!host || !isAssignableDomain(host))
    return NextResponse.json({ slug: null }, { status: 400 });
  try {
    return NextResponse.json(
      { slug: await resolveTenantHost(host) },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch {
    return NextResponse.json(
      { error: "Domain routing temporarily unavailable" },
      { status: 503 },
    );
  }
}
