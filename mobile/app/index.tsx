import { Redirect } from 'expo-router';

// Situs publik (landing, template, harga) ada di project web/ (Next.js). Aplikasi langsung ke area login; guard mengalihkan ke /masuk bila belum masuk.
export default function Index() {
  return <Redirect href="/app" />;
}
