import { NextResponse } from "next/server";
import { studentAccess } from "@/lib/student-enrollment/access";
import { db } from "@/lib/connect-db";
import { profiles, partners, user } from "@/db/schema";
import { and, eq, or, ilike, count, desc, sql } from "drizzle-orm";
export async function GET(request: Request) {
  const access = await studentAccess();
  if (!access)
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const url = new URL(request.url),
    page = Number(url.searchParams.get("page") || 1),
    q = (url.searchParams.get("q") || "").trim(),
    partnerId = access.partnerId || url.searchParams.get("partnerId");
  if (!Number.isSafeInteger(page) || page < 1 || q.length > 200)
    return NextResponse.json({ error: "Invalid query" }, { status: 400 });
  const escaped = q.replace(/[\\%_]/g, "\\$&");
  const where = and(
    partnerId ? eq(profiles.partnerId, partnerId) : undefined,
    q
      ? or(
          ilike(profiles.fullNameEnglish, `%${escaped}%`),
          ilike(profiles.fullNameBangla, `%${escaped}%`),
          ilike(profiles.email, `%${escaped}%`),
          ilike(user.email, `%${escaped}%`),
          ilike(user.userName, `%${escaped}%`),
          ilike(profiles.memberNumber, `%${escaped}%`),
        )
      : undefined,
  );
  const [students, total, organizations] = await Promise.all([
    db
      .select({
        id: profiles.id,
        name: sql<string>`coalesce(${profiles.fullNameEnglish},${profiles.fullNameBangla},${user.userName})`,
        nameBangla: profiles.fullNameBangla,
        email: sql<string>`coalesce(${profiles.email},${user.email})`,
        memberNumber: profiles.memberNumber,
        organization: partners.name,
      })
      .from(profiles)
      .leftJoin(partners, eq(profiles.partnerId, partners.id))
      .leftJoin(user, eq(profiles.userId, user.id))
      .where(where)
      .orderBy(desc(profiles.createdAt))
      .limit(25)
      .offset((page - 1) * 25),
    db
      .select({ total: count() })
      .from(profiles)
      .leftJoin(user, eq(profiles.userId, user.id))
      .where(where),
    db
      .select({ id: partners.id, name: partners.name })
      .from(partners)
      .where(access.partnerId ? eq(partners.id, access.partnerId) : undefined),
  ]);
  return NextResponse.json(
    {
      students,
      organizations,
      pagination: {
        page,
        total: total[0].total,
        totalPages: Math.ceil(total[0].total / 25),
      },
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}
