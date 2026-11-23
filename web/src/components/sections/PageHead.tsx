import { SplitReveal } from "@/components/motion/Reveal";

/** Pembuka halaman dalam: label kecil, judul raksasa, ringkasan pendek. */
export function PageHead({ label, title, intro, count }: { label: string; title: React.ReactNode; intro?: string; count?: number }) {
  return (
    <header className="wrap pb-[clamp(56px,8vw,120px)] pt-[clamp(120px,18vw,240px)]">
      <p className="meta mb-6 text-ink-soft">({label})</p>
      <div className="flex items-end justify-between gap-6">
        <SplitReveal as="h1" onLoad className="display h-xl max-w-[12ch]">{title}</SplitReveal>
        {count != null ? <span className="display h-md hidden tabular-nums opacity-80 md:block">({String(count).padStart(2, "0")})</span> : null}
      </div>
      {intro ? <p className="mt-10 max-w-xl text-[18px] leading-relaxed text-ink-soft md:ml-[40%]">{intro}</p> : null}
    </header>
  );
}

/** Halaman teks panjang (legal): lebar baca nyaman, judul bagian jelas. */
export function Prose({ children }: { children: React.ReactNode }) {
  return (
    <div className="wrap pb-[clamp(96px,14vw,200px)]">
      <div className="max-w-[68ch] space-y-5 text-[17px] leading-relaxed text-ink-soft md:ml-[25%] [&_h2]:mt-14 [&_h2]:text-[clamp(1.5rem,2.4vw,2.1rem)] [&_h2]:font-medium [&_h2]:tracking-tight [&_h2]:text-ink [&_li]:ml-5 [&_li]:list-disc [&_strong]:text-ink">
        {children}
      </div>
    </div>
  );
}
