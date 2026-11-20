import type { Metadata } from "next";
import { PageHead, Prose } from "@/components/sections/PageHead";
import { PREMIUM_PRICE } from "@/lib/site";

export const metadata: Metadata = { title: "Syarat & Ketentuan", description: "Ketentuan penggunaan CartaAI, paket Gratis dan Premium, serta pembayaran." };

// DRAF: perlu ditinjau pemilik / penasihat hukum sebelum rilis publik.
export default function TermsPage() {
  return (
    <>
      <PageHead label="Legal" title="Syarat & Ketentuan" intro="Draf. Berlaku sejak: belum ditetapkan." />
      <Prose>
        <p>Dengan membuat akun atau memakai CartaAI, kamu menyetujui ketentuan berikut.</p>
        <h2>Layanan</h2>
        <p>CartaAI membantu membuat undangan pernikahan digital. Desain disusun oleh AI berdasarkan data yang kamu masukkan; hasilnya dapat berbeda setiap kali dibuat ulang.</p>
        <h2>Akun dan isi</h2>
        <ul>
          <li>Kamu bertanggung jawab atas kebenaran data undangan dan hak atas foto atau musik yang kamu unggah.</li>
          <li>Dilarang memakai CartaAI untuk konten yang melanggar hukum, menipu, atau menyinggung pihak lain.</li>
          <li>Kami dapat menonaktifkan undangan yang melanggar ketentuan ini.</li>
        </ul>
        <h2>Paket dan pembayaran</h2>
        <ul>
          <li><strong>Gratis:</strong> data inti, RSVP, hitung mundur, watermark, aktif 30 hari, maksimal 50 tamu, buat ulang 3 kali.</li>
          <li><strong>Premium:</strong> {PREMIUM_PRICE} sekali bayar per undangan; foto, galeri, musik, amplop digital, tanpa watermark, aktif 1 tahun, tamu tak terbatas, buat ulang 15 kali.</li>
          <li>Pembayaran diproses Midtrans. Premium aktif setelah pembayaran terkonfirmasi. Kebijakan pengembalian dana: belum ditetapkan.</li>
        </ul>
        <h2>Ketersediaan</h2>
        <p>Kami berusaha menjaga layanan tetap tersedia, namun tidak menjamin bebas gangguan. Fitur dan harga dapat berubah dengan pemberitahuan di situs ini.</p>
        <h2>Kontak</h2>
        <p>Pertanyaan tentang ketentuan ini: belum ditetapkan.</p>
      </Prose>
    </>
  );
}
