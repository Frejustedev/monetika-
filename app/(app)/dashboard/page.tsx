import Link from 'next/link';
import { format } from 'date-fns';
import { fr, enUS } from 'date-fns/locale';
import { getTranslations } from 'next-intl/server';
import { requireOnboardedUser } from '@/lib/auth/session';
import { getDashboardData } from '@/lib/db/queries/dashboard';
import { Amount } from '@/components/money/Amount';
import { StrategyBar } from '@/components/charts/StrategyBar';
import { AccountRow } from '@/components/dashboard/AccountRow';
import { TransactionRow } from '@/components/dashboard/TransactionRow';
import type { SupportedCurrency, SupportedLocale } from '@/lib/money/currency';

export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
  const user = await requireOnboardedUser();
  const data = await getDashboardData(user.id);
  const locale: SupportedLocale = (data.user.locale === 'en' ? 'en' : 'fr') as SupportedLocale;
  const t = await getTranslations('dashboard');

  const todayLabel =
    locale === 'fr'
      ? format(new Date(), "EEEE d MMMM yyyy", { locale: fr })
      : format(new Date(), 'EEEE, MMMM d, yyyy', { locale: enUS });

  return (
    <div className="mx-auto max-w-3xl px-5 pb-12 pt-8 md:px-10 md:pt-12">
      {/* En-tête éditorial */}
      <header>
        <h1 className="editorial-title text-foreground" style={{ fontSize: 'clamp(1.75rem, 4vw, 2.5rem)' }}>
          {locale === 'fr' ? 'aujourd\u2019hui' : 'today'}
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">{todayLabel}</p>
        <div className="rule-ochre mt-4" />
      </header>

      {/* Net worth */}
      <section className="mt-10">
        <p className="font-mono text-[11px] uppercase tracking-[0.24em] text-muted-foreground">
          {t('netWorth.overline')}
        </p>
        <div className="mt-3">
          <Amount
            value={data.netWorth.primary}
            currency={data.netWorth.primaryCurrency as SupportedCurrency}
            locale={locale}
            size="xxl"
            className="font-semibold"
          />
        </div>
        {data.netWorth.otherCurrenciesCount > 0 ? (
          <p className="mt-3 font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
            {t('netWorth.multiCurrency', { count: data.netWorth.otherCurrenciesCount })}
          </p>
        ) : null}
      </section>

      {/* Barre stratégique */}
      {data.bucketTotals.length > 0 ? (
        <section className="mt-10">
          <div className="mb-4 flex items-baseline justify-between">
            <p className="font-mono text-[11px] uppercase tracking-[0.24em] text-muted-foreground">
              {t('strategy.overline')}
            </p>
            <Link
              href="/settings"
              className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground hover:text-foreground"
            >
              {t('strategy.adjust')}
            </Link>
          </div>
          <StrategyBar
            data={data.bucketTotals.map((b) => ({ bucket: b.bucket, amount: b.amount }))}
            locale={locale}
          />
        </section>
      ) : null}

      {/* Insight du jour */}
      {data.insight ? (
        <section className="mt-10 border-t border-border pt-6">
          <p className="font-mono text-[11px] uppercase tracking-[0.24em] text-muted-foreground">
            {t('insight.overline')}
          </p>
          <p className="mt-2 text-base leading-[1.6] text-foreground">{data.insight.text}</p>
        </section>
      ) : null}

      {/* Comptes */}
      <section className="mt-10">
        <div className="mb-3 flex items-baseline justify-between">
          <p className="font-mono text-[11px] uppercase tracking-[0.24em] text-muted-foreground">
            {t('accounts.overline')}
          </p>
          <Link
            href="/accounts"
            className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground hover:text-foreground"
          >
            {t('accounts.all')}
          </Link>
        </div>
        <div>
          {data.accounts.length === 0 ? (
            <p className="text-sm text-muted-foreground">{t('accounts.empty')}</p>
          ) : (
            data.accounts.map((a) => (
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

      {/* Mouvements récents */}
      <section className="mt-10">
        <div className="mb-3 flex items-baseline justify-between">
          <p className="font-mono text-[11px] uppercase tracking-[0.24em] text-muted-foreground">
            {t('recent.overline')}
          </p>
          <Link
            href="/transactions"
            className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground hover:text-foreground"
          >
            {t('recent.all')}
          </Link>
        </div>
        <div>
          {data.recentTransactions.length === 0 ? (
            <p className="text-sm text-muted-foreground">{t('recent.empty')}</p>
          ) : (
            data.recentTransactions.map((tx) => (
              <TransactionRow
                key={tx.id}
                occurredAt={tx.occurredAt}
                kind={tx.kind}
                amount={tx.amount}
                currency={tx.currency}
                accountLabel={tx.accountLabel}
                categoryLabel={tx.categoryLabel}
                merchant={tx.merchant}
                note={tx.note}
                locale={locale}
              />
            ))
          )}
        </div>
      </section>
    </div>
  );
}
