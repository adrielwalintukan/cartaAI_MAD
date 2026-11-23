import type { Metadata, Viewport } from "next";
import { Instrument_Serif, Inter_Tight } from "next/font/google";
import { Footer } from "@/components/layout/Footer";
import { Nav } from "@/components/layout/Nav";
import { Cursor } from "@/components/motion/Cursor";
import { Preloader } from "@/components/motion/Preloader";
import { SmoothScroll } from "@/components/motion/SmoothScroll";
import "./globals.css";

const sans = Inter_Tight({ subsets: ["latin"], variable: "--font-inter-tight", display: "swap" });
const serif = Instrument_Serif({ subsets: ["latin"], weight: "400", style: ["normal", "italic"], variable: "--font-instrument-serif", display: "swap" });

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"),
  title: { default: "CartaAI · Undangan pernikahan digital yang disusun AI", template: "%s · CartaAI" },
  description: "Isi data pernikahan, AI menyusun undangan digital yang dirancang khusus untukmu, lalu bagikan lewat satu link dengan RSVP dan link pribadi per tamu.",
  openGraph: { type: "website", locale: "id_ID", siteName: "CartaAI" },
};

export const viewport: Viewport = { themeColor: "#f3eee6", width: "device-width", initialScale: 1 };

// Dijalankan sebelum render: lewati preloader bila sudah tampil di sesi ini (mencegah kilasan).
const introScript = `try{if(sessionStorage.getItem('carta-intro'))document.documentElement.dataset.intro='seen'}catch(e){}`;

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="id" className={`${sans.variable} ${serif.variable}`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: introScript }} />
        <noscript><style>{`#preloader{display:none!important}`}</style></noscript>
        <style>{`html[data-intro="seen"] #preloader{display:none}`}</style>
      </head>
      <body>
        <a href="#isi" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[200] focus:rounded focus:bg-ink focus:px-4 focus:py-2 focus:text-paper">Lewati ke konten</a>
        <Preloader />
        <SmoothScroll />
        <Cursor />
        <Nav />
        <main id="isi">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
