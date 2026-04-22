import { NextResponse } from 'next/server';
import { Document, Page, Text, View, StyleSheet, Font, renderToStream } from '@react-pdf/renderer';
import { createElement } from 'react';
import { auth } from '@/auth';
import { prisma } from '@/lib/db/client';
import { getLatestOrComputeNef, getNefHistory, type CriterionKey } from '@/lib/scoring/nef';
import path from 'node:path';

export const dynamic = 'force-dynamic';

// Fonts — on pointe vers le fs local (public/fonts/).
Font.register({
  family: 'Fraunces',
  fonts: [
    { src: path.join(process.cwd(), 'public/fonts/Fraunces-400-normal.ttf') },
    { src: path.join(process.cwd(), 'public/fonts/Fraunces-600-normal.ttf'), fontWeight: 600 },
    { src: path.join(process.cwd(), 'public/fonts/Fraunces-400-italic.ttf'), fontStyle: 'italic' },
  ],
});
Font.register({
  family: 'Instrument Sans',
  fonts: [
    { src: path.join(process.cwd(), 'public/fonts/InstrumentSans-Regular.ttf') },
    { src: path.join(process.cwd(), 'public/fonts/InstrumentSans-Bold.ttf'), fontWeight: 700 },
  ],
});

const LABELS_FR: Record<CriterionKey, string> = {
  regularity: 'Régularité de saisie',
  strategyAdherence: 'Adhérence stratégique',
  budgetDiscipline: 'Discipline budgétaire',
  savingsRate: "Taux d'épargne",
  goalProgress: 'Progression des objectifs',
  diversification: 'Diversification',
  trend: 'Tendance du patrimoine',
};

const COLORS = {
  ink: '#17160F',
  paper: '#F5F1E8',
  forest: '#1F4D3F',
  ochre: '#C89A3C',
  bone: '#D9D2BF',
  moss: '#5B7A5E',
};

const styles = StyleSheet.create({
  page: {
    backgroundColor: COLORS.paper,
    color: COLORS.ink,
    padding: 48,
    fontFamily: 'Instrument Sans',
    fontSize: 10,
  },
  wordmark: {
    fontFamily: 'Fraunces',
    fontStyle: 'italic',
    fontSize: 18,
    color: COLORS.forest,
  },
  overline: {
    fontSize: 9,
    textTransform: 'uppercase',
    letterSpacing: 2,
    color: COLORS.moss,
  },
  title: {
    fontFamily: 'Fraunces',
    fontWeight: 600,
    fontSize: 28,
    marginTop: 6,
  },
  rule: {
    marginTop: 10,
    height: 1,
    backgroundColor: COLORS.ochre,
    opacity: 0.5,
    width: '100%',
  },
  scoreBlock: {
    marginTop: 40,
    alignItems: 'center',
  },
  scoreNumber: {
    fontFamily: 'Fraunces',
    fontWeight: 600,
    fontSize: 96,
    color: COLORS.ink,
  },
  scoreMeta: {
    marginTop: 6,
    fontSize: 10,
    letterSpacing: 1,
    textTransform: 'uppercase',
    color: COLORS.moss,
  },
  line: {
    marginTop: 26,
    height: 1,
    backgroundColor: COLORS.bone,
    width: 360,
    position: 'relative',
    alignSelf: 'center',
  },
  marker: {
    position: 'absolute',
    top: -3,
    width: 1,
    height: 7,
    backgroundColor: COLORS.forest,
  },
  axisRow: {
    width: 360,
    alignSelf: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 6,
    fontSize: 8,
    color: COLORS.moss,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  sectionTitle: {
    fontSize: 9,
    letterSpacing: 2,
    textTransform: 'uppercase',
    color: COLORS.moss,
    marginTop: 32,
  },
  criterionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
    paddingBottom: 6,
    borderBottomWidth: 0.5,
    borderBottomColor: COLORS.bone,
  },
  criterionLabel: {
    flex: 1,
    fontSize: 11,
  },
  criterionScore: {
    fontFamily: 'Fraunces',
    fontSize: 12,
  },
  footer: {
    position: 'absolute',
    bottom: 32,
    left: 48,
    right: 48,
    fontSize: 8,
    color: COLORS.moss,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    borderTopWidth: 0.5,
    borderTopColor: COLORS.bone,
    paddingTop: 8,
  },
  historyText: {
    marginTop: 8,
    fontSize: 10,
  },
});

type PdfProps = {
  firstName: string | null;
  score: number;
  level: string;
  breakdown: Record<CriterionKey, { score: number; weight: number }>;
  recommendations: Array<{ message: string }>;
  history: Array<{ score: number; date: string }>;
  periodLabel: string;
};

function NefPdf({ firstName, score, level, breakdown, recommendations, history, periodLabel }: PdfProps) {
  const markerLeft = (Math.max(0, Math.min(1000, score)) / 1000) * 360;
  const minScore = history.length > 0 ? Math.min(...history.map((h) => h.score)) : score;
  const maxScore = history.length > 0 ? Math.max(...history.map((h) => h.score)) : score;

  return createElement(
    Document,
    {},
    createElement(
      Page,
      { size: 'A4', style: styles.page },
      createElement(Text, { style: styles.wordmark }, 'Monétika'),
      createElement(Text, { style: [styles.overline, { marginTop: 24 }] }, 'Note d\u2019Évolution Financière'),
      createElement(
        Text,
        { style: styles.title },
        firstName ? `Rapport de ${firstName}` : 'Votre rapport',
      ),
      createElement(View, { style: styles.rule }),

      createElement(
        View,
        { style: styles.scoreBlock },
        createElement(Text, { style: styles.scoreNumber }, String(score)),
        createElement(Text, { style: styles.scoreMeta }, `/ 1000 · ${level}`),
      ),
      createElement(
        View,
        { style: styles.line },
        createElement(View, { style: [styles.marker, { left: markerLeft }] }),
      ),
      createElement(
        View,
        { style: styles.axisRow },
        createElement(Text, {}, '0'),
        createElement(Text, {}, '500'),
        createElement(Text, {}, '1000'),
      ),

      createElement(Text, { style: styles.sectionTitle }, 'Décomposition'),
      ...(Object.keys(breakdown) as CriterionKey[]).map((k) =>
        createElement(
          View,
          { key: k, style: styles.criterionRow },
          createElement(Text, { style: styles.criterionLabel }, LABELS_FR[k]),
          createElement(Text, { style: styles.criterionScore }, `${breakdown[k].score} / 100`),
        ),
      ),

      recommendations.length > 0
        ? createElement(
            View,
            {},
            createElement(Text, { style: styles.sectionTitle }, 'Recommandations'),
            ...recommendations.map((r, i) =>
              createElement(
                Text,
                { key: i, style: { marginTop: 8, fontSize: 11, lineHeight: 1.5 } },
                `${['I', 'II', 'III'][i] ?? i + 1}. ${r.message}`,
              ),
            ),
          )
        : null,

      history.length > 0
        ? createElement(
            View,
            {},
            createElement(Text, { style: styles.sectionTitle }, 'Historique 12 mois'),
            createElement(
              Text,
              { style: styles.historyText },
              `${history.length} relevés · min ${minScore} · max ${maxScore}`,
            ),
          )
        : null,

      createElement(
        Text,
        { style: styles.footer },
        `Monétika · ${periodLabel} · Document confidentiel`,
      ),
    ),
  );
}

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return new NextResponse('Unauthorized', { status: 401 });

  const userRow = await prisma.user.findUniqueOrThrow({
    where: { id: session.user.id },
    select: { firstName: true },
  });
  const [nef, history] = await Promise.all([
    getLatestOrComputeNef(session.user.id),
    getNefHistory(session.user.id, 12),
  ]);

  const periodLabel = new Intl.DateTimeFormat('fr-FR', { month: 'long', year: 'numeric' }).format(
    nef.computedAt,
  );

  // NefPdf renvoie déjà un <Document/> — on l'appelle directement pour satisfaire le typage de renderToStream.
  const doc = NefPdf({
    firstName: userRow.firstName,
    score: nef.score,
    level: nef.level,
    breakdown: nef.breakdown,
    recommendations: nef.recommendations,
    history: history.map((h) => ({ score: h.score, date: h.computedAt.toISOString() })),
    periodLabel,
  });
  const stream = await renderToStream(doc);

  const chunks: Uint8Array[] = [];
  for await (const chunk of stream as unknown as AsyncIterable<Buffer>) {
    chunks.push(new Uint8Array(chunk));
  }
  const buffer = Buffer.concat(chunks);

  return new NextResponse(buffer, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="monetika-nef-${Date.now()}.pdf"`,
      'Cache-Control': 'no-store',
    },
  });
}
