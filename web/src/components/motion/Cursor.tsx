"use client";
import { useEffect, useRef, useState } from "react";
import { gsap, isFinePointer, prefersReducedMotion } from "@/lib/gsap";

/** Titik kursor yang membesar di atas elemen [data-cursor="Label"]. Hanya untuk mouse; kursor asli tetap ada. */
export function Cursor() {
  const dot = useRef<HTMLDivElement>(null);
  const [label, setLabel] = useState("");
  const [on, setOn] = useState(false);

  useEffect(() => {
    if (!isFinePointer() || prefersReducedMotion()) return;
    setOn(true);
    const el = dot.current!;
    const x = gsap.quickTo(el, "x", { duration: 0.18, ease: "power3.out" });
    const y = gsap.quickTo(el, "y", { duration: 0.18, ease: "power3.out" });
    const move = (e: PointerEvent) => {
      x(e.clientX); y(e.clientY);
      const t = (e.target as Element | null)?.closest?.("[data-cursor]");
      const next = t?.getAttribute("data-cursor") ?? "";
      setLabel((prev) => (prev === next ? prev : next));
    };
    window.addEventListener("pointermove", move);
    return () => window.removeEventListener("pointermove", move);
  }, []);

  useEffect(() => {
    if (!dot.current) return;
    gsap.to(dot.current, { width: label ? 88 : 10, height: label ? 88 : 10, duration: 0.5, ease: "expo.out" });
  }, [label]);

  if (!on) return null;
  return (
    <div ref={dot} aria-hidden className="pointer-events-none fixed left-0 top-0 z-[90] flex h-[10px] w-[10px] -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-accent text-[11px] font-medium uppercase tracking-wider text-paper">
      <span className={label ? "opacity-100 transition-opacity delay-150" : "opacity-0"}>{label}</span>
    </div>
  );
}
