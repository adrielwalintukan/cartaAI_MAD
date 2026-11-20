import type { Metadata } from "next";
import { PageHead } from "@/components/sections/PageHead";
import { Faq, Pricing } from "@/components/sections/Sections";

export const metadata: Metadata = { title: "Harga", description: "Gratis untuk undangan sederhana, Premium Rp99.000 sekali bayar per undangan. Tanpa langganan." };

export default function HargaPage() {
  return (
    <>
      <PageHead
        label="Harga"
        title={<>Jelas dari <span className="serif-accent text-accent">awal.</span></>}
        intro="Mulai gratis dan upgrade hanya untuk undangan yang kamu mau. Premium dibayar sekali per undangan lewat Midtrans: virtual account, e-wallet, atau kartu."
      />
      <Pricing heading={false} />
      <Faq />
    </>
  );
}
