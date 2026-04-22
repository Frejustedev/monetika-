import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import { requireOnboardedUser } from '@/lib/auth/session';
import { listUserAccounts } from '@/lib/db/queries/accounts';
import { prisma } from '@/lib/db/client';
import { AccountRow } from '@/components/dashboard/AccountRow';
import { StrategyBar } from '@/components/charts/StrategyBar';
import { Amount } from '@/components/money/Amount';
import type { SupportedCurrency, SupportedLocale } from '@/lib/money/currency';
import type { StrategyBucket } from '@prisma/client';

export const dynamic = 'force-dynamic';

export default async function AccountsPage() {
  const user = await requireOnboardedUser();
  const t = await getTranslations('accounts.list');

  const [accounts, userRow] = await Promise.all([
    listUserAccounts(user.id, true),
    prisma.user.findUniqueOrThrow({
      where: { id: user.id },
      select: { primaryCurrency: true, locale: true },
    }),
  ]);

  const locale: SupportedLocale = (userRow.locale === 'en' ? 'en' : 'fr') as SupportedLocale;
  const primaryCurrency = (userRow.primaryCurrency ?? 'XOF') as SupportedCurrency;

  const active = accounts.filter((a) => !a.isArchived);
  const archived = accounts.filter((a) => a.isArchived);

  const totalPrimary = active
    .filter((a) => a.currency === primaryCurrency)
    .reduce((sum, a) => sum + a.currentBalance, 0);

  const bucketTotals = new Map<StrategyBucket, number>();
  for (const a of active.filter((x) => x.currency === primaryCurrency)) {
    if (!a.strategyBucket) continue;
    bucketTotals.set(a.strategyBucket, (bucketTotals.get(a.strategyBucket) ?? 0) + a.currentBalance);
  }

  return (
    <div className="mx-auto max-w-3xl px-5 pb-12 pt-8 md:px-10 md:pt-12">
      <header className="flex items-start justify-between gap-4">
        <div>
          <h1 className="editorial-title text-foreground" style={{ fontSize: 'clamp(1.75rem, 4vw, 2.5rem)' }}>
            {t('title')}
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {t('subtitle', { count: active.length })}
          </p>
        </div>
        <Link
          href="/accounts/new"
          className="mt-1 inline-flex items-center gap-2 rounded-[10px] bg-[color:var(--forest)] px-4 py-2.5 text-sm text-[color:var(--paper)] transition-colors hover:bg-[color:var(--forest-deep)]"
        >
          <span className="font-display text-lg leading-none" aria-hidden>
            +
          </span>
          <span>{t('add')}</span>
        </Link>
      </header>
      <div className="rule-ochre mt-4" />

      <section className="mt-8">
        <div className="flex items-baseline justify-between">
          <p className="font-mono text-[11px] uppercase tracking-[0.24em] text-muted-foreground">
            {t('totalOverline')}
          </p>
          <Amount
            value={totalPrimary}
            currency={primaryCurrency}
            locale={locale}
            size="lg"
            className="font-semibold"
          />
        </div>
        <div className="mt-4">
          <StrategyBar
            data={Array.from(bucketTotals.entries()).map(([bucket, amount]) => ({ bucket, amount }))}
            locale={locale}
          />
        </div>
      </section>

      <section className="mt-10">
        <p className="font-mono text-[11px] uppercase tracking-[0.24em] text-muted-foreground">
          {t('activeOverline')}
        </p>
        <div className="mt-3">
          {active.length === 0 ? (
            <p className="text-sm text-muted-foreground">{t('empty')}</p>
          ) : (
            active.map((a) => (
              <AccountRow
                key={a.id}
                id={a.id}
                label={a.label}
                institution={a.institution}
                currency={a.currency}
                currentBalance={a.currentBalance}
                color={a.color}
                isBlocked={a.isBlocked}
                locale={locale}
              />
            ))
          )}
        </div>
      </section>

      {archived.length > 0 ? (
        <section className="mt-10">
          <p className="font-mono text-[11px] uppercase tracking-[0.24em] text-muted-foreground">
            {t('archivedOverline')}
          </p>
          <div className="mt-3 opacity-60">
            {archived.map((a) => (
              <AccountRow
                key={a.id}
                id={a.id}
                label={a.label}
                institution={a.institution}
                currency={a.currency}
                currentBalance={a.currentBalance}
                color={a.color}
                locale={locale}
              />
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}
