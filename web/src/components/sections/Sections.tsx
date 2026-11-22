"use client";
import Link from "next/link";
import { useRef, useState } from "react";
import { MagneticButton } from "@/components/motion/Magnetic";
import { FadeUp, SplitReveal } from "@/components/motion/Reveal";
import { gsap, isFinePointer, prefersReducedMotion, SplitText, useGSAP } from "@/lib/gsap";
import { appLink, FAQ, FEATURES, PLANS, STEPS, TEMPLATES } from "@/lib/site";

/** Judul section: label kecil + judul besar + hitungan di kanan (ala "Extras (13)"). */
export function SectionHead({ label, title, count, dark }: { label: string; title: React.ReactNode; count?: number; dark?: boolean }) {
  return (
    <div className="mb-[clamp(40px,7vw,96px)]">
      <p className={`meta mb-5 ${dark ? "text-paper/50" : "text-ink-soft"}`}>({label})</p>
      <div className="flex items-end justify-between gap-6">
        <SplitReveal as="h2" className="display h-lg max-w-[16ch]">{title}</SplitReveal>
        {count != null ? <span className="display h-md tabular-nums opacity-80">({String(count).padStart(2, "0")})</span> : null}
      </div>
    </div>
  );
}

/** Paragraf manifesto: kata-kata menyala mengikuti scroll. */
export function Manifesto() {
  const ref = useRef<HTMLParagraphElement>(null);
  useGSAP(() => {
    if (prefersReducedMotion()) return;
    const split = SplitText.create(ref.current!, { type: "words" });
    gsap.fromTo(split.words, { opacity: 0.12 }, { opacity: 1, stagger: 0.1, ease: "none", scrollTrigger: { trigger: ref.current, start: "top 78%", end: "bottom 45%", scrub: true } });
    return () => split.revert();
  });
  return (
    // Di desktop kartu 3D dari hero masih tampil di kanan section ini, jadi teks dibatasi ke kiri.
    <section className="wrap flex min-h-[62svh] flex-col justify-center py-[clamp(64px,12vw,160px)] md:min-h-[115svh]" aria-label="Manifesto">
      <p className="meta mb-8 text-ink-soft">(Kenapa CartaAI)</p>
      <p ref={ref} className="display max-w-[22ch] text-[clamp(2rem,5.2vw,5.2rem)] leading-[1.02] lg:max-w-[17ch] lg:text-[clamp(3rem,4.6vw,5.4rem)]">
        Undangan adalah sapaan pertama dari hari bahagiamu. Ia layak terasa <span className="serif-accent text-accent">milik kalian</span>, bukan template yang sama untuk semua orang.
      </p>
    </section>
  );
}

/** Langkah kerja: kartu menempel lalu bertumpuk (pola Firstwork). Kartu sebelumnya mengecil saat tertutup. */
export function ProcessStack() {
  const ref = useRef<HTMLElement>(null);
  useGSAP(() => {
    if (prefersReducedMotion()) return;
    const cards = gsap.utils.toArray<HTMLElement>(".step-card");
    cards.forEach((card, i) => {
      const nextCard = cards[i + 1];
      if (!nextCard) return;
      gsap.fromTo(card, { scale: 1, filter: "brightness(1)" }, { scale: 0.92, filter: "brightness(0.9)", ease: "none", scrollTrigger: { trigger: nextCard, start: "top bottom", end: "top 14%", scrub: true } });
    });
  }, { scope: ref });
  return (
    <section ref={ref} className="wrap pb-[clamp(80px,12vw,160px)]" aria-label="Cara kerja">
      <SectionHead label="Cara kerja" title={<>Empat langkah, <span className="serif-accent">satu menit</span> menunggu.</>} count={4} />
      <ol className="relative">
        {STEPS.map((s, i) => (
          <li key={s.n} className="step-card sticky mb-6 origin-top" style={{ top: `calc(10vh + ${i * 16}px)` }}>
            <div className="grid overflow-hidden rounded-[28px] shadow-[0_1px_0_rgba(27,23,20,.06),0_30px_60px_-40px_rgba(27,23,20,.35)] md:h-[min(78vh,720px)] md:grid-cols-[1.15fr_1fr]" style={{ backgroundColor: s.color }}>
              <div className="flex flex-col gap-10 p-[clamp(24px,4vw,56px)] md:justify-between">
                <div className="flex items-center gap-3">
                  <span className="meta rounded-full bg-ink px-3 py-1.5 text-paper">Langkah {s.n}</span>
                  <span className="meta tabular-nums text-ink-soft">/ {String(STEPS.length).padStart(2, "0")}</span>
                </div>
                <div>
                  <h3 className="display mb-5 text-[clamp(2.4rem,5vw,4.6rem)]">{s.title}</h3>
                  <p className="max-w-md text-[17px] leading-relaxed text-ink-soft">{s.body}</p>
                </div>
                <ul className="grid gap-0 border-t border-ink/15 text-[15px]">
                  {s.points.map((pt) => (
                    <li key={pt} className="flex items-center gap-3 border-b border-ink/15 py-3">
                      <span aria-hidden className="h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />{pt}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="relative hidden items-center justify-center overflow-hidden md:flex">
                {/* Nomor besar samar di belakang ponsel */}
                <span aria-hidden className="display pointer-events-none absolute -right-[4%] bottom-[-8%] select-none text-[clamp(10rem,24vw,22rem)] leading-none text-ink/[0.06]">{s.n}</span>
                <span aria-hidden className="absolute h-[70%] w-[70%] rounded-full bg-paper/50 blur-3xl" />
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={s.image} alt={`Contoh tampilan: ${s.title}`} loading="lazy" className="relative h-[84%] w-auto object-contain drop-shadow-[0_30px_40px_rgba(27,23,20,.28)]" />
              </div>
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}

/** Katalog template sebagai daftar tipografi (pola Locomotive): thumbnail mengikuti kursor saat baris di-hover. */
export function TemplateList({ heading = true }: { heading?: boolean }) {
  const ref = useRef<HTMLElement>(null);
  const thumb = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState<number | null>(null);
  useGSAP(() => {
    if (!isFinePointer() || prefersReducedMotion()) return;
    const el = thumb.current!;
    const x = gsap.quickTo(el, "x", { duration: 0.6, ease: "power3.out" });
    const y = gsap.quickTo(el, "y", { duration: 0.6, ease: "power3.out" });
    // Thumbnail di kanan kursor agar nama template yang di-hover tetap terbaca.
    const move = (e: PointerEvent) => { x(e.clientX + 170); y(e.clientY); };
    window.addEventListener("pointermove", move);
    return () => window.removeEventListener("pointermove", move);
  }, { scope: ref });
  useGSAP(() => {
    if (!thumb.current) return;
    gsap.to(thumb.current, { scale: active == null ? 0 : 1, opacity: active == null ? 0 : 1, duration: 0.6, ease: "expo.out" });
  }, { dependencies: [active] });

  return (
    <section ref={ref} className="wrap pb-[clamp(80px,12vw,160px)]" aria-label="Template">
      {heading ? <SectionHead label="Template" title={<>Pilih gaya, <span className="serif-accent">AI</span> menyusun sisanya.</>} count={TEMPLATES.length} /> : null}
      <ul onPointerLeave={() => setActive(null)}>
        {TEMPLATES.map((t, i) => (
          <li key={t.slug} className="rule last:border-b last:border-line">
            <Link href={`/template/${t.slug}`} data-cursor="Lihat" onPointerEnter={() => setActive(i)} onFocus={() => setActive(i)} onBlur={() => setActive(null)}
              className={`group grid grid-cols-[auto_1fr_auto] items-center gap-4 py-5 transition-colors duration-500 md:gap-8 md:py-6 ${active != null && active !== i ? "text-ink/30" : "text-ink"}`}>
              <span className="meta w-10 tabular-nums text-ink-soft">{String(i + 1).padStart(2, "0")}</span>
              <span className="display text-[clamp(1.9rem,5.4vw,5.6rem)] leading-[1] transition-transform duration-700 ease-[cubic-bezier(.19,1,.22,1)] group-hover:translate-x-3">{t.name}</span>
              <span className="flex items-center gap-4">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={t.image} alt="" loading="lazy" className="h-16 w-auto object-contain drop-shadow md:hidden" />
                <span className="meta hidden text-ink-soft md:inline">{t.style}</span>
              </span>
            </Link>
          </li>
        ))}
      </ul>
      <div ref={thumb} aria-hidden className="pointer-events-none fixed left-0 top-0 z-30 hidden aspect-[388/807] w-[210px] -translate-x-1/2 -translate-y-1/2 scale-0 opacity-0 md:block">
        {TEMPLATES.map((t, i) => (
          // eslint-disable-next-line @next/next/no-img-element
          <img key={t.slug} src={t.image} alt="" className={`absolute inset-0 h-full w-full object-contain drop-shadow-[0_24px_32px_rgba(27,23,20,.3)] transition-opacity duration-300 ${active === i ? "opacity-100" : "opacity-0"}`} />
        ))}
      </div>
    </section>
  );
}

/** Fitur sebagai daftar bernomor dengan garis tipis, bukan kartu ikon. */
export function Features() {
  return (
    <section className="bg-night py-[clamp(96px,14vw,200px)] text-paper" aria-label="Fitur">
      <div className="wrap">
        <SectionHead dark label="Fitur" title={<>Semua yang dibutuhkan, <span className="serif-accent text-accent-soft">tanpa ribet.</span></>} count={FEATURES.length} />
        <FadeUp className="grid md:grid-cols-2 md:gap-x-16">
          {FEATURES.map((f, i) => (
            <div key={f.title} className="grid grid-cols-[3rem_1fr] gap-4 border-t border-night-line py-8">
              <span className="meta pt-2 tabular-nums text-paper/40">({String(i + 1).padStart(2, "0")})</span>
              <div>
                <h3 className="mb-3 text-[clamp(1.4rem,2.2vw,2rem)] font-medium tracking-tight">{f.title}</h3>
                <p className="max-w-md text-[16px] leading-relaxed text-paper/60">{f.body}</p>
              </div>
            </div>
          ))}
        </FadeUp>
      </div>
    </section>
  );
}

export function Pricing({ heading = true }: { heading?: boolean }) {
  return (
    <section className={`wrap ${heading ? "py-[clamp(96px,14vw,200px)]" : "pb-[clamp(96px,14vw,200px)]"}`} aria-label="Harga" id="harga">
      {heading ? <SectionHead label="Harga" title={<>Bayar sekali, <span className="serif-accent text-accent">tanpa langganan.</span></>} /> : null}
      <FadeUp className="grid gap-6 md:grid-cols-2">
        {PLANS.map((p) => (
          <div key={p.name} className={`flex flex-col rounded-[28px] p-[clamp(24px,3.5vw,48px)] ${p.highlight ? "bg-ink text-paper" : "border border-line"}`}>
            <div className="mb-10 flex items-baseline justify-between">
              <span className="meta opacity-60">{p.name}</span>
              {p.highlight ? <span className="meta rounded-full bg-accent px-3 py-1 text-paper">Paling lengkap</span> : null}
            </div>
            <p className="display text-[clamp(3.2rem,7vw,6rem)] tabular-nums">{p.price}</p>
            <p className="mb-10 mt-2 text-[15px] opacity-60">{p.note}</p>
            <ul className="mb-10 space-y-3 text-[16px]">
              {p.items.map((it) => (<li key={it} className="flex gap-3"><span aria-hidden className={p.highlight ? "text-accent-soft" : "text-accent"}>✓</span>{it}</li>))}
            </ul>
            <div className="mt-auto">
              <MagneticButton href={appLink("/daftar")} variant={p.highlight ? "light" : "solid"}>{p.cta}</MagneticButton>
            </div>
          </div>
        ))}
      </FadeUp>
    </section>
  );
}

/** Akordeon FAQ memakai <details> agar tetap berfungsi tanpa JS. */
export function Faq() {
  return (
    <section className="wrap pb-[clamp(96px,14vw,200px)]" aria-label="Pertanyaan umum" id="faq">
      <SectionHead label="FAQ" title="Pertanyaan yang sering muncul." count={FAQ.length} />
      <div className="md:ml-[25%]">
        {FAQ.map((f) => (
          <details key={f.q} className="group rule last:border-b last:border-line">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-6 py-6 text-[clamp(1.2rem,2vw,1.6rem)] font-medium tracking-tight [&::-webkit-details-marker]:hidden">
              {f.q}
              <span aria-hidden className="text-2xl text-accent transition-transform duration-500 group-open:rotate-45">+</span>
            </summary>
            <p className="max-w-2xl pb-8 text-[17px] leading-relaxed text-ink-soft">{f.a}</p>
          </details>
        ))}
      </div>
    </section>
  );
}
