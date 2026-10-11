export default function OrgCtaBlock({
  ctaText,
  ctaLink,
  orgName,
  email,
  phone,
  location,
}: {
  ctaText?: string | null;
  ctaLink: string;
  orgName: string;
  email?: string | null;
  phone?: string | null;
  location?: string | null;
}) {
  return (
    <section id="contact" className="org-section border-t bg-primary/5">
      <div className="org-container grid gap-8 md:grid-cols-2">
        <div>
          <p className="org-kicker">Start your journey</p>
          <h2 className="org-title">{ctaText || `Join ${orgName}`}</h2>
          <a className="org-button" href={ctaLink}>
            {ctaText || "Join the dojo"} ↗
          </a>
        </div>
        <div className="space-y-5 self-center break-words text-sm">
          {location && (
            <div>
              <p className="text-xs text-muted-foreground">Visit us</p>
              <p className="mt-2 text-base">{location}</p>
            </div>
          )}
          {phone && (
            <div>
              <p className="text-xs text-muted-foreground">Call us</p>
              <a
                className="mt-2 inline-block text-base hover:text-primary"
                href={`tel:${phone.replace(/[^+\d]/g, "")}`}
              >
                {phone}
              </a>
            </div>
          )}
          {email && (
            <div>
              <p className="text-xs text-muted-foreground">Email us</p>
              <a
                className="mt-2 inline-block break-all text-base hover:text-primary"
                href={`mailto:${email}`}
              >
                {email}
              </a>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
