import { notFound } from 'next/navigation';
import Link from 'next/link';
import { format } from 'date-fns';
import { fr, enUS } from 'date-fns/locale';
import { getTranslations } from 'next-intl/server';
import { requireOnboardedUser } from '@/lib/auth/session';
import { getUserAccount, getAccountTransactions } from '@/lib/db/queries/accounts';
import { prisma } from '@/lib/db/client';
import { Amount } from '@/components/money/Amount';
import { TransactionRow } from '@/components/dashboard/TransactionRow';
import type { SupportedCurrency, SupportedLocale } from '@/lib/money/currency';
import { BUCKET_LABELS_FR, BUCKET_LABELS_EN } from '@/lib/strategy/buckets';
import { AdjustBalanceForm } from './adjust-form';
import { BlockToggle } from './block-toggle';

export const dynamic = 'force-dynamic';

type Props = { params: Promise<{ id: string }> };

export default async function AccountDetailPage({ params }: Props) {
  const user = await requireOnboardedUser();
  const { id } = await params;
  const account = await getUserAccount(user.id, id);
  if (!account) notFound();

  const t = await getTranslations('accounts.detail');
  const userRow = await prisma.user.findUniqueOrThrow({
    where: { id: user.id },
    select: { locale: true },
  });
  const locale: SupportedLocale = (userRow.locale === 'en' ? 'en' : 'fr') as SupportedLocale;
  const bucketLabels = locale === 'fr' ? BUCKET_LABELS_FR : BUCKET_LABELS_EN;

  const transactions = await getAccountTransactions(user.id, id);
  const dateLocale = locale === 'fr' ? fr : enUS;

  return (
    <div className="mx-auto max-w-3xl px-5 pb-12 pt-8 md:px-10 md:pt-12">
      <header>
        <p className="font-mono text-[11px] uppercase tracking-[0.24em] text-muted-foreground">
          {account.institution}
        </p>
        <h1
          className="mt-2 font-display font-medium leading-[1.05] tracking-[-0.02em]"
          style={{ fontSize: 'clamp(1.75rem, 4vw, 2.5rem)' }}
        >
          {account.label}
        </h1>
        <p className="mt-1 font-mono text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
          {t(`kinds.${account.kind}`)}
          {account.strategyBucket ? ` · ${bucketLabels[account.strategyBucket].short}` : ''}
        </p>
        <div className="rule-ochre mt-4" />
      </header>

      <section className="mt-8">
        <p className="font-mono text-[11px] uppercase tracking-[0.24em] text-muted-foreground">
          {t('balance')}
        </p>
        <div className="mt-3">
          <Amount
            value={Number(account.currentBalance)}
            currency={account.currency as SupportedCurrency}
            locale={locale}
            size="xl"
            className="font-semibold"
          />
        </div>
        {account.lastReconciled ? (
          <p className="mt-2 font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
            {t('reconciledAt', {
              date: format(account.lastReconciled, 'PP', { locale: dateLocale }),
            })}
          </p>
        ) : null}
      </section>

      <section className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <AdjustBalanceForm
          id={account.id}
          currentBalance={Number(account.currentBalance)}
          currency={account.currency}
        />
        <BlockToggle id={account.id} isBlocked={account.isBlocked} />
      </section>

      <section className="mt-10">
        <div className="mb-3 flex items-baseline justify-between">
          <p className="font-mono text-[11px] uppercase tracking-[0.24em] text-muted-foreground">
            {t('history')}
          </p>
          <a
            href={`/accounts/${account.id}/export`}
            className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground hover:text-foreground"
            download
          >
            {t('exportCsv')}
          </a>
        </div>
        <div>
          {transactions.length === 0 ? (
            <p className="text-sm text-muted-foreground">{t('empty')}</p>
          ) : (
            transactions.map((tx) => (
              <TransactionRow
                key={tx.id}
                occurredAt={tx.occurredAt}
                kind={tx.kind}
                amount={Number(tx.amount)}
                currency={tx.currency}
                accountLabel={account.label}
                categoryLabel={tx.category?.label ?? null}
                merchant={tx.merchant}
                note={tx.note}
                locale={locale}
              />
            ))
          )}
        </div>
      </section>

      <div className="mt-10 text-sm">
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
