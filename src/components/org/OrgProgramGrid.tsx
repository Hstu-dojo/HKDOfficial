import { formatCourseFee } from "@/lib/org/settings";
interface Course {
  id: string;
  name: string;
  description: string | null;
  monthlyFee: number | null;
  admissionFee: number | null;
  currency: string;
  isEnrollmentOpen: boolean;
  duration: number;
  sessionsPerWeek: number;
}
export default function OrgProgramGrid({
  courses,
  orgName,
  courseOrigin,
}: {
  courses: Course[];
  orgName: string;
  courseOrigin: string;
}) {
  if (!courses.length) return null;
  return (
    <section id="programs" className="org-section org-container">
      <p className="org-kicker">Training</p>
      <h2 className="org-title">
        Programs at <span className="italic text-primary">{orgName}</span>
      </h2>
      <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
        {courses.map((c) => (
          <article
            key={c.id}
            className="flex min-w-0 flex-col rounded-xl border bg-card p-6"
          >
            <p className="text-xs text-primary">
              {c.isEnrollmentOpen
                ? "Enrollment open"
                : "Enrollment currently closed"}
            </p>
            <h3 className="mt-4 break-words font-serif text-2xl">{c.name}</h3>
            {c.description && (
              <p className="mt-4 whitespace-pre-line text-sm leading-relaxed text-muted-foreground">
                {c.description}
              </p>
            )}
            <dl className="my-6 grid grid-cols-2 gap-4 border-y py-4 text-sm">
              <div>
                <dt className="text-xs text-muted-foreground">Monthly fee</dt>
                <dd className="mt-1 font-medium">
                  {c.monthlyFee == null
                    ? "Members only"
                    : formatCourseFee(c.monthlyFee, c.currency)}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">Admission</dt>
                <dd className="mt-1 font-medium">
                  {c.admissionFee == null
                    ? "Members only"
                    : formatCourseFee(c.admissionFee, c.currency)}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">Duration</dt>
                <dd className="mt-1">{c.duration} months</dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">Sessions</dt>
                <dd className="mt-1">{c.sessionsPerWeek} / week</dd>
              </div>
            </dl>
            <a
              href={`${courseOrigin}/en/karate/courses/${encodeURIComponent(c.id)}`}
              className="mt-auto w-fit border-b border-primary/40 pb-1 text-sm text-primary"
            >
              View course details ↗
            </a>
          </article>
        ))}
      </div>
    </section>
  );
}
