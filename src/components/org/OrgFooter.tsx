import type { OrgNavLink } from "./OrgHero";
export default function OrgFooter({
  name,
  navLinks,
  socialLinks,
  homeHref,
}: {
  name: string;
  navLinks: OrgNavLink[];
  socialLinks: Record<string, string | null | undefined>;
  homeHref: string;
}) {
  const socials = Object.entries(socialLinks).filter(
    (entry): entry is [string, string] => !!entry[1],
  );
  return (
    <footer data-site-footer className="border-t bg-card">
      <div className="org-container space-y-8 py-10">
        <div className="grid gap-8 md:grid-cols-3">
          <div>
            <a href={homeHref} className="break-words font-serif text-2xl">
              {name}
            </a>
            <p className="mt-4 text-sm text-muted-foreground">
              Discipline. Respect. Progress.
            </p>
          </div>
          <nav
            aria-label="Footer navigation"
            className="flex flex-wrap content-start gap-x-5 gap-y-4"
          >
            {navLinks.map((l) => (
              <a
                key={l.href}
                href={l.href}
                className="text-sm text-muted-foreground hover:text-primary"
              >
                {l.label}
              </a>
            ))}
          </nav>
          <div className="flex flex-wrap content-start gap-4">
            {socials.map(([label, url]) => (
              <a
                key={label}
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm capitalize text-muted-foreground hover:text-primary"
              >
                {label} ↗
              </a>
            ))}
            <a
              href="/partner-admin"
              className="text-sm text-muted-foreground hover:text-primary"
            >
              Partner portal ↗
            </a>
          </div>
        </div>
        <p className="border-t pt-6 text-xs text-muted-foreground">
          © {new Date().getUTCFullYear()} {name}
        </p>
      </div>
    </footer>
  );
}
