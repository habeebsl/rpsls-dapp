'use client';

import Script from 'next/script';

export function ErudaLoader() {
  return (
    <Script
      src="https://cdn.jsdelivr.net/npm/eruda"
      strategy="afterInteractive"
      onLoad={() => {
        if (typeof window !== 'undefined' && (window as any).eruda) {
          (window as any).eruda.init();
        }
      }}
    />
  );
}
