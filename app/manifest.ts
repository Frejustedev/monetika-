import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Monétika',
    short_name: 'Monétika',
    description: 'Un journal financier pour l\u2019Afrique.',
    start_url: '/',
    display: 'standalone',
    orientation: 'portrait',
    background_color: '#F5F1E8',
    theme_color: '#1F4D3F',
    lang: 'fr',
    dir: 'ltr',
    categories: ['finance', 'productivity', 'lifestyle'],
    icons: [
      { src: '/icons/app-icon-72.png', sizes: '72x72', type: 'image/png' },
      { src: '/icons/app-icon-96.png', sizes: '96x96', type: 'image/png' },
      { src: '/icons/app-icon-128.png', sizes: '128x128', type: 'image/png' },
      { src: '/icons/app-icon-152.png', sizes: '152x152', type: 'image/png' },
      { src: '/icons/app-icon-192.png', sizes: '192x192', type: 'image/png' },
      { src: '/icons/app-icon-256.png', sizes: '256x256', type: 'image/png' },
      { src: '/icons/app-icon-384.png', sizes: '384x384', type: 'image/png' },
      { src: '/icons/app-icon-512.png', sizes: '512x512', type: 'image/png' },
      {
        src: '/icons/app-icon-maskable-192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'maskable',
      },
      {
        src: '/icons/app-icon-maskable-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
    ],
  };
}
