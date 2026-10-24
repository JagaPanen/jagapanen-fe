import { Link } from "@tanstack/react-router";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

export function ConvertToSignupModal({
  open,
  onOpenChange,
  reason = "limit",
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  reason?: "limit" | "export";
}) {
  const title =
    reason === "export" ? "Ekspor untuk akun berbayar / Pilot" : "Kuota demo guest habis";
  const body =
    reason === "export"
      ? "PDF/CSV decision report tersedia setelah daftar: mulai Free Pilot (14 hari, 25 run), lalu lanjut Starter atau Fleet saat koperasi Anda siap skala."
      : "Guest gratis 5 run di data contoh. Lanjut dengan Free Pilot (uji coba 14 hari), lalu upgrade ke Starter (200 run/bulan) atau Fleet (1.000 run/bulan) — tanpa marketplace atau harga komoditas dinamis.";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription className="text-sm leading-relaxed">{body}</DialogDescription>
        </DialogHeader>
        <ul className="space-y-1.5 text-xs text-zinc-600">
          <li>
            <strong>Pilot</strong> — workspace org terbatas waktu
          </li>
          <li>
            <strong>Starter</strong> — skenario harian + ekspor laporan
          </li>
          <li>
            <strong>Fleet</strong> — kapasitas run & armada lebih besar
          </li>
        </ul>
        <DialogFooter className="flex-col gap-2 sm:flex-row sm:justify-end">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="w-full sm:w-auto"
          >
            Nanti saja
          </Button>
          <Button asChild className="w-full bg-emerald-700 hover:bg-emerald-800 sm:w-auto">
            <Link to="/signup" search={{ plan: "pilot" }}>
              Mulai Free Pilot
            </Link>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
