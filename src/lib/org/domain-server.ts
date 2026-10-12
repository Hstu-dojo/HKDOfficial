import "server-only";
import { cache } from "react";
import { db } from "@/lib/connect-db";
import { partners, partnerDomains } from "@/db/schemas/partner";
import { and, asc, eq } from "drizzle-orm";
import { tenantFromHost } from "./host";
import { hostnameOf, isPlatformHost, normalizeDomain } from "./domains";
export const resolveTenantHost = cache(
  async (host: string | null): Promise<string | null> => {
    const hostname = hostnameOf(host);
    const slug = tenantFromHost(hostname);
    if (slug || isPlatformHost(hostname)) return slug;
    if (!normalizeDomain(hostname)) return null;
    const [mapping] = await db
      .select({ slug: partners.slug })
      .from(partnerDomains)
      .innerJoin(partners, eq(partnerDomains.partnerId, partners.id))
      .where(
        and(eq(partnerDomains.domain, hostname), eq(partners.isActive, true)),
      )
      .limit(1);
    return mapping?.slug || null;
  },
);
export const organizationOrigin = cache(async (slug: string) => {
  const [mapping] = await db
    .select({ domain: partnerDomains.domain })
    .from(partnerDomains)
    .innerJoin(partners, eq(partnerDomains.partnerId, partners.id))
    .where(and(eq(partners.slug, slug), eq(partners.isActive, true)))
    .orderBy(asc(partnerDomains.createdAt), asc(partnerDomains.domain))
    .limit(1);
  return `https://${mapping?.domain || `${slug}.${process.env.TENANT_BASE_DOMAIN || "p.hstuma.com"}`}`;
});
