// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');

module.exports = defineConfig([
  expoConfig,
  {
    ignores: ['dist/*'],
  },
  {
    // docs/03 §3.3: warna hanya dari token. Layar lama (pra-F3) masih memuat hex; aturan menjadi 'error' setelah F3-11.
    files: ['src/components/**/*.{ts,tsx}', 'src/features/**/*.{ts,tsx}', 'app/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-syntax': ['warn', { selector: "Literal[value=/^#[0-9a-fA-F]{3,8}$/]", message: 'Pakai token dari useTheme(), bukan literal #hex.' }],
    },
  },
  {
    // Komponen/rute baru F2 sudah bersih: wajib error.
    files: ['src/components/ui/**', 'src/components/layout/**', 'src/components/domain/**', 'src/features/**', 'app/_dev/**', 'app/app/**', 'app/(auth)/**', 'app/_layout.tsx'],
    rules: {
      'no-restricted-syntax': ['error', { selector: "Literal[value=/^#[0-9a-fA-F]{3,8}$/]", message: 'Pakai token dari useTheme(), bukan literal #hex.' }],
    },
  },
]);
