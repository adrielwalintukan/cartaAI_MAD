import type { Metadata } from "next";
import { PageHead } from "@/components/sections/PageHead";
import { TemplateList } from "@/components/sections/Sections";
import { TEMPLATES } from "@/lib/site";

export const metadata: Metadata = { title: "Template", description: "Sembilan gaya undangan pernikahan: elegan, formal, dan simple. Pilih satu, AI menyusun undangan khusus untukmu." };

export default function TemplatePage() {
  return (
    <>
      <PageHead
        label="Template"
        title={<>Sembilan gaya, <span className="serif-accent text-accent">tak ada</span> yang sama.</>}
        count={TEMPLATES.length}
        intro="Template di sini adalah arahan untuk AI: palet, suasana, dan huruf. Hasil akhirnya tetap disusun khusus dari nama, kisah, dan acara kalian, jadi undanganmu tidak akan sama dengan milik orang lain."
      />
      <TemplateList heading={false} />
    </>
  );
}
