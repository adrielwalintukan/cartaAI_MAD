import type { NextConfig } from "next";

// Static export: semua halaman jadi HTML di `out/`, di-host Vercel. `/u/:slug` di-rewrite ke backend (vercel.json).
const nextConfig: NextConfig = {
  output: "export",
  images: { unoptimized: true },
  trailingSlash: false,
};

export default nextConfig;
