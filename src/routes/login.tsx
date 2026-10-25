import { useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { login } from "@/services/api";
import { toast } from "sonner";

export const Route = createFileRoute("/login")({
  head: () => ({ meta: [{ title: "Masuk — Panenlink" }] }),
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      await login({ email: email.trim(), password });
      toast.success("Berhasil masuk");
      await navigate({ to: "/app/scenarios" });
    } catch (err) {
      toast.error("Gagal masuk", {
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
          <img src="/favicon.svg" alt="Panenlink" className="h-8 w-auto" />
          <span className="text-xl font-bold tracking-tight text-slate-900">Panenlink</span>
        </Link>
        <h1 className="text-xl font-semibold text-zinc-900">Masuk ke workspace</h1>
        <p className="mt-1 text-sm text-zinc-500">Gunakan akun organisasi (bukan guest demo).</p>
        <form onSubmit={onSubmit} className="mt-6 space-y-3">
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
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <Button
            type="submit"
            disabled={busy}
            className="w-full bg-emerald-700 hover:bg-emerald-800"
          >
            {busy ? "Masuk..." : "Masuk"}
          </Button>
        </form>
        <p className="mt-4 text-center text-xs text-zinc-500">
          Belum punya akun?{" "}
          <Link to="/signup" className="font-medium text-emerald-700 hover:underline">
            Daftar
          </Link>
        </p>
      </div>
    </div>
  );
}
