"use client";
import { useEffect, useRef, useState } from "react";

const W = 386, H = 805; // ukuran ponsel (bezel 9px); layar 368x787 seperti ponsel sungguhan

/** Ponsel berisi undangan asli (halaman statis di /preview) yang bisa di-scroll seperti buatan pengguna. */
export function PhonePreview({ src, title, className = "" }: { src: string; title: string; className?: string }) {
  const box = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0.8);
  useEffect(() => {
    const el = box.current;
    if (!el) return;
    const fit = () => setScale(el.clientWidth / W);
    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  return (
    <div ref={box} className={`relative w-full ${className}`} style={{ aspectRatio: `${W} / ${H}` }}>
      <div className="absolute left-0 top-0 origin-top-left" style={{ width: W, height: H, transform: `scale(${scale})` }}>
        <div className="relative h-full w-full rounded-[58px] bg-[#111113] p-[9px] shadow-[0_40px_60px_-24px_rgba(0,0,0,.5)] ring-1 ring-white/10">
          <iframe
            title={title}
            src={src}
            loading="lazy"
            sandbox="allow-scripts allow-same-origin allow-popups"
            className="h-full w-full rounded-[50px] bg-white"
            style={{ border: 0 }}
          />
          <span aria-hidden className="pointer-events-none absolute left-1/2 top-[18px] h-[24px] w-[88px] -translate-x-1/2 rounded-full bg-black" />
        </div>
      </div>
    </div>
  );
}
