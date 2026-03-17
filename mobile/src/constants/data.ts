export const APP_FEATURES = [
  { icon: 'auto-awesome', title: 'Desain Cantik', desc: 'Desain modern dan elegan yang memukau.' },
  { icon: 'bolt', title: 'Cepat & Hemat', desc: 'Jadi dalam hitungan menit, hemat waktu Anda.' },
  { icon: 'share', title: 'Mudah Dibagi', desc: 'Kirim via WA atau Medsos dengan satu klik.' },
  { icon: 'lock', title: 'Aman & Privat', desc: 'Data pernikahan Anda terjaga dengan aman.' },
];

export const PRICING_PLANS = [
  {
    id: 'free',
    name: 'Gratis',
    price: 'Rp 0',
    description: 'Untuk memulai',
    buttonText: 'Mulai Gratis',
    color: ['#9ca3af', '#6b7280'],
    features: ['Desain terbatas', 'Fitur dasar', 'Hingga 100 undangan'],
    isPopular: false,
  },
  {
    id: 'premium_monthly',
    name: 'Premium',
    price: 'Rp 99rb',
    period: '/bulan',
    description: 'Untuk acara spesial',
    buttonText: 'Pilih Paket Premium',
    color: ['#6366f1', '#a855f7'],
    features: ['Semua desain premium', 'Fitur lengkap & interaktif', 'Hingga 500 undangan', 'Dukungan prioritas'],
    isPopular: true,
  },
];

// Di React Native, gambar lokal harus di-require secara statis
export const WEDDING_TEMPLATES: any = {
  elegan: [
    { id: 1, title: "Elegan Tradisional", desc: "Mewah dengan motif etnik emas.", image: require('../../assets/templates/elegan_1.png') },
    { id: 2, title: "Elegan Minimalis", desc: "Putih bersih dengan dekorasi simpel.", image: require('../../assets/templates/elegan_2.png') },
    { id: 7, title: "Elegan Mewah", desc: "Hitam berkelas dengan aksen emas.", image: require('../../assets/templates/elegan_3.png') },
  ],
  formal: [
    { id: 3, title: "Formal Klasik", desc: "Ornamen detail nuansa resmi.", image: require('../../assets/templates/formal_1.png') },
    { id: 4, title: "Formal Modern", desc: "Tampilan bersih dan profesional.", image: require('../../assets/templates/formal_2.png') },
    { id: 5, title: "Formal Executive", desc: "Desain kaku namun tetap cantik.", image: require('../../assets/templates/formal_3.png') },
  ],
  simple: [
    { id: 10, title: "Simple Clean", desc: "Putih bersih, tata letak rapi.", image: require('../../assets/templates/simple_1.png') },
    { id: 11, title: "Simple Bold", desc: "Warna kuat dengan kontras tinggi.", image: require('../../assets/templates/simple_2.png') },
    { id: 12, title: "Simple Soft", desc: "Warna pastel yang menyejukkan mata.", image: require('../../assets/templates/simple_3.png') },
  ],
};
