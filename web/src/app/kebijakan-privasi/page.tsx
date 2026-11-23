import type { Metadata } from "next";
import { PageHead, Prose } from "@/components/sections/PageHead";

export const metadata: Metadata = { title: "Kebijakan Privasi", description: "Data apa yang dikumpulkan CartaAI, untuk apa, dan bagaimana kamu mengendalikannya." };

// DRAF: disusun dari cara kerja sistem (docs/04-06). Perlu ditinjau pemilik / penasihat hukum sebelum rilis publik.
export default function PrivacyPage() {
  return (
    <>
      <PageHead label="Legal" title="Kebijakan Privasi" intro="Draf. Berlaku sejak: belum ditetapkan." />
      <Prose>
        <p>Kebijakan ini menjelaskan data yang dikumpulkan CartaAI saat kamu membuat dan membagikan undangan, alasan pengumpulannya, dan hak kamu atas data tersebut.</p>
        <h2>Data yang kami kumpulkan</h2>
        <ul>
          <li><strong>Akun:</strong> alamat email, nama (opsional), dan data login Google bila kamu masuk dengan Google.</li>
          <li><strong>Isi undangan:</strong> nama mempelai dan orang tua, tanggal, waktu, lokasi, catatan, serta foto, musik, dan informasi rekening yang kamu unggah (paket Premium).</li>
          <li><strong>Tamu:</strong> nama dan nomor WhatsApp tamu yang kamu masukkan.</li>
          <li><strong>RSVP dan ucapan:</strong> nama, status kehadiran, dan ucapan yang dikirim tamu lewat undangan.</li>
          <li><strong>Pembayaran:</strong> status dan nominal transaksi. Data kartu dan rekening pembayaranmu diproses oleh Midtrans dan tidak disimpan oleh CartaAI.</li>
        </ul>
        <h2>Untuk apa data dipakai</h2>
        <ul>
          <li>Menyusun dan menerbitkan undanganmu. Data undangan dikirim ke layanan AI (Google Gemini) hanya untuk membuat desain undangan.</li>
          <li>Menampilkan link pribadi per tamu dan merekap RSVP untukmu.</li>
          <li>Memproses pembayaran dan mengaktifkan paket Premium.</li>
          <li>Menjawab pertanyaan lewat fitur bantuan (chat).</li>
        </ul>
        <h2>Siapa yang bisa melihat</h2>
        <p>Halaman undangan bisa dibuka siapa saja yang memiliki link-nya. Daftar tamu dan rekap RSVP hanya terlihat oleh pemilik undangan. Kami tidak menjual data kepada pihak lain.</p>
        <h2>Penyedia layanan</h2>
        <p>Supabase (basis data dan penyimpanan berkas), Google Gemini (pembuatan undangan dan chat), Midtrans (pembayaran), Render dan Vercel (hosting).</p>
        <h2>Penyimpanan dan penghapusan</h2>
        <p>Undangan Gratis aktif 30 hari dan Premium 1 tahun. Kamu bisa menghapus undangan kapan saja; daftar tamu dan RSVP ikut terhapus. Masa simpan data setelah undangan kedaluwarsa: belum ditetapkan.</p>
        <h2>Hak kamu</h2>
        <p>Kamu dapat meminta salinan, perbaikan, atau penghapusan data akunmu. Kontak untuk permintaan: belum ditetapkan.</p>
      </Prose>
    </>
  );
}
