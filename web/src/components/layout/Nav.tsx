"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { appLink, NAV } from "@/lib/site";
import { gsap, prefersReducedMotion } from "@/lib/gsap";
import { getLenis } from "@/components/motion/SmoothScroll";

/** Satu baris teks kecil (ala Locomotive). Di puncak halaman memakai mix-blend-difference; setelah scroll berlatar solid agar tidak bertabrakan dengan judul. */
export function Nav() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const panel = useRef<HTMLDivElement>(null);

  useEffect(() => setOpen(false), [pathname]);
  // Sembunyi saat scroll ke bawah, muncul saat scroll ke atas (agar tidak menimpa judul besar).
  const [hidden, setHidden] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    let last = window.scrollY;
    const onScroll = () => { const y = window.scrollY; setHidden(y > 120 && y > last); setScrolled(y > 40); last = y; };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  useEffect(() => {
    const lenis = getLenis();
    if (open) lenis?.stop(); else lenis?.start();
    if (!panel.current || prefersReducedMotion()) return;
    if (open) gsap.fromTo(panel.current.querySelectorAll(".mn-item"), { yPercent: 110 }, { yPercent: 0, duration: 1, stagger: 0.06, delay: 0.15 });
  }, [open]);

  return (
    <>
      <header className={`wrap fixed inset-x-0 top-0 z-50 flex h-16 items-center justify-between transition-[transform,background-color] duration-700 ease-[cubic-bezier(.19,1,.22,1)] ${scrolled && !open ? "bg-paper/85 text-ink shadow-[0_1px_0_var(--color-line)] backdrop-blur-md" : "text-paper mix-blend-difference"} ${hidden && !open ? "-translate-y-full" : ""}`} onFocusCapture={() => setHidden(false)}>
        <Link href="/" className="text-[15px] font-semibold tracking-tight" aria-label="CartaAI, beranda">
          Carta<span className="serif-accent text-[17px]">AI</span><sup className="ml-0.5 text-[9px]">®</sup>
        </Link>
        <nav aria-label="Utama" className="hidden gap-7 text-[14px] md:flex">
          {[{ href: "/", label: "Beranda" }, ...NAV].map((n) => {
            const on = n.href === "/" ? pathname === "/" : pathname.startsWith(n.href);
            return <Link key={n.href} href={n.href} className={`link-draw ${on ? "bg-[length:100%_1px]" : ""}`} aria-current={on ? "page" : undefined}>{n.label}</Link>;
          })}
        </nav>
        <div className="hidden items-center gap-6 text-[14px] md:flex">
          <a href={appLink("/masuk")} className="link-draw">Masuk</a>
          <a href={appLink("/daftar")} className="link-draw font-medium">Buat undangan ↗</a>
        </div>
        <button type="button" onClick={() => setOpen((o) => !o)} aria-expanded={open} aria-controls="mobile-menu" className="flex h-11 items-center text-[14px] md:hidden">
          {open ? "Tutup" : "Menu"}
        </button>
      </header>

      <div ref={panel} id="mobile-menu" hidden={!open} className="fixed inset-0 z-40 flex flex-col justify-end bg-night px-4 pb-10 text-paper md:hidden">
        <nav aria-label="Menu ponsel" className="flex flex-col gap-1">
          {[...NAV, { href: "/", label: "Beranda" }].map((n) => (
            <Link key={n.href} href={n.href} className="line-mask display text-[15vw]"><span className="mn-item inline-block">{n.label}</span></Link>
          ))}
        </nav>
        <div className="rule mt-8 flex justify-between border-night-line pt-5 text-[15px]">
          <a href={appLink("/masuk")}>Masuk</a>
          <a href={appLink("/daftar")} className="text-accent-soft">Buat undangan ↗</a>
        </div>
      </div>
    </>
  );
}
