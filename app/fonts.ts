import localFont from 'next/font/local';

export const fraunces = localFont({
  src: [
    { path: '../public/fonts/Fraunces-300-normal.ttf', weight: '300', style: 'normal' },
    { path: '../public/fonts/Fraunces-300-italic.ttf', weight: '300', style: 'italic' },
    { path: '../public/fonts/Fraunces-400-normal.ttf', weight: '400', style: 'normal' },
    { path: '../public/fonts/Fraunces-400-italic.ttf', weight: '400', style: 'italic' },
    { path: '../public/fonts/Fraunces-500-normal.ttf', weight: '500', style: 'normal' },
    { path: '../public/fonts/Fraunces-500-italic.ttf', weight: '500', style: 'italic' },
    { path: '../public/fonts/Fraunces-600-normal.ttf', weight: '600', style: 'normal' },
    { path: '../public/fonts/Fraunces-600-italic.ttf', weight: '600', style: 'italic' },
    { path: '../public/fonts/Fraunces-700-normal.ttf', weight: '700', style: 'normal' },
    { path: '../public/fonts/Fraunces-700-italic.ttf', weight: '700', style: 'italic' },
    { path: '../public/fonts/Fraunces-800-normal.ttf', weight: '800', style: 'normal' },
    { path: '../public/fonts/Fraunces-800-italic.ttf', weight: '800', style: 'italic' },
    { path: '../public/fonts/Fraunces-900-normal.ttf', weight: '900', style: 'normal' },
    { path: '../public/fonts/Fraunces-900-italic.ttf', weight: '900', style: 'italic' },
  ],
  variable: '--font-display',
  display: 'swap',
  preload: true,
});

export const instrumentSans = localFont({
  src: [
    { path: '../public/fonts/InstrumentSans-Regular.ttf', weight: '400', style: 'normal' },
    { path: '../public/fonts/InstrumentSans-Italic.ttf', weight: '400', style: 'italic' },
    { path: '../public/fonts/InstrumentSans-Bold.ttf', weight: '700', style: 'normal' },
  ],
  variable: '--font-sans',
  display: 'swap',
  preload: true,
});

export const geistMono = localFont({
  src: [
    { path: '../public/fonts/GeistMono-Regular.ttf', weight: '400', style: 'normal' },
    { path: '../public/fonts/GeistMono-Bold.ttf', weight: '700', style: 'normal' },
  ],
  variable: '--font-mono',
  display: 'swap',
  preload: false,
});
