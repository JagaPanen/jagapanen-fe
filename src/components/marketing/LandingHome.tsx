import { lazy, Suspense, useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Activity,
  ArrowRight,
  Check,
  Clock,
  Compass,
  Layers,
  Leaf,
  Route,
  Shield,
  Sparkles,
  Truck,
} from "lucide-react";

const LazyHero3DRouteScene = lazy(() => import("./Hero3DRouteScene"));

const PREVIEW_STEPS = [
  {
    title: "Hitung risiko kelas A–E",
    detail:
      "Panenlink menilai seberapa cepat mutu turun dari jam sejak panen — misalnya tomat, cabai, dan sayur daun.",
    metric: "Skor risiko",
  },
  {
    title: "Cek truk yang layak",
    detail:
      "Sistem menyaring armada yang kapasitas dan waktu tempuhnya masih cocok dengan jendela kesegaran panen.",
    metric: "Kelayakan armada",
  },
  {
    title: "Bandingkan dua rute",
    detail:
      "Lihat perbedaan rute jarak terpendek versus rute yang melindungi mutu sebelum pengantar berangkat.",
    metric: "Keputusan jelas",
  },
];

const HOW_STEPS = [
  {
    title: "Catat panen hari ini",
    desc: "Masukkan komoditas, tonase, dan waktu petik dari titik kumpul koperasi Anda.",
  },
  {
    title: "Hitung skor spoilage",
    desc: "Panenlink menilai kelas kerentanan A–E, jam sejak panen, dan sisa umur simpan.",
  },
  {
    title: "Pilih truk yang layak",
    desc: "Cocokkan lot prioritas dengan kendaraan aktif yang masih memenuhi jendela waktu.",
  },
  {
    title: "Bandingkan dan jalankan",
    desc: "Pilih rute yang lebih baik untuk mutu panen, lalu kunci perjalanan untuk pengantar.",
  },
];

const PRICING = [
  {
    name: "Guest",
    price: "Gratis",
    blurb: "Coba planner asli dengan data contoh, terbatas 5 kali optimasi.",
    demo: true,
    label: "Coba demo",
    highlight: false,
    features: ["5 kali optimasi rute", "Data hortikultura contoh", "Komparasi dua skenario rute"],
  },
  {
    name: "Basic",
    price: "Gratis",
    blurb: "Workspace organisasi, 50 optimasi per bulan, dan skenario tersimpan.",
    demo: false,
    plan: "basic" as const,
    label: "Daftar Basic",
    highlight: true,
    features: [
      "Workspace organisasi sendiri",
      "50 optimasi per bulan",
      "Simpan skenario dan armada",
    ],
  },
  {
    name: "Pro",
    price: "IDR 49rb/bln",
    blurb: "2.000 optimasi per bulan, dashboard lengkap, dan dukungan prioritas.",
    demo: false,
    plan: "pro" as const,
    label: "Daftar → Pro",
    highlight: false,
    features: [
      "2.000 optimasi per bulan",
      "Multi-operator dan log audit",
      "Dukungan integrasi prioritas",
    ],
  },
];

const FAQ = [
  {
    q: "Apa bedanya demo guest dengan akun organisasi?",
    a: "Demo guest memakai data contoh terisolasi dengan batas 5 kali optimasi. Akun organisasi punya workspace sendiri, skenario tersimpan, dan akses ekspor laporan.",
  },
  {
    q: "Apakah Panenlink mengganti GPS / TMS kami?",
    a: "Tidak. Panenlink melengkapi data panen dan armada yang sudah Anda punya. Fokusnya membantu memilih rute yang melindungi mutu, bukan mengganti pelacakan armada.",
  },
  {
    q: "Bagaimana skor risiko dihitung?",
    a: "Saat ini dari kelas kerentanan A–E, jam sejak panen, faktor penanganan, dan sisa umur simpan — hasilnya transparan dan bisa diaudit. Ke depan, machine learning akan memperkuat deteksi pola defisit dan surplus panen.",
  },
  {
    q: "Apakah butuh dataset nasional?",
    a: "Untuk mulai, tidak. Cukup input panen hari ini dan daftar kendaraan aktif koperasi Anda. Nanti Panenlink memakai dataset untuk mendeteksi defisit dan surplus, agar pengiriman mengikuti permintaan dan pasokan — bukan hanya menunggu lot siap berangkat.",
  },
];

const display = { fontFamily: "var(--jp-display)" } as const;

/**
 * Instant, zero-blocking Isometric SVG Fallback rendered during SSR / initial paint
 * or when the user's device requests reduced motion / data-saver mode.
 */
function Hero3DFallbackPlaceholder({ spoilageAware }: { spoilageAware: boolean }) {
  return (
    <div className="relative flex h-full min-h-[380px] w-full flex-col justify-between overflow-hidden rounded-3xl border border-emerald-300/15 bg-[#07150f]/80 p-5 shadow-[0_32px_80px_-24px_rgba(0,0,0,0.65)] backdrop-blur-md sm:min-h-[450px]">
      <div className="flex items-center justify-between text-xs text-emerald-100/80">
        <span className="inline-flex items-center gap-2 font-semibold text-white">
          <span className="h-2 w-2 rounded-full bg-emerald-400" />
          Peta Rute Topografi 3D
        </span>
        <span className="rounded-full bg-white/10 px-2.5 py-0.5 text-[11px]">
          {spoilageAware ? "Mode Spoilage-Aware" : "Mode Baseline Km"}
        </span>
      </div>

      <svg
        viewBox="0 0 520 300"
        className="my-auto h-56 w-full"
        aria-label="Ilustrasi isometrik rute pengiriman panen"
      >
        <defs>
          <linearGradient id="isoGridGrad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#34d399" stopOpacity="0.22" />
            <stop offset="100%" stopColor="#0f2a1c" stopOpacity="0.05" />
          </linearGradient>
        </defs>
        {/* Isometric platform base */}
        <polygon
          points="260,35 480,145 260,255 40,145"
          fill="url(#isoGridGrad)"
          stroke="rgba(110,231,183,0.25)"
          strokeWidth="1.5"
        />
        <line x1="150" y1="90" x2="370" y2="200" stroke="rgba(110,231,183,0.12)" strokeWidth="1" />
        <line x1="370" y1="90" x2="150" y2="200" stroke="rgba(110,231,183,0.12)" strokeWidth="1" />
        {/* Baseline straight route */}
        <path
          d="M 110 135 L 250 190 L 410 150"
          fill="none"
          stroke="rgba(148,163,184,0.45)"
          strokeWidth="2.5"
          strokeDasharray="6 6"
        />
        {/* Spoilage-aware 3D elevated arc */}
        <path
          d="M 110 135 C 175 45, 240 60, 275 115 C 320 70, 370 85, 410 150"
          fill="none"
          stroke={spoilageAware ? "#34d399" : "#f97316"}
          strokeWidth="4"
          strokeLinecap="round"
        />
        <circle cx="110" cy="135" r="7" fill="#34d399" />
        <circle cx="275" cy="115" r="7" fill="#f0d078" />
        <circle cx="410" cy="150" r="8" fill="#fbbf24" />
      </svg>

      <div className="rounded-2xl border border-white/10 bg-[#0b2319]/85 p-3 text-xs text-emerald-100/80">
        Menyiapkan peta rute interaktif · Prioritas kesegaran Kelas A.
      </div>
    </div>
  );
}

export function LandingPage() {
  const [spoilageAware, setSpoilageAware] = useState(true);
  const [shouldRender3D, setShouldRender3D] = useState(false);
  const [reduceMotion, setReduceMotion] = useState(false);

  // Defer canvas mount until after first paint. Prefer reduced-motion softens
  // auto-orbit inside the scene — it must not permanently block the interactive map
  // (Windows often enables prefers-reduced-motion while mobile does not).
  useEffect(() => {
    if (typeof window === "undefined") return;

    const motionQuery = window.matchMedia?.("(prefers-reduced-motion: reduce)");
    setReduceMotion(Boolean(motionQuery?.matches));

    const onMotionChange = (event: MediaQueryListEvent) => {
      setReduceMotion(event.matches);
    };
    motionQuery?.addEventListener?.("change", onMotionChange);

    const nav = navigator as Navigator & {
      connection?: { saveData?: boolean };
    };
    // Data-saver: keep the light SVG placeholder to avoid extra JS/canvas work.
    if (nav.connection?.saveData) {
      return () => motionQuery?.removeEventListener?.("change", onMotionChange);
    }

    let timeoutId: ReturnType<typeof setTimeout> | null = null;
    const win = window as Window & {
      requestIdleCallback?: (cb: () => void, opts?: { timeout: number }) => number;
      cancelIdleCallback?: (id: number) => void;
    };

    if (typeof win.requestIdleCallback === "function") {
      const idleId = win.requestIdleCallback(() => setShouldRender3D(true), { timeout: 400 });
      return () => {
        win.cancelIdleCallback?.(idleId);
        motionQuery?.removeEventListener?.("change", onMotionChange);
      };
    }

    timeoutId = setTimeout(() => setShouldRender3D(true), 80);
    return () => {
      if (timeoutId) clearTimeout(timeoutId);
      motionQuery?.removeEventListener?.("change", onMotionChange);
    };
  }, []);

  return (
    <div className="jp-landing min-h-screen bg-(--jp-paper) text-(--jp-ink)">
      {/* Glassmorphic Floating Top Header */}
      <header className="fixed inset-x-0 top-0 z-40 border-b border-white/10 bg-[#07150f]/75 backdrop-blur-md transition-colors">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3.5 sm:px-6">
          <Link to="/" className="flex items-center gap-2.5">
            <img src="/logo.png" alt="" className="h-9 w-auto object-contain sm:h-10" />
            <span
              className="text-xl font-semibold tracking-tight text-white drop-shadow-sm sm:text-2xl"
              style={display}
            >
              Panenlink
            </span>
          </Link>
          <nav className="flex items-center gap-2 sm:gap-3">
            <Button
              asChild
              variant="ghost"
              size="sm"
              className="hidden text-emerald-50/90 hover:bg-white/10 hover:text-white sm:inline-flex"
            >
              <Link to="/login">Masuk</Link>
            </Button>
            <Button
              asChild
              size="sm"
              className="bg-(--jp-leaf) text-white shadow-sm shadow-black/30 hover:bg-(--jp-leaf-deep)"
            >
              <Link to="/signup">Buat akun</Link>
            </Button>
          </nav>
        </div>
      </header>

      {/* 3D Interactive Hero Section */}
      <section className="relative isolate flex min-h-[100dvh] flex-col justify-center overflow-hidden pb-24 pt-24 sm:pb-32 sm:pt-28">
        {/* Multi-layered atmospheric depth background */}
        <div
          className="absolute inset-0 -z-20 bg-[radial-gradient(ellipse_at_18%_18%,#1a4d36_0%,transparent_55%),radial-gradient(ellipse_at_82%_52%,#113826_0%,#07150f_72%)]"
          aria-hidden
        />
        <div
          className="jp-hero-grid-overlay pointer-events-none absolute inset-0 -z-10 opacity-35"
          aria-hidden
        />

        <div className="mx-auto grid w-full max-w-6xl items-center gap-10 px-4 sm:px-6 lg:grid-cols-12 lg:gap-8">
          {/* Left Column: Value Proposition & Interactive Route Controls */}
          <div className="relative z-10 lg:col-span-6">
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-300/25 bg-emerald-950/60 px-3.5 py-1.5 text-xs font-medium text-emerald-200 shadow-sm backdrop-blur-md">
              <Sparkles className="h-3.5 w-3.5 text-(--jp-sun)" />
              <span>Rute yang melindungi mutu panen</span>
            </div>

            <p
              className="mt-5 text-5xl font-semibold leading-[0.95] tracking-tight text-white sm:text-6xl md:text-7xl"
              style={display}
            >
              Panenlink
            </p>

            <h1 className="mt-4 max-w-xl text-lg font-medium leading-snug text-emerald-50/95 sm:text-2xl">
              Jangan kirim rute terdekat dulu — kirim rute yang melindungi panen mudah rusak.
            </h1>

            <p className="mt-3 max-w-lg text-sm leading-relaxed text-emerald-100/75 sm:text-base">
              Decision support untuk koperasi dan armada kolektor: skor umur simpan kelas A–E, cek
              kelayakan truk, lalu bandingkan rute biasa dengan rute yang menjaga nilai panen.
            </p>

            {/* Primary & Secondary CTAs */}
            <div className="mt-7 flex flex-wrap gap-3">
              <Button
                asChild
                size="lg"
                className="bg-(--jp-sun) font-semibold text-(--jp-ink) shadow-[0_14px_30px_-10px_rgba(240,208,120,0.45)] transition-transform hover:-translate-y-0.5 hover:bg-[#e8c56a]"
              >
                <Link to="/demo" search={{ tab: "comparison" }}>
                  Coba demo gratis <ArrowRight className="ml-1.5 h-4 w-4" />
                </Link>
              </Button>
              <Button
                asChild
                size="lg"
                variant="outline"
                className="border-white/30 bg-white/5 text-white backdrop-blur-sm hover:bg-white/15 hover:text-white"
              >
                <Link to="/signup">Buat akun</Link>
              </Button>
            </div>

            {/* Floating Glassmorphic KPI Pills synchronized with 3D scene */}
            <div className="mt-8 grid grid-cols-3 gap-2.5 sm:max-w-lg">
              <div className="jp-glass-pill rounded-2xl p-3">
                <div className="flex items-center gap-1.5 text-[11px] font-medium text-emerald-200/80">
                  <Activity className="h-3.5 w-3.5 text-emerald-400" />
                  <span>Risiko Kelas A</span>
                </div>
                <p className="mt-1 text-base font-bold text-white sm:text-lg">
                  {spoilageAware ? "-38% Susut" : "+28% Susut"}
                </p>
              </div>
              <div className="jp-glass-pill rounded-2xl p-3">
                <div className="flex items-center gap-1.5 text-[11px] font-medium text-emerald-200/80">
                  <Clock className="h-3.5 w-3.5 text-(--jp-sun)" />
                  <span>Sisa Simpan</span>
                </div>
                <p className="mt-1 text-base font-bold text-white sm:text-lg">
                  {spoilageAware ? "+14.0 Jam" : "Kritis 3.5j"}
                </p>
              </div>
              <div className="jp-glass-pill rounded-2xl p-3">
                <div className="flex items-center gap-1.5 text-[11px] font-medium text-emerald-200/80">
                  <Truck className="h-3.5 w-3.5 text-emerald-300" />
                  <span>Armada Aktif</span>
                </div>
                <p className="mt-1 text-base font-bold text-white sm:text-lg">Cold-Box #02</p>
              </div>
            </div>
          </div>

          {/* Right Column: Interactive 3D Map Route Stage with Lazy Hydration */}
          <div className="relative z-10 h-[400px] w-full sm:h-[470px] lg:col-span-6">
            {shouldRender3D ? (
              <Suspense fallback={<Hero3DFallbackPlaceholder spoilageAware={spoilageAware} />}>
                <LazyHero3DRouteScene
                  spoilageAware={spoilageAware}
                  onSelectMode={setSpoilageAware}
                  reduceMotion={reduceMotion}
                />
              </Suspense>
            ) : (
              <Hero3DFallbackPlaceholder spoilageAware={spoilageAware} />
            )}
          </div>
        </div>

        {/* Soft bottom gradient bridge into the overlapping below-the-fold card */}
        <div
          className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-b from-transparent via-[#07150f]/50 to-(--jp-paper)"
          aria-hidden
        />
      </section>

      {/* Overlapping Floating 3D-Depth Planner Preview Section */}
      <section className="relative z-20 -mt-12 border-b border-(--jp-line) px-4 pb-16 sm:-mt-16 sm:px-6 sm:pb-20">
        <div className="mx-auto max-w-6xl">
          <div className="jp-depth-card overflow-hidden rounded-3xl border border-emerald-950/12 bg-white/95 shadow-[0_28px_70px_-24px_rgba(15,42,28,0.38)] backdrop-blur-xl">
            {/* Dark Emerald Telemetry Header */}
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-emerald-900/20 bg-gradient-to-r from-[#0b2419] via-[#123827] to-[#0b2419] px-5 py-3.5 text-xs text-emerald-100">
              <div className="flex items-center gap-2.5">
                <span className="h-2.5 w-2.5 rounded-full bg-emerald-400 shadow-[0_0_8px_#34d399]" />
                <span className="font-semibold tracking-wide text-white">
                  /demo · Preview planner
                </span>
              </div>
              <div className="flex items-center gap-2 text-[11px] text-emerald-200/80">
                <Compass className="h-3.5 w-3.5 text-(--jp-sun)" />
                <span>Sinkron dengan peta rute 3D</span>
              </div>
            </div>

            <div className="p-6 sm:p-8">
              <div className="flex flex-col justify-between gap-4 border-b border-(--jp-line) pb-6 md:flex-row md:items-end">
                <div>
                  <h2
                    className="text-3xl font-semibold tracking-tight text-(--jp-ink) sm:text-4xl"
                    style={display}
                  >
                    Preview planner
                  </h2>
                  <p className="mt-1.5 max-w-2xl text-sm text-(--jp-muted) sm:text-base">
                    Alur yang sama dengan demo: catat panen, hitung skor risiko, cek truk yang
                    layak, lalu optimasi rute.
                  </p>
                </div>
                <Link
                  to="/demo"
                  search={{ tab: "comparison" }}
                  className="inline-flex items-center gap-1.5 text-sm font-semibold text-(--jp-leaf) hover:text-(--jp-leaf-deep)"
                >
                  Buka demo penuh <ArrowRight className="h-4 w-4" />
                </Link>
              </div>

              <div className="mt-6 grid gap-4 md:grid-cols-3">
                {PREVIEW_STEPS.map((item, i) => (
                  <div
                    key={item.title}
                    className="jp-floating-tile group relative rounded-2xl border border-(--jp-line) bg-gradient-to-b from-white to-[#f4f8f5] p-5 transition-all duration-300 hover:-translate-y-1 hover:border-(--jp-leaf)/40 hover:shadow-[0_18px_38px_-18px_rgba(20,82,52,0.22)]"
                  >
                    <div className="flex items-center justify-between">
                      <span className="inline-flex items-center rounded-full bg-emerald-950/8 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-(--jp-leaf)">
                        Langkah {i + 1}
                      </span>
                      <span className="text-[11px] font-medium text-(--jp-muted)">
                        {item.metric}
                      </span>
                    </div>
                    <p className="mt-3 text-base font-semibold text-(--jp-ink)">{item.title}</p>
                    <p className="mt-1.5 text-xs leading-relaxed text-(--jp-muted)">
                      {item.detail}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Masalah di Lapangan — Elevated 3D Depth Cards */}
      <section className="relative overflow-hidden border-b border-(--jp-line) bg-[#eef4ef] px-4 py-16 sm:px-6 sm:py-20">
        <div
          className="pointer-events-none absolute -right-24 -top-24 h-80 w-80 rounded-full bg-emerald-600/8 blur-3xl"
          aria-hidden
        />
        <div className="mx-auto max-w-6xl">
          <div className="inline-flex items-center gap-2 rounded-full bg-emerald-950/8 px-3 py-1 text-xs font-semibold text-(--jp-leaf-deep)">
            <Layers className="h-3.5 w-3.5" />
            <span>Mengapa rute biasa sering gagal</span>
          </div>
          <h2 className="mt-3 text-3xl font-semibold sm:text-4xl" style={display}>
            Masalah di lapangan
          </h2>
          <p className="mt-2 max-w-2xl text-(--jp-muted)">
            Rute terpendek sering mengorbankan panen kelas A dan B — susut diam-diam di bak truk
            sebelum sampai pasar.
          </p>
          <ul className="mt-8 grid gap-5 sm:grid-cols-3">
            <li className="jp-floating-tile rounded-2xl border border-white/80 bg-white/90 p-6 shadow-[0_18px_40px_-24px_rgba(15,42,28,0.22)] ring-1 ring-(--jp-line) backdrop-blur-sm transition-transform duration-300 hover:-translate-y-1">
              <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-950/10 text-(--jp-leaf)">
                <Leaf className="h-5 w-5" />
              </div>
              <p className="mt-4 text-lg font-semibold">Panen rentan</p>
              <p className="mt-1.5 text-sm leading-relaxed text-(--jp-muted)">
                Tomat dan sayur daun cepat kehilangan kualitas jika menunggu terlalu lama di rute.
              </p>
            </li>
            <li className="jp-floating-tile rounded-2xl border border-white/80 bg-white/90 p-6 shadow-[0_18px_40px_-24px_rgba(15,42,28,0.22)] ring-1 ring-(--jp-line) backdrop-blur-sm transition-transform duration-300 hover:-translate-y-1">
              <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-950/10 text-(--jp-leaf)">
                <Route className="h-5 w-5" />
              </div>
              <p className="mt-4 text-lg font-semibold">Jarak bukan selalu terbaik</p>
              <p className="mt-1.5 text-sm leading-relaxed text-(--jp-muted)">
                Dispatcher sering mengutamakan kilometer, bukan sisa umur simpan di bak truk.
              </p>
            </li>
            <li className="jp-floating-tile rounded-2xl border border-white/80 bg-white/90 p-6 shadow-[0_18px_40px_-24px_rgba(15,42,28,0.22)] ring-1 ring-(--jp-line) backdrop-blur-sm transition-transform duration-300 hover:-translate-y-1">
              <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-950/10 text-(--jp-leaf)">
                <Shield className="h-5 w-5" />
              </div>
              <p className="mt-4 text-lg font-semibold">Sulit dibuktikan</p>
              <p className="mt-1.5 text-sm leading-relaxed text-(--jp-muted)">
                Tanpa membandingkan dua skenario rute, keputusan sulit dijelaskan ke pengelola.
              </p>
            </li>
          </ul>
        </div>
      </section>

      {/* Cara Kerja — Connected 3D-Styled Step Pipeline */}
      <section className="border-b border-(--jp-line) bg-(--jp-paper) px-4 py-16 sm:px-6 sm:py-20">
        <div className="mx-auto max-w-6xl">
          <h2 className="text-3xl font-semibold sm:text-4xl" style={display}>
            Cara kerja
          </h2>
          <p className="mt-2 max-w-2xl text-(--jp-muted)">
            Empat langkah dari pencatatan panen sampai kunci perjalanan untuk pengantar.
          </p>
          <ol className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {HOW_STEPS.map((step, i) => (
              <li
                key={step.title}
                className="relative rounded-2xl border border-(--jp-line) bg-white p-5 shadow-[0_12px_30px_-20px_rgba(15,42,28,0.18)] transition-all duration-300 hover:-translate-y-1 hover:border-(--jp-leaf)/40"
              >
                <div className="flex items-center justify-between">
                  <span className="text-4xl font-semibold text-(--jp-leaf)/35" style={display}>
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <span className="h-2 w-2 rounded-full bg-(--jp-leaf)/40" />
                </div>
                <p className="mt-3 text-base font-semibold text-(--jp-ink)">{step.title}</p>
                <p className="mt-1.5 text-xs leading-relaxed text-(--jp-muted)">{step.desc}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* Teaser Rute — Cohesive Dark 3D Telemetry Comparison */}
      <section className="relative overflow-hidden border-b border-(--jp-line) bg-[radial-gradient(ellipse_at_75%_25%,#184832_0%,#0f2a1c_55%,#07150f_100%)] px-4 py-16 text-emerald-50 sm:px-6 sm:py-20">
        <div className="mx-auto max-w-6xl">
          <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
            <div>
              <h2 className="text-3xl font-semibold sm:text-4xl" style={display}>
                Bandingkan rute
              </h2>
              <p className="mt-2 max-w-xl text-emerald-100/75">
                Alihkan antara rute jarak terpendek dan rute yang melindungi mutu. Pilihan ini juga
                mengubah peta rute 3D di atas.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={() => setSpoilageAware(false)}
                className={
                  !spoilageAware
                    ? "rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-(--jp-ink) shadow-md"
                    : "rounded-xl border border-white/15 bg-white/8 px-4 py-2.5 text-sm font-medium text-emerald-100 hover:bg-white/15"
                }
              >
                Baseline (km)
              </button>
              <button
                type="button"
                onClick={() => setSpoilageAware(true)}
                className={
                  spoilageAware
                    ? "rounded-xl bg-(--jp-sun) px-4 py-2.5 text-sm font-semibold text-(--jp-ink) shadow-md"
                    : "rounded-xl border border-white/15 bg-white/8 px-4 py-2.5 text-sm font-medium text-emerald-100 hover:bg-white/15"
                }
              >
                Spoilage-aware
              </button>
            </div>
          </div>

          <div className="mt-8 grid gap-6 lg:grid-cols-12">
            <div className="overflow-hidden rounded-2xl border border-white/12 bg-[#07150f]/90 p-4 shadow-2xl backdrop-blur-md lg:col-span-8">
              <svg viewBox="0 0 460 180" className="h-44 w-full" aria-hidden>
                <defs>
                  <linearGradient id="spoilageStroke" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="#34d399" />
                    <stop offset="55%" stopColor="#f0d078" />
                    <stop offset="100%" stopColor="#34d399" />
                  </linearGradient>
                </defs>
                {/* Subtle perspective horizon lines */}
                <line
                  x1="20"
                  y1="90"
                  x2="440"
                  y2="90"
                  stroke="rgba(255,255,255,0.06)"
                  strokeWidth="1"
                />
                <circle cx="50" cy="90" r="9" fill="#6ee7b7" />
                <circle cx="230" cy="48" r="7" fill="#f0d078" />
                <circle cx="410" cy="90" r="9" fill="#fbbf24" />
                {spoilageAware ? (
                  <path
                    d="M58 90 C 130 24, 185 45, 230 48 S 345 105, 402 90"
                    fill="none"
                    stroke="url(#spoilageStroke)"
                    strokeWidth="4.5"
                    strokeLinecap="round"
                  />
                ) : (
                  <path
                    d="M58 90 L 402 90"
                    fill="none"
                    stroke="#fb923c"
                    strokeWidth="4"
                    strokeDasharray="8 6"
                  />
                )}
                <text
                  x="230"
                  y="152"
                  textAnchor="middle"
                  fill="#a7f3d0"
                  fontSize="12"
                  fontWeight="600"
                >
                  {spoilageAware
                    ? "Detour kecil · risiko spoilage turun · lot Kelas A dijemput lebih dulu"
                    : "Rute lurus · Kelas A menunggu lebih lama · susut mutu naik di bak truk"}
                </text>
              </svg>
            </div>

            <div className="flex flex-col justify-between rounded-2xl border border-white/12 bg-white/6 p-5 backdrop-blur-md lg:col-span-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-emerald-300">
                  Dampak rute
                </p>
                <p className="mt-2 text-2xl font-semibold text-white" style={display}>
                  {spoilageAware ? "Prioritas jaga mutu" : "Prioritas jarak terpendek"}
                </p>
                <p className="mt-2 text-xs leading-relaxed text-emerald-100/75">
                  {spoilageAware
                    ? "Tambah sekitar 6 km lewat hub cold-box agar suhu panen Kelas A tetap terjaga."
                    : "Hemat 6 km jarak, tetapi panen Kelas A lebih lama terpapar panas di perjalanan."}
                </p>
              </div>
              <div className="mt-5 border-t border-white/10 pt-4">
                <Link
                  to="/demo"
                  search={{ tab: "comparison" }}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-(--jp-sun) hover:underline"
                >
                  Uji dengan data panen Anda di demo <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Bukti Arah Produk */}
      <section className="border-b border-(--jp-line) bg-(--jp-paper) px-4 py-16 sm:px-6 sm:py-20">
        <div className="mx-auto max-w-6xl">
          <h2 className="text-3xl font-semibold sm:text-4xl" style={display}>
            Siap dipakai hari ini, tumbuh dengan data
          </h2>
          <p className="mt-2 max-w-2xl text-(--jp-muted)">
            Fitur inti sudah berjalan: skor risiko panen, cek kelayakan truk, dan bandingkan rute
            biasa dengan rute yang melindungi mutu. Fondasi ini membuka jalan ke prediksi defisit
            dan surplus agar pengiriman mengikuti permintaan dan pasokan.
          </p>
          <div className="mt-8 grid gap-5 sm:grid-cols-3">
            <div className="rounded-2xl border border-(--jp-line) bg-white p-6 shadow-[0_14px_32px_-22px_rgba(15,42,28,0.2)]">
              <p className="text-lg font-semibold text-(--jp-leaf-deep)">
                Siap menuju Machine Learning
              </p>
              <p className="mt-1.5 text-sm text-(--jp-muted)">
                Hari ini keputusan transparan dan bisa diaudit. Besok, model membantu membaca pola
                defisit–surplus agar pengiriman mengikuti permintaan dan pasokan.
              </p>
            </div>
            <div className="rounded-2xl border border-(--jp-line) bg-white p-6 shadow-[0_14px_32px_-22px_rgba(15,42,28,0.2)]">
              <p className="text-lg font-semibold text-(--jp-leaf-deep)">Workspace terpisah</p>
              <p className="mt-1.5 text-sm text-(--jp-muted)">
                Setiap koperasi punya ruang kerja sendiri. Demo guest tidak bercampur dengan data
                organisasi.
              </p>
            </div>
            <div className="rounded-2xl border border-(--jp-line) bg-white p-6 shadow-[0_14px_32px_-22px_rgba(15,42,28,0.2)]">
              <p className="text-lg font-semibold text-(--jp-leaf-deep)">Langsung dari lapangan</p>
              <p className="mt-1.5 text-sm text-(--jp-muted)">
                Cukup catat panen dan armada yang sudah ada. Tidak perlu memasang perangkat baru.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section
        id="pricing"
        className="border-b border-(--jp-line) bg-[#eef4ef] px-4 py-16 sm:px-6 sm:py-20"
      >
        <div className="mx-auto max-w-6xl">
          <h2 className="text-3xl font-semibold sm:text-4xl" style={display}>
            Harga sederhana
          </h2>
          <p className="mt-2 text-(--jp-muted)">
            Mulai dari demo guest, lalu pilih Basic atau Pro untuk organisasi.
          </p>
          <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {PRICING.map((plan) => (
              <div
                key={plan.name}
                className={
                  plan.highlight
                    ? "flex flex-col rounded-2xl border border-(--jp-leaf) bg-white p-6 shadow-[0_22px_48px_-24px_rgba(31,107,69,0.35)] ring-2 ring-(--jp-leaf)/25"
                    : "flex flex-col rounded-2xl border border-(--jp-line) bg-white/95 p-6 shadow-sm"
                }
              >
                <div className="flex items-center justify-between">
                  <p className="text-xs font-semibold uppercase tracking-wide text-(--jp-leaf)">
                    {plan.name}
                  </p>
                  {plan.highlight && (
                    <span className="rounded-full bg-emerald-950/10 px-2.5 py-0.5 text-[10px] font-semibold text-(--jp-leaf-deep)">
                      Cocok untuk koperasi
                    </span>
                  )}
                </div>
                <p className="mt-3 text-2xl font-semibold" style={display}>
                  {plan.price}
                </p>
                <p className="mt-2 text-xs leading-relaxed text-(--jp-muted)">{plan.blurb}</p>
                <ul className="mt-4 flex-1 space-y-2 border-t border-(--jp-line) pt-4 text-xs text-(--jp-ink)">
                  {plan.features.map((feat) => (
                    <li key={feat} className="flex items-center gap-2">
                      <Check className="h-3.5 w-3.5 shrink-0 text-(--jp-leaf)" />
                      <span>{feat}</span>
                    </li>
                  ))}
                </ul>
                <Button
                  asChild
                  size="sm"
                  className={
                    plan.highlight
                      ? "mt-6 w-full bg-(--jp-leaf) hover:bg-(--jp-leaf-deep)"
                      : "mt-6 w-full bg-(--jp-ink) hover:bg-black"
                  }
                >
                  {plan.demo ? (
                    <Link to="/demo" search={{ tab: "comparison" }}>
                      {plan.label}
                    </Link>
                  ) : (
                    <Link to="/signup" search={{ plan: "plan" in plan ? plan.plan : "basic" }}>
                      {plan.label}
                    </Link>
                  )}
                </Button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
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

      {/* Final CTA Section */}
      <section className="relative overflow-hidden bg-[radial-gradient(ellipse_at_50%_0%,#1a4d36_0%,#0f2a1c_60%,#07150f_100%)] px-4 py-20 text-center text-white sm:px-6 sm:py-24">
        <div className="mx-auto max-w-2xl">
          <h2 className="text-3xl font-semibold sm:text-5xl" style={display}>
            Siap jaga panen hari ini?
          </h2>
          <p className="mt-3 text-emerald-100/75">
            Mulai dari demo gratis — tanpa kartu kredit dan tanpa dataset nasional.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Button
              asChild
              size="lg"
              className="bg-(--jp-sun) font-semibold text-(--jp-ink) shadow-lg hover:bg-[#e8c56a]"
            >
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
        {new Date().getFullYear()} Panenlink · Spoilage-aware agri-logistics
      </footer>
    </div>
  );
}
