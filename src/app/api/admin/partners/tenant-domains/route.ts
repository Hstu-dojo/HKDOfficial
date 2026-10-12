import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { protectApiRoute } from "@/lib/rbac/middleware";
import { hasPermission } from "@/lib/rbac/permissions";
import { db } from "@/lib/connect-db";
import { partners, partnerDomains } from "@/db/schemas/partner";
import { eq } from "drizzle-orm";
import { normalizeDomain, isAssignableDomain } from "@/lib/org/domains";
import { tenantFromHost } from "@/lib/org/host";
import {
  listProjectDomains,
  vercelDomainRequest,
} from "@/lib/org/vercel-domains";
const base = process.env.TENANT_BASE_DOMAIN || "p.hstuma.com";
async function allowed(userId: string) {
  return hasPermission(userId, "ADMIN_PANEL", "ACCESS");
}
export const GET = protectApiRoute(
  "PARTNER",
  "READ",
  async (_request, context) => {
    if (!(await allowed(context.userId)))
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    try {
      const [projectDomains, assignments] = await Promise.all([
        listProjectDomains(),
        db
          .select({
            domain: partnerDomains.domain,
            partnerId: partnerDomains.partnerId,
            partnerName: partners.name,
            partnerSlug: partners.slug,
          })
          .from(partnerDomains)
          .innerJoin(partners, eq(partnerDomains.partnerId, partners.id)),
      ]);
      const projectNames = new Set(projectDomains.map((d) => d.name));
      return NextResponse.json({
        domains: projectDomains
          .filter((d) => isAssignableDomain(d.name) || d.name === `*.${base}`)
          .map((d) => ({
            domain: d.name,
            slug: tenantFromHost(d.name),
            verified: d.verified === true,
            redirect: d.redirect || null,
            assignable:
              isAssignableDomain(d.name) &&
              d.verified === true &&
              !d.redirect &&
              !d.gitBranch &&
              !d.customEnvironmentId,
            ...assignments.find((a) => a.domain === d.name),
          })),
        assignments,
        missingDomains: assignments.filter((a) => !projectNames.has(a.domain)),
        tenantBase: base,
      });
    } catch {
      return NextResponse.json(
        {
          error:
            "Could not load domains. Check Vercel credentials and database migration.",
        },
        { status: 502 },
      );
    }
  },
);
export const POST = protectApiRoute(
  "PARTNER",
  "CREATE",
  async (request, context) => {
    if (!(await allowed(context.userId)))
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    try {
      const { slug } = await request.json();
      if (
        typeof slug !== "string" ||
        tenantFromHost(`${slug}.${base}`, base) !== slug
      )
        return NextResponse.json(
          { error: "Enter a valid tenant slug" },
          { status: 400 },
        );
      const domain = await vercelDomainRequest("", "POST", {
        name: `${slug}.${base}`,
      });
      return NextResponse.json({ domain });
    } catch {
      return NextResponse.json(
        { error: "Could not add the subdomain to Vercel" },
        { status: 502 },
      );
    }
  },
);
export const PATCH = protectApiRoute(
  "PARTNER",
  "UPDATE",
  async (request, context) => {
    if (!(await allowed(context.userId)))
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    try {
      const body = await request.json();
      const domain =
        typeof body.domain === "string" ? normalizeDomain(body.domain) : null;
      if (
        !domain ||
        !isAssignableDomain(domain) ||
        typeof body.partnerId !== "string"
      )
        return NextResponse.json(
          { error: "Select an assignable domain and organization" },
          { status: 400 },
        );
      const [partner] = await db
        .select({ id: partners.id, slug: partners.slug })
        .from(partners)
        .where(eq(partners.id, body.partnerId))
        .limit(1);
      if (!partner)
        return NextResponse.json(
          { error: "Organization not found" },
          { status: 404 },
        );
      const subdomainSlug = tenantFromHost(domain, base);
      if (domain.endsWith(`.${base}`) && subdomainSlug !== partner.slug)
        return NextResponse.json(
          { error: "A tenant subdomain must match its organization's slug" },
          { status: 400 },
        );
      const projectDomain = await vercelDomainRequest(
        `/${encodeURIComponent(domain)}`,
      );
      if (
        projectDomain.name !== domain ||
        projectDomain.verified !== true ||
        projectDomain.redirect ||
        projectDomain.gitBranch ||
        projectDomain.customEnvironmentId
      )
        return NextResponse.json(
          {
            error:
              "Domain must be verified, serve production, and have no Vercel redirect",
          },
          { status: 409 },
        );
      const [assignment] = await db
        .insert(partnerDomains)
        .values({ domain, partnerId: partner.id, createdBy: context.userId })
        .onConflictDoNothing()
        .returning();
      if (!assignment)
        return NextResponse.json(
          {
            error:
              "This domain is already assigned. Unassign it before changing organizations.",
          },
          { status: 409 },
        );
      revalidatePath("/sitemap.xml");
      revalidatePath(`/org/${partner.slug}`);
      return NextResponse.json({ assignment });
    } catch {
      return NextResponse.json(
        {
          error:
            "Could not assign domain. Check Vercel credentials and database migration.",
        },
        { status: 502 },
      );
    }
  },
);
export const DELETE = protectApiRoute(
  "PARTNER",
  "UPDATE",
  async (request, context) => {
    if (!(await allowed(context.userId)))
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    const domain = normalizeDomain(
      new URL(request.url).searchParams.get("domain") || "",
    );
    if (!domain || !isAssignableDomain(domain))
      return NextResponse.json({ error: "Invalid domain" }, { status: 400 });
    try {
      await db.delete(partnerDomains).where(eq(partnerDomains.domain, domain));
      revalidatePath("/sitemap.xml");
      // Unassigning must never remove a project domain from Vercel or disturb other sites.
      return NextResponse.json({ success: true });
    } catch {
      return NextResponse.json(
        { error: "Could not unassign domain" },
        { status: 500 },
      );
    }
  },
);
