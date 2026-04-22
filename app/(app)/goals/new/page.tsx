import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import { requireOnboardedUser } from '@/lib/auth/session';
import { prisma } from '@/lib/db/client';
import { GoalForm } from './goal-form';
import type { SupportedLocale } from '@/lib/money/currency';

export default async function NewGoalPage() {
  const user = await requireOnboardedUser();
  const t = await getTranslations('goals.new');

  const [accounts, userRow] = await Promise.all([
    prisma.account.findMany({
      where: { userId: user.id, isArchived: false },
      select: { id: true, label: true, currency: true, color: true },
      orderBy: { createdAt: 'asc' },
    }),
    prisma.user.findUniqueOrThrow({
      where: { id: user.id },
      select: { locale: true, primaryCurrency: true },
    }),
  ]);

  const locale: SupportedLocale = userRow.locale === 'en' ? 'en' : 'fr';

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
        <GoalForm
          accounts={accounts}
          defaultCurrency={userRow.primaryCurrency ?? 'XOF'}
          locale={locale}
        />
      </div>

      <div className="mt-8 text-sm">
        <Link href="/goals" className="text-muted-foreground hover:text-foreground">
          <span className="font-display italic" aria-hidden>
            ←
          </span>{' '}
          {t('back')}
        </Link>
      </div>
    </div>
  );
}
