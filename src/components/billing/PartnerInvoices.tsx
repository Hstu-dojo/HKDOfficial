"use client";
import { useState, useEffect, useCallback } from "react";
import { useRBAC } from "@/hooks/useRBAC";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { businessDate, paisaFromInput } from "@/lib/billing/policy";
type Bill = {
  id: string;
  month: number;
  year: number;
  amount: number;
  currency: string;
  description: string | null;
  status: string;
  dueDate: string | null;
};
export function PartnerInvoices({
  partnerId,
  partnerName,
}: {
  partnerId: string;
  partnerName: string;
}) {
  const { hasPermission } = useRBAC();
  const [bills, setBills] = useState<Bill[]>([]),
    [page, setPage] = useState(1),
    [pages, setPages] = useState(1),
    [error, setError] = useState<string | null>(null),
    [busy, setBusy] = useState(false),
    [loading, setLoading] = useState(false);
  const [month, setMonth] = useState(() => businessDate().month),
    [amount, setAmount] = useState(""),
    [description, setDescription] = useState(""),
    [requestId, setRequestId] = useState("");
  useEffect(() => {
    setRequestId(crypto.randomUUID());
  }, []);
  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const r = await fetch(
          `/api/admin/partner-bills?partnerId=${encodeURIComponent(partnerId)}&page=${page}`,
          { cache: "no-store" },
        ),
        data = await r.json();
      if (!r.ok) throw new Error(data.error);
      setBills(data.bills);
      setPages(data.pagination.totalPages || 1);
    } catch (e) {
      setBills([]);
      setError(e instanceof Error ? e.message : "Could not load invoices");
    } finally {
      setLoading(false);
    }
  }, [partnerId, page]);
  useEffect(() => {
    void load();
  }, [load]);
  const create = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const paisa = paisaFromInput(amount);
      const r = await fetch("/api/admin/partner-bills", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: requestId,
          partnerId,
          billingMonth: month,
          amount: paisa,
          currency: "BDT",
          description,
        }),
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error);
      setRequestId(crypto.randomUUID());
      setAmount("");
      setDescription("");
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not create invoice");
    } finally {
      setBusy(false);
    }
  };
  const change = async (bill: Bill, action: "mark_paid" | "cancel") => {
    const notes = prompt(
      action === "mark_paid"
        ? "Payment reference / notes:"
        : "Cancellation reason:",
    );
    if (!notes?.trim()) return;
    setBusy(true);
    setError(null);
    try {
      const r = await fetch(`/api/admin/partner-bills/${bill.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action, notes }),
        }),
        data = await r.json();
      if (!r.ok) throw new Error(data.error);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not update invoice");
    } finally {
      setBusy(false);
    }
  };
  return (
    <section className="min-w-0 rounded-xl border bg-card p-5 shadow-sm">
      <h2 className="text-lg font-semibold">
        Organization invoices · {partnerName}
      </h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Charges billed to this organization. These invoices are separate from
        students’ monthly training fees.
      </p>
      {hasPermission("PARTNER_BILL", "CREATE") && (
        <form
          onSubmit={create}
          className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4"
        >
          <div className="space-y-1.5">
            <Label htmlFor="invoice-month">Month</Label>
            <Input
              id="invoice-month"
              type="month"
              value={month}
              onChange={(e) => setMonth(e.target.value)}
              required
              disabled={busy}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="invoice-amount">Amount (BDT)</Label>
            <Input
              id="invoice-amount"
              inputMode="decimal"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
              disabled={busy}
              placeholder="0.00"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="invoice-description">Description</Label>
            <Input
              id="invoice-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
              disabled={busy}
            />
          </div>
          <Button
            type="submit"
            className="self-end"
            disabled={busy || !requestId}
          >
            Create invoice
          </Button>
        </form>
      )}
      {error && (
        <p role="alert" className="mt-3 text-sm text-destructive">
          {error}
        </p>
      )}
      {loading ? (
        <p className="mt-4 text-sm text-muted-foreground">Loading invoices…</p>
      ) : (
        <div className="mt-5 overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b text-muted-foreground">
                <th className="p-3 font-medium">Period / description</th>
                <th className="p-3 font-medium">Amount</th>
                <th className="p-3 font-medium">Status</th>
                <th className="p-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {bills.map((b) => (
                <tr key={b.id} className="border-b last:border-0">
                  <td className="min-w-40 p-3">
                    {b.year}-{String(b.month).padStart(2, "0")}
                    <p className="text-xs text-muted-foreground">
                      {b.description}
                    </p>
                  </td>
                  <td className="whitespace-nowrap p-3">
                    {new Intl.NumberFormat("en-BD", {
                      style: "currency",
                      currency: b.currency,
                    }).format(b.amount / 100)}
                  </td>
                  <td className="p-3 capitalize">{b.status}</td>
                  <td className="p-3">
                    <div className="flex gap-2">
                      {["pending", "overdue"].includes(b.status) && (
                        <>
                          {hasPermission("PARTNER_BILL", "VERIFY") && (
                            <Button
                              size="sm"
                              variant="outline"
                              disabled={busy}
                              onClick={() => void change(b, "mark_paid")}
                            >
                              Record payment
                            </Button>
                          )}
                          {hasPermission("PARTNER_BILL", "MANAGE") && (
                            <Button
                              size="sm"
                              variant="outline"
                              disabled={busy}
                              onClick={() => void change(b, "cancel")}
                            >
                              Cancel
                            </Button>
                          )}
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!bills.length && (
            <p className="py-5 text-sm text-muted-foreground">
              No organization invoices recorded.
            </p>
          )}
        </div>
      )}
      <div className="mt-4 flex items-center justify-between gap-3">
        <span className="text-xs text-muted-foreground">
          Page {page} of {pages}
        </span>
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="outline"
            disabled={page <= 1 || loading || busy}
            onClick={() => setPage((p) => p - 1)}
          >
            Previous
          </Button>
          <Button
            size="sm"
            variant="outline"
            disabled={page >= pages || loading || busy}
            onClick={() => setPage((p) => p + 1)}
          >
            Next
          </Button>
        </div>
      </div>
    </section>
  );
}
