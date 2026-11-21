import type { NextConfig } from "next";

// Static export: semua halaman jadi HTML di `out/`, di-host Vercel. `/u/:slug` di-rewrite ke backend (vercel.json).
const nextConfig: NextConfig = {
  output: "export",
  images: { unoptimized: true },
  trailingSlash: false,
  // StrictMode me-mount Canvas R3F dua kali di dev; mount kedua memakai konteks WebGL yang sudah hilang.
  reactStrictMode: false,
  // Dev dan build memakai folder terpisah agar `npm run build` tidak merusak dev server yang sedang jalan.
  distDir: process.env.NODE_ENV === "development" ? ".next-dev" : ".next",
};

export default nextConfig;
