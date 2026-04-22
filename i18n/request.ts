import { getRequestConfig } from 'next-intl/server';
import { cookies, headers } from 'next/headers';
import { defaultLocale, isSupportedLocale, type Locale } from './config';

export default getRequestConfig(async () => {
  const cookieStore = await cookies();
  const cookieLocale = cookieStore.get('NEXT_LOCALE')?.value;

  let locale: Locale = defaultLocale;
  if (cookieLocale && isSupportedLocale(cookieLocale)) {
    locale = cookieLocale;
  } else {
    const headerList = await headers();
    const accept = headerList.get('accept-language') ?? '';
    if (/\ben(-|;|,|$)/i.test(accept) && !/\bfr(-|;|,|$)/i.test(accept)) {
      locale = 'en';
    }
  }

  const messages = (await import(`../messages/${locale}.json`)).default;
  return { locale, messages };
});
