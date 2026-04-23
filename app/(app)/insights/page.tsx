import { getTranslations } from 'next-intl/server';
import { requireOnboardedUser } from '@/lib/auth/session';
import { prisma } from '@/lib/db/client';
import { getMonthSummary, getYearSummary } from '@/lib/db/queries/insights';
import { TabSwitcher } from '@/components/insights/TabSwitcher';
import { MonthSelector } from '@/components/budget/MonthSelector';
import { Amount } from '@/components/money/Amount';
import { StrategyBar } from '@/components/charts/StrategyBar';
import { Treemap } from '@/components/charts/Treemap';
import { MonthlyBars } from '@/components/charts/MonthlyBars';
import type { SupportedCurrency, SupportedLocale } from '@/lib/money/currency';

export const dynamic = 'force-dynamic';

type Props = {
  searchParams: Promise<{ view?: 'month' | 'year'; year?: string; month?: string }>;
};

export default async function InsightsPage({ searchParams }: Props) {
  const user = await requireOnboardedUser();
  const t = await getTranslations('insights');
  const sp = await searchParams;
  const view: 'month' | 'year' = sp.view === 'year' ? 'year' : 'month';

  const now = new Date();
  const year = Number(sp.year) || now.getFullYear();
  const month = Number.isFinite(Number(sp.month)) ? Number(sp.month) : now.getMonth();

  const userRow = await prisma.user.findUniqueOrThrow({
    where: { id: user.id },
    select: { locale: true },
  });
  const locale: SupportedLocale = userRow.locale === 'en' ? 'en' : 'fr';

  return (
    <div className="mx-auto max-w-3xl px-5 pb-12 pt-8 md:px-10 md:pt-12">
      <header>
        <h1 className="editorial-title text-foreground" style={{ fontSize: 'clamp(1.75rem, 4vw, 2.5rem)' }}>
          {t('title')}
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">{t('subtitle')}</p>
        <div className="rule-ochre mt-4" />
      </header>

      <div className="mt-6 flex flex-wrap items-center justify-between gap-4">
        <TabSwitcher view={view} labels={{ month: t('tabs.month'), year: t('tabs.year') }} />
        {view === 'month' ? <MonthSelector year={year} month={month} locale={locale} /> : (
          <YearSelector year={year} />
        )}
      </div>

      {view === 'month' ? (
        <MonthView userId={user.id} year={year} month={month} locale={locale} />
      ) : (
        <YearView userId={user.id} year={year} locale={locale} />
      )}
    </div>
  );
}

async function MonthView({
  userId,
  year,
  month,
  locale,
}: {
  userId: string;
  year: number;
  month: number;
  locale: SupportedLocale;
}) {
  const t = await getTranslations('insights.month');
  const summary = await getMonthSummary(userId, year, month, { compareToPrevious: true });
  const currency = summary.currency as SupportedCurrency;

  return (
    <>
      {/* Totaux */}
      <section className="mt-8 grid gap-4 sm:grid-cols-3">
        <Metric label={t('income')} amount={summary.income} currency={currency} locale={locale} delta={summary.deltas?.income} tone="positive" />
        <Metric label={t('expense')} amount={summary.expense} currency={currency} locale={locale} delta={summary.deltas?.expense} tone="negative" />
        <Metric
          label={t('savingsRate')}
          amount={Math.round(summary.savingsRate * 100)}
          currency={'XOF' as SupportedCurrency}
          locale={locale}
          deltaPoints={summary.deltas ? Math.round(summary.deltas.savingsRate * 100) : undefined}
          percent
        />
      </section>

      {/* Stratégie + Treemap */}
      <section className="mt-10 grid gap-6 md:grid-cols-2">
        <div>
          <p className="font-mono text-[11px] uppercase tracking-[0.24em] text-muted-foreground">
            {t('strategyOverline')}
          </p>
          <div className="mt-3">
            <StrategyBar data={summary.bucketTotals} locale={locale} />
          </div>
        </div>
        <div>
          <p className="font-mono text-[11px] uppercase tracking-[0.24em] text-muted-foreground">
            {t('incomeOverline')}
          </p>
          <ul className="mt-3 space-y-2">
            {summary.incomeBySource.length === 0 ? (
              <li className="text-sm text-muted-foreground">{t('empty')}</li>
            ) : (
              summary.incomeBySource.slice(0, 6).map((src) => (
                <li key={src.label} className="flex items-baseline justify-between gap-3 border-b border-border pb-1.5 text-sm">
                  <span className="flex items-center gap-2">
                    <span className="h-2 w-2 flex-shrink-0 rounded-full" style={{ background: src.color }} aria-hidden />
                    <span>{src.label}</span>
                  </span>
                  <Amount value={src.amount} currency={currency} locale={locale} size="sm" className="font-medium" />
                </li>
              ))
            )}
          </ul>
        </div>
      </section>

      <section className="mt-10">
        <p className="font-mono text-[11px] uppercase tracking-[0.24em] text-muted-foreground">
          {t('expenseTreemap')}
        </p>
        <div className="mt-3 rounded-[10px] border border-border bg-[color:var(--surface)] p-2">
          <Treemap items={summary.expenseByCategory} className="w-full" />
        </div>
      </section>

      <section className="mt-10 flex flex-wrap gap-3">
        <a
          href={`/insights/export?view=month&year=${year}&month=${month}&format=csv`}
          download
          className="inline-flex items-center gap-2 rounded-[10px] border border-border px-4 py-2.5 text-sm text-foreground transition-colors hover:bg-[color:var(--surface)]"
        >
          <span aria-hidden>↓</span> CSV
        </a>
        <a
          href={`/insights/export?view=month&year=${year}&month=${month}&format=pdf`}
          download
          className="inline-flex items-center gap-2 rounded-[10px] border border-border px-4 py-2.5 text-sm text-foreground transition-colors hover:bg-[color:var(--surface)]"
        >
          <span aria-hidden>↓</span> PDF
        </a>
      </section>
    </>
  );
}

async function YearView({
  userId,
  year,
  locale,
}: {
  userId: string;
  year: number;
  locale: SupportedLocale;
}) {
  const t = await getTranslations('insights.year');
  const summary = await getYearSummary(userId, year);
  const currency = summary.currency as SupportedCurrency;

  const deltaIncome = summary.prevYear && summary.prevYear.totalIncome > 0
    ? (summary.totalIncome - summary.prevYear.totalIncome) / summary.prevYear.totalIncome
    : undefined;
  const deltaExpense = summary.prevYear && summary.prevYear.totalExpense > 0
    ? (summary.totalExpense - summary.prevYear.totalExpense) / summary.prevYear.totalExpense
    : undefined;

  return (
    <>
      <section className="mt-8 grid gap-4 sm:grid-cols-2">
        <Metric label={t('totalIncome')} amount={summary.totalIncome} currency={currency} locale={locale} delta={deltaIncome} tone="positive" />
        <Metric label={t('totalExpense')} amount={summary.totalExpense} currency={currency} locale={locale} delta={deltaExpense} tone="negative" />
      </section>

      <section className="mt-10">
        <p className="font-mono text-[11px] uppercase tracking-[0.24em] text-muted-foreground">
          {t('monthlyBars')}
        </p>
        <div className="mt-3 rounded-[10px] border border-border bg-[color:var(--surface)] p-3">
          <MonthlyBars year={year} data={summary.byMonth} locale={locale} className="w-full" />
        </div>
      </section>

      <section className="mt-10 grid gap-6 md:grid-cols-2">
        <div>
          <p className="font-mono text-[11px] uppercase tracking-[0.24em] text-muted-foreground">
            {t('topCategories')}
          </p>
          <ul className="mt-3 space-y-2">
            {summary.topExpenseCategories.length === 0 ? (
              <li className="text-sm text-muted-foreground">{t('empty')}</li>
            ) : (
              summary.topExpenseCategories.map((c) => (
                <li key={c.label} className="flex items-baseline justify-between gap-3 border-b border-border pb-1.5 text-sm">
                  <span className="flex items-center gap-2">
                    <span className="h-2 w-2 flex-shrink-0 rounded-full" style={{ background: c.color }} aria-hidden />
                    <span>{c.label}</span>
                  </span>
                  <span className="flex items-baseline gap-2">
                    <Amount value={c.amount} currency={currency} locale={locale} size="sm" className="font-medium" />
                    <span className="font-mono text-[10px] text-muted-foreground">
                      {Math.round(c.share * 100)}%
                    </span>
                  </span>
                </li>
              ))
            )}
          </ul>
        </div>
        <div>
          <p className="font-mono text-[11px] uppercase tracking-[0.24em] text-muted-foreground">
            {t('goalsProgress')}
          </p>
          <ul className="mt-3 space-y-3">
            {summary.goalsProgress.length === 0 ? (
              <li className="text-sm text-muted-foreground">{t('empty')}</li>
            ) : (
              summary.goalsProgress.map((g) => {
                const ratio = g.target > 0 ? Math.max(0, Math.min(1, g.current / g.target)) : 0;
                return (
                  <li key={g.name}>
                    <div className="flex items-baseline justify-between gap-3 text-sm">
                      <span className="truncate">{g.name}</span>
                      <span className="font-display tabular-nums text-sm">{Math.round(ratio * 100)}%</span>
                    </div>
                    <div className="mt-1 h-1 overflow-hidden rounded-full bg-[color:var(--bone)]">
                      <span
                        className="block h-full bg-[color:var(--forest)]"
                        style={{ width: `${ratio * 100}%` }}
                        aria-hidden
                      />
                    </div>
                  </li>
                );
              })
            )}
          </ul>
        </div>
      </section>

      <section className="mt-10 flex flex-wrap gap-3">
        <a
          href={`/insights/export?view=year&year=${year}&format=csv`}
          download
          className="inline-flex items-center gap-2 rounded-[10px] border border-border px-4 py-2.5 text-sm text-foreground transition-colors hover:bg-[color:var(--surface)]"
        >
          <span aria-hidden>↓</span> CSV
        </a>
        <a
          href={`/insights/export?view=year&year=${year}&format=pdf`}
          download
          className="inline-flex items-center gap-2 rounded-[10px] border border-border px-4 py-2.5 text-sm text-foreground transition-colors hover:bg-[color:var(--surface)]"
        >
          <span aria-hidden>↓</span> PDF
        </a>
      </section>
    </>
  );
}

function Metric({
  label,
  amount,
  currency,
  locale,
  delta,
  deltaPoints,
  tone,
  percent = false,
}: {
  label: string;
  amount: number;
  currency: SupportedCurrency;
  locale: SupportedLocale;
  delta?: number;
  deltaPoints?: number;
  tone?: 'positive' | 'negative';
  percent?: boolean;
}) {
  const hasDelta = delta !== undefined || deltaPoints !== undefined;
  const deltaValue = delta !== undefined ? delta : deltaPoints;
  const deltaLabel = delta !== undefined
    ? `${delta > 0 ? '+' : ''}${Math.round(delta * 100)}%`
    : deltaPoints !== undefined
      ? `${deltaPoints > 0 ? '+' : ''}${deltaPoints} pts`
      : null;

  const deltaIsPositive =
    tone === 'negative' ? (deltaValue ?? 0) < 0 : (deltaValue ?? 0) > 0;

  return (
    <div className="rounded-[10px] border border-border p-4">
      <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">{label}</p>
      <div className="mt-2">
        {percent ? (
          <span className="amount-xl text-2xl font-semibold tabular-nums" data-numeric>
            {amount}%
          </span>
        ) : (
          <Amount value={amount} currency={currency} locale={locale} size="lg" className="font-semibold" />
        )}
      </div>
      {hasDelta ? (
        <p
          className={`mt-1 font-mono text-[10px] uppercase tracking-[0.18em] ${
            deltaIsPositive ? 'text-[color:var(--forest)]' : 'text-[color:var(--terracotta)]'
          }`}
        >
          {deltaLabel} <span className="text-muted-foreground">vs n-1</span>
        </p>
      ) : null}
    </div>
  );
}

function YearSelector({ year }: { year: number }) {
  const current = new Date().getFullYear();
  const prev = year - 1;
  const next = Math.min(current, year + 1);

  return (
    <div className="flex items-center gap-2">
      <a
        href={`?view=year&year=${prev}`}
        aria-label="Année précédente"
        className="flex h-11 w-11 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-[color:var(--surface)] hover:text-foreground"
      >
        ‹
      </a>
      <p className="editorial-title text-foreground" style={{ fontSize: '1.375rem' }}>
        {year}
      </p>
      <a
        href={`?view=year&year=${next}`}
        aria-label="Année suivante"
        aria-disabled={year >= current}
        className={`flex h-11 w-11 items-center justify-center rounded-full transition-colors ${
          year >= current
            ? 'pointer-events-none text-muted-foreground/30'
            : 'text-muted-foreground hover:bg-[color:var(--surface)] hover:text-foreground'
        }`}
      >
        ›
      </a>
    </div>
  );
}
