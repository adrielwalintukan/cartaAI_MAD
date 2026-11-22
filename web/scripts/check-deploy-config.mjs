// Penjaga build: rewrite /u/:slug di vercel.json harus menunjuk backend sungguhan, bukan placeholder.
// Di Vercel (env VERCEL) build GAGAL bila salah; di lokal hanya memperingatkan. CHECK_DEPLOY_STRICT=1 memaksa gagal.
import { readFileSync } from "node:fs";

const cfg = JSON.parse(readFileSync(new URL("../vercel.json", import.meta.url), "utf8"));
const rw = (cfg.rewrites ?? []).find((r) => r.source === "/u/:slug");
const problems = [];

if (!rw) {
  problems.push('rewrite "/u/:slug" tidak ada di vercel.json');
} else {
  let url = null;
  try { url = new URL(rw.destination.replace(":slug", "x")); } catch { problems.push(`destination bukan URL yang valid: ${rw.destination}`); }
  if (url) {
    if (url.protocol !== "https:") problems.push(`destination harus https: ${rw.destination}`);
    if (!rw.destination.endsWith("/u/:slug")) problems.push(`destination harus berakhir /u/:slug: ${rw.destination}`);
    if (/tbd|localhost|127\.0\.0\.1|example\./i.test(url.hostname)) problems.push(`host masih placeholder: ${url.hostname} (ganti dengan host backend produksi)`);
  }
}

if (problems.length) {
  console.error("[check-deploy-config]\n - " + problems.join("\n - "));
  if (process.env.VERCEL || process.env.CHECK_DEPLOY_STRICT) process.exit(1);
  console.warn("[check-deploy-config] dilewati: bukan build Vercel (peringatan saja).");
}
