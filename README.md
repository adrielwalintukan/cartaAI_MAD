# CartaAI - AI-Powered Invitation Generator (Mobile Version)

CartaAI adalah platform cerdas yang memungkinkan pengguna untuk merancang dan membagikan undangan pernikahan digital berkualitas tinggi dalam hitungan detik. Menggunakan teknologi AI (FastAPI di sisi server dan Expo/React Native di sisi mobile), CartaAI memberikan pengalaman pembuatan undangan yang elegan, personal, dan efisien.

---

## 🚀 Fitur Utama

- **AI Invitation Generator**: Cukup isi detail dasar, dan biarkan CartaAI merangkai teks undangan yang berkesan.
- **Daftar Tamu & Pengiriman WhatsApp**: Kelola daftar tamu Anda dan kirim undangan langsung melalui WhatsApp dengan pesan yang sudah diatur otomatis.
- **Kustomisasi Premium**: Upload musik latar, foto mempelai, dan galeri pre-wedding untuk hasil undangan yang eksklusif.
- **Sistem Pembayaran Terintegrasi**: Upgrade ke layanan Premium dengan mudah melalui Midtrans.
- **Dark Mode & Antarmuka Modern**: Desain UI yang bersih, responsif, dan mendukung mode gelap untuk kenyamanan pengguna.
- **History & Saved Invitations**: Simpan dan lihat kembali semua undangan yang pernah Anda buat.

---

## 🛠️ Arsitektur Teknologi

### Mobile (Frontend)
- **Framework**: Expo (React Native)
- **Navigasi**: Expo Router (File-based routing)
- **State Management**: React Context API (Auth & Dark Mode)

### Backend
- **Framework**: FastAPI (Python)
- **Server**: Uvicorn
- **Payments**: Midtrans API Integration
- **Database & Auth**: Supabase (PostgreSQL, Auth, & Storage)

---

## 📂 Struktur Proyek

```text
cartaAI/
├── backend/                # Aplikasi Server FastAPI (Python)
│   ├── main.py             # Entry point API
│   ├── ai_generator.py     # Logika AI Premium
│   ├── ai_generator_free.py # Logika AI Gratis
│   ├── dependencies.py     # Middleware & Utils
│   ├── routers/            # Modul routing API
│   ├── requirements.txt    # Library Python
│   └── .env                # Konfigurasi Backend
└── mobile/                 # Aplikasi Mobile Expo (React Native)
    ├── app/                # Expo Router (Halaman Utama)
    │   ├── (tabs)/         # Tab Navigation (Home, Template, Buat, Harga)
    │   ├── template-usage/ # Detail Template Layout
    │   ├── login.tsx       # Halaman Login
    │   ├── register.tsx    # Halaman Daftar
    │   └── success.tsx     # Halaman Sukses Generator
    ├── src/                # Kode Sumber Utama
    │   ├── components/     # UI Reusable
    │   │   ├── GuestManagementModal.tsx
    │   │   └── ...
    │   ├── screens/        # Logic Layar Aplikasi
    │   │   ├── GeneratorScreen.tsx
    │   │   ├── ProfileScreen.tsx
    │   │   └── ...
    │   ├── context/        # Auth & Theme Provider
    │   ├── lib/            # Utilitas API & Constants
    │   └── supabaseClient.ts
    ├── assets/             # Resource Gambar & Ikon
    ├── app.json            # Konfigurasi Expo
    └── package.json        # Dependensi Node.js
```

---

## 🔐 Konfigurasi Environment (.env)

Untuk menjalankan proyek ini, Anda perlu menyiapkan file `.env` di folder **backend** dan **mobile**.

### Backend (`/backend/.env`)
```env
SUPABASE_URL=your_supabase_url
SUPABASE_KEY=your_supabase_anon_key
SUPABASE_SERVICE_KEY=your_supabase_service_role_key
MIDTRANS_SERVER_KEY=your_midtrans_server_key
GOOGLE_API_KEY=your_gemini_ai_api_key
BACKEND_URL=your_backend_public_url
```

### Mobile (`/mobile/.env`)
```env
EXPO_PUBLIC_SUPABASE_URL=your_supabase_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
EXPO_PUBLIC_BACKEND_URL=http://your_laptop_ip:8000
```
> [!IMPORTANT]
> Jika Anda menguji aplikasi di **HP fisik (Expo Go)**, pastikan `EXPO_PUBLIC_BACKEND_URL` menggunakan **alamat IP lokal laptop Anda** (contoh: `http://192.168.1.5:8000`), bukan `localhost`. Pastikan HP dan laptop berada di jaringan Wi-Fi yang sama.

---

## ⚙️ Cara Menjalankan Proyek

### 1. Menjalankan Backend
1. Masuk ke folder backend: `cd backend`
2. Buat virtual environment (jika belum ada): `python -m venv venv`
3. Aktifkan virtual environment:
   - Windows: `venv\Scripts\activate`
   - Linux/macOS: `source venv/bin/activate`
4. Pasang dependensi: `pip install -r requirements.txt`
5. Jalankan server: `uvicorn main:app --reload --host 0.0.0.0 --port 8000`

### 2. Menjalankan Aplikasi Mobile
1. Masuk ke folder mobile: `cd mobile`
2. Pasang dependensi: `npm install`
3. Jalankan Expo: `npx expo start`
4. Gunakan aplikasi **Expo Go** untuk melihat hasilnya di HP atau jalankan di emulator.

---

## 💎 Langganan & Pembayaran
Aplikasi mendukung alur pembayaran **Midtrans Sandbox** untuk upgrade ke fitur Premium secara *real-time*. Kamu bisa melakukan simulasi pembayaran melalui [Midtrans Simulator](https://simulator.sandbox.midtrans.com/).
