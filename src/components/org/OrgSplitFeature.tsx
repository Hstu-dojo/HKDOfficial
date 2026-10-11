import { OrgImage } from "./OrgImage";
interface Props {
  orgName: string;
  aboutTitle?: string | null;
  aboutText?: string | null;
  missionStatement?: string | null;
  founderName?: string | null;
  founderTitle?: string | null;
  founderBio?: string | null;
  founderImageUrl?: string | null;
  showFounder: boolean;
  features: { icon: string; title: string; description: string }[];
}
export default function OrgSplitFeature(p: Props) {
  return (
    <section id="about" className="org-section border-y bg-muted/30">
      <div className="org-container">
        <div className="grid gap-8 md:grid-cols-2 md:gap-16">
          <div>
            <p className="org-kicker">Our dojo</p>
            <h2 className="org-title">
              {p.aboutTitle || `About ${p.orgName}`}
            </h2>
          </div>
          <div className="space-y-6 self-center text-base leading-relaxed text-muted-foreground">
            {p.aboutText && (
              <p className="whitespace-pre-line">{p.aboutText}</p>
            )}
            {p.missionStatement && (
              <blockquote className="border-l-2 border-primary pl-5 font-serif text-xl text-foreground">
                {p.missionStatement}
              </blockquote>
            )}
          </div>
        </div>
        {p.features.length > 0 && (
          <div className="mt-8 grid gap-6 border-t pt-8 sm:grid-cols-2 lg:grid-cols-3">
            {p.features.map((f, i) => (
              <article key={`${f.title}-${i}`} className="min-w-0">
                {f.icon && (
                  <span aria-hidden="true" className="mb-3 block text-2xl">
                    {f.icon}
                  </span>
                )}
                <h3 className="break-words font-serif text-2xl">{f.title}</h3>
                {f.description && (
                  <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                    {f.description}
                  </p>
                )}
              </article>
            ))}
          </div>
        )}
        {p.showFounder && p.founderName && (
          <article
            className={`mt-12 grid items-center gap-8 border-t pt-12 ${p.founderImageUrl ? "md:grid-cols-[minmax(0,.6fr)_minmax(0,1fr)]" : ""}`}
          >
            {p.founderImageUrl && (
              <div className="relative aspect-[4/5] max-w-md overflow-hidden rounded-xl bg-muted">
                <OrgImage
                  key={p.founderImageUrl}
                  src={p.founderImageUrl}
                  alt={p.founderName}
                  sizes="(max-width:768px) 100vw, 35vw"
                />
              </div>
            )}
            <div className="min-w-0">
              <p className="org-kicker">Meet our instructor</p>
              <h3 className="mt-5 break-words font-serif text-3xl sm:text-4xl">
                {p.founderName}
              </h3>
              {p.founderTitle && (
                <p className="mt-3 text-primary">{p.founderTitle}</p>
              )}
              {p.founderBio && (
                <p className="mt-6 whitespace-pre-line leading-relaxed text-muted-foreground">
                  {p.founderBio}
                </p>
              )}
            </div>
          </article>
        )}
      </div>
    </section>
  );
}
