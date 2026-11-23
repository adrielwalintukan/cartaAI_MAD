"use client";
import { createElement, useRef, type ElementType, type ReactNode } from "react";
import { gsap, onReady, prefersReducedMotion, ScrollTrigger, SplitText, useGSAP } from "@/lib/gsap";

type Props = { as?: ElementType; className?: string; children: ReactNode; delay?: number; onLoad?: boolean; id?: string };

/**
 * Judul muncul baris per baris dari balik masker. `onLoad`: menunggu preloader (hero); selain itu saat masuk layar.
 * Tanpa JS / reduced-motion: teks tampil apa adanya.
 */
export function SplitReveal({ as = "h2", className, children, delay = 0, onLoad, id }: Props) {
  const ref = useRef<HTMLElement>(null);
  useGSAP(() => {
    if (prefersReducedMotion()) return;
    const el = ref.current!;
    let off = () => {};
    const split = SplitText.create(el, {
      type: "lines", mask: "lines", linesClass: "sl", autoSplit: true,
      onSplit: (self) => {
        const tw = gsap.from(self.lines, { yPercent: 110, duration: 1.3, stagger: 0.08, delay, paused: true });
        if (onLoad) off = onReady(() => tw.play());
        else ScrollTrigger.create({ trigger: el, start: "top 88%", once: true, onEnter: () => tw.play() });
        return tw;
      },
    });
    return () => { off(); split.revert(); };
  }, { scope: ref });
  return createElement(as, { ref, className, id }, children);
}

/** Gambar/blok terbuka dari bawah (clip-path) sambil isi di dalamnya mengecil 1,2 -> 1. */
export function ClipReveal({ className, children, inner = ".clip-inner" }: { className?: string; children: ReactNode; inner?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  useGSAP(() => {
    if (prefersReducedMotion()) return;
    const el = ref.current!;
    gsap.timeline({ scrollTrigger: { trigger: el, start: "top 85%", once: true } })
      .fromTo(el, { clipPath: "inset(100% 0% 0% 0%)" }, { clipPath: "inset(0% 0% 0% 0%)", duration: 1.4 })
      .fromTo(el.querySelectorAll(inner), { scale: 1.2 }, { scale: 1, duration: 1.8 }, 0);
  }, { scope: ref });
  return <div ref={ref} className={className}>{children}</div>;
}

/** Elemen kecil (paragraf, meta) memudar naik saat masuk layar, berurutan. */
export function FadeUp({ className, children, stagger = 0.08 }: { className?: string; children: ReactNode; stagger?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  useGSAP(() => {
    if (prefersReducedMotion()) return;
    gsap.from(ref.current!.children, { y: 28, opacity: 0, duration: 1.1, stagger, scrollTrigger: { trigger: ref.current, start: "top 88%", once: true } });
  }, { scope: ref });
  return <div ref={ref} className={className}>{children}</div>;
}
