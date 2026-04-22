import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import { format } from 'date-fns';
import { requireOnboardedUser } from '@/lib/auth/session';
import { listTransactions } from '@/lib/db/queries/transactions';
import { prisma } from '@/lib/db/client';
import { DayGroup } from '@/components/transactions/DayGroup';
import type { SupportedLocale } from '@/lib/money/currency';
import type { TransactionKind } from '@prisma/client';

export const dynamic = 'force-dynamic';

type Props = {
  searchParams: Promise<{ kind?: string; accountId?: string; from?: string; to?: string; q?: string }>;
};

export default async function TransactionsPage({ searchParams }: Props) {
  const user = await requireOnboardedUser();
  const t = await getTranslations('transactions.list');
  const sp = await searchParams;

  const filters = {
    kind: sp.kind && /^[A-Z_]+$/.test(sp.kind) ? (sp.kind as TransactionKind) : undefined,
    accountId: sp.accountId || undefined,
    from: sp.from ? new Date(sp.from) : undefined,
    to: sp.to ? new Date(sp.to) : undefined,
    search: sp.q || undefined,
  };

  const [transactions, userRow] = await Promise.all([
    listTransactions(user.id, filters, { limit: 150 }),
    prisma.user.findUniqueOrThrow({
      where: { id: user.id },
      select: { locale: true },
    }),
  ]);

  const locale: SupportedLocale = userRow.locale === 'en' ? 'en' : 'fr';

  // Regroupe par jour (début de journée locale).
  const buckets = new Map<string, typeof transactions>();
  for (const tx of transactions) {
    const dayKey = format(tx.occurredAt, 'yyyy-MM-dd');
    const arr = buckets.get(dayKey) ?? [];
    arr.push(tx);
    buckets.set(dayKey, arr);
  }

  return (
    <div className="mx-auto max-w-3xl px-5 pb-12 pt-8 md:px-10 md:pt-12">
      <header className="flex items-start justify-between gap-4">
        <div>
          <h1
            className="editorial-title text-foreground"
            style={{ fontSize: 'clamp(1.75rem, 4vw, 2.5rem)' }}
          >
            {t('title')}
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {t('subtitle', { count: transactions.length })}
          </p>
        </div>
        <Link
          href="/transactions/new"
          className="mt-1 inline-flex items-center gap-2 rounded-[10px] bg-[color:var(--forest)] px-4 py-2.5 text-sm text-[color:var(--paper)] transition-colors hover:bg-[color:var(--forest-deep)]"
        >
          <span className="font-display text-lg leading-none" aria-hidden>
            +
          </span>
          <span>{t('add')}</span>
        </Link>
      </header>
      <div className="rule-ochre mt-4" />

      {transactions.length === 0 ? (
        <p className="mt-12 text-center text-sm text-muted-foreground">{t('empty')}</p>
      ) : (
        <div className="mt-6">
          {Array.from(buckets.entries()).map(([dayKey, txs]) => {
            const firstTx = txs[0];
            if (!firstTx) return null;
            return (
              <DayGroup
                key={dayKey}
                day={firstTx.occurredAt}
                transactions={txs.map((tx) => ({
                  id: tx.id,
                  occurredAt: tx.occurredAt,
                  kind: tx.kind,
                  amount: Number(tx.amount),
                  currency: tx.currency,
                  accountLabel: tx.account.label,
                  categoryLabel: tx.category?.label ?? null,
                  merchant: tx.merchant,
                  note: tx.note,
                }))}
                locale={locale}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}
