/** Alamat aplikasi (Expo web). Semua CTA "Buat undangan" menuju ke sini. */
export const APP_URL = (process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:8081").replace(/\/+$/, "");
export const appLink = (path = "/daftar") => `${APP_URL}${path}`;

/** Hanya untuk tampilan; harga yang ditagih selalu dari server. TBD harga final. */
export const PREMIUM_PRICE = "Rp99.000";

export const NAV = [
  { href: "/template", label: "Template" },
  { href: "/harga", label: "Harga" },
  { href: "/tentang", label: "Tentang" },
];

export type Template = {
  slug: string;
  name: string;
  style: "Elegan" | "Formal" | "Simple";
  preset: "elegan" | "formal" | "simple";
  description: string;
  image: string;
  palette: string; // warna latar saat template ini disorot
};

/** Sembilan template dari versi lama (mobile/src/screens/TemplateScreen.tsx di main), kini sebagai arahan gaya untuk AI. */
export const TEMPLATES: Template[] = [
  { slug: "elegan-tradisional", name: "Elegan Tradisional", style: "Elegan", preset: "elegan", description: "Nuansa mewah dengan motif etnik dan warna keemasan.", image: "/templates/elegan_1.webp", palette: "#e9dfc6" },
  { slug: "elegan-minimalis", name: "Elegan Minimalis", style: "Elegan", preset: "elegan", description: "Tampilan lembut dengan dominasi putih dan dekorasi sederhana.", image: "/templates/elegan_2.webp", palette: "#efe9e1" },
  { slug: "elegan-mewah", name: "Elegan Mewah", style: "Elegan", preset: "elegan", description: "Latar hitam berkelas dengan aksen emas yang glamor.", image: "/templates/elegan_3.webp", palette: "#2a2420" },
  { slug: "formal-klasik", name: "Formal Klasik", style: "Formal", preset: "formal", description: "Ornamen detail dengan nuansa resmi dan berwibawa.", image: "/templates/formal_1.webp", palette: "#dfe3dc" },
  { slug: "formal-modern", name: "Formal Modern", style: "Formal", preset: "formal", description: "Tampilan sederhana, bersih, namun tetap formal.", image: "/templates/formal_2.webp", palette: "#e4e2dd" },
  { slug: "formal-natural", name: "Formal Natural", style: "Formal", preset: "formal", description: "Nuansa lembut dengan sentuhan alam yang tetap anggun.", image: "/templates/formal_3.webp", palette: "#e2e4d3" },
  { slug: "simple-clean", name: "Simple Clean", style: "Simple", preset: "simple", description: "Desain putih bersih dengan tata letak rapi dan elegan.", image: "/templates/simple_1.webp", palette: "#f1efea" },
  { slug: "simple-bold", name: "Simple Bold", style: "Simple", preset: "simple", description: "Dominasi warna kuat dengan kontras tinggi yang berani.", image: "/templates/simple_2.webp", palette: "#e6d6cf" },
  { slug: "simple-garis-bunga", name: "Simple Garis & Bunga", style: "Simple", preset: "simple", description: "Desain hitam-putih dengan ilustrasi garis dan motif bunga.", image: "/templates/simple_3.webp", palette: "#ecebe8" },
];

/** Alur 4 langkah (Tentang lama + docs/02). */
export const STEPS = [
  { n: "01", title: "Pilih gaya", body: "Elegan, formal, simple, atau biarkan AI menentukan dari tema warna yang kamu tulis.", color: "#e9dfc6" },
  { n: "02", title: "Isi detail", body: "Nama pasangan, orang tua, tanggal, lokasi, dan pesan spesial. Cukup beberapa menit.", color: "#e6d6cf" },
  { n: "03", title: "AI merancang", body: "Undangan disusun khusus dari data dan gayamu, bukan template yang sama untuk semua orang. Biasanya selesai dalam satu menit.", color: "#dfe3dc" },
  { n: "04", title: "Bagikan & pantau", body: "Setiap tamu mendapat link pribadi lewat WhatsApp. Lihat siapa yang hadir dan baca ucapan mereka.", color: "#efe9e1" },
];

/** Fitur (komponen Features lama) + keunggulan (Tentang lama), tanpa emoji. */
export const FEATURES = [
  { title: "Desain unik, bukan template", body: "Setiap detail, dari huruf hingga ornamen, disusun AI dari kisah dan selera kalian." },
  { title: "Instan & praktis", body: "Dari ide ke undangan siap kirim dalam hitungan menit, tanpa biaya cetak." },
  { title: "Link pribadi per tamu", body: "Nama tamu muncul di sampul. Kirim lewat WhatsApp dengan pesan yang bisa kamu ubah." },
  { title: "RSVP & ucapan", body: "Tamu mengonfirmasi kehadiran dan menulis doa langsung di undangan. Kamu melihat rekapnya." },
  { title: "Responsif & interaktif", body: "Hitung mundur, peta lokasi, musik, galeri, dan amplop digital. Nyaman dibuka di ponsel mana pun." },
  { title: "Buat ulang kapan saja", body: "Ubah data lalu minta AI menyusun ulang. Link tetap sama, versi sebelumnya bisa dikembalikan." },
];

export const PLANS = [
  {
    name: "Gratis", price: "Rp0", note: "selamanya", cta: "Mulai gratis",
    items: ["Nama, orang tua, acara, dan lokasi", "RSVP, ucapan, dan hitung mundur", "Link aktif 30 hari, maksimal 50 tamu", "Buat ulang 3 kali", "Watermark CartaAI"],
  },
  {
    name: "Premium", price: PREMIUM_PRICE, note: "sekali bayar per undangan", cta: "Buat lalu upgrade", highlight: true,
    items: ["Semua fitur paket Gratis", "Foto sampul, mempelai, dan galeri 10 foto", "Musik latar dan amplop digital", "Semua gaya dan tema warna", "Tanpa watermark, aktif 1 tahun", "Tamu tak terbatas, buat ulang 15 kali"],
  },
];

export const FAQ = [
  { q: "Apakah saya perlu bisa mendesain?", a: "Tidak. Kamu cukup mengisi data pernikahan dan memilih gaya. AI menyusun tata letak, warna, huruf, dan ornamennya." },
  { q: "Berapa lama undangan selesai dibuat?", a: "Biasanya kurang dari satu menit. Kamu bisa menutup halaman, hasilnya tetap tersimpan dan link langsung aktif." },
  { q: "Bagaimana cara mengirim ke tamu?", a: "Tambahkan daftar tamu (bisa ditempel dari spreadsheet), lalu kirim lewat WhatsApp. Setiap tamu mendapat link dengan namanya sendiri." },
  { q: "Apa bedanya Gratis dan Premium?", a: "Gratis sudah lengkap untuk undangan sederhana: data acara, RSVP, hitung mundur, aktif 30 hari. Premium menambah foto, galeri, musik, amplop digital, tanpa watermark, dan aktif 1 tahun." },
  { q: "Apakah Premium berlangganan?", a: "Tidak. Premium dibayar sekali untuk satu undangan lewat Midtrans (virtual account, e-wallet, atau kartu)." },
  { q: "Bisakah undangan diubah setelah jadi?", a: "Bisa. Ubah data lalu buat ulang (Gratis 3 kali, Premium 15 kali). Link tidak berubah, dan versi sebelumnya bisa dikembalikan." },
  { q: "Apakah data tamu saya aman?", a: "Daftar tamu dan RSVP hanya bisa dilihat oleh pemilik undangan. Penjelasan lengkap ada di Kebijakan Privasi." },
];
