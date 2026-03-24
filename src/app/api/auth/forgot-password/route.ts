import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

function getOrigin(request: NextRequest): string {
  const forwardedHost = request.headers.get('x-forwarded-host')
  const forwardedProto = request.headers.get('x-forwarded-proto')
  if (forwardedHost) {
    const proto = forwardedProto || 'https'
    return `${proto}://${forwardedHost}`
  }

  return request.nextUrl.origin
}

function getCanonicalOrigin(request: NextRequest): string {
  const host = (request.headers.get('x-forwarded-host') || request.headers.get('host') || request.nextUrl.host || '').toLowerCase()
  const forwardedProto = request.headers.get('x-forwarded-proto')
  const proto = forwardedProto || request.nextUrl.protocol.replace(':', '') || 'https'

  if (host.includes('localhost') || host.startsWith('127.0.0.1')) {
    return request.nextUrl.origin
  }

  const rootDomain = process.env.ROOT_DOMAIN || 'hstuma.com'
  return `${proto}://${rootDomain}`
}

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json(
        { error: "Email is required" },
        { status: 400 }
      );
    }

    const supabase = await createClient();
    const origin = getOrigin(request)

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${origin}/auth/callback?next=${encodeURIComponent(`${origin}/reset-password`)}`,
    });

    if (error) {
      return NextResponse.json(
        { error: "Failed to send reset email" },
        { status: 400 }
      );
    }

    return NextResponse.json({
      message: "Password reset email sent successfully",
    });

  } catch (error) {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}