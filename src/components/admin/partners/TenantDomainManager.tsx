"use client";
import { useCallback, useEffect, useState } from "react";
import { useRBAC } from "@/hooks/useRBAC";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { XMarkIcon } from "@heroicons/react/24/outline";
type Domain = {
  domain: string;
  slug?: string | null;
  verified?: boolean;
  assignable?: boolean;
  redirect?: string | null;
  partnerId?: string;
  partnerName?: string;
};
export default function TenantDomainManager({
  partners,
  onClose,
}: {
  partners: { id: string; name: string; isActive: boolean; slug: string }[];
  onClose: () => void;
}) {
  const { hasPermission } = useRBAC();
  const canAssign = hasPermission("PARTNER", "UPDATE"),
    canCreate = hasPermission("PARTNER", "CREATE");
  const [domains, setDomains] = useState<Domain[]>([]),
    [missing, setMissing] = useState<Domain[]>([]);
  const [selected, setSelected] = useState<Record<string, string>>({});
  const [base, setBase] = useState("p.hstuma.com"),
    [slug, setSlug] = useState("");
  const [loading, setLoading] = useState(true),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [success, setSuccess] = useState("");
  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/admin/partners/tenant-domains");
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Could not load domains");
      setDomains(data.domains);
      setMissing(data.missingDomains);
      setBase(data.tenantBase);
    } catch (error: any) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => {
    load();
  }, [load]);
  useEffect(() => {
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previous;
      document.removeEventListener("keydown", onKey);
    };
  }, [onClose]);
  async function mutate(method: string, body?: unknown, domain?: string) {
    setBusy(true);
    setError("");
    setSuccess("");
    try {
      const response = await fetch(
        `/api/admin/partners/tenant-domains${domain ? `?domain=${encodeURIComponent(domain)}` : ""}`,
        {
          method,
          headers: { "Content-Type": "application/json" },
          ...(body ? { body: JSON.stringify(body) } : {}),
        },
      );
      const data = await response.json();
      if (!response.ok)
        throw new Error(data.error || "Could not update domain");
      setSuccess(
        method === "PATCH"
          ? "Domain assigned. Routing updates on the next request."
          : method === "DELETE"
            ? "Domain unassigned. It remains in your Vercel project."
            : "Subdomain added to Vercel. Complete its DNS setup if needed.",
      );
      if (method === "POST") setSlug("");
      await load();
    } catch (error: any) {
      setError(error.message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="tenant-domains-title"
      className="fixed inset-0 z-50 overflow-y-auto bg-black/50 p-4"
    >
      <div className="flex min-h-full items-center justify-center">
        <div className="shadow-xl max-h-[calc(100dvh-2rem)] w-full max-w-3xl overflow-y-auto rounded-2xl border bg-card">
          <div className="flex items-start justify-between gap-4 border-b p-5">
            <div>
              <h2 id="tenant-domains-title" className="text-lg font-semibold">
                Organization domains
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Assign verified production domains already added to your Vercel
                project.
              </p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              aria-label="Close domains"
              onClick={onClose}
            >
              <XMarkIcon className="h-5 w-5" />
            </Button>
          </div>
          <div className="space-y-4 p-5">
            <p className="text-sm leading-relaxed text-muted-foreground">
              Use an apex domain such as dojo.com or an exact subdomain such as
              www.dojo.com. Assign each hostname separately. The first assigned
              hostname becomes the organization's canonical address. Academy
              domains and wildcard hosts cannot be assigned.
            </p>
            {error && (
              <div
                role="alert"
                className="rounded-lg border border-destructive/30 p-3 text-sm text-destructive"
              >
                {error}
              </div>
            )}
            {success && (
              <p role="status" className="rounded-lg bg-primary/10 p-3 text-sm">
                {success}
              </p>
            )}
            <div className="flex justify-end">
              <Button
                variant="outline"
                size="sm"
                disabled={busy || loading}
                onClick={load}
              >
                Refresh domains
              </Button>
            </div>
            {loading ? (
              <p className="p-4 text-sm text-muted-foreground">
                Loading domains…
              </p>
            ) : (
              <div className="divide-y rounded-xl border">
                {[...domains, ...missing].map((domain) => (
                  <div key={domain.domain} className="space-y-3 p-4">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="break-all text-sm font-semibold">
                        {domain.domain}
                      </p>
                      <span className="text-xs text-muted-foreground">
                        {missing.some((d) => d.domain === domain.domain)
                          ? "Missing from Vercel"
                          : domain.redirect
                            ? `Redirects to ${domain.redirect}`
                            : domain.verified
                              ? "Verified"
                              : "Needs verification"}
                      </span>
                    </div>
                    {domain.partnerId ? (
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <span className="text-sm">
                          Assigned to {domain.partnerName}
                        </span>
                        {canAssign && (
                          <Button
                            variant="outline"
                            size="sm"
                            disabled={busy}
                            onClick={() => {
                              if (
                                confirm(
                                  `Unassign ${domain.domain}? This stops custom-domain routing for this organization.`,
                                )
                              )
                                mutate("DELETE", undefined, domain.domain);
                            }}
                          >
                            Unassign
                          </Button>
                        )}
                      </div>
                    ) : domain.assignable && canAssign ? (
                      <div className="flex flex-col gap-2 sm:flex-row">
                        <select
                          aria-label={`Organization for ${domain.domain}`}
                          value={selected[domain.domain] || ""}
                          onChange={(e) =>
                            setSelected((values) => ({
                              ...values,
                              [domain.domain]: e.target.value,
                            }))
                          }
                          className="min-w-0 flex-1 rounded-md border bg-background px-3 py-2 text-sm"
                        >
                          <option value="">Select organization</option>
                          {partners
                            .filter(
                              (p) =>
                                p.isActive &&
                                (!domain.slug || p.slug === domain.slug),
                            )
                            .map((partner) => (
                              <option key={partner.id} value={partner.id}>
                                {partner.name}
                              </option>
                            ))}
                        </select>
                        <Button
                          size="sm"
                          disabled={busy || !selected[domain.domain]}
                          onClick={() =>
                            mutate("PATCH", {
                              domain: domain.domain,
                              partnerId: selected[domain.domain],
                            })
                          }
                        >
                          Assign
                        </Button>
                      </div>
                    ) : (
                      <p className="text-xs text-muted-foreground">
                        {domain.slug
                          ? `Existing tenant routing: /org/${domain.slug}.`
                          : domain.domain.startsWith("*")
                            ? "Wildcard supports slug subdomains; assign exact hosts individually."
                            : "Complete verification and production configuration in Vercel to assign this host."}
                      </p>
                    )}
                  </div>
                ))}
                {!domains.length && !missing.length && (
                  <p className="p-4 text-sm text-muted-foreground">
                    No assignable project domains found.
                  </p>
                )}
              </div>
            )}
            {canCreate && (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  mutate("POST", { slug: slug.trim().toLowerCase() });
                }}
                className="space-y-2 border-t pt-4"
              >
                <label
                  htmlFor="new-tenant-slug"
                  className="text-sm font-medium"
                >
                  Add a subdomain under {base}
                </label>
                <div className="flex flex-col gap-2 sm:flex-row">
                  <Input
                    id="new-tenant-slug"
                    value={slug}
                    onChange={(e) => setSlug(e.target.value)}
                    placeholder="Organization slug"
                    required
                    pattern="[a-z0-9][a-z0-9-]*"
                  />
                  <Button type="submit" disabled={busy}>
                    Add subdomain
                  </Button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
