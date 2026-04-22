import type { Metadata, Viewport } from 'next';
import { NextIntlClientProvider } from 'next-intl';
import { getLocale, getMessages } from 'next-intl/server';
import { cookies } from 'next/headers';
import { fraunces, instrumentSans, geistMono } from './fonts';
import { ServiceWorkerRegistry } from '@/components/system/ServiceWorkerRegistry';
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
  appleWebApp: {
    capable: true,
    title: 'Monétika',
    statusBarStyle: 'default',
    startupImage: [
      {
        url: '/splash/splash-iphone-14-light.png',
        media: '(device-width: 390px) and (device-height: 844px) and (-webkit-device-pixel-ratio: 3) and (prefers-color-scheme: light)',
      },
      {
        url: '/splash/splash-iphone-14-dark.png',
        media: '(device-width: 390px) and (device-height: 844px) and (-webkit-device-pixel-ratio: 3) and (prefers-color-scheme: dark)',
      },
      {
        url: '/splash/splash-iphone-14pm-light.png',
        media: '(device-width: 430px) and (device-height: 932px) and (-webkit-device-pixel-ratio: 3) and (prefers-color-scheme: light)',
      },
      {
        url: '/splash/splash-iphone-14pm-dark.png',
        media: '(device-width: 430px) and (device-height: 932px) and (-webkit-device-pixel-ratio: 3) and (prefers-color-scheme: dark)',
      },
      {
        url: '/splash/splash-ipad-pro-light.png',
        media: '(device-width: 1024px) and (device-height: 1366px) and (-webkit-device-pixel-ratio: 2) and (prefers-color-scheme: light)',
      },
      {
        url: '/splash/splash-ipad-pro-dark.png',
        media: '(device-width: 1024px) and (device-height: 1366px) and (-webkit-device-pixel-ratio: 2) and (prefers-color-scheme: dark)',
      },
    ],
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

  // Thème utilisateur — cookie NEXT_THEME, sinon suit prefers-color-scheme.
  const cookieStore = await cookies();
  const themePref = cookieStore.get('NEXT_THEME')?.value;
  const themeAttr = themePref === 'light' || themePref === 'dark' ? themePref : undefined;

  return (
    <html
      lang={locale}
      data-theme={themeAttr}
      className={`${fraunces.variable} ${instrumentSans.variable} ${geistMono.variable}`}
      suppressHydrationWarning
    >
      <body>
        <NextIntlClientProvider locale={locale} messages={messages}>
          {children}
        </NextIntlClientProvider>
        <ServiceWorkerRegistry />
      </body>
    </html>
  );
}
