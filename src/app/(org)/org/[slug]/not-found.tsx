import { siteOrigin } from "@/lib/seo/site";
export default function NotFound() {
  return (
    <main className="org-site">
      <div className="org-container flex min-h-[70svh] flex-col items-start justify-center py-16">
        <p className="org-kicker">Organization website</p>
        <h1 className="org-title">This dojo is unavailable.</h1>
        <p className="mb-8 max-w-lg leading-relaxed text-muted-foreground">
          The organization may be inactive, or this address may be incorrect.
        </p>
        <a className="org-button" href={`${siteOrigin()}/en/org`}>
          Explore academy branches ↗
        </a>
      </div>
    </main>
  );
}
