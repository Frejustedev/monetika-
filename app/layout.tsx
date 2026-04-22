import type { Metadata, Viewport } from 'next';
import { NextIntlClientProvider } from 'next-intl';
import { getLocale, getMessages } from 'next-intl/server';
import { fraunces, instrumentSans, geistMono } from './fonts';
import './globals.css';

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? 'https://monetika.app'),
  title: {
    default: 'Monétika — Un journal financier pour l\u2019Afrique',
    template: '%s · Monétika',
  },
  description:
    'Gérez vos comptes, vos revenus, vos dépenses et vos objectifs avec discernement. ' +
    'Conçu pour l\u2019UEMOA, le Nigeria et le Ghana.',
  keywords: ['finance personnelle', 'budget', 'Afrique', 'UEMOA', 'XOF', 'NGN', 'GHS'],
  authors: [{ name: 'Monétika' }],
  creator: 'Monétika',
  applicationName: 'Monétika',
  icons: {
    icon: [
      { url: '/icons/favicon-16.png', sizes: '16x16', type: 'image/png' },
      { url: '/icons/favicon-32.png', sizes: '32x32', type: 'image/png' },
      { url: '/marks/favicon.svg', type: 'image/svg+xml' },
    ],
    apple: '/icons/apple-touch-icon-180.png',
  },
  manifest: '/manifest.webmanifest',
  openGraph: {
    type: 'website',
    locale: 'fr_FR',
    alternateLocale: ['en_NG', 'en_GH'],
    url: '/',
    siteName: 'Monétika',
    title: 'Monétika — Un journal financier pour l\u2019Afrique',
    description: 'Pleine conscience financière pour l\u2019UEMOA, le Nigeria et le Ghana.',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Monétika — Un journal financier pour l\u2019Afrique',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Monétika',
    description: 'Un journal financier pour l\u2019Afrique.',
    images: ['/og-image.png'],
  },
  formatDetection: { telephone: false, email: false, address: false },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#F5F1E8' },
    { media: '(prefers-color-scheme: dark)', color: '#0E2A22' },
  ],
  colorScheme: 'light dark',
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const locale = await getLocale();
  const messages = await getMessages();

  return (
    <html
      lang={locale}
      className={`${fraunces.variable} ${instrumentSans.variable} ${geistMono.variable}`}
      suppressHydrationWarning
    >
      <body>
        <NextIntlClientProvider locale={locale} messages={messages}>
          {children}
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
