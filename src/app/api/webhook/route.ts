import { NextResponse, NextRequest } from "next/server";
import { db } from "@/lib/connect-db";
import { emailLog } from "@/db/schema";

const WEBHOOK_SECRET = process.env.SANITY_REVALIDATE_SECRET || process.env.WEBHOOK_SECRET || '';

/**
 * Webhook receiver for email service callbacks (e.g., Resend).
 *
 * SECURITY: Protected by a shared secret to prevent unauthorized writes
 * and database pollution / DoS attacks.
 */
export async function POST(req: NextRequest) {
  // ── Verify webhook authenticity ──
  const secretParam = req.nextUrl.searchParams.get('secret');
  const secretHeader = req.headers.get('x-webhook-secret');
  const providedSecret = secretParam || secretHeader || '';

  if (!WEBHOOK_SECRET || providedSecret !== WEBHOOK_SECRET) {
    return NextResponse.json(
      { error: 'Unauthorized — invalid or missing webhook secret' },
      { status: 401 }
    );
  }

  const data = await req.json();
  const result = await db.insert(emailLog).values({
    payload: data,
  }).returning();

  return NextResponse.json({ status: 200, statusText: "OK" });
}
