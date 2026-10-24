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
    reason === "export" ? "Ekspor tersedia untuk akun organisasi" : "Kuota demo sudah habis";
  const body =
    reason === "export"
      ? "Laporan keputusan (PDF/CSV) hanya untuk workspace berbayar atau trial org. Buat akun untuk menyimpan skenario dan mengunduh laporan."
      : "Anda sudah memakai 5/5 run optimasi di mode guest. Daftar gratis untuk lanjut merencanakan di workspace koperasi Anda.";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription className="text-sm leading-relaxed">{body}</DialogDescription>
        </DialogHeader>
        <DialogFooter className="flex-col gap-2 sm:flex-row sm:justify-end">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="w-full sm:w-auto"
          >
            Nanti saja
          </Button>
          <Button asChild className="w-full bg-emerald-700 hover:bg-emerald-800 sm:w-auto">
            <Link to="/signup">Buat akun gratis</Link>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
