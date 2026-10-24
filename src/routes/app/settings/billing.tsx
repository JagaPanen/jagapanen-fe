import { useCallback, useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import {
  confirmBillingWebhook,
  getBillingUsage,
  startBillingCheckout,
  type BillingUsage,
} from "@/services/api";
import { toast } from "sonner";

type BillingSearch = {
  plan?: string;
  external_id?: string;
  checkout?: string;
};

export const Route = createFileRoute("/app/settings/billing")({
  validateSearch: (search: Record<string, unknown>): BillingSearch => {
    const out: BillingSearch = {};
    if (typeof search["plan"] === "string") out.plan = search["plan"];
    if (typeof search["external_id"] === "string") out.external_id = search["external_id"];
    if (typeof search["checkout"] === "string") out.checkout = search["checkout"];
    return out;
  },
  head: () => ({ meta: [{ title: "Billing — JagaPanen" }] }),
  component: BillingPage,
});

function BillingPage() {
  const search = Route.useSearch();
  const [usage, setUsage] = useState<BillingUsage | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setUsage(await getBillingUsage());
    } catch (e) {
      toast.error("Gagal memuat usage", {
        description: e instanceof Error ? e.message : String(e),
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (search.checkout !== "pending" || !search.external_id) return;
    let cancelled = false;
    (async () => {
      try {
        await confirmBillingWebhook(search.external_id!);
        if (!cancelled) {
          toast.success("Pembayaran stub dikonfirmasi");
          await load();
        }
      } catch (e) {
        if (!cancelled) {
          toast.message("Webhook stub", {
            description: e instanceof Error ? e.message : String(e),
          });
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [search.checkout, search.external_id, load]);

  const onCheckoutPro = async (activateStub: boolean) => {
    setBusy(true);
    try {
      const res = await startBillingCheckout("pro", activateStub);
      toast.success(activateStub ? "Plan Pro aktif" : "Checkout stub dibuat", {
        description: res.message,
      });
      await load();
    } catch (e) {
      toast.error("Checkout gagal", {
        description: e instanceof Error ? e.message : String(e),
      });
    } finally {
      setBusy(false);
    }
  };

  const limitLabel = usage?.optimize_runs_limit == null ? "∞" : String(usage.optimize_runs_limit);
  const pct = usage ? Math.round(usage.usage_ratio * 100) : 0;

  return (
    <div className="mx-auto w-full max-w-3xl px-3.5 py-6 sm:px-5">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-zinc-900">Billing & usage</h1>
          <p className="text-sm text-zinc-500">
            Meter run optimasi untuk plan Basic / Pro (checkout stub Xendit).
          </p>
        </div>
        <Button asChild variant="outline" size="sm" className="h-8 text-xs">
          <Link to="/app/scenarios">Kembali</Link>
        </Button>
      </div>

      <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
        <h2 className="text-sm font-semibold text-zinc-800">Usage panel</h2>
        {loading || !usage ? (
          <p className="mt-3 text-sm text-zinc-500">Memuat…</p>
        ) : (
          <div className="mt-3 space-y-3 text-sm">
            <div className="flex flex-wrap gap-x-6 gap-y-1 text-zinc-700">
              <span>
                Plan: <strong className="capitalize">{usage.plan}</strong>
              </span>
              <span>
                Period: <code className="text-xs">{usage.period_key}</code>
              </span>
              <span>
                Runs:{" "}
                <strong>
                  {usage.optimize_runs_used}/{limitLabel}
                </strong>{" "}
                ({pct}%)
              </span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-slate-100">
              <div
                className={
                  usage.hard_blocked
                    ? "h-full bg-amber-500"
                    : usage.soft_warning
                      ? "h-full bg-sky-500"
                      : "h-full bg-emerald-600"
                }
                style={{ width: `${Math.min(100, pct)}%` }}
              />
            </div>
            {usage.message ? (
              <p className="rounded-md bg-amber-50 px-3 py-2 text-xs text-amber-950">
                {usage.message}
              </p>
            ) : null}
          </div>
        )}
      </section>

      <section className="mt-4 rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
        <h2 className="text-sm font-semibold text-zinc-800">Upgrade ke Pro</h2>
        <p className="mt-1 text-xs text-zinc-500">
          Basic gratis dengan kuota bulanan. Pro menaikkan limit run. Mode stub: aktivasi langsung.
        </p>
        <div className="mt-4 max-w-md rounded-md border border-slate-200 p-3">
          <p className="text-sm font-medium">Pro</p>
          <p className="mt-1 text-xs text-zinc-500">
            2.000 run / bulan · full dashboard · prioritas support
          </p>
          <Button
            className="mt-3 h-8 w-full bg-emerald-700 text-xs hover:bg-emerald-800"
            disabled={busy || usage?.plan === "pro"}
            onClick={() => void onCheckoutPro(true)}
          >
            {busy ? "Memproses…" : usage?.plan === "pro" ? "Sudah Pro" : "Aktifkan Pro (stub)"}
          </Button>
        </div>
      </section>
    </div>
  );
}
