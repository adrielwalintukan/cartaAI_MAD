// Hasilkan src/lib/api-schema.d.ts dari /openapi.json backend (butuh backend F1 berjalan).
import { spawnSync } from 'node:child_process';
const base = (process.argv[2] || process.env.EXPO_PUBLIC_API_BASE_URL || 'http://localhost:8000').replace(/\/+$/, '');
const r = spawnSync('npx', ['openapi-typescript', `${base}/openapi.json`, '-o', 'src/lib/api-schema.d.ts'], { stdio: 'inherit', shell: true });
process.exit(r.status ?? 1);
