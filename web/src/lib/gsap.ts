"use client";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";
import { useGSAP } from "@gsap/react";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger, SplitText, useGSAP);
  gsap.defaults({ ease: "expo.out", duration: 1.2 });
}

export { gsap, ScrollTrigger, SplitText, useGSAP };

export const prefersReducedMotion = () =>
  typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

export const isFinePointer = () => typeof window !== "undefined" && window.matchMedia("(pointer: fine)").matches;

/** Preloader menandai halaman siap (atau langsung siap bila intro dilewati). Animasi hero menunggu ini. */
export function onReady(cb: () => void) {
  if ((window as unknown as { __cartaReady?: boolean }).__cartaReady) { cb(); return () => {}; }
  window.addEventListener("carta:ready", cb, { once: true });
  return () => window.removeEventListener("carta:ready", cb);
}
export function markReady() {
  (window as unknown as { __cartaReady?: boolean }).__cartaReady = true;
  window.dispatchEvent(new Event("carta:ready"));
}
