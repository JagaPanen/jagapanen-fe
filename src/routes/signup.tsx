import { useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { signup } from "@/services/api";
import { toast } from "sonner";

type SignupPlan = "starter" | "fleet" | "pilot" | "enterprise";
type SignupSearch = { plan?: SignupPlan };

export const Route = createFileRoute("/signup")({
  validateSearch: (search: Record<string, unknown>): SignupSearch => {
    const raw = typeof search["plan"] === "string" ? search["plan"].toLowerCase() : undefined;
    if (raw === "starter" || raw === "fleet" || raw === "pilot" || raw === "enterprise") {
      return { plan: raw };
    }
    return {};
  },
  head: () => ({ meta: [{ title: "Daftar — JagaPanen" }] }),
  component: SignupPage,
});

function SignupPage() {
  const navigate = useNavigate();
  const { plan = "pilot" } = Route.useSearch();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [orgName, setOrgName] = useState("");
  const [busy, setBusy] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      const trimmedName = fullName.trim();
      await signup({
        email: email.trim(),
        password,
        organization_name: orgName.trim() || "Organisasi Saya",
        ...(trimmedName ? { full_name: trimmedName } : {}),
      });
      toast.success("Akun Pilot dibuat");
      if (plan === "starter" || plan === "fleet") {
        await navigate({ to: "/app/settings/billing", search: { plan } });
      } else {
        await navigate({ to: "/app/scenarios" });
      }
    } catch (err) {
      toast.error("Gagal daftar", {
        description: err instanceof Error ? err.message : String(err),
      });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex min-h-[100dvh] items-center justify-center bg-slate-50 px-4 py-10">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <Link to="/" className="mb-4 inline-flex items-center gap-2">
          <img src="/logo.png" alt="JagaPanen" className="h-8 w-auto" />
        </Link>
        <h1 className="text-xl font-semibold text-zinc-900">Buat akun organisasi</h1>
        <p className="mt-1 text-sm text-zinc-500">
          Memulai <strong className="capitalize">{plan}</strong> — setelah daftar Anda masuk ke
          workspace <code className="text-xs">/app</code>
          {plan === "starter" || plan === "fleet" ? " lalu checkout di Billing" : ""}.
        </p>
        <form onSubmit={onSubmit} className="mt-6 space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="org">Nama koperasi / organisasi</Label>
            <Input
              id="org"
              value={orgName}
              onChange={(e) => setOrgName(e.target.value)}
              required
              placeholder="Koperasi Tani Maju"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="name">Nama lengkap</Label>
            <Input
              id="name"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Opsional"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8}
            />
          </div>
          <Button
            type="submit"
            disabled={busy}
            className="w-full bg-emerald-700 hover:bg-emerald-800"
          >
            {busy ? "Mendaftar..." : "Daftar & masuk ke /app"}
          </Button>
        </form>
        <p className="mt-4 text-center text-xs text-zinc-500">
          Sudah punya akun?{" "}
          <Link to="/login" className="font-medium text-emerald-700 hover:underline">
            Masuk
          </Link>
          {" · "}
          <Link
            to="/demo"
            search={{ tab: "comparison" }}
            className="font-medium text-emerald-700 hover:underline"
          >
            Coba demo dulu
          </Link>
        </p>
      </div>
    </div>
  );
}
