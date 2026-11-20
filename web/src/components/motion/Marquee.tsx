"use client";
import { useRef } from "react";
import { gsap, prefersReducedMotion, ScrollTrigger, useGSAP } from "@/lib/gsap";

/** Teks besar berjalan; kecepatan dan arahnya mengikuti kecepatan scroll. Isi diulang dua kali agar loop mulus. */
export function Marquee({ items, className = "" }: { items: string[]; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  useGSAP(() => {
    if (prefersReducedMotion()) return;
    const row = ref.current!.querySelector(".mq-row")!;
    const loop = gsap.to(row, { xPercent: -50, repeat: -1, duration: 28, ease: "none" });
    let dir = 1;
    const st = ScrollTrigger.create({
      onUpdate: (s) => {
        dir = s.direction;
        const v = gsap.utils.clamp(1, 5, Math.abs(s.getVelocity()) / 400);
        gsap.to(loop, { timeScale: v * dir, duration: 0.25, overwrite: true });
        gsap.to(loop, { timeScale: dir, duration: 1.2, delay: 0.25, overwrite: false });
      },
    });
    return () => st.kill();
  }, { scope: ref });

  const content = items.map((t, i) => (
    <span key={i} className="flex items-center gap-[4vw] pr-[4vw]">
      <span>{t}</span><span aria-hidden className="serif-accent text-accent">✳</span>
    </span>
  ));
  return (
    <div ref={ref} className={`overflow-hidden whitespace-nowrap ${className}`} aria-label={items.join(", ")}>
      <div className="mq-row inline-flex" aria-hidden>{content}{content}</div>
    </div>
  );
}
