"use client";
import { useEffect, useState } from "react";
import { useCurrentLocale } from "@/locales/client";
import { testimonialCopy, testimonialLocale } from "@/lib/testimonials/copy";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from "@/components/ui/alert-dialog";
type Item = {
  comment: string;
  affiliation: string;
  rating: number;
  status: "pending" | "approved" | "rejected";
  reviewNote: string;
};
export default function MemberTestimonial() {
  const locale = testimonialLocale(useCurrentLocale()),
    t = testimonialCopy[locale];
  const [item, setItem] = useState<Item | null>(null),
    [comment, setComment] = useState(""),
    [affiliation, setAffiliation] = useState(""),
    [rating, setRating] = useState(5),
    [loadFailed, setLoadFailed] = useState(false),
    [reload, setReload] = useState(0),
    [loading, setLoading] = useState(true),
    [busy, setBusy] = useState(false),
    [message, setMessage] = useState("");
  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setLoadFailed(false);
    fetch("/api/testimonials", { signal: controller.signal, cache: "no-store" })
      .then(async (res) => {
        if (!res.ok) throw Error();
        const data = await res.json();
        setItem(data.testimonial);
        if (data.testimonial) {
          setComment(data.testimonial.comment);
          setAffiliation(data.testimonial.affiliation);
          setRating(data.testimonial.rating);
        }
      })
      .catch(() => {
        if (!controller.signal.aborted) {
          setMessage(t.error);
          setLoadFailed(true);
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [t.error, reload]);
  async function save(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setMessage("");
    try {
      const res = await fetch("/api/testimonials", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ comment, affiliation, rating }),
      });
      if (!res.ok) throw Error();
      setItem((await res.json()).testimonial);
      setMessage(t.saved);
    } catch {
      setMessage(t.error);
    } finally {
      setBusy(false);
    }
  }
  async function withdraw() {
    setBusy(true);
    try {
      const res = await fetch("/api/testimonials", { method: "DELETE" });
      if (!res.ok) throw Error();
      setItem(null);
      setComment("");
      setAffiliation("");
      setRating(5);
      setMessage(t.withdrawn);
    } catch {
      setMessage(t.error);
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
          {t.title}
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">
          {t.description}
        </p>
      </div>
      {message && (
        <p role="status" className="rounded-xl border bg-card p-4 text-sm">
          {message}
        </p>
      )}
      {loading ? (
        <p
          role="status"
          className="rounded-xl border bg-card p-6 text-sm text-muted-foreground"
        >
          {t.loading}
        </p>
      ) : loadFailed ? (
        <Button variant="outline" onClick={() => setReload((n) => n + 1)}>
          {t.retry}
        </Button>
      ) : (
        <form
          onSubmit={save}
          className="space-y-5 rounded-2xl border bg-card p-5 sm:p-7"
        >
          {item && (
            <div className="border-b pb-4">
              <span className="rounded-full bg-primary/10 px-3 py-1 text-xs text-primary">
                {t[item.status]}
              </span>
              {item.reviewNote && (
                <p className="mt-3 text-sm text-muted-foreground">
                  {t.reviewNote}: {item.reviewNote}
                </p>
              )}
            </div>
          )}
          <fieldset disabled={busy} className="space-y-5">
            <div>
              <label
                htmlFor="testimonial-rating"
                className="mb-2 block text-sm font-medium"
              >
                {t.rating}
              </label>
              <select
                id="testimonial-rating"
                value={rating}
                onChange={(e) => setRating(Number(e.target.value))}
                className="h-11 rounded-lg border bg-background px-3 text-sm"
              >
                {[5, 4, 3, 2, 1].map((n) => (
                  <option key={n} value={n}>
                    {new Intl.NumberFormat(locale).format(n)} / 5
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label
                htmlFor="testimonial-affiliation"
                className="mb-2 block text-sm font-medium"
              >
                {t.affiliation}
              </label>
              <Input
                id="testimonial-affiliation"
                value={affiliation}
                onChange={(e) => setAffiliation(e.target.value)}
                maxLength={80}
                placeholder={t.affiliationHint}
              />
            </div>
            <div>
              <label
                htmlFor="testimonial-comment"
                className="mb-2 block text-sm font-medium"
              >
                {t.comment}
              </label>
              <Textarea
                id="testimonial-comment"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                required
                minLength={20}
                maxLength={1200}
                rows={7}
                className="resize-y"
                aria-describedby="testimonial-privacy"
              />
              <p className="mt-2 text-right text-xs text-muted-foreground">
                {comment.length} / 1200
              </p>
            </div>
            <p
              id="testimonial-privacy"
              className="text-xs leading-relaxed text-muted-foreground"
            >
              {t.privacy}
            </p>
            {item?.status === "approved" && (
              <p className="text-xs leading-relaxed text-muted-foreground">
                {t.editHint}
              </p>
            )}
            <div className="flex flex-wrap gap-3">
              <Button
                type="submit"
                disabled={busy || comment.trim().length < 20}
              >
                {busy ? t.saving : item ? t.update : t.submit}
              </Button>
              {item && (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button type="button" variant="outline" disabled={busy}>
                      {t.withdraw}
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>{t.withdraw}</AlertDialogTitle>
                      <AlertDialogDescription>
                        {t.withdrawConfirm}
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>{t.cancel}</AlertDialogCancel>
                      <AlertDialogAction onClick={withdraw}>
                        {t.withdraw}
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )}
            </div>
          </fieldset>
        </form>
      )}
    </div>
  );
}
