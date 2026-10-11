import { NextResponse } from "next/server";
import { requirePartnerAdminUser } from "@/lib/partner-admin/auth";
import { listEmailHistory } from "@/lib/email/history";
export async function GET(request: Request) {
  const { user, error } = await requirePartnerAdminUser();
  if (error) return error;
  try {
    return NextResponse.json(
      await listEmailHistory(new URL(request.url).searchParams, user.partnerId),
    );
  } catch {
    return NextResponse.json(
      { error: "Unable to load organization email history" },
      { status: 500 },
    );
  }
}
