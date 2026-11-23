"use client";
import { useRef } from "react";
import { gsap, markReady, prefersReducedMotion, useGSAP } from "@/lib/gsap";

/**
 * Momen loading (< 1,5 dtk): hitungan 0-100 + wordmark, lalu tirai naik dan menyerahkan ke animasi hero.
 * Dilewati pada kunjungan berikutnya di sesi yang sama (skrip di <head> menandai html[data-intro="seen"]).
 */
export function Preloader() {
  const root = useRef<HTMLDivElement>(null);
  const count = useRef<HTMLSpanElement>(null);

  useGSAP(() => {
    const el = root.current!;
    const seen = document.documentElement.dataset.intro === "seen";
    if (seen || prefersReducedMotion()) { el.remove(); markReady(); return; }
    try { sessionStorage.setItem("carta-intro", "1"); } catch {}
    const n = { v: 0 };
    gsap.timeline({ onComplete: () => { el.remove(); } })
      .to(n, { v: 100, duration: 1.1, ease: "power2.inOut", onUpdate: () => { if (count.current) count.current.textContent = String(Math.round(n.v)).padStart(3, "0"); } })
      .from(".pl-word", { yPercent: 110, duration: 1, stagger: 0.06 }, 0.05)
      .to(".pl-word", { yPercent: -110, duration: 0.7, ease: "expo.in", stagger: 0.03 }, ">-0.05")
      .add(markReady, ">-0.2")
      .to(el, { clipPath: "inset(0% 0% 100% 0%)", duration: 1, ease: "expo.inOut" }, "<");
  }, { scope: root });

  return (
    <div ref={root} id="preloader" aria-hidden className="fixed inset-0 z-[100] flex flex-col justify-between bg-night p-[clamp(16px,4vw,56px)] text-paper" style={{ clipPath: "inset(0% 0% 0% 0%)" }}>
      <div className="meta flex justify-between opacity-60"><span>CartaAI</span><span>Undangan pernikahan digital</span></div>
      <div className="flex items-end justify-between gap-6">
        <p className="display text-[clamp(3rem,12vw,10rem)]">
          <span className="line-mask"><span className="pl-word inline-block">Carta<span className="serif-accent text-accent-soft">AI</span></span></span>
        </p>
        <span ref={count} className="display tabular-nums text-[clamp(2rem,6vw,5rem)] opacity-80">000</span>
      </div>
    </div>
  );
}
