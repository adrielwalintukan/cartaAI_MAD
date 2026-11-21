-- Q27: semua gaya untuk semua paket; brief preset diperkaya dengan kit desain (07 §5); preset Nusantara dan Taman.
-- Idempoten: aman dijalankan ulang.

update public.style_presets set premium_only = false;

insert into public.style_presets (id, name, description, brief, premium_only, sort_order) values
  ('default', 'Editorial Romantis', 'Gaya bawaan: hangat, rapi, elegan, dengan ornamen bunga halus.',
   'Editorial-romantis. Palet: latar ivory #f6efe4 dan krem #ecdfcc bergantian per section, teks tinta hijau tua #23352b, aksen terracotta #b4563a, emas pudar #b89a5e untuk garis. Huruf: Fraunces (display, judul dan nama, italic untuk "&") + Inter (isi). Sampul tinggi penuh: gradien lembut ivory ke krem, floral-corner di dua sudut berlawanan, nama besar carta-display, tanggal kecil huruf kapital berjarak. Ornamen: floral-corner, floral-divider di bawah judul section, rings di bagian mempelai. Animasi: carta-reveal pelan dari bawah, satu @keyframes daun bergoyang halus pada ornamen sampul. Kesan hangat seperti undangan cetak letterpress.',
   false, 0),
  ('elegan', 'Elegan', 'Mewah dengan aksen emas, bingkai tipis, dan serif klasik.',
   'Elegan dan mewah. Palet: hitam pekat #141210 untuk sampul dan acara, gading #f4ede1 untuk section lain, aksen emas #c9a45c, teks terang #f4ede1 di latar gelap. Huruf: Cormorant Garamond (display, besar, tracking lebar untuk label) + Jost ringan (isi). Sampul: carta-frame emas di dalam layar, arch-frame di belakang nama, kilau emas halus (@keyframes shimmer pada gradien teks judul). Ornamen: arch-frame, floral-divider, dots-divider. Animasi: carta-reveal-zoom untuk nama, carta-reveal untuk blok lain dengan carta-delay bertahap. Ruang lega, simetris, tidak ramai.',
   false, 2),
  ('formal', 'Formal', 'Resmi, simetris, dan tertata dengan bingkai rapi.',
   'Formal dan tertata. Palet: navy #1d2a44 untuk sampul dan footer, putih gading #f7f4ee, aksen emas tua #a8874a, teks gelap #1b1f2a. Huruf: Libre Baskerville (display) + Inter (isi). Tata letak simetris di tengah, hierarki jelas, label kecil kapital. Sampul: carta-frame ganda, monogram inisial di lingkaran tipis, rings di bawah nama. Ornamen: rings, dots-divider, floral-divider sederhana. Animasi: carta-reveal halus, tanpa gerakan berlebihan. Kesan resmi seperti undangan kenegaraan.',
   false, 3),
  ('simple', 'Simple', 'Bersih dan modern, banyak ruang kosong, aksen pastel.',
   'Minimalis modern. Palet: putih #ffffff dan abu sangat muda #f3f2ef bergantian, teks #222222, satu aksen sage #8fa596 atau dusty pink #d8a7a0. Huruf: Poppins (isi, judul kecil) + DM Serif Display (nama). Sudut membulat besar, kartu tipis dengan bayangan sangat lembut. Sampul: blok warna aksen setengah layar miring lembut dengan wave di tepinya, nama besar carta-display. Ornamen: wave, leaf-divider, dots-divider (tetap ≥ 3, kecil dan rapi). Animasi: carta-reveal-left dan carta-reveal-right bergantian. Ringan dan segar.',
   false, 4),
  ('nusantara', 'Nusantara', 'Motif batik dan songket dengan warna tanah yang hangat.',
   'Nusantara. Palet: cokelat soga #6b3f24, merah bata #9c3d26, krem #efe2c8, emas #c39a4a, teks gelap #2a1a10. Huruf: Cinzel atau Marcellus (display) + Lora (isi). Sampul: latar cokelat dengan pola kawung/geometris dari CSS repeating-linear-gradient atau radial-gradient tipis, batik-band di atas dan bawah, arch-frame bergaya gapura di belakang nama, carta-grain. Ornamen: batik-band sebagai pemisah section, floral-corner, dots-divider. Animasi: carta-reveal-zoom pada gapura, @keyframes putar sangat lambat pada ornamen bundar. Kesan adat yang megah namun tetap terbaca.',
   false, 5),
  ('taman', 'Taman', 'Botani: hijau sage, bunga, dan dedaunan yang segar.',
   'Taman botani. Palet: sage #9caf88, hijau daun tua #3f5b3a, krem #f5f0e6, aksen pink peony #e3b5a4, teks #26331f. Huruf: Playfair Display italic (display) + Nunito Sans (isi). Sampul: latar krem dengan gradien hijau lembut dari bawah, floral-corner besar di empat sudut, leaf-divider di bawah nama. Ornamen: floral-corner, leaf-divider, floral-divider, wave hijau di tepi section. Animasi: @keyframes daun bergoyang pelan pada ornamen, carta-reveal pada kartu acara. Kesan pesta kebun pagi hari yang segar.',
   false, 6),
  ('bebas', 'Bebas', 'AI merancang dari tema warna dan keinginan desain yang kamu tulis.',
   'Tentukan sendiri palet, mood, dan tipografi dari tema warna dan keinginan desain pengguna; bila keduanya kosong, pilih palet yang hangat dan elegan. Tetap penuhi daftar wajib desain: sampul berlapis dengan ornamen dan carta-display, ≥ 3 ornamen dari kit yang cocok dengan mood, latar section bergantian, carta-reveal, satu animasi dekoratif halus. Kontras teks harus cukup.',
   false, 9)
on conflict (id) do update set
  name = excluded.name, description = excluded.description, brief = excluded.brief,
  premium_only = excluded.premium_only, sort_order = excluded.sort_order;
