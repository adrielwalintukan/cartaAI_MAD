"use client";
import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";
import { MagneticButton } from "@/components/motion/Magnetic";
import { SplitReveal } from "@/components/motion/Reveal";
import { gsap, onReady, prefersReducedMotion, ScrollTrigger, useGSAP } from "@/lib/gsap";
import { appLink } from "@/lib/site";

// three.js dimuat setelah halaman tampil; teks hero tidak pernah menunggu WebGL.
const HeroScene = dynamic(() => import("./HeroScene"), { ssr: false });

const CARDS = ["/templates/card-elegan_1.webp", "/templates/card-formal_1.webp", "/templates/card-simple_2.webp", "/templates/card-elegan_3.webp"];

const STYLES = [
  { name: "Elegan", bg: "#eee4d3" },
  { name: "Formal", bg: "#e5e6df" },
  { name: "Simple", bg: "#eddcd2" },
  { name: "Mewah", bg: "#e4ddd2" },
];

/**
 * Hero + section sesudahnya (`children`, yaitu "Kenapa CartaAI") berbagi satu kanvas 3D yang menempel.
 * Di hero amplop terbuka dan kartu keluar; di section berikutnya amplop jatuh dan kartu tetap tampil.
 */
export function Hero({ children }: { children?: React.ReactNode }) {
  const root = useRef<HTMLDivElement>(null);
  const hero = useRef<HTMLElement>(null);
  const after = useRef<HTMLDivElement>(null);
  const stage = useRef<HTMLDivElement>(null);
  const progress = useRef({ open: 0, out: 0 });
  const styleRef = useRef(0);
  const [style, setStyle] = useState(0);
  const [mode, setMode] = useState<"pending" | "3d" | "static">("pending");

  useEffect(() => {
    // Tanpa WebGL (atau reduced motion) pakai gambar statis.
    const gl = (() => { try { return !!document.createElement("canvas").getContext("webgl2"); } catch { return false; } })();
    setMode(prefersReducedMotion() || !gl ? "static" : "3d");
  }, []);

  // Gaya berganti otomatis tiap 3,6 dtk (berhenti saat pengguna memilih sendiri).
  const [auto, setAuto] = useState(true);
  useEffect(() => {
    if (!auto || mode === "pending" || prefersReducedMotion()) return;
    const id = setInterval(() => setStyle((s) => (s + 1) % STYLES.length), 3600);
    return () => clearInterval(id);
  }, [auto, mode]);

  useEffect(() => {
    styleRef.current = style;
    if (stage.current) gsap.to(stage.current, { backgroundColor: STYLES[style].bg, duration: 1.2, ease: "power2.out" });
  }, [style]);

  useGSAP(() => {
    const a = ScrollTrigger.create({ trigger: hero.current, start: "top top", end: "bottom bottom", onUpdate: (s) => { progress.current.open = s.progress; } });
    const b = ScrollTrigger.create({ trigger: after.current, start: "top bottom", end: "bottom bottom", onUpdate: (s) => { progress.current.out = s.progress; } });
    if (prefersReducedMotion()) return () => { a.kill(); b.kill(); };
    // Tween dibuat sekarang (di dalam scope ini); markReady dipanggil dari konteks GSAP Preloader, jadi selektor string di callback tidak ketemu.
    const fadeIn = gsap.fromTo(".hero-fade", { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 1.2, stagger: 0.08, delay: 0.5, paused: true });
    const off = onReady(() => fadeIn.play());
    // Teks hero menyingkir saat kartu keluar dari amplop.
    gsap.to(".hero-copy", { yPercent: -14, opacity: 0, ease: "none", scrollTrigger: { trigger: hero.current, start: "30% top", end: "70% top", scrub: true } });
    // Ponsel/tablet: kartu naik melewati paragraf, jadi blok bawah menyingkir lebih awal.
    const mm = gsap.matchMedia();
    mm.add("(max-width: 1023px)", () => {
      gsap.to(".hero-bottom", { opacity: 0, y: 30, ease: "none", scrollTrigger: { trigger: hero.current, start: "4% top", end: "22% top", scrub: true } });
    });
    return () => { off(); a.kill(); b.kill(); mm.revert(); };
  }, { scope: root });

  const pick = (i: number) => { setAuto(false); setStyle(i); };

  return (
    <div ref={root} className="relative">
      {/* Lapisan 3D menempel sepanjang hero + section berikutnya; tidak menangkap klik. */}
      <div aria-hidden className="pointer-events-none absolute inset-0 z-10">
        <div className="sticky top-0 h-svh lg:ml-[44%]">
          {mode === "3d" ? <HeroScene progress={progress} style={styleRef} eventSource={root} onFail={() => setMode("static")} /> : null}
          {mode === "static" ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img key={style} src={CARDS[style]} alt="" className="absolute left-1/2 top-[58%] w-[min(40vw,280px)] -translate-x-1/2 -translate-y-1/2 rounded-md shadow-2xl lg:top-1/2" />
          ) : null}
        </div>
      </div>

      <section ref={hero} className="relative h-[200svh]" aria-label="Pembuka">
        <div ref={stage} className="sticky top-0 h-svh overflow-hidden" style={{ backgroundColor: STYLES[0].bg }}>
          <div className="hero-copy wrap pointer-events-none relative flex h-full flex-col justify-between pb-6 pt-24 md:pb-8">
            <div>
              <p className="hero-fade meta mb-5 text-ink-soft">(Undangan pernikahan digital)</p>
              <SplitReveal as="h1" onLoad className="display max-w-[11ch] text-[clamp(3.2rem,11vw,6rem)] text-ink lg:text-[clamp(5rem,7.4vw,8.5rem)]">
                Undangan yang <span className="serif-accent text-accent">disusun</span> khusus untukmu.
              </SplitReveal>
            </div>

            <div className="hero-bottom flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
              <div className="hero-fade pointer-events-auto max-w-sm">
                <p className="mb-6 text-[17px] leading-snug text-ink-soft">Isi data pernikahan. AI merancang undangan digital lengkap dengan RSVP dan link pribadi untuk setiap tamu. Selesai dalam satu menit.</p>
                <MagneticButton href={appLink("/daftar")}>Buat undangan gratis</MagneticButton>
              </div>

              <div className="hero-fade pointer-events-auto relative z-20 flex flex-wrap items-center gap-2 lg:justify-end" role="group" aria-label="Pilih gaya contoh">
                <span className="meta mr-2 tabular-nums text-ink-soft">({String(style + 1).padStart(2, "0")}/{String(STYLES.length).padStart(2, "0")})</span>
                {STYLES.map((s, i) => (
                  <button key={s.name} type="button" onClick={() => pick(i)} aria-pressed={i === style}
                    className={`h-9 rounded-full border px-4 text-[13px] transition-colors duration-500 ${i === style ? "border-ink bg-ink text-paper" : "border-ink/25 bg-paper/40 text-ink backdrop-blur-sm hover:border-ink"}`}>
                    {s.name}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Lencana berputar (pola Blobmixer) */}
          <a href={appLink("/daftar")} className="hero-fade absolute right-[clamp(16px,4vw,56px)] top-24 z-20 hidden h-28 w-28 lg:block" aria-label="Buat undangan gratis" data-cursor="Mulai">
            <svg viewBox="0 0 100 100" className="h-full w-full animate-[spin_18s_linear_infinite] motion-reduce:animate-none" aria-hidden>
              <defs><path id="badge" d="M50,50 m-38,0 a38,38 0 1,1 76,0 a38,38 0 1,1 -76,0" /></defs>
              <text className="fill-ink text-[10.5px] uppercase tracking-[0.2em]"><textPath href="#badge">Buat gratis · Buat gratis · Buat gratis ·</textPath></text>
            </svg>
            <span className="absolute inset-0 m-auto flex h-9 w-9 items-center justify-center rounded-full bg-accent text-paper">↗</span>
          </a>

          <p className="hero-fade meta pointer-events-none absolute bottom-6 left-1/2 hidden -translate-x-1/2 text-ink-soft lg:block">Scroll untuk membuka ↓</p>
        </div>
      </section>

      <div ref={after}>{children}</div>
    </div>
  );
}
