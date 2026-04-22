import { notFound } from 'next/navigation';
import Link from 'next/link';
import { format } from 'date-fns';
import { fr, enUS } from 'date-fns/locale';
import { getTranslations } from 'next-intl/server';
import { requireOnboardedUser } from '@/lib/auth/session';
import { getGoalWithHistory } from '@/lib/db/queries/goals';
import { prisma } from '@/lib/db/client';
import { Amount } from '@/components/money/Amount';
import { GoalProjection } from '@/components/goals/GoalProjection';
import { ContributeForm } from './contribute-form';
import { DeleteGoalButton } from './delete-button';
import { BUCKET_LABELS_FR, BUCKET_LABELS_EN } from '@/lib/strategy/buckets';
import type { SupportedCurrency, SupportedLocale } from '@/lib/money/currency';

export const dynamic = 'force-dynamic';

type Props = { params: Promise<{ id: string }> };

export default async function GoalDetailPage({ params }: Props) {
  const user = await requireOnboardedUser();
  const { id } = await params;
  const result = await getGoalWithHistory(user.id, id);
  if (!result) notFound();

  const { goal, contributions } = result;
  const t = await getTranslations('goals.detail');
  const userRow = await prisma.user.findUniqueOrThrow({
    where: { id: user.id },
    select: { locale: true },
  });
  const locale: SupportedLocale = userRow.locale === 'en' ? 'en' : 'fr';
  const labels = locale === 'fr' ? BUCKET_LABELS_FR : BUCKET_LABELS_EN;
  const dateLocale = locale === 'fr' ? fr : enUS;
  const currency = goal.currency as SupportedCurrency;

  const targetAmount = Number(goal.targetAmount);
  const currentAmount = Number(goal.currentAmount);
  const startingAmount = Number(goal.startingAmount);
  const progressPct = targetAmount > 0 ? Math.max(0, Math.min(1, currentAmount / targetAmount)) : 0;
  const remaining = Math.max(0, targetAmount - currentAmount);

  // Historique cumulatif pour la courbe.
  let running = startingAmount;
  const cumulativePoints = contributions.map((c) => {
    running += Number(c.amount);
    return { date: c.occurredAt, amount: running };
  });

  const monthsLeft = Math.max(
    0,
    Math.floor((goal.targetDate.getTime() - Date.now()) / (30 * 86400_000)),
  );
  const monthlyNeeded = monthsLeft > 0 ? Math.ceil(remaining / monthsLeft) : remaining;

  return (
    <div className="mx-auto max-w-3xl px-5 pb-12 pt-8 md:px-10 md:pt-12">
      <header>
        <p className="font-mono text-[11px] uppercase tracking-[0.24em] text-muted-foreground">
          {labels[goal.strategyBucket].long}
        </p>
        <h1
          className="mt-2 font-display font-medium leading-[1.05] tracking-[-0.02em]"
          style={{ fontSize: 'clamp(1.75rem, 4vw, 2.5rem)' }}
        >
          {goal.name}
        </h1>
        {goal.isAchieved ? (
          <p className="mt-2 font-mono text-[10px] uppercase tracking-[0.18em] text-[color:var(--ochre)]">
            {t('achieved')}
            {goal.achievedAt ? ` · ${format(goal.achievedAt, 'd MMM yyyy', { locale: dateLocale })}` : ''}
          </p>
        ) : null}
        <div className="rule-ochre mt-4" />
      </header>

      {/* Progression */}
      <section className="mt-8">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="font-mono text-[11px] uppercase tracking-[0.24em] text-muted-foreground">
              {t('progress')}
            </p>
            <Amount
              value={currentAmount}
              currency={currency}
              locale={locale}
              size="xl"
              className="font-semibold"
            />
            <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
              /{' '}
              <Amount value={targetAmount} currency={currency} locale={locale} size="sm" />
              {' · '}
              {Math.round(progressPct * 100)}%
            </p>
          </div>
          <div className="text-right">
            <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
              {t('targetDate')}
            </p>
            <p className="text-sm font-medium text-foreground">
              {format(goal.targetDate, 'd MMM yyyy', { locale: dateLocale })}
            </p>
            {!goal.isAchieved ? (
              <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
                {monthsLeft > 0
                  ? locale === 'fr'
                    ? `${monthsLeft} mois restants`
                    : `${monthsLeft} months left`
                  : locale === 'fr'
                    ? 'Échéance atteinte'
                    : 'Date reached'}
              </p>
            ) : null}
          </div>
        </div>
      </section>

      {/* Projection */}
      <section className="mt-10">
        <p className="font-mono text-[11px] uppercase tracking-[0.24em] text-muted-foreground">
          {t('projection')}
        </p>
        <div className="mt-3 rounded-[10px] border border-border bg-[color:var(--surface)] p-3">
          <GoalProjection
            createdAt={goal.createdAt}
            targetDate={goal.targetDate}
            startingAmount={startingAmount}
            targetAmount={targetAmount}
            currentAmount={currentAmount}
            contributions={cumulativePoints}
            className="w-full"
          />
        </div>
      </section>

      {/* Contribuer */}
      {!goal.isAchieved ? (
        <section className="mt-10">
          <p className="font-mono text-[11px] uppercase tracking-[0.24em] text-muted-foreground">
            {t('contributeOverline')}
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            {t('contributeHint', {
              amount: monthlyNeeded > 0
                ? new Intl.NumberFormat(locale === 'fr' ? 'fr-FR' : 'en', {
                    style: 'currency',
                    currency,
                    maximumFractionDigits: 0,
                  }).format(monthlyNeeded)
                : '—',
            })}
          </p>
          <div className="mt-3">
            <ContributeForm
              id={goal.id}
              currency={currency}
              suggestedAmount={monthlyNeeded}
              locale={locale}
            />
          </div>
        </section>
      ) : null}

      {/* Historique contributions */}
      {contributions.length > 0 ? (
        <section className="mt-10">
          <p className="font-mono text-[11px] uppercase tracking-[0.24em] text-muted-foreground">
            {t('historyOverline')}
          </p>
          <ul className="mt-3">
            {contributions.slice().reverse().map((c) => (
              <li
                key={c.id}
                className="flex items-baseline justify-between gap-4 border-b border-border py-2.5 text-sm last:border-b-0"
              >
                <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
                  {format(c.occurredAt, 'd MMM yyyy', { locale: dateLocale })}
                </span>
                <Amount value={Number(c.amount)} currency={currency} locale={locale} size="sm" className="font-medium" />
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {/* Actions */}
      <section className="mt-12 flex items-center justify-between">
        <Link href="/goals" className="text-sm text-muted-foreground hover:text-foreground">
          <span className="font-display italic" aria-hidden>
            ←
          </span>{' '}
          {t('back')}
        </Link>
        <DeleteGoalButton id={goal.id} />
      </section>
    </div>
  );
}
