import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import { requireOnboardedUser } from '@/lib/auth/session';
import { listGoals } from '@/lib/db/queries/goals';
import { prisma } from '@/lib/db/client';
import { GoalRow } from '@/components/goals/GoalRow';
import type { SupportedLocale } from '@/lib/money/currency';

export const dynamic = 'force-dynamic';

export default async function GoalsPage() {
  const user = await requireOnboardedUser();
  const t = await getTranslations('goals.list');

  const [goals, userRow] = await Promise.all([
    listGoals(user.id),
    prisma.user.findUniqueOrThrow({
      where: { id: user.id },
      select: { locale: true },
    }),
  ]);

  const locale: SupportedLocale = userRow.locale === 'en' ? 'en' : 'fr';
  const active = goals.filter((g) => !g.isAchieved);
  const achieved = goals.filter((g) => g.isAchieved);

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
          href="/goals/new"
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
        <p className="font-mono text-[11px] uppercase tracking-[0.24em] text-muted-foreground">
          {t('activeOverline')}
        </p>
        <div className="mt-3">
          {active.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">{t('empty')}</p>
          ) : (
            active.map((g) => (
              <GoalRow
                key={g.id}
                id={g.id}
                name={g.name}
                targetAmount={g.targetAmount}
                currentAmount={g.currentAmount}
                currency={g.currency}
                targetDate={g.targetDate}
                isAchieved={g.isAchieved}
                progressPct={g.progressPct}
                monthsLeft={g.monthsLeft}
                monthlyContributionNeeded={g.monthlyContributionNeeded}
                locale={locale}
              />
            ))
          )}
        </div>
      </section>

      {achieved.length > 0 ? (
        <section className="mt-10">
          <p className="font-mono text-[11px] uppercase tracking-[0.24em] text-muted-foreground">
            {t('achievedOverline')}
          </p>
          <div className="mt-3 opacity-70">
            {achieved.map((g) => (
              <GoalRow
                key={g.id}
                id={g.id}
                name={g.name}
                targetAmount={g.targetAmount}
                currentAmount={g.currentAmount}
                currency={g.currency}
                targetDate={g.targetDate}
                isAchieved={g.isAchieved}
                progressPct={g.progressPct}
                monthsLeft={g.monthsLeft}
                monthlyContributionNeeded={g.monthlyContributionNeeded}
                locale={locale}
              />
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}
