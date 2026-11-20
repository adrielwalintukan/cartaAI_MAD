import type { PricingFeature } from '../components/domain';

/** Hanya untuk tampilan. Harga yang ditagih selalu dari server (`POST /api/payments/orders`). TBD: harga final. */
export const PREMIUM_PRICE = 99000;

export const FREE_FEATURES: PricingFeature[] = [
  { text: 'Nama, orang tua, acara, dan lokasi', included: true },
  { text: 'RSVP, ucapan, dan hitung mundur', included: true },
  { text: 'Link aktif 30 hari, maksimal 50 tamu', included: true },
  { text: 'Buat ulang 3 kali', included: true },
  { text: 'Foto, galeri, musik, amplop digital', included: false },
  { text: 'Tanpa watermark CartaAI', included: false },
];

export const PREMIUM_FEATURES: PricingFeature[] = [
  { text: 'Semua fitur paket Gratis', included: true },
  { text: 'Foto sampul dan mempelai, galeri sampai 10 foto', included: true },
  { text: 'Musik latar dan amplop digital', included: true },
  { text: 'Pilihan gaya dan tema warna', included: true },
  { text: 'Tanpa watermark, link aktif 1 tahun', included: true },
  { text: 'Tamu tak terbatas, buat ulang 15 kali', included: true },
];
