import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/app/catalog")({
  head: () => ({ meta: [{ title: "Katalog — JagaPanen App" }] }),
  component: CatalogStub,
});

function CatalogStub() {
  return (
    <main className="mx-auto w-full max-w-[900px] flex-1 px-3.5 py-10 sm:px-5">
      <h1 className="text-xl font-semibold text-zinc-900">Katalog komoditas</h1>
      <p className="mt-2 max-w-lg text-sm text-zinc-500">
        Stub P2 — editor katalog A–E per org menyusul. Guest tetap read-only di /demo.
      </p>
      <Button asChild className="mt-6 bg-emerald-700 hover:bg-emerald-800">
        <Link to="/app/scenarios">Kembali ke skenario</Link>
      </Button>
    </main>
  );
}
