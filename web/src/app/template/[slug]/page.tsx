import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { MagneticButton } from "@/components/motion/Magnetic";
import { ClipReveal, FadeUp, SplitReveal } from "@/components/motion/Reveal";
import { PhonePreview } from "@/components/sections/PhonePreview";
import { appLink, previewSrc, TEMPLATES } from "@/lib/site";

export const dynamicParams = false;
export function generateStaticParams() { return TEMPLATES.map((t) => ({ slug: t.slug })); }

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const t = TEMPLATES.find((x) => x.slug === slug);
  return t ? { title: `Template ${t.name}`, description: t.description } : {};
}

export default async function TemplateDetail({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const i = TEMPLATES.findIndex((x) => x.slug === slug);
  if (i < 0) notFound();
  const t = TEMPLATES[i];
  const next = TEMPLATES[(i + 1) % TEMPLATES.length];
  const dark = t.slug === "elegan-mewah";

  return (
    <article>
      <section className={`wrap grid gap-12 pb-24 pt-[clamp(110px,14vw,180px)] md:grid-cols-[1.1fr_1fr] md:items-end ${dark ? "bg-night text-paper" : ""}`} style={dark ? undefined : { backgroundColor: t.palette }}>
        <div className="md:pb-10">
          <Link href="/template" className="meta link-draw mb-8 inline-block opacity-60">← Semua template</Link>
          <p className="meta mb-5 opacity-60">({String(i + 1).padStart(2, "0")} / {t.style})</p>
          <SplitReveal as="h1" onLoad className="display h-xl max-w-[9ch]">{t.name}</SplitReveal>
          <FadeUp className="mt-10 max-w-md space-y-6">
            <p className="text-[19px] leading-relaxed opacity-75">{t.description}</p>
            <div className="flex flex-wrap gap-3">
              <MagneticButton href={appLink("/daftar")} variant={dark ? "light" : "solid"}>Gunakan gaya ini</MagneticButton>
            </div>
          </FadeUp>
        </div>
        <div className="mx-auto w-[min(66vw,330px)] md:ml-auto md:mr-[6vw]">
          <ClipReveal className="overflow-visible">
            <PhonePreview className="clip-inner" src={previewSrc(t)} title={`Contoh undangan bergaya ${t.name}`} />
          </ClipReveal>
          <p className="meta mt-6 text-center opacity-60">Scroll di dalam ponsel untuk melihat seluruh undangan</p>
        </div>
      </section>

      <section className="wrap grid gap-10 py-[clamp(80px,12vw,160px)] md:grid-cols-3">
        {[
          { h: "Cara memakainya", b: "Pilih gaya ini saat membuat undangan. AI memakai palet, suasana, dan jenis hurufnya sebagai arahan, lalu menyusun tata letak dari datamu." },
          { h: "Tips", b: "Gunakan foto beresolusi tinggi (paket Premium) agar undangan terlihat jernih di semua perangkat." },
          { h: "Ketersediaan", b: "Gaya ini tersedia untuk semua paket, Gratis maupun Premium." },
        ].map((x) => (
          <div key={x.h} className="rule pt-6">
            <h2 className="mb-3 text-[22px] font-medium tracking-tight">{x.h}</h2>
            <p className="text-[16px] leading-relaxed text-ink-soft">{x.b}</p>
          </div>
        ))}
      </section>

      <Link href={`/template/${next.slug}`} data-cursor="Buka" className="group wrap block border-t border-line py-[clamp(64px,10vw,140px)]">
        <p className="meta mb-4 text-ink-soft">(Berikutnya)</p>
        <p className="display h-lg transition-transform duration-700 ease-[cubic-bezier(.19,1,.22,1)] group-hover:translate-x-4">{next.name} →</p>
      </Link>
    </article>
  );
}
