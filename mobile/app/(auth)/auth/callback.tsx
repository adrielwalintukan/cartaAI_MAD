import React from 'react';
import { Splash } from '../../../src/components/layout/Splash';

// Penangkap OAuth/tautan email: supabase-js menukar kode dari URL, lalu guard di (auth)/_layout mengalihkan ke /app.
export default function AuthCallback() {
  return <Splash />;
}
