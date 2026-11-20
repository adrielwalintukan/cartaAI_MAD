import { Hero } from "@/components/hero/Hero";
import { Marquee } from "@/components/motion/Marquee";
import { Faq, Features, Manifesto, Pricing, ProcessStack, TemplateList } from "@/components/sections/Sections";

export default function Home() {
  return (
    <>
      <Hero />
      <Manifesto />
      <Marquee items={["Elegan", "Formal", "Simple", "Mewah", "Tradisional", "Minimalis"]} className="display mb-[clamp(80px,12vw,160px)] border-y border-line py-6 text-[clamp(3rem,9vw,9rem)] leading-none" />
      <ProcessStack />
      <TemplateList />
      <Features />
      <Pricing />
      <Faq />
    </>
  );
}
