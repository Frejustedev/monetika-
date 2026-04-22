import { NextResponse } from 'next/server';
import { Document, Page, Text, View, StyleSheet, Font, renderToStream } from '@react-pdf/renderer';
import { createElement } from 'react';
import path from 'node:path';
import { auth } from '@/auth';
import { getMonthSummary, getYearSummary } from '@/lib/db/queries/insights';

export const dynamic = 'force-dynamic';

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

const COLORS = {
  ink: '#17160F',
  paper: '#F5F1E8',
  forest: '#1F4D3F',
  ochre: '#C89A3C',
  bone: '#D9D2BF',
  moss: '#5B7A5E',
  terracotta: '#B8552D',
};

const styles = StyleSheet.create({
  page: { backgroundColor: COLORS.paper, color: COLORS.ink, padding: 40, fontFamily: 'Instrument Sans', fontSize: 10 },
  wordmark: { fontFamily: 'Fraunces', fontStyle: 'italic', fontSize: 16, color: COLORS.forest },
  title: { fontFamily: 'Fraunces', fontWeight: 600, fontSize: 24, marginTop: 14 },
  rule: { marginTop: 8, height: 1, backgroundColor: COLORS.ochre, opacity: 0.5, width: '100%' },
  sectionTitle: { fontSize: 9, letterSpacing: 2, textTransform: 'uppercase', color: COLORS.moss, marginTop: 20 },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 6,
    paddingBottom: 4,
    borderBottomWidth: 0.5,
    borderBottomColor: COLORS.bone,
  },
  big: { fontFamily: 'Fraunces', fontWeight: 600, fontSize: 22, marginTop: 4 },
  footer: {
    position: 'absolute', bottom: 24, left: 40, right: 40, fontSize: 8, color: COLORS.moss,
    letterSpacing: 1.5, textTransform: 'uppercase', borderTopWidth: 0.5, borderTopColor: COLORS.bone, paddingTop: 6,
  },
});

function formatAmount(v: number, currency: string): string {
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency, maximumFractionDigits: 0 }).format(v);
}

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return new NextResponse('Unauthorized', { status: 401 });

  const url = new URL(req.url);
  const view = url.searchParams.get('view') === 'year' ? 'year' : 'month';
  const format = url.searchParams.get('format') === 'pdf' ? 'pdf' : 'csv';
  const year = Number(url.searchParams.get('year')) || new Date().getFullYear();
  const month = Number(url.searchParams.get('month'));

  if (view === 'month' && format === 'csv') {
    return exportMonthCsv(session.user.id, year, Number.isFinite(month) ? month : new Date().getMonth());
  }
  if (view === 'year' && format === 'csv') {
    return exportYearCsv(session.user.id, year);
  }
  if (view === 'month' && format === 'pdf') {
    return exportMonthPdf(session.user.id, year, Number.isFinite(month) ? month : new Date().getMonth());
  }
  return exportYearPdf(session.user.id, year);
}

async function exportMonthCsv(userId: string, year: number, month: number) {
  const summary = await getMonthSummary(userId, year, month, { compareToPrevious: true });
  const rows: Array<Array<string | number>> = [
    ['Section', 'Libellé', 'Montant', 'Devise', 'Part (%)'],
    ['Total', 'Revenus', summary.income, summary.currency, ''],
    ['Total', 'Dépenses', summary.expense, summary.currency, ''],
    ['Total', 'Net', summary.net, summary.currency, ''],
    ['Total', 'Taux épargne', `${Math.round(summary.savingsRate * 100)}%`, '', ''],
  ];
  for (const s of summary.incomeBySource) {
    rows.push(['Revenus', s.label, s.amount, summary.currency, Math.round(s.share * 100)]);
  }
  for (const c of summary.expenseByCategory) {
    rows.push(['Dépenses', c.label, c.amount, summary.currency, Math.round(c.share * 100)]);
  }
  const csv = rows.map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n');
  return csvResponse(csv, `monetika-insights-${year}-${String(month + 1).padStart(2, '0')}`);
}

async function exportYearCsv(userId: string, year: number) {
  const summary = await getYearSummary(userId, year);
  const rows: Array<Array<string | number>> = [['Mois', 'Revenus', 'Dépenses', 'Devise']];
  for (const m of summary.byMonth) {
    rows.push([m.month + 1, m.income, m.expense, summary.currency]);
  }
  rows.push([]);
  rows.push(['Total année', summary.totalIncome, summary.totalExpense, summary.currency]);
  rows.push([]);
  rows.push(['Catégorie', 'Total', 'Part (%)', '']);
  for (const c of summary.topExpenseCategories) {
    rows.push([c.label, c.amount, Math.round(c.share * 100), '']);
  }
  const csv = rows.map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n');
  return csvResponse(csv, `monetika-insights-${year}`);
}

function csvResponse(csv: string, name: string) {
  return new NextResponse(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${name}.csv"`,
      'Cache-Control': 'no-store',
    },
  });
}

async function exportMonthPdf(userId: string, year: number, month: number) {
  const summary = await getMonthSummary(userId, year, month, { compareToPrevious: true });
  const title = new Intl.DateTimeFormat('fr-FR', { month: 'long', year: 'numeric' }).format(new Date(year, month, 1));

  const doc = createElement(
    Document,
    {},
    createElement(
      Page,
      { size: 'A4', style: styles.page },
      createElement(Text, { style: styles.wordmark }, 'Monétika'),
      createElement(Text, { style: styles.title }, `Récapitulatif · ${title}`),
      createElement(View, { style: styles.rule }),

      createElement(Text, { style: styles.sectionTitle }, 'Totaux'),
      createElement(
        View,
        { style: styles.row },
        createElement(Text, {}, 'Revenus'),
        createElement(Text, { style: styles.big }, formatAmount(summary.income, summary.currency)),
      ),
      createElement(
        View,
        { style: styles.row },
        createElement(Text, {}, 'Dépenses'),
        createElement(Text, { style: styles.big }, formatAmount(summary.expense, summary.currency)),
      ),
      createElement(
        View,
        { style: styles.row },
        createElement(Text, {}, 'Net'),
        createElement(Text, { style: styles.big }, formatAmount(summary.net, summary.currency)),
      ),
      createElement(
        View,
        { style: styles.row },
        createElement(Text, {}, "Taux d'épargne"),
        createElement(Text, { style: styles.big }, `${Math.round(summary.savingsRate * 100)}%`),
      ),

      createElement(Text, { style: styles.sectionTitle }, 'Dépenses par catégorie'),
      ...summary.expenseByCategory.slice(0, 12).map((c, i) =>
        createElement(
          View,
          { key: i, style: styles.row },
          createElement(Text, { style: { flex: 1 } }, `${c.label} · ${Math.round(c.share * 100)}%`),
          createElement(Text, {}, formatAmount(c.amount, summary.currency)),
        ),
      ),

      createElement(Text, { style: styles.footer }, `Monétika · ${title} · Document confidentiel`),
    ),
  );

  const stream = await renderToStream(doc);
  const chunks: Uint8Array[] = [];
  for await (const chunk of stream as unknown as AsyncIterable<Buffer>) chunks.push(new Uint8Array(chunk));
  return new NextResponse(Buffer.concat(chunks), {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="monetika-insights-${year}-${String(month + 1).padStart(2, '0')}.pdf"`,
      'Cache-Control': 'no-store',
    },
  });
}

async function exportYearPdf(userId: string, year: number) {
  const summary = await getYearSummary(userId, year);

  const doc = createElement(
    Document,
    {},
    createElement(
      Page,
      { size: 'A4', style: styles.page },
      createElement(Text, { style: styles.wordmark }, 'Monétika'),
      createElement(Text, { style: styles.title }, `Récapitulatif · ${year}`),
      createElement(View, { style: styles.rule }),

      createElement(Text, { style: styles.sectionTitle }, 'Totaux année'),
      createElement(
        View,
        { style: styles.row },
        createElement(Text, {}, 'Revenus'),
        createElement(Text, { style: styles.big }, formatAmount(summary.totalIncome, summary.currency)),
      ),
      createElement(
        View,
        { style: styles.row },
        createElement(Text, {}, 'Dépenses'),
        createElement(Text, { style: styles.big }, formatAmount(summary.totalExpense, summary.currency)),
      ),

      createElement(Text, { style: styles.sectionTitle }, 'Top catégories'),
      ...summary.topExpenseCategories.map((c, i) =>
        createElement(
          View,
          { key: i, style: styles.row },
          createElement(Text, { style: { flex: 1 } }, c.label),
          createElement(Text, {}, formatAmount(c.amount, summary.currency)),
        ),
      ),

      createElement(Text, { style: styles.sectionTitle }, 'Répartition mensuelle'),
      ...summary.byMonth.map((m, i) =>
        createElement(
          View,
          { key: i, style: styles.row },
          createElement(Text, { style: { flex: 1 } }, `${m.month + 1}/${year}`),
          createElement(
            Text,
            {},
            `${formatAmount(m.income, summary.currency)} · -${formatAmount(m.expense, summary.currency)}`,
          ),
        ),
      ),

      createElement(Text, { style: styles.footer }, `Monétika · ${year} · Document confidentiel`),
    ),
  );

  const stream = await renderToStream(doc);
  const chunks: Uint8Array[] = [];
  for await (const chunk of stream as unknown as AsyncIterable<Buffer>) chunks.push(new Uint8Array(chunk));
  return new NextResponse(Buffer.concat(chunks), {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="monetika-insights-${year}.pdf"`,
      'Cache-Control': 'no-store',
    },
  });
}
