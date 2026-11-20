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

export function Hero() {
  const root = useRef<HTMLElement>(null);
  const stage = useRef<HTMLDivElement>(null);
  const progress = useRef(0);
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
    const st = ScrollTrigger.create({ trigger: root.current, start: "top top", end: "bottom bottom", scrub: true, onUpdate: (s) => { progress.current = s.progress; } });
    if (prefersReducedMotion()) return () => st.kill();
    // Tween dibuat sekarang (di dalam scope ini); markReady dipanggil dari konteks GSAP Preloader, jadi selektor string di callback tidak ketemu.
    const fadeIn = gsap.fromTo(".hero-fade", { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 1.2, stagger: 0.08, delay: 0.5, paused: true });
    const off = onReady(() => fadeIn.play());
    // Teks hero menyingkir saat amplop terbuka.
    gsap.to(".hero-copy", { yPercent: -18, opacity: 0.0, ease: "none", scrollTrigger: { trigger: root.current, start: "35% top", end: "75% top", scrub: true } });
    // Ponsel: kartu naik melewati paragraf, jadi blok bawah menyingkir lebih awal.
    const mm = gsap.matchMedia();
    mm.add("(max-width: 767px)", () => {
      gsap.to(".hero-bottom", { opacity: 0, y: 30, ease: "none", scrollTrigger: { trigger: root.current, start: "4% top", end: "22% top", scrub: true } });
    });
    return () => { off(); st.kill(); mm.revert(); };
  }, { scope: root });

  const prev = STYLES[(style + STYLES.length - 1) % STYLES.length].name;
  const next = STYLES[(style + 1) % STYLES.length].name;
  const pick = (i: number) => { setAuto(false); setStyle(i); };

  return (
    <section ref={root} className="relative h-[230svh]" aria-label="Pembuka">
      <div ref={stage} className="sticky top-0 h-svh overflow-hidden" style={{ backgroundColor: STYLES[0].bg }}>
        {/* Objek 3D di belakang judul (pola Blobmixer: teks menimpa objek) */}
        <div className="absolute inset-0 lg:left-[18%]">
          {mode === "3d" ? <HeroScene progress={progress} style={styleRef} animate onFail={() => setMode("static")} /> : null}
          {mode === "static" ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img key={style} src={CARDS[style]} alt="" className="absolute left-1/2 top-1/2 w-[min(46vw,300px)] -translate-x-1/2 -translate-y-1/2 rounded-sm shadow-2xl lg:left-[62%]" />
          ) : null}
        </div>

        {/* Nama gaya tetangga, samar di tepi */}
        <button type="button" onClick={() => pick((style + STYLES.length - 1) % STYLES.length)} className="hero-fade display absolute left-[-1.5vw] top-1/2 hidden -translate-y-1/2 text-[7vw] text-ink/[0.07] transition-colors hover:text-ink/20 lg:block" aria-label={`Gaya sebelumnya: ${prev}`}>{prev}</button>
        <button type="button" onClick={() => pick((style + 1) % STYLES.length)} className="hero-fade display absolute right-[-1.5vw] top-1/2 hidden -translate-y-1/2 text-[7vw] text-ink/[0.07] transition-colors hover:text-ink/20 lg:block" aria-label={`Gaya berikutnya: ${next}`}>{next}</button>

        <div className="hero-copy wrap pointer-events-none relative flex h-full flex-col justify-between pb-6 pt-24 md:pb-8">
          <div>
            <p className="hero-fade meta mb-5 text-ink-soft">(Undangan pernikahan digital)</p>
            <SplitReveal as="h1" onLoad className="display h-xl max-w-[11ch] text-ink">
              Undangan yang <span className="serif-accent text-accent">disusun</span> khusus untukmu.
            </SplitReveal>
          </div>

          <div className="hero-bottom flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
            <div className="hero-fade pointer-events-auto max-w-sm">
              <p className="mb-6 text-[17px] leading-snug text-ink-soft">Isi data pernikahan. AI merancang undangan digital lengkap dengan RSVP dan link pribadi untuk setiap tamu. Selesai dalam satu menit.</p>
              <MagneticButton href={appLink("/daftar")}>Buat undangan gratis</MagneticButton>
            </div>

            <div className="hero-fade pointer-events-auto flex flex-wrap items-center gap-2 md:justify-end" role="group" aria-label="Pilih gaya contoh">
              <span className="meta mr-2 tabular-nums text-ink-soft">({String(style + 1).padStart(2, "0")}/{String(STYLES.length).padStart(2, "0")})</span>
              {STYLES.map((s, i) => (
                <button key={s.name} type="button" onClick={() => pick(i)} aria-pressed={i === style}
                  className={`h-9 rounded-full border px-4 text-[13px] transition-colors duration-500 ${i === style ? "border-ink bg-ink text-paper" : "border-ink/25 text-ink hover:border-ink"}`}>
                  {s.name}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Lencana berputar (pola Blobmixer) */}
        <a href={appLink("/daftar")} className="hero-fade absolute right-[clamp(16px,4vw,56px)] top-24 hidden h-28 w-28 md:block" aria-label="Buat undangan gratis" data-cursor="Mulai">
          <svg viewBox="0 0 100 100" className="h-full w-full animate-[spin_18s_linear_infinite] motion-reduce:animate-none" aria-hidden>
            <defs><path id="badge" d="M50,50 m-38,0 a38,38 0 1,1 76,0 a38,38 0 1,1 -76,0" /></defs>
            <text className="fill-ink text-[10.5px] uppercase tracking-[0.2em]"><textPath href="#badge">Buat gratis · Buat gratis · Buat gratis ·</textPath></text>
          </svg>
          <span className="absolute inset-0 m-auto flex h-9 w-9 items-center justify-center rounded-full bg-accent text-paper">↗</span>
        </a>

        <p className="hero-fade meta pointer-events-none absolute bottom-6 left-1/2 hidden -translate-x-1/2 text-ink-soft md:block">Scroll untuk membuka ↓</p>
      </div>
    </section>
  );
}
