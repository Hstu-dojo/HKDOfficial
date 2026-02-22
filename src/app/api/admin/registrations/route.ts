import { NextResponse } from "next/server";
import { protectApiRoute, getRBACContext } from "@/lib/rbac/middleware";
import { hasPermission } from "@/lib/rbac/permissions";
import { db } from "@/lib/connect-db";
import { registrations, user } from "@/db/schema";
import { eq, desc, like, or, sql } from "drizzle-orm";

// GET /api/admin/registrations - List all registrations with user info
export const GET = protectApiRoute("MEMBER", "READ", async (request, context) => {
  try {
    const url = new URL(request.url);
    const search = url.searchParams.get("search") || "";
    const status = url.searchParams.get("status") || "";

    const results = await db
      .select({
        registration: registrations,
        user: {
          id: user.id,
          userName: user.userName,
          email: user.email,
          userAvatar: user.userAvatar,
          defaultRole: user.defaultRole,
        },
      })
      .from(registrations)
      .leftJoin(user, eq(registrations.userId, user.id))
      .orderBy(desc(registrations.createdAt));

    let filtered = results;

    if (search) {
      const s = search.toLowerCase();
      filtered = filtered.filter(
        (r) =>
          r.registration.firstName?.toLowerCase().includes(s) ||
          r.registration.lastName?.toLowerCase().includes(s) ||
          r.registration.email?.toLowerCase().includes(s) ||
          r.registration.phoneNumber?.toLowerCase().includes(s) ||
          r.user?.userName?.toLowerCase().includes(s) ||
          r.user?.email?.toLowerCase().includes(s)
      );
    }

    if (status) {
      filtered = filtered.filter((r) => r.registration.status === status);
    }

    // Parse notes JSON for each registration
    const data = filtered.map((r) => {
      let notes: Record<string, any> = {};
      try {
        notes =
          typeof r.registration.notes === "string"
            ? JSON.parse(r.registration.notes || "{}")
            : r.registration.notes || {};
      } catch {}

      return {
        ...r.registration,
        parsedNotes: notes,
        user: r.user,
      };
    });

    return NextResponse.json({ registrations: data });
  } catch (error) {
    console.error("Error fetching registrations:", error);
    return NextResponse.json(
      { error: "Failed to fetch registrations" },
      { status: 500 }
    );
  }
});
