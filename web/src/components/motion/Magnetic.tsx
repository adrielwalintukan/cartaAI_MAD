"use client";
import Link from "next/link";
import { useRef, type ReactNode } from "react";
import { gsap, isFinePointer, prefersReducedMotion, useGSAP } from "@/lib/gsap";

type Props = { href: string; children: ReactNode; variant?: "solid" | "outline" | "light"; className?: string; external?: boolean };

const LOOK = {
  solid: "bg-ink text-paper hover:bg-accent",
  outline: "border border-ink/80 text-ink hover:bg-ink hover:text-paper",
  light: "bg-paper text-ink hover:bg-accent hover:text-paper",
};

/** Tombol pil yang tertarik ke kursor (mouse saja). Teksnya bergeser sedikit lebih jauh agar terasa berlapis. */
export function MagneticButton({ href, children, variant = "solid", className = "", external }: Props) {
  const ref = useRef<HTMLAnchorElement>(null);
  useGSAP(() => {
    if (!isFinePointer() || prefersReducedMotion()) return;
    const el = ref.current!;
    const label = el.querySelector("span")!;
    const xTo = gsap.quickTo(el, "x", { duration: 0.7, ease: "power3.out" });
    const yTo = gsap.quickTo(el, "y", { duration: 0.7, ease: "power3.out" });
    const lx = gsap.quickTo(label, "x", { duration: 0.7, ease: "power3.out" });
    const ly = gsap.quickTo(label, "y", { duration: 0.7, ease: "power3.out" });
    const move = (e: PointerEvent) => {
      const r = el.getBoundingClientRect();
      const dx = e.clientX - r.left - r.width / 2, dy = e.clientY - r.top - r.height / 2;
      xTo(dx * 0.3); yTo(dy * 0.35); lx(dx * 0.12); ly(dy * 0.12);
    };
    const leave = () => { xTo(0); yTo(0); lx(0); ly(0); };
    el.addEventListener("pointermove", move); el.addEventListener("pointerleave", leave);
    return () => { el.removeEventListener("pointermove", move); el.removeEventListener("pointerleave", leave); };
  }, { scope: ref });

  const cls = `inline-flex h-14 items-center justify-center rounded-full px-8 text-[15px] font-medium tracking-tight transition-colors duration-500 ${LOOK[variant]} ${className}`;
  return external || href.startsWith("http")
    ? <a ref={ref} href={href} className={cls}><span className="inline-block">{children}</span></a>
    : <Link ref={ref} href={href} className={cls}><span className="inline-block">{children}</span></Link>;
}
