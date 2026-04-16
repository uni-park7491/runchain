import type { Metadata, Viewport } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'RunChain',
  description: 'BNB Chain Weekly Running Challenge — Run to Earn',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'RunChain',
  },
  other: {
    'mobile-web-app-capable': 'yes',
  },
};

export const viewport: Viewport = {
  themeColor: '#0A0A0F',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link rel="apple-touch-icon" href="/icon.svg" />
      </head>
      <body>
        {children}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', () => {
                  navigator.serviceWorker.register('/sw.js').catch(() => {});
                });
              }
            `,
          }}
        />
      </body>
    </html>
  );
}
