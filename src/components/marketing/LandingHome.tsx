import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { ArrowRight, Check, Leaf, Route, Shield } from "lucide-react";

const PREVIEW_STEPS = [
  "Hitung risiko A-E",
  "Preview truk feasible",
  "Bandingkan baseline vs spoilage",
];

const HOW_STEPS = [
  "Input panen hari ini",
  "Skor spoilage API",
  "Pilih truk feasible",
  "Komparasi dan jalankan",
];

const PRICING = [
  {
    name: "Guest",
    price: "Gratis",
    blurb: "Coba planner asli, 5 run optimasi, data contoh.",
    demo: true,
    label: "Coba demo",
    highlight: false,
  },
  {
    name: "Pilot",
    price: "Gratis 14 hari",
    blurb: "1 seat · 25 run optimasi · laporan ber-watermark.",
    demo: false,
    plan: "pilot" as const,
    label: "Mulai Pilot",
    highlight: true,
  },
  {
    name: "Starter",
    price: "IDR 499rb/bln",
    blurb: "3 seats · 5 kendaraan · 200 run/bulan · PDF export.",
    demo: false,
    plan: "starter" as const,
    label: "Daftar → Starter",
    highlight: false,
  },
  {
    name: "Fleet",
    price: "IDR 1,5jt/bln",
    blurb: "10 seats · 25 kendaraan · 1.000 run/bulan.",
    demo: false,
    plan: "fleet" as const,
    label: "Daftar → Fleet",
    highlight: false,
  },
  {
    name: "Enterprise",
    price: "Custom",
    blurb: "SSO, SLA, integrasi fleet dan ERP sesuai kebutuhan.",
    demo: false,
    plan: "enterprise" as const,
    label: "Bicara sales",
    highlight: false,
  },
];

const FAQ = [
  {
    q: "Apa bedanya demo guest dengan akun organisasi?",
    a: "Guest memakai data contoh terisolasi dengan batas 5 run. Akun org punya workspace sendiri, skenario tersimpan, dan nanti ekspor laporan.",
  },
  {
    q: "Apakah JagaPanen mengganti GPS / TMS kami?",
    a: "Tidak. JagaPanen adalah decision-support spoilage-aware di atas data panen dan armada yang Anda sudah punya.",
  },
  {
    q: "Bagaimana skor risiko dihitung?",
    a: "Rule-based dari kelas perishability A-E, jam sejak panen, handling factor, dan shelf life — bukan ML black-box.",
  },
  {
    q: "Apakah butuh dataset nasional?",
    a: "Tidak. Cukup input panen hari ini dan daftar kendaraan aktif koperasi Anda.",
  },
];

const display = { fontFamily: "var(--jp-display)" } as const;

export function LandingPage() {
  const [spoilageAware, setSpoilageAware] = useState(true);

  return (
    <div className="jp-landing min-h-screen text-(--jp-ink)">
      <header className="absolute inset-x-0 top-0 z-20">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6">
          <Link to="/" className="flex items-center gap-2">
            <img src="/logo.png" alt="" className="h-9 w-auto object-contain sm:h-10" />
            <span
              className="text-xl font-semibold tracking-tight text-white drop-shadow-sm sm:text-2xl"
              style={display}
            >
              JagaPanen
            </span>
          </Link>
          <nav className="flex items-center gap-2 sm:gap-3">
            <Button
              asChild
              variant="ghost"
              size="sm"
              className="hidden text-white hover:bg-white/10 hover:text-white sm:inline-flex"
            >
              <Link to="/login">Masuk</Link>
            </Button>
            <Button
              asChild
              size="sm"
              className="bg-(--jp-leaf) text-white hover:bg-(--jp-leaf-deep)"
            >
              <Link to="/signup">Buat akun</Link>
            </Button>
          </nav>
        </div>
      </header>

      <section className="relative isolate flex min-h-[100dvh] flex-col justify-end overflow-hidden pb-16 pt-28 sm:pb-24 sm:pt-32">
        <div
          className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_20%_20%,#1a4d36_0%,transparent_55%),radial-gradient(ellipse_at_80%_60%,#0f2a1c_0%,#07150f_70%)]"
          aria-hidden
        />
        <div className="mx-auto w-full max-w-6xl px-4 sm:px-6">
          <p
            className="text-5xl font-semibold leading-[0.95] tracking-tight text-white sm:text-7xl md:text-8xl"
            style={display}
          >
            JagaPanen
          </p>
          <h1 className="mt-5 max-w-xl text-lg font-medium leading-snug text-emerald-50/95 sm:text-2xl">
            Jangan kirim rute terdekat dulu — kirim rute yang melindungi nilai panen mudah rusak.
          </h1>
          <p className="mt-3 max-w-lg text-sm text-emerald-100/75 sm:text-base">
            Decision-support spoilage-aware untuk koperasi dan armada kolektor.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button
              asChild
              size="lg"
              className="bg-(--jp-sun) font-semibold text-(--jp-ink) shadow-lg shadow-black/20 hover:bg-[#e8c56a]"
            >
              <Link to="/demo" search={{ tab: "comparison" }}>
                Coba demo gratis <ArrowRight className="ml-1.5 h-4 w-4" />
              </Link>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="border-white/40 bg-white/5 text-white hover:bg-white/15 hover:text-white"
            >
              <Link to="/signup">Buat akun</Link>
            </Button>
          </div>
        </div>
      </section>

      <section className="border-b border-(--jp-line) bg-(--jp-paper) px-4 py-16 sm:px-6 sm:py-20">
        <div className="mx-auto max-w-6xl">
          <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl" style={display}>
            Preview planner
          </h2>
          <p className="mt-2 max-w-2xl text-(--jp-muted)">
            Alur yang sama dengan demo: panen, skor risiko, kelayakan armada, optimasi.
          </p>
          <div className="mt-8 overflow-hidden rounded-2xl border border-(--jp-line) bg-white shadow-[0_20px_50px_-28px_rgba(15,42,28,0.45)]">
            <div className="flex items-center gap-2 border-b border-(--jp-line) bg-[#f3f7f4] px-4 py-2.5 text-[11px] text-(--jp-muted)">
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              /demo · Guest Demo
            </div>
            <div className="grid gap-0 md:grid-cols-3">
              {PREVIEW_STEPS.map((step, i) => (
                <div key={step} className="border-(--jp-line) p-5 md:border-r md:last:border-r-0">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-(--jp-leaf)">
                    Langkah {i + 1}
                  </p>
                  <p className="mt-2 text-sm font-medium text-(--jp-ink)">{step}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="border-b border-(--jp-line) bg-[#eef4ef] px-4 py-16 sm:px-6 sm:py-20">
        <div className="mx-auto max-w-6xl">
          <h2 className="text-3xl font-semibold sm:text-4xl" style={display}>
            Masalah di lapangan
          </h2>
          <p className="mt-2 max-w-2xl text-(--jp-muted)">
            Rute terpendek sering mengorbankan kelas A/B — kerugian diam-diam di bak truk.
          </p>
          <ul className="mt-8 grid gap-4 sm:grid-cols-3">
            <li className="rounded-xl bg-white/80 p-5 ring-1 ring-(--jp-line)">
              <Leaf className="h-5 w-5 text-(--jp-leaf)" />
              <p className="mt-3 font-semibold">Panen rentan</p>
              <p className="mt-1 text-sm text-(--jp-muted)">
                Tomat dan daun hijau kehabisan jendela kualitas sebelum sampai pasar.
              </p>
            </li>
            <li className="rounded-xl bg-white/80 p-5 ring-1 ring-(--jp-line)">
              <Route className="h-5 w-5 text-(--jp-leaf)" />
              <p className="mt-3 font-semibold">Rute bukan selalu terbaik</p>
              <p className="mt-1 text-sm text-(--jp-muted)">
                Dispatcher mengutamakan km, bukan sisa shelf life.
              </p>
            </li>
            <li className="rounded-xl bg-white/80 p-5 ring-1 ring-(--jp-line)">
              <Shield className="h-5 w-5 text-(--jp-leaf)" />
              <p className="mt-3 font-semibold">Sulit dibuktikan</p>
              <p className="mt-1 text-sm text-(--jp-muted)">
                Tanpa komparasi baseline vs spoilage-aware, keputusan sulit dipertanggungjawabkan.
              </p>
            </li>
          </ul>
        </div>
      </section>

      <section className="border-b border-(--jp-line) bg-(--jp-paper) px-4 py-16 sm:px-6 sm:py-20">
        <div className="mx-auto max-w-6xl">
          <h2 className="text-3xl font-semibold sm:text-4xl" style={display}>
            Cara kerja
          </h2>
          <ol className="mt-8 grid gap-6 sm:grid-cols-4">
            {HOW_STEPS.map((label, i) => (
              <li key={label}>
                <span className="text-4xl font-semibold text-(--jp-leaf)/30" style={display}>
                  {String(i + 1).padStart(2, "0")}
                </span>
                <p className="mt-2 text-sm font-medium">{label}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="border-b border-(--jp-line) bg-[#0f2a1c] px-4 py-16 text-emerald-50 sm:px-6 sm:py-20">
        <div className="mx-auto max-w-6xl">
          <h2 className="text-3xl font-semibold sm:text-4xl" style={display}>
            Teaser rute
          </h2>
          <p className="mt-2 max-w-xl text-emerald-100/70">
            Alihkan antara baseline jarak-pendek dan spoilage-aware sebelum membuka demo penuh.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => setSpoilageAware(false)}
              className={
                !spoilageAware
                  ? "rounded-lg bg-white px-4 py-2 text-sm font-medium text-(--jp-ink)"
                  : "rounded-lg bg-white/10 px-4 py-2 text-sm font-medium text-emerald-100"
              }
            >
              Baseline (km)
            </button>
            <button
              type="button"
              onClick={() => setSpoilageAware(true)}
              className={
                spoilageAware
                  ? "rounded-lg bg-(--jp-sun) px-4 py-2 text-sm font-medium text-(--jp-ink)"
                  : "rounded-lg bg-white/10 px-4 py-2 text-sm font-medium text-emerald-100"
              }
            >
              Spoilage-aware
            </button>
          </div>
          <div className="mt-6 h-40 overflow-hidden rounded-xl bg-[#07150f] ring-1 ring-white/10">
            <svg viewBox="0 0 400 160" className="h-full w-full" aria-hidden>
              <circle cx="40" cy="80" r="8" fill="#6ee7b7" />
              <circle cx="360" cy="80" r="8" fill="#fbbf24" />
              {spoilageAware ? (
                <path
                  d="M48 80 C 120 20, 200 140, 280 50 S 340 90, 352 80"
                  fill="none"
                  stroke="#34d399"
                  strokeWidth="4"
                />
              ) : (
                <path
                  d="M48 80 L 352 80"
                  fill="none"
                  stroke="#94a3b8"
                  strokeWidth="4"
                  strokeDasharray="8 6"
                />
              )}
              <text x="200" y="140" textAnchor="middle" fill="#a7f3d0" fontSize="12">
                {spoilageAware
                  ? "Detour kecil · risiko spoilage turun"
                  : "Lurus · kelas A menunggu lebih lama"}
              </text>
            </svg>
          </div>
        </div>
      </section>

      <section className="border-b border-(--jp-line) bg-(--jp-paper) px-4 py-16 sm:px-6 sm:py-20">
        <div className="mx-auto max-w-6xl">
          <h2 className="text-3xl font-semibold sm:text-4xl" style={display}>
            Bukti arah produk
          </h2>
          <p className="mt-2 max-w-2xl text-(--jp-muted)">
            Dibangun di atas stack SOW yang sudah live: risk score, feasibility preview, dan
            komparasi baseline vs spoilage-aware.
          </p>
          <div className="mt-8 grid gap-4 sm:grid-cols-3">
            <div className="rounded-xl border border-(--jp-line) bg-white p-5">
              <p className="font-semibold text-(--jp-leaf-deep)">Rule-based</p>
              <p className="mt-1 text-sm text-(--jp-muted)">Tanpa ketergantungan ML untuk MVP</p>
            </div>
            <div className="rounded-xl border border-(--jp-line) bg-white p-5">
              <p className="font-semibold text-(--jp-leaf-deep)">Multi-tenant ready</p>
              <p className="mt-1 text-sm text-(--jp-muted)">Org JWT + guest sandbox terpisah</p>
            </div>
            <div className="rounded-xl border border-(--jp-line) bg-white p-5">
              <p className="font-semibold text-(--jp-leaf-deep)">Operator-first</p>
              <p className="mt-1 text-sm text-(--jp-muted)">
                Input panen dan armada yang sudah ada
              </p>
            </div>
          </div>
        </div>
      </section>

      <section
        id="pricing"
        className="border-b border-(--jp-line) bg-[#eef4ef] px-4 py-16 sm:px-6 sm:py-20"
      >
        <div className="mx-auto max-w-6xl">
          <h2 className="text-3xl font-semibold sm:text-4xl" style={display}>
            Harga sederhana
          </h2>
          <p className="mt-2 text-(--jp-muted)">Guest, Pilot, Starter, Fleet, Enterprise.</p>
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            {PRICING.map((plan) => (
              <div
                key={plan.name}
                className={
                  plan.highlight
                    ? "flex flex-col rounded-xl border border-(--jp-leaf) bg-white p-4 shadow-md ring-1 ring-(--jp-leaf)/30"
                    : "flex flex-col rounded-xl border border-(--jp-line) bg-white/90 p-4"
                }
              >
                <p className="text-xs font-semibold uppercase tracking-wide text-(--jp-leaf)">
                  {plan.name}
                </p>
                <p className="mt-2 text-xl font-semibold" style={display}>
                  {plan.price}
                </p>
                <p className="mt-2 flex-1 text-xs text-(--jp-muted)">{plan.blurb}</p>
                <Button
                  asChild
                  size="sm"
                  className={
                    plan.highlight
                      ? "mt-4 w-full bg-(--jp-leaf) hover:bg-(--jp-leaf-deep)"
                      : "mt-4 w-full bg-(--jp-ink) hover:bg-black"
                  }
                >
                  {plan.demo ? (
                    <Link to="/demo" search={{ tab: "comparison" }}>
                      {plan.label}
                    </Link>
                  ) : "plan" in plan && plan.plan === "enterprise" ? (
                    <a href="mailto:sales@jagapanen.id?subject=JagaPanen%20Enterprise">
                      {plan.label}
                    </a>
                  ) : (
                    <Link to="/signup" search={{ plan: "plan" in plan ? plan.plan : "pilot" }}>
                      {plan.label}
                    </Link>
                  )}
                </Button>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-b border-(--jp-line) bg-(--jp-paper) px-4 py-16 sm:px-6 sm:py-20">
        <div className="mx-auto max-w-3xl">
          <h2 className="text-3xl font-semibold sm:text-4xl" style={display}>
            FAQ
          </h2>

          <Accordion type="single" collapsible className="mt-6">
            {FAQ.map((item, i) => (
              <AccordionItem key={item.q} value={`faq-${i}`}>
                <AccordionTrigger className="text-left text-sm font-medium">
                  {item.q}
                </AccordionTrigger>
                <AccordionContent className="text-sm text-(--jp-muted)">{item.a}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>

      <section className="bg-[#0f2a1c] px-4 py-20 text-center text-white sm:px-6 sm:py-24">
        <div className="mx-auto max-w-2xl">
          <h2 className="text-3xl font-semibold sm:text-5xl" style={display}>
            Siap jaga panen hari ini?
          </h2>
          <p className="mt-3 text-emerald-100/75">
            Mulai dari demo gratis — tanpa kartu kredit, tanpa dataset nasional.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Button asChild size="lg" className="bg-(--jp-sun) text-(--jp-ink) hover:bg-[#e8c56a]">
              <Link to="/demo" search={{ tab: "comparison" }}>
                Coba demo gratis
              </Link>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="border-white/40 bg-transparent text-white hover:bg-white/10 hover:text-white"
            >
              <Link to="/signup">
                Buat akun <Check className="ml-1.5 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      <footer className="border-t border-(--jp-line) bg-(--jp-paper) px-4 py-8 text-center text-xs text-(--jp-muted) sm:px-6">
        {new Date().getFullYear()} JagaPanen · Spoilage-aware agri-logistics
      </footer>
    </div>
  );
}
