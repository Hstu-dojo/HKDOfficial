import { NextResponse } from "next/server";
import {
  requirePartnerAdminUser,
  PARTNER_ADMIN_SESSION_COOKIE,
} from "@/lib/partner-admin/auth";
import {
  partnerBearerToken,
  partnerPortalPath,
} from "@/lib/partner-admin/mobile";
import { db } from "@/lib/connect-db";
import { partnerAdminSessions } from "@/db/schema";
import { and, eq, gt } from "drizzle-orm";
/** Bootstrap an HttpOnly portal cookie without injecting a token into page JavaScript. */
export async function GET(request: Request) {
  const token = partnerBearerToken(request.headers.get("authorization"));
  if (!token)
    return NextResponse.json(
      { error: "Native session required" },
      { status: 401 },
    );
  const { user, error } = await requirePartnerAdminUser();
  if (error) return error;
  const [session] = await db
    .select({ expiresAt: partnerAdminSessions.expiresAt })
    .from(partnerAdminSessions)
    .where(
      and(
        eq(partnerAdminSessions.token, token),
        eq(partnerAdminSessions.partnerAdminId, user.id),
        gt(partnerAdminSessions.expiresAt, new Date()),
      ),
    )
    .limit(1);
  if (!session)
    return NextResponse.json({ error: "Session expired" }, { status: 401 });
  const url = new URL(request.url);
  const response = NextResponse.redirect(
    new URL(partnerPortalPath(url.searchParams.get("next")), url.origin),
    303,
  );
  response.cookies.set({
    name: PARTNER_ADMIN_SESSION_COOKIE,
    value: token,
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: session.expiresAt,
  });
  response.headers.set("Cache-Control", "private, no-store");
  response.headers.set("Referrer-Policy", "no-referrer");
  return response;
}
