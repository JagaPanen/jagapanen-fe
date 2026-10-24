import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";

export function GuestBanner({ runsRemaining }: { runsRemaining?: number | null }) {
  return (
    <div className="w-full border-b border-amber-200 bg-amber-50 text-amber-950">
      <div className="mx-auto flex w-full max-w-[1600px] flex-col gap-2 px-3.5 py-2.5 sm:flex-row sm:items-center sm:justify-between sm:px-5">
        <p className="text-xs leading-snug sm:text-[13px]">
          <span className="font-semibold">Mode demo</span> — data contoh, tidak tersimpan ke akun.
          {typeof runsRemaining === "number" ? (
            <>
              {" "}
              Sisa optimasi: <strong>{runsRemaining}</strong>/5.
            </>
          ) : null}
        </p>
        <Button
          asChild
          size="sm"
          className="h-8 shrink-0 bg-emerald-700 text-xs text-white hover:bg-emerald-800"
        >
          <Link to="/signup">Buat akun gratis untuk menyimpan skenario</Link>
        </Button>
      </div>
    </div>
  );
}
