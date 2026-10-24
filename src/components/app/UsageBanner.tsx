import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import type { BillingUsage } from "@/services/api";

export function UsageBanner({ usage }: { usage: BillingUsage | null }) {
  if (!usage) return null;
  if (usage.hard_blocked) {
    return (
      <div className="border-b border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-950 sm:px-5">
        <div className="mx-auto flex max-w-[1600px] flex-wrap items-center justify-between gap-2">
          <p>
            {usage.message ??
              "Kuota optimasi plan Anda sudah penuh. Upgrade untuk lanjut mengoptimasi rute."}
          </p>
          <Button asChild size="sm" className="h-8 bg-emerald-700 text-xs hover:bg-emerald-800">
            <Link to="/app/settings/billing">Upgrade plan</Link>
          </Button>
        </div>
      </div>
    );
  }
  if (usage.soft_warning) {
    const limit = usage.optimize_runs_limit ?? "—";
    return (
      <div className="border-b border-sky-200 bg-sky-50 px-3 py-2 text-xs text-sky-950 sm:px-5">
        <div className="mx-auto flex max-w-[1600px] flex-wrap items-center justify-between gap-2">
          <p>
            Soft limit: {usage.optimize_runs_used}/{limit} run optimasi (
            {Math.round(usage.usage_ratio * 100)}%). Pertimbangkan upgrade ke Pro.
          </p>
          <Link
            to="/app/settings/billing"
            className="font-medium text-emerald-800 underline-offset-2 hover:underline"
          >
            Lihat billing
          </Link>
        </div>
      </div>
    );
  }
  return null;
}
