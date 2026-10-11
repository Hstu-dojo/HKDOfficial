import { NextResponse } from "next/server";
import { getRBACContext } from "@/lib/rbac/middleware";
import { hasPermission } from "@/lib/rbac/permissions";
import { listEmailHistory } from "@/lib/email/history";
export async function GET(request: Request) {
  const context = await getRBACContext();
  if (!context)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (
    !(await hasPermission(context.userId, "ADMIN_PANEL", "ACCESS")) ||
    !(await hasPermission(context.userId, "EMAIL", "READ"))
  )
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  try {
    return NextResponse.json(
      await listEmailHistory(new URL(request.url).searchParams),
    );
  } catch {
    return NextResponse.json(
      { error: "Unable to load email history" },
      { status: 500 },
    );
  }
}
