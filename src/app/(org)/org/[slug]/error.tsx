"use client";
export default function ErrorPage({
  reset,
}: {
  error: Error;
  reset: () => void;
}) {
  return (
    <main className="org-site">
      <div className="org-container flex min-h-[70svh] flex-col items-start justify-center py-16">
        <p className="org-kicker">Organization website</p>
        <h1 className="org-title">We couldn’t load this dojo.</h1>
        <p className="mb-8 max-w-lg leading-relaxed text-muted-foreground">
          The organization’s content is temporarily unavailable. Please try
          again.
        </p>
        <button type="button" onClick={reset} className="org-button">
          Try again
        </button>
      </div>
    </main>
  );
}
