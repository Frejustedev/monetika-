import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import { requireOnboardedUser } from '@/lib/auth/session';
import { prisma } from '@/lib/db/client';
import { COUNTRIES } from '@/lib/countries';
import { CreateAccountForm } from './form';

export default async function NewAccountPage() {
  const user = await requireOnboardedUser();
  const t = await getTranslations('accounts.create');
  const userRow = await prisma.user.findUniqueOrThrow({
    where: { id: user.id },
    select: { countryCode: true, primaryCurrency: true, locale: true },
  });
  const country =
    COUNTRIES.find((c) => c.code === userRow.countryCode) ?? COUNTRIES[0]!;

  return (
    <div className="mx-auto max-w-xl px-5 pb-12 pt-8 md:px-10 md:pt-12">
      <header>
        <h1 className="editorial-title text-foreground" style={{ fontSize: 'clamp(1.75rem, 4vw, 2.5rem)' }}>
          {t('title')}
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">{t('subtitle')}</p>
        <div className="rule-ochre mt-4" />
      </header>

      <div className="mt-8">
        <CreateAccountForm
          countryCode={country.code}
          institutions={country.institutions}
          defaultCurrency={userRow.primaryCurrency ?? country.currency}
          locale={(userRow.locale as 'fr' | 'en') ?? 'fr'}
        />
      </div>

      <div className="mt-8 text-sm">
        <Link href="/accounts" className="text-muted-foreground hover:text-foreground">
          <span className="font-display italic" aria-hidden>
            ←
          </span>{' '}
          {t('back')}
        </Link>
      </div>
    </div>
  );
}
