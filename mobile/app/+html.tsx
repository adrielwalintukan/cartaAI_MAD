import { ScrollViewStyleReset } from 'expo-router/html';
import React from 'react';

// Dokumen HTML web (static rendering): bahasa Indonesia, viewport, dukung light/dark bawaan browser.
export default function Root({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id">
      <head>
        <meta charSet="utf-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no" />
        <meta name="color-scheme" content="light dark" />
        <ScrollViewStyleReset />
      </head>
      <body>{children}</body>
    </html>
  );
}
