import { getTranslations } from 'next-intl/server';
import { requireOnboardedUser } from '@/lib/auth/session';
import { getBudgetsForMonth, budgetableCategories } from '@/lib/db/queries/budgets';
import { prisma } from '@/lib/db/client';
import { MonthSelector } from '@/components/budget/MonthSelector';
import { BudgetRow } from '@/components/budget/BudgetRow';
import { AddBudgetButton } from './add-budget';
import { Amount } from '@/components/money/Amount';
import type { SupportedCurrency, SupportedLocale } from '@/lib/money/currency';

export const dynamic = 'force-dynamic';

type Props = {
  searchParams: Promise<{ year?: string; month?: string }>;
};

export default async function BudgetPage({ searchParams }: Props) {
  const user = await requireOnboardedUser();
  const t = await getTranslations('budget');
  const sp = await searchParams;

  const now = new Date();
  const year = Number(sp.year) || now.getFullYear();
  const month = Number.isFinite(Number(sp.month)) ? Number(sp.month) : now.getMonth();

  const [rows, categories, userRow] = await Promise.all([
    getBudgetsForMonth(user.id, year, month),
    budgetableCategories(user.id),
    prisma.user.findUniqueOrThrow({
      where: { id: user.id },
      select: { primaryCurrency: true, locale: true },
    }),
  ]);

  const primaryCurrency = (userRow.primaryCurrency ?? 'XOF') as SupportedCurrency;
  const locale: SupportedLocale = userRow.locale === 'en' ? 'en' : 'fr';

  const budgeted = rows.filter((r) => r.id !== null);
  const unbudgeted = rows.filter((r) => r.id === null);

  const totalLimit = budgeted.reduce((sum, r) => sum + r.monthlyLimit, 0);
  const totalSpent = rows.reduce((sum, r) => sum + r.spent, 0);
  const availableCategoryIds = new Set(
    categories.map((c) => c.id).filter((id) => !budgeted.some((b) => b.categoryId === id)),
  );
  const addableCategories = categories.filter((c) => availableCategoryIds.has(c.id));

  return (
    <div className="mx-auto max-w-3xl px-5 pb-12 pt-8 md:px-10 md:pt-12">
      <header>
        <h1
          className="editorial-title text-foreground"
          style={{ fontSize: 'clamp(1.75rem, 4vw, 2.5rem)' }}
        >
          {t('title')}
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">{t('subtitle')}</p>
        <div className="rule-ochre mt-4" />
      </header>

      <div className="mt-6 flex justify-center">
        <MonthSelector year={year} month={month} locale={locale} />
      </div>

      {/* Totaux du mois */}
      <section className="mt-8 rounded-[10px] border border-border bg-[color:var(--surface)] px-5 py-4">
        <div className="flex items-baseline justify-between gap-4">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
              {t('totalsSpent')}
            </p>
            <Amount
              value={totalSpent}
              currency={primaryCurrency}
              locale={locale}
              size="lg"
              className="font-semibold"
            />
          </div>
          {totalLimit > 0 ? (
            <div className="text-right">
              <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                {t('totalsBudget')}
              </p>
              <Amount
                value={totalLimit}
                currency={primaryCurrency}
                locale={locale}
                size="md"
                className="font-medium text-muted-foreground"
              />
            </div>
          ) : null}
        </div>
      </section>

      {/* Budgets actifs */}
      <section className="mt-10">
        <div className="flex items-center justify-between">
          <p className="font-mono text-[11px] uppercase tracking-[0.24em] text-muted-foreground">
            {t('active')}
          </p>
          <AddBudgetButton categories={addableCategories.map((c) => ({ id: c.id, label: c.label, color: c.color }))} currency={primaryCurrency} locale={locale} />
        </div>
        <div className="mt-2">
          {budgeted.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">{t('empty')}</p>
          ) : (
            budgeted.map((r) => (
              <BudgetRow
                key={r.categoryId}
                categoryId={r.categoryId}
                categoryLabel={r.categoryLabel}
                categoryColor={r.categoryColor}
                spent={r.spent}
                monthlyLimit={r.monthlyLimit}
                currency={r.currency}
                ratio={r.ratio}
                tone={r.tone}
                alertAt70={r.alertAt70}
                alertAt90={r.alertAt90}
                blockAt100={r.blockAt100}
                locale={locale}
              />
            ))
          )}
        </div>
      </section>

      {/* Catégories dépensées sans budget */}
      {unbudgeted.length > 0 ? (
        <section className="mt-10">
          <p className="font-mono text-[11px] uppercase tracking-[0.24em] text-muted-foreground">
            {t('unbudgeted')}
          </p>
          <div className="mt-2">
            {unbudgeted.map((r) => (
              <BudgetRow
                key={r.categoryId}
                categoryId={r.categoryId}
                categoryLabel={r.categoryLabel}
                categoryColor={r.categoryColor}
                spent={r.spent}
                monthlyLimit={0}
                currency={r.currency}
                ratio={0}
                tone="calm"
                alertAt70={true}
                alertAt90={true}
                blockAt100={false}
                locale={locale}
              />
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}
