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
  const title = reason === "export" ? "Ekspor untuk akun organisasi" : "Kuota demo guest habis";
  const body =
    reason === "export"
      ? "PDF/CSV decision report tersedia setelah daftar: mulai Basic (gratis, 50 run/bulan), lalu upgrade ke Pro saat koperasi Anda siap skala."
      : "Guest gratis 5 run di data contoh. Lanjut dengan Basic (workspace org, 50 run/bulan), lalu upgrade ke Pro (2.000 run/bulan) bila perlu.";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription className="text-sm leading-relaxed">{body}</DialogDescription>
        </DialogHeader>
        <ul className="space-y-1.5 text-xs text-zinc-600">
          <li>
            <strong>Basic</strong> — workspace org gratis dengan kuota bulanan
          </li>
          <li>
            <strong>Pro</strong> — kuota run lebih besar + full dashboard
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
            <Link to="/signup" search={{ plan: "basic" }}>
              Daftar Basic
            </Link>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
