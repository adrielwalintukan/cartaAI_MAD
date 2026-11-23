import type { Metadata } from "next";
import { MagneticButton } from "@/components/motion/Magnetic";
import { ClipReveal, FadeUp } from "@/components/motion/Reveal";
import { PageHead } from "@/components/sections/PageHead";
import { SectionHead } from "@/components/sections/Sections";
import { appLink, STEPS } from "@/lib/site";

export const metadata: Metadata = { title: "Tentang", description: "Visi, misi, dan cara kerja CartaAI: undangan pernikahan digital yang disusun AI dalam hitungan menit." };

const VALUES = [
  { title: "Desain unik", body: "AI menyusun karya yang orisinal dari data dan selera kalian, bukan menempelkan nama ke template yang sama untuk semua orang." },
  { title: "Personalisasi", body: "Setiap detail, dari huruf hingga ornamen, mencerminkan kepribadian dan kisah kalian." },
  { title: "Cepat & hemat", body: "Dari ide ke undangan siap kirim hanya dalam hitungan menit, tanpa biaya cetak berlebihan." },
];

export default function TentangPage() {
  return (
    <>
      <PageHead
        label="Tentang"
        title={<>Undangan yang <span className="serif-accent text-accent">bermakna,</span> tanpa repot.</>}
        intro="CartaAI adalah platform undangan pernikahan digital. Kamu mengisi data pernikahan, AI merancang undangannya, dan kamu membagikannya lewat satu link lengkap dengan RSVP dan link pribadi untuk setiap tamu."
      />

      <section className="wrap grid gap-6 pb-[clamp(80px,12vw,160px)] md:grid-cols-2">
        <ClipReveal className="overflow-hidden rounded-[28px] bg-night p-[clamp(28px,4vw,56px)] text-paper">
          <div className="clip-inner">
            <p className="meta mb-10 text-paper/50">(Visi)</p>
            <p className="display text-[clamp(1.8rem,3.2vw,3rem)] leading-[1.05]">Menjadi solusi terdepan untuk undangan pernikahan digital yang menggabungkan keindahan desain, personalisasi mendalam, dan kecanggihan AI, tanpa kompromi pada makna.</p>
          </div>
        </ClipReveal>
        <ClipReveal className="overflow-hidden rounded-[28px] bg-accent-soft p-[clamp(28px,4vw,56px)]">
          <div className="clip-inner">
            <p className="meta mb-10 text-ink-soft">(Misi)</p>
            <p className="display text-[clamp(1.8rem,3.2vw,3rem)] leading-[1.05]">Memberikan pengalaman membuat undangan dalam hitungan menit, dengan desain eksklusif yang bukan template, dan ramah lingkungan karena tanpa cetak.</p>
          </div>
        </ClipReveal>
      </section>

      <section className="wrap pb-[clamp(80px,12vw,160px)]">
        <SectionHead label="Keunggulan" title="Kenapa memilih CartaAI." count={VALUES.length} />
        <FadeUp className="grid gap-10 md:grid-cols-3">
          {VALUES.map((v, i) => (
            <div key={v.title} className="rule pt-6">
              <p className="meta mb-6 text-ink-soft">({String(i + 1).padStart(2, "0")})</p>
              <h3 className="mb-3 text-[clamp(1.5rem,2.4vw,2.2rem)] font-medium tracking-tight">{v.title}</h3>
              <p className="text-[16px] leading-relaxed text-ink-soft">{v.body}</p>
            </div>
          ))}
        </FadeUp>
      </section>

      <section className="wrap pb-[clamp(96px,14vw,200px)]">
        <SectionHead label="Alur" title={<>Dari ide ke undangan, <span className="serif-accent">empat langkah.</span></>} />
        <ol>
          {STEPS.map((s) => (
            <li key={s.n} className="rule grid gap-4 py-8 md:grid-cols-[8rem_1fr_1.2fr] md:items-baseline">
              <span className="display text-[clamp(2.4rem,4vw,3.6rem)] tabular-nums text-accent">{s.n}</span>
              <h3 className="display text-[clamp(1.8rem,3.4vw,3.2rem)]">{s.title}</h3>
              <p className="max-w-md text-[17px] leading-relaxed text-ink-soft">{s.body}</p>
            </li>
          ))}
        </ol>
        <div className="mt-14"><MagneticButton href={appLink("/daftar")}>Coba sekarang, gratis</MagneticButton></div>
      </section>
    </>
  );
}
