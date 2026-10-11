"use client";
import { useContext, useEffect, useState } from "react";
import { AdminPermissionsContext } from "@/context/AdminPermissionsContext";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from "@/components/ui/alert-dialog";
type Item = {
  id: string;
  displayName: string;
  affiliation: string;
  comment: string;
  rating: number;
  status: "pending" | "approved" | "rejected";
  reviewNote: string;
  updatedAt: string;
};
type Review = {
  item: Item;
  action: "approved" | "rejected" | "pending" | "delete";
};
export default function TestimonialManager() {
  const permissions = useContext(AdminPermissionsContext);
  const can = (action: string) =>
    !!permissions?.permissions.some(
      (p) =>
        p.resource === "TESTIMONIAL" &&
        (p.action === action || p.action === "MANAGE"),
    );
  const [items, setItems] = useState<Item[]>([]),
    [status, setStatus] = useState("pending"),
    [page, setPage] = useState(1),
    [total, setTotal] = useState(0),
    [loading, setLoading] = useState(true),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [reload, setReload] = useState(0),
    [review, setReview] = useState<Review | null>(null),
    [note, setNote] = useState("");
  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError("");
    fetch(`/api/admin/testimonials?status=${status}&page=${page}`, {
      signal: controller.signal,
      cache: "no-store",
    })
      .then(async (res) => {
        if (!res.ok) throw Error("Unable to load testimonials.");
        const data = await res.json();
        setItems(data.items);
        setTotal(data.total);
      })
      .catch((e) => {
        if (!controller.signal.aborted) setError(e.message);
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [status, page, reload]);
  function openReview(item: Item, action: Review["action"]) {
    setNote(item.reviewNote);
    setReview({ item, action });
  }
  async function submitReview() {
    if (!review) return;
    setBusy(true);
    setError("");
    try {
      const res = await fetch(
        `/api/admin/testimonials${review.action === "delete" ? `?id=${review.item.id}` : ""}`,
        {
          method: review.action === "delete" ? "DELETE" : "PATCH",
          headers: { "Content-Type": "application/json" },
          body:
            review.action === "delete"
              ? undefined
              : JSON.stringify({
                  id: review.item.id,
                  status: review.action,
                  reviewNote: note,
                  updatedAt: review.item.updatedAt,
                }),
        },
      );
      const data = await res.json();
      if (!res.ok) throw Error(data.error || "Unable to review testimonial.");
      setReview(null);
      setReload((n) => n + 1);
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "Unable to review testimonial.",
      );
    } finally {
      setBusy(false);
    }
  }
  const actionLabel =
    review?.action === "approved"
      ? "Approve and publish"
      : review?.action === "rejected"
        ? "Reject submission"
        : review?.action === "delete"
          ? "Delete testimonial"
          : "Unpublish testimonial";
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
          Testimonials
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          Review member experiences before they appear on the homepage. Edits
          require a fresh approval.
        </p>
      </div>
      <div className="flex flex-wrap gap-2" aria-label="Filter testimonials">
        {["pending", "approved", "rejected", "all"].map((filter) => (
          <Button
            key={filter}
            variant={filter === status ? "default" : "outline"}
            disabled={busy}
            aria-pressed={filter === status}
            onClick={() => {
              setStatus(filter);
              setPage(1);
            }}
            className="capitalize"
          >
            {filter}
          </Button>
        ))}
      </div>
      {error && (
        <div
          role="alert"
          className="rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm"
        >
          {error}
          <Button
            variant="outline"
            size="sm"
            className="ml-3"
            onClick={() => setReload((n) => n + 1)}
          >
            Retry
          </Button>
        </div>
      )}
      {loading ? (
        <p
          role="status"
          className="rounded-xl border bg-card p-6 text-sm text-muted-foreground"
        >
          Loading testimonials…
        </p>
      ) : !items.length ? (
        <div className="rounded-2xl border bg-card p-8">
          <h2 className="text-lg font-medium">
            No {status === "all" ? "" : status + " "}testimonials
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Members can submit their experience from Dashboard → My testimonial.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 xl:grid-cols-2">
          {items.map((item) => (
            <article
              key={item.id}
              className="flex min-w-0 flex-col rounded-2xl border bg-card p-5 sm:p-6"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <h2 className="break-words text-lg font-semibold">
                    {item.displayName}
                  </h2>
                  {item.affiliation && (
                    <p className="mt-1 break-words text-xs text-muted-foreground">
                      {item.affiliation}
                    </p>
                  )}
                </div>
                <span className="rounded-full bg-primary/10 px-3 py-1 text-xs capitalize text-primary">
                  {item.status}
                </span>
              </div>
              <p className="mt-4 text-xs text-muted-foreground">
                {item.rating} / 5 ·{" "}
                {new Date(item.updatedAt).toLocaleDateString()}
              </p>
              <blockquote className="my-5 whitespace-pre-line break-words text-sm leading-relaxed">
                {item.comment}
              </blockquote>
              {item.reviewNote && (
                <p className="mb-5 text-xs leading-relaxed text-muted-foreground">
                  Feedback: {item.reviewNote}
                </p>
              )}
              <div className="mt-auto flex flex-wrap gap-2 border-t pt-4">
                {can("APPROVE") && (
                  <>
                    {item.status !== "approved" && (
                      <Button
                        size="sm"
                        disabled={busy}
                        onClick={() => openReview(item, "approved")}
                      >
                        Approve
                      </Button>
                    )}
                    {item.status !== "rejected" && (
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={busy}
                        onClick={() => openReview(item, "rejected")}
                      >
                        Reject
                      </Button>
                    )}
                    {item.status === "approved" && (
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={busy}
                        onClick={() => openReview(item, "pending")}
                      >
                        Unpublish
                      </Button>
                    )}
                  </>
                )}
                {can("DELETE") && (
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={busy}
                    onClick={() => openReview(item, "delete")}
                  >
                    Delete
                  </Button>
                )}
                {!can("APPROVE") && !can("DELETE") && (
                  <p className="text-xs text-muted-foreground">
                    Read-only access
                  </p>
                )}
              </div>
            </article>
          ))}
        </div>
      )}
      <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-muted-foreground">
        <span>{total} testimonials</span>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            disabled={page === 1 || busy || loading}
            onClick={() => setPage((p) => p - 1)}
          >
            Previous
          </Button>
          <span>{page}</span>
          <Button
            variant="outline"
            size="sm"
            disabled={page * 20 >= total || busy || loading}
            onClick={() => setPage((p) => p + 1)}
          >
            Next
          </Button>
        </div>
      </div>
      <AlertDialog
        open={!!review}
        onOpenChange={(open) => {
          if (!open && !busy) setReview(null);
        }}
      >
        <AlertDialogContent className="max-h-[85dvh] overflow-y-auto">
          <AlertDialogHeader>
            <AlertDialogTitle>{actionLabel}</AlertDialogTitle>
            <AlertDialogDescription>
              {review?.action === "approved"
                ? "This member’s name and testimonial will appear publicly on the homepage."
                : review?.action === "delete"
                  ? "This removes the submission permanently. The member can submit a new one."
                  : "This testimonial will remain hidden from the homepage."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          {review && (
            <blockquote className="max-h-48 overflow-y-auto whitespace-pre-line break-words rounded-xl border p-4 text-sm leading-relaxed">
              {review.item.comment}
            </blockquote>
          )}
          {review?.action !== "delete" && (
            <div>
              <label
                htmlFor="testimonial-review-note"
                className="mb-2 block text-sm font-medium"
              >
                Feedback to member (optional)
              </label>
              <Textarea
                id="testimonial-review-note"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                maxLength={500}
                rows={3}
                disabled={busy}
              />
            </div>
          )}
          {error && (
            <p role="alert" className="text-sm text-destructive">
              {error}
            </p>
          )}
          <AlertDialogFooter>
            <AlertDialogCancel disabled={busy}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              disabled={busy}
              onClick={(e) => {
                e.preventDefault();
                void submitReview();
              }}
            >
              {busy ? "Saving…" : actionLabel}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
