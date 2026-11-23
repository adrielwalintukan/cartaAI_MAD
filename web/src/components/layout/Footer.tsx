import Link from "next/link";
import { MagneticButton } from "@/components/motion/Magnetic";
import { SplitReveal } from "@/components/motion/Reveal";
import { appLink } from "@/lib/site";

const COLS = [
  { title: "Produk", links: [{ href: "/template", label: "Template" }, { href: "/harga", label: "Harga" }, { href: appLink("/daftar"), label: "Buat undangan" }] },
  { title: "Perusahaan", links: [{ href: "/tentang", label: "Tentang kami" }, { href: "/harga#faq", label: "Pertanyaan umum" }, { href: appLink("/masuk"), label: "Masuk" }] },
  { title: "Legal", links: [{ href: "/kebijakan-privasi", label: "Kebijakan Privasi" }, { href: "/syarat-ketentuan", label: "Syarat & Ketentuan" }] },
];

export function Footer() {
  return (
    <footer className="bg-night text-paper">
      <div className="wrap pb-10 pt-[clamp(80px,14vw,200px)]">
        <p className="meta mb-6 text-paper/50">(Mulai sekarang)</p>
        <SplitReveal as="h2" className="display h-lg max-w-[14ch]">
          Hari bahagiamu layak dapat <span className="serif-accent text-accent-soft">undangan yang indah.</span>
        </SplitReveal>
        <div className="mt-10 flex flex-wrap gap-3">
          <MagneticButton href={appLink("/daftar")} variant="light">Buat undangan gratis</MagneticButton>
          <MagneticButton href="/template" variant="outline" className="!border-paper/40 !text-paper hover:!bg-paper hover:!text-ink">Lihat template</MagneticButton>
        </div>

        <div className="mt-[clamp(80px,12vw,160px)] grid grid-cols-2 gap-8 border-t border-night-line pt-10 md:grid-cols-4">
          <p className="col-span-2 max-w-xs text-[14px] text-paper/60 md:col-span-1">Undangan pernikahan digital yang disusun AI. Dibuat di Indonesia.</p>
          {COLS.map((c) => (
            <div key={c.title}>
              <p className="meta mb-4 text-paper/40">{c.title}</p>
              <ul className="space-y-2 text-[15px]">
                {c.links.map((l) => (
                  <li key={l.label}>
                    {l.href.startsWith("http") ? <a className="link-draw" href={l.href}>{l.label}</a> : <Link className="link-draw" href={l.href}>{l.label}</Link>}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <p aria-hidden className="display mt-16 select-none text-center text-[23vw] leading-[0.8] text-paper/[0.06]">CartaAI</p>
        <div className="meta mt-6 flex flex-wrap justify-between gap-2 text-paper/40">
          <span>© {new Date().getFullYear()} CartaAI. Semua hak dilindungi.</span>
          <span>Manado, Indonesia</span>
        </div>
      </div>
    </footer>
  );
}
