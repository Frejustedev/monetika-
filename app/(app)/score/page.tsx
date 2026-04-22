import { format } from 'date-fns';
import { fr, enUS } from 'date-fns/locale';
import { getTranslations } from 'next-intl/server';
import { requireOnboardedUser } from '@/lib/auth/session';
import { getLatestOrComputeNef, getNefHistory, type CriterionKey } from '@/lib/scoring/nef';
import { prisma } from '@/lib/db/client';
import { ScoreDisplay } from '@/components/score/ScoreDisplay';
import { CriteriaBreakdown } from '@/components/score/CriteriaBreakdown';
import { ScoreSparkline } from '@/components/score/ScoreSparkline';

export const dynamic = 'force-dynamic';

export default async function ScorePage() {
  const user = await requireOnboardedUser();
  const t = await getTranslations('score');
  const userRow = await prisma.user.findUniqueOrThrow({
    where: { id: user.id },
    select: { locale: true },
  });
  const locale = (userRow.locale === 'en' ? 'en' : 'fr') as 'fr' | 'en';

  const [nef, history] = await Promise.all([
    getLatestOrComputeNef(user.id),
    getNefHistory(user.id, 12),
  ]);

  const dateLocale = locale === 'fr' ? fr : enUS;

  return (
    <div className="mx-auto max-w-3xl px-5 pb-12 pt-8 md:px-10 md:pt-12">
      <header>
        <h1 className="editorial-title text-foreground" style={{ fontSize: 'clamp(1.75rem, 4vw, 2.5rem)' }}>
          {t('title')}
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {t('subtitle', {
            date: format(nef.computedAt, 'd MMMM yyyy', { locale: dateLocale }),
          })}
        </p>
        <div className="rule-ochre mt-4" />
      </header>

      <section className="mt-12">
        <ScoreDisplay score={nef.score} level={nef.level} locale={locale} />
      </section>

      <section className="mt-16">
        <p className="font-mono text-[11px] uppercase tracking-[0.24em] text-muted-foreground">
          {t('breakdown')}
        </p>
        <div className="mt-4">
          <CriteriaBreakdown breakdown={nef.breakdown} locale={locale} />
        </div>
      </section>

      {nef.recommendations.length > 0 ? (
        <section className="mt-12">
          <p className="font-mono text-[11px] uppercase tracking-[0.24em] text-muted-foreground">
            {t('recommendations')}
          </p>
          <ol className="mt-4 space-y-4">
            {nef.recommendations.map((rec, i) => (
              <li key={rec.key} className="flex gap-4">
                <span className="font-display italic text-[color:var(--ochre)]">{toRoman(i + 1)}</span>
                <span className="text-sm leading-[1.6] text-foreground">{rec.message}</span>
              </li>
            ))}
          </ol>
        </section>
      ) : null}

      <section className="mt-12">
        <p className="font-mono text-[11px] uppercase tracking-[0.24em] text-muted-foreground">
          {t('history')}
        </p>
        <div className="mt-4 rounded-[10px] border border-border bg-[color:var(--surface)] p-3">
          <ScoreSparkline
            points={history.map((h) => ({ date: h.computedAt, score: h.score }))}
            className="w-full"
          />
        </div>
      </section>

      <section className="mt-12 flex flex-wrap gap-3">
        <a
          href="/score/export"
          className="inline-flex items-center gap-2 rounded-[10px] border border-border px-4 py-2.5 text-sm text-foreground transition-colors hover:bg-[color:var(--surface)]"
          download
        >
          <span aria-hidden>↓</span>
          {t('exportPdf')}
        </a>
      </section>
    </div>
  );
}

function toRoman(n: number): string {
  return ['I', 'II', 'III'][n - 1] ?? String(n);
}

export type _OnlyForExport = CriterionKey;
